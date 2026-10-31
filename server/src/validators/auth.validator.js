const { z } = require("zod");

const email = z.string().trim().toLowerCase().email("Enter a valid email");
const password = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .max(64, "Password is too long")
  .regex(/[A-Za-z]/, "Password must contain a letter")
  .regex(/[0-9]/, "Password must contain a number");

const registerSchema = z.object({
  name: z.string().trim().min(2, "Name is too short").max(80),
  email,
  password,
});

const loginSchema = z.object({
  email,
  password: z.string().min(1, "Password is required"),
});

const googleSchema = z.object({ idToken: z.string().min(1) });

const forgotSchema = z.object({ email });

const resetSchema = z.object({ token: z.string().min(1), password });

const updateMeSchema = z
  .object({
    name: z.string().trim().min(2).max(80),
    preferredLanguage: z.enum(["en", "od"]),
    targetExam: z.string().regex(/^[a-f\d]{24}$/i, "Invalid exam").nullable(),
    targetExamDate: z.coerce.date().nullable(),
  })
  .partial()
  .strict();

const changePasswordSchema = z.object({
  oldPassword: z.string().min(1),
  newPassword: password,
});

module.exports = {
  registerSchema,
  loginSchema,
  googleSchema,
  forgotSchema,
  resetSchema,
  updateMeSchema,
  changePasswordSchema,
};
