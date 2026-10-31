const router = require("express").Router();
const ctrl = require("../controllers/exam.controller");
const { optionalAuth } = require("../middlewares/auth");

router.get("/", ctrl.list);
router.get("/:slug", ctrl.getOne);
router.get("/:slug/tests", optionalAuth, ctrl.listTests);

module.exports = router;
