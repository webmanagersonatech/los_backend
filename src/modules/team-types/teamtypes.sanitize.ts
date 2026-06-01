import Joi from "joi";

export const createTeamTypeSchema = Joi.object({
  name: Joi.string().required(),

  status: Joi.string()
    .valid("active", "inactive")
    .default("active"),
});