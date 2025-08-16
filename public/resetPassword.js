const form = document.getElementById("resetForm");
form.addEventListener("submit", async (e) => {
  e.preventDefault();
  const token = window.location.pathname.split("/").pop(); // get token from URL
  const newPassword = document.getElementById("newPassword").value;
  const newPasswordConfirm =
    document.getElementById("newPasswordConfirm").value;

  const res = await fetch(`/api/v1/users/resetpassword/${token}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ newPassword, newPasswordConfirm }),
  });

  const data = await res.json();
  console.log(data);
  document.getElementById("message").innerText = data.message || data.error;
});

//   Project: Location Saver
//   Designed & Developed by Loukya Sri Kudipudi
//   Built with ❤️ while learning Node.js
