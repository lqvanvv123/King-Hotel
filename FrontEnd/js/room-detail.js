const ROOM_DETAIL_API_URL = "http://localhost:3000/api";

function roomDetailCurrency(amount) {
  return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(amount || 0);
}

function escapeHtml(text) {
  return String(text ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function renderItems(items, emptyText = "Chưa cập nhật") {
  if (!items || !items.length) return `<li>${emptyText}</li>`;
  return items.map((item) => `<li>${escapeHtml(item)}</li>`).join("");
}

function renderAmenityChips(items) {
  if (!items || !items.length) return '<span>Chưa cập nhật</span>';
  return items.map((item) => `<span>${escapeHtml(item)}</span>`).join("");
}

function renderRoomGallery(room, carouselId) {
  const imageList = (room.images && room.images.length ? room.images : [room.imageUrl]).filter(Boolean);
  if (!imageList.length) {
    return `<img src="${typeof resolveAssetPath === "function" ? resolveAssetPath("assets/rooms/standard-1.jpg") : "assets/rooms/standard-1.jpg"}" alt="Phòng ${escapeHtml(room.roomNumber)}" class="img-fluid rounded-4 shadow-sm" style="width:100%;max-height:460px;object-fit:cover;">`;
  }

  const indicators = imageList.map((_, index) => `
    <button type="button" data-bs-target="#${carouselId}" data-bs-slide-to="${index}" ${index === 0 ? 'class="active" aria-current="true"' : ""} aria-label="Slide ${index + 1}"></button>
  `).join("");

  const items = imageList.map((img, index) => `
    <div class="carousel-item ${index === 0 ? "active" : ""}">
      <img src="${typeof resolveAssetPath === "function" ? resolveAssetPath(img) : img}" class="d-block w-100 rounded-4 room-detail-main-image" alt="Phòng ${escapeHtml(room.roomNumber)} - ảnh ${index + 1}">
    </div>
  `).join("");

  const thumbs = imageList.map((img, index) => `
    <img src="${typeof resolveAssetPath === "function" ? resolveAssetPath(img) : img}" class="room-detail-thumb" alt="thumbnail ${index + 1}" data-bs-target="#${carouselId}" data-bs-slide-to="${index}">
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

function configureNavbar() {
  const brand = document.getElementById("detailBrandLink");
  const links = document.getElementById("detailNavLinks");
  const user = getCurrentUser();

  if (user?.role === "admin") {
    brand.href = typeof resolveTopLevelPath === "function" ? resolveTopLevelPath("rooms.html") : "rooms.html";
    brand.innerHTML = '<i class="bi bi-building"></i> HOTEL MANAGER';
    links.innerHTML = `
      <li class="nav-item"><a class="nav-link" href="${typeof resolveTopLevelPath === "function" ? resolveTopLevelPath("index.html") : "index.html"}"><i class="bi bi-house-door"></i> Trang chủ</a></li>
      <li class="nav-item"><a class="nav-link active" href="${typeof resolveTopLevelPath === "function" ? resolveTopLevelPath("rooms.html") : "rooms.html"}"><i class="bi bi-door-open"></i> Quản lý phòng</a></li>
      <li class="nav-item"><a class="nav-link" href="#" onclick="logout()"><i class="bi bi-box-arrow-right"></i> Đăng xuất <span class="small">${escapeHtml(user.fullName || "Admin")}</span></a></li>
    `;
  } else {
    brand.href = "indexUser.html";
    links.innerHTML = `
      <li class="nav-item"><a class="nav-link" href="indexUser.html"><i class="bi bi-house-door"></i> Trang khách hàng</a></li>
      <li class="nav-item"><a class="nav-link" href="room-list.html"><i class="bi bi-building"></i> Xem phòng</a></li>
      <li class="nav-item"><a class="nav-link" href="#" onclick="logout()"><i class="bi bi-box-arrow-right"></i> Đăng xuất <span class="small">${escapeHtml(user?.fullName || "Khách hàng")}</span></a></li>
    `;
  }
}

async function loadRoomDetailPage() {
  const params = new URLSearchParams(window.location.search);
  const roomId = params.get("id");
  const checkIn = params.get("checkIn");
  const checkOut = params.get("checkOut");
  const container = document.getElementById("roomDetailPage");

  if (!roomId) {
    container.innerHTML = '<div class="alert alert-danger">Thiếu mã phòng để xem chi tiết.</div>';
    return;
  }

  try {
    const response = await authFetch(`${ROOM_DETAIL_API_URL}/rooms/${roomId}`);
    const room = await response.json();

    if (!response.ok) {
      container.innerHTML = `<div class="alert alert-danger">${escapeHtml(room.message || "Không tìm thấy phòng.")}</div>`;
      return;
    }

    const statusMap = {
      available: '<span class="badge text-bg-success">Còn trống</span>',
      booked: '<span class="badge text-bg-warning">Đã đặt</span>',
      occupied: '<span class="badge text-bg-primary">Đang ở</span>',
      maintenance: '<span class="badge text-bg-danger">Bảo trì</span>',
    };

    const backLink = isAdmin() ? (typeof resolveTopLevelPath === "function" ? resolveTopLevelPath("rooms.html") : "rooms.html") : "room-list.html";
    const backText = isAdmin() ? "Về quản lý phòng" : "Quay lại danh sách phòng";

    const chooseQuery = new URLSearchParams({ roomId: room._id });
    if (checkIn) chooseQuery.set("checkIn", checkIn);
    if (checkOut) chooseQuery.set("checkOut", checkOut);

    const actionButton = isAdmin()
      ? `<a href="${typeof resolveTopLevelPath === "function" ? resolveTopLevelPath("rooms.html") : "rooms.html"}" class="btn booking-primary-btn w-100"><i class="bi bi-grid"></i> Quản lý phòng</a>`
      : room.status === "available"
        ? `<a href="indexUser.html?${chooseQuery.toString()}" class="btn booking-primary-btn w-100"><i class="bi bi-check2-circle"></i> Chọn phòng này để đặt</a>`
        : `<button class="btn btn-secondary w-100" disabled><i class="bi bi-slash-circle"></i> Phòng hiện không thể đặt</button>`;

    container.innerHTML = `
      <div class="mb-4 d-flex justify-content-between gap-3 flex-wrap align-items-center">
        <a href="${backLink}${!isAdmin() && checkIn && checkOut ? `?checkIn=${encodeURIComponent(checkIn)}&checkOut=${encodeURIComponent(checkOut)}` : ""}" class="btn booking-outline-btn"><i class="bi bi-arrow-left"></i> ${backText}</a>
        <div>${statusMap[room.status] || room.status}</div>
      </div>

      <div class="row g-4 align-items-start">
        <div class="col-lg-8">
          <div class="booking-section-card mb-4">
            <div class="room-detail-header d-flex justify-content-between gap-3 flex-wrap align-items-start mb-3">
              <div>
                <div class="booking-mini-label">Phòng ${escapeHtml(room.roomNumber)}</div>
                <h1 class="room-detail-title">${escapeHtml(room.detailTitle || `${room.type} ${room.view || ""}`)}</h1>
                <p class="room-detail-subtitle">${escapeHtml(room.description || "Phòng tiện nghi, phù hợp cho kỳ nghỉ thoải mái.")}</p>
              </div>
              <div class="room-detail-score-box">
                <div class="room-rating-pill mb-2"><i class="bi bi-stars"></i> 9.1 Ấn tượng</div>
                <div class="small text-muted">Từ tiện nghi, vị trí và mức giá phù hợp</div>
              </div>
            </div>

            ${renderRoomGallery(room, `detailCarousel-${room._id || room.roomNumber}`)}

            <div class="row g-3 mt-1">
              <div class="col-md-6 col-xl-3"><div class="room-detail-fact-card"><i class="bi bi-people"></i><div><strong>${escapeHtml(room.capacity)}</strong><span>Sức chứa</span></div></div></div>
              <div class="col-md-6 col-xl-3"><div class="room-detail-fact-card"><i class="bi bi-aspect-ratio"></i><div><strong>${escapeHtml(room.sizeSqm || "-")}</strong><span>m²</span></div></div></div>
              <div class="col-md-6 col-xl-3"><div class="room-detail-fact-card"><i class="bi bi-moon-stars"></i><div><strong>${escapeHtml(room.bedType || "-")}</strong><span>Giường</span></div></div></div>
              <div class="col-md-6 col-xl-3"><div class="room-detail-fact-card"><i class="bi bi-eye"></i><div><strong>${escapeHtml(room.view || "-")}</strong><span>View</span></div></div></div>
            </div>
          </div>

          <div class="booking-section-card mb-4">
            <h2 class="booking-section-title">Điểm nổi bật</h2>
            <ul class="room-result-highlights mt-3">${renderItems(room.highlights)}</ul>
          </div>

          <div class="booking-section-card mb-4">
            <h2 class="booking-section-title">Tiện nghi và trang bị</h2>
            <div class="booking-amenities-chips mt-3 mb-4">${renderAmenityChips(room.amenities)}</div>
            <div class="row g-4">
              <div class="col-md-6">
                <h3 class="h6 fw-bold">Trong phòng</h3>
                <ul class="room-detail-bullet-list">${renderItems(room.roomFeatures)}</ul>
              </div>
              <div class="col-md-6">
                <h3 class="h6 fw-bold">Phòng tắm</h3>
                <ul class="room-detail-bullet-list">${renderItems(room.bathroomFeatures)}</ul>
              </div>
            </div>
          </div>

          <div class="booking-section-card">
            <h2 class="booking-section-title">Chính sách và dịch vụ</h2>
            <div class="row g-4 mt-1">
              <div class="col-md-6">
                <div class="room-policy-card h-100">
                  <h3 class="h6 fw-bold mb-3">Chính sách phòng</h3>
                  <ul class="room-detail-bullet-list mb-0">${renderItems(room.policies)}</ul>
                </div>
              </div>
              <div class="col-md-6">
                <div class="room-policy-card h-100">
                  <h3 class="h6 fw-bold mb-3">Dịch vụ đi kèm</h3>
                  <ul class="room-detail-bullet-list mb-0">${renderItems(room.extraServices)}</ul>
                </div>
              </div>
              <div class="col-md-6">
                <div class="room-policy-card h-100">
                  <h3 class="h6 fw-bold mb-3">Thời gian nhận / trả phòng</h3>
                  <div class="d-flex flex-column gap-2 small">
                    <span><strong>Check-in:</strong> ${escapeHtml(room.checkInTime || "14:00")}</span>
                    <span><strong>Check-out:</strong> ${escapeHtml(room.checkOutTime || "12:00")}</span>
                    <span><strong>Bữa sáng:</strong> ${room.breakfastIncluded ? "Có bao gồm" : "Không bao gồm"}</span>
                  </div>
                </div>
              </div>
              <div class="col-md-6">
                <div class="room-policy-card h-100">
                  <h3 class="h6 fw-bold mb-3">Chính sách hủy</h3>
                  <p class="small mb-0">${escapeHtml(room.cancellationPolicy || "Liên hệ khách sạn để biết thêm thông tin.")}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="col-lg-4">
          <div class="room-booking-side-card sticky-lg-top" style="top: 88px;">
            <div class="booking-mini-label">Giá từ</div>
            <div class="room-current-price mb-1">${roomDetailCurrency(room.pricePerNight)}</div>
            <div class="room-price-note mb-3">/ phòng / đêm</div>
            ${room.discountPercent ? `<div class="alert alert-success py-2 small">Ưu đãi hiện tại: tiết kiệm ${room.discountPercent}%</div>` : ""}
            <div class="room-side-info-list mb-3">
              <div><span>Tầng</span><strong>${escapeHtml(room.floor || "-")}</strong></div>
              <div><span>Hút thuốc</span><strong>${room.isSmokingAllowed ? "Cho phép" : "Không"}</strong></div>
              <div><span>Dọn phòng</span><strong>${escapeHtml(room.housekeepingStatus || "clean")}</strong></div>
            </div>
            <div class="room-side-date-box mb-3">
              <div><strong>Nhận phòng</strong><span>${checkIn ? new Date(checkIn).toLocaleDateString("vi-VN") : "Chọn ở bước đặt phòng"}</span></div>
              <div><strong>Trả phòng</strong><span>${checkOut ? new Date(checkOut).toLocaleDateString("vi-VN") : "Chọn ở bước đặt phòng"}</span></div>
            </div>
            ${actionButton}
            <a href="room-list.html${checkIn || checkOut ? `?${new URLSearchParams({ checkIn: checkIn || "", checkOut: checkOut || "" }).toString()}` : ""}" class="btn booking-outline-btn w-100 mt-2"><i class="bi bi-search"></i> Xem thêm phòng khác</a>
          </div>
        </div>
      </div>
    `;
    document.title = `Phòng ${room.roomNumber} - ${room.type}`;
  } catch (error) {
    console.error("Error loading room detail:", error);
    container.innerHTML = '<div class="alert alert-danger">Không thể tải chi tiết phòng.</div>';
  }
}

document.addEventListener("DOMContentLoaded", () => {
  configureNavbar();
  loadRoomDetailPage();
});
