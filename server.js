import express from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { User } from "./models/User.js";
import { mongoConnect } from "./database/mongoConfig.js";
import session from "express-session";
import { Product } from "./models/product.js";
import cors from "cors";
import formidable from "formidable";
import fs from "fs";
import path from "path";

// Initialize express app
const app = express();

// Connection port
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

// CORS Options definitions
const corsOptions = {
  origin: `https://ankin-fashion.vercel.app`,
};
app.use(cors(corsOptions));

// Connect to MongoDB
mongoConnect();

// Image upload route
app.post("/api/upload", (req, res) => {
  const form = new formidable.IncomingForm();
  form.uploadDir = path.join(__dirname, "uploads"); // Directory to save images
  form.keepExtensions = true;

  // Parse the incoming request containing the form data
  form.parse(req, (err, fields, files) => {
    if (err) {
      return res.status(500).json({ message: "Error parsing form data", err });
    }

    // Assuming 'image' is the field name in your form
    const imageFile = files.image;

    if (!imageFile) {
      return res.status(400).json({ message: "No image file uploaded" });
    }

    const oldPath = imageFile.filepath;
    const newPath = path.join(form.uploadDir, imageFile.originalFilename);

    // Move the file to the final directory
    fs.rename(oldPath, newPath, async (err) => {
      if (err) {
        return res.status(500).json({ message: "Error saving file", err });
      }

      // Save the image path in the database
      try {
        const newProduct = new Product({
          ...fields,
          itemImages: newPath, // Save the file path in the database
        });

        await newProduct.save();
        res.status(201).json({ message: "Product and image uploaded successfully", newProduct });
      } catch (error) {
        res.status(500).json({ message: "Error saving product", error });
      }
    });
  });
});

// Signup Route
app.post("/api/signup", async (req, res) => {
  const { userName, userEmail, userPassword, userPhone } = req.body;

  try {
    // Check if user already exists
    const existingUser = await User.findOne({ userEmail });
    if (existingUser) {
      return res.status(400).json({ message: "User already exists." });
    }

    // Generate a salt
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

    // Optionally create a token for the user
    const token = jwt.sign({ id: newUser._id }, process.env.JWT_SECRET, {
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

// Login Route
app.post("/api/login", async (req, res) => {
  try {
    const { userEmail, userPassword } = req.body;
    const user = await User.findOne({ userEmail });

    if (user) {
      const comparePasswords = await bcrypt.compare(userPassword, user.userPassword);

      if (comparePasswords) {
        const jwtPayLoad = { userId: user._id, userEmail: user.userEmail };
        const token = jwt.sign(jwtPayLoad, process.env.ACCESS_TOKEN_SECRET, { expiresIn: "1h" });
        res.status(200).json({ token, userRole: user.role });
      } else {
        res.status(401).json({ message: "Invalid credentials" });
      }
    } else {
      res.status(401).json({ message: "User not in the system" });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error during login", error });
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

  try {
    const newProduct = new Product({
      itemName,
      itemDescription,
      itemAvailability: itemAvailability === "true",
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

// Routes to get items by category
app.get("/get-women", async (req, res) => {
  try {
    const items = await Product.find({ itemCategory: "women" });
    res.json(items);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.get("/get-accessories", async (req, res) => {
  try {
    const items = await Product.find({ itemType: "accessories" });
    res.json(items);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.get("/get-men", async (req, res) => {
  try {
    const items = await Product.find({ itemCategory: "men" });
    res.json(items);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.get("/get-kids", async (req, res) => {
  try {
    const items = await Product.find({ itemCategory: "kids" });
    res.json(items);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

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

// Endpoint to get the users in the system
app.get("/api/users", async (req, res) => {
  try {
    const userData = await User.find();
    res.json({ userData });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Endpoint to get the products listed in the system
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
