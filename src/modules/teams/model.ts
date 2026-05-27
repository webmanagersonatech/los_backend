import mongoose, { Document, Schema } from "mongoose";
import { nanoid } from "nanoid";
import mongoosePaginate from "mongoose-paginate-v2";

export interface ITeam extends Document {
  teamId: string;

  teamName: string;

  teamType: string;

  description?: string;

  // STORE CUSTOM IDS
  teamLeadId: string;

  memberIds: string[];

  status: "active" | "inactive";

  createdBy: mongoose.Types.ObjectId;
}

const TeamSchema = new Schema<ITeam>(
  {
    // AUTO GENERATED TEAM ID
    teamId: {
      type: String,
      unique: true,
      required: true,
    },

    // TEAM NAME
    teamName: {
      type: String,
      required: true,
    },

    // TEAM TYPE
    teamType: {
      type: String,
      required: true,
    },

    // DESCRIPTION
    description: {
      type: String,
    },

    // STORE TEAM MEMBER IDS
    teamLeadId: {
      type: String,
      required: true,
    },

    memberIds: [
      {
        type: String,
      },
    ],

    // STATUS
    status: {
      type: String,
      enum: ["active", "inactive"],
      default: "active",
    },

    // CREATED BY
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  {
    timestamps: true,

    // IMPORTANT
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// AUTO GENERATE TEAM ID
TeamSchema.pre("validate", async function (next) {
  if (this.isNew && !this.teamId) {
    this.teamId = `TEAM-${nanoid(8).toUpperCase()}`;
  }

  next();
});


// =========================
// VIRTUAL TEAM LEAD
// =========================

TeamSchema.virtual("teamLead", {
  ref: "TeamMember",
  localField: "teamLeadId",
  foreignField: "teamMemberId",
  justOne: true,
});


// =========================
// VIRTUAL MEMBERS
// =========================

TeamSchema.virtual("members", {
  ref: "TeamMember",
  localField: "memberIds",
  foreignField: "teamMemberId",
});


// PAGINATION
TeamSchema.plugin(mongoosePaginate);

const Team = mongoose.model<
  ITeam,
  mongoose.PaginateModel<ITeam>
>("Team", TeamSchema);

export default Team;