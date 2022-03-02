var express = require("express");
const router = express.Router();
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const db = require("../db");
const passport = require("passport");
const { body, validationResult } = require("express-validator");

router.post("/api/register",
  body("email").isEmail().withMessage("Not a vaild email format!"),
  body("password").isLength({ min: 6 }).withMessage("Password must at least 6 characters!"),
  body("name").trim().notEmpty().withMessage("Name can't be empty!"),
  (req, res) => {
    console.log("register", req)
    //
    const errors = validationResult(req);
    console.log("valid", errors)
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password } = req.body;
    let sql = "INSERT INTO users (email, password) VALUES (?, ?)";
    bcrypt.hash(password, 10, (err, hash) => {
      db.promise()
        .execute(sql, [email, hash])
        .then(([rows, fields]) => {
          if (rows) {
            console.log(rows);
          }

          res.json(rows);
          return rows.insertId;
        })
        .then((userId) => {
          // console.log("userId", userId);
          // write user_id and roles_id relationship to table
          let sql = "INSERT INTO users_roles (users_id, roles_id) VALUES (?,?)";
          db.execute(sql, [userId, 1], (err, result) => {
            if (err) {
              throw err;
            }
            console.log("insert roles success", result);
          });
        })
        .catch(console.log);
    });
  });

router.post(
  "/api/login",
  passport.authenticate("local", { session: false }),
  async (req, res) => {
    const email = req.user[0].email;
    if (!email) {
      res.send("incorrect email or password");
    }
    // getRoleAndResonse(email, res);
    const role = await getRole(email); // ["ROLE_USER"] or ["ROLE_ADMIN"]
    const accessJwt = jwtSignAccessToken({
      email: email,
      roles: role,
    });
    const refreshJwt = jwtSignRefreshToken({
      email: email,
    });
    res.json({
      access_token: accessJwt,
      refresh_token: refreshJwt,
      username: email,
    });
  }
);

// TODO: refresh token
router.post(
  "/api/refreshToken",
  passport.authenticate("token", { session: false }),
  async (req, res) => {
    console.log("refreshToken user is", req.user); //get user object from db
    const email = req.user[0].email;
    // getRoleAndResonse(email, res);
    // regenerate {accesstoken:xxx, refreshtoken, username:email}
    const role = await getRole(email); // ["ROLE_USER"] or ["ROLE_ADMIN"]
    const accessJwt = jwtSignAccessToken({
      email: email,
      roles: role,
    });
    const refreshJwt = jwtSignRefreshToken({
      email: email,
    });
    res.json({
      access_token: accessJwt,
      refresh_token: refreshJwt,
      username: email,
    });
  }
);
const jwtSignAccessToken = (userInfo) =>
  jwt.sign(userInfo, "secret", { expiresIn: 60 * 60 });
const jwtSignRefreshToken = (userInfo) =>
  jwt.sign(userInfo, "secret", { expiresIn: 60 * 60 * 24 });


const getRole = async (email) => {
  //get role from db
  let sql =
    "SELECT users_roles.roles_id FROM users_roles INNER JOIN users ON users_roles.users_id=users.id WHERE users.email=?";
  const [rows, fields] = await db.promise().execute(sql, [email]);

  //console.log("result", rows); //[]
  const roleId = rows[0].roles_id;
  let role;
  switch (roleId) {
    case 1:
      //console.log(["ROLE_USER"]);
      role = ["ROLE_USER"];
      break;
    case 2:
      //console.log(["ROLE_ADMIN"]);
      role = ["ROLE_ADMIN"];
      break;
    default:
      break;
  }

  console.log("role result", role);
  return role;
};

module.exports = router;
