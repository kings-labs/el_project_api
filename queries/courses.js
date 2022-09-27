module.exports = {
  /**
   * Gets all the records of active courses. Those records are then passed to a callback function.
   *
   * @param {*} sql A connected mssql instance.
   * @param {*} callback The callback function to be called with those records.
   */
  getAllCourses: function (sql, callback) {
    const request = new sql.Request();

    request.query(
      "SELECT * FROM COURSES WHERE IsActive = 1",
      function (err, recordset) {
        if (err) {
          console.log(err);
          return null;
        } else {
          callback(recordset.recordset);
        }
      }
    );
  },
};
