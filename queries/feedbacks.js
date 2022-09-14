/**
 * This file holds the code of all queries related to the Feedback table.
 *
 * @version 14/09/2022
 */

module.exports = {
  /**
   * Creates a new feedback and indicates result and status to the user.
   *
   * A status of 200 is given for successful requests. A status of 400 for unsuccessful ones.
   *
   * @param {*} sql The mssql instance connected to the database currently used by the API.
   * @param {*} res The object to send result to a given query sender.
   * @param {*} classId The ID of the class to create a Feedback for.
   * @param {*} feedback The feedback note.
   */
  createFeedback: function (sql, res, classId, feedback) {
    const request = new sql.Request();
    request
      .input("classId", sql.Int, classId)
      .input("feedback", sql.NVarChar, feedback)
      .query(
        "insert into feedbacks (ClassID,Note,Status) values (@classId,@feedback,null)",
        function (err, recordset) {
          if (err) {
            console.log(err);
            res.status(400).json({ error: err });
          } else {
            res.status(200).json({ message: "Feedback created." });
          }
        }
      );
  },

  /**
   * Checks if there are no currently pending feedback for the same class.
   * A currently pending feedback is a request that has not yet been either approved or disapproved and therefore that has status null.
   *
   * If the test is successful, the callback function will be called.
   *
   * @param {*} sql The mssql instance connected to the database currently used by the API.
   * @param {*} res The object to send result to a given query sender.
   * @param {*} classID The ID of the class to create a Feedback for.
   * @param {*} callback The callback function to be called if the test is successful.
   */
  checkIfNoPendingRequestForSameClass: function (sql, res, classID, callback) {
    const request = new sql.Request();
    request
      .input("classId", sql.Int, classID)
      .query(
        "SELECT COUNT(ID) FROM feedbacks WHERE ClassID=@classId AND Status IS NULL",
        function (err, recordset) {
          if (err) {
            console.log(err);
            res.status(400).json({ error: err });
            return null;
          } else {
            if (Object.values(recordset.recordset[0])[0] === 0) {
              callback();
            } else {
              res.status(400).json({
                error: "A request is currently opened for the same class.",
              });
            }
          }
        }
      );
  },
};
