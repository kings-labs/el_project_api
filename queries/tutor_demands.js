module.exports = {
  /**
   * Creates a TutorDemand record.
   *
   * @param {*} sql A connected mssql instance.
   * @param {*} res An object to send a response to the caller.
   * @param {*} tutorID The ID of the tutor submitting a tutor demand.
   * @param {*} courseRequestID The ID of the courseRequest a tutor demand is submitted for.
   * @param {*} callback The callback function to be called if all happened properly.
   */
  createATutorDemand: function (sql, res, tutorID, courseRequestID, callback) {
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
            callback(recordset.output.lastID);
          }
        }
      );
  },
};
