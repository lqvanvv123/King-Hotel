const AUTH_API_URL = "https://king-hotel-ycsd.onrender.com/api/auth";

function isUserDirectoryPage() {
  return /\/User\//.test(window.location.pathname);
}

function resolveTopLevelPath(page) {
  return isUserDirectoryPage() ? `../${page}` : page;
}

function resolveAssetPath(path) {
  if (!path) return path;
  if (
    /^(https?:)?\/\//.test(path) ||
    path.startsWith("data:") ||
    path.startsWith("/")
  ) {
    return path;
  }
  if (isUserDirectoryPage() && /^(assets|css|js|data)\//.test(path)) {
    return `../${path}`;
  }
  return path;
}

function getToken() {
  return localStorage.getItem("token");
}

function getCurrentUser() {
  const user = localStorage.getItem("user");
  return user ? JSON.parse(user) : null;
}

function isLoggedIn() {
  return !!getToken();
}

function getAuthHeaders(extraHeaders = {}) {
  const token = getToken();
  return {
    ...extraHeaders,
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

async function authFetch(url, options = {}) {
  const response = await fetch(url, {
    ...options,
    headers: getAuthHeaders(options.headers || {}),
  });

  if (response.status === 401) {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    alert("Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.");
    window.location.href = resolveTopLevelPath("login.html");
  }

  return response;
}

function hasRole(role) {
  const user = getCurrentUser();
  return user && user.role === role;
}

function isAdmin() {
  return hasRole("admin");
}

function isCustomer() {
  return hasRole("customer");
}

function getHomePageByRole() {
  const user = getCurrentUser();
  return user?.role === "customer" ? "indexUser.html" : "index.html";
}

function logout() {
  localStorage.removeItem("token");
  localStorage.removeItem("user");
  window.location.href = resolveTopLevelPath("login.html");
}

function updateAuthNavbar() {
  const loginNavItem = document.getElementById("loginNavItem");
  const registerNavItem = document.getElementById("registerNavItem");
  const logoutNavItem = document.getElementById("logoutNavItem");
  const userNameNav = document.getElementById("userNameNav");
  const user = getCurrentUser();

  if (!loginNavItem || !registerNavItem || !logoutNavItem) return;

  if (isLoggedIn()) {
    loginNavItem.classList.add("d-none");
    registerNavItem.classList.add("d-none");
    logoutNavItem.classList.remove("d-none");
    if (userNameNav && user) {
      const roleLabel =
        user.role === "admin"
          ? "Admin"
          : user.role === "customer"
            ? "Khách hàng"
            : "Nhân viên";
      userNameNav.textContent = `${user.fullName} (${roleLabel})`;
    }
  } else {
    loginNavItem.classList.remove("d-none");
    registerNavItem.classList.remove("d-none");
    logoutNavItem.classList.add("d-none");
  }
}

function protectPage() {
  const adminOnlyPages = [
    "index.html",
    "customers.html",
    "dashboard.html",
    "bookings.html",
  ];
  const customerOnlyPages = ["indexUser.html", "room-list.html"];
  const loggedInPages = [
    "rooms.html",
    "room-detail.html",
    ...adminOnlyPages,
    ...customerOnlyPages,
  ];
  const currentPage = window.location.pathname.split("/").pop() || "index.html";

  if (loggedInPages.includes(currentPage) && !isLoggedIn()) {
    alert("Bạn cần đăng nhập để sử dụng chức năng này.");
    window.location.href = resolveTopLevelPath("login.html");
    return;
  }

  if (adminOnlyPages.includes(currentPage) && isCustomer()) {
    alert("Tài khoản khách hàng không có quyền truy cập trang quản trị.");
    window.location.href = "indexUser.html";
    return;
  }

  if (
    customerOnlyPages.includes(currentPage) &&
    isLoggedIn() &&
    !isCustomer()
  ) {
    window.location.href = "index.html";
  }
}

function applyRolePermissions() {
  const user = getCurrentUser();
  if (!user) return;

  document.querySelectorAll("[data-admin-only]").forEach((element) => {
    if (!isAdmin()) {
      element.classList.add("d-none");
    } else {
      element.classList.remove("d-none");
    }
  });

  document.querySelectorAll("[data-role-label]").forEach((element) => {
    const roleLabel =
      user.role === "admin"
        ? "Quyền: Admin"
        : user.role === "customer"
          ? "Vai trò: Khách hàng"
          : "Quyền: Nhân viên";
    element.textContent = roleLabel;
    element.className =
      user.role === "admin"
        ? "badge bg-danger"
        : user.role === "customer"
          ? "badge bg-success"
          : "badge bg-info";
  });
}

const registerForm = document.getElementById("registerForm");
if (registerForm) {
  registerForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const fullName = document.getElementById("registerFullName").value.trim();
    const email = document.getElementById("registerEmail").value.trim();
    const phone = document.getElementById("registerPhone").value.trim();
    const idCard = document.getElementById("registerIdCard").value.trim();
    const address = document.getElementById("registerAddress").value.trim();
    const password = document.getElementById("registerPassword").value.trim();
    const confirmPassword = document
      .getElementById("registerConfirmPassword")
      .value.trim();
    const message = document.getElementById("registerMessage");

    message.textContent = "";
    message.className = "alert d-none";

    if (
      !fullName ||
      !email ||
      !phone ||
      !idCard ||
      !password ||
      !confirmPassword
    ) {
      message.textContent = "Vui lòng nhập đầy đủ thông tin.";
      message.className = "alert alert-danger";
      return;
    }

    if (password.length < 6) {
      message.textContent = "Mật khẩu phải có ít nhất 6 ký tự.";
      message.className = "alert alert-danger";
      return;
    }

    if (password !== confirmPassword) {
      message.textContent = "Mật khẩu xác nhận không khớp.";
      message.className = "alert alert-danger";
      return;
    }

    try {
      const response = await fetch(`${AUTH_API_URL}/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName,
          email,
          phone,
          idCard,
          address,
          password,
          confirmPassword,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        message.textContent = data.message || "Đăng ký thất bại.";
        message.className = "alert alert-danger";
        return;
      }

      message.textContent =
        "Đăng ký thành công. Đang chuyển sang trang đăng nhập...";
      message.className = "alert alert-success";

      setTimeout(() => {
        window.location.href = resolveTopLevelPath("login.html");
      }, 1200);
    } catch (error) {
      message.textContent = "Không thể kết nối đến server.";
      message.className = "alert alert-danger";
    }
  });
}

const loginForm = document.getElementById("loginForm");
if (loginForm) {
  loginForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const identifier = document.getElementById("loginIdentifier").value.trim();
    const password = document.getElementById("loginPassword").value.trim();
    const message = document.getElementById("loginMessage");

    message.textContent = "";
    message.className = "alert d-none";

    if (!identifier || !password) {
      message.textContent = "Vui lòng nhập tài khoản và mật khẩu.";
      message.className = "alert alert-danger";
      return;
    }

    try {
      const response = await fetch(`${AUTH_API_URL}/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifier, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        message.textContent = data.message || "Đăng nhập thất bại.";
        message.className = "alert alert-danger";
        return;
      }

      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));

      message.textContent = "Đăng nhập thành công. Đang chuyển trang...";
      message.className = "alert alert-success";

      setTimeout(() => {
        window.location.href =
          data.user.role === "customer" ? "indexUser.html" : "index.html";
      }, 800);
    } catch (error) {
      message.textContent = "Không thể kết nối đến server.";
      message.className = "alert alert-danger";
    }
  });
}

document.addEventListener("DOMContentLoaded", () => {
  protectPage();
  updateAuthNavbar();
  applyRolePermissions();
});
