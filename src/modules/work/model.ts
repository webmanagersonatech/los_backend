import mongoose, { Document, Schema } from "mongoose";
import { nanoid } from "nanoid";
import mongoosePaginate from "mongoose-paginate-v2";

export interface IWork extends Document {
  workId: string;

  workTitle: string;

  assignToTeamIds: string[];

  deadline: Date;

  priority: "low" | "medium" | "high";

  description?: string;

  status:
    | "pending"
    | "in_progress"
    | "completed"
    | "on_hold"
    | "cancelled";

  createdBy: mongoose.Types.ObjectId;
}

const WorkSchema = new Schema<IWork>(
  {
    // AUTO GENERATED WORK ID
    workId: {
      type: String,
      unique: true,
      required: true,
    },

    // WORK TITLE
    workTitle: {
      type: String,
      required: true,
      trim: true,
    },

    // STORE TEAM IDS
    assignToTeamIds: [
      {
        type: String,
        required: true,
      },
    ],

    // DEADLINE
    deadline: {
      type: Date,
      required: true,
    },

    // PRIORITY
    priority: {
      type: String,
      enum: ["low", "medium", "high"],
      default: "low",
    },

    // DESCRIPTION
    description: {
      type: String,
      default: "",
    },

    // STATUS
    status: {
      type: String,
      enum: [
        "pending",
        "in_progress",
        "completed",
        "on_hold",
        "cancelled",
      ],
      default: "pending",
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

    // IMPORTANT FOR VIRTUALS
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

//
// =========================
// AUTO GENERATE WORK ID
// =========================
//

WorkSchema.pre("validate", async function (next) {
  if (this.isNew && !this.workId) {
    this.workId = `WORK-${nanoid(8).toUpperCase()}`;
  }

  next();
});

//
// =========================
// VIRTUAL TEAMS
// =========================
//

WorkSchema.virtual("teams", {
  ref: "Team",

  // FIELD IN WORK MODEL
  localField: "assignToTeamIds",

  // FIELD IN TEAM MODEL
  foreignField: "teamId",

  justOne: false,
});

//
// =========================
// PAGINATION
// =========================
//

WorkSchema.plugin(mongoosePaginate);

const Work = mongoose.model<
  IWork,
  mongoose.PaginateModel<IWork>
>("Work", WorkSchema);

export default Work;