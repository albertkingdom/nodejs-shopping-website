const express = require("express");
const router = express.Router();
const passport = require("passport");
const passportJWT = require("passport-jwt");
const LocalStrategy = require("passport-local").Strategy;
const JWTStrategy = passportJWT.Strategy;
const bcrypt = require("bcrypt");
const saltRounds = 10;
const jwt = require("jsonwebtoken");
const extractJWT = passportJWT.ExtractJwt;
const db = require("../db");

const strategy = () => {
  passport.use(
    "local",
    new LocalStrategy(
      {
        usernameField: "email",
        passwordField: "password",
      },
      function (email, password, done) {
        db.execute(
          "SELECT * FROM users WHERE email = ?",
          [email],
          function (err, row) {
            if (err) {
              console.log(err);
              return done(err);
            }
            if (!row) {
              // email is not found in db
              return done(null, false, {
                message: "Incorrect username or password.",
              });
            }
            console.log("find email in db:", row);
            // compare password provided with password in db
            const hashedPasswordFromDB = row[0].password;
            bcrypt.compare(
              password,
              hashedPasswordFromDB,
              function (err, result) {
                // result:true=>pwd match, false=>pwd not match
                if (err) {
                  console.error("pwd not match", err);
                  return done(err);
                }
                console.log("pwd match result", result);
                if (result) {
                  // pwd is match
                  return done(null, row); // row will be req.user
                } else {
                  //pwd is not match
                  return done(null, false);
                }
              }
            );
          }
        );
      }
    )
  );
  passport.use(
    "token",
    new JWTStrategy(
      {
        jwtFromRequest: extractJWT.fromAuthHeaderAsBearerToken(),
        secretOrKey: "secret",
      },
      function (payload, done) {
        console.log("payload: ", payload);
        let sql = "SELECT * FROM users WHERE email = ?";
        db.execute(sql, [payload.email], function (err, result) {
          if (err) {
            console.log(err);
            done(err);
          }
          // the email from token is existed in db
          done(null, result);
        });
      }
    )
  );
};
module.exports = strategy;
