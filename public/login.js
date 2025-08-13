// login.js
document.getElementById("loginForm").addEventListener("submit", async (e) => {
  e.preventDefault();

  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value.trim();
  const messageEl = document.getElementById("message");

  if (!email || !password) {
    messageEl.style.color = "#d9534f";
    messageEl.textContent = "Please enter both email and password.";
    return;
  }

  try {
    const res = await fetch("/api/v1/users/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    const data = await res.json();
    console.log("Server Response:", data); // for debugging

    if (res.ok && (data.status === "success" || data.success === true)) {
      messageEl.style.color = "green";
      messageEl.textContent = "Login successful! Redirecting...";
      localStorage.setItem("token", data.token || data.accessToken);

      setTimeout(() => {
        window.location.href = "home.html";
      }, 1000);
    } else {
      messageEl.style.color = "#d9534f";
      messageEl.textContent =
        data.message || "Login failed. Check your credentials.";
    }
  } catch (err) {
    console.error("Login Error:", err);
    messageEl.style.color = "#d9534f";
    messageEl.textContent = "Error connecting to server. Try again later.";
  }
});
