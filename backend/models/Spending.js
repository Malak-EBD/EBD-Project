const mongoose = require("mongoose");
const { Schema } = mongoose;

/* ------------------------------------------------------------------
   Use case 4: Spending charts
   Stored: Transactions (from use case 3) + budget set by the user
------------------------------------------------------------------- */

const CATEGORIES = [
  "groceries",
  "entertainment",
  "transportation",
  "bills",
  "health",
  "shopping",
  "other",
];

/* Budget: what the user sets (overall + per-category goals) */
const budgetSchema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },

    // Period this budget applies to
    period: { type: String, enum: ["month", "year"], default: "month" },
    month: { type: Number, min: 1, max: 12 }, // required if period = "month"
    year: { type: Number, required: true },

    // Overall spending limit for the period
    totalBudget: { type: Number, required: true, min: 0 },

    // Optional per-category spending goals
    categoryBudgets: [
      {
        category: { type: String, enum: CATEGORIES, required: true },
        limit: { type: Number, required: true, min: 0 },
      },
    ],
  },
  { timestamps: true }
);

// One budget per user per period
budgetSchema.index({ user: 1, period: 1, year: 1, month: 1 }, { unique: true });

/* Transaction (use case 3). Include this only if it isn't defined already. */
const transactionSchema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    type: { type: String, enum: ["income", "expense"], required: true },
    amount: { type: Number, required: true, min: 0 },
    category: { type: String, enum: CATEGORIES, required: true },
    location: { type: String, trim: true },
    date: { type: Date, required: true, default: Date.now },
  },
  { timestamps: true }
);

const Budget = mongoose.models.Budget || mongoose.model("Budget", budgetSchema);
const Transaction = mongoose.models.Transaction || mongoose.model("Transaction", transactionSchema);

/* ------------------------------------------------------------------
   Chart data: spending per category for a given month, plus the
   increase/decrease compared to the previous month.
------------------------------------------------------------------- */
async function getSpendingByCategory(userId, year, month) {
  const uid = new mongoose.Types.ObjectId(userId);
  const range = (y, m) => ({
    $gte: new Date(y, m - 1, 1),
    $lt: new Date(y, m, 1),
  });

  const aggregate = (y, m) =>
    Transaction.aggregate([
      { $match: { user: uid, type: "expense", date: range(y, m) } },
      { $group: { _id: "$category", total: { $sum: "$amount" } } },
    ]);

  const prevYear = month === 1 ? year - 1 : year;
  const prevMonth = month === 1 ? 12 : month - 1;

  const [current, previous, budget] = await Promise.all([
    aggregate(year, month),
    aggregate(prevYear, prevMonth),
    Budget.findOne({ user: uid, period: "month", year, month }),
  ]);

  const prevMap = Object.fromEntries(previous.map((p) => [p._id, p.total]));
  const totalSpent = current.reduce((sum, c) => sum + c.total, 0);

  return {
    totalSpent,
    totalBudget: budget ? budget.totalBudget : null,
    categories: current.map((c) => {
      const prev = prevMap[c._id] || 0;
      return {
        category: c._id,
        total: c.total,
        percentage: totalSpent ? +((c.total / totalSpent) * 100).toFixed(1) : 0,
        change: c.total - prev, // positive = spending increased
        trend: c.total > prev ? "up" : c.total < prev ? "down" : "same",
      };
    }),
  };
}

module.exports = { Budget, Transaction, getSpendingByCategory };