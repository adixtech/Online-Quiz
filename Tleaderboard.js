async function updateLeaderboard() {
    const token = sessionStorage.getItem("token"); // ✅ Get JWT token

    if (!token) {
        alert("Unauthorized: Please log in first.");
        window.location.href = "login.html";
        return;
    }

    try {
        // ✅ Fetch quizzes for dropdown
        const quizRes = await fetch('http://localhost:5500/api/quizzes', {
            headers: { "Authorization": `Bearer ${token}` }
        });
        const quizzes = await quizRes.json();

        // ✅ Fetch leaderboard data
        const resultsRes = await fetch('http://localhost:5500/api/leaderboard', {
            headers: { "Authorization": `Bearer ${token}` }
        });
        const results = await resultsRes.json();

        console.log("✅ API Response - Results:", results); // ✅ Debugging
        console.log("✅ API Response - Quizzes:", quizzes); // ✅ Debugging

        // ✅ Ensure results is an array
        if (!Array.isArray(results)) {
            console.error("❌ Error: API response is not an array!", results);
            alert("Leaderboard data is invalid. Please check the API.");
            return;
        }

        // ✅ Update quiz select dropdown
        const quizSelect = document.getElementById('quiz-select');
        quizSelect.innerHTML = `<option value="all">All Quizzes</option>`;
        quizzes.forEach(quiz => {
            const option = document.createElement("option");
            option.value = quiz.quizCode;
            option.textContent = quiz.title;
            quizSelect.appendChild(option);
        });

        // ✅ Function to display leaderboard
        function displayResults() {
            const selectedQuizCode = quizSelect.value;

            // ✅ Filter results based on selected quiz
            const filteredResults = selectedQuizCode === 'all'
                ? results
                : results.filter(r => r.quizCode === selectedQuizCode);

            // ✅ Ensure filteredResults is an array before sorting
            if (!Array.isArray(filteredResults)) {
                console.error("❌ Error: Filtered results is not an array!", filteredResults);
                alert("Invalid leaderboard data.");
                return;
            }

            const sortedResults = filteredResults.sort((a, b) => b.score - a.score);

            // ✅ Populate leaderboard table
            const leaderboardBody = document.getElementById("leaderboard-body");
            leaderboardBody.innerHTML = sortedResults.length > 0
                ? sortedResults.map((result, index) => `
                    <tr>
                        <td>${index + 1}</td>
                        <td>${result.userName}</td>
                        <td>${result.quizTitle}</td>
                        <td>${result.score}%</td>
                        <td>${result.timeTaken} mins</td>
                    </tr>
                `).join('')
                : `<tr><td colspan="5">No leaderboard data available</td></tr>`;
        }

        // ✅ Update results when a quiz is selected
        quizSelect.addEventListener('change', displayResults);

        // ✅ Initial display
        displayResults();
    } catch (error) {
        console.error("❌ Error fetching leaderboard:", error);
        alert("Failed to load leaderboard!");
    }
}

// ✅ Initialize on page load
document.addEventListener("DOMContentLoaded", updateLeaderboard);
