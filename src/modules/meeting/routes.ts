import { Router } from "express";

import {
  createMeeting,
  updateMeeting,
  deleteMeeting,
  getMeeting,
  listMeetings,
  getAllMeetings,
  addReMeeting,
  updateReMeetingPointStatus,
  updateReMeetingById,
  getReMeetingById,
} from "./controller";

import { protect } from "../../middlewares/auth";

const router = Router();

router.get("/", protect, listMeetings);

router.get("/all", protect, getAllMeetings);

router.post("/", protect, createMeeting);

router.get("/:id", protect, getMeeting);

router.put("/:id", protect, updateMeeting);

router.delete("/:id", protect, deleteMeeting);

router.post(
  "/:id/re-meeting",
  protect,
  addReMeeting
);
router.patch(
  "/:id/re-meeting/point-status",
  protect,
  updateReMeetingPointStatus
);

router.put(
  "/:meetingId/re-meetings/:reMeetingId",
  protect,
  updateReMeetingById
);

router.get(
  "/:meetingId/re-meetings/:reMeetingId",
  protect,
  getReMeetingById
);

export default router;