import { Router } from "express";
import {
  createTeamMember,
  listTeamMembers,
  getTeamMember,
  updateTeamMember,
  deleteTeamMember,
  getAllTeamMembers,
} from "./controller";

import { protect } from "../../middlewares/auth";

const router = Router();

// LIST TEAM MEMBERS
router.get("/", protect, listTeamMembers);
router.get("/all", protect, getAllTeamMembers);
// CREATE TEAM MEMBER
router.post("/", protect, createTeamMember);

// GET SINGLE TEAM MEMBER
router.get("/:id", protect, getTeamMember);

// UPDATE TEAM MEMBER
router.put("/:id", protect, updateTeamMember);

// DELETE TEAM MEMBER
router.delete("/:id", protect, deleteTeamMember);

export default router;