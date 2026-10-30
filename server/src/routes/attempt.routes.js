const router = require("express").Router();
const ctrl = require("../controllers/attempt.controller");
const validate = require("../middlewares/validate");
const { auth } = require("../middlewares/auth");
const v = require("../validators/attempt.validator");

router.use(auth);

router.get("/", ctrl.listMine);
router.post("/", validate(v.startSchema), ctrl.start);
router.get("/:id", ctrl.get);
router.patch("/:id/answer", validate(v.answerSchema), ctrl.saveAnswer);
router.post("/:id/warning", validate(v.warningSchema), ctrl.warning);
router.post("/:id/submit", ctrl.submit);
router.get("/:id/result", ctrl.result);
router.get("/:id/review", ctrl.review);

module.exports = router;
