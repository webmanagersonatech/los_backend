import Joi from "joi";

export const createTeamMemberSchema = Joi.object({
  fullName: Joi.string().required(),

  email: Joi.string()
    .email()
    .required(),

  phone: Joi.string().required(),

  role: Joi.string().required(),

  photoBase64: Joi.string().optional(),

  status: Joi.string()
    .valid("active", "inactive")
    .default("active"),
});