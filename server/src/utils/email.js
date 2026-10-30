// Email sender. For now it logs to the console.
// Later: plug in Brevo / Resend (free tier) here — nothing else needs to change.
async function sendEmail({ to, subject, text }) {
  if (process.env.NODE_ENV !== "test") {
    console.log(`[email] to=${to} subject="${subject}"\n${text}`);
  }
}

module.exports = { sendEmail };
