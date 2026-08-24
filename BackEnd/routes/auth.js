const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const Customer = require("../models/Customer");
const { protect, authorize } = require("../middleware/auth");

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || "hotel_manager_secret_key";

function createToken(user) {
  return jwt.sign(
    {
      id: user._id,
      email: user.email,
      role: user.role,
      customerId: user.customerId || null,
    },
    JWT_SECRET,
    {
      expiresIn: "1d",
    },
  );
}

router.post("/register", async (req, res) => {
  try {
    const { fullName, email, phone, idCard, address, password, confirmPassword } = req.body;

    if (!fullName || !email || !phone || !idCard || !password || !confirmPassword) {
      return res.status(400).json({ message: "Vui lòng nhập đầy đủ thông tin" });
    }

    if (password.length < 6) {
      return res.status(400).json({ message: "Mật khẩu phải có ít nhất 6 ký tự" });
    }

    if (password !== confirmPassword) {
      return res.status(400).json({ message: "Mật khẩu xác nhận không khớp" });
    }

    const normalizedEmail = email.toLowerCase().trim();

    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) {
      return res.status(400).json({ message: "Email này đã được đăng ký" });
    }

    const existingCustomer = await Customer.findOne({
      $or: [{ email: normalizedEmail }, { idCard: idCard.trim() }],
    });

    if (existingCustomer) {
      return res.status(400).json({
        message:
          existingCustomer.email === normalizedEmail
            ? "Email này đã tồn tại trong hồ sơ khách hàng"
            : "Số CMND/CCCD đã tồn tại",
      });
    }

    const customer = new Customer({
      fullName: fullName.trim(),
      email: normalizedEmail,
      phone: phone.trim(),
      idCard: idCard.trim(),
      address: address?.trim() || "",
    });
    await customer.save();

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new User({
      fullName: fullName.trim(),
      email: normalizedEmail,
      password: hashedPassword,
      role: "customer",
      status: "active",
      customerId: customer._id,
    });
    await user.save();

    res.status(201).json({
      message: "Đăng ký tài khoản khách hàng thành công",
      user: {
        id: user._id,
        fullName: user.fullName,
        email: user.email,
        role: user.role,
        customerId: user.customerId,
      },
    });
  } catch (error) {
    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern || {})[0];
      if (field === "email") {
        return res.status(400).json({ message: "Email này đã được đăng ký" });
      }
      if (field === "idCard") {
        return res.status(400).json({ message: "Số CMND/CCCD đã tồn tại" });
      }
    }

    res.status(500).json({ message: "Lỗi server khi đăng ký", error: error.message });
  }
});

router.post("/login", async (req, res) => {
  try {
    const { identifier, email, password } = req.body;
    const loginValue = (identifier || email || "").trim().toLowerCase();

    if (!loginValue || !password) {
      return res.status(400).json({ message: "Vui lòng nhập tài khoản và mật khẩu" });
    }

    const user = await User.findOne({
      $or: [{ email: loginValue }, { username: loginValue }],
    });

    if (!user) {
      return res.status(400).json({ message: "Tài khoản hoặc mật khẩu không đúng" });
    }

    if (user.status !== "active") {
      return res.status(403).json({ message: "Tài khoản đang bị khóa hoặc ngưng hoạt động" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Tài khoản hoặc mật khẩu không đúng" });
    }

    user.lastLoginAt = new Date();
    await user.save();

    const token = createToken(user);

    res.json({
      message: "Đăng nhập thành công",
      token,
      user: {
        id: user._id,
        fullName: user.fullName,
        username: user.username,
        email: user.email,
        role: user.role,
        customerId: user.customerId || null,
        status: user.status,
      },
    });
  } catch (error) {
    res.status(500).json({ message: "Lỗi server khi đăng nhập", error: error.message });
  }
});

router.get("/me", protect, (req, res) => {
  res.json({
    id: req.user._id,
    fullName: req.user.fullName,
    username: req.user.username,
    email: req.user.email,
    role: req.user.role,
    status: req.user.status,
    customerId: req.user.customerId || null,
    lastLoginAt: req.user.lastLoginAt,
  });
});

router.put("/users/:id/role", protect, authorize("admin"), async (req, res) => {
  try {
    const { role } = req.body;

    if (!["admin", "staff", "customer"].includes(role)) {
      return res.status(400).json({ message: "Vai trò không hợp lệ" });
    }

    const user = await User.findByIdAndUpdate(
      req.params.id,
      { role },
      { new: true, runValidators: true },
    ).select("-password");
    if (!user) {
      return res.status(404).json({ message: "Không tìm thấy tài khoản" });
    }

    res.json(user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
