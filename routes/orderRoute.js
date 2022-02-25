const express = require("express");
const passport = require("passport");
const router = express.Router();
const db = require("../db");
const isAuth = require("./isAuthMiddleware");

router.get(
  "/api/order",
  passport.authenticate("token", { session: false }),
  isAuth.isAdmin,
  (req, res) => {
    let sql = "SELECT id, price_sum AS priceSum, user_id AS userId FROM orders";
    db.execute(sql, (err, result) => {
      if (err) {
        throw err;
      }
      res.json(result);
    });
  }
);
router.get(
  "/api/order/:id",
  passport.authenticate("token", { session: false }),
  isAuth.isAdmin,
  async (req, res) => {
    let productDetailInOrderSql =
      "SELECT orders.id, orders.user_id, orders.price_sum, order_item.product_id, order_item.quantity FROM orders INNER JOIN order_item ON orders.id = order_item.order_id WHERE orders.id = ?";
    let orderAndUserEmailSql =
      "SELECT  orders.id, orders.price_sum, users.email, users.id FROM orders INNER JOIN users ON orders.user_id = users.id WHERE orders.id = ?";
    let orderItemDetailSql =
      "SELECT product.name AS productName, product.price AS productPrice, order_item.quantity FROM product INNER JOIN order_item ON product.id = order_item.product_id WHERE order_item.order_id = ?";
    const orderId = req.params.id;

    const [rows] = await db.promise().execute(orderAndUserEmailSql, [orderId]);
    const { id: userId, email: userEmail, price_sum: priceSum } = rows[0];
    // console.log("userId", userId, "userEmail", userEmail, "price_sum",priceSum)

    const [orderItemDetailRows] = await db
      .promise()
      .execute(orderItemDetailSql, [orderId]);
    // res.json(orderItemDetailRows)
    res.json({
      userId: userId,
      userEmail: userEmail,
      priceSum: priceSum,
      orderItemDetailList: orderItemDetailRows,
    });
  }
);
router.post(
  "/api/order",
  passport.authenticate("token", { session: false }),
  isAuth.isUser,
  async (req, res) => {
    // get user email
    console.log("req user id", req.userId);
    // get items array
    const { items } = req.body;
    console.log("items", items);
    const productIdList = items.map((item) => item.productId);
    console.log("productIdList", productIdList);

    // save order
    let insertIntoOrderSql = "INSERT INTO orders (user_id) VALUES (?)";
    const [rows, fields] = await db
      .promise()
      .execute(insertIntoOrderSql, [req.userId]);

    console.log("new order id:", rows.insertId);
    const newOrderId = rows.insertId;
    // save order items to order_item table
    let insertIntoOrderItemsSql =
      "INSERT INTO order_item (product_id, quantity,order_id) VALUES (?,?,?)";
    items.forEach(async (item) => {
      await db
        .promise()
        .execute(insertIntoOrderItemsSql, [
          item.productId,
          item.productCount,
          newOrderId,
        ]);
    });
    // look for each product price
    let lookForPriceSql =
      "select product.id, product.price, order_item.quantity from product inner join order_item on product.id=order_item.product_id where order_id = ?";
    const [priceAndQuantityList, _] = await db
      .promise()
      .execute(lookForPriceSql, [newOrderId]);
    console.log("price and quantity list", priceAndQuantityList);
    let totalPrice = priceAndQuantityList
      .map((element) => element.price * element.quantity)
      .reduce((prev, current) => prev + current, 0);
    console.log("total price", totalPrice);

    let updatePriceSumToOrder = "UPDATE orders SET price_sum = ? WHERE id = ?";
    const [updatePriceResult] = await db
      .promise()
      .execute(updatePriceSumToOrder, [totalPrice, newOrderId]);
    console.log("updatePriceResult", updatePriceResult);
    if (updatePriceResult.affectedRows == 1) {
      res.status(200).send("order success");
    }
  }
);
router.delete(
  "/api/order/:id",
  passport.authenticate("token", { session: false }),
  isAuth.isAdmin,
  async (req, res) => {
    const { id } = req.params;
    let deleteOrder = "DELETE FROM orders WHERE id = ?";
    let deleteOrderItem = "DELETE FROM order_item WHERE order_id = ?";
    const [deleteOrderItemRows] = await db
      .promise()
      .execute(deleteOrderItem, [id]);
    console.log("deleteOrderItemRows", deleteOrderItemRows);

    const [deleteOrderRows] = await db.promise().execute(deleteOrder, [id]);

    console.log("deleteOrderRows:", deleteOrderRows);
    res.send(`delete order id=${id} success!`);
  }
);
module.exports = router;
