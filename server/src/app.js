const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const { notFound, errorHandler } = require("./middlewares/errorHandler");

const app = express();

app.set("trust proxy", 1); // behind Render's proxy (needed for rate limiting by IP)
app.use(helmet());
// CLIENT_URL can list several sites, comma-separated (e.g. the Vercel URL and a custom domain)
const allowedOrigins = (process.env.CLIENT_URL || "")
  .split(",")
  .map((s) => s.trim().replace(/\/$/, ""))
  .filter(Boolean);
app.use(
  cors({
    origin: (origin, cb) => cb(null, !origin || allowedOrigins.includes(origin)),
    credentials: true,
  })
);
app.use(express.json({ limit: "1mb" }));

app.get("/api/health", (req, res) => res.json({ success: true, data: { ok: true } }));

app.use("/api/auth", require("./routes/auth.routes"));
app.use("/api/users", require("./routes/user.routes"));
app.use("/api/exams", require("./routes/exam.routes"));
app.use("/api/tests", require("./routes/test.routes"));
app.use("/api/admin", require("./routes/admin.routes"));
app.use("/api/attempts", require("./routes/attempt.routes"));
app.use("/api/dashboard", require("./routes/dashboard.routes"));

app.use(notFound);
app.use(errorHandler);

module.exports = app;
