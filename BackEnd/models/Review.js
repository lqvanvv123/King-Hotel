const mongoose = require("mongoose");

const reviewSchema = new mongoose.Schema(
  {
    bookingId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Booking",
      required: true,
      unique: true,
    },
    customerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Customer",
      required: true,
    },
    roomId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Room",
      required: true,
    },
    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
    },
    comment: {
      type: String,
      trim: true,
      maxlength: 1000,
      default: "",
    },
    status: {
      type: String,
      enum: ["pending", "approved", "hidden"],
      default: "approved",
    },
  },
  { timestamps: true },
);

reviewSchema.index({ roomId: 1, rating: -1, createdAt: -1 });
reviewSchema.index({ customerId: 1, createdAt: -1 });

module.exports = mongoose.model("Review", reviewSchema);
