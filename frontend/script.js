// Configuration
const API_URL = "http://localhost:5000/api/leave";

// Utility functions
function showSuccessMessage(message) {
    const successDiv = document.getElementById("successMessage");
    if (successDiv) {
        successDiv.textContent = message;
        successDiv.style.display = "block";
        setTimeout(() => {
            successDiv.style.display = "none";
        }, 3000);
    }
}

function updateStats(leaves) {
    const totalRequests = document.getElementById("totalRequests");
    const pendingRequests = document.getElementById("pendingRequests");
    const approvedRequests = document.getElementById("approvedRequests");
    const rejectedRequests = document.getElementById("rejectedRequests");

    if (totalRequests) {
        totalRequests.textContent = leaves.length;
        pendingRequests.textContent = leaves.filter(l => l.status === "pending").length;
        approvedRequests.textContent = leaves.filter(l => l.status === "approved").length;
        rejectedRequests.textContent = leaves.filter(l => l.status === "rejected").length;
    }
}

// Apply Leave Page
const leaveForm = document.getElementById("leaveForm");
if (leaveForm) {
    leaveForm.addEventListener("submit", async (e) => {
        e.preventDefault();

        const data = {
            name: document.getElementById("name").value,
            fromDate: document.getElementById("fromDate").value,
            toDate: document.getElementById("toDate").value,
            reason: document.getElementById("reason").value
        };

        try {
            const res = await fetch(API_URL, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(data)
            });

            if (!res.ok) throw new Error("Failed to add leave");

            leaveForm.reset();
            showSuccessMessage("Leave application submitted successfully!");

        } catch (err) {
            console.error("Error submitting form:", err);
            alert("Error submitting leave application. Please try again.");
        }
    });
}

// Dashboard functionality
let currentFilter = "all";

function filterLeaves(leaves, filter) {
    if (filter === "all") return leaves;
    return leaves.filter(leave => leave.status === filter);
}

function renderLeaveList(leaves, filter = "all") {
    const list = document.getElementById("leaveList");
    if (!list) return;

    const filteredLeaves = filterLeaves(leaves, filter);
    list.innerHTML = "";

    filteredLeaves.forEach(leave => {
        const li = document.createElement("li");
        li.className = leave.status;

        const statusBadge = `<span class="status-badge status-${leave.status}">${leave.status.toUpperCase()}</span>`;

        const actionButtons = leave.status === "pending" ?
            `<div class="action-buttons">
                <button class="approve-btn" data-id="${leave.id}">Approve</button>
                <button class="reject-btn" data-id="${leave.id}">Reject</button>
            </div>` : "";

        li.innerHTML = `
            <div class="leave-header">
                <strong>${leave.name}</strong>
                ${statusBadge}
            </div>
            <div class="leave-dates">
                ${leave.fromDate} → ${leave.toDate}
            </div>
            <div class="leave-reason">
                <small>${leave.reason}</small>
            </div>
            ${actionButtons}
        `;

        list.appendChild(li);
    });

    // Add event listeners for approve/reject buttons
    document.querySelectorAll(".approve-btn").forEach(btn => {
        btn.addEventListener("click", () => updateLeaveStatus(btn.dataset.id, "approved"));
    });

    document.querySelectorAll(".reject-btn").forEach(btn => {
        btn.addEventListener("click", () => updateLeaveStatus(btn.dataset.id, "rejected"));
    });
}

async function updateLeaveStatus(leaveId, status) {
    try {
        const res = await fetch(`${API_URL}/${leaveId}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ status })
        });

        if (!res.ok) throw new Error("Failed to update leave");

        loadLeaves(); // Reload the list

    } catch (err) {
        console.error("Error updating leave:", err);
        alert("Error updating leave status. Please try again.");
    }
}

// Filter buttons
document.querySelectorAll(".filter-btn").forEach(btn => {
    btn.addEventListener("click", (e) => {
        document.querySelectorAll(".filter-btn").forEach(b => b.classList.remove("active"));
        e.target.classList.add("active");
        currentFilter = e.target.dataset.filter;
        loadLeaves();
    });
});

// Load leaves function
async function loadLeaves() {
    try {
        const res = await fetch(API_URL);
        if (!res.ok) throw new Error("Server error");

        const leaves = await res.json();
        updateStats(leaves);
        renderLeaveList(leaves, currentFilter);

    } catch (err) {
        console.error("Error loading leaves:", err);
    }
}

// Load leaves on dashboard page
if (document.getElementById("leaveList")) {
    loadLeaves();
}

// Navigation highlight (simple client-side routing indication)
const currentPath = window.location.pathname;
document.querySelectorAll(".nav-menu a").forEach(link => {
    if (link.getAttribute("href") === currentPath) {
        link.classList.add("active");
    }
});