const quizForm = document.getElementById('quiz-form');
const addQuestionBtn = document.getElementById('add-question');
const questionsContainer = document.getElementById('questions-container');

const token = sessionStorage.getItem("token"); // ✅ Get JWT token from session storage

if (!token) {
    alert("Unauthorized: Please log in first.");
    window.location.href = "login.html"; // ✅ Redirect to login if not authenticated
}

function createQuestionElement(index) {
    const questionDiv = document.createElement('div');
    questionDiv.className = 'question-item';
    questionDiv.innerHTML = `
        <div class="form-group">
            <label>Question ${index + 1}</label>
            <input type="text" name="question${index}" required>
        </div>
        <div class="options-container">
            <div class="form-group">
                <input type="text" name="option${index}_1" placeholder="Option 1" required>
            </div>
            <div class="form-group">
                <input type="text" name="option${index}_2" placeholder="Option 2" required>
            </div>
            <div class="form-group">
                <input type="text" name="option${index}_3" placeholder="Option 3" required>
            </div>
            <div class="form-group">
                <input type="text" name="option${index}_4" placeholder="Option 4" required>
            </div>
        </div>
        <div class="form-group">
            <label>Correct Answer (1-4)</label>
            <select id="correct-${index}" required>
                <option value="">Select correct option</option>
                <option value="1">Option 1</option>
                <option value="2">Option 2</option>
                <option value="3">Option 3</option>
                <option value="4">Option 4</option>
            </select>
        </div>
    `;
    return questionDiv;
}

addQuestionBtn.addEventListener('click', () => {
    const questionCount = questionsContainer.children.length;
    questionsContainer.appendChild(createQuestionElement(questionCount));
});

quizForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const quiz = {
        title: document.getElementById('quiz-title').value,
        description: document.getElementById('quiz-description').value,
        questions: [],
        timer: parseInt(document.getElementById('quiz-timer').value) || 5
    };

    const questionElements = questionsContainer.children;
    for (let i = 0; i < questionElements.length; i++) {
        const question = {
            text: quizForm[`question${i}`].value,
            options: [
                quizForm[`option${i}_1`].value,
                quizForm[`option${i}_2`].value,
                quizForm[`option${i}_3`].value,
                quizForm[`option${i}_4`].value
            ],
            correct: parseInt(document.getElementById(`correct-${i}`).value) - 1 
        };
        quiz.questions.push(question);
    }

    try {
        console.log("🔹 Sending request to backend with token:", token); // ✅ Debugging

        const response = await fetch('http://localhost:5500/api/quizzes', {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}` // ✅ Include JWT token
            },
            body: JSON.stringify(quiz)
        });

        const data = await response.json();

        if (response.status === 401) {
            alert("Unauthorized: Your session may have expired. Please log in again.");
            window.location.href = "login.html"; 
            return;
        }

        if (!data.code) {
            console.error("❌ Backend did not return a quiz code:", data);
            alert("Failed to create quiz. Please try again.");
            return;
        }

        alert('Quiz created! Share code: ' + data.code);
    } catch (error) {
        console.error('❌ Error creating quiz:', error);
        alert("An error occurred. Please check the console.");
    }
});

document.addEventListener('DOMContentLoaded', () => {
    questionsContainer.appendChild(createQuestionElement(0));
});
