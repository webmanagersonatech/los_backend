import mongoose, { Document, Schema } from "mongoose";
import { nanoid } from "nanoid";
import mongoosePaginate from "mongoose-paginate-v2";

export interface ITeamMember extends Document {
  teamMemberId: string;
  fullName: string;
  email: string;
  phone: string;
  role: string;
  photoBase64?: string;
  status: "active" | "inactive";
  createdBy: mongoose.Types.ObjectId;
}

const TeamMemberSchema = new Schema<ITeamMember>(
  {
    teamMemberId: {
      type: String,
      unique: true,
      required: true,
    },

    fullName: {
      type: String,
      required: true,
    },

    email: {
      type: String,

      unique: true,
    },

    phone: {
      type: String,
      required: true,
    },

    role: {
      type: String,

    },

    photoBase64: {
      type: String,
    },

    status: {
      type: String,
      enum: ["active", "inactive"],
      default: "active",
    },

    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

// AUTO GENERATE TEAM MEMBER ID
TeamMemberSchema.pre("validate", async function (next) {
  if (this.isNew && !this.teamMemberId) {
    this.teamMemberId = `TM-${nanoid(8).toUpperCase()}`;
  }

  next();
});

TeamMemberSchema.plugin(mongoosePaginate);

const TeamMember = mongoose.model<
  ITeamMember,
  mongoose.PaginateModel<ITeamMember>
>("TeamMember", TeamMemberSchema);

export default TeamMember;