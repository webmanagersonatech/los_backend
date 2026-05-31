import { Request, Response } from "express";
import Work from "./model";
import { AuthRequest } from "../../middlewares/auth";
import { createWorkSchema } from "./work.sanitize";
import Meeting from "../meeting/model";
import Team from "../teams/model";

import twilio from "twilio";

// TWILIO CONFIG DIRECTLY
const client = twilio(
  process.env.TWILIO_ACCOUNT_SID!,
  process.env.TWILIO_AUTH_TOKEN!
);

const TWILIO_WHATSAPP_NUMBER =
  "whatsapp:+14155238886";

export const sendWhatsAppMessage = async (
  to: string,
  message: string
) => {
  try {
    const response = await client.messages.create({
      body: message,
      from: TWILIO_WHATSAPP_NUMBER,
      to: `whatsapp:+91${to}`,
    });

    console.log(
      "WhatsApp sent:",
      response.sid
    );
  } catch (err) {
    console.error(
      "WhatsApp Error:",
      err
    );
  }
};
// CREATE WORK
export const createWork = async (
  req: AuthRequest,
  res: Response
) => {
  // VALIDATION
  const { error, value } =
    createWorkSchema.validate(req.body);

  if (error) {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }

  try {
    // AUTH CHECK
    const createdBy = req.user?.id;

    if (!createdBy) {
      return res.status(401).json({
        success: false,
        message: "Not authorized",
      });
    }

    // FIND TEAMS
    const teams = await Team.find({
      teamId: {
        $in: value.assignToTeamIds,
      },
    }).populate({
      path: "teamLead",
      select:
        "fullName email phone teamMemberId",
    });

    // TEAM LEAD DETAILS
    const teamLeadDetails = teams.map(
      (team: any) => ({
        teamName: team.teamName,
        teamId: team.teamId,
        teamLead: {
          fullName:
            team.teamLead?.fullName,
          email:
            team.teamLead?.email,
          phone:
            team.teamLead?.phone,
          teamMemberId:
            team.teamLead
              ?.teamMemberId,
        },
      })
    );


    // CREATE WORK
    const work = await Work.create({
      ...value,
      createdBy,
      teams: teams.map(
        (team: any) => team._id
      ),
    });

    if (value.meetingId) {
      await Meeting.findOneAndUpdate(
        { meetingId: value.meetingId },
        {
          workId: work.workId,
        },
        { new: true }
      );
    }

    // SEND WHATSAPP MESSAGE
    for (const team of teamLeadDetails) {
      const phone =
        team.teamLead.phone;

      // SKIP IF NO PHONE
      if (!phone) continue;

      const message = `
WORK ASSIGNMENT NOTIFICATION

Hello ${team.teamLead.fullName},

A new work item has been assigned to your team.

Team Name : ${team.teamName}
Work Title : ${value.workTitle}
Priority : ${value.priority}
Deadline : ${new Date(
        value.deadline
      ).toLocaleString()}
Description : ${value.description}

Please review the task and proceed accordingly.

Leadership Operations System
`;

      await sendWhatsAppMessage(
        phone,
        message
      );
    }

    return res.status(201).json({
      success: true,
      message:
        "Work created & WhatsApp sent successfully",
      data: work,
      teamLeadDetails,
    });
  } catch (err: any) {
    console.error(err);

    return res.status(500).json({
      success: false,
      message:
        err.message || "Server error",
    });
  }
};

// UPDATE WORK
export const updateWork = async (
  req: AuthRequest,
  res: Response
) => {

  try {

    const { error, value } =
      createWorkSchema.validate(
        req.body
      );

    if (error) {

      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }

    // EXISTING WORK
    const existingWork: any =
      await Work.findById(
        req.params.id
      );

    if (!existingWork) {

      return res.status(404).json({
        success: false,
        message: "Work not found",
      });
    }

    // OLD TEAM IDS
    const oldTeamIds =
      existingWork.assignToTeamIds || [];

    // NEW TEAM IDS
    const newTeamIds =
      value.assignToTeamIds || [];

    // FIND ONLY NEWLY ADDED TEAM IDS
    const addedTeamIds =
      newTeamIds.filter(
        (id: string) =>
          !oldTeamIds.includes(id)
      );

    // FETCH NEWLY ADDED TEAMS ONLY
    const addedTeams =
      await Team.find({
        teamId: {
          $in: addedTeamIds,
        },
      }).populate({
        path: "teamLead",
        select:
          "fullName email phone teamMemberId",
      });

    // UPDATE WORK
    const updatedWork =
      await Work.findByIdAndUpdate(
        req.params.id,
        {
          ...value,
          teams: addedTeams.map(
            (team: any) => team._id
          ),
        },
        { new: true }
      );

    // SEND WHATSAPP ONLY TO NEW TEAM LEADS
    for (const team of addedTeams) {

      const phone =
        (team as any)
          .teamLead?.phone;

      if (!phone) continue;

      const message = `
WORK UPDATE NOTIFICATION

Hello ${(team as any)
          .teamLead?.fullName},

A new work item has been assigned to your team.

Team Name : ${team.teamName}
Work Title : ${value.workTitle}
Priority : ${value.priority}
Deadline : ${new Date(
            value.deadline
          ).toLocaleString()}
Description : ${value.description}

Please review the task and proceed accordingly.

Leadership Operations System
`;

      await sendWhatsAppMessage(
        phone,
        message
      );
    }

    return res.status(200).json({
      success: true,
      message:
        "Work updated successfully",
      data: updatedWork,
      newlyAssignedTeams:
        addedTeams,
    });

  } catch (err: any) {

    console.error(err);

    return res.status(500).json({
      success: false,
      message:
        err.message ||
        "Server error",
    });
  }
};

export const updateWorkStatus = async (
  req: AuthRequest,
  res: Response
) => {
  try {
    const { status } = req.body;

    const allowedStatuses = [
      "pending",
      "in_progress",
      "completed",
      "on_hold",
      "cancelled",
    ];

    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid status",
      });
    }

    const work: any = await Work.findById(
      req.params.id
    )
      .populate({
        path: "teams",
        populate: {
          path: "teamLead",
          select:
            "fullName email phone",
        },
      });

    if (!work) {
      return res.status(404).json({
        success: false,
        message: "Work not found",
      });
    }

    // UPDATE STATUS
    work.status = status;

    await work.save();

    // SEND WHATSAPP TO TEAM LEADS
    for (const team of work.teams) {
      const phone =
        (team as any)?.teamLead?.phone;

      if (!phone) continue;

      const message = `
WORK STATUS UPDATED

Hello ${(team as any)?.teamLead?.fullName},

Work Status has been updated.

Work Title : ${work.workTitle}
New Status : ${status.replace(
        "_",
        " "
      )}

Priority : ${work.priority}

Deadline : ${new Date(
        work.deadline
      ).toLocaleString()}

Leadership Operations System
`;

      await sendWhatsAppMessage(
        phone,
        message
      );
    }

    return res.status(200).json({
      success: true,
      message:
        "Work status updated successfully",
      data: work,
    });
  } catch (err: any) {
    console.error(err);

    return res.status(500).json({
      success: false,
      message:
        err.message || "Server Error",
    });
  }
};
// GET SINGLE WORK
export const getWork = async (
  req: Request,
  res: Response
) => {
  try {
    const work = await Work.findById(req.params.id)
      .populate({
        path: "teams",
        select:
          "teamName teamType teamLeadId teamId",
        populate: {
          path: "teamLead",
          select:
            "fullName email phone photoBase64 role teamMemberId",
        },
      });

    if (!work) {
      return res.status(404).json({
        success: false,
        message: "Work not found",
      });
    }

    return res.status(200).json({
      success: true,
      data: work,
    });
  } catch (err: any) {
    console.error(err);

    return res.status(500).json({
      success: false,
      message: err.message || "Server error",
    });
  }
};

// LIST WORKS
export const listWorks = async (
  req: Request,
  res: Response
) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const search = (req.query.search as string) || "";
    const status = (req.query.status as string) || "all";
    const priority =
      (req.query.priority as string) || "all";

    const query: any = {};

    // SEARCH
    if (search.trim()) {
      query.$or = [
        {
          workTitle: {
            $regex: search.trim(),
            $options: "i",
          },
        },
        {
          description: {
            $regex: search.trim(),
            $options: "i",
          },
        },
        {
          workId: {
            $regex: search.trim(),
            $options: "i",
          },
        },
      ];
    }

    // STATUS FILTER
    if (status !== "all") {
      query.status = status;
    }

    // PRIORITY FILTER
    if (priority !== "all") {
      query.priority = priority;
    }

    const works = await (Work as any).paginate(query, {
      page,
      limit,
      sort: { createdAt: -1 },
    });

    return res.status(200).json({
      success: true,
      works,
    });
  } catch (err: any) {
    console.error(err);

    return res.status(500).json({
      success: false,
      message: err.message || "Server error",
    });
  }
};

// GET ALL WORKS
export const getAllWorks = async (
  req: Request,
  res: Response
) => {
  try {
    const works = await Work.find({})
      .select(
        "workId workTitle status priority deadline assignToTeamIds"
      )
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      data: works,
    });
  } catch (err: any) {
    console.error(err);

    return res.status(500).json({
      success: false,
      message: err.message || "Server error",
    });
  }
};




// DELETE WORK
export const deleteWork = async (
  req: AuthRequest,
  res: Response
) => {
  try {
    const work = await Work.findByIdAndDelete(
      req.params.id
    );

    if (!work) {
      return res.status(404).json({
        success: false,
        message: "Work not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Work deleted successfully",
    });
  } catch (err: any) {
    console.error(err);

    return res.status(500).json({
      success: false,
      message: err.message || "Server error",
    });
  }
};