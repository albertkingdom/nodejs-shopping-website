const express = require("express");
const passport = require("passport");
const router = express.Router();
const db = require("../db");
const isAuth = require("./isAuthMiddleware")

// router.use(auth.router)
// console.log("auth", isAuth)

router.get("/api/products", (req, res) => {
  let sql = "SELECT * FROM product";
  db.execute(sql, (err, result) => {
    if (err) {
      throw err;
    }
    res.json(result);
  });
});

router.post(
  "/api/products",
  passport.authenticate("token", { session: false }),
  isAuth.isAdmin,
  (req, res) => {
    let sql = "INSERT INTO product (name, price) VALUES (?,?)";
    const { name, price } = req.body;
    db.execute(sql, [name, price], (err, result) => {
      if (err) {
        throw err;
      }
      res.json({ id: result.insertId });
    });
  }
);
router.get("/api/products/:id", (req, res) => {
  let sql = "SELECT * FROM product WHERE id = ?";
  const id = req.params.id;

  db.execute(sql, [id], (err, result) => {
    if (err) {
      throw err;
    }
    res.json(result[0]);
  });
});
router.put(
  "/api/products/:id",
  passport.authenticate("token", { session: false }),
  isAuth.isAdmin,
  (req, res) => {
    let sql = "UPDATE product SET name = ?, price = ? WHERE id = ?";
    const { name, price } = req.body;
    const id = req.params.id;
    db.execute(sql, [name, price, id], function (err, result) {
      if (err) {
        console.error(err);
      }
      console.log("put product result:", result);
      res.json({ id: id });
    });
  }
);
router.delete(
  "/api/products/:id",
  passport.authenticate("token", { session: false }),
  isAuth.isAdmin,
  (req, res) => {
    let sql = "DELETE FROM product WHERE id = ?";
    const { id } = req.params;
    db.execute(sql, [id], function (err, result) {
      if (err) {
        console.log(err);
      }
      console.log("delete product result:", result);
      res.send(`delete product id=${id} success!`);
    });
  }
);
module.exports = router;
