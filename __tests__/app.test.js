import request from "supertest";
import { toBeOneOf } from "jest-extended";
import app from "../app.js";
import db from "../db/database.js";
import "dotenv/config";

expect.extend({ toBeOneOf });

afterEach(async () => {
  await db.run("DELETE FROM Users WHERE email='checkmail@mail.com'");
  await db.run("DELETE FROM refresh_tokens WHERE user=676");
});

//#region Authorization Tests
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
  let tokenValue;
  beforeEach(async () => {
    const response = await request(app)
      .post("/user/signin")
      .send({ email: "somemail@mail.com", password: "aPassword" });

    const signInCookies = response.headers["set-cookie"].toString();
    const beginIndex = signInCookies.indexOf("=");
    const endIndex = signInCookies.indexOf(";");
    tokenValue = signInCookies.slice(beginIndex + 1, endIndex);
  });

  it("GET user/generate-token ---> Return success code and new access & refresh token (rotation)", () => {
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

  it("GET user/generate-token ---> Return error code for expired token/incorrect token", () => {
    //SignIn (beforeEach)
    //Save recieved refresh-token T1 (tokenValue)
    //generate-token
    //generate-token again with T1
    //get roasted

    return request(app)
      .get("/user/generate-token")
      .set("Cookie", [`refresh-token=${tokenValue}`])
      .expect(200)
      .then((res) => {
        const generateNewTokenCookies = res.headers["set-cookie"];
        const beginIndex = generateNewTokenCookies.indexOf("=");
        const endIndex = generateNewTokenCookies.indexOf(";");
        const secondTokenValue = generateNewTokenCookies.slice(
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
          .set("Cookie", [`refresh-token=${tokenValue}`])
          .expect(403)
          .then((res) => {
            expect(res.body).toEqual(
              expect.objectContaining({ message: "Nice try Mr. Hacker" })
            );
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

        return request(app)
          .get("/user/protected-route")
          .set("Authorization", `Bearer ${access_token}`)
          .expect(200)
          .then((res) => {
            expect(res.body).toEqual(
              expect.objectContaining({ message: "Access Granted" })
            );
          });
      });
  });

  it("GET /user/protected-route ---> Return error code and message for no token", () => {
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

  it("GET /user/protected-route ---> Return error code and message for invalid token", () => {
    return request(app)
      .post("/user/signin") //redundant
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
//#endregion

//#region Expense CRUD Tests
describe("Expense CRUD", () => {
  let tokenValue;
  let accessToken;
  let expenseID;

  beforeAll(async () => {
    const response = await request(app)
      .post("/user/signin")
      .send({ email: "somemail@mail.com", password: "aPassword" });

    const signInCookies = response.headers["set-cookie"].toString();
    const beginIndex = signInCookies.indexOf("=");
    const endIndex = signInCookies.indexOf(";");
    tokenValue = signInCookies.slice(beginIndex + 1, endIndex);

    accessToken = response.body.access_token;
  });

  it("POST /expense/create ---> Return success code and created expense", async () => {
    try {
      return request(app)
        .post("/expense/create")
        .set("Authorization", `Bearer ${accessToken}`)
        .send({
          name: "SomeExpense",
          price: 24.99,
          category: "someCategory",
          notes: "someNotes",
        })
        .expect(201)
        .then((res) => {
          expect(res.body).toEqual(
            expect.objectContaining({
              id: expect.any(String),
              name: expect.any(String),
              category: expect.any(String),
              notes: expect.toBeOneOf([null, expect.any(String)]),
            })
          );
          expenseID = res.body.id;
        });
    } catch (error) {
      if (error) {
        console.log("Error in /expense/create test", error);
      }
    }
  });

  it("GET /expense/all ---> Return success code and all expenses by current user", async () => {
    return request(app)
      .get("/expense/all")
      .set("Authorization", `Bearer ${accessToken}`)
      .expect(200)
      .then((res) => {
        console.log("RESS", res.body);
        expect(res.body).toEqual(expect.arrayContaining([]));
      });
  });

  it("GET /expense/:id ---> Return success code with specific expense", async () => {
    console.log("EXPENSEID", expenseID);
    return request(app)
      .get(`/expense/get-by-id/${expenseID}`)
      .set("Authorization", `Bearer ${accessToken}`)
      .expect(200)
      .then((res) => {
        expect(res.body).toEqual(
          expect.objectContaining({
            id: expect.any(String),
            name: expect.any(String),
            category: expect.any(String),
            notes: expect.toBeOneOf([null, expect.any(String)]),
            price: expect.any(Number),
            incurred_by: expect.any(Number),
          })
        );
      });
  });

  it("PUT /expense/update/:id ---> Return success code with updated expense", async () => {
    const response = await request(app)
      .put(`/expense/update/${expenseID}`)
      .set("Authorization", `Bearer ${accessToken}`)
      .send({ price: 34.99 })
      .expect(200);

    expect(response.body).toEqual(
      expect.objectContaining({
        id: expect.any(String),
        name: expect.any(String),
        category: expect.any(String),
        notes: expect.toBeOneOf([null, expect.any(String)]),
        price: expect.any(Number),
        incurred_by: expect.any(Number),
      })
    );
  });

  it("DELETE /expense/delete/:id ---> Return success code and message", async () => {
    const response = await request(app)
      .delete(`/expense/delete/${expenseID}`)
      .set("Authorization", `Bearer ${accessToken}`)
      .expect(200);

    expect(response.body).toEqual(
      expect.objectContaining({ message: "Expense deleted successfully" })
    );
  });
});
//#endregion
