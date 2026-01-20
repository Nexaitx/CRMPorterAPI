const mongoose = require("mongoose");
const User = require("../models/user");

module.exports = async () => {
  try {
    //  force collection creation
    await User.createCollection();

    //  create indexes (unique email)
    await User.collection.createIndex(
      { email: 1 },
      { unique: true }
    );

    console.log(" User collection & indexes created");
  } catch (error) {
    console.error(" User migration failed:", error.message);
  }
};
