const API_URL = "http://localhost:3000/api";
let rooms = [];
let filteredRooms = [];
let currentRoomId = null;
const roomModalElement = document.getElementById("roomModal");
const roomDetailAdminModalElement = document.getElementById("roomDetailAdminModal");
const roomModal = roomModalElement ? new bootstrap.Modal(roomModalElement) : null;
const roomDetailAdminModal = roomDetailAdminModalElement ? new bootstrap.Modal(roomDetailAdminModalElement) : null;

function formatCurrency(amount) {
  return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(amount || 0);
}

function setText(id, value) {
  const el = document.getElementById(id);
  if (el) el.textContent = value;
}

function getStatusBadge(status) {
  const statusMap = {
    available: '<span class="badge status-available">Còn trống</span>',
    booked: '<span class="badge status-booked">Đã đặt</span>',
    occupied: '<span class="badge status-occupied">Đang ở</span>',
    maintenance: '<span class="badge status-maintenance">Bảo trì</span>',
  };
  return statusMap[status] || `<span class="badge bg-secondary">${status || "N/A"}</span>`;
}

function renderRoomSummary() {
  setText("roomTotalCount", rooms.length);
  setText("roomAvailableCount", rooms.filter((room) => room.status === "available").length);
  setText("roomOccupiedCount", rooms.filter((room) => room.status === "occupied").length);
  setText("roomMaintenanceCount", rooms.filter((room) => room.status === "maintenance").length);
}

function displayRooms(roomsData) {
  const tbody = document.getElementById("roomsTableBody");
  if (!tbody) return;

  tbody.innerHTML = "";
  setText("roomResultCount", `${roomsData.length} phòng`);

  if (!roomsData.length) {
    tbody.innerHTML = `
      <tr>
        <td colspan="7">
          <div class="admin-empty-state">
            <i class="bi bi-door-closed"></i>
            Không tìm thấy phòng nào phù hợp với bộ lọc hiện tại.
          </div>
        </td>
      </tr>
    `;
    return;
  }

  roomsData.forEach((room) => {
    const row = tbody.insertRow();
    const amenityText = room.amenities && room.amenities.length
      ? `${room.amenities.slice(0, 3).join(", ")}${room.amenities.length > 3 ? "..." : ""}`
      : "Chưa cập nhật";

    row.innerHTML = `
      <td><strong>${room.roomNumber}</strong></td>
      <td>${room.type}</td>
      <td class="fw-semibold">${formatCurrency(room.pricePerNight)}</td>
      <td>${room.capacity} người</td>
      <td>${getStatusBadge(room.status)}</td>
      <td>${amenityText}</td>
      <td>
        <div class="admin-table-actions">
          <a class="btn btn-sm btn-outline-secondary" href="room-detail.html?id=${encodeURIComponent(room._id)}">
            <i class="bi bi-eye"></i>
          </a>
          ${isAdmin() ? `
          <button class="btn btn-sm btn-outline-primary" onclick="editRoom('${room._id}')">
            <i class="bi bi-pencil"></i>
          </button>
          <button class="btn btn-sm btn-outline-danger" onclick="deleteRoom('${room._id}')">
            <i class="bi bi-trash"></i>
          </button>` : ""}
        </div>
      </td>
    `;
  });
}

function applyFilters() {
  const status = document.getElementById("filterStatus")?.value || "";
  const type = document.getElementById("filterType")?.value || "";
  const keyword = (document.getElementById("filterKeyword")?.value || "").trim().toLowerCase();

  filteredRooms = rooms.filter((room) => {
    const matchStatus = !status || room.status === status;
    const matchType = !type || room.type === type;
    const searchText = [
      room.roomNumber,
      room.type,
      room.description,
      ...(room.amenities || []),
    ]
      .join(" ")
      .toLowerCase();
    const matchKeyword = !keyword || searchText.includes(keyword);
    return matchStatus && matchType && matchKeyword;
  });

  displayRooms(filteredRooms);
}

async function loadRooms() {
  try {
    const response = await authFetch(`${API_URL}/rooms`);
    rooms = await response.json();
    filteredRooms = [...rooms];
    renderRoomSummary();
    applyFilters();
  } catch (error) {
    console.error("Error loading rooms:", error);
    alert("Không thể tải danh sách phòng");
  }
}

function openAddModal() {
  if (!isAdmin()) {
    alert("Chỉ admin mới được thêm phòng.");
    return;
  }
  currentRoomId = null;
  document.getElementById("modalTitle").textContent = "Thêm phòng mới";
  document.getElementById("roomForm").reset();
  document.getElementById("roomStatus").value = "available";
  document.getElementById("roomType").value = "Standard";
}

async function editRoom(id) {
  if (!isAdmin()) {
    alert("Chỉ admin mới được sửa phòng.");
    return;
  }

  try {
    const response = await authFetch(`${API_URL}/rooms/${id}`);
    const room = await response.json();

    currentRoomId = room._id;
    document.getElementById("modalTitle").textContent = "Chỉnh sửa phòng";
    document.getElementById("roomId").value = room._id;
    document.getElementById("roomNumber").value = room.roomNumber;
    document.getElementById("roomType").value = room.type;
    document.getElementById("pricePerNight").value = room.pricePerNight;
    document.getElementById("capacity").value = room.capacity;
    document.getElementById("roomStatus").value = room.status;
    document.getElementById("imageUrl").value = room.imageUrl || "";
    document.getElementById("amenities").value = room.amenities ? room.amenities.join(", ") : "";
    document.getElementById("description").value = room.description || "";

    roomModal?.show();
  } catch (error) {
    console.error("Error loading room:", error);
    alert("Không thể tải thông tin phòng");
  }
}

async function saveRoom() {
  if (!isAdmin()) {
    alert("Chỉ admin mới được lưu thông tin phòng.");
    return;
  }

  const form = document.getElementById("roomForm");
  if (!form.checkValidity()) {
    form.reportValidity();
    return;
  }

  const roomData = {
    roomNumber: document.getElementById("roomNumber").value,
    type: document.getElementById("roomType").value,
    pricePerNight: parseFloat(document.getElementById("pricePerNight").value),
    capacity: parseInt(document.getElementById("capacity").value, 10),
    status: document.getElementById("roomStatus").value,
    imageUrl: document.getElementById("imageUrl").value,
    amenities: document.getElementById("amenities").value.split(",").map((item) => item.trim()).filter(Boolean),
    description: document.getElementById("description").value,
  };

  try {
    const url = currentRoomId ? `${API_URL}/rooms/${currentRoomId}` : `${API_URL}/rooms`;
    const method = currentRoomId ? "PUT" : "POST";
    const response = await authFetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(roomData),
    });

    if (response.ok) {
      roomModal?.hide();
      await loadRooms();
      alert(currentRoomId ? "Cập nhật phòng thành công!" : "Thêm phòng mới thành công!");
    } else {
      const error = await response.json();
      alert(error.message || "Có lỗi xảy ra");
    }
  } catch (error) {
    console.error("Error saving room:", error);
    alert("Không thể lưu phòng");
  }
}

async function deleteRoom(id) {
  if (!isAdmin()) {
    alert("Chỉ admin mới được xóa phòng.");
    return;
  }

  if (!confirm("Bạn có chắc chắn muốn xóa phòng này?")) return;

  try {
    const response = await authFetch(`${API_URL}/rooms/${id}`, { method: "DELETE" });
    if (response.ok) {
      await loadRooms();
      alert("Xóa phòng thành công!");
    } else {
      const error = await response.json();
      alert(error.message || "Không thể xóa phòng");
    }
  } catch (error) {
    console.error("Error deleting room:", error);
    alert("Không thể xóa phòng");
  }
}

function resetFilters() {
  document.getElementById("filterStatus").value = "";
  document.getElementById("filterType").value = "";
  document.getElementById("filterKeyword").value = "";
  applyFilters();
}

function renderDetailList(items, emptyText = "Chưa cập nhật") {
  if (!items || !items.length) return `<li>${emptyText}</li>`;
  return items.map((item) => `<li>${item}</li>`).join("");
}

function escapeHtml(text) {
  return String(text ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function renderRoomGallery(room, carouselId) {
  const imageList = (room.images && room.images.length ? room.images : [room.imageUrl]).filter(Boolean);
  if (!imageList.length) {
    return `<img src="assets/rooms/standard-1.jpg" alt="Room" class="img-fluid rounded shadow-sm" style="width:100%;max-height:320px;object-fit:cover;">`;
  }

  const indicators = imageList.map((_, index) => `
    <button type="button" data-bs-target="#${carouselId}" data-bs-slide-to="${index}" ${index === 0 ? 'class="active" aria-current="true"' : ""} aria-label="Slide ${index + 1}"></button>
  `).join("");

  const items = imageList.map((img, index) => `
    <div class="carousel-item ${index === 0 ? "active" : ""}">
      <img src="${img}" class="d-block w-100 rounded" alt="Phòng ${escapeHtml(room.roomNumber)} - ảnh ${index + 1}" style="height:320px;object-fit:cover;">
    </div>
  `).join("");

  const thumbs = imageList.map((img, index) => `
    <img src="${img}" alt="thumb-${index + 1}" class="rounded border" style="width:88px;height:64px;object-fit:cover;cursor:pointer;" data-bs-target="#${carouselId}" data-bs-slide-to="${index}">
  `).join("");

  return `
    <div id="${carouselId}" class="carousel slide" data-bs-ride="false">
      <div class="carousel-indicators">${indicators}</div>
      <div class="carousel-inner shadow-sm">${items}</div>
      ${imageList.length > 1 ? `
      <button class="carousel-control-prev" type="button" data-bs-target="#${carouselId}" data-bs-slide="prev">
        <span class="carousel-control-prev-icon"></span>
        <span class="visually-hidden">Previous</span>
      </button>
      <button class="carousel-control-next" type="button" data-bs-target="#${carouselId}" data-bs-slide="next">
        <span class="carousel-control-next-icon"></span>
        <span class="visually-hidden">Next</span>
      </button>` : ""}
    </div>
    <div class="d-flex flex-wrap gap-2 mt-3">${thumbs}</div>
  `;
}

function viewRoomDetail(id) {
  const room = rooms.find((item) => item._id === id);
  if (!room) {
    alert("Không tìm thấy thông tin phòng.");
    return;
  }

  const statusMap = { available: "Còn trống", booked: "Đã đặt", occupied: "Đang ở", maintenance: "Bảo trì" };

  document.getElementById("roomDetailAdminBody").innerHTML = `
    <div class="row g-4">
      <div class="col-lg-7">${renderRoomGallery(room, `roomAdminCarousel-${room._id}`)}</div>
      <div class="col-lg-5">
        <h4 class="fw-bold mb-2">Phòng ${escapeHtml(room.roomNumber)} - ${escapeHtml(room.type)}</h4>
        <p class="text-muted">${escapeHtml(room.description || "Chưa có mô tả chi tiết.")}</p>
        <div class="admin-soft-list">
          <div class="admin-soft-card"><div class="admin-soft-item"><span>Giá/đêm</span><strong>${formatCurrency(room.pricePerNight)}</strong></div></div>
          <div class="admin-soft-card"><div class="admin-soft-item"><span>Sức chứa</span><strong>${room.capacity} người</strong></div></div>
          <div class="admin-soft-card"><div class="admin-soft-item"><span>Trạng thái</span><strong>${statusMap[room.status] || "N/A"}</strong></div></div>
        </div>
        <div class="mt-3">
          <h6 class="fw-bold">Tiện nghi</h6>
          <ul class="mb-0">${renderDetailList(room.amenities)}</ul>
        </div>
      </div>
    </div>
  `;

  roomDetailAdminModal?.show();
}

document.addEventListener("DOMContentLoaded", () => {
  loadRooms();
  ["filterStatus", "filterType"].forEach((id) => {
    document.getElementById(id)?.addEventListener("change", applyFilters);
  });
  document.getElementById("filterKeyword")?.addEventListener("input", applyFilters);
});
