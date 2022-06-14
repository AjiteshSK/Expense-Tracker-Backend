import request from "supertest";
import app from "../app.js";
import db from "../db/database.js";

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
      .expect(403)
      .expect({ message: "Please use a valid email or username" });
  });
});

describe("SignIn", () => {
  it("POST user/signin ---> Return success code and user JWT on signing in", () => {});

  it("POST user/signin ---> Return error code for invalid format", () => {});

  it("POST user/signin ---> Return error code for incorrect email or password", () => {});
});

describe("ResetPassword", () => {
  it("POST user/reset-password ---> Return confirmation for email sent", () => {});

  //TODO
});
