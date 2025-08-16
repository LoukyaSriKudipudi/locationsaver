const token = localStorage.getItem("token");
console.log(token);
const dashboardButton = document.querySelector(".btn-primary");
if (token) {
  dashboardButton.textContent = "Go to Dashboard";
  dashboardButton.parentElement.href = "/home.html";
}

//   Project: Location Saver
//   Designed & Developed by Loukya Sri Kudipudi
//   Built with ❤️ while learning Node.js
