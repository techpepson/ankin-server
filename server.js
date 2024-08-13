// server.js
import express from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { User } from "./models/User.js";
import { mongoConnect } from "./database/mongoConfig.js";
import session from "express-session";
import { Product } from "./models/product.js";
import cors from "cors";

//initialoize express app

const app = express();

//connection port
const PORT = process.env.PORT || 4000;

// Middleware
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(
  session({
    secret: process.env.EXPRESS_SESSION_SECRET,
    resave: false,
    saveUninitialized: true,
  })
);
//corsOptions definitions
const corsOptions = {
  origin: `http://localhost:5173`,
};
app.use(cors(corsOptions));

// Connect to MongoDB
mongoConnect();

// Signup Route
app.post("/api/signup", async (req, res) => {
  const { userName, userEmail, userPassword, userPhone } = req.body;

  try {
    // Check if user already exists
    const existingUser = await User.findOne({ userEmail });
    if (existingUser) {
      return res.status(400).json({ message: "User already exists." });
    }

    //generate a gensalt
    const salt = await bcrypt.genSalt(10);
    // Hash the password
    const hashedPassword = await bcrypt.hash(userPassword, salt);

    // Create a new user
    const newUser = new User({
      name: userName,
      email: userEmail,
      userPassword: hashedPassword,
      phoneNumber: userPhone,
    });

    await newUser.save();

    //jwt secretToken
    const jwtSecretToken = process.env.JWT_SECRET;
    // Optionally create a token for the user
    const token = jwt.sign({ id: newUser._id }, jwtSecretToken, {
      expiresIn: "1h",
    });

    res.status(201).json({
      token,
      user: { id: newUser._id, userName, userEmail, userPhone },
    });
  } catch (error) {
    res.status(500).json({ message: error });
  }
});

// Add Product Route
app.post("/api/products", async (req, res) => {
  const {
    itemName,
    itemDescription,
    itemAvailability,
    itemBrand,
    itemCategory,
    itemType,
    itemPrice,
    itemImages,
  } = req.body;

  // Process images if any are uploaded

  try {
    // Create a new product
    const newProduct = new Product({
      itemName,
      itemDescription,
      itemAvailability: itemAvailability === "true", // Convert to boolean
      itemBrand,
      itemCategory,
      itemType,
      itemPrice,
      itemImages,
    });

    await newProduct.save();
    res.status(201).json({ message: "Product added successfully", newProduct });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error });
  }
});

//route to fetch women clothing
app.get("/get-women", async (req, res) => {
  try {
    const items = await Product.find({ itemCategory: "women" });
    res.json(items);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});
//acessories route
app.get("/get-accessories", async (req, res) => {
  try {
    const items = await Product.find({ itemType: "accessories" });
    res.json(items);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});
//route to get men items
app.get("/get-men", async (req, res) => {
  try {
    const items = await Product.find({ itemCategory: "men" });
    res.json(items);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});
//route to get kids items
app.get("/get-kids", async (req, res) => {
  try {
    const items = await Product.find({ itemCategory: "kids" });
    res.json(items);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});
//route to get unisex items
app.get("/get-unisex", async (req, res) => {
  try {
    const items = await Product.find({ itemCategory: "unisex" });
    res.json(items);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Route to get a single item by ID
app.get("/items/:id", async (req, res) => {
  try {
    const item = await Product.findById(req.params.id);
    if (!item) {
      return res.status(404).json({ message: "Item not found" });
    }
    res.status(200).json(item);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

//endpoint to get the users in the system
app.get("/api/users", async (req, res) => {
  try {
    const userData = await User.find();
    res.json({ userData });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});
//endpoint to get the products listed in the system
app.get("/api/products", async (req, res) => {
  try {
    const productData = await Product.find();
    res.json({ productData });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
