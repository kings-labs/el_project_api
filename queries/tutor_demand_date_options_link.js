module.exports = {
  /**
   * Creates the TutorDemandDateOptionsLink for an array of date options ID for a given TutorDemand.
   *
   * @param {*} sql A connected mssql instance.
   * @param {*} res An object to send a response to the caller.
   * @param {*} tutorDemandID The TutorDemand's ID.
   * @param {*} dateOptions The array of DateOptions to create a TutorDemandDateOptionsLink for.
   * @param {*} callback The callback to be called if the check is successful.
   */
  createTutorDemandDateOptionsLinks: async function (
    sql,
    res,
    tutorDemandID,
    dateOptions,
    callback
  ) {
    const request = new sql.Request();
    let query =
      "INSERT INTO TutorDemandDateOptionsLink (TutorDemandID,DateOptionsID) VALUES (" +
      tutorDemandID +
      "," +
      dateOptions[0] +
      ")";
    for (let i = 1; i < dateOptions.length; i++) {
      query = query + ",(" + tutorDemandID + "," + dateOptions[i] + ")";
    }
    await request.query(query, function (err, recordset) {
      if (err) {
        res
          .status(400)
          .json({ error: "Error creating tutor demand date options link" });
      } else {
        callback();
      }
    });
  },
};
