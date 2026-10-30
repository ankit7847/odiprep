const router = require("express").Router();
const ctrl = require("../controllers/auth.controller");
const validate = require("../middlewares/validate");
const { auth } = require("../middlewares/auth");
const { authLimiter } = require("../middlewares/rateLimit");
const v = require("../validators/auth.validator");

router.post("/register", authLimiter, validate(v.registerSchema), ctrl.register);
router.post("/login", authLimiter, validate(v.loginSchema), ctrl.login);
router.post("/google", authLimiter, validate(v.googleSchema), ctrl.google);
router.post("/forgot-password", authLimiter, validate(v.forgotSchema), ctrl.forgotPassword);
router.post("/reset-password", authLimiter, validate(v.resetSchema), ctrl.resetPassword);
router.get("/me", auth, ctrl.me);

module.exports = router;
