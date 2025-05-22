async function updateDashboard() {
    try {
        console.log("🔍 Fetching quizzes...");
        console.log("🔍 Fetching results...");

        const token = sessionStorage.getItem("token"); // ✅ Get JWT token

        if (!token) {
            alert("Unauthorized: Please log in first.");
            window.location.href = "login.html"; // ✅ Redirect to login page
            return;
        }

        // ✅ Fetch quizzes
        const quizzesRes = await fetch('http://localhost:5500/api/quizzes', {
            headers: { "Authorization": `Bearer ${token}` }
        });

        // ✅ Fetch results
        const resultsRes = await fetch('http://localhost:5500/api/results', {
            headers: { "Authorization": `Bearer ${token}` }
        });

        // ✅ Check if response is OK
        if (!quizzesRes.ok || !resultsRes.ok) {
            throw new Error(`Failed to fetch data: ${quizzesRes.status} & ${resultsRes.status}`);
        }

        const quizzes = await quizzesRes.json();
        const results = await resultsRes.json();

        console.log("✅ Quizzes Data:", quizzes);
        console.log("✅ Results Data:", results);

        // ✅ Ensure `quizzes` and `results` are arrays before using `.length`
        if (!Array.isArray(quizzes) || !Array.isArray(results)) {
            throw new Error("Invalid API response: Expected arrays but got something else.");
        }

        // ✅ Update Total Quizzes
        document.getElementById('total-quizzes').textContent = quizzes.length;

        // ✅ Update Total Participants
        document.getElementById('total-participants').textContent = results.length;

        // ✅ Calculate & Update Average Score
        if (results.length > 0) {
            const avgScore = Math.round(results.reduce((sum, r) => sum + r.score, 0) / results.length);
            document.getElementById('average-score').textContent = `${avgScore}%`;
        } else {
            document.getElementById('average-score').textContent = "0%";
        }

        // ✅ Display List of Quizzes with Participants
        const quizList = document.getElementById('quiz-list');
        quizList.innerHTML = quizzes.map(quiz => {
            // ✅ Ensure `questions` exists before accessing `.length`
            const questionCount = quiz.questions ? quiz.questions.length : 0;
            const participantCount = results.filter(r => r.quizId === quiz._id).length;

            return `
                <div class="quiz-card">
                    <h3>${quiz.title || 'Untitled Quiz'}</h3>
                    <p>${quiz.description || 'No description available'}</p>
                    <p class="quiz-code">Code: ${quiz.quizCode}</p>
                    <p class="quiz-stats">
                        Questions: ${questionCount} | 
                        Participants: ${participantCount}
                    </p>
                </div>
            `;
        }).join('');

    } catch (error) {
        console.error('❌ Error fetching data:', error);
        alert("Failed to load dashboard data.");
    }
}

// ✅ Run when the page loads
document.addEventListener('DOMContentLoaded', updateDashboard);


document.addEventListener('DOMContentLoaded', () => {
    const logoutBtn = document.getElementById("logout-btn");
    if (logoutBtn) {
        logoutBtn.addEventListener("click", () => {
            sessionStorage.removeItem("token"); // ✅ Clear token
            window.location.href = "login.html"; // ✅ Redirect to login
        });
    } else {
        console.warn("⚠️ Logout button not found! Make sure #logout-btn exists in dashboard.html.");
    }
});