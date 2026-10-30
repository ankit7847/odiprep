const router = require("express").Router();
const ctrl = require("../controllers/test.controller");
const { auth } = require("../middlewares/auth");

// Must be before "/:slug" so "daily-quiz" isn't read as a slug
router.get("/daily-quiz/today", auth, ctrl.dailyQuizToday);
router.get("/:slug", ctrl.getOne);

module.exports = router;
