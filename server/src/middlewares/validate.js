const ApiError = require("../utils/ApiError");

// validate(zodSchema) -> checks req.body, replaces it with the parsed (clean) value
const validate = (schema) => (req, res, next) => {
  const result = schema.safeParse(req.body);
  if (!result.success) {
    const details = result.error.issues.map((i) => ({ field: i.path.join("."), message: i.message }));
    return next(new ApiError(400, details[0].message, details));
  }
  req.body = result.data;
  next();
};

module.exports = validate;
