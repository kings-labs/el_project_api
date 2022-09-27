const jwt = require("jsonwebtoken");

module.exports = {
  /**
   * Checks if a request is properly authenticated. To do so, it extracts the token from the request's header and
   * checks its authenticity. If the request is properly authenticated it will call a callback function, if not it
   * will throw a dedicated error status of 401.
   *
   * @param {*} req The request
   * @param {*} res The object to send a response to that request
   * @param {*} callback The callback function
   */
  checkAuth: async function (req, res, callback) {
    try {
      const token = req.headers.authorization.split(" ")[1];
      const decoded = await jwt.verify(token, process.env.SKEY);
      callback();
    } catch (error) {
      res.status(401).json({
        message: "Auth failed",
      });
    }
  },
};
