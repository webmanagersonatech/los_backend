import Joi from "joi";

export const createWorkSchema = Joi.object({
  workTitle: Joi.string().required(),

  assignToTeamIds: Joi.array()
    .items(Joi.string())
    .min(1)
    .required(),

  deadline: Joi.date().required(),

  priority: Joi.string()
    .valid("low", "medium", "high")
    .default("low"),

  description: Joi.string()
    .allow("")
    .optional(),
  meetingId: Joi.string()  // Add this field
    .optional()
    .allow(null, ""),
  status: Joi.string()
    .valid(
      "pending",
      "in_progress",
      "completed",
      "on_hold",
      "cancelled"
    )
    .default("pending"),
});