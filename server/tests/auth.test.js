process.env.NODE_ENV = "test";
process.env.JWT_SECRET = "test-secret";
process.env.CLIENT_URL = "http://localhost:5173";

const request = require("supertest");
const mongoose = require("mongoose");
const { MongoMemoryServer } = require("mongodb-memory-server");
const app = require("../src/app");
const { User } = require("../src/models");
const { createResetToken } = require("../src/utils/token");

let mongo;
beforeAll(async () => {
  mongo = await MongoMemoryServer.create();
  await mongoose.connect(mongo.getUri());
});
afterAll(async () => {
  await mongoose.disconnect();
  if (mongo) await mongo.stop();
});

const student = { name: "Ankit", email: "Ankit@Example.com", password: "secret123" };
let token;

describe("Auth", () => {
  test("register creates user and returns token", async () => {
    const res = await request(app).post("/api/auth/register").send(student);
    expect(res.status).toBe(201);
    expect(res.body.data.token).toBeDefined();
    expect(res.body.data.user.email).toBe("ankit@example.com");
    expect(res.body.data.user.password).toBeUndefined();
    const saved = await User.findOne({ email: "ankit@example.com" }).select("+password");
    expect(saved.password).not.toBe(student.password); // hashed
  });

  test("duplicate email -> 409", async () => {
    const res = await request(app).post("/api/auth/register").send(student);
    expect(res.status).toBe(409);
  });

  test("weak password -> 400", async () => {
    const res = await request(app).post("/api/auth/register").send({ ...student, email: "a@b.com", password: "short" });
    expect(res.status).toBe(400);
    expect(res.body.details[0].field).toBe("password");
  });

  test("login with right password", async () => {
    const res = await request(app).post("/api/auth/login").send({ email: student.email, password: student.password });
    expect(res.status).toBe(200);
    token = res.body.data.token;
  });

  test("login with wrong password -> 401", async () => {
    const res = await request(app).post("/api/auth/login").send({ email: student.email, password: "wrong1234" });
    expect(res.status).toBe(401);
  });

  test("/me needs token", async () => {
    expect((await request(app).get("/api/auth/me")).status).toBe(401);
    const res = await request(app).get("/api/auth/me").set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.data.name).toBe("Ankit");
  });

  test("update profile", async () => {
    const res = await request(app)
      .patch("/api/users/me")
      .set("Authorization", `Bearer ${token}`)
      .send({ preferredLanguage: "od" });
    expect(res.status).toBe(200);
    expect(res.body.data.preferredLanguage).toBe("od");
  });

  test("profile update cannot change role", async () => {
    const res = await request(app)
      .patch("/api/users/me")
      .set("Authorization", `Bearer ${token}`)
      .send({ role: "admin" });
    expect(res.status).toBe(400);
  });

  test("forgot password responds the same for unknown email", async () => {
    const res = await request(app).post("/api/auth/forgot-password").send({ email: "nobody@x.com" });
    expect(res.status).toBe(200);
  });

  test("reset password with valid token, then login with new password", async () => {
    await request(app).post("/api/auth/forgot-password").send({ email: student.email });
    // Simulate the emailed link with a known token
    const { raw, hash } = createResetToken();
    await User.updateOne(
      { email: "ankit@example.com" },
      { resetPasswordToken: hash, resetPasswordExpires: new Date(Date.now() + 60000) }
    );
    const res = await request(app).post("/api/auth/reset-password").send({ token: raw, password: "newpass123" });
    expect(res.status).toBe(200);
    const again = await request(app).post("/api/auth/reset-password").send({ token: raw, password: "newpass123" });
    expect(again.status).toBe(400); // token used up
    const login = await request(app).post("/api/auth/login").send({ email: student.email, password: "newpass123" });
    expect(login.status).toBe(200);
  });

  test("change password", async () => {
    const res = await request(app)
      .patch("/api/users/me/password")
      .set("Authorization", `Bearer ${token}`)
      .send({ oldPassword: "newpass123", newPassword: "another123" });
    expect(res.status).toBe(200);
  });

  test("unknown route -> 404", async () => {
    expect((await request(app).get("/api/nope")).status).toBe(404);
  });
});
