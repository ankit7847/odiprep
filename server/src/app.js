const express = require("express");
const cors = require("cors");

const app = express();

app.use(cors({ origin: process.env.CLIENT_URL, credentials: true }));
app.use(express.json({ limit: "1mb" }));

app.get("/api/health", (req, res) => res.json({ ok: true }));

// Routes (to be added next)
// app.use("/api/auth", require("./routes/auth.routes"));
// app.use("/api/exams", require("./routes/exam.routes"));
// app.use("/api/tests", require("./routes/test.routes"));
// app.use("/api/attempts", require("./routes/attempt.routes"));
// app.use("/api/dashboard", require("./routes/dashboard.routes"));
// app.use("/api/admin", require("./routes/admin.routes"));

// Central error handler
app.use((err, req, res, next) => {
  console.error(err);
  res.status(err.status || 500).json({ message: err.message || "Server error" });
});

module.exports = app;
