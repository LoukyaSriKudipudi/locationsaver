document.getElementById("loginForm").addEventListener("submit", async (e) => {
  e.preventDefault();

  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;

  try {
    const res = await fetch("/api/v1/users/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    const data = await res.json();

    if (data.status === "success") {
      document.getElementById("message").style.color = "green";
      document.getElementById("message").textContent = "Login successful!";
      localStorage.setItem("token", data.token);
      // Redirect to home page after login
      setTimeout(() => {
        window.location.href = "home.html";
      }, 1000);
    } else {
      document.getElementById("message").style.color = "#d9534f";
      document.getElementById("message").textContent =
        data.message || "Login failed.";
    }
  } catch (err) {
    document.getElementById("message").style.color = "#d9534f";
    document.getElementById("message").textContent = "Error: " + err.message;
  }
});
