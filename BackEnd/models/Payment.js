const mongoose = require("mongoose");

const paymentSchema = new mongoose.Schema(
  {
    bookingId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Booking",
      required: true,
    },
    customerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Customer",
      required: true,
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    method: {
      type: String,
      enum: ["Cash", "Card", "Transfer"],
      default: "Cash",
    },
    status: {
      type: String,
      enum: ["pending", "paid", "failed", "refunded"],
      default: "pending",
    },
    transactionCode: {
      type: String,
      trim: true,
      default: "",
    },
    paidAt: {
      type: Date,
      default: null,
    },
    note: {
      type: String,
      trim: true,
      default: "",
    },
  },
  { timestamps: true },
);

paymentSchema.index({ bookingId: 1, status: 1 });
paymentSchema.index({ customerId: 1, createdAt: -1 });

module.exports = mongoose.model("Payment", paymentSchema);
