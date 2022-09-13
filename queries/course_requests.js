module.exports = {
  /**
   * Get the total number of course requests in the database.
   *
   * A status of 200 is given for successful requests. A status of 400 for unsuccessful ones.
   *
   * @param {*} sql The mssql instance connected to the database currently used by the API.
   * @param {*} res The object to send result to a given query sender.
   */
  getNumberOfCourseRequests: function (sql, res) {
    const request = new sql.Request();

    request.query(
      "SELECT COUNT(ID) FROM CourseRequests WHERE Status=0",
      function (err, recordset) {
        if (err) {
          res.status(400).json({ error: err });
        }

        res
          .status(200)
          .json({ number: Object.values(recordset.recordset[0])[0] });
      }
    );
  },
};
