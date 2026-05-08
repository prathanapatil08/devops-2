const form = document.getElementById("leaveForm");
const list = document.getElementById("leaveList");

// IMPORTANT: use full backend URL
const API_URL = "http://localhost:5000/api/leave";

// Submit form
form.addEventListener("submit", async (e) => {
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

        form.reset();
        loadLeaves();

    } catch (err) {
        console.error("Error submitting form:", err);
    }
});

// Load leaves
async function loadLeaves() {
    try {
        const res = await fetch(API_URL);

        if (!res.ok) throw new Error("Server error");

        const leaves = await res.json();

        list.innerHTML = "";

        leaves.forEach(l => {
            const li = document.createElement("li");
            li.innerHTML = `
                <strong>${l.name}</strong><br>
                ${l.fromDate} → ${l.toDate}<br>
                <small>${l.reason}</small>
            `;
            list.appendChild(li);
        });

    } catch (err) {
        console.error("Error loading leaves:", err);
    }
}

// Load on page start
loadLeaves();