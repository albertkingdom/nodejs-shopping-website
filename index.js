const bodyParser = require("body-parser");
const express = require("express");
const passport = require("passport");
const cors = require("cors")

const db = require("./db");
const app = express();

const userRouter = require("./routes/userRoute");
const auth = require("./config/passportStrategy"); //passport strategies
const productRouter = require("./routes/productRoute")
const orderRouter = require("./routes/orderRoute")

app.use(bodyParser.json());

// app.use(passport.initialize());

auth() // import passport strategies
app.use(cors())
app.use(userRouter);
app.use(productRouter)
app.use(orderRouter)


const port = process.env.PORT || 3001;
app.listen(port, () => {
  `Node is listening port ${port}`;
});
module.exports = app;
