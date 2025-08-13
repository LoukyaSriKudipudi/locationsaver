document.getElementById("signupForm").addEventListener("submit", async (e) => {
  e.preventDefault();

  const name = document.getElementById("name").value.trim();
  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value;
  const passwordConfirm = document.getElementById("passwordConfirm").value;

  const messageElem = document.getElementById("message");
  const loginBtn = document.getElementById("loginBtn");
  const submitBtn = e.target.querySelector("button[type='submit']");

  if (password !== passwordConfirm) {
    messageElem.style.color = "red";
    messageElem.textContent = "Passwords do not match.";
    loginBtn.style.display = "none";
    return;
  }

  submitBtn.disabled = true;
  messageElem.textContent = "";
  loginBtn.style.display = "none";

  try {
    const res = await fetch("/api/v1/users/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, password, passwordConfirm }),
    });

    const data = await res.json();

    if (data.status === "success") {
      messageElem.style.color = "green";
      messageElem.textContent = "Signup successful! You can now login.";
      loginBtn.style.display = "inline-block";
    } else {
      messageElem.style.color = "red";
      messageElem.textContent = data.message || "Signup failed.";
      loginBtn.style.display = "none";
    }
  } catch (err) {
    messageElem.style.color = "red";
    messageElem.textContent = "Error: " + err.message;
    loginBtn.style.display = "none";
  } finally {
    submitBtn.disabled = false;
  }
});

document.getElementById("loginBtn").addEventListener("click", () => {
  window.location.href = "login.html";
});
