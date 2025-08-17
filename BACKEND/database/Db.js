const mongoose = require("mongoose");

const connectDb = async () => {
    try {
      mongoose
        .connect(process.env.MONGOURI)
        .then(console.log("Connected to the Database"));
    } catch (error) {
      console.log("Database Connection Error");
    }
  };
  
  module.exports = connectDb ;
  