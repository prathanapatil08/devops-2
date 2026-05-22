const API_URL = "/get_leaves";

// Submit Leave Form
const leaveForm = document.getElementById("leaveForm");

if (leaveForm) {
    leaveForm.addEventListener("submit", async function (e) {
        e.preventDefault();

        const name = document.getElementById("name").value;
        const fromDate = document.getElementById("fromDate").value;
        const toDate = document.getElementById("toDate").value;
        const reason = document.getElementById("reason").value;

        try {
            const res = await fetch("/submit_leave", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    name: name,
                    fromDate: fromDate,
                    toDate: toDate,
                    reason: reason
                })
            });

            const data = await res.json();

            if (data.success) {
                alert("Leave application submitted successfully!");
                leaveForm.reset();
                window.location.href = "/dashboard";
            } else {
                alert("Error submitting leave application. Please try again.");
            }

        } catch (err) {
            console.error("Error submitting leave:", err);
            alert("Error submitting leave application. Please try again.");
        }
    });
}

// Dashboard filter
let currentFilter = "all";

// Load leaves
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

// Update dashboard stats
function updateStats(leaves) {
    const totalLeaves = document.getElementById("totalLeaves");
    const pendingLeaves = document.getElementById("pendingLeaves");
    const approvedLeaves = document.getElementById("approvedLeaves");
    const rejectedLeaves = document.getElementById("rejectedLeaves");

    if (!totalLeaves) return;

    totalLeaves.textContent = leaves.length;
    pendingLeaves.textContent = leaves.filter(l => l.status === "Pending").length;
    approvedLeaves.textContent = leaves.filter(l => l.status === "Approved").length;
    rejectedLeaves.textContent = leaves.filter(l => l.status === "Rejected").length;
}

// Render leave list
function renderLeaveList(leaves, filter) {
    const leaveList = document.getElementById("leaveList");
    if (!leaveList) return;

    leaveList.innerHTML = "";

    let filteredLeaves = leaves;

    if (filter !== "all") {
        filteredLeaves = leaves.filter(l => l.status === filter);
    }

    if (filteredLeaves.length === 0) {
        leaveList.innerHTML = "<p>No leave applications found.</p>";
        return;
    }

    filteredLeaves.forEach((leave, index) => {
        const div = document.createElement("div");
        div.className = "leave-card";

        div.innerHTML = `
            <h3>${leave.name || "Unknown"}</h3>
            <p><strong>From:</strong> ${leave.fromDate || ""}</p>
            <p><strong>To:</strong> ${leave.toDate || ""}</p>
            <p><strong>Reason:</strong> ${leave.reason || ""}</p>
            <p><strong>Status:</strong> ${leave.status || "Pending"}</p>
        `;

        leaveList.appendChild(div);
    });
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

// Load dashboard
if (document.getElementById("leaveList")) {
    loadLeaves();
}

// Navigation active link
const currentPath = window.location.pathname;

document.querySelectorAll(".nav-menu a").forEach(link => {
    if (link.getAttribute("href") === currentPath) {
        link.classList.add("active");
