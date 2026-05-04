const BASE_URL = "http://localhost:8080";

let managerPage = 0;
let employeePage = 0;
let adminPage = 0;
const pageSize = 5;

function getLoggedInUser() {
  return JSON.parse(localStorage.getItem("loggedInUser"));
}

function showToast(message, isError = false) {
  const toast = document.getElementById("toast");
  toast.textContent = message;
  toast.classList.remove("hidden");
  toast.classList.toggle("error", isError);

  setTimeout(() => {
    toast.classList.add("hidden");
    toast.classList.remove("error");
  }, 2500);
}

function showPanel(panelId) {
  document.getElementById("adminPanel").classList.add("hidden");
  document.getElementById("employeePanel").classList.add("hidden");
  document.getElementById("managerPanel").classList.add("hidden");
  document.getElementById(panelId).classList.remove("hidden");
}

function showRolePanel(role) {
  document.getElementById("adminNavBtn").classList.add("hidden");
  document.getElementById("employeeNavBtn").classList.add("hidden");
  document.getElementById("managerNavBtn").classList.add("hidden");

  if (role === "ADMIN") {
    document.getElementById("adminNavBtn").classList.remove("hidden");
    showPanel("adminPanel");
    loadUsers();
    loadAdminClaims();
  } else if (role === "EMPLOYEE") {
    document.getElementById("employeeNavBtn").classList.remove("hidden");
    showPanel("employeePanel");
    loadMyClaims();
  } else if (role === "MANAGER") {
    document.getElementById("managerNavBtn").classList.remove("hidden");
    showPanel("managerPanel");
    loadAssignedClaims();
  }
}

async function login() {
  const email = document.getElementById("loginEmail").value.trim();
  const password = document.getElementById("loginPassword").value.trim();
  const loginMessage = document.getElementById("loginMessage");

  loginMessage.innerText = "";

  if (!email || !password) {
    loginMessage.innerText = "Email and password are required";
    return;
  }

  try {
    const response = await fetch(`${BASE_URL}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password })
    });

    const data = await response.json();

    if (!response.ok) {
      loginMessage.innerText = data.message || "Invalid email or password";
      return;
    }

    localStorage.setItem("loggedInUser", JSON.stringify(data));

    document.getElementById("loginSection").classList.add("hidden");
    document.getElementById("dashboardSection").classList.remove("hidden");
    document.getElementById("welcomeText").innerText = `Welcome, ${data.name} (${data.role})`;

    showRolePanel(data.role);
    showToast("Login successful");
  } catch {
    loginMessage.innerText = "Server error";
  }
}

function logout() {
  localStorage.removeItem("loggedInUser");
  document.getElementById("dashboardSection").classList.add("hidden");
  document.getElementById("loginSection").classList.remove("hidden");
  document.getElementById("loginMessage").innerText = "";
  showToast("Logged out successfully");
}

/* ADMIN */

async function createUser() {
  const body = {
    name: document.getElementById("userName").value.trim(),
    email: document.getElementById("userEmail").value.trim(),
    password: document.getElementById("userPassword").value.trim(),
    role: document.getElementById("userRole").value
  };

  const managerId = document.getElementById("userManagerId").value.trim();

  if (!body.name || !body.email || !body.password) {
    showToast("All fields are required", true);
    return;
  }

  if (!body.email.endsWith("@company.com")) {
    showToast("Only company email allowed", true);
    return;
  }

  if (managerId) {
    body.managerId = Number(managerId);
  }

  try {
    const response = await fetch(`${BASE_URL}/api/admin/users`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body)
    });

    const data = await response.json();

    if (!response.ok) {
      showToast(data.message || "Failed to create user", true);
      return;
    }

    document.getElementById("userName").value = "";
    document.getElementById("userEmail").value = "";
    document.getElementById("userPassword").value = "";
    document.getElementById("userManagerId").value = "";
    document.getElementById("userRole").value = "ADMIN";

    showToast("User created successfully");
    loadUsers();
  } catch {
    showToast("Error while creating user", true);
  }
}

async function loadUsers() {
  try {
    const response = await fetch(`${BASE_URL}/api/admin/users`);
    const data = await response.json();

    const users = data.data || data;

    if (!response.ok) {
      showToast(data.message || "Failed to load users", true);
      return;
    }

    if (!users || users.length === 0) {
      document.getElementById("usersWrap").innerHTML = `<div class="no-data">No users found</div>`;
      return;
    }

    let html = `
      <table>
        <thead>
          <tr>
            <th>ID</th>
            <th>Name</th>
            <th>Email</th>
            <th>Role</th>
            <th>Manager ID</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
    `;

    users.forEach(user => {
      html += `
        <tr>
          <td>${user.id}</td>
          <td>${user.name}</td>
          <td>${user.email}</td>
          <td>${user.role}</td>
          <td>${user.managerId ?? "-"}</td>
          <td>
            <button class="danger-btn" onclick="deleteUser(${user.id})">Delete</button>
          </td>
        </tr>
      `;
    });

    html += `</tbody></table>`;
    document.getElementById("usersWrap").innerHTML = html;
  } catch {
    showToast("Error while loading users", true);
  }
}

async function deleteUser(userId) {
  try {
    const response = await fetch(`${BASE_URL}/api/admin/users/${userId}`, {
      method: "DELETE"
    });

    const data = await response.json().catch(() => null);

    if (!response.ok) {
      showToast(data?.message || "Failed to delete user", true);
      return;
    }

    showToast("User deleted successfully");
    loadUsers();
  } catch {
    showToast("Error while deleting user", true);
  }
}

async function assignManager() {
  const employeeId = document.getElementById("assignEmployeeId")?.value;
  const managerId = document.getElementById("assignManagerId")?.value;

  if (!employeeId || !managerId) {
    showToast("Employee ID and Manager ID required", true);
    return;
  }

  try {
    const response = await fetch(`${BASE_URL}/api/admin/users/${employeeId}/manager/${managerId}`, {
      method: "PUT"
    });

    const data = await response.json().catch(() => null);

    if (!response.ok) {
      showToast(data?.message || "Failed to assign manager", true);
      return;
    }

    showToast("Manager assigned successfully");
    loadUsers();
  } catch {
    showToast("Error while assigning manager", true);
  }
}

/* EMPLOYEE */

async function submitClaim() {
  const user = getLoggedInUser();

  if (!user) {
    showToast("Please login first", true);
    return;
  }

  const body = {
    amount: Number(document.getElementById("claimAmount").value),
    claimDate: document.getElementById("claimDate").value,
    description: document.getElementById("claimDescription").value.trim()
  };

  if (!body.amount || body.amount <= 0 || !body.claimDate || !body.description) {
    showToast("All fields required and amount must be positive", true);
    return;
  }

  try {
    const response = await fetch(`${BASE_URL}/api/employee/claims/${user.id}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body)
    });

    const data = await response.json();

    if (!response.ok) {
      showToast(data.message || "Failed to submit claim", true);
      return;
    }

    document.getElementById("claimAmount").value = "";
    document.getElementById("claimDate").value = "";
    document.getElementById("claimDescription").value = "";

    showToast("Claim submitted successfully");
    loadMyClaims();
  } catch {
    showToast("Error while submitting claim", true);
  }
}

async function loadMyClaims() {
  const user = getLoggedInUser();

  if (!user) {
    return;
  }

  try {
    const response = await fetch(
      `${BASE_URL}/api/employee/claims/${user.id}?page=${employeePage}&size=${pageSize}`
    );

    const data = await response.json();

    if (!response.ok) {
      showToast(data.message || "Failed to load claims", true);
      return;
    }

    const claims = data.content || data.data?.content || data.data || data;
    renderMyClaims(claims);

    const pageText = document.getElementById("employeePageText");
    if (pageText) {
      pageText.innerText = `Page ${employeePage}`;
    }
  } catch {
    showToast("Error while loading my claims", true);
  }
}

function renderMyClaims(claims) {
  const wrap = document.getElementById("myClaimsWrap");

  if (!wrap) {
    return;
  }

  if (!claims || claims.length === 0) {
    wrap.innerHTML = `<div class="no-data">No claims found</div>`;
    return;
  }

  let html = `
    <table>
      <thead>
        <tr>
          <th>ID</th>
          <th>Amount</th>
          <th>Date</th>
          <th>Description</th>
          <th>Status</th>
          <th>Comment</th>
        </tr>
      </thead>
      <tbody>
  `;

  claims.forEach(claim => {
    html += `
      <tr>
        <td>${claim.id}</td>
        <td>${claim.amount}</td>
        <td>${claim.claimDate}</td>
        <td>${claim.description}</td>
        <td>${claim.status}</td>
        <td>${claim.reviewerComment || "-"}</td>
      </tr>
    `;
  });

  html += `</tbody></table>`;
  wrap.innerHTML = html;
}

function nextEmployeePage() {
  employeePage++;
  loadMyClaims();
}

function prevEmployeePage() {
  if (employeePage > 0) {
    employeePage--;
    loadMyClaims();
  }
}

/* MANAGER / REVIEWER */

async function loadAssignedClaims() {
  const user = getLoggedInUser();

  if (!user) {
    return;
  }

  try {
    const response = await fetch(
      `${BASE_URL}/api/reviewer/claims?reviewerId=${user.id}&page=${managerPage}&size=${pageSize}`
    );

    const data = await response.json();

    if (!response.ok) {
      showToast(data.message || "Failed to load assigned claims", true);
      return;
    }

    const claims = data.content || data.data?.content || data.data || data;
    renderClaimsTable(claims, "claimsWrap");

    const pageText = document.getElementById("managerPageText");
    if (pageText) {
      pageText.innerText = `Page ${managerPage}`;
    }
  } catch {
    showToast("Error while loading assigned claims", true);
  }
}

function renderClaimsTable(claims, wrapId) {
  const wrap = document.getElementById(wrapId);

  if (!wrap) {
    return;
  }

  if (!claims || claims.length === 0) {
    wrap.innerHTML = `<div class="no-data">No claims found</div>`;
    return;
  }

  let html = `
    <table>
      <thead>
        <tr>
          <th>Claim ID</th>
          <th>Employee ID</th>
          <th>Amount</th>
          <th>Date</th>
          <th>Description</th>
          <th>Status</th>
          <th>Comment</th>
          <th>Action</th>
        </tr>
      </thead>
      <tbody>
  `;

  claims.forEach(claim => {
    const isReviewed = claim.status !== "SUBMITTED";
    const disabled = isReviewed ? "disabled" : "";
    const savedComment = claim.reviewerComment || "";

    html += `
      <tr>
        <td>${claim.id}</td>
        <td>${claim.employeeId ?? "-"}</td>
        <td>${claim.amount}</td>
        <td>${claim.claimDate}</td>
        <td>${claim.description}</td>
        <td>${claim.status}</td>
        <td>
          <input 
            class="small-input" 
            id="comment-${claim.id}" 
            placeholder="Add comment"
            value="${savedComment}"
            ${disabled}
          />
        </td>
        <td>
          <button class="approve-btn" onclick="approveClaim(${claim.id})" ${disabled}>
            Approve
          </button>
          <button class="reject-btn" onclick="rejectClaim(${claim.id})" ${disabled}>
            Reject
          </button>
        </td>
      </tr>
    `;
  });

  html += `</tbody></table>`;
  wrap.innerHTML = html;
}

async function approveClaim(claimId) {
  const user = getLoggedInUser();

  if (!user) {
    showToast("Please login first", true);
    return;
  }

  const commentInput = document.getElementById(`comment-${claimId}`);
  const comment = commentInput ? commentInput.value.trim() : "";

  try {
    const response = await fetch(
      `${BASE_URL}/api/reviewer/claims/${claimId}/approve?reviewerId=${user.id}`,
      {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ comment })
      }
    );

    const data = await response.json();

    if (!response.ok) {
      showToast(data.message || "Failed to approve claim", true);
      return;
    }

    showToast("Claim approved successfully");

    if (user.role === "ADMIN") {
      loadAdminClaims();
    } else {
      loadAssignedClaims();
    }
  } catch {
    showToast("Error while approving claim", true);
  }
}

async function rejectClaim(claimId) {
  const user = getLoggedInUser();

  if (!user) {
    showToast("Please login first", true);
    return;
  }

  const commentInput = document.getElementById(`comment-${claimId}`);
  const comment = commentInput ? commentInput.value.trim() : "";

  if (!comment) {
    showToast("Comment is required for rejection", true);
    return;
  }

  try {
    const response = await fetch(
      `${BASE_URL}/api/reviewer/claims/${claimId}/reject?reviewerId=${user.id}`,
      {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ comment })
      }
    );

    const data = await response.json();

    if (!response.ok) {
      showToast(data.message || "Failed to reject claim", true);
      return;
    }

    showToast("Claim rejected successfully");

    if (user.role === "ADMIN") {
      loadAdminClaims();
    } else {
      loadAssignedClaims();
    }
  } catch {
    showToast("Error while rejecting claim", true);
  }
}

function nextManagerPage() {
  managerPage++;
  loadAssignedClaims();
}

function prevManagerPage() {
  if (managerPage > 0) {
    managerPage--;
    loadAssignedClaims();
  }
}

/* ADMIN FALLBACK CLAIMS */

async function loadAdminClaims() {
  const user = getLoggedInUser();

  if (!user || user.role !== "ADMIN") {
    return;
  }

  try {
    const response = await fetch(
      `${BASE_URL}/api/reviewer/claims?reviewerId=${user.id}&page=${adminPage}&size=${pageSize}`
    );

    const data = await response.json();

    if (!response.ok) {
      showToast(data.message || "Failed to load admin claims", true);
      return;
    }

    const claims = data.content || data.data?.content || data.data || data;
    renderClaimsTable(claims, "adminClaimsWrap");

    const pageText = document.getElementById("adminPageText");
    if (pageText) {
      pageText.innerText = `Page ${adminPage}`;
    }
  } catch {
    showToast("Error while loading admin claims", true);
  }
}

function nextAdminPage() {
  adminPage++;
  loadAdminClaims();
}

function prevAdminPage() {
  if (adminPage > 0) {
    adminPage--;
    loadAdminClaims();
  }
}

window.onload = function () {
  const user = getLoggedInUser();

  if (user) {
    document.getElementById("loginSection").classList.add("hidden");
    document.getElementById("dashboardSection").classList.remove("hidden");
    document.getElementById("welcomeText").innerText = `Welcome, ${user.name} (${user.role})`;
    showRolePanel(user.role);
  }
};