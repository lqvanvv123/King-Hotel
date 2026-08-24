# Cấu trúc database đã mở rộng

Project hiện dùng MongoDB với các collection chính:

## 1. users
Lưu tài khoản đăng nhập hệ thống.
- admin / staff / customer
- có trạng thái tài khoản
- lưu lần đăng nhập gần nhất
- customer sẽ liên kết sang `customers`

## 2. customers
Lưu hồ sơ khách hàng.
- họ tên, email, số điện thoại, CCCD
- địa chỉ, giới tính, quốc tịch
- loại khách hàng: normal / vip / corporate
- điểm tích lũy
- liên hệ khẩn cấp
- ghi chú

## 3. rooms
Lưu thông tin phòng.
- số phòng, loại phòng, giá/đêm, sức chứa
- tầng, diện tích, loại giường, hướng nhìn
- tiện nghi, nhiều ảnh
- trạng thái phòng
- trạng thái dọn phòng
- phần trăm giảm giá

## 4. bookings
Lưu thông tin đặt phòng.
- mã booking tự sinh
- khách hàng, phòng
- ngày nhận / trả phòng
- số đêm, số người lớn, trẻ em
- thông tin khách tại thời điểm đặt
- tổng tiền, tiền cọc
- phương thức thanh toán
- trạng thái booking
- trạng thái thanh toán
- nguồn đặt phòng
- yêu cầu đặc biệt

## 5. payments
Lưu giao dịch thanh toán.
- liên kết booking + customer
- số tiền
- phương thức
- trạng thái thanh toán
- mã giao dịch
- thời gian thanh toán

## 6. reviews
Lưu đánh giá sau lưu trú.
- liên kết booking + customer + room
- số sao
- bình luận
- trạng thái hiển thị

## Tài khoản mẫu
- Admin: `admin / 123`
- Customer: `ngocanh@example.com / 123456`
- Customer: `minhthu@example.com / 123456`

## Gợi ý chạy seed lại
```bash
cd BackEnd
npm install
npm run seed
npm start
```
