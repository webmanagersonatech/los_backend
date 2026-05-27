import { Router } from "express";

import {
  createWork,
  listWorks,
  getWork,
  updateWork,
  deleteWork,
  getAllWorks,
  updateWorkStatus
} from "./controller";

import { protect } from "../../middlewares/auth";

const router = Router();

// LIST WORKS
router.get("/", protect, listWorks);

// GET ALL WORKS
router.get("/all", protect, getAllWorks);
router.put(
  "/:id/status",
  protect,
  updateWorkStatus
);
// CREATE WORK
router.post("/", protect, createWork);

// GET SINGLE WORK
router.get("/:id", protect, getWork);

// UPDATE WORK
router.put("/:id", protect, updateWork);

// DELETE WORK
router.delete("/:id", protect, deleteWork);

export default router;