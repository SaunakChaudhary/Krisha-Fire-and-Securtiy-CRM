const mongoose = require("mongoose");

const diarySchema = new mongoose.Schema(
  {
    site: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Site",
      required: [true, "Site is required"],
      validate: {
        validator: async function (value) {
          const site = await mongoose.model("Site").findById(value);
          return site !== null;
        },
        message: "Invalid site reference",
      },
    },
    callLog: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Call",
      required: [true, "Call log is required"],
      validate: {
        validator: async function (value) {
          const call = await mongoose.model("Call").findById(value);
          return call !== null;
        },
        message: "Invalid call log reference",
      },
    },
    engineer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Engineer is required"],
      validate: {
        validator: async function (value) {
          const user = await mongoose
            .model("User")
            .findById(value)
            .populate("accesstype_id");
          if (!user) return false;
          if (!user.accesstype_id) return true;
          return user.accesstype_id.name === "Engineer";
        },
        message: "Invalid engineer reference",
      },
    },
    date: {
      type: String, // YYYY-MM-DD
      required: true,
      validate: {
        validator: function (value) {
          const today = new Date().toISOString().slice(0, 10);
          return value >= today;
        },
        message: "Date cannot be in the past",
      },
    },
    startTime: {
      type: String,
      required: [true, "Start time is required"],
      match: [
        /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/,
        "Invalid time format (HH:MM)",
      ],
    },
    endTime: {
      type: String,
      required: [true, "End time is required"],
      match: [
        /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/,
        "Invalid time format (HH:MM)",
      ],
      validate: {
        validator: function (value) {
          const [sh, sm] = String(this.startTime || "0:0")
            .split(":")
            .map((v) => parseInt(v, 10));
          const [eh, em] = String(value || "0:0")
            .split(":")
            .map((v) => parseInt(v, 10));
          const startMinutes =
            (Number.isFinite(sh) ? sh : 0) * 60 +
            (Number.isFinite(sm) ? sm : 0);
          const endMinutes =
            (Number.isFinite(eh) ? eh : 0) * 60 +
            (Number.isFinite(em) ? em : 0);
          return endMinutes > startMinutes;
        },
        message: "End time must be after start time",
      },
    },
    duration: {
      type: String,
      required: [true, "Duration is required"],
      match: [
        /^([0-9]+h )?[0-9]+m$/,
        'Invalid duration format (e.g., "2h 30m")',
      ],
    },
    notes: {
      type: String,
      maxlength: [500, "Notes cannot exceed 500 characters"],
      default: "",
    },
    status: {
      type: String,
      enum: {
        values: ["scheduled", "accepted", "on-route", "on-site", "completed"],
        message: "Invalid status",
      },
      default: "scheduled",
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

diarySchema.virtual("calculatedDuration").get(function () {
  const [sh, sm] = String(this.startTime || "0:0")
    .split(":")
    .map((v) => parseInt(v, 10));
  const [eh, em] = String(this.endTime || "0:0")
    .split(":")
    .map((v) => parseInt(v, 10));
  const startMinutes =
    (Number.isFinite(sh) ? sh : 0) * 60 + (Number.isFinite(sm) ? sm : 0);
  const endMinutes =
    (Number.isFinite(eh) ? eh : 0) * 60 + (Number.isFinite(em) ? em : 0);
  const diffMinutes = Math.max(0, endMinutes - startMinutes);
  const hours = Math.floor(diffMinutes / 60);
  const minutes = diffMinutes % 60;

  return `${hours > 0 ? `${hours}h ` : ""}${minutes}m`;
});

diarySchema.pre("validate", function (next) {
  if (this.isModified("startTime") || this.isModified("endTime")) {
    this.duration = this.calculatedDuration;
  }
  next();
});

// Indexes for optimized queries
diarySchema.index({ engineer: 1, date: 1 });
diarySchema.index({ site: 1, date: 1 });
diarySchema.index({ callLog: 1 });
diarySchema.index({ status: 1, date: 1 });
diarySchema.index({ engineer: 1, status: 1 });

// Middleware to prevent time conflicts
diarySchema.pre("save", async function (next) {
  if (
    this.isModified("engineer") ||
    this.isModified("date") ||
    this.isModified("startTime") ||
    this.isModified("endTime")
  ) {
    const conflict = await mongoose.model("Diary").findOne({
      _id: { $ne: this._id },
      engineer: this.engineer,
      date: this.date,
      $or: [
        { startTime: { $lt: this.endTime }, endTime: { $gt: this.startTime } },
      ],
    });

    if (conflict) {
      throw new Error(
        `Time conflict with existing assignment (${conflict.startTime}-${conflict.endTime})`
      );
    }
  }
  next();
});

const Diary = mongoose.model("Diary", diarySchema);

module.exports = Diary;
