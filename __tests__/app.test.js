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
          console.log("COOKIES IN RES", cookies);
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
      await db.run("DELETE FROM refresh_tokens WHERE user=676");
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
      .post("/user/signin")
      .send({ email: "somemail@mail.com", password: "aPassword" })
      .expect(200)
      .then((res) => {
        const signInCookies = res.headers["set-cookie"].toString();
        const beginIndex = signInCookies.indexOf("=");
        const endIndex = signInCookies.indexOf(";");
        const tokenValue = signInCookies.slice(beginIndex + 1, endIndex);

        console.log("tokenValueSignIn", tokenValue);

        return request(app)
          .get("/user/generate-token")
          .set("Cookie", [`refresh-token=${tokenValue}`])
          .expect(200)
          .then((res) => {
            const generateNewTokenCookies = res.headers["set-cookie"];

            expect(generateNewTokenCookies).toEqual(
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

  it("GET user/generate-token ---> Return error code for expired token/incorrect token", () => {
    //SignIn
    //Save recieved refresh-token T1
    //generate-token
    //generate-token again with T1
    //get roasted
    return request(app)
      .post("/user/signin")
      .send({ email: "somemail@mail.com", password: "aPassword" })
      .expect(200)
      .then((res) => {
        const signInCookies = res.headers["set-cookie"].toString();
        const beginIndex = signInCookies.indexOf("=");
        const endIndex = signInCookies.indexOf(";");
        const firstTokenValue = signInCookies.slice(beginIndex + 1, endIndex);

        return request(app)
          .get("/user/generate-token")
          .set("Cookie", [`refresh-token=${firstTokenValue}`])
          .expect(200)
          .then((res) => {
            const generateNewTokenCookies = res.headers["set-cookie"];
            const beginIndex = signInCookies.indexOf("=");
            const endIndex = signInCookies.indexOf(";");
            const secondTokenValue = signInCookies.slice(
              beginIndex + 1,
              endIndex
            );

            expect(generateNewTokenCookies).toEqual(
              expect.arrayContaining([expect.stringMatching(/^refresh-token=/)])
            );

            expect(res.body).toEqual(
              expect.objectContaining({
                access_token: expect.any(String),
                message: "Signed in successfully",
              })
            );

            return request(app)
              .get("/user/generate-token")
              .set("Cookie", [`refresh-token=${secondTokenValue}`])
              .expect(403)
              .then((res) => {
                expect(res.body).toEqual(
                  expect.objectContaining({ message: "Nice try Mr. Hacker" })
                );
              });
          });
      });
  });
});

describe("Authorization", () => {
  it("GET /user/protected-route ---> Return success code and message", () => {
    return request(app)
      .post("/user/signin")
      .send({ email: "somemail@mail.com", password: "aPassword" })
      .expect(200)
      .then((res) => {
        //Extract accesstoken, set Authorization header bearer token, hit protected-route
        const { access_token } = res.body;
        console.log("ACCESS TOKEN", access_token);

        return request(app)
          .get("/user/protected-route")
          .set("Authorization", `Bearer ${access_token}`)
          .expect(200)
          .then((res) => {
            console.log("RESBODY", res.body);
            expect(res.body).toEqual(
              expect.objectContaining({ message: "Access Granted" })
            );
          });
      });
  });

  it("GET /user/protected-route ---> Return error code and message", () => {
    return request(app)
      .get("/user/protected-route")
      .expect(400)
      .then((res) => {
        expect(res.body).toEqual(
          expect.objectContaining({
            message: "Authorization token not detected",
          })
        );
      });
  });

  it("GET /user/protected-route ---> Return error code and message for expired token", () => {
    return request(app)
      .post("/user/signin")
      .send({ email: "somemail@mail.com", password: "aPassword" })
      .expect(200)
      .then((res) => {
        return request(app)
          .get("/user/protected-route")
          .set("Authorization", `Bearer invalidToken`)
          .expect(403)
          .then((res) => {
            expect(res.body).toEqual(
              expect.objectContaining({ message: "Couldn't verify token" })
            );
          });
      });
  });
});

describe("ResetPassword", () => {
  it("POST user/reset-password ---> Return confirmation for email sent", () => {});

  //TODO
});
