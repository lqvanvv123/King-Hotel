const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
require("dotenv").config();

const User = require("./models/User");
const Customer = require("./models/Customer");
const Room = require("./models/Room");
const Booking = require("./models/Booking");
const Payment = require("./models/Payment");
const Review = require("./models/Review");
const availableRooms = require("./data/availableRooms.json");

async function runSeed() {
  await mongoose.connect(
    process.env.MONGO_URI ||
      "mongodb+srv://vanvang100624_db_user:gWepNKs1YY0V27ql@cluster0.cvufiq1.mongodb.net/HotelBookingDB",
  );
  console.log("Đã kết nối MongoDB để seed dữ liệu");

  await Promise.all([
    Payment.deleteMany({}),
    Review.deleteMany({}),
    Booking.deleteMany({}),
    User.deleteMany({}),
    Customer.deleteMany({}),
    Room.deleteMany({}),
  ]);

  const adminPassword = await bcrypt.hash("123", 10);
  await User.create({
    fullName: "Quản trị viên",
    username: "admin",
    email: "admin@hotel.local",
    password: adminPassword,
    role: "admin",
    status: "active",
  });

  const customerPassword = await bcrypt.hash("123456", 10);

  const baseRooms = [
    {
      roomNumber: "101",
      type: "Standard",
      pricePerNight: 450000,
      capacity: 2,
      floor: 1,
      sizeSqm: 22,
      bedType: "Double",
      view: "City",
      amenities: ["WiFi", "TV", "Máy lạnh"],
      imageUrl: "assets/rooms/standard-1.jpg",
      housekeepingStatus: "clean",
      status: "booked",
      detailTitle: "Standard Compact",
      highlights: ["Thiết kế tối giản", "Phù hợp ở ngắn ngày"],
      roomFeatures: ["TV", "Máy lạnh"],
      bathroomFeatures: ["Vòi sen", "Nước nóng"],
      policies: ["Không hút thuốc"],
      checkInTime: "14:00",
      checkOutTime: "12:00",
      breakfastIncluded: false,
      cancellationPolicy: "Hủy trước 24 giờ.",
      extraServices: ["Giặt ủi"],
    },
    {
      roomNumber: "201",
      type: "Deluxe",
      pricePerNight: 700000,
      capacity: 2,
      floor: 2,
      sizeSqm: 30,
      bedType: "Queen",
      view: "Garden",
      amenities: ["WiFi", "Smart TV", "Mini bar"],
      imageUrl: "assets/rooms/deluxe-1.jpg",
      housekeepingStatus: "clean",
      status: "occupied",
      detailTitle: "Deluxe Garden",
      highlights: ["Yên tĩnh", "Nội thất hiện đại"],
      roomFeatures: ["Mini bar", "Smart TV"],
      bathroomFeatures: ["Buồng tắm kính"],
      policies: ["Không hút thuốc"],
      checkInTime: "14:00",
      checkOutTime: "12:00",
      breakfastIncluded: true,
      cancellationPolicy: "Hủy trước 24 giờ.",
      extraServices: ["Đưa đón sân bay"],
    },
    {
      roomNumber: "301",
      type: "Suite",
      pricePerNight: 1200000,
      capacity: 4,
      floor: 3,
      sizeSqm: 45,
      bedType: "King",
      view: "River",
      amenities: ["WiFi", "Sofa", "Bồn tắm"],
      imageUrl: "assets/rooms/suite-1.jpg",
      housekeepingStatus: "clean",
      status: "maintenance",
      detailTitle: "Suite River",
      highlights: ["Rộng rãi", "View sông"],
      roomFeatures: ["Sofa", "Bồn tắm"],
      bathroomFeatures: ["Bồn tắm nằm"],
      policies: ["Không hút thuốc"],
      checkInTime: "14:00",
      checkOutTime: "12:00",
      breakfastIncluded: true,
      cancellationPolicy: "Hủy trước 48 giờ.",
      extraServices: ["Late check-out"],
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
      amenities: ["WiFi", "2 TV", "Bếp nhỏ"],
      imageUrl: "assets/rooms/family-1.jpg",
      housekeepingStatus: "clean",
      status: "occupied",
      detailTitle: "Family City",
      highlights: ["Cho gia đình", "Không gian lớn"],
      roomFeatures: ["2 TV", "Bếp nhỏ"],
      bathroomFeatures: ["Phòng tắm rộng"],
      policies: ["Không hút thuốc"],
      checkInTime: "14:00",
      checkOutTime: "12:00",
      breakfastIncluded: true,
      cancellationPolicy: "Hủy trước 48 giờ.",
      extraServices: ["Nôi em bé"],
    },
  ];

  const rooms = await Room.insertMany([...baseRooms, ...availableRooms]);

  const customer = await Customer.create({
    fullName: "Nguyễn Ngọc Anh",
    email: "ngocanh@example.com",
    phone: "0909000001",
    idCard: "079123456001",
    address: "Thủ Đức, TP.HCM",
    customerType: "vip",
    loyaltyPoints: 120,
  });

  await User.create({
    fullName: customer.fullName,
    email: customer.email,
    password: customerPassword,
    role: "customer",
    status: "active",
    customerId: customer._id,
  });

  const booking = await Booking.create({
    customerId: customer._id,
    roomId: rooms[0]._id,
    checkInDate: new Date(),
    checkOutDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
    nights: 2,
    adults: 2,
    guestSummary: {
      fullName: customer.fullName,
      phone: customer.phone,
      email: customer.email,
    },
    totalAmount: rooms[0].pricePerNight * 2,
    paymentMethod: "Transfer",
    paymentStatus: "paid",
    source: "website",
    status: "confirmed",
  });

  await Payment.create({
    bookingId: booking._id,
    customerId: customer._id,
    amount: booking.totalAmount,
    method: "Transfer",
    status: "paid",
    transactionCode: "TXN-SEED-001",
    paidAt: new Date(),
  });

  console.log(
    `Seed thành công. Tổng phòng: ${rooms.length}, phòng trống: ${availableRooms.length}`,
  );
  console.log("Admin: admin / 123");
  console.log("Khách hàng mẫu: ngocanh@example.com / 123456");
  await mongoose.disconnect();
}

runSeed().catch(async (error) => {
  console.error("Seed thất bại:", error);
  await mongoose.disconnect();
  process.exit(1);
});
