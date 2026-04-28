// const mongoose = require("mongoose");

// const userSchema = new mongoose.Schema(
//   {
//     phone: {
//       type: String,
//       required: [true, "Phone number is required"],
//       unique: true,
//       trim: true,
//       match: [/^\d{10}$/, "Phone must be a 10-digit number"],
//       index: true,
//     },
//     name: {
//       type: String,
//       trim: true,
//       maxlength: [60, "Name cannot exceed 60 characters"],
//       default: "",
//     },
//     email: {
//       type: String,
//       trim: true,
//       lowercase: true,
//       match: [/^\S+@\S+\.\S+$/, "Invalid email format"],
//       default: "",
//     },
//     role: {
//       type: String,
//       enum: ["user", "admin"],
//       default: "user",
//     },
//     isVerified: { type: Boolean, default: false },
//     isActive: { type: Boolean, default: true },
//     // Only for admin users — hashed password
//     password: { type: String, select: false },
//     // Address for orders
//     address: {
//       line1: { type: String, default: "" },
//       city: { type: String, default: "" },
//       state: { type: String, default: "" },
//       pincode: { type: String, default: "" },
//     },
//   },
//   {
//     timestamps: true,
//     toJSON: { virtuals: true },
//   }
// );

// module.exports = mongoose.model("User", userSchema);


const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    phone: {
      type: String,
      required: [true, "Phone number is required"],
      unique: true,
      trim: true,
      match: [/^[6-9]\d{9}$/, "Phone must be a valid 10-digit Indian mobile number"],
      index: true,
    },
    name: {
      type: String,
      trim: true,
      maxlength: [60, "Name cannot exceed 60 characters"],
      default: "",
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
      match: [/^\S+@\S+\.\S+$/, "Invalid email format"],
      default: "",
    },
    role: {
      type: String,
      enum: ["user", "admin"],
      default: "user",
    },
    isVerified: { type: Boolean, default: false },
    isActive:   { type: Boolean, default: true },
    // Firebase UID — stored for reference, not used for auth on backend
    firebaseUid: { type: String, default: "" },
    // Only used by admin accounts
    password: { type: String, select: false },
    address: {
      line1:   { type: String, default: "" },
      city:    { type: String, default: "" },
      state:   { type: String, default: "" },
      pincode: { type: String, default: "" },
    },
  },
  { timestamps: true, toJSON: { virtuals: true } }
);

module.exports = mongoose.model("User", userSchema);