const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    fullName: {
      type: String,
      required: [true, "Vui lòng nhập họ tên"],
      trim: true,
    },
    username: {
      type: String,
      unique: true,
      sparse: true,
      trim: true,
      lowercase: true,
    },
    email: {
      type: String,
      required: [true, "Vui lòng nhập email"],
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: [true, "Vui lòng nhập mật khẩu"],
      minlength: [3, "Mật khẩu phải có ít nhất 3 ký tự"],
    },
    role: {
      type: String,
      enum: ["admin", "staff", "customer"],
      default: "customer",
    },
    status: {
      type: String,
      enum: ["active", "inactive", "locked"],
      default: "active",
    },
    customerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Customer",
      default: null,
    },
    lastLoginAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  },
);

userSchema.index({ role: 1, status: 1 });

module.exports = mongoose.model("User", userSchema);
