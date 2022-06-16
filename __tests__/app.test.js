import request from "supertest";
import app from "../app.js";
import db from "../db/database.js";
import "dotenv/config";

afterEach(async () => {
  //Remove entries database
  await db.run("DELETE FROM Users WHERE email='checkmail@mail.com'");
});

describe("SignUp", () => {
  it("POST /signup ---> Return ID of signed up user", () => {
    return request(app)
      .post("/user/signup")
      .send({
        username: "aUsername",
        email: "checkmail@mail.com",
        password: "aPassword",
      })
      .expect(201)
      .then((res) => {
        expect(res.body).toEqual(
          expect.objectContaining({
            id: expect.any(Number),
            message: "Signed up successfully",
          })
        );
      });
  });

  it("POST /signup ---> Return error code for already exists for duplicate email", () => {
    return request(app)
      .post("/user/signup")
      .send({
        username: `aUsername`,
        email: `somemail@mail.com`,
        password: "aPassword",
      })
      .expect(409)
      .expect({ message: "This E-mail is already in use" });
  });

  it("POST /signup ---> Return error code for invalid format", () => {
    return request(app)
      .post("/user/signup")
      .send({ username: " ", email: "invalidemail", password: " " })
      .expect(400)
      .expect({ message: "Invalid request" });
  });
});

describe("SignIn", () => {
  it("POST user/signin ---> Return success code, access and refresh tokens on signing in", async () => {
    try {
      return request(app)
        .post("/user/signin")
        .send({ email: "somemail@mail.com", password: "aPassword" })
        .expect(200)
        .then((res) => {
          const cookies = res.headers["set-cookie"];
          expect(cookies).toEqual(
            expect.arrayContaining([expect.stringMatching(/^refresh-token=/)])
          );

          expect(res.body).toEqual(
            expect.objectContaining({
              access_token: expect.any(String),
              message: "Signed in successfully",
            })
          );
        });
    } finally {
      await db.run("DELETE FROM Refresh_Tokens WHERE user=676");
    }
  });

  it("POST user/signin ---> Return error code for invalid format", () => {
    return request(app)
      .post("/user/signin")
      .send({ email: "invalidEmail", password: "ppaa" })
      .expect(400)
      .then((res) => {
        expect(res.body).toEqual(
          expect.objectContaining({
            message: "Invalid request",
          })
        );
      });
  });

  it("POST user/signin ---> Return error code for incorrect email or password", () => {
    return request(app)
      .post("/user/signin")
      .send({ email: "somemail@mail.com", password: "wrongpassword" })
      .expect(400)
      .then((res) => {
        expect(res.body).toEqual(
          expect.objectContaining({ message: "Incorrect email or password" })
        );
      });
  });
});

describe("GenerateToken", () => {
  it("GET user/generate-token ---> Return success code and new access & refresh token (rotation)", () => {
    return request(app)
      .get("/user/generate-token")
      .expect(200)
      .then((res) => {
        expect(cookies).toEqual(
          expect.arrayContaining([expect.stringMatching(/^refresh-token=/)])
        );

        expect(res.body).toEqual(
          expect.objectContaining({
            access_token: expect.any(String),
            message: "Signed in successfully",
          })
        );
      });
  });
});

describe("ResetPassword", () => {
  it("POST user/reset-password ---> Return confirmation for email sent", () => {});

  //TODO
});
