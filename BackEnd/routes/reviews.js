const express = require("express");
const Review = require("../models/Review");
const Booking = require("../models/Booking");
const { authorize } = require("../middleware/auth");

const router = express.Router();

router.get("/", async (req, res) => {
  try {
    const filter = {};
    if (req.user.role === "customer") {
      filter.customerId = req.user.customerId;
    }

    const reviews = await Review.find(filter)
      .populate("customerId", "fullName")
      .populate("roomId", "roomNumber type")
      .populate("bookingId", "bookingCode status")
      .sort({ createdAt: -1 });

    res.json(reviews);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.post("/", authorize("customer"), async (req, res) => {
  try {
    const { bookingId, rating, comment } = req.body;

    const booking = await Booking.findById(bookingId);
    if (!booking) {
      return res.status(404).json({ message: "Không tìm thấy đơn đặt phòng" });
    }

    if (String(booking.customerId) !== String(req.user.customerId)) {
      return res.status(403).json({ message: "Bạn không có quyền đánh giá đơn này" });
    }

    if (booking.status !== "checked-out") {
      return res.status(400).json({ message: "Chỉ có thể đánh giá sau khi đã trả phòng" });
    }

    const review = await Review.create({
      bookingId,
      customerId: req.user.customerId,
      roomId: booking.roomId,
      rating,
      comment: comment || "",
    });

    res.status(201).json(review);
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ message: "Đơn đặt phòng này đã được đánh giá rồi" });
    }
    res.status(400).json({ message: error.message });
  }
});

router.put("/:id/status", authorize("admin", "staff"), async (req, res) => {
  try {
    const { status } = req.body;
    if (!["pending", "approved", "hidden"].includes(status)) {
      return res.status(400).json({ message: "Trạng thái đánh giá không hợp lệ" });
    }

    const review = await Review.findByIdAndUpdate(req.params.id, { status }, { new: true, runValidators: true });
    if (!review) {
      return res.status(404).json({ message: "Không tìm thấy đánh giá" });
    }

    res.json(review);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

module.exports = router;
