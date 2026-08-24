const express = require("express");
const router = express.Router();
const Room = require("../models/Room");
const { authorize } = require("../middleware/auth");

router.get("/", async (req, res) => {
  try {
    const { status, type, minPrice, maxPrice } = req.query;
    const filter = {};

    if (status) filter.status = status;
    if (type) filter.type = type;
    if (minPrice || maxPrice) {
      filter.pricePerNight = {};
      if (minPrice) filter.pricePerNight.$gte = parseInt(minPrice);
      if (maxPrice) filter.pricePerNight.$lte = parseInt(maxPrice);
    }

    const rooms = await Room.find(filter).sort({ roomNumber: 1 });
    res.json(rooms);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const room = await Room.findById(req.params.id);
    if (!room) {
      return res.status(404).json({ message: "Không tìm thấy phòng" });
    }
    res.json(room);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.post("/", authorize("admin"), async (req, res) => {
  try {
    const room = new Room(req.body);
    const newRoom = await room.save();
    res.status(201).json(newRoom);
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ message: "Số phòng đã tồn tại" });
    }
    res.status(400).json({ message: error.message });
  }
});

router.put("/:id", authorize("admin"), async (req, res) => {
  try {
    const room = await Room.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!room) {
      return res.status(404).json({ message: "Không tìm thấy phòng" });
    }
    res.json(room);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

router.delete("/:id", authorize("admin"), async (req, res) => {
  try {
    const room = await Room.findByIdAndDelete(req.params.id);
    if (!room) {
      return res.status(404).json({ message: "Không tìm thấy phòng" });
    }
    res.json({ message: "Đã xóa phòng thành công" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
