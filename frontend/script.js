const API_URL = "/get_leaves";

// Wait for DOM to be fully loaded
document.addEventListener("DOMContentLoaded", function() {
    console.log("DOM Content Loaded - Initializing form handlers");
    
    // Submit Leave Form
    const leaveForm = document.getElementById("leaveForm");
    console.log("Leave form element:", leaveForm);

    if (leaveForm) {
        console.log("Attaching submit event listener to leaveForm");
        leaveForm.addEventListener("submit", async function (e) {
            e.preventDefault();
            console.log("Form submitted");

            const name = document.getElementById("name").value;
            const fromDate = document.getElementById("fromDate").value;
            const toDate = document.getElementById("toDate").value;
            const reason = document.getElementById("reason").value;

            console.log("Form data:", { name, fromDate, toDate, reason });

            try {
                const payload = {
                    name: name,
                    fromDate: fromDate,
                    toDate: toDate,
                    reason: reason
                };
                
                console.log("Sending POST request to /submit_leave with:", payload);
                
                const res = await fetch("/submit_leave", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify(payload)
                });

                console.log("Response status:", res.status);
                console.log("Response headers:", res.headers);

                if (!res.ok) {
                    throw new Error(`Server error: ${res.status}`);
                }

                const data = await res.json();
                console.log("Response data:", data);

                if (data.success) {
                    const successMsg = document.getElementById("successMessage");
                    if (successMsg) {
                        successMsg.style.display = "block";
                    }
                    alert("Leave application submitted successfully!");
                    leaveForm.reset();
                    setTimeout(() => {
                        window.location.href = "/dashboard";
                    }, 1000);
                } else {
                    alert("Error: " + (data.message || "Failed to submit leave application"));
                }

            } catch (err) {
                console.error("Error submitting leave:", err);
                alert("Error submitting leave application: " + err.message);
            }
        });
    } else {
        console.log("Leave form not found on this page");
    }
});

// Dashboard filter
let currentFilter = "all";

// Load leaves
async function loadLeaves() {
    try {
        console.log("Loading leaves from:", API_URL);
        const res = await fetch(API_URL);
        
        if (!res.ok) {
            throw new Error(`Server error: ${res.status}`);
        }

        const leaves = await res.json();
        console.log("Leaves loaded:", leaves);

        updateStats(leaves);
        renderLeaveList(leaves, currentFilter);

    } catch (err) {
        console.error("Error loading leaves:", err);
        const leaveList = document.getElementById("leaveList");
        if (leaveList) {
            leaveList.innerHTML = `<p style="color: red;">Error loading leaves: ${err.message}</p>`;
        }
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
document.addEventListener("DOMContentLoaded", function() {
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
        console.log("Dashboard page detected, loading leaves");
        loadLeaves();
        
        // Auto-refresh dashboard every 3 seconds
        setInterval(() => {
            console.log("Auto-refreshing dashboard");
            loadLeaves();
        }, 3000);
    }

    // Navigation active link
    const currentPath = window.location.pathname;

    document.querySelectorAll(".nav-menu a").forEach(link => {
        if (link.getAttribute("href") === currentPath) {
            link.classList.add("active");
        }
    });
});
