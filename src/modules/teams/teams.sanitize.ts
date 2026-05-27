import Joi from "joi";

export const createTeamSchema = Joi.object({
  teamName: Joi.string().required(),

  teamType: Joi.string().required(),

  description: Joi.string().optional(),

  teamLeadId: Joi.string().required(),

  memberIds: Joi.array()
    .items(Joi.string())
    .required(),

  status: Joi.string()
    .valid("active", "inactive")
    .default("active"),
});