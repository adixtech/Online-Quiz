// DOM Elements
const tabBtns = document.querySelectorAll('.tab-btn');
const authForms = document.querySelectorAll('.auth-form');

// Tab Switching (Login & Register)
tabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        tabBtns.forEach(b => b.classList.remove('active'));
        authForms.forEach(f => f.classList.remove('active'));

        btn.classList.add('active');
        document.getElementById(`${btn.dataset.tab}Form`).classList.add('active');
    });
});

// Handle Login
document.addEventListener("DOMContentLoaded", () => {
    const loginForm = document.getElementById("loginFormElement");

    if (!loginForm) {
        console.error("❌ ERROR: loginFormElement not found in login.html!");
        return;
    }

    loginForm.addEventListener("submit", async (event) => {
        event.preventDefault();

        const email = document.getElementById("email").value;
        const password = document.getElementById("password").value;

        try {
            const response = await fetch("http://localhost:5500/api/auth/login", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email, password }),
            });

            if (!response.ok) {
                const errorMessage = await response.text();
                throw new Error(errorMessage || "Login failed!");
            }

            const data = await response.json();

            sessionStorage.setItem("token", data.token); // ✅ Store JWT token

            // ✅ Decode JWT to get the role
            const decodedToken = JSON.parse(atob(data.token.split(".")[1])); 
            const userRole = decodedToken.role;

            console.log("✅ Logged in as:", userRole);  // ✅ Debugging log

            // ✅ Redirect based on user role
            if (userRole === "teacher") {
                window.location.href = "teacher.html";
            } else if (userRole === "student") {
                window.location.href = "student.html";
            } else {
                alert("Unknown role: " + userRole);
                console.warn("⚠ Unexpected role received:", userRole);
            }
        } catch (error) {
            console.error("❌ Login error:", error);
            alert("Login failed: " + error.message);
        }
    });
});

// Handle Registration
document.addEventListener("DOMContentLoaded", () => {
    const registerForm = document.getElementById("registerFormElement");

    if (!registerForm) {
        console.error("❌ ERROR: registerFormElement not found in login.html!");
        return;
    }

    registerForm.addEventListener("submit", async (event) => {
        event.preventDefault();

        const regName = document.getElementById("regName").value;
        const regEmail = document.getElementById("regEmail").value;
        const regPassword = document.getElementById("regPassword").value;
        const regRole = document.getElementById("regRole").value;

        try {
            const response = await fetch("http://localhost:5500/api/auth/register", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name: regName, email: regEmail, password: regPassword, role: regRole }),
            });

            const data = await response.json();

            if (response.ok) {
                alert("Registration successful! You can now log in.");
                tabBtns[0].click(); // ✅ Switch to login tab after successful registration
            } else {
                alert(data.message || "Registration failed");
            }
        } catch (error) {
            console.error("❌ Registration error:", error);
            alert("Registration failed: " + error.message);
        }
    });
});
