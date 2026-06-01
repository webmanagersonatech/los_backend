import Joi from "joi";

export const createTeamMemberSchema = Joi.object({
  fullName: Joi.string().required(),

  email: Joi.string()
    .email()
    .optional().allow(""),

  phone: Joi.string().required(),

  role: Joi.string().optional().allow(""),

  photoBase64: Joi.string().optional().allow(""),

  status: Joi.string()
    .valid("active", "inactive")
    .default("active"),
});