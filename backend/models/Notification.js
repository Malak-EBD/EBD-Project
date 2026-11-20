
const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    budget: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Budget",
      required: true,
    },

    type: {
      type: String,
      enum: ["BUDGET_NEARLY_REACHED", "BUDGET_EXCEEDED"],
      required: true,
    },

    message: {
      type: String,
      required: true,
    },

    spent: {
      type: Number,
      required: true,
    },

    limit: {
      type: Number,
      required: true,
    },

    isRead: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

notificationSchema.index(
  { budget: 1, type: 1 },
  { unique: true }
);

module.exports =
  mongoose.models.Notification ||
  mongoose.model("Notification", notificationSchema);
