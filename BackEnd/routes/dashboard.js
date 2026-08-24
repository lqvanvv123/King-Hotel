const express = require("express");
const router = express.Router();
const Room = require("../models/Room");
const Booking = require("../models/Booking");
const Customer = require("../models/Customer");
const Payment = require("../models/Payment");
const Review = require("../models/Review");

router.get("/stats", async (req, res) => {
  try {
    const [rooms, bookings, totalCustomers, payments, reviews] = await Promise.all([
      Room.find(),
      Booking.find(),
      Customer.countDocuments(),
      Payment.find(),
      Review.find({ status: "approved" }),
    ]);

    const totalRooms = rooms.length;
    const availableRooms = rooms.filter((r) => r.status === "available").length;
    const bookedRooms = rooms.filter((r) => r.status === "booked").length;
    const occupiedRooms = rooms.filter((r) => r.status === "occupied").length;
    const maintenanceRooms = rooms.filter((r) => r.status === "maintenance").length;

    const totalBookings = bookings.length;
    const activeBookings = bookings.filter((b) => ["confirmed", "checked-in"].includes(b.status)).length;

    const totalRevenue = payments
      .filter((p) => p.status === "paid")
      .reduce((sum, p) => sum + (p.amount || 0), 0);

    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    const monthlyRevenue = payments
      .filter((p) => {
        if (p.status !== "paid") return false;
        const revenueDate = p.paidAt ? new Date(p.paidAt) : new Date(p.createdAt);
        return revenueDate.getMonth() === currentMonth && revenueDate.getFullYear() === currentYear;
      })
      .reduce((sum, p) => sum + (p.amount || 0), 0);

    const averageRating = reviews.length
      ? Number((reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length).toFixed(1))
      : 0;

    const occupancyRate = totalRooms ? Number((((bookedRooms + occupiedRooms) / totalRooms) * 100).toFixed(1)) : 0;
    const pendingPayments = payments.filter((p) => p.status === "pending").length;

    res.json({
      totalRooms,
      availableRooms,
      bookedRooms,
      occupiedRooms,
      maintenanceRooms,
      totalCustomers,
      totalBookings,
      activeBookings,
      totalRevenue,
      monthlyRevenue,
      occupancyRate,
      pendingPayments,
      averageRating,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
