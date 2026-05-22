// ==================== TOAST NOTIFICATIONS ====================

function showToast(message, type = "success") {
    const toast = document.createElement("div");
    toast.className = `toast toast-${type}`;
    toast.innerHTML = `
        <div class="toast-content">
            <span class="toast-message">${message}</span>
            <button class="toast-close" onclick="this.parentElement.parentElement.remove()">×</button>
        </div>
    `;
    
    const toastContainer = document.getElementById("toastContainer") || createToastContainer();
    toastContainer.appendChild(toast);

    // Auto remove after 4 seconds
    setTimeout(() => {
        if (toast.parentElement) {
            toast.style.animation = "slideOut 0.3s ease forwards";
            setTimeout(() => toast.remove(), 300);
        }
    }, 4000);
}

function createToastContainer() {
    const container = document.createElement("div");
    container.id = "toastContainer";
    container.className = "toast-container";
    document.body.appendChild(container);
    return container;
}

// ==================== SESSION MANAGEMENT ====================

let currentSession = {
    sessionId: localStorage.getItem("sessionId"),
    role: localStorage.getItem("userRole"),
    email: localStorage.getItem("userEmail")
};

function isLoggedIn() {
    return currentSession.sessionId && currentSession.role;
}

function logout() {
    localStorage.removeItem("sessionId");
    localStorage.removeItem("userRole");
    localStorage.removeItem("userEmail");
    currentSession = { sessionId: null, role: null, email: null };
    window.location.href = "/login.html";
}

// ==================== LOGIN PAGE ====================

document.addEventListener("DOMContentLoaded", function() {
    // Handle login page
    const loginForm = document.getElementById("loginForm");
    const roleButtons = document.querySelectorAll(".role-btn");

    let selectedRole = "employee";

    if (roleButtons.length > 0) {
        // Login page initialization
        roleButtons.forEach(btn => {
            btn.addEventListener("click", (e) => {
                e.preventDefault();
                roleButtons.forEach(b => b.classList.remove("active"));
                btn.classList.add("active");
                selectedRole = btn.dataset.role;
            });
        });

        if (loginForm) {
            loginForm.addEventListener("submit", async function(e) {
                e.preventDefault();
                console.log("Login form submitted");

                const email = document.getElementById("email").value;
                const password = document.getElementById("password").value;
                const errorMessage = document.getElementById("errorMessage");

                try {
                    const res = await fetch("/login", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                            email: email,
                            password: password,
                            role: selectedRole
                        })
                    });

                    const data = await res.json();

                    if (data.success) {
                        localStorage.setItem("sessionId", data.session_id);
                        localStorage.setItem("userRole", data.role);
                        localStorage.setItem("userEmail", data.email);
                        
                        if (data.role === "manager") {
                            window.location.href = "/manager-dashboard";
                        } else {
                            window.location.href = "/employee-dashboard";
                        }
                    } else {
                        errorMessage.textContent = data.message;
                        errorMessage.style.display = "block";
                    }
                } catch (err) {
                    console.error("Login error:", err);
                    errorMessage.textContent = "An error occurred. Please try again.";
                    errorMessage.style.display = "block";
                }
            });
        }
    }

    // Handle apply leave form (employee)
    const leaveForm = document.getElementById("leaveForm");
    if (leaveForm) {
        console.log("Apply leave form found");
        leaveForm.addEventListener("submit", async function(e) {
            e.preventDefault();
            console.log("Leave form submitted");

            if (!isLoggedIn()) {
                showToast("Please log in first", "error");
                window.location.href = "/login.html";
                return;
            }

            const name = document.getElementById("name").value;
            const fromDate = document.getElementById("fromDate").value;
            const toDate = document.getElementById("toDate").value;
            const reason = document.getElementById("reason").value;

            try {
                const res = await fetch("/submit_leave", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        name: name,
                        fromDate: fromDate,
                        toDate: toDate,
                        reason: reason,
                        session_id: currentSession.sessionId
                    })
                });

                const data = await res.json();

                if (data.success) {
                    showToast("Leave application submitted successfully!", "success");
                    leaveForm.reset();
                    setTimeout(() => {
                        window.location.href = "/employee-dashboard";
                    }, 1500);
                } else {
                    showToast("Error: " + data.message, "error");
                }
            } catch (err) {
                console.error("Error submitting leave:", err);
                showToast("Error submitting leave application", "error");
            }
        });
    }

    // Handle employee dashboard
    const employeeLeaveList = document.getElementById("employeeLeaveList");
    if (employeeLeaveList) {
        console.log("Employee dashboard detected");
        
        if (!isLoggedIn()) {
            window.location.href = "/login.html";
            return;
        }

        loadEmployeeLeaves();
        
        // Refresh every 2 seconds
        setInterval(() => {
            loadEmployeeLeaves();
        }, 2000);
    }

    // Handle manager dashboard
    const managerLeaveList = document.getElementById("managerLeaveList");
    if (managerLeaveList) {
        console.log("Manager dashboard detected");
        
        if (!isLoggedIn() || currentSession.role !== "manager") {
            window.location.href = "/login.html";
            return;
        }

        loadManagerLeaves();
        
        // Refresh every 2 seconds
        setInterval(() => {
            loadManagerLeaves();
        }, 2000);
    }

    // Navigation logout
    const logoutBtn = document.getElementById("logoutBtn");
    if (logoutBtn) {
        logoutBtn.addEventListener("click", (e) => {
            e.preventDefault();
            logout();
        });
    }
});

// ==================== EMPLOYEE DASHBOARD ====================

async function loadEmployeeLeaves() {
    try {
        if (!isLoggedIn()) return;

        const res = await fetch(`/get_leaves?session_id=${currentSession.sessionId}&role=employee`);
        const leaves = await res.json();

        updateEmployeeStats(leaves);
        renderEmployeeLeaves(leaves);
    } catch (err) {
        console.error("Error loading leaves:", err);
    }
}

function updateEmployeeStats(leaves) {
    const totalLeaves = document.getElementById("employeeTotalLeaves");
    const pendingLeaves = document.getElementById("employeePendingLeaves");
    const approvedLeaves = document.getElementById("employeeApprovedLeaves");
    const rejectedLeaves = document.getElementById("employeeRejectedLeaves");

    if (!totalLeaves) return;

    totalLeaves.textContent = leaves.length;
    pendingLeaves.textContent = leaves.filter(l => l.status === "Pending").length;
    approvedLeaves.textContent = leaves.filter(l => l.status === "Approved").length;
    rejectedLeaves.textContent = leaves.filter(l => l.status === "Rejected").length;
}

function renderEmployeeLeaves(leaves) {
    const leaveList = document.getElementById("employeeLeaveList");
    if (!leaveList) return;

    leaveList.innerHTML = "";

    if (leaves.length === 0) {
        leaveList.innerHTML = "<p>No leave applications found.</p>";
        return;
    }

    leaves.forEach((leave) => {
        const statusClass = `status-${leave.status.toLowerCase()}`;
        const div = document.createElement("div");
        div.className = `leave-card ${statusClass}`;

        div.innerHTML = `
            <div class="leave-card-header">
                <h3>${leave.name}</h3>
                <span class="status-badge ${leave.status.toLowerCase()}">${leave.status}</span>
            </div>
            <div class="leave-card-body">
                <p><strong>From:</strong> ${leave.fromDate}</p>
                <p><strong>To:</strong> ${leave.toDate}</p>
                <p><strong>Reason:</strong> ${leave.reason}</p>
                ${leave.manager_notes ? `<p><strong>Manager Notes:</strong> ${leave.manager_notes}</p>` : ""}
                <p class="small-text"><strong>Applied:</strong> ${new Date(leave.submitted_at).toLocaleDateString()}</p>
            </div>
        `;

        leaveList.appendChild(div);
    });
}

// ==================== MANAGER DASHBOARD ====================

async function loadManagerLeaves() {
    try {
        if (!isLoggedIn()) return;

        const res = await fetch(`/get_leaves?session_id=${currentSession.sessionId}&role=manager`);
        const leaves = await res.json();

        updateManagerStats(leaves);
        renderManagerLeaves(leaves);
    } catch (err) {
        console.error("Error loading leaves:", err);
    }
}

function updateManagerStats(leaves) {
    const totalLeaves = document.getElementById("managerTotalLeaves");
    const pendingLeaves = document.getElementById("managerPendingLeaves");
    const approvedLeaves = document.getElementById("managerApprovedLeaves");
    const rejectedLeaves = document.getElementById("managerRejectedLeaves");

    if (!totalLeaves) return;

    totalLeaves.textContent = leaves.length;
    pendingLeaves.textContent = leaves.filter(l => l.status === "Pending").length;
    approvedLeaves.textContent = leaves.filter(l => l.status === "Approved").length;
    rejectedLeaves.textContent = leaves.filter(l => l.status === "Rejected").length;
}

function renderManagerLeaves(leaves) {
    const leaveList = document.getElementById("managerLeaveList");
    if (!leaveList) return;

    leaveList.innerHTML = "";

    if (leaves.length === 0) {
        leaveList.innerHTML = "<p>No leave applications found.</p>";
        return;
    }

    // Sort: pending first, then by date
    const sorted = [...leaves].sort((a, b) => {
        if (a.status === "Pending" && b.status !== "Pending") return -1;
        if (a.status !== "Pending" && b.status === "Pending") return 1;
        return new Date(b.submitted_at) - new Date(a.submitted_at);
    });

    sorted.forEach((leave) => {
        const statusClass = `status-${leave.status.toLowerCase()}`;
        const div = document.createElement("div");
        div.className = `leave-card manager-card ${statusClass}`;

        let actionButtons = "";
        if (leave.status === "Pending") {
            actionButtons = `
                <div class="action-buttons">
                    <button class="btn-approve" onclick="approveLeaveDirect('${leave.id}', '${currentSession.sessionId}')">Approve</button>
                    <button class="btn-reject" onclick="rejectLeaveDirect('${leave.id}', '${currentSession.sessionId}')">Reject</button>
                </div>
            `;
        }

        div.innerHTML = `
            <div class="leave-card-header">
                <div>
                    <h3>${leave.name}</h3>
                    <p class="employee-email">${leave.employee_email}</p>
                </div>
                <span class="status-badge ${leave.status.toLowerCase()}">${leave.status}</span>
            </div>
            <div class="leave-card-body">
                <p><strong>From:</strong> ${leave.fromDate}</p>
                <p><strong>To:</strong> ${leave.toDate}</p>
                <p><strong>Reason:</strong> ${leave.reason}</p>
                ${leave.manager_notes ? `<p><strong>Manager Notes:</strong> ${leave.manager_notes}</p>` : ""}
                <p class="small-text"><strong>Applied:</strong> ${new Date(leave.submitted_at).toLocaleDateString()}</p>
            </div>
            ${actionButtons}
        `;

        leaveList.appendChild(div);
    });
}

async function approveLeaveDirect(leaveId, sessionId) {
    await approveLeave(leaveId, sessionId);
}

async function rejectLeaveDirect(leaveId, sessionId) {
    await rejectLeave(leaveId, sessionId);
}

async function approveLeave(leaveId, sessionId) {
    try {
        const notes = prompt("Add manager notes (optional):");
        if (notes === null) return; // User cancelled

        const res = await fetch("/approve_leave", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                leave_id: leaveId,
                session_id: sessionId,
                manager_notes: notes
            })
        });

        const data = await res.json();

        if (data.success) {
            showToast("✓ Leave approved successfully!", "success");
            loadManagerLeaves();
        } else {
            showToast("Error: " + data.message, "error");
        }
    } catch (err) {
        console.error("Error approving leave:", err);
        showToast("Error approving leave", "error");
    }
}

async function rejectLeave(leaveId, sessionId) {
    try {
        const notes = prompt("Please provide reason for rejection:");
        if (notes === null) return; // User cancelled

        const res = await fetch("/reject_leave", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                leave_id: leaveId,
                session_id: sessionId,
                manager_notes: notes
            })
        });

        const data = await res.json();

        if (data.success) {
            showToast("Leave rejected", "info");
            loadManagerLeaves();
        } else {
            showToast("Error: " + data.message, "error");
        }
    } catch (err) {
        console.error("Error rejecting leave:", err);
        showToast("Error rejecting leave", "error");
    }
}
