// ✅ Initialize Socket.io connection with backend
const socket = io("http://localhost:5500", {
    transports: ["websocket", "polling"],
    reconnectionAttempts: 5,
    timeout: 5000
});

// ✅ Log connection status
socket.on("connect", () => {
    console.log("✅ Socket.io connected:", socket.id);
});

socket.on("disconnect", () => {
    console.log("❌ Socket.io disconnected");
});

// ✅ DOM Elements
const startQuizBtn = document.getElementById('start-quiz');
const quizEntry = document.getElementById('quiz-entry');
const quizContent = document.getElementById('quiz-content');
const userNameInput = document.getElementById('user-name');
const quizCodeInput = document.getElementById('quiz-code');
const leaderboardUrl = "Sleaderboad.html"; // ✅ Redirect URL for leaderboard

let currentQuiz = null;
let currentQuestion = 0;
let userAnswers = [];
let quizTimer;
let startTime; // ✅ Store quiz start time

// ✅ Ensure Socket.io is connected
document.addEventListener("DOMContentLoaded", () => {
    console.log("✅ Socket.io connected:", socket.connected);
});

// ✅ Start Quiz Event
startQuizBtn.addEventListener('click', async () => {
    const userName = userNameInput.value.trim();
    const quizCode = quizCodeInput.value.toUpperCase();

    if (!userName) {
        alert('⚠ Please enter your name before starting the quiz.');
        return;
    }

    try {
        const response = await fetch(`http://localhost:5500/api/quizzes/${quizCode}`);
        if (!response.ok) throw new Error('❌ Invalid quiz code');

        currentQuiz = await response.json();
        localStorage.setItem('userName', userName);

        quizEntry.classList.add('hidden');
        quizContent.classList.remove('hidden');
        document.getElementById('quiz-title-display').textContent = currentQuiz.title;
        userAnswers = new Array(currentQuiz.questions.length).fill(null);

        // ✅ Store quiz start time
        startTime = new Date();

        displayQuestion();
        startTimer(currentQuiz.timer);
    } catch (error) {
        alert(error.message);
    }
});

// ✅ Display Current Question
function displayQuestion() {
    const question = currentQuiz.questions[currentQuestion];
    const questionDisplay = document.getElementById('question-display');

    questionDisplay.innerHTML = `
        <h3>Question ${currentQuestion + 1} of ${currentQuiz.questions.length}</h3>
        <p class="question-text">${question.text}</p>
        <div class="options">
            ${question.options.map((option, index) => `
                <label class="option">
                    <input type="radio" name="answer" value="${index}" 
                        ${userAnswers[currentQuestion] === index ? 'checked' : ''}>
                    ${option}
                </label>
            `).join('')}
        </div>
    `;

    document.getElementById('prev-question').style.display = currentQuestion > 0 ? 'block' : 'none';
    document.getElementById('next-question').style.display = currentQuestion < currentQuiz.questions.length - 1 ? 'block' : 'none';
    document.getElementById('submit-quiz').style.display = currentQuestion === currentQuiz.questions.length - 1 ? 'block' : 'none';
}

// ✅ Navigation Buttons
document.getElementById('prev-question').addEventListener('click', () => {
    if (currentQuestion > 0) {
        currentQuestion--;
        displayQuestion();
    }
});

document.getElementById('next-question').addEventListener('click', () => {
    const selectedAnswer = document.querySelector('input[name="answer"]:checked');
    if (selectedAnswer) {
        userAnswers[currentQuestion] = parseInt(selectedAnswer.value);
        if (currentQuestion < currentQuiz.questions.length - 1) {
            currentQuestion++;
            displayQuestion();
        }
    } else {
        alert('⚠ Please select an answer!');
    }
});

// ✅ Timer Function
function startTimer(duration) {
    let timeRemaining = duration * 60;
    const timerDisplay = document.getElementById('quiz-timer-display');

    quizTimer = setInterval(() => {
        const minutes = Math.floor(timeRemaining / 60);
        const seconds = timeRemaining % 60;
        timerDisplay.textContent = `⏳ Time Left: ${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;

        if (timeRemaining <= 0) {
            clearInterval(quizTimer);
            alert("⏳ Time's up! Submitting your quiz.");
            autoSubmitQuiz();
        }

        timeRemaining--;
    }, 1000);
}

// ✅ Auto-submit quiz when time ends
function autoSubmitQuiz() {
    clearInterval(quizTimer);
    document.getElementById('submit-quiz').click();
}

// ✅ Submit Quiz & Update Leaderboard
document.getElementById('submit-quiz').addEventListener('click', async () => {
    const selectedAnswer = document.querySelector('input[name="answer"]:checked');
    if (selectedAnswer) {
        userAnswers[currentQuestion] = parseInt(selectedAnswer.value);
    }

    const userName = localStorage.getItem('userName');
    if (!userName) {
        alert("❌ Error: User name not found.");
        return;
    }

    const token = sessionStorage.getItem("token");
    if (!token) {
        alert("❌ Unauthorized: Please log in first.");
        window.location.href = "login.html";
        return;
    }

    // ✅ Calculate time taken
    const endTime = new Date();
    const timeTaken = Math.round((endTime - startTime) / 60000 * 10) / 10; // Convert milliseconds to minutes

    // ✅ Calculate Score
    let score = calculateScore(userAnswers, currentQuiz);

    // ✅ Log submission payload
    console.log("🔹 Sending Quiz Submission:", {
        userName,
        score,
        timeTaken,
        quizTitle: currentQuiz.title
    });

    try {
        const response = await fetch(`http://localhost:5500/api/quizzes/${currentQuiz.quizCode}/submit`, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}` // ✅ Send token in header
            },
            body: JSON.stringify({ 
                userName, 
                score,
                timeTaken,
                quizTitle: currentQuiz.title
            })
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(`Failed to submit quiz: ${errorData.error || response.statusText}`);
        }

        const result = await response.json();
        alert(`✅ Quiz submitted successfully! Your score: ${result.score}%`);

        // ✅ Emit leaderboard update to Socket.io
        socket.emit("updateLeaderboard");

        // ✅ Redirect to leaderboard page
        window.location.href = `${leaderboardUrl}?code=${currentQuiz.quizCode}`;
    } catch (error) {
        console.error("❌ Error submitting quiz:", error);
        alert(`❌ Error submitting quiz: ${error.message}`);
    }
});

// ✅ Calculate Score Function
function calculateScore(userAnswers, quiz) {
    let score = 0;
    quiz.questions.forEach((question, index) => {
        if (userAnswers[index] === question.correct) {
            score++;
        }
    });
    return Math.round((score / quiz.questions.length) * 100); // Convert to percentage and round
}
