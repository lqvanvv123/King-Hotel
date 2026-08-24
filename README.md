# 🏨 King Hotel Management System

## 📌 Giới thiệu

King Hotel là hệ thống quản lý khách sạn được xây dựng bằng **Node.js (Express)** và **MongoDB**.
Dự án cung cấp các API để quản lý phòng, người dùng và đặt phòng.

---

## 🚀 Công nghệ sử dụng

* Node.js
* Express.js
* MongoDB (Mongoose)
* JWT Authentication
* RESTful API

---

## 📂 Cấu trúc project

```
King-Hotel/
│
├── BackEnd/
│   ├── models/        # Định nghĩa schema MongoDB
│   ├── routes/        # API routes
│   ├── controllers/   # Xử lý logic
│   ├── config/        # Kết nối database
│   └── server.js      # File chạy chính
│
├── FrontEnd/          # Giao diện (HTML/CSS/JS)
│
├── package.json
└── README.md
```

---

## ⚙️ Cài đặt & chạy local

### 1. Clone project

```bash
git clone https://github.com/lqvanvv123/King-Hotel.git
cd King-Hotel/BackEnd
```

### 2. Cài đặt dependencies

```bash
npm install
```

### 3. Tạo file `.env`

Tạo file `.env` trong thư mục `BackEnd`:

```env
PORT=3000
MONGO_URI=your_mongodb_connection
JWT_SECRET=your_secret_key
```

---

### 4. Chạy server

```bash
node server.js
```

👉 Server chạy tại:

```
http://localhost:3000
```

---

## 🌐 Deploy

Dự án có thể deploy bằng:

* Render
* Railway
* Vercel (frontend)

👉 Link demo (sau khi deploy):

```
https://king-hotel.onrender.com
```

---

## 📡 API mẫu

### 📌 Lấy danh sách phòng

```
GET /api/rooms
```

### 📌 Tạo phòng mới

```
POST /api/rooms
```# 🏨 King Hotel Management System

## 📌 Giới thiệu

King Hotel là hệ thống quản lý khách sạn được xây dựng bằng **Node.js (Express)** và **MongoDB**.
Dự án cung cấp các API để quản lý phòng, người dùng và đặt phòng.

---

## 🚀 Công nghệ sử dụng

* Node.js
* Express.js
* MongoDB (Mongoose)
* JWT Authentication
* RESTful API

---

## 📂 Cấu trúc project

```
King-Hotel/
│
├── BackEnd/
│   ├── models/        # Định nghĩa schema MongoDB
│   ├── routes/        # API routes
│   ├── controllers/   # Xử lý logic
│   ├── config/        # Kết nối database
│   └── server.js      # File chạy chính
│
├── FrontEnd/          # Giao diện (HTML/CSS/JS)
│
├── package.json
└── README.md
```

---

## ⚙️ Cài đặt & chạy local

### 1. Clone project

```bash
git clone https://github.com/lqvanvv123/King-Hotel.git
cd King-Hotel/BackEnd
```

### 2. Cài đặt dependencies

```bash
npm install
```

### 3. Tạo file `.env`

Tạo file `.env` trong thư mục `BackEnd`:

```env
PORT=3000
MONGO_URI=your_mongodb_connection
JWT_SECRET=your_secret_key
```

---

### 4. Chạy server

```bash
node server.js
```

👉 Server chạy tại:

```
http://localhost:3000
```

---

## 🌐 Deploy

Dự án có thể deploy bằng:

* Render
* Railway
* Vercel (frontend)

👉 Link demo (sau khi deploy):

```
https://king-hotel.onrender.com
```

---

## 📡 API mẫu

### 📌 Lấy danh sách phòng

```
GET /api/rooms
```

### 📌 Tạo phòng mới

```
POST /api/rooms
```

### 📌 Đăng ký user

```
POST /api/auth/register
```

### 📌 Đăng nhập

```
POST /api/auth/login
```

---

## ⚠️ Lưu ý

* Cần MongoDB để chạy project
* Frontend hiện tại chỉ là giao diện cơ bản
* API có thể test bằng Postman

---

## 👨‍💻 Tác giả

* GitHub: https://github.com/lqvanvv123

---

## ⭐ Ghi chú

Nếu thấy project hữu ích hãy ⭐ repo nhé!


### 📌 Đăng ký user

```
POST /api/auth/register
```

### 📌 Đăng nhập

```
POST /api/auth/login
```

---

## ⚠️ Lưu ý

* Cần MongoDB để chạy project
* Frontend hiện tại chỉ là giao diện cơ bản
* API có thể test bằng Postman

---

## 👨‍💻 Tác giả

* GitHub: https://github.com/lqvanvv123

---

## ⭐ Ghi chú

Nếu thấy project hữu ích hãy ⭐ repo nhé!
