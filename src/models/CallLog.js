const mongoose = require("mongoose");

mongoose.set("strictQuery", false);

const callLogSchema = new mongoose.Schema(
  {
    callSid: {
      type: String,
      required: [true, "Call SID is required"],
      unique: true,
      index: true,
    },
    patientPhone: {
      type: String,
      required: [true, "Patient phone number is required"],
      index: true,
    },
    status: {
      type: String,
      required: [true, "Call status is required"],
      enum: [
        "initiated",
        "ringing",
        "in-progress",
        "completed",
        "failed",
        "no-answer",
        "voicemail",
      ],
      default: "initiated",
    },
    direction: {
      type: String,
      required: [true, "Call direction is required"],
      enum: ["outbound", "inbound"],
    },
    patientResponse: {
      type: String,
      default: null,
    },
    duration: {
      type: Number,
      default: 0,
    },
    recordingUrl: {
      type: String,
      default: null,
    },
    voicemailLeft: {
      type: Boolean,
      default: false,
    },
    smsSent: {
      type: Boolean,
      default: false,
    },
    error: {
      type: String,
      default: null,
    },
    medicationList: [
      {
        type: String,
        required: true,
      },
    ],
    callAttempts: {
      type: Number,
      default: 1,
    },
    lastAttemptAt: {
      type: Date,
      default: Date.now,
    },
    nextAttemptAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

callLogSchema.index({ createdAt: -1 });
callLogSchema.index({ patientPhone: 1, status: 1 });

callLogSchema.virtual("durationInMinutes").get(function () {
  return Math.round(this.duration / 60);
});

callLogSchema.pre("save", function (next) {
  if (this.isModified("status")) {
    this.lastAttemptAt = new Date();
  }
  next();
});

callLogSchema.statics.findRecentCalls = function (limit = 100) {
  return this.find().sort({ createdAt: -1 }).limit(limit);
};

callLogSchema.methods.needsRetry = function () {
  return this.status === "no-answer" && this.callAttempts < 3;
};

const CallLog = mongoose.model("CallLog", callLogSchema);

module.exports = CallLog;
