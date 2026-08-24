const mongoose = require("mongoose");

const emergencyContactSchema = new mongoose.Schema(
  {
    name: { type: String, trim: true, default: "" },
    phone: { type: String, trim: true, default: "" },
    relation: { type: String, trim: true, default: "" },
  },
  { _id: false },
);

const customerSchema = new mongoose.Schema(
  {
    fullName: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      match: [
        /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
        "Email không hợp lệ",
      ],
    },
    phone: {
      type: String,
      required: true,
      trim: true,
    },
    idCard: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    address: {
      type: String,
      trim: true,
      default: "",
    },
    gender: {
      type: String,
      enum: ["male", "female", "other"],
      default: "other",
    },
    dateOfBirth: {
      type: Date,
      default: null,
    },
    nationality: {
      type: String,
      trim: true,
      default: "Việt Nam",
    },
    loyaltyPoints: {
      type: Number,
      min: 0,
      default: 0,
    },
    customerType: {
      type: String,
      enum: ["normal", "vip", "corporate"],
      default: "normal",
    },
    emergencyContact: {
      type: emergencyContactSchema,
      default: () => ({}),
    },
    note: {
      type: String,
      trim: true,
      default: "",
    },
  },
  {
    timestamps: true,
  },
);

customerSchema.index({ fullName: 1, phone: 1 });
customerSchema.index({ customerType: 1, loyaltyPoints: -1 });

module.exports = mongoose.model("Customer", customerSchema);
