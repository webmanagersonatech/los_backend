import Joi from "joi";

export const createMeetingSchema =
  Joi.object({
    // MEETING TITLE
    meetingTitle: Joi.string()
      .trim()
      .required(),

    // DESCRIPTION
    description: Joi.string()
      .allow("")
      .optional(),

    // ASSIGNED TEAMS
    assignToTeamIds: Joi.array()
      .items(Joi.string())
      .min(1)
      .required(),

    // MEETING DATE & TIME
    dateTime: Joi.date()
      .required(),
    // NOTES
    notes: Joi.string()
      .allow("")
      .optional(),

    // STATUS
    status: Joi.string()
      .valid("pending", "in-progress", "completed")
      .default("pending"),


    // OPTIONAL RE-MEETINGS DURING CREATE
    reMeetings: Joi.array()
      .items(
        Joi.object({
          dateTime: Joi.date()
            .required(),

          points: Joi.array()
            .items(
              Joi.object({
                description:
                  Joi.string()
                    .required(),

                completed:
                  Joi.boolean()
                    .default(false),
              })
            )
            .default([]),
        })
      )
      .default([]),
  });