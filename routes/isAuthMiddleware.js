const db = require("../db");

const isAdminMiddleware = (req, res, next) => {
    console.log("protect route allow user", req.user);
    let sql = "SELECT * FROM users_roles WHERE users_id = ?";
    db.execute(sql, [req.user[0].id], function (err, result) {
      if (err) {
        console.log(err);
      }
      console.log("result:", result);
      if (result[0].roles_id == 2) {
        // you are role_admin
        next();
      } else {
        // you are role_user
        res.status(401).send("you don't have admin permission");
      }
    });
}
const isUserMiddleware = (req, res, next) => {
  console.log("protect route allow user", req.user);
  let sql = "SELECT * FROM users_roles WHERE users_id = ?";
  db.execute(sql, [req.user[0].id], function (err, result) {
    if (err) {
      console.log(err);
    }
    console.log("result:", result);
    if (result[0].roles_id == 2) {
      // you are role_admin
      res.status(401).send("you don't have admin permission");
      
    } else {
      // you are role_user
      req.userId = req.user[0].id
      next();
    }
  });
}
// module.exports = router;
module.exports = {
    isAdmin: isAdminMiddleware,
    isUser: isUserMiddleware
}