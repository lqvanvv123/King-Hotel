const API_URL = "https://king-hotel-ycsd.onrender.com/api";
let bookings = [];
let filteredBookings = [];
let customers = [];
let availableRooms = [];

function formatCurrency(amount) {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  }).format(amount || 0);
}

function setText(id, value) {
  const el = document.getElementById(id);
  if (el) el.textContent = value;
}

function calculateNights(checkInDate, checkOutDate) {
  const checkIn = new Date(checkInDate);
  const checkOut = new Date(checkOutDate);
  const diff = checkOut - checkIn;
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

function getStatusBadge(status) {
  const statusMap = {
    pending: '<span class="badge bg-secondary">Chờ xác nhận</span>',
    confirmed: '<span class="badge status-confirmed">Đã xác nhận</span>',
    "checked-in": '<span class="badge status-checked-in">Đã nhận phòng</span>',
    "checked-out": '<span class="badge status-checked-out">Đã trả phòng</span>',
    cancelled: '<span class="badge status-cancelled">Đã hủy</span>',
  };
  return (
    statusMap[status] ||
    `<span class="badge bg-secondary">${status || "N/A"}</span>`
  );
}

function renderBookingSummary() {
  setText("bookingsTotalCount", bookings.length);
  setText(
    "bookingsConfirmedCount",
    bookings.filter((booking) => booking.status === "confirmed").length,
  );
  setText(
    "bookingsCheckedInCount",
    bookings.filter((booking) => booking.status === "checked-in").length,
  );
  const totalRevenue = bookings.reduce(
    (sum, booking) => sum + Number(booking.totalAmount || 0),
    0,
  );
  setText("bookingsRevenueCount", formatCurrency(totalRevenue));
}

async function loadCustomers() {
  try {
    const response = await authFetch(`${API_URL}/customers`);
    customers = await response.json();

    const select = document.getElementById("customerSelect");
    if (!select) return;
    select.innerHTML = '<option value="">Chọn khách hàng...</option>';
    customers.forEach((customer) => {
      const option = document.createElement("option");
      option.value = customer._id;
      option.textContent = `${customer.fullName} - ${customer.phone || customer.email || "Không có liên hệ"}`;
      select.appendChild(option);
    });
  } catch (error) {
    console.error("Error loading customers:", error);
  }
}

async function loadAvailableRooms() {
  try {
    const response = await authFetch(`${API_URL}/rooms`);
    availableRooms = await response.json();

    const select = document.getElementById("roomSelect");
    if (!select) return;
    select.innerHTML = '<option value="">Chọn phòng...</option>';
    availableRooms
      .filter((room) => room.status !== "maintenance")
      .forEach((room) => {
        const option = document.createElement("option");
        option.value = room._id;
        option.dataset.price = room.pricePerNight;
        const statusText =
          room.status === "booked"
            ? " - đã có lịch đặt"
            : room.status === "occupied"
              ? " - đang ở"
              : "";
        option.textContent = `Phòng ${room.roomNumber} - ${room.type} - ${formatCurrency(room.pricePerNight)}/đêm${statusText}`;
        select.appendChild(option);
      });

    updateEstimatedTotal();
  } catch (error) {
    console.error("Error loading rooms:", error);
  }
}

async function loadBookings() {
  try {
    const response = await authFetch(`${API_URL}/bookings`);
    bookings = await response.json();
    renderBookingSummary();
    applyBookingFilters();
  } catch (error) {
    console.error("Error loading bookings:", error);
  }
}

function displayBookings(bookingsData) {
  const tbody = document.getElementById("bookingsTableBody");
  if (!tbody) return;

  tbody.innerHTML = "";
  setText("bookingResultCount", `${bookingsData.length} booking`);

  if (!bookingsData.length) {
    tbody.innerHTML = `
      <tr>
        <td colspan="7">
          <div class="admin-empty-state">
            <i class="bi bi-calendar-x"></i>
            Không có đơn đặt phòng nào phù hợp.
          </div>
        </td>
      </tr>
    `;
    return;
  }

  bookingsData.forEach((booking) => {
    const row = tbody.insertRow();
    const checkIn = booking.checkInDate
      ? new Date(booking.checkInDate).toLocaleDateString("vi-VN")
      : "--";
    const checkOut = booking.checkOutDate
      ? new Date(booking.checkOutDate).toLocaleDateString("vi-VN")
      : "--";
    const customerName = booking.customerId
      ? booking.customerId.fullName
      : "N/A";
    const roomNumber = booking.roomId ? booking.roomId.roomNumber : "N/A";

    let actionButtons = "";
    if (booking.status === "confirmed") {
      actionButtons += `
        <button class="btn btn-sm btn-success" onclick="checkIn('${booking._id}')">
          <i class="bi bi-box-arrow-in-right"></i>
        </button>
      `;
    } else if (booking.status === "checked-in") {
      actionButtons += `
        <button class="btn btn-sm btn-primary" onclick="checkOut('${booking._id}')">
          <i class="bi bi-box-arrow-right"></i>
        </button>
      `;
    }

    if (isAdmin()) {
      actionButtons += `
        <button class="btn btn-sm btn-outline-danger" onclick="deleteBooking('${booking._id}')">
          <i class="bi bi-trash"></i>
        </button>
      `;
    }

    row.innerHTML = `
      <td><strong>${customerName}</strong></td>
      <td>Phòng ${roomNumber}</td>
      <td>${checkIn}</td>
      <td>${checkOut}</td>
      <td class="fw-semibold">${formatCurrency(booking.totalAmount)}</td>
      <td>${getStatusBadge(booking.status)}</td>
      <td><div class="admin-table-actions">${actionButtons || '<span class="text-muted small">Không có</span>'}</div></td>
    `;
  });
}

function applyBookingFilters() {
  const keyword = (document.getElementById("bookingKeywordFilter")?.value || "")
    .trim()
    .toLowerCase();
  const status = document.getElementById("bookingStatusFilter")?.value || "";

  filteredBookings = bookings.filter((booking) => {
    const customerName = booking.customerId?.fullName || "";
    const roomNumber = booking.roomId?.roomNumber || "";
    const haystack = `${customerName} ${roomNumber}`.toLowerCase();
    const matchKeyword = !keyword || haystack.includes(keyword);
    const matchStatus = !status || booking.status === status;
    return matchKeyword && matchStatus;
  });

  displayBookings(filteredBookings);
}

function resetBookingFilters() {
  document.getElementById("bookingKeywordFilter").value = "";
  document.getElementById("bookingStatusFilter").value = "";
  applyBookingFilters();
}

function updateEstimatedTotal() {
  const roomSelect = document.getElementById("roomSelect");
  const selectedOption = roomSelect?.options[roomSelect.selectedIndex];
  const pricePerNight = Number(selectedOption?.dataset?.price || 0);
  const checkInDate = document.getElementById("checkInDate")?.value;
  const checkOutDate = document.getElementById("checkOutDate")?.value;
  const nights = calculateNights(checkInDate, checkOutDate);

  if (!pricePerNight || nights <= 0) {
    setText("estimatedTotal", formatCurrency(0));
    setText("estimatedNights", "0 đêm");
    return;
  }

  setText("estimatedTotal", formatCurrency(pricePerNight * nights));
  setText("estimatedNights", `${nights} đêm`);
}

async function createBooking(event) {
  event.preventDefault();

  const bookingData = {
    customerId: document.getElementById("customerSelect").value,
    roomId: document.getElementById("roomSelect").value,
    checkInDate: document.getElementById("checkInDate").value,
    checkOutDate: document.getElementById("checkOutDate").value,
    paymentMethod: document.getElementById("paymentMethod").value,
  };

  if (new Date(bookingData.checkOutDate) <= new Date(bookingData.checkInDate)) {
    alert("Ngày trả phòng phải sau ngày nhận phòng");
    return;
  }

  try {
    const response = await authFetch(`${API_URL}/bookings`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(bookingData),
    });

    if (response.ok) {
      alert(
        "Tạo đơn đặt phòng thành công! Hệ thống đã tự tính tổng tiền và cập nhật trạng thái phòng.",
      );
      document.getElementById("bookingForm").reset();

      const today = new Date();
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      document.getElementById("checkInDate").value = today
        .toISOString()
        .split("T")[0];
      document.getElementById("checkOutDate").value = tomorrow
        .toISOString()
        .split("T")[0];

      await loadAvailableRooms();
      await loadBookings();
      updateEstimatedTotal();
    } else {
      const error = await response.json();
      alert(error.message || "Không thể tạo đơn đặt phòng");
    }
  } catch (error) {
    console.error("Error creating booking:", error);
    alert("Không thể tạo đơn đặt phòng");
  }
}

async function checkIn(id) {
  if (!confirm("Xác nhận khách nhận phòng?")) return;
  try {
    const response = await authFetch(`${API_URL}/bookings/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "checked-in" }),
    });

    if (response.ok) {
      alert("Check-in thành công!");
      await loadAvailableRooms();
      await loadBookings();
    } else {
      const error = await response.json();
      alert(error.message || "Không thể check-in");
    }
  } catch (error) {
    console.error("Error checking in:", error);
    alert("Không thể check-in");
  }
}

async function checkOut(id) {
  if (!confirm("Xác nhận khách trả phòng?")) return;
  try {
    const response = await authFetch(`${API_URL}/bookings/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "checked-out" }),
    });

    if (response.ok) {
      alert("Check-out thành công!");
      await loadAvailableRooms();
      await loadBookings();
    } else {
      const error = await response.json();
      alert(error.message || "Không thể check-out");
    }
  } catch (error) {
    console.error("Error checking out:", error);
    alert("Không thể check-out");
  }
}

async function deleteBooking(id) {
  if (!isAdmin()) {
    alert("Chỉ admin mới được xóa đơn đặt phòng.");
    return;
  }
  if (!confirm("Bạn có chắc chắn muốn xóa đơn đặt phòng này?")) return;

  try {
    const response = await authFetch(`${API_URL}/bookings/${id}`, {
      method: "DELETE",
    });
    if (response.ok) {
      alert("Xóa đơn đặt phòng thành công!");
      await loadAvailableRooms();
      await loadBookings();
    } else {
      const error = await response.json();
      alert(error.message || "Không thể xóa đơn đặt phòng");
    }
  } catch (error) {
    console.error("Error deleting booking:", error);
    alert("Không thể xóa đơn đặt phòng");
  }
}

document.addEventListener("DOMContentLoaded", () => {
  loadCustomers();
  loadAvailableRooms();
  loadBookings();

  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  document.getElementById("checkInDate").value = today
    .toISOString()
    .split("T")[0];
  document.getElementById("checkOutDate").value = tomorrow
    .toISOString()
    .split("T")[0];

  document
    .getElementById("bookingForm")
    ?.addEventListener("submit", createBooking);
  ["roomSelect", "checkInDate", "checkOutDate"].forEach((id) => {
    document
      .getElementById(id)
      ?.addEventListener("change", updateEstimatedTotal);
  });
  document
    .getElementById("bookingKeywordFilter")
    ?.addEventListener("input", applyBookingFilters);
  document
    .getElementById("bookingStatusFilter")
    ?.addEventListener("change", applyBookingFilters);
});
