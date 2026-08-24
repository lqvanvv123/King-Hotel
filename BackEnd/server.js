const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const bcrypt = require("bcryptjs");
require("dotenv").config();

const User = require("./models/User");
const Customer = require("./models/Customer");
const Room = require("./models/Room");
const Booking = require("./models/Booking");
const Payment = require("./models/Payment");
const Review = require("./models/Review");

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

async function seedDefaultAdmin() {
  const existingAdmin = await User.findOne({ username: "admin" });
  if (existingAdmin) {
    const changed = [];
    if (existingAdmin.role !== "admin") {
      existingAdmin.role = "admin";
      changed.push("role");
    }
    if (existingAdmin.status !== "active") {
      existingAdmin.status = "active";
      changed.push("status");
    }
    if (changed.length) {
      await existingAdmin.save();
    }
    return;
  }

  const hashedPassword = await bcrypt.hash("123", 10);
  await User.create({
    fullName: "Quản trị viên",
    username: "admin",
    email: "admin@hotel.local",
    password: hashedPassword,
    role: "admin",
    status: "active",
  });
  console.log("Đã tạo tài khoản admin mặc định: admin / 123");
}

async function seedRooms() {
  const count = await Room.countDocuments();
  if (count > 0) return;

  const sampleRooms = [
    {
      roomNumber: "101",
      type: "Standard",
      pricePerNight: 450000,
      capacity: 2,
      floor: 1,
      sizeSqm: 22,
      bedType: "Double",
      view: "City",
      amenities: ["WiFi", "TV", "Máy lạnh", "Nước nóng"],
      images: ["assets/rooms/standard-1.jpg"],
      imageUrl: "assets/rooms/standard-1.jpg",
      description: "Phòng tiêu chuẩn phù hợp cho cặp đôi hoặc khách công tác ngắn ngày.",
      housekeepingStatus: "clean",
    },
    {
      roomNumber: "102",
      type: "Standard",
      pricePerNight: 480000,
      capacity: 2,
      floor: 1,
      sizeSqm: 24,
      bedType: "Twin",
      view: "Garden",
      amenities: ["WiFi", "TV", "Máy lạnh", "Bàn làm việc"],
      images: ["assets/rooms/standard-2.jpg"],
      imageUrl: "assets/rooms/standard-2.jpg",
      description: "Phòng 2 giường đơn thoáng mát, phù hợp bạn bè hoặc đồng nghiệp.",
      housekeepingStatus: "clean",
    },
    {
      roomNumber: "201",
      type: "Deluxe",
      pricePerNight: 700000,
      capacity: 2,
      floor: 2,
      sizeSqm: 30,
      bedType: "Queen",
      view: "City",
      amenities: ["WiFi", "Smart TV", "Mini bar", "Bồn tắm"],
      images: ["assets/rooms/deluxe-1.jpg"],
      imageUrl: "assets/rooms/deluxe-1.jpg",
      description: "Phòng Deluxe cao cấp với nội thất hiện đại.",
      housekeepingStatus: "clean",
    },
    {
      roomNumber: "202",
      type: "Deluxe",
      pricePerNight: 760000,
      capacity: 3,
      floor: 2,
      sizeSqm: 32,
      bedType: "King",
      view: "Garden",
      amenities: ["WiFi", "Smart TV", "Mini bar", "Ban công"],
      images: ["assets/rooms/deluxe-3.jpg"],
      imageUrl: "assets/rooms/deluxe-3.jpg",
      description: "Phòng Deluxe view vườn, phù hợp nghỉ dưỡng.",
      discountPercent: 5,
      housekeepingStatus: "clean",
    },
    {
      roomNumber: "301",
      type: "Suite",
      pricePerNight: 1200000,
      capacity: 4,
      floor: 3,
      sizeSqm: 45,
      bedType: "King",
      view: "City",
      amenities: ["WiFi", "Smart TV", "Sofa", "Bồn tắm", "Mini bar"],
      images: ["assets/rooms/suite-1.jpg"],
      imageUrl: "assets/rooms/suite-1.jpg",
      description: "Phòng Suite rộng rãi cho gia đình nhỏ hoặc khách VIP.",
      housekeepingStatus: "clean",
    },
    {
      roomNumber: "302",
      type: "Suite",
      pricePerNight: 1350000,
      capacity: 4,
      floor: 3,
      sizeSqm: 48,
      bedType: "King",
      view: "River",
      amenities: ["WiFi", "Smart TV", "Sofa", "Máy pha cà phê", "Ban công"],
      images: ["assets/rooms/suite-2.jpg"],
      imageUrl: "assets/rooms/suite-2.jpg",
      description: "Suite cao cấp với tầm nhìn đẹp và nhiều tiện nghi.",
      housekeepingStatus: "clean",
    },
    {
      roomNumber: "401",
      type: "Family",
      pricePerNight: 1400000,
      capacity: 5,
      floor: 4,
      sizeSqm: 55,
      bedType: "Mixed",
      view: "City",
      amenities: ["WiFi", "2 TV", "Bếp nhỏ", "Bàn ăn", "Máy giặt"],
      images: ["assets/rooms/family-1.jpg"],
      imageUrl: "assets/rooms/family-1.jpg",
      description: "Phòng gia đình rộng rãi, tiện cho nhóm nhiều người.",
      housekeepingStatus: "clean",
    },
    {
      roomNumber: "402",
      type: "Family",
      pricePerNight: 1450000,
      capacity: 5,
      floor: 4,
      sizeSqm: 56,
      bedType: "Mixed",
      view: "Garden",
      amenities: ["WiFi", "2 TV", "Bếp nhỏ", "Tủ lạnh", "Ban công"],
      images: ["assets/rooms/family-2.jpg"],
      imageUrl: "assets/rooms/family-2.jpg",
      description: "Phòng Family thoải mái cho gia đình đi du lịch dài ngày.",
      status: "maintenance",
      housekeepingStatus: "dirty",
    },
  ];

  await Room.insertMany(sampleRooms);
  console.log("Đã tạo dữ liệu mẫu phòng.");
}

async function seedSampleData() {
  const customerCount = await Customer.countDocuments();
  if (customerCount > 0) return;

  const password = await bcrypt.hash("123456", 10);

  const customer1 = await Customer.create({
    fullName: "Nguyễn Ngọc Anh",
    email: "ngocanh@example.com",
    phone: "0909000001",
    idCard: "079123456001",
    address: "Thủ Đức, TP.HCM",
    gender: "female",
    nationality: "Việt Nam",
    loyaltyPoints: 120,
    customerType: "vip",
    note: "Khách quen, thích phòng yên tĩnh.",
  });

  const customer2 = await Customer.create({
    fullName: "Trần Minh Thư",
    email: "minhthu@example.com",
    phone: "0909000002",
    idCard: "079123456002",
    address: "Biên Hòa, Đồng Nai",
    gender: "male",
    nationality: "Việt Nam",
    loyaltyPoints: 20,
    customerType: "normal",
  });

  await User.insertMany([
    {
      fullName: customer1.fullName,
      email: customer1.email,
      password,
      role: "customer",
      status: "active",
      customerId: customer1._id,
    },
    {
      fullName: customer2.fullName,
      email: customer2.email,
      password,
      role: "customer",
      status: "active",
      customerId: customer2._id,
    },
  ]);

  const room101 = await Room.findOne({ roomNumber: "101" });
  const room201 = await Room.findOne({ roomNumber: "201" });

  if (room101 && room201) {
    const booking1 = await Booking.create({
      customerId: customer1._id,
      roomId: room101._id,
      checkInDate: new Date(),
      checkOutDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
      nights: 2,
      adults: 2,
      guestSummary: {
        fullName: customer1.fullName,
        phone: customer1.phone,
        email: customer1.email,
      },
      totalAmount: room101.pricePerNight * 2,
      paymentMethod: "Transfer",
      paymentStatus: "paid",
      source: "website",
      status: "confirmed",
      specialRequests: "Nhận phòng sớm nếu có thể",
    });

    const booking2 = await Booking.create({
      customerId: customer2._id,
      roomId: room201._id,
      checkInDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
      checkOutDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
      nights: 2,
      adults: 2,
      guestSummary: {
        fullName: customer2.fullName,
        phone: customer2.phone,
        email: customer2.email,
      },
      totalAmount: room201.pricePerNight * 2,
      paymentMethod: "Cash",
      paymentStatus: "paid",
      source: "website",
      status: "checked-out",
      note: "Khách đã lưu trú xong",
    });

    await Payment.insertMany([
      {
        bookingId: booking1._id,
        customerId: customer1._id,
        amount: booking1.totalAmount,
        method: "Transfer",
        status: "paid",
        transactionCode: "TXN-DEMO-001",
        paidAt: new Date(),
      },
      {
        bookingId: booking2._id,
        customerId: customer2._id,
        amount: booking2.totalAmount,
        method: "Cash",
        status: "paid",
        transactionCode: "CASH-DEMO-002",
        paidAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
      },
    ]);

    await Review.create({
      bookingId: booking2._id,
      customerId: customer2._id,
      roomId: room201._id,
      rating: 5,
      comment: "Phòng sạch sẽ, nhân viên hỗ trợ nhiệt tình.",
      status: "approved",
    });
  }

  console.log("Đã tạo dữ liệu mẫu khách hàng, đặt phòng, thanh toán và đánh giá.");
}

mongoose
  .connect(process.env.MONGO_URI || "mongodb://localhost:27017/HotelBookingDB")
  .then(async () => {
    console.log("Kết nối MongoDB thành công");
    await seedDefaultAdmin();
    await seedRooms();
    await seedSampleData();
  })
  .catch((err) => console.error("Lỗi kết nối MongoDB:", err));

const roomRoutes = require("./routes/rooms");
const customerRoutes = require("./routes/customers");
const bookingRoutes = require("./routes/bookings");
const authRoutes = require("./routes/auth");
const dashboardRoutes = require("./routes/dashboard");
const paymentRoutes = require("./routes/payments");
const reviewRoutes = require("./routes/reviews");
const { protect } = require("./middleware/auth");

app.use("/api/auth", authRoutes);
app.use("/api/rooms", protect, roomRoutes);
app.use("/api/customers", protect, customerRoutes);
app.use("/api/bookings", protect, bookingRoutes);
app.use("/api/dashboard", protect, dashboardRoutes);
app.use("/api/payments", protect, paymentRoutes);
app.use("/api/reviews", protect, reviewRoutes);

app.get("/", (req, res) => {
  res.json({ message: "Hotel Booking API Server" });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server đang chạy tại http://localhost:${PORT}`);
});
