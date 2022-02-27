const express = require("express");
const passport = require("passport");
const multer = require("multer");
const router = express.Router();
const db = require("../db");
const isAuth = require("./isAuthMiddleware");

//==== alternative
// const storage = multer.memoryStorage()
const fs = require("fs");
const upload = multer({ dest: "uploads/" });
const { cloudinary } = require("../config/cloudinaryConfig");

router.get("/api/products", (req, res) => {
  let sql = "SELECT id, name, price, img_name AS imgName, img_url AS imgUrl FROM product";
  db.execute(sql, (err, result) => {
    if (err) {
      throw err;
    }
    res.json(result);
  });
});

// router.post(
//   "/api/products",
//   passport.authenticate("token", { session: false }),
//   isAuth.isAdmin,
//   upload.single("productImage"),
//   (req, res) => {
//     let sql = "";
//     let sqlParameter = [];
//     const { productName, productPrice } = req.body;
//     if (req.file) {
//       // new product image uploaded
//       const { filename: imgName, path: imgUrl } = req.file;
//       sql =
//         "INSERT INTO product (name, price, imgUrl, imgName) VALUES (?,?,?,?)";

//       sqlParameter = [productName, productPrice, imgUrl, imgName];
//     } else {
//       // without new product image
//       sql = "INSERT INTO product (name, price) VALUES (?,?)";
//       sqlParameter = [productName, productPrice];
//     }

//     db.execute(sql, sqlParameter, (err, result) => {
//       if (err) {
//         throw err;
//       }
//       res.json({ id: result.insertId });
//     });
//   }
// );

// ===========alternative post

router.post(
  "/api/products",
  passport.authenticate("token", { session: false }),
  isAuth.isAdmin,
  upload.single("productImage"),
  async (req, res) => {
    //console.log(req.file, req.body);
    let sql = "";
    let sqlParameter = [];
    const { productName, productPrice } = req.body;
    if (req.file) {
      // upload image to cloud
      const { path: tempFilePath } = req.file;
      const { public_id: imgName, url: imgUrl } =
        await cloudinary.uploader.upload(
          tempFilePath,
          { folder: "shopping-website" },
          function (error, result) {
            //   console.log(result, error);
          }
        );

      // TODO: delete tmp file
      fs.rmSync(`${tempFilePath}`, {
        force: true,
      });
      sql =
        "INSERT INTO product (name, price, img_url, img_name) VALUES (?,?,?,?)";

      sqlParameter = [productName, productPrice, imgUrl, imgName];
    } else {
      // without new product image
      sql = "INSERT INTO product (name, price) VALUES (?,?)";
      sqlParameter = [productName, productPrice];
    }

    db.execute(sql, sqlParameter, (err, result) => {
      if (err) {
        throw err;
      }
      res.json({ id: result.insertId });
    });
  }
);
//=======
router.get("/api/products/:id", (req, res) => {
  let sql = "SELECT id, name, price, img_name AS imgName, img_url AS imgUrl FROM product WHERE id = ?";
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
  upload.single("productImage"),
  async (req, res) => {
    let sql = "";
    let sqlParameter = [];
    const id = req.params.id;
    const { productName, productPrice } = req.body;
    if (req.file) {
      // delete original image on cloud
      let getImgNameSql = "SELECT img_name FROM product WHERE id = ?";
      const [getImgNameResult] = await db
        .promise()
        .execute(getImgNameSql, [id]);
      const imgNameInDB = getImgNameResult[0].imgName;
      cloudinary.uploader.destroy(imgNameInDB, function (error, result) {
        console.log("delete img on cloud", result, error);
      });
      // upload image to cloud
      const { path: tempFilePath } = req.file;
      const { public_id: imgName, url: imgUrl } =
        await cloudinary.uploader.upload(
          tempFilePath,
          { folder: "shopping-website" },
          function (error, result) {
            //   console.log(result, error);
          }
        );

      // TODO: delete tmp file
      fs.rmSync(`${tempFilePath}`, {
        force: true,
      });
      sql =
        "UPDATE product SET name = ?, price = ?, img_name = ?, img_url = ? WHERE id = ?";

      sqlParameter = [productName, productPrice, imgName, imgUrl, id];
    } else {
      // without new product image
      sql = "UPDATE product SET name = ?, price = ? WHERE id = ?";
      sqlParameter = [productName, productPrice, id];
    }

    db.execute(sql, sqlParameter, function (err, result) {
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
  async (req, res) => {
    let getImgNameSql = "SELECT img_name FROM product WHERE id = ?";
    let delSql = "DELETE FROM product WHERE id = ?";

    const { id } = req.params;
    const [getImgNameResult] = await db.promise().execute(getImgNameSql, [id]);
    const imgNameInDB = getImgNameResult[0].imgName;
    // delete img on cloud
    cloudinary.uploader.destroy(imgNameInDB, function (error, result) {
      console.log("delete img on cloud", result, error);
    });
    // delete product in db
    const [delSqlResult] = await db.promise().execute(delSql, [id]);

    console.log("delete product result:", delSqlResult);
    res.send(`delete product id=${id} success!`);
  }
);
module.exports = router;
