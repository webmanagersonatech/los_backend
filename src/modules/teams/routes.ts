import { Router } from "express";

import {
  createTeam,
  listTeams,
  getTeam,
  updateTeam,
  getAllTeams,
  deleteTeam,
} from "./controller";

import { protect } from "../../middlewares/auth";

const router = Router();

// LIST TEAMS
router.get("/", protect, listTeams);

router.get("/all", protect, getAllTeams);
// CREATE TEAM
router.post("/", protect, createTeam);

// GET SINGLE TEAM
router.get("/:id", protect, getTeam);

// UPDATE TEAM
router.put("/:id", protect, updateTeam);

// DELETE TEAM
router.delete("/:id", protect, deleteTeam);

export default router;