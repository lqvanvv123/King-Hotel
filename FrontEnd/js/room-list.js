const ROOM_LIST_API_URL = "https://king-hotel-ycsd.onrender.com/api";
let roomListCache = [];

function formatRoomPrice(amount) {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  }).format(amount || 0);
}

function getRoomListParams() {
  const params = new URLSearchParams();
  const type = document.getElementById("filterType")?.value || "";
  const capacity = document.getElementById("filterCapacity")?.value || "";
  const maxPrice = document.getElementById("filterPrice")?.value || "";
  const view = document.getElementById("filterView")?.value || "";
  const breakfast = document.getElementById("filterBreakfast")?.value || "";
  const checkIn = document.getElementById("searchCheckIn")?.value || "";
  const checkOut = document.getElementById("searchCheckOut")?.value || "";
  const sortBy = document.getElementById("sortBy")?.value || "recommended";

  if (type) params.set("type", type);
  if (capacity) params.set("capacity", capacity);
  if (maxPrice) params.set("maxPrice", maxPrice);
  if (view) params.set("view", view);
  if (breakfast) params.set("breakfast", breakfast);
  if (checkIn) params.set("checkIn", checkIn);
  if (checkOut) params.set("checkOut", checkOut);
  if (sortBy) params.set("sortBy", sortBy);

  return params;
}

function syncRoomListQueryString() {
  const params = getRoomListParams();
  const query = params.toString();
  const newUrl = `room-list.html${query ? `?${query}` : ""}`;
  history.replaceState({}, "", newUrl);
}

function applyRoomListParamsFromQuery() {
  const params = new URLSearchParams(window.location.search);
  const mapping = [
    ["filterType", "type"],
    ["filterCapacity", "capacity"],
    ["filterPrice", "maxPrice"],
    ["filterView", "view"],
    ["filterBreakfast", "breakfast"],
    ["searchCheckIn", "checkIn"],
    ["searchCheckOut", "checkOut"],
    ["sortBy", "sortBy"],
  ];

  mapping.forEach(([elementId, paramKey]) => {
    const el = document.getElementById(elementId);
    const value = params.get(paramKey);
    if (el && value !== null) el.value = value;
  });
}

function buildRoomMetaText(rooms) {
  const checkIn = document.getElementById("searchCheckIn")?.value;
  const checkOut = document.getElementById("searchCheckOut")?.value;
  if (checkIn && checkOut) {
    return `${rooms.length} phòng phù hợp · ${new Date(checkIn).toLocaleDateString("vi-VN")} - ${new Date(checkOut).toLocaleDateString("vi-VN")}`;
  }
  return `${rooms.length} phòng phù hợp đang còn trống`;
}

async function loadRoomList() {
  syncRoomListQueryString();

  try {
    const response = await authFetch(
      `${ROOM_LIST_API_URL}/rooms?status=available`,
    );
    const rooms = await response.json();
    roomListCache = Array.isArray(rooms) ? rooms : [];
    const filtered = filterAndSortRooms(roomListCache);
    renderRoomList(filtered);
    const meta = document.getElementById("roomListMeta");
    if (meta) meta.textContent = buildRoomMetaText(filtered);
  } catch (error) {
    console.error("Error loading room list:", error);
    alert("Không thể tải danh sách phòng.");
  }
}

function filterAndSortRooms(rooms) {
  const type = document.getElementById("filterType")?.value || "";
  const capacity = Number(
    document.getElementById("filterCapacity")?.value || 0,
  );
  const maxPrice = Number(document.getElementById("filterPrice")?.value || 0);
  const view = document.getElementById("filterView")?.value || "";
  const breakfast = document.getElementById("filterBreakfast")?.value || "";
  const sortBy = document.getElementById("sortBy")?.value || "recommended";

  let filtered = [...rooms].filter((room) => {
    if (type && room.type !== type) return false;
    if (capacity && Number(room.capacity || 0) < capacity) return false;
    if (maxPrice && Number(room.pricePerNight || 0) > maxPrice) return false;
    if (view && room.view !== view) return false;
    if (breakfast === "true" && !room.breakfastIncluded) return false;
    if (breakfast === "false" && room.breakfastIncluded) return false;
    return true;
  });

  filtered.sort((a, b) => {
    if (sortBy === "priceAsc")
      return (a.pricePerNight || 0) - (b.pricePerNight || 0);
    if (sortBy === "priceDesc")
      return (b.pricePerNight || 0) - (a.pricePerNight || 0);
    if (sortBy === "sizeDesc") return (b.sizeSqm || 0) - (a.sizeSqm || 0);

    const scoreA =
      (a.breakfastIncluded ? 2 : 0) +
      (a.discountPercent ? 1 : 0) +
      (a.amenities?.length || 0);
    const scoreB =
      (b.breakfastIncluded ? 2 : 0) +
      (b.discountPercent ? 1 : 0) +
      (b.amenities?.length || 0);
    return scoreB - scoreA;
  });

  return filtered;
}

function renderRoomList(rooms) {
  const container = document.getElementById("roomListContainer");
  container.innerHTML = "";

  if (!rooms.length) {
    container.innerHTML =
      '<div class="alert alert-warning mb-0">Không có phòng phù hợp với bộ lọc hiện tại.</div>';
    return;
  }

  const checkIn = document.getElementById("searchCheckIn")?.value || "";
  const checkOut = document.getElementById("searchCheckOut")?.value || "";

  rooms.forEach((room) => {
    const article = document.createElement("article");
    article.className = "room-result-card";
    const amenities =
      room.amenities
        ?.slice(0, 5)
        .map((item) => `<span>${item}</span>`)
        .join("") || "";
    const highlights =
      room.highlights
        ?.slice(0, 3)
        .map(
          (item) => `<li><i class="bi bi-check-circle-fill"></i> ${item}</li>`,
        )
        .join("") || "";
    const detailParams = new URLSearchParams({ id: room._id });
    if (checkIn) detailParams.set("checkIn", checkIn);
    if (checkOut) detailParams.set("checkOut", checkOut);
    const selectParams = new URLSearchParams({ roomId: room._id });
    if (checkIn) selectParams.set("checkIn", checkIn);
    if (checkOut) selectParams.set("checkOut", checkOut);

    article.innerHTML = `
      <div class="room-result-image-col">
        <img src="${typeof resolveAssetPath === "function" ? resolveAssetPath(room.imageUrl || "assets/rooms/standard-1.jpg") : room.imageUrl || "assets/rooms/standard-1.jpg"}" alt="Phòng ${room.roomNumber}" class="room-result-image">
        <div class="room-result-image-tag">${room.type}</div>
      </div>
      <div class="room-result-content-col">
        <div class="room-result-header">
          <div>
            <div class="booking-mini-label">Phòng ${room.roomNumber}</div>
            <h3 class="room-result-title">${room.detailTitle || `${room.type} ${room.view || ""}`}</h3>
            <p class="room-result-subtitle">${room.description || "Phòng đầy đủ tiện nghi, phù hợp cho chuyến đi thoải mái."}</p>
          </div>
          <div class="room-result-rating">
            <span class="room-rating-pill"><i class="bi bi-hand-thumbs-up-fill"></i> ${8 + Math.min((room.amenities?.length || 0) / 10, 1.5).toFixed(1)}</span>
            <small>${room.breakfastIncluded ? "Có ăn sáng" : "Không ăn sáng"}</small>
          </div>
        </div>

        <div class="room-result-facts">
          <span><i class="bi bi-people"></i> ${room.capacity} khách</span>
          <span><i class="bi bi-aspect-ratio"></i> ${room.sizeSqm || "-"} m²</span>
          <span><i class="bi bi-layers"></i> Tầng ${room.floor || "-"}</span>
          <span><i class="bi bi-eye"></i> ${room.view || "-"}</span>
          <span><i class="bi bi-moon-stars"></i> ${room.bedType || "-"}</span>
        </div>

        <div class="booking-amenities-chips">${amenities}</div>
        <ul class="room-result-highlights">${highlights}</ul>

        <div class="room-result-footer">
          <div>
            ${room.discountPercent ? `<div class="room-old-price">Tiết kiệm ${room.discountPercent}%</div>` : '<div class="room-old-price">Giá đã gồm thuế và phí cơ bản</div>'}
            <div class="room-current-price">${formatRoomPrice(room.pricePerNight)}</div>
            <div class="room-price-note">/ phòng / đêm</div>
          </div>
          <div class="d-flex gap-2 flex-wrap justify-content-end">
            <a href="room-detail.html?${detailParams.toString()}" class="btn booking-outline-btn"><i class="bi bi-eye"></i> Xem chi tiết</a>
            <a href="indexUser.html?${selectParams.toString()}" class="btn booking-primary-btn"><i class="bi bi-check2-circle"></i> Chọn phòng</a>
          </div>
        </div>
      </div>
    `;
    container.appendChild(article);
  });
}

function resetRoomFilters() {
  [
    "filterType",
    "filterCapacity",
    "filterPrice",
    "filterView",
    "filterBreakfast",
  ].forEach((id) => {
    const el = document.getElementById(id);
    if (el) el.value = "";
  });
  document.getElementById("sortBy").value = "recommended";
  loadRoomList();
}

document.addEventListener("DOMContentLoaded", () => {
  applyRoomListParamsFromQuery();
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);
  if (!document.getElementById("searchCheckIn").value)
    document.getElementById("searchCheckIn").value = today
      .toISOString()
      .split("T")[0];
  if (!document.getElementById("searchCheckOut").value)
    document.getElementById("searchCheckOut").value = tomorrow
      .toISOString()
      .split("T")[0];
  loadRoomList();
});
