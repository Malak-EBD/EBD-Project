const express = require("express");
const dotenv = require("dotenv");

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

// Health check route
app.get("/api/health", (req, res) => {
  res.status(200).json({ status: "ok" });
});

app.get("/api/spending-charts" , (req, res) => {
  res.status(200).json({
    totalSpent: 0,
    totalBudget: null,
    categories: [],
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});