module.exports = {
  createATutorDemand: function (sql, res, tutorID, courseRequestID) {
    const request = new sql.Request();
    request
      .input("tutorID", sql.Int, tutorID)
      .input("courseRequestID", sql.Int, courseRequestID)
      .output("lastID", sql.Int)
      .query(
        "INSERT INTO TutorDemands (TutorID,CourseRequestID,Status) VALUES (@tutorID,@courseRequestID,null) SET @LASTID = SCOPE_IDENTITY()",
        function (err, recordset) {
          if (err) {
            res.status(400).json({ err: err });
            return null;
          } else {
            return recordset.output.lastID;
          }
        }
      );
  },
};
