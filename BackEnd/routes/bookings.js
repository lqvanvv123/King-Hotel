const express = require("express");
const router = express.Router();
const Booking = require("../models/Booking");
const Room = require("../models/Room");
const Customer = require("../models/Customer");
const Payment = require("../models/Payment");
const { authorize } = require("../middleware/auth");

function calculateNights(checkInDate, checkOutDate) {
  return Math.ceil((new Date(checkOutDate) - new Date(checkInDate)) / (1000 * 60 * 60 * 24));
}

async function hasDateConflict(roomId, checkInDate, checkOutDate, excludeBookingId = null) {
  const filter = {
    roomId,
    status: { $in: ["confirmed", "checked-in"] },
    checkInDate: { $lt: new Date(checkOutDate) },
    checkOutDate: { $gt: new Date(checkInDate) },
  };
  if (excludeBookingId) filter._id = { $ne: excludeBookingId };
  return Booking.findOne(filter);
}

async function syncRoomStatus(roomId) {
  const room = await Room.findById(roomId);
  if (!room || room.status === "maintenance") return;

  const checkedInBooking = await Booking.findOne({ roomId, status: "checked-in" });
  if (checkedInBooking) {
    room.status = "occupied";
    await room.save();
    return;
  }

  const confirmedBooking = await Booking.findOne({ roomId, status: "confirmed" });
  room.status = confirmedBooking ? "booked" : "available";
  await room.save();
}

router.get("/", async (req, res) => {
  try {
    const filter = {};
    if (req.user.role === "customer") {
      filter.customerId = req.user.customerId;
    }

    const bookings = await Booking.find(filter)
      .populate("customerId", "fullName email phone customerType loyaltyPoints")
      .populate("roomId", "roomNumber type pricePerNight capacity floor")
      .sort({ createdAt: -1 });
    res.json(bookings);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id).populate("customerId").populate("roomId");
    if (!booking) return res.status(404).json({ message: "Không tìm thấy đơn đặt phòng" });

    if (req.user.role === "customer" && String(booking.customerId?._id) !== String(req.user.customerId)) {
      return res.status(403).json({ message: "Bạn không có quyền xem đơn đặt phòng này" });
    }

    res.json(booking);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.post("/", async (req, res) => {
  try {
    const { customerId, roomId, checkInDate, checkOutDate, paymentMethod, adults, children, specialRequests } = req.body;
    const bookingCustomerId = req.user.role === "customer" ? req.user.customerId : customerId;

    if (!bookingCustomerId || !roomId || !checkInDate || !checkOutDate) {
      return res.status(400).json({ message: "Vui lòng nhập đầy đủ thông tin đặt phòng" });
    }

    const nights = calculateNights(checkInDate, checkOutDate);
    if (nights <= 0) return res.status(400).json({ message: "Ngày trả phòng phải sau ngày nhận phòng" });

    const room = await Room.findById(roomId);
    if (!room) return res.status(404).json({ message: "Không tìm thấy phòng" });
    if (room.status === "maintenance") return res.status(400).json({ message: "Phòng đang bảo trì, không thể đặt" });

    const customer = await Customer.findById(bookingCustomerId);
    if (!customer) return res.status(404).json({ message: "Không tìm thấy khách hàng" });

    const conflict = await hasDateConflict(roomId, checkInDate, checkOutDate);
    if (conflict) return res.status(400).json({ message: "Phòng đã được đặt trong khoảng thời gian này" });

    const discount = room.discountPercent ? room.pricePerNight * nights * (room.discountPercent / 100) : 0;
    const totalAmount = room.pricePerNight * nights - discount;

    const booking = new Booking({
      customerId: bookingCustomerId,
      roomId,
      checkInDate: new Date(checkInDate),
      checkOutDate: new Date(checkOutDate),
      nights,
      adults: Number(adults || 1),
      children: Number(children || 0),
      guestSummary: {
        fullName: customer.fullName,
        phone: customer.phone,
        email: customer.email,
      },
      totalAmount,
      depositAmount: 0,
      paymentMethod: paymentMethod || "Cash",
      paymentStatus: "unpaid",
      source: req.user.role === "customer" ? "website" : "walk-in",
      status: "confirmed",
      specialRequests: specialRequests || "",
    });

    const newBooking = await booking.save();
    await syncRoomStatus(roomId);

    await Payment.create({
      bookingId: newBooking._id,
      customerId: bookingCustomerId,
      amount: totalAmount,
      method: paymentMethod || "Cash",
      status: "pending",
      note: "Thanh toán được tạo tự động cùng đơn đặt phòng",
    });

    const populatedBooking = await Booking.findById(newBooking._id)
      .populate("customerId", "fullName email phone customerType loyaltyPoints")
      .populate("roomId", "roomNumber type pricePerNight");

    res.status(201).json(populatedBooking);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

router.put("/:id", authorize("admin", "staff"), async (req, res) => {
  try {
    const { status } = req.body;
    const allowedStatuses = ["pending", "confirmed", "checked-in", "checked-out", "cancelled"];
    if (!allowedStatuses.includes(status)) return res.status(400).json({ message: "Trạng thái đặt phòng không hợp lệ" });

    const booking = await Booking.findById(req.params.id);
    if (!booking) return res.status(404).json({ message: "Không tìm thấy đơn đặt phòng" });

    if (status === "checked-in") {
      const conflict = await hasDateConflict(booking.roomId, booking.checkInDate, booking.checkOutDate, booking._id);
      if (conflict) return res.status(400).json({ message: "Không thể check-in vì phòng bị trùng lịch" });
    }

    booking.status = status;
    await booking.save();
    await syncRoomStatus(booking.roomId);

    if (status === "checked-out") {
      await Payment.updateMany(
        { bookingId: booking._id, status: { $in: ["pending", "failed"] } },
        {
          $set: {
            status: "paid",
            paidAt: new Date(),
          },
        }
      );

      const latestPayment = await Payment.findOne({ bookingId: booking._id }).sort({ createdAt: -1 });
      if (latestPayment) {
        latestPayment.status = "paid";
        latestPayment.paidAt = latestPayment.paidAt || new Date();
        latestPayment.note = latestPayment.note
          ? `${latestPayment.note} | Tự động xác nhận thanh toán khi check-out`
          : "Tự động xác nhận thanh toán khi check-out";
        await latestPayment.save();
      }

      booking.paymentStatus = "paid";
      await booking.save();
    }

    if (status === "cancelled") {
      await Payment.updateMany(
        { bookingId: booking._id, status: { $in: ["pending", "failed"] } },
        {
          $set: {
            status: "refunded",
            note: "Đơn đặt phòng đã bị hủy",
          },
        }
      );
      booking.paymentStatus = "refunded";
      await booking.save();
    }

    const updatedBooking = await Booking.findById(booking._id)
      .populate("customerId", "fullName email phone")
      .populate("roomId", "roomNumber type pricePerNight");

    res.json(updatedBooking);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

router.delete("/:id", authorize("admin"), async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);
    if (!booking) return res.status(404).json({ message: "Không tìm thấy đơn đặt phòng" });

    const roomId = booking.roomId;
    await Payment.deleteMany({ bookingId: booking._id });
    await Booking.findByIdAndDelete(req.params.id);
    await syncRoomStatus(roomId);

    res.json({ message: "Đã xóa đơn đặt phòng thành công" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
