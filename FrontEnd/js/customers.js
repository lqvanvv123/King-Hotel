const API_URL = "http://localhost:3000/api";
let customers = [];
let filteredCustomers = [];
let currentCustomerId = null;
const customerModalElement = document.getElementById("customerModal");
const customerModal = customerModalElement ? new bootstrap.Modal(customerModalElement) : null;

function setText(id, value) {
  const el = document.getElementById(id);
  if (el) el.textContent = value;
}

function formatDateTime(value) {
  return new Date(value).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" });
}

function renderCustomerSummary() {
  const now = new Date();
  const thisMonth = customers.filter((customer) => {
    const date = new Date(customer.createdAt);
    return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
  }).length;

  setText("customerTotalCount", customers.length);
  setText("customerEmailCount", customers.filter((customer) => customer.email).length);
  setText("customerAddressCount", customers.filter((customer) => customer.address).length);
  setText("customerThisMonthCount", thisMonth);
  setText("customerUpdatedAt", formatDateTime(new Date()));
}

function displayCustomers(customersData) {
  const tbody = document.getElementById("customersTableBody");
  if (!tbody) return;

  tbody.innerHTML = "";
  setText("customerResultCount", `${customersData.length} khách hàng`);

  if (!customersData.length) {
    tbody.innerHTML = `
      <tr>
        <td colspan="7">
          <div class="admin-empty-state">
            <i class="bi bi-person-x"></i>
            Không tìm thấy khách hàng phù hợp.
          </div>
        </td>
      </tr>
    `;
    return;
  }

  customersData.forEach((customer) => {
    const row = tbody.insertRow();
    const createdAt = customer.createdAt ? new Date(customer.createdAt).toLocaleDateString("vi-VN") : "--";

    row.innerHTML = `
      <td><strong>${customer.fullName}</strong></td>
      <td>${customer.email || "Chưa cập nhật"}</td>
      <td>${customer.phone || "Chưa cập nhật"}</td>
      <td>${customer.idCard || "Chưa cập nhật"}</td>
      <td>${customer.address || "Chưa cập nhật"}</td>
      <td>${createdAt}</td>
      <td>
        <div class="admin-table-actions">
          <button class="btn btn-sm btn-outline-primary" onclick="editCustomer('${customer._id}')">
            <i class="bi bi-pencil"></i>
          </button>
          ${isAdmin() ? `
          <button class="btn btn-sm btn-outline-danger" onclick="deleteCustomer('${customer._id}')">
            <i class="bi bi-trash"></i>
          </button>` : ""}
        </div>
      </td>
    `;
  });
}

function applyCustomerFilter() {
  const keyword = (document.getElementById("customerKeyword")?.value || "").trim().toLowerCase();
  filteredCustomers = customers.filter((customer) => {
    const haystack = [customer.fullName, customer.email, customer.phone, customer.idCard, customer.address]
      .join(" ")
      .toLowerCase();
    return !keyword || haystack.includes(keyword);
  });
  displayCustomers(filteredCustomers);
}

async function loadCustomers() {
  try {
    const response = await authFetch(`${API_URL}/customers`);
    customers = await response.json();
    filteredCustomers = [...customers];
    renderCustomerSummary();
    applyCustomerFilter();
  } catch (error) {
    console.error("Error loading customers:", error);
    alert("Không thể tải danh sách khách hàng");
  }
}

function openAddModal() {
  currentCustomerId = null;
  document.getElementById("modalTitle").textContent = "Thêm khách hàng mới";
  document.getElementById("customerForm").reset();
}

async function editCustomer(id) {
  try {
    const response = await authFetch(`${API_URL}/customers/${id}`);
    const customer = await response.json();

    currentCustomerId = customer._id;
    document.getElementById("modalTitle").textContent = "Chỉnh sửa khách hàng";
    document.getElementById("customerId").value = customer._id;
    document.getElementById("fullName").value = customer.fullName;
    document.getElementById("email").value = customer.email;
    document.getElementById("phone").value = customer.phone;
    document.getElementById("idCard").value = customer.idCard;
    document.getElementById("address").value = customer.address || "";

    customerModal?.show();
  } catch (error) {
    console.error("Error loading customer:", error);
    alert("Không thể tải thông tin khách hàng");
  }
}

async function saveCustomer() {
  const form = document.getElementById("customerForm");
  if (!form.checkValidity()) {
    form.reportValidity();
    return;
  }

  const customerData = {
    fullName: document.getElementById("fullName").value,
    email: document.getElementById("email").value,
    phone: document.getElementById("phone").value,
    idCard: document.getElementById("idCard").value,
    address: document.getElementById("address").value,
  };

  try {
    const url = currentCustomerId ? `${API_URL}/customers/${currentCustomerId}` : `${API_URL}/customers`;
    const method = currentCustomerId ? "PUT" : "POST";
    const response = await authFetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(customerData),
    });

    if (response.ok) {
      customerModal?.hide();
      await loadCustomers();
      alert(currentCustomerId ? "Cập nhật khách hàng thành công!" : "Thêm khách hàng mới thành công!");
    } else {
      const error = await response.json();
      alert(error.message || "Có lỗi xảy ra");
    }
  } catch (error) {
    console.error("Error saving customer:", error);
    alert("Không thể lưu khách hàng");
  }
}

async function deleteCustomer(id) {
  if (!isAdmin()) {
    alert("Chỉ admin mới được xóa khách hàng.");
    return;
  }

  if (!confirm("Bạn có chắc chắn muốn xóa khách hàng này?")) return;

  try {
    const response = await authFetch(`${API_URL}/customers/${id}`, { method: "DELETE" });
    if (response.ok) {
      await loadCustomers();
      alert("Xóa khách hàng thành công!");
    } else {
      const error = await response.json();
      alert(error.message || "Không thể xóa khách hàng");
    }
  } catch (error) {
    console.error("Error deleting customer:", error);
    alert("Không thể xóa khách hàng");
  }
}

function resetCustomerFilter() {
  const input = document.getElementById("customerKeyword");
  if (input) input.value = "";
  applyCustomerFilter();
}

document.addEventListener("DOMContentLoaded", () => {
  loadCustomers();
  document.getElementById("customerKeyword")?.addEventListener("input", applyCustomerFilter);
});
