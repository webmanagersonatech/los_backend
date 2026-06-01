import { Request, Response } from "express";
import { AuthRequest } from "../../middlewares/auth";
import TeamType from "./model";
import { createTeamTypeSchema } from "./teamtypes.sanitize";

// CREATE TEAM TYPE
export const createTeamType = async (
  req: AuthRequest,
  res: Response
) => {
  const { error, value } =
    createTeamTypeSchema.validate(req.body);

  if (error) {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }

  try {
    const createdBy = req.user?.id;

    const teamType = await TeamType.create({
      ...value,
      createdBy,
    });

    return res.status(201).json({
      success: true,
      message: "Team type created successfully",
      data: teamType,
    });
  } catch (err: any) {
    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

export const getAllTeamTypes = async (
  req: Request,
  res: Response
) => {
  try {
    const teamTypes = await TeamType.find({
      status: "active",
    })
      .select("_id name")
      .sort({ name: 1 });

    return res.status(200).json({
      success: true,
      data: teamTypes,
    });
  } catch (err: any) {
    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};
export const getTeamType = async (
  req: Request,
  res: Response
) => {
  try {
    const teamType =
      await TeamType.findById(req.params.id);

    if (!teamType) {
      return res.status(404).json({
        success: false,
        message: "Team type not found",
      });
    }

    return res.status(200).json({
      success: true,
      data: teamType,
    });
  } catch (err: any) {
    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};
export const updateTeamType = async (
  req: AuthRequest,
  res: Response
) => {
  try {
    const teamType =
      await TeamType.findByIdAndUpdate(
        req.params.id,
        req.body,
        { new: true }
      );

    if (!teamType) {
      return res.status(404).json({
        success: false,
        message: "Team type not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Team type updated successfully",
      data: teamType,
    });
  } catch (err: any) {
    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

export const deleteTeamType = async (
  req: AuthRequest,
  res: Response
) => {
  try {
    const teamType =
      await TeamType.findByIdAndDelete(
        req.params.id
      );

    if (!teamType) {
      return res.status(404).json({
        success: false,
        message: "Team type not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Team type deleted successfully",
    });
  } catch (err: any) {
    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};