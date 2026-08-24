const CUSTOMER_API_URL = "http://localhost:3000/api";
let customerRooms = [];
let customerBookingsCache = [];

function formatCurrencyVND(amount) {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  }).format(amount || 0);
}

function calculateCustomerNights(checkInDate, checkOutDate) {
  const checkIn = new Date(checkInDate);
  const checkOut = new Date(checkOutDate);
  const diff = checkOut - checkIn;
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

function renderCustomerProfile() {
  const user = getCurrentUser();
  document.getElementById("profileFullName").textContent = user?.fullName || "-";
  document.getElementById("profileEmail").textContent = user?.email || "-";
}

function scrollToBookingSearch() {
  const target = document.getElementById("bookingSearchCard");
  if (target) {
    target.scrollIntoView({ behavior: "smooth", block: "start" });
  }
}

async function loadCustomerRooms() {
  try {
    const response = await authFetch(`${CUSTOMER_API_URL}/rooms?status=available`);
    customerRooms = await response.json();
    populateCustomerRoomSelect();
    renderCustomerRoomCards();
    applyRoomFromQuery();
    updateCustomerEstimatedTotal();
    updateCustomerOverviewStats();
  } catch (error) {
    console.error("Error loading customer rooms:", error);
    alert("Không thể tải danh sách phòng.");
  }
}

function populateCustomerRoomSelect() {
  const select = document.getElementById("customerRoomSelect");
  select.innerHTML = "";

  if (!customerRooms.length) {
    select.innerHTML = '<option value="">Hiện chưa có phòng trống</option>';
    return;
  }

  select.innerHTML = '<option value="">-- Chọn phòng --</option>';
  customerRooms.forEach((room) => {
    const option = document.createElement("option");
    option.value = room._id;
    option.dataset.price = room.pricePerNight;
    option.textContent = `Phòng ${room.roomNumber} · ${room.type} · ${formatCurrencyVND(room.pricePerNight)}`;
    select.appendChild(option);
  });
}

function renderCustomerRoomCards() {
  const container = document.getElementById("customerRoomCards");
  container.innerHTML = "";

  if (!customerRooms.length) {
    container.innerHTML = '<div class="col-12"><div class="alert alert-warning mb-0">Hiện tại chưa có phòng trống để đặt.</div></div>';
    return;
  }

  customerRooms.slice(0, 6).forEach((room) => {
    const amenities = room.amenities?.slice(0, 4) || [];
    const highlights = room.highlights?.slice(0, 2) || [];
    const col = document.createElement("div");
    col.className = "col-md-6";
    col.innerHTML = `
      <article class="booking-room-card h-100">
        <div class="booking-room-image-wrap">
          <img src="${typeof resolveAssetPath === "function" ? resolveAssetPath(room.imageUrl || "assets/rooms/standard-1.jpg") : (room.imageUrl || "assets/rooms/standard-1.jpg")}" class="booking-room-image" alt="${room.roomNumber}" />
          <span class="booking-room-badge">${room.type}</span>
        </div>
        <div class="booking-room-body">
          <div class="d-flex justify-content-between gap-2 align-items-start mb-2">
            <div>
              <h3 class="booking-room-title">Phòng ${room.roomNumber}</h3>
              <p class="booking-room-subtitle">${room.detailTitle || room.description || "Phòng đẹp, đầy đủ tiện nghi"}</p>
            </div>
            <div class="booking-room-price-box">
              <div class="booking-room-price">${formatCurrencyVND(room.pricePerNight)}</div>
              <div class="booking-room-price-note">/ đêm</div>
            </div>
          </div>
          <div class="booking-room-facts">
            <span><i class="bi bi-people"></i> ${room.capacity} khách</span>
            <span><i class="bi bi-aspect-ratio"></i> ${room.sizeSqm || "-"} m²</span>
            <span><i class="bi bi-eye"></i> ${room.view || "-"}</span>
          </div>
          <div class="booking-amenities-chips">
            ${amenities.map((item) => `<span>${item}</span>`).join("")}
          </div>
          <div class="booking-highlights-inline">
            ${highlights.map((item) => `<span><i class="bi bi-check-circle-fill"></i> ${item}</span>`).join("")}
          </div>
          <div class="d-flex gap-2 flex-wrap mt-3">
            <a class="btn booking-outline-btn btn-sm" href="room-detail.html?id=${encodeURIComponent(room._id)}">
              <i class="bi bi-eye"></i> Xem chi tiết
            </a>
            <button class="btn booking-primary-btn btn-sm" onclick="selectRoomForBooking('${room._id}')">
              <i class="bi bi-check2-circle"></i> Chọn phòng này
            </button>
          </div>
        </div>
      </article>
    `;
    container.appendChild(col);
  });
}

function applyRoomFromQuery() {
  const params = new URLSearchParams(window.location.search);
  const roomId = params.get("roomId");
  const checkIn = params.get("checkIn");
  const checkOut = params.get("checkOut");

  if (checkIn) document.getElementById("customerCheckInDate").value = checkIn;
  if (checkOut) document.getElementById("customerCheckOutDate").value = checkOut;

  if (roomId) {
    const select = document.getElementById("customerRoomSelect");
    const option = Array.from(select.options).find((item) => item.value === roomId);
    if (option) {
      select.value = roomId;
      scrollToBookingSearch();
    }
  }

  updateCustomerEstimatedTotal();
}

function selectRoomForBooking(roomId) {
  document.getElementById("customerRoomSelect").value = roomId;
  updateCustomerEstimatedTotal();
  scrollToBookingSearch();
}

function goToRoomExplorer() {
  const params = new URLSearchParams();
  const checkIn = document.getElementById("customerCheckInDate").value;
  const checkOut = document.getElementById("customerCheckOutDate").value;
  if (checkIn) params.set("checkIn", checkIn);
  if (checkOut) params.set("checkOut", checkOut);
  window.location.href = `room-list.html${params.toString() ? `?${params.toString()}` : ""}`;
}

function updateCustomerEstimatedTotal() {
  const roomSelect = document.getElementById("customerRoomSelect");
  const selectedOption = roomSelect.options[roomSelect.selectedIndex];
  const pricePerNight = Number(selectedOption?.dataset?.price || 0);
  const checkInDate = document.getElementById("customerCheckInDate").value;
  const checkOutDate = document.getElementById("customerCheckOutDate").value;
  const nights = calculateCustomerNights(checkInDate, checkOutDate);

  if (!pricePerNight || nights <= 0) {
    document.getElementById("customerEstimatedTotal").textContent = formatCurrencyVND(0);
    document.getElementById("customerEstimatedNights").textContent = "0 đêm";
    return;
  }

  document.getElementById("customerEstimatedTotal").textContent = formatCurrencyVND(pricePerNight * nights);
  document.getElementById("customerEstimatedNights").textContent = `${nights} đêm`;
}

async function loadCustomerBookings() {
  try {
    const response = await authFetch(`${CUSTOMER_API_URL}/bookings`);
    const bookings = await response.json();
    customerBookingsCache = bookings;
    renderCustomerBookings(bookings);
    updateCustomerOverviewStats();
  } catch (error) {
    console.error("Error loading customer bookings:", error);
    alert("Không thể tải lịch sử đặt phòng.");
  }
}

function updateCustomerOverviewStats() {
  const availableCountEl = document.getElementById("availableRoomCount");
  const bookingCountEl = document.getElementById("bookingHistoryCount");
  const activeBookingCountEl = document.getElementById("activeBookingCount");

  if (availableCountEl) availableCountEl.textContent = customerRooms.length;
  if (bookingCountEl) bookingCountEl.textContent = customerBookingsCache.length;

  if (activeBookingCountEl) {
    const activeCount = customerBookingsCache.filter((booking) =>
      ["confirmed", "checked-in"].includes(booking.status)
    ).length;
    activeBookingCountEl.textContent = activeCount;
  }
}

function renderCustomerBookings(bookings) {
  const tbody = document.getElementById("customerBookingsTableBody");
  tbody.innerHTML = "";

  if (!bookings.length) {
    tbody.innerHTML = '<tr><td colspan="6" class="text-center text-muted py-4">Bạn chưa có đơn đặt phòng nào.</td></tr>';
    return;
  }

  bookings.forEach((booking) => {
    const row = tbody.insertRow();
    const statusLabel =
      booking.status === "confirmed"
        ? '<span class="badge bg-primary">Đã xác nhận</span>'
        : booking.status === "checked-in"
          ? '<span class="badge bg-success">Đã nhận phòng</span>'
          : booking.status === "checked-out"
            ? '<span class="badge bg-secondary">Đã trả phòng</span>'
            : booking.status === "cancelled"
              ? '<span class="badge bg-danger">Đã hủy</span>'
              : '<span class="badge bg-warning text-dark">Chờ xử lý</span>';

    row.innerHTML = `
      <td><strong>${booking.roomId?.roomNumber || "-"}</strong></td>
      <td>${booking.roomId?.type || "-"}</td>
      <td>${new Date(booking.checkInDate).toLocaleDateString("vi-VN")}</td>
      <td>${new Date(booking.checkOutDate).toLocaleDateString("vi-VN")}</td>
      <td>${formatCurrencyVND(booking.totalAmount)}</td>
      <td>${statusLabel}</td>
    `;
  });
}

async function createCustomerBooking(event) {
  event.preventDefault();

  const bookingData = {
    roomId: document.getElementById("customerRoomSelect").value,
    checkInDate: document.getElementById("customerCheckInDate").value,
    checkOutDate: document.getElementById("customerCheckOutDate").value,
    paymentMethod: document.getElementById("customerPaymentMethod").value,
  };

  if (!bookingData.roomId) {
    alert("Vui lòng chọn phòng.");
    return;
  }

  if (new Date(bookingData.checkOutDate) <= new Date(bookingData.checkInDate)) {
    alert("Ngày trả phòng phải sau ngày nhận phòng.");
    return;
  }

  try {
    const response = await authFetch(`${CUSTOMER_API_URL}/bookings`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(bookingData),
    });

    const data = await response.json();

    if (!response.ok) {
      alert(data.message || "Không thể tạo đơn đặt phòng.");
      return;
    }

    alert("Đặt phòng thành công! Đơn của bạn đã được ghi nhận.");
    document.getElementById("customerBookingForm").reset();
    setDefaultCustomerDates();
    await loadCustomerRooms();
    await loadCustomerBookings();
  } catch (error) {
    console.error("Error creating customer booking:", error);
    alert("Không thể kết nối đến server để đặt phòng.");
  }
}

function setDefaultCustomerDates() {
  const params = new URLSearchParams(window.location.search);
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  document.getElementById("customerCheckInDate").value = params.get("checkIn") || today.toISOString().split("T")[0];
  document.getElementById("customerCheckOutDate").value = params.get("checkOut") || tomorrow.toISOString().split("T")[0];
  updateCustomerEstimatedTotal();
}

document.addEventListener("DOMContentLoaded", () => {
  renderCustomerProfile();
  setDefaultCustomerDates();
  loadCustomerRooms();
  loadCustomerBookings();

  document.getElementById("customerBookingForm").addEventListener("submit", createCustomerBooking);
  document.getElementById("customerRoomSelect").addEventListener("change", updateCustomerEstimatedTotal);
  document.getElementById("customerCheckInDate").addEventListener("change", updateCustomerEstimatedTotal);
  document.getElementById("customerCheckOutDate").addEventListener("change", updateCustomerEstimatedTotal);
});
