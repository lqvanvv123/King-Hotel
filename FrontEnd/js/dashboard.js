const API_URL = "https://king-hotel-ycsd.onrender.com/api";
let activeBookings = [];

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

async function loadDashboardData() {
  try {
    const response = await authFetch(`${API_URL}/dashboard/stats`);
    const stats = await response.json();

    setText("totalRooms", stats.totalRooms || 0);
    setText("availableRooms", stats.availableRooms || 0);
    setText("occupiedRooms", stats.occupiedRooms || 0);
    setText("todayCheckins", stats.activeBookings || 0);
    setText("totalBookings", stats.totalBookings || 0);
    setText("monthlyRevenue", formatCurrency(stats.monthlyRevenue));
    setText("totalRevenue", formatCurrency(stats.totalRevenue));
  } catch (error) {
    console.error("Error loading dashboard data:", error);
  }
}

async function loadActiveBookings() {
  try {
    const response = await authFetch(`${API_URL}/bookings`);
    const allBookings = await response.json();

    activeBookings = Array.isArray(allBookings)
      ? allBookings.filter((booking) =>
          ["confirmed", "checked-in"].includes(booking.status),
        )
      : [];

    setText("dashboardActiveCount", `${activeBookings.length} đơn`);
    setText(
      "dashboardLatestRefresh",
      new Date().toLocaleTimeString("vi-VN", {
        hour: "2-digit",
        minute: "2-digit",
      }),
    );

    displayActiveBookings(activeBookings);
  } catch (error) {
    console.error("Error loading active bookings:", error);
  }
}

function getStatusBadge(status) {
  const statusMap = {
    confirmed: '<span class="badge status-confirmed">Đã xác nhận</span>',
    "checked-in": '<span class="badge status-checked-in">Đang lưu trú</span>',
  };
  return (
    statusMap[status] ||
    `<span class="badge bg-secondary">${status || "N/A"}</span>`
  );
}

function displayActiveBookings(bookingsData) {
  const tbody = document.getElementById("activeBookingsTable");
  if (!tbody) return;

  tbody.innerHTML = "";

  if (!bookingsData.length) {
    tbody.innerHTML = `
      <tr>
        <td colspan="7">
          <div class="admin-empty-state">
            <i class="bi bi-info-circle"></i>
            Hiện chưa có đơn đặt phòng nào đang hoạt động.
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
      actionButtons = `
        <button class="btn btn-sm btn-success" onclick="checkIn('${booking._id}')">
          <i class="bi bi-box-arrow-in-right"></i> Check-in
        </button>
      `;
    } else if (booking.status === "checked-in") {
      actionButtons = `
        <button class="btn btn-sm btn-primary" onclick="checkOut('${booking._id}')">
          <i class="bi bi-box-arrow-right"></i> Check-out
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
      <td>${actionButtons}</td>
    `;
  });
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
      await loadDashboardData();
      await loadActiveBookings();
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
      await loadDashboardData();
      await loadActiveBookings();
    } else {
      const error = await response.json();
      alert(error.message || "Không thể check-out");
    }
  } catch (error) {
    console.error("Error checking out:", error);
    alert("Không thể check-out");
  }
}

document.addEventListener("DOMContentLoaded", () => {
  loadDashboardData();
  loadActiveBookings();
  setInterval(() => {
    loadDashboardData();
    loadActiveBookings();
  }, 30000);
});
