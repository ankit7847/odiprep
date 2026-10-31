const ApiError = require("../utils/ApiError");

const notFound = (req, res, next) => next(new ApiError(404, `Route not found: ${req.method} ${req.originalUrl}`));

// eslint-disable-next-line no-unused-vars
const errorHandler = (err, req, res, next) => {
  let status = err.status || 500;
  let message = err.message || "Server error";

  // Mongo duplicate key (e.g. email already used)
  if (err.code === 11000) {
    status = 409;
    message = `${Object.keys(err.keyValue)[0]} already exists`;
  }
  if (err.name === "CastError") {
    status = 400;
    message = "Invalid id";
  }

  if (status === 500) console.error(err);

  res.status(status).json({
    success: false,
    message: status === 500 && process.env.NODE_ENV === "production" ? "Server error" : message,
    ...(err.details && { details: err.details }),
  });
};

module.exports = { notFound, errorHandler };
