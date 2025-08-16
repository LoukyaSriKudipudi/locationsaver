const forgotPasswordBtn = document.querySelector("#forgotPasswordBtn");
const message = document.querySelector("#message");

forgotPasswordBtn.addEventListener("click", async () => {
  const email = document.getElementById("email").value;
  const res = await fetch("/api/v1/users/forgotpassword", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email }),
  });

  const data = await res.json();
  if (data) {
    message.textContent =
      "We've sent an email to you containing instructions to reset your password.";
  }
});

//   Project: Location Saver
//   Designed & Developed by Loukya Sri Kudipudi
//   Built with ❤️ while learning Node.js
