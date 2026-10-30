const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const { notFound, errorHandler } = require("./middlewares/errorHandler");

const app = express();

app.set("trust proxy", 1); // behind Render's proxy (needed for rate limiting by IP)
app.use(helmet());
app.use(cors({ origin: process.env.CLIENT_URL, credentials: true }));
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
