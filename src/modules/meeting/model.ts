import mongoose, { Document, Schema, Types } from "mongoose";
import { nanoid } from "nanoid";
import mongoosePaginate from "mongoose-paginate-v2";

// Define ReMeeting interface
export interface IReMeeting {
  _id: Types.ObjectId;  // Add this - MongoDB auto-generates _id for subdocuments
  dateTime: Date;
  description: string;
  completed: boolean;
  notes?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface IMeeting extends Document {
  meetingId: string;
  workId?: string;
  meetingTitle: string;
  description: string;
  assignToTeamIds: string[];
  notes: string;  // Add notes for main meeting
  status: "pending" | "completed" | "in-progress";  // Add status for main meeting
  dateTime: Date;
  reMeetings: Types.DocumentArray<IReMeeting>;  // Use DocumentArray for Mongoose subdocuments
  createdBy: mongoose.Types.ObjectId;
}

const ReMeetingSchema = new Schema(
  {
    dateTime: {
      type: Date,
      required: true,
    },
    description: {
      type: String,
      default: "",
    },
    completed: {
      type: Boolean,
      default: false,
    },
    notes: {
      type: String,
      default: "",
    },
  },
  {
    timestamps: true,
    _id: true,  // Ensure _id is generated
  }
);

const MeetingSchema = new Schema<IMeeting>(
  {
    meetingId: {
      type: String,
      unique: true,
      required: true,
    },
    workId: {
      type: String,
      default: null,
    },
    meetingTitle: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      default: "",
      trim: true,
    },
    notes: {
      type: String,
      default: "",
      trim: true,
    },
    status: {
      type: String,
      enum: ["pending", "completed", "in-progress"],
      default: "pending",
    },
    assignToTeamIds: [
      {
        type: String,
        required: true,
      },
    ],
    dateTime: {
      type: Date,
      required: true,
    },
    reMeetings: {
      type: [ReMeetingSchema],
      default: [],
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

MeetingSchema.pre("validate", function (next) {
  if (this.isNew && !this.meetingId) {
    this.meetingId = `MEET-${nanoid(8).toUpperCase()}`;
  }
  next();
});

MeetingSchema.virtual("teams", {
  ref: "Team",
  localField: "assignToTeamIds",
  foreignField: "teamId",
  justOne: false,
});

MeetingSchema.virtual("work", {
  ref: "Work",
  localField: "workId",
  foreignField: "workId",
  justOne: true,
});

MeetingSchema.plugin(mongoosePaginate);

const Meeting = mongoose.model<
  IMeeting,
  mongoose.PaginateModel<IMeeting>
>("Meeting", MeetingSchema);

export default Meeting;