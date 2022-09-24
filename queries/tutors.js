module.exports = {
  /**
   * Gets a Tutor's ID in the database from his/her DiscordID.
   *
   * @param {*} sql A connected mssql instance.
   * @param {*} res An object to send a response to the caller.
   * @param {*} discordID The discordID to look for.
   * @param {*} callback The callback function that takes the resulting ID as a parameter to be called if all happened right.
   */
  getTutorForDiscordID: async function (sql, res, discordID, callback) {
    const request = new sql.Request();
    await request
      .input("discordID", sql.NVarChar, discordID)
      .query(
        "SELECT ID FROM TUTORS WHERE DiscordID=@discordID",
        function (err, recordset) {
          if (err) {
            res.status(400).json({ err: err });
            return null;
          } else {
            callback(recordset.recordset[0].ID);
          }
        }
      );
  },
};
