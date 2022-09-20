module.exports = {
  getTutorForDiscordID: function (sql, res, discordID) {
    const request = new sql.Request();
    request
      .input("discordID", sql.NVarChar, discordID)
      .query(
        "SELECT ID FROM TUTORS WHERE DiscordID=@discordID",
        function (err, recordset) {
          if (err) {
            res.status(400).json({ err: err });
            return null;
          } else {
            return recordset.recordset.ID;
          }
        }
      );
  },
};
