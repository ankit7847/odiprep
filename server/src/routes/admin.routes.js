const router = require("express").Router();
const { auth, isAdmin } = require("../middlewares/auth");
const validate = require("../middlewares/validate");
const v = require("../validators/exam.validator");
const { exam, subject, topic } = require("../controllers/admin/catalog.controller");

router.use(auth, isAdmin); // everything below is admin-only

// Exams
router.get("/exams", exam.list);
router.post("/exams", validate(v.createExam), exam.create);
router.patch("/exams/:id", validate(v.updateExam), exam.update);
router.delete("/exams/:id", exam.deactivate);

// Subjects
router.get("/subjects", subject.list);
router.post("/subjects", validate(v.createSubject), subject.create);
router.patch("/subjects/:id", validate(v.updateSubject), subject.update);

// Topics
router.get("/topics", topic.list); // ?subject=<id>
router.post("/topics", validate(v.createTopic), topic.create);
router.patch("/topics/:id", validate(v.updateTopic), topic.update);
router.delete("/topics/:id", topic.remove);

// Next: questions (+ Excel upload) and tests
module.exports = router;
