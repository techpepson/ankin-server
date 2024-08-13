// models/User.js
import mongoose from "mongoose";

//setup User schema
const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  userPassword: { type: String, required: true },
  phoneNumber: { type: String, required: true },
});

//create a model for the schema
export const User = mongoose.model("User", userSchema);
