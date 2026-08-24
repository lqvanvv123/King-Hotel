const express = require("express");
const router = express.Router();
const Customer = require("../models/Customer");
const { authorize } = require("../middleware/auth");

router.get("/me", async (req, res) => {
  try {
    if (!req.user.customerId) {
      return res.status(404).json({ message: "Tài khoản này chưa có hồ sơ khách hàng" });
    }

    const customer = await Customer.findById(req.user.customerId);
    if (!customer) {
      return res.status(404).json({ message: "Không tìm thấy hồ sơ khách hàng" });
    }

    res.json(customer);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get("/", async (req, res) => {
  try {
    if (req.user.role === "customer") {
      const customers = await Customer.find({ _id: req.user.customerId }).sort({ fullName: 1 });
      return res.json(customers);
    }

    const customers = await Customer.find().sort({ fullName: 1 });
    res.json(customers);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get("/:id", async (req, res) => {
  try {
    if (req.user.role === "customer" && String(req.user.customerId) !== req.params.id) {
      return res.status(403).json({ message: "Bạn không có quyền xem khách hàng này" });
    }

    const customer = await Customer.findById(req.params.id);
    if (!customer) {
      return res.status(404).json({ message: "Không tìm thấy khách hàng" });
    }
    res.json(customer);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.post("/", authorize("admin", "staff"), async (req, res) => {
  try {
    const customer = new Customer(req.body);
    const newCustomer = await customer.save();
    res.status(201).json(newCustomer);
  } catch (error) {
    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern)[0];
      return res.status(400).json({
        message: `${field === "email" ? "Email" : "Số CMND/CCCD"} đã tồn tại`,
      });
    }
    res.status(400).json({ message: error.message });
  }
});

router.put("/:id", async (req, res) => {
  try {
    if (req.user.role === "customer" && String(req.user.customerId) !== req.params.id) {
      return res.status(403).json({ message: "Bạn không có quyền cập nhật khách hàng này" });
    }

    const customer = await Customer.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!customer) {
      return res.status(404).json({ message: "Không tìm thấy khách hàng" });
    }
    res.json(customer);
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ message: "Email hoặc CMND/CCCD đã tồn tại" });
    }
    res.status(400).json({ message: error.message });
  }
});

router.delete("/:id", authorize("admin"), async (req, res) => {
  try {
    const customer = await Customer.findByIdAndDelete(req.params.id);
    if (!customer) {
      return res.status(404).json({ message: "Không tìm thấy khách hàng" });
    }
    res.json({ message: "Đã xóa khách hàng thành công" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
