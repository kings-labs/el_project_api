module.exports = {
  getCurrentWeekDetails: function (sql, res) {
    const request = new sql.Request();

    request.query(
      "Select WeekNumber, WeekStartDate From TimeReference",
      function (err, recordset) {
        if (err) {
          console.log(err);
          res.status(400).json({ error: err });
          return null;
        } else {
          return recordset.recordset;
        }
      }
    );
  },
};
