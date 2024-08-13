// models/Product.js
import mongoose from "mongoose";

const productSchema = new mongoose.Schema({
  itemName: { type: String, required: true },
  itemDescription: { type: String, required: true },
  itemAvailability: { type: Boolean, required: true },
  itemBrand: { type: String, required: true },
  itemCategory: { type: String, required: true },
  itemType: { type: String, required: true },
  itemPrice: { type: String, required: true }, // You may want to use Number for price
  itemImages: [{ type: String }], // Array of image URLs
});

export const Product = mongoose.model("Product", productSchema);
