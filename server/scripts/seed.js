// Seeds starter data: Odisha exams, subjects, topics, and one admin user.
// Run: npm run seed   (safe to run again — it upserts by slug/email)
require("dotenv").config();
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const { Exam, Subject, Topic, User } = require("../src/models");

const exams = [
  { name: "OSSSC RI", slug: "osssc-ri", board: "OSSSC", order: 1 },
  { name: "OSSC CGL", slug: "ossc-cgl", board: "OSSC", order: 2 },
  { name: "OPSC OCS", slug: "opsc-ocs", board: "OPSC", order: 3 },
  { name: "OTET", slug: "otet", board: "BSE Odisha", order: 4 },
  { name: "OSSTET", slug: "osstet", board: "BSE Odisha", order: 5 },
  { name: "B.Ed Entrance", slug: "bed-entrance", board: "Higher Education, Odisha", order: 6 },
];

const subjects = {
  "odisha-gk": { en: "Odisha GK", od: "ଓଡ଼ିଶା ସାଧାରଣ ଜ୍ଞାନ", topics: ["Odisha History", "Odisha Geography", "Odisha Culture"] },
  reasoning: { en: "Reasoning", od: "ତର୍କ", topics: ["Series", "Coding-Decoding", "Blood Relations"] },
  arithmetic: { en: "Arithmetic", od: "ପାଟୀଗଣିତ", topics: ["Percentage", "Ratio", "Time and Work"] },
  english: { en: "English", od: "ଇଂରାଜୀ", topics: ["Grammar", "Vocabulary", "Comprehension"] },
  "current-affairs": { en: "Current Affairs", od: "ସାମ୍ପ୍ରତିକ ଘଟଣା", topics: ["Odisha Schemes", "National"] },
};

const slug = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

(async () => {
  await mongoose.connect(process.env.MONGO_URI);

  for (const e of exams) await Exam.updateOne({ slug: e.slug }, { $set: e }, { upsert: true });

  for (const [s, info] of Object.entries(subjects)) {
    const subj = await Subject.findOneAndUpdate(
      { slug: s },
      { $set: { slug: s, name: { en: info.en, od: info.od } } },
      { upsert: true, new: true }
    );
    for (const t of info.topics) {
      await Topic.updateOne(
        { subject: subj._id, slug: slug(t) },
        { $set: { subject: subj._id, slug: slug(t), name: { en: t } } },
        { upsert: true }
      );
    }
  }

  const { ADMIN_EMAIL, ADMIN_PASSWORD } = process.env;
  if (ADMIN_EMAIL && ADMIN_PASSWORD) {
    await User.updateOne(
      { email: ADMIN_EMAIL.toLowerCase() },
      {
        $set: { role: "admin" },
        $setOnInsert: { name: "Admin", email: ADMIN_EMAIL.toLowerCase(), password: await bcrypt.hash(ADMIN_PASSWORD, 10) },
      },
      { upsert: true }
    );
    console.log(`Admin ready: ${ADMIN_EMAIL}`);
  }

  console.log("Seed done");
  await mongoose.disconnect();
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
