// "OSSSC RI 2022 Paper" -> "osssc-ri-2022-paper"
module.exports = (text) =>
  String(text)
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
