const router = require("express").Router();
const ctrl = require("../controllers/dashboard.controller");
const { auth } = require("../middlewares/auth");

router.use(auth);

router.get("/summary", ctrl.summary);
router.get("/score-trend", ctrl.scoreTrend); // ?limit=8
router.get("/subject-accuracy", ctrl.subjectAccuracy);
router.get("/weak-topics", ctrl.weakTopics); // ?limit=3&min=10
router.get("/streak-calendar", ctrl.streakCalendar); // ?days=84
router.get("/pyq-progress", ctrl.pyqProgress); // ?exam=osssc-ri (default: target exam)

module.exports = router;
