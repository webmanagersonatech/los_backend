import { Router } from "express";
import {
  createTeamType,
  getAllTeamTypes,
  getTeamType,
  updateTeamType,
  deleteTeamType,
} from "./controller";

import { protect } from "../../middlewares/auth";

const router = Router();

// GET ALL TEAM TYPES
router.get("/all", protect, getAllTeamTypes);

// CREATE TEAM TYPE
router.post("/", protect, createTeamType);

// GET SINGLE TEAM TYPE
router.get("/:id", protect, getTeamType);

// UPDATE TEAM TYPE
router.put("/:id", protect, updateTeamType);

// DELETE TEAM TYPE
router.delete("/:id", protect, deleteTeamType);

export default router;