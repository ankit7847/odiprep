const router = require("express").Router();
const ctrl = require("../controllers/user.controller");
const validate = require("../middlewares/validate");
const { auth } = require("../middlewares/auth");
const v = require("../validators/auth.validator");

router.use(auth);
router.patch("/me", validate(v.updateMeSchema), ctrl.updateMe);
router.patch("/me/password", validate(v.changePasswordSchema), ctrl.changePassword);

module.exports = router;
