
const { Budget, Transaction } = require("../models/Spending");
const Notification = require("../models/Notification");

// Check whether a user has reached their monthly budget
const checkBudgetAlerts = async (userId, date = new Date()) => {
  try {
    const month = date.getMonth() + 1;
    const year = date.getFullYear();

    // Find the user's budget for this month
    const budget = await Budget.findOne({
      user: userId,
      period: "month",
      month: month,
      year: year,
    });

    if (!budget || budget.totalBudget <= 0) {
      return null;
    }

    // Calculate the beginning and end of the month
    const start = new Date(year, month - 1, 1);
    const end = new Date(year, month, 1);

    // Calculate the user's total expenses
    const result = await Transaction.aggregate([
      {
        $match: {
          user: budget.user,
          type: "expense",
          date: {
            $gte: start,
            $lt: end,
          },
        },
      },
      {
        $group: {
          _id: null,
          total: { $sum: "$amount" },
        },
      },
    ]);

    const totalSpent = result[0]?.total || 0;

    const percentage =
      (totalSpent / budget.totalBudget) * 100;

    let alertType = null;
    let message = "";

    // Check if the budget has been exceeded
    if (totalSpent >= budget.totalBudget) {
      alertType = "BUDGET_EXCEEDED";

      message =
        `You have exceeded your monthly budget! ` +
        `You spent ${totalSpent} out of ${budget.totalBudget}.`;
    }

    // Check if 80% of the budget has been reached
    else if (percentage >= 80) {
      alertType = "BUDGET_NEARLY_REACHED";

      message =
        `Budget warning! You have used ${Math.round(percentage)}% ` +
        `of your monthly budget.`;
    }

    // No alert is needed
    if (!alertType) {
      return null;
    }

    // Save the notification in MongoDB
    const notification = await Notification.findOneAndUpdate(
      {
        budget: budget._id,
        type: alertType,
      },
      {
        $setOnInsert: {
          user: userId,
          budget: budget._id,
          type: alertType,
          message: message,
          spent: totalSpent,
          limit: budget.totalBudget,
        },
      },
      {
        upsert: true,
        new: true,
      }
    );

    return notification;

  } catch (error) {
    console.error("Budget alert error:", error);
    throw error;
  }
};

module.exports = { checkBudgetAlerts };
