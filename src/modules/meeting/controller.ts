import { Request, Response } from "express";
import Meeting from "./model";
import Team from "../teams/model";
import { AuthRequest } from "../../middlewares/auth";
import twilio from "twilio";
import { createMeetingSchema } from "./meeting.sanitize";

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
    await client.messages.create({
      body: message,
      from: TWILIO_WHATSAPP_NUMBER,
      to: `whatsapp:+91${to}`,
    });
  } catch (err) {
    console.error(err);
  }
};
export const createMeeting = async (
  req: AuthRequest,
  res: Response
) => {

  // VALIDATION
  const { error, value } =
    createMeetingSchema.validate(
      req.body
    );

  if (error) {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }

  try {
    const createdBy = req.user?.id;

    if (!createdBy) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    const meeting = await Meeting.create({
      ...value,
      createdBy,
    });

    const teams = await Team.find({
      teamId: {
        $in: value.assignToTeamIds,
      },
    }).populate({
      path: "teamLead",
      select:
        "fullName phone email teamMemberId",
    });

    for (const team of teams) {

      const phone =
        (team as any)?.teamLead?.phone;

      if (!phone) continue;

      await sendWhatsAppMessage(
        phone,
        `📅 NEW MEETING

Hello ${(team as any).teamLead.fullName},

A new meeting has been scheduled.

Meeting :
${meeting.meetingTitle}

Date :
${new Date(
          meeting.dateTime
        ).toLocaleString()}

Description :
${meeting.description}

Leadership Operations System`
      );
    }

    return res.status(201).json({
      success: true,
      message:
        "Meeting created successfully",
      data: meeting,
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

//
// UPDATE MEETING
//
export const updateMeeting = async (
  req: AuthRequest,
  res: Response
) => {
  try {
    const existingMeeting =
      await Meeting.findById(
        req.params.id
      );

    if (!existingMeeting) {
      return res.status(404).json({
        success: false,
        message:
          "Meeting not found",
      });
    }

    // Track changes
    const oldTeamIds = existingMeeting.assignToTeamIds;
    const oldDateTime = existingMeeting.dateTime;
    const oldMeetingTitle = existingMeeting.meetingTitle;
    const oldDescription = existingMeeting.description;

    const newTeamIds = req.body.assignToTeamIds || [];
    const newDateTime = req.body.dateTime;
    const newDescription = req.body.description;

    // Find added and removed teams
    const addedTeamIds = newTeamIds.filter(
      (id: string) => !oldTeamIds.includes(id)
    );

    const removedTeamIds = oldTeamIds.filter(
      (id: string) => !newTeamIds.includes(id)
    );

    // Check if date changed
    const dateChanged = newDateTime && new Date(oldDateTime).toString() !== new Date(newDateTime).toString();

    // Update meeting
    const meeting =
      await Meeting.findByIdAndUpdate(
        req.params.id,
        req.body,
        {
          new: true,
        }
      );

    // Get teams that need notification
    const teamsToNotify: any[] = [];

    // Add newly added teams
    if (addedTeamIds.length > 0) {
      const addedTeams = await Team.find({
        teamId: { $in: addedTeamIds },
      }).populate({
        path: "teamLead",
        select: "fullName phone",
      });
      teamsToNotify.push(...addedTeams);
    }

    // If date changed, notify ALL assigned teams (both old and new)
    if (dateChanged) {
      const allTeamIds = [...new Set([...oldTeamIds, ...newTeamIds])];
      const allTeams = await Team.find({
        teamId: { $in: allTeamIds },
      }).populate({
        path: "teamLead",
        select: "fullName phone",
      });

      // Add all teams that aren't already in teamsToNotify
      for (const team of allTeams) {
        if (!teamsToNotify.some(t => t.teamId === team.teamId)) {
          teamsToNotify.push(team);
        }
      }
    }

    // Send WhatsApp notifications
    for (const team of teamsToNotify) {
      const phone = (team as any)?.teamLead?.phone;
      const fullName = (team as any)?.teamLead?.fullName;

      if (!phone) continue;

      let message = "";

      // If date changed
      if (dateChanged) {
        message = `📅 MEETING UPDATED - DATE CHANGED\n\n`;
        message += `Hello ${fullName},\n\n`;
        message += `Meeting: ${meeting?.meetingTitle}\n\n`;
        message += `📌 Old Date & Time: ${new Date(oldDateTime).toLocaleString()}\n`;
        message += `📌 New Date & Time: ${new Date(newDateTime).toLocaleString()}\n\n`;

        if (newDescription && newDescription !== oldDescription) {
          message += `📝 Description updated.\n\n`;
        }

        message += `Please update your calendar accordingly.\n\n`;
        message += `Leadership Operations System`;
      }
      // If only team added (no date change)
      else if (addedTeamIds.includes((team as any).teamId) && !dateChanged) {
        message = `📅 MEETING ASSIGNED\n\n`;
        message += `Hello ${fullName},\n\n`;
        message += `You have been assigned to a meeting.\n\n`;
        message += `Meeting: ${meeting?.meetingTitle}\n`;
        message += `Date: ${new Date(meeting!.dateTime).toLocaleString()}\n`;
        message += `Description: ${meeting?.description || "No description"}\n\n`;
        message += `Leadership Operations System`;
      }

      if (message) {
        await sendWhatsAppMessage(phone, message);
      }
    }

    // If teams were removed, send notification to removed teams (only if date didn't change)
    if (removedTeamIds.length > 0 && !dateChanged) {
      const removedTeams = await Team.find({
        teamId: { $in: removedTeamIds },
      }).populate({
        path: "teamLead",
        select: "fullName phone",
      });

      for (const team of removedTeams) {
        const phone = (team as any)?.teamLead?.phone;
        const fullName = (team as any)?.teamLead?.fullName;

        if (!phone) continue;

        const message = `📅 MEETING UPDATE\n\n` +
          `Hello ${fullName},\n\n` +
          `You have been removed from the meeting:\n\n` +
          `Meeting: ${meeting?.meetingTitle}\n` +
          `Date: ${new Date(meeting!.dateTime).toLocaleString()}\n\n` +
          `Leadership Operations System`;

        await sendWhatsAppMessage(phone, message);
      }
    }

    return res.status(200).json({
      success: true,
      data: meeting,
    });
  } catch (err: any) {
    console.error(err);
    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

//
// ADD RE-MEETING
//
export const addReMeeting = async (
  req: AuthRequest,
  res: Response
) => {
  try {
    const {
      dateTime,
      description,
      completed
    } = req.body;

    const meeting = await Meeting.findById(req.params.id);

    if (!meeting) {
      return res.status(404).json({
        success: false,
        message: "Meeting not found",
      });
    }

    // Push with direct fields - no points array
    meeting.reMeetings.push({
      dateTime,
      description,
      completed: completed || false
    });

    await meeting.save();

    const teams = await Team.find({
      teamId: {
        $in: meeting.assignToTeamIds,
      },
    }).populate({
      path: "teamLead",
      select: "fullName phone",
    });

    for (const team of teams) {
      const phone = (team as any)?.teamLead?.phone;

      if (!phone) continue;

      await sendWhatsAppMessage(
        phone,
        `🔁 RE-MEETING

Meeting: ${meeting.meetingTitle}

Date: ${new Date(dateTime).toLocaleString()}

Description: ${description}`
      );
    }

    return res.status(200).json({
      success: true,
      data: meeting,
    });
  } catch (err: any) {
    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};
// Add this to your controller.ts

export const getReMeetingById = async (
  req: Request,
  res: Response
) => {
  try {
    const { meetingId, reMeetingId } = req.params;

    if (!meetingId || !reMeetingId) {
      return res.status(400).json({
        success: false,
        message: "Meeting ID and Re-meeting ID are required",
      });
    }

    // Find the meeting
    const meeting = await Meeting.findById(meetingId);

    if (!meeting) {
      return res.status(404).json({
        success: false,
        message: "Meeting not found",
      });
    }

    // Find the specific re-meeting by its _id
    const reMeeting = meeting.reMeetings.find(
      (rm) => rm._id.toString() === reMeetingId
    );

    if (!reMeeting) {
      return res.status(404).json({
        success: false,
        message: "Re-meeting not found",
      });
    }

    return res.status(200).json({
      success: true,
      data: {
        meetingId: meeting._id,
        meetingTitle: meeting.meetingTitle,
        reMeeting: reMeeting,
      },
    });
  } catch (err: any) {
    console.error(err);
    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};
//
// UPDATE RE-MEETING POINT STATUS
//
export const updateReMeetingPointStatus = async (
  req: Request,
  res: Response
) => {
  try {
    const {
      reMeetingIndex,
      completed,
    } = req.body;

    const meeting = await Meeting.findById(req.params.id);

    if (!meeting) {
      return res.status(404).json({
        success: false,
        message: "Meeting not found",
      });
    }

    const reMeeting = meeting.reMeetings[reMeetingIndex];

    if (!reMeeting) {
      return res.status(404).json({
        success: false,
        message: "Re-meeting not found",
      });
    }

    // Update completed status directly on the re-meeting
    reMeeting.completed = completed;

    await meeting.save();

    return res.status(200).json({
      success: true,
      message: "Re-meeting status updated successfully",
      data: meeting,
    });
  } catch (err: any) {
    console.error(err);
    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};


//
// UPDATE RE-MEETING BY ID (WITH WHATSAPP NOTIFICATION)
//
export const updateReMeetingById = async (
  req: Request,
  res: Response
) => {
  try {
    const { meetingId, reMeetingId } = req.params;
    const { dateTime, description, completed, notes } = req.body;

    if (!meetingId || !reMeetingId) {
      return res.status(400).json({
        success: false,
        message: "Meeting ID and Re-meeting ID are required",
      });
    }

    const meeting = await Meeting.findById(meetingId);

    if (!meeting) {
      return res.status(404).json({
        success: false,
        message: "Meeting not found",
      });
    }

    const reMeetingIndex = meeting.reMeetings.findIndex(
      (rm) => rm._id.toString() === reMeetingId
    );

    if (reMeetingIndex === -1) {
      return res.status(404).json({
        success: false,
        message: "Re-meeting not found",
      });
    }

    // Store old dateTime for comparison
    const oldDateTime = meeting.reMeetings[reMeetingIndex].dateTime;
    const oldDescription = meeting.reMeetings[reMeetingIndex].description;
    const oldCompleted = meeting.reMeetings[reMeetingIndex].completed;

    // Track what changed
    let dateChanged = false;
    let descriptionChanged = false;
    let statusChanged = false;

    // Update fields if provided
    if (dateTime !== undefined) {
      meeting.reMeetings[reMeetingIndex].dateTime = dateTime;
      dateChanged = oldDateTime.toString() !== new Date(dateTime).toString();
    }
    if (description !== undefined) {
      meeting.reMeetings[reMeetingIndex].description = description;
      descriptionChanged = oldDescription !== description;
    }
    if (completed !== undefined) {
      meeting.reMeetings[reMeetingIndex].completed = completed;
      statusChanged = oldCompleted !== completed;
    }
    if (notes !== undefined) {
      meeting.reMeetings[reMeetingIndex].notes = notes;
    }

    await meeting.save();

    // Send WhatsApp notification if date/time changed
    if (dateChanged) {
      const teams = await Team.find({
        teamId: {
          $in: meeting.assignToTeamIds,
        },
      }).populate({
        path: "teamLead",
        select: "fullName phone",
      });

      for (const team of teams) {
        const phone = (team as any)?.teamLead?.phone;

        if (!phone) continue;

        let message = `📅 RE-MEETING DATE/UPDATED\n\n`;
        message += `Meeting: ${meeting.meetingTitle}\n\n`;
        message += `Session has been rescheduled!\n\n`;
        message += `📌 Old Date & Time: ${new Date(oldDateTime).toLocaleString()}\n`;
        message += `📌 New Date & Time: ${new Date(dateTime).toLocaleString()}\n`;

        if (descriptionChanged) {
          message += `\n📝 Description updated.\n`;
        }

        if (statusChanged) {
          message += `\n✅ Status changed to: ${completed ? "Completed" : "Pending"}\n`;
        }

        message += `\n\nLeadership Operations System`;

        await sendWhatsAppMessage(phone, message);
      }
    } else if (descriptionChanged || statusChanged) {
      // Send notification for other changes if date didn't change
      const teams = await Team.find({
        teamId: {
          $in: meeting.assignToTeamIds,
        },
      }).populate({
        path: "teamLead",
        select: "fullName phone",
      });

      for (const team of teams) {
        const phone = (team as any)?.teamLead?.phone;

        if (!phone) continue;

        let message = `📝 RE-MEETING UPDATED\n\n`;
        message += `Meeting: ${meeting.meetingTitle}\n\n`;

        if (descriptionChanged) {
          message += `📌 Old Description: ${oldDescription}\n`;
          message += `📌 New Description: ${description}\n\n`;
        }

        if (statusChanged) {
          message += `📌 Status changed to: ${completed ? "Completed ✅" : "Pending ⏳"}\n\n`;
        }

        message += `Date & Time: ${new Date(meeting.reMeetings[reMeetingIndex].dateTime).toLocaleString()}\n\n`;
        message += `Leadership Operations System`;

        await sendWhatsAppMessage(phone, message);
      }
    }

    return res.status(200).json({
      success: true,
      message: "Re-meeting updated successfully",
      data: meeting.reMeetings[reMeetingIndex],
    });
  } catch (err: any) {
    console.error(err);
    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};
//
// GET SINGLE MEETING
//
export const getMeeting = async (
  req: Request,
  res: Response
) => {
  try {
    const meeting =
      await Meeting.findById(
        req.params.id
      )
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

    if (!meeting) {
      return res.status(404).json({
        success: false,
        message: "Meeting not found",
      });
    }

    return res.status(200).json({
      success: true,
      data: meeting,
    });
  } catch (err: any) {
    console.error(err);

    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

//
// LIST MEETINGS
//
export const listMeetings = async (
  req: Request,
  res: Response
) => {
  try {
    const page =
      Number(req.query.page) || 1;

    const limit =
      Number(req.query.limit) || 10;

    const search =
      (req.query.search as string) ||
      "";

    const query: any = {};

    if (search.trim()) {
      query.$or = [
        {
          meetingTitle: {
            $regex: search,
            $options: "i",
          },
        },
        {
          description: {
            $regex: search,
            $options: "i",
          },
        },
        {
          meetingId: {
            $regex: search,
            $options: "i",
          },
        },
      ];
    }

    const meetings =
      await (Meeting as any).paginate(
        query,
        {
          page,
          limit,
          sort: {
            createdAt: -1,
          },
          populate: [
           
            {
              path: "work",
              select:
                "workId workTitle priority status deadline",
            },
          ],

        }
      );

    return res.status(200).json({
      success: true,
      meetings,
    });
  } catch (err: any) {
    console.error(err);

    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

//
// GET ALL MEETINGS
//
export const getAllMeetings =
  async (
    req: Request,
    res: Response
  ) => {
    try {
      const meetings =
        await Meeting.find({})
          .select(
            "meetingId meetingTitle dateTime assignToTeamIds"
          )
          .sort({
            createdAt: -1,
          });

      return res.status(200).json({
        success: true,
        data: meetings,
      });
    } catch (err: any) {
      console.error(err);

      return res.status(500).json({
        success: false,
        message: err.message,
      });
    }
  };

//
// DELETE MEETING
//
export const deleteMeeting =
  async (
    req: AuthRequest,
    res: Response
  ) => {
    try {
      const meeting =
        await Meeting.findByIdAndDelete(
          req.params.id
        );

      if (!meeting) {
        return res.status(404).json({
          success: false,
          message:
            "Meeting not found",
        });
      }

      return res.status(200).json({
        success: true,
        message:
          "Meeting deleted successfully",
      });
    } catch (err: any) {
      console.error(err);

      return res.status(500).json({
        success: false,
        message: err.message,
      });
    }
  };