const mongoose = require("mongoose");

const roomSchema = new mongoose.Schema(
  {
    roomNumber: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    type: {
      type: String,
      required: true,
      enum: ["Standard", "Deluxe", "Suite", "Family"],
      default: "Standard",
    },
    pricePerNight: {
      type: Number,
      required: true,
      min: 0,
    },
    capacity: {
      type: Number,
      required: true,
      min: 1,
      max: 10,
    },
    floor: {
      type: Number,
      min: 1,
      default: 1,
    },
    sizeSqm: {
      type: Number,
      min: 1,
      default: 22,
    },
    bedType: {
      type: String,
      enum: ["Single", "Double", "Queen", "King", "Twin", "Mixed"],
      default: "Double",
    },
    view: {
      type: String,
      trim: true,
      default: "City",
    },
    amenities: [
      {
        type: String,
        trim: true,
      },
    ],
    images: [
      {
        type: String,
        trim: true,
      },
    ],
    status: {
      type: String,
      enum: ["available", "booked", "occupied", "maintenance"],
      default: "available",
    },
    description: {
      type: String,
      maxlength: 500,
      default: "",
    },
    imageUrl: {
      type: String,
      default: "/images/default-room.jpg",
    },
    discountPercent: {
      type: Number,
      min: 0,
      max: 100,
      default: 0,
    },
    isSmokingAllowed: {
      type: Boolean,
      default: false,
    },
    housekeepingStatus: {
      type: String,
      enum: ["clean", "dirty", "in-progress"],
      default: "clean",
    },
    detailTitle: {
      type: String,
      trim: true,
      default: "",
    },
    highlights: [
      {
        type: String,
        trim: true,
      },
    ],
    roomFeatures: [
      {
        type: String,
        trim: true,
      },
    ],
    bathroomFeatures: [
      {
        type: String,
        trim: true,
      },
    ],
    policies: [
      {
        type: String,
        trim: true,
      },
    ],
    checkInTime: {
      type: String,
      trim: true,
      default: "14:00",
    },
    checkOutTime: {
      type: String,
      trim: true,
      default: "12:00",
    },
    breakfastIncluded: {
      type: Boolean,
      default: false,
    },
    cancellationPolicy: {
      type: String,
      trim: true,
      default: "Miễn phí hủy trước 24 giờ.",
    },
    extraServices: [
      {
        type: String,
        trim: true,
      },
    ],
  },
  {
    timestamps: true,
  },
);

roomSchema.index({ status: 1, type: 1, pricePerNight: 1 });
roomSchema.index({ capacity: 1, floor: 1 });

module.exports = mongoose.model("Room", roomSchema);
