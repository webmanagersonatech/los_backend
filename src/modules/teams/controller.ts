import { Request, Response } from "express";
import Team from "./model";
import { createTeamSchema } from "./teams.sanitize";
import { AuthRequest } from "../../middlewares/auth";

// CREATE TEAM
export const createTeam = async (
  req: AuthRequest,
  res: Response
) => {
  const { error, value } = createTeamSchema.validate(req.body);

  if (error) {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }

  const createdBy = req.user?.id;

  if (!createdBy) {
    return res.status(401).json({
      success: false,
      message: "Not authorized",
    });
  }

  try {
    const team = await Team.create({
      ...value,
      createdBy,
    });

    return res.status(201).json({
      success: true,
      message: "Team created successfully",
      data: team,
    });
  } catch (err: any) {
    console.error(err);

    return res.status(500).json({
      success: false,
      message: err.message || "Server error",
    });
  }
};

// LIST TEAMS
export const listTeams = async (
  req: Request,
  res: Response
) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const search = (req.query.search as string) || "";
    const status = (req.query.status as string) || "all";

    const query: any = {};

    // SEARCH
    if (search.trim()) {
      query.$or = [
        {
          teamName: {
            $regex: search.trim(),
            $options: "i",
          },
        },
        {
          teamType: {
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

    const teams = await (Team as any).paginate(query, {
      page,
      limit,
      sort: { createdAt: -1 },

      populate: [
        {
          path: "teamLead",
          select: "fullName email role phone teamMemberId photoBase64",
        },
        {
          path: "members",
          select: "fullName email role phone teamMemberId photoBase64",
        },
      ],
    });

    return res.status(200).json({
      success: true,
      teams,
    });
  } catch (err: any) {
    console.error(err);

    return res.status(500).json({
      success: false,
      message: err.message || "Server error",
    });
  }
};
// GET ALL TEAMS
export const getAllTeams = async (
  req: Request,
  res: Response
) => {
  try {
    const teams = await Team.find()
      .select(
        "teamName teamType teamId teamLeadId memberIds"
      )
      .populate(
        "teamLead",
        "fullName email role phone teamMemberId photoBase64"
      )

      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      data: teams,
    });
  } catch (err: any) {
    console.error(err);

    return res.status(500).json({
      success: false,
      message: err.message || "Server error",
    });
  }
};
// GET SINGLE TEAM
export const getTeam = async (
  req: Request,
  res: Response
) => {
  try {
    const team = await Team.findById(req.params.id)
      .populate("teamLeadId", "fullName email role")
      .populate("memberIds", "fullName email role");

    if (!team) {
      return res.status(404).json({
        success: false,
        message: "Team not found",
      });
    }

    return res.status(200).json({
      success: true,
      data: team,
    });
  } catch (err: any) {
    console.error(err);

    return res.status(500).json({
      success: false,
      message: err.message || "Server error",
    });
  }
};

// UPDATE TEAM
export const updateTeam = async (
  req: AuthRequest,
  res: Response
) => {
  try {
    const team = await Team.findByIdAndUpdate(
      req.params.id,
      req.body,
      {
        new: true,
      }
    )
      .populate("teamLeadId", "fullName phone email role")
      .populate("memberIds", "fullName phone email role");

    if (!team) {
      return res.status(404).json({
        success: false,
        message: "Team not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Team updated successfully",
      data: team,
    });
  } catch (err: any) {
    console.error(err);

    return res.status(500).json({
      success: false,
      message: err.message || "Server error",
    });
  }
};

// DELETE TEAM
export const deleteTeam = async (
  req: AuthRequest,
  res: Response
) => {
  try {
    const team = await Team.findByIdAndDelete(req.params.id);

    if (!team) {
      return res.status(404).json({
        success: false,
        message: "Team not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Team deleted successfully",
    });
  } catch (err: any) {
    console.error(err);

    return res.status(500).json({
      success: false,
      message: err.message || "Server error",
    });
  }
};