module.exports = {
  getAllCourses: function (sql, callback) {
    const request = new sql.Request();

    request.query("SELECT * FROM Courses", function (err, recordset) {
      if (err) {
        console.log(err);
        return null;
      } else {
        callback(recordset.recordset);
      }
    });
  },
};
