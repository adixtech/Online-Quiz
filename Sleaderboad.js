// ✅ Initialize Socket.io in the frontend
const socket = io("http://localhost:5500", {
    transports: ["websocket", "polling"]
});

// ✅ Check if connected
socket.on("connect", () => {
    console.log("✅ Socket.io connected to backend:", socket.id);
});

socket.on("disconnect", () => {
    console.log("❌ Socket.io disconnected from backend");
});

document.addEventListener("DOMContentLoaded", async () => {
    const quizSelect = document.getElementById("quiz-select");
    const leaderboardBody = document.getElementById("leaderboard-body");

    const token = sessionStorage.getItem("token"); // ✅ Get JWT token

    if (!token) {
        alert("❌ Unauthorized: Please log in first.");
        window.location.href = "login.html"; // ✅ Redirect to login page
        return;
    }

    try {
        // ✅ Fetch quizzes from MongoDB Atlas
        const quizzesResponse = await fetch("http://localhost:5500/api/quizzes", {
            headers: { "Authorization": `Bearer ${token}` }
        });

        if (!quizzesResponse.ok) throw new Error("⚠ Failed to fetch quizzes");

        const quizzes = await quizzesResponse.json();

        // ✅ Populate quiz dropdown
        quizSelect.innerHTML = `<option value="all">All Quizzes</option>`;
        quizzes.forEach(quiz => {
            const option = document.createElement("option");
            option.value = quiz.quizCode;
            option.textContent = quiz.title;
            quizSelect.appendChild(option);
        });

        // ✅ Fetch leaderboard data for selected quiz
        await fetchLeaderboard();

        // ✅ Update leaderboard when a different quiz is selected
        quizSelect.addEventListener("change", fetchLeaderboard);
    } catch (error) {
        console.error("❌ Error loading quizzes:", error);
        alert("⚠ Error loading quizzes! Please try again.");
    }
});

// ✅ Function to fetch leaderboard from MongoDB Atlas
async function fetchLeaderboard() {
    const quizCode = document.getElementById("quiz-select").value;
    const leaderboardBody = document.getElementById("leaderboard-body");

    const token = sessionStorage.getItem("token"); // ✅ Get JWT token

    if (!token) {
        alert("❌ Unauthorized: Please log in first.");
        window.location.href = "login.html";
        return;
    }

    try {
        let url = quizCode === "all"
            ? "http://localhost:5500/api/leaderboard"
            : `http://localhost:5500/api/leaderboard/${quizCode}`;

        const response = await fetch(url, {
            headers: { "Authorization": `Bearer ${token}` }
        });

        console.log("🔹 Fetching leaderboard from:", url);
        console.log("🔹 Response Status:", response.status);

        if (!response.ok) {
            leaderboardBody.innerHTML = `<tr><td colspan="5">⚠ Leaderboard not found.</td></tr>`;
            return;
        }

        const leaderboard = await response.json();

        // ✅ Ensure leaderboard is sorted by score (highest first)
        leaderboard.sort((a, b) => b.score - a.score);

        leaderboardBody.innerHTML = leaderboard.length > 0
            ? leaderboard.map((entry, index) => `
                <tr class="leaderboard-entry ${getRankClass(index)}">
                    <td>${index + 1}</td>
                    <td>${entry.userName}</td>
                    <td>${entry.quizTitle}</td>
                    <td>${entry.score}%</td>
                    <td>${entry.timeTaken} mins</td>
                </tr>
            `).join('')
            : `<tr><td colspan="5">⚠ No leaderboard data available</td></tr>`;

    } catch (error) {
        console.error("❌ Error fetching leaderboard:", error);
        alert("⚠ Failed to load leaderboard!");
    }
}

// ✅ Function to get rank class (for styling)
function getRankClass(index) {
    return index === 0 ? "gold" : index === 1 ? "silver" : index === 2 ? "bronze" : "";
}

// ✅ Listen for real-time leaderboard updates
socket.on("leaderboardUpdate", fetchLeaderboard);
