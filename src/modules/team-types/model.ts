import mongoose, { Document, Schema } from "mongoose";
import mongoosePaginate from "mongoose-paginate-v2";

export interface ITeamType extends Document {
  name: string;
  status: "active" | "inactive";
  createdBy: mongoose.Types.ObjectId;
}

const TeamTypeSchema = new Schema<ITeamType>(
  {
    name: {
      type: String,
      required: true,
      unique: true,
      trim: true,
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

TeamTypeSchema.plugin(mongoosePaginate);

const TeamType = mongoose.model<
  ITeamType,
  mongoose.PaginateModel<ITeamType>
>("TeamType", TeamTypeSchema);

export default TeamType;