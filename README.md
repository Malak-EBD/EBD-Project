# [Project name]

> Push to `main` by **Thursday 12 November 2026, 23:59** (Submission 1).

**Course:** Electronic Business Development (BINF 503) · Winter 2026
**Instructor:** Dr. Nourhan Hamdi
**Teaching Assistants:** Mr. Nour Gaser, Mr. Omar Alaa, Ms. Mariam Khalid, Mr. Younes Zied, Mr. Mahmoud Hani

## 1. Team

| Name | Student ID | Tutorial group | GitHub username |
|---|---|---|---|
| Seif Eldin Ismail | 16002621 | T4 | seif-ismaill |
| Malak Elassy | 16002820 | T4 | Malak-EBD |
| Salma Sherif | 16003633 | T3 | salmasherif123769 |
| Roqaya Mohammed | 16002672 | T4 | roqaianassar5 |
| Zeina Ezz | 16001537 | T9 | zeinaezz3 |

## 2. The idea

MoneyWise is a finances app that allows its users to log their transactions and manage their budgets and savings plans and to view these at the end of each period, which can be by month or year. MoneyWise is targeted for young adults who want to become financially literate and need an easy-to-use application that helps them overcome the not-so-easy task of managing finances. The application tackles the problem of complicated and all over the place transactions by visualising the data on dashboards and charts that are easy to read and appealing to the eye, particularly for our younger audience.

## 3. Features

### 3.1 The full product

- Registration and login
- Dashboard showing total income and expenses for current period (month/year)
- Add, edit, and delete transactions (incoming/outgoing)
- Monthly spending charts and summary (including 'view by category)
- Budget alerts (notifications) for when budget is exceeded
- Create wishlist and send notification when saved amount is reached

### 3.2 The use cases we will build

| # | Use case | What the user does | What they see | What is stored |
|---|---|---|---|---|
| 1 | Registration and login | Registers with name, email and password; logs in with email and password | Their home page, with their name in the header | A User, with the password hashed |
| 2 | Dashboard | [-] | Total income and expenses for the current period (month or year) and how much of their budget they have spent | Incoming and outgoing transactions, which they enter (use case 3) |
| 3 | Add, edit, delete transactions | Logs their transactions, what they spent and what they earned, with relevant metadata including category, amount, location, and date | A record of their transactions by day | Amount, date, location, and category |
| 4 | Spending charts | Sets budget and spending goals | A more detailed overview of their spending than the dashboard, including the distribution of expenses across different categories (groceries, entertainment, transportation, etc). Increase or decrease in spending is also highlighted. | Transactions and set budget by user |
| 5 | Budget alert | Spends money | Notification on the screen when the budget for the month is nearly reached, or has already been reached and exceeded | Transactions and set budget by user |

## 4. Who owns what

| Member | Use case |
|---|---|
| Zeina | 1. Registration and login |
| Roqaya | 2. Dashboard |
| Seif | 3. Add, edit, and delete transactions |
| Salma | 4. Spending charts |
| Malak | 5. Budget alerts |

## 5. Data model

### User (Registration & Login)

```js
const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true }, // stored hashed, never as plain text
});
```

### Dashboard

```js
const transactionSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },

  type: {
    type: String,
    enum: ["income", "expense"],
    required: true
  },

  amount: {
    type: Number,
    required: true
  },

  category: {
    type: String,
    required: true
  },

  location: {
    type: String
  },

  date: {
    type: Date,
    required: true
  }
});

const budgetSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },

  monthlyBudget: {
    type: Number,
    required: true
  },

  month: {
    type: Number,
    required: true
  },

  year: {
    type: Number,
    required: true
  }
});
```

### Add, edit, and delete transactions

```js
const transactionSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  type: { type: String, enum: ["income", "expense"], required: true },
  amount: { type: Number, required: true, min: 0.01 },
  category: { type: String, required: true },
  location: { type: String },
  date: { type: Date, required: true, default: Date.now },
  description: { type: String },
});
```

### Spending Charts

```js
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

const Budget = mongoose.model("Budget", budgetSchema);
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
```

### Budget Alerts

```js
const mongoose = require("mongoose");
const { Schema } = mongoose;

/* ---------- Budget: set by the user, one per month ---------- */
const budgetSchema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    month: { type: String, required: true, match: /^\d{4}-(0[1-9]|1[0-2])$/ }, // "2026-11"
    amount: { type: Number, required: true, min: 0 },                         // monthly limit
    alertThreshold: { type: Number, default: 0.8, min: 0, max: 1 },           // warn at 80%
    currency: { type: String, default: "EGP" },
  },
  { timestamps: true }
);
budgetSchema.index({ user: 1, month: 1 }, { unique: true });

/* ---------- Transaction: money the user spends ---------- */
const transactionSchema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    amount: { type: Number, required: true, min: 0.01 },
    category: { type: String, trim: true, default: "general" },
    description: { type: String, trim: true },
    date: { type: Date, default: Date.now, index: true },
  },
  { timestamps: true }
);

/* ---------- Notification: shown on screen ---------- */
const notificationSchema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    budget: { type: Schema.Types.ObjectId, ref: "Budget", required: true },
    type: { type: String, enum: ["BUDGET_NEARLY_REACHED", "BUDGET_EXCEEDED"], required: true },
    message: { type: String, required: true },
    spent: Number,
    limit: Number,
    isRead: { type: Boolean, default: false },
  },
  { timestamps: true }
);
// Only one alert of each type per budget (per month) -> no spam
notificationSchema.index({ budget: 1, type: 1 }, { unique: true });

const Budget = mongoose.model("Budget", budgetSchema);
const Transaction = mongoose.model("Transaction", transactionSchema);
const Notification = mongoose.model("Notification", notificationSchema);

/* ---------- Alert logic: runs after every new transaction ---------- */
transactionSchema.post("save", async function (tx) {
  const d = tx.date;
  const month = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;

  const budget = await Budget.findOne({ user: tx.user, month });
  if (!budget) return;

  const start = new Date(d.getFullYear(), d.getMonth(), 1);
  const end = new Date(d.getFullYear(), d.getMonth() + 1, 1);
  const [{ total = 0 } = {}] = await Transaction.aggregate([
    { $match: { user: tx.user, date: { $gte: start, $lt: end } } },
    { $group: { _id: null, total: { $sum: "$amount" } } },
  ]);

  let type = null;
  if (total >= budget.amount) type = "BUDGET_EXCEEDED";
  else if (total >= budget.amount * budget.alertThreshold) type = "BUDGET_NEARLY_REACHED";
  if (!type) return;

  const message =
    type === "BUDGET_EXCEEDED"
      ? `You have exceeded your ${month} budget: ${total} / ${budget.amount} ${budget.currency}.`
      : `You have used ${Math.round((total / budget.amount) * 100)}% of your ${month} budget.`;

  try {
    await Notification.create({
      user: tx.user, budget: budget._id, type, message, spent: total, limit: budget.amount,
    });
  } catch (err) {
    if (err.code !== 11000) throw err; // ignore duplicate alert
  }
});

module.exports = { Budget, Transaction, Notification };
```


## 6. Run it locally

### Back end

```bash
cd backend
npm install
# create backend/.env from backend/.env.example (see the table below)
npm start
```

The API runs on http://localhost:3000.

| Variable in `.env` | What it is |
|---|---|
| `MONGODB_URI` | The connection string of your MongoDB Atlas database |
| `JWT_SECRET` | Any long random text, used to sign login tokens |
| [Any other variable] | [What it is] |

### Front end

```bash
cd frontend
npm install
npm run dev
```

The app runs on [the address `npm run dev` prints, e.g. http://localhost:5173].