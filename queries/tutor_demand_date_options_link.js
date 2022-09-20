module.exports = {
  createTutorDemandDateOptionsLinkQueries: async function (
    sql,
    tutorDemandID,
    dateOptionID
  ) {
    const request = new sql.Request();
    await request
      .input("tutorDemandID", sql.Int, tutorDemandID)
      .input("dateOptionID", sql.Int, dateOptionID)
      .query(
        "INSERT INTO TutorDemands (TutorDemandID,DateOptionsID) VALUES (@tutorDemandID,@dateOptionID)",
        function (err, recordset) {
          if (err) {
            res.status(400).json({ err: err });
            return false;
          } else {
            return true;
          }
        }
      );
  },
};
