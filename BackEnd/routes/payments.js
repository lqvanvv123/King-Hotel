const express = require("express");
const Payment = require("../models/Payment");
const Booking = require("../models/Booking");
const { authorize } = require("../middleware/auth");

const router = express.Router();

router.get("/", async (req, res) => {
  try {
    const filter = {};
    if (req.user.role === "customer") {
      filter.customerId = req.user.customerId;
    }

    const payments = await Payment.find(filter)
      .populate({ path: "bookingId", select: "bookingCode checkInDate checkOutDate totalAmount status roomId", populate: { path: "roomId", select: "roomNumber type" } })
      .populate("customerId", "fullName email phone")
      .sort({ createdAt: -1 });

    res.json(payments);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const payment = await Payment.findById(req.params.id)
      .populate({ path: "bookingId", populate: [{ path: "roomId", select: "roomNumber type" }, { path: "customerId", select: "fullName email phone" }] })
      .populate("customerId", "fullName email phone");

    if (!payment) {
      return res.status(404).json({ message: "Không tìm thấy thanh toán" });
    }

    if (req.user.role === "customer" && String(payment.customerId?._id || payment.customerId) !== String(req.user.customerId)) {
      return res.status(403).json({ message: "Bạn không có quyền xem thanh toán này" });
    }

    res.json(payment);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.post("/", authorize("admin", "staff"), async (req, res) => {
  try {
    const { bookingId, amount, method, status, transactionCode, note } = req.body;
    const booking = await Booking.findById(bookingId);
    if (!booking) {
      return res.status(404).json({ message: "Không tìm thấy đơn đặt phòng" });
    }

    const payment = await Payment.create({
      bookingId,
      customerId: booking.customerId,
      amount,
      method: method || booking.paymentMethod,
      status: status || "pending",
      transactionCode: transactionCode || "",
      paidAt: status === "paid" ? new Date() : null,
      note: note || "",
    });

    res.status(201).json(payment);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

router.put("/:id/status", authorize("admin", "staff"), async (req, res) => {
  try {
    const { status, transactionCode, note } = req.body;
    const allowed = ["pending", "paid", "failed", "refunded"];
    if (!allowed.includes(status)) {
      return res.status(400).json({ message: "Trạng thái thanh toán không hợp lệ" });
    }

    const payment = await Payment.findById(req.params.id);
    if (!payment) {
      return res.status(404).json({ message: "Không tìm thấy thanh toán" });
    }

    payment.status = status;
    if (typeof transactionCode === "string") payment.transactionCode = transactionCode;
    if (typeof note === "string") payment.note = note;
    payment.paidAt = status === "paid" ? new Date() : payment.paidAt;
    await payment.save();

    const booking = await Booking.findById(payment.bookingId);
    if (booking) {
      if (status === "paid") booking.paymentStatus = "paid";
      else if (status === "refunded") booking.paymentStatus = "refunded";
      else booking.paymentStatus = "unpaid";
      await booking.save();
    }

    res.json(payment);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

module.exports = router;
