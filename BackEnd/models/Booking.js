const mongoose = require("mongoose");

const guestSummarySchema = new mongoose.Schema(
  {
    fullName: { type: String, trim: true, default: "" },
    phone: { type: String, trim: true, default: "" },
    email: { type: String, trim: true, default: "" },
  },
  { _id: false },
);

const bookingSchema = new mongoose.Schema(
  {
    bookingCode: {
      type: String,
      unique: true,
      trim: true,
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
    checkInDate: {
      type: Date,
      required: true,
    },
    checkOutDate: {
      type: Date,
      required: true,
      validate: {
        validator: function (value) {
          return value > this.checkInDate;
        },
        message: "Ngày trả phòng phải sau ngày nhận phòng",
      },
    },
    nights: {
      type: Number,
      min: 1,
      default: 1,
    },
    adults: {
      type: Number,
      min: 1,
      default: 1,
    },
    children: {
      type: Number,
      min: 0,
      default: 0,
    },
    guestSummary: {
      type: guestSummarySchema,
      default: () => ({}),
    },
    totalAmount: {
      type: Number,
      required: true,
      min: 0,
    },
    depositAmount: {
      type: Number,
      min: 0,
      default: 0,
    },
    paymentMethod: {
      type: String,
      enum: ["Cash", "Card", "Transfer"],
      default: "Cash",
    },
    paymentStatus: {
      type: String,
      enum: ["unpaid", "partial", "paid", "refunded"],
      default: "unpaid",
    },
    source: {
      type: String,
      enum: ["website", "walk-in", "phone", "agency"],
      default: "website",
    },
    status: {
      type: String,
      enum: ["pending", "confirmed", "checked-in", "checked-out", "cancelled"],
      default: "pending",
    },
    specialRequests: {
      type: String,
      trim: true,
      default: "",
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

bookingSchema.index({ roomId: 1, checkInDate: 1, checkOutDate: 1, status: 1 });
bookingSchema.index({ customerId: 1, createdAt: -1 });
bookingSchema.index({ bookingCode: 1 });

bookingSchema.pre("validate", async function (next) {
  try {
    const diff = new Date(this.checkOutDate) - new Date(this.checkInDate);
    const nights = Math.ceil(diff / (1000 * 60 * 60 * 24));
    if (nights > 0) {
      this.nights = nights;
    }

    if (!this.bookingCode) {
      const date = new Date();
      const y = date.getFullYear();
      const m = String(date.getMonth() + 1).padStart(2, "0");
      const d = String(date.getDate()).padStart(2, "0");
      const random = Math.random().toString(36).slice(2, 7).toUpperCase();
      this.bookingCode = `BK${y}${m}${d}-${random}`;
    }

    next();
  } catch (error) {
    next(error);
  }
});

module.exports = mongoose.model("Booking", bookingSchema);
