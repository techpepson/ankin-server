import mongoose from "mongoose";
import { configDotenv } from "dotenv";

//configure dotenv
configDotenv();

//connection string retrieved from the environment variables
const uri = process.env.MONGO_CONNECTION_STRING;
const options = {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverSelectionTimeoutMS: 5000, // Adjust based on your network conditions
  socketTimeoutMS: 45000,
  connectTimeoutMS: 10000,
};

export const mongoConnect = async () => {
  try {
    await mongoose.connect(uri, options);
    console.log("Database connection successful");
  } catch (err) {
    console.error("Database connection error:", err);
  }
};
