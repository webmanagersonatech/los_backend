import { Request, Response } from "express";
import TeamMember from "./model";
import { AuthRequest } from "../../middlewares/auth";
import { createTeamMemberSchema } from "./teammember.sanitize";



// CREATE TEAM MEMBER
export const createTeamMember = async (
  req: AuthRequest,
  res: Response
) => {
  // VALIDATION
  const { error, value } = createTeamMemberSchema.validate(
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
        message: "Not authorized",
      });
    }

    const teamMember = await TeamMember.create({
      ...value,
      createdBy,
    });

    return res.status(201).json({
      success: true,
      message: "Team member created successfully",
      data: teamMember,
    });
  } catch (err: any) {
    console.error(err);

    return res.status(500).json({
      success: false,
      message: err.message || "Server error",
    });
  }
};
// LIST TEAM MEMBERS
export const listTeamMembers = async (
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
          fullName: {
            $regex: search.trim(),
            $options: "i",
          },
        },
        {
          email: {
            $regex: search.trim(),
            $options: "i",
          },
        },
        {
          role: {
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

    const teamMembers = await (TeamMember as any).paginate(query, {
      page,
      limit,
      sort: { createdAt: -1 },
    });

    return res.status(200).json({
      success: true,
      teamMembers,
    });
  } catch (err: any) {
    console.error(err);

    return res.status(500).json({
      success: false,
      message: err.message || "Server error",
    });
  }
};


// GET ALL TEAM MEMBERS (ONLY REQUIRED FIELDS)
export const getAllTeamMembers = async (req: Request, res: Response) => {
  try {
    const teamMembers = await TeamMember.find({})
      .select("fullName phone teamMemberId email role photoBase64")
      .sort({ fullName: 1 });

    return res.status(200).json({
      success: true,
      data: teamMembers,
    });
  } catch (err: any) {
    console.error(err);

    return res.status(500).json({
      success: false,
      message: err.message || "Server error",
    });
  }
};
// GET SINGLE TEAM MEMBER
export const getTeamMember = async (
  req: Request,
  res: Response
) => {
  try {
    const teamMember = await TeamMember.findById(req.params.id);

    if (!teamMember) {
      return res.status(404).json({
        success: false,
        message: "Team member not found",
      });
    }

    return res.status(200).json({
      success: true,
      data: teamMember,
    });
  } catch (err: any) {
    console.error(err);

    return res.status(500).json({
      success: false,
      message: err.message || "Server error",
    });
  }
};

// UPDATE TEAM MEMBER
export const updateTeamMember = async (
  req: AuthRequest,
  res: Response
) => {
  try {
    const teamMember = await TeamMember.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );

    if (!teamMember) {
      return res.status(404).json({
        success: false,
        message: "Team member not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Team member updated successfully",
      data: teamMember,
    });
  } catch (err: any) {
    console.error(err);

    return res.status(500).json({
      success: false,
      message: err.message || "Server error",
    });
  }
};

// DELETE TEAM MEMBER
export const deleteTeamMember = async (
  req: AuthRequest,
  res: Response
) => {
  try {
    const teamMember = await TeamMember.findByIdAndDelete(
      req.params.id
    );

    if (!teamMember) {
      return res.status(404).json({
        success: false,
        message: "Team member not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Team member deleted successfully",
    });
  } catch (err: any) {
    console.error(err);

    return res.status(500).json({
      success: false,
      message: err.message || "Server error",
    });
  }
};