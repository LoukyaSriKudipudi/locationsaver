// ===================================================
// 🔑 AUTH CHECK
// ===================================================

// Check if token exists, otherwise redirect to login
const token = localStorage.getItem("token");
if (!token) {
  window.location.href = "login.html";
}

// ===================================================
// 📌 DOM ELEMENTS
// ===================================================
const logoutBtns = document.querySelectorAll(".logoutBtn");
const linksListEl = document.getElementById("linksList");
const visitsSection = document.getElementById("visitsSection");
const visitsContainer = document.getElementById("visitsContainer");
const selectedLinkTitle = document.getElementById("selectedLinkTitle");
const createLinkForm = document.getElementById("createLinkForm");
const titleInput = document.getElementById("title");
const closeVisitsBtn = document.getElementById("closeVisitsBtn");
const deleteAllLinks = document.getElementById("deleteAllLinks");
const sortVisits = document.getElementById("sortVisits");
const username = document.getElementById("username");
const usernameContainer = document.getElementById("usernameContainer");
const search = document.querySelector("#search");
const deleteAccount = document.getElementById("deleteAccount");
const deleteAccountContainer = document.getElementById(
  "deleteAccountContainer"
);
let currentLinkId = null;
let linksCache = [];
let sortAscending = true;

// ===================================================
// 👤 USER FUNCTIONS
// ===================================================

// Fetch and render user info
async function getUser() {
  const res = await fetch("/api/v1/users", {
    headers: { Authorization: "Bearer " + token },
  });
  const user = await res.json();
  username.textContent = `${user.data.name}`;
}
getUser();

// Allow username editing
function editUser() {
  username.setAttribute("contenteditable", "true");
  username.focus();

  // Prevent duplicate save buttons
  if (!document.querySelector(".savebutton")) {
    const saveButton = document.createElement("button");
    saveButton.classList.add("savebutton");
    saveButton.textContent = "Save";

    // Save on Enter key
    username.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        saveButton.click();
      }
    });

    // Save button logic
    saveButton.addEventListener("click", async () => {
      const newName = username.textContent.trim();
      if (!newName) return alert("Username cannot be empty!");

      try {
        const res = await fetch("/api/v1/users", {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: "Bearer " + token,
          },
          body: JSON.stringify({ newName }),
        });

        const user = await res.json();
        username.textContent = user.data.name;
      } catch (err) {
        console.error("Error updating username:", err);
        alert("Failed to update username.");
      }

      // Cleanup after saving
      username.removeAttribute("contenteditable");
      saveButton.remove();
    });

    usernameContainer.appendChild(saveButton);
  }
}
username.addEventListener("click", () => editUser());

// Logout
logoutBtns.forEach((logoutBtn) => {
  logoutBtn.addEventListener("click", () => {
    localStorage.removeItem("token");
    window.location.href = "login.html";
  });
});
async function showDeleteConfirmation() {
  // If a confirm box already exists, don’t create another
  if (document.querySelector(".confirmBox")) return;

  const res = await fetch("/api/v1/users/delete-preview", {
    headers: { Authorization: "Bearer " + token },
  });
  const data = await res.json();

  if (data.status === "success") {
    const { username, totalLinks, totalVisits, note } = data.data;

    const confirmBox = document.createElement("div");
    confirmBox.classList.add("confirmBox");
    confirmBox.innerHTML = `
  <h2>Delete Account?</h2>
  <div class="countContainer" style="border:2px solid red; padding:10px;">
    <p><strong>User:</strong> ${username}</p>
    <p><strong>Links:</strong> ${totalLinks}</p>
    <p><strong>Visits:</strong> ${totalVisits}</p>
    <p class="warning">${note}</p>
  </div>
  <button id="confirmDelete" type="button">Yes, delete permanently</button>
  <button id="cancelDelete" type="button">Cancel</button>
`;

    deleteAccountContainer.appendChild(confirmBox);

    // Cancel button just removes modal
    document.getElementById("cancelDelete").onclick = () => {
      confirmBox.remove();
      logoutBtns.forEach((lbtn) => (lbtn.style.display = "block"));
      deleteAccount.style.display = "block";
    };

    // Confirm button deletes user only after this click
    document.getElementById("confirmDelete").onclick = async () => {
      const delRes = await fetch("/api/v1/users/delete", {
        method: "DELETE",
        headers: { Authorization: "Bearer " + token },
      });

      if (delRes.ok) {
        localStorage.removeItem("token");

        alert("Your account and all data have been deleted permanently.");
        window.location.href = "/signup.html"; // redirect to login
      } else {
        alert("Failed to delete account. Try again.");
      }
    };
  }
}

// Always bind event listener once
deleteAccount.addEventListener("click", (e) => {
  e.preventDefault(); // stop default form submission if inside a form

  logoutBtns.forEach((lbtn) => (lbtn.style.display = "none"));
  deleteAccount.style.display = "none";
  showDeleteConfirmation();
});

// ===================================================
// 🌐 API FUNCTIONS
// ===================================================

// Fetch links from server
async function fetchLinks() {
  const searchValue = search.value;
  const res = await fetch(
    `/api/v1/links?search=${encodeURIComponent(searchValue)}`,
    {
      headers: { Authorization: "Bearer " + token },
    }
  );
  const data = await res.json();
  linksCache = data.data;
  return data.data || [];
}

// Fetch visits for a specific link
async function fetchVisits(linkId) {
  const res = await fetch(`/api/v1/links/${linkId}/visits?limit=20`, {
    headers: { Authorization: "Bearer " + token },
  });
  const data = await res.json();
  return data.data || [];
}

// Create new link
async function createLink(title) {
  const res = await fetch("/api/v1/links/createLink", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: "Bearer " + token,
    },
    body: JSON.stringify({ title }),
  });
  return res.json();
}

// Delete single link
async function deleteLink(id) {
  if (!confirm("Delete this link?")) return;
  await fetch(`/api/v1/links/${id}`, {
    method: "DELETE",
    headers: { Authorization: "Bearer " + token },
  });
}

// Delete ALL links
async function deleteAllLink() {
  await fetch("/api/v1/links", {
    method: "DELETE",
    headers: { Authorization: "Bearer " + token },
  });
  const links = await fetchLinks();
  renderLinks(links);
}

// Delete visit
async function deleteVisit(id) {
  if (!confirm("Delete this visit?")) return;
  await fetch(`/api/v1/visits/${id}`, {
    method: "DELETE",
    headers: { Authorization: "Bearer " + token },
  });
}

// ===================================================
// 🎨 RENDER FUNCTIONS
// ===================================================

// Render all links
function renderLinks(links) {
  linksListEl.innerHTML = "";
  const emptyMessage = document.querySelector("#emptyMessage");
  const linksList = document.querySelector("#linksList");
  const searchcontainer = document.querySelector("#searchcontainer");

  if (links.length === 0) {
    linksList.style.display = "none";
    searchcontainer.style.display = "none";
    emptyMessage.style.display = "block";
  } else {
    emptyMessage.style.display = "none";
    linksList.style.display = "block";
    searchcontainer.style.display = "flex";
  }

  links.forEach((link) => {
    const li = document.createElement("li");
    li.innerHTML = `
      <strong>
        <a href="${link.url}" target="_blank" class="link-url">
          ${link.title || link.slug}
        </a> (Visits: ${link.visitCount || 0})
      </strong>
      <div class="linkButtons">
        <button data-url="${link.url}" class="copyUrlBtn">Copy Link</button>
        <button data-id="${link._id}" class="viewVisitsBtn">View Visits</button>
        <button data-id="${link._id}" class="deleteLinkBtn">Delete</button>
      </div>
    `;
    linksListEl.appendChild(li);
  });
}

// Render visits for a link
async function loadVisits(linkId) {
  const visits = await fetchVisits(linkId);
  visitsContainer.innerHTML = "";

  visits.forEach((v) => {
    const card = document.createElement("div");
    card.className = "visit-card";
    card.style.cssText = `
      border: 1px solid #ccc;
      padding: 1rem;
      border-radius: 8px;
      box-shadow: 0 2px 5px rgba(0,0,0,0.1);
      position: relative;
      margin-bottom: 1rem;
    `;

    if (v.ip) {
      card.innerHTML = `
        <p><strong>IP:</strong> ${v.ip || "N/A"}</p>
        <p><strong>City:</strong> ${v.city || "N/A"}</p>
        <p><strong>Region:</strong> ${v.region || "N/A"}</p>
        <p><strong>Country:</strong> ${v.country || "N/A"}</p>
        <p><strong>Visit Time:</strong> ${
          v.timestamp ? new Date(v.timestamp).toLocaleString() : "N/A"
        }</p>
        <p title="${v.useragent || "N/A"}"><strong>User Agent:</strong> ${
        v.useragent || "N/A"
      }</p>
        <button style=" position: absolute; top: 10px; right: 10px; background-color: #800000; border: none; color: white; padding: 5px 8px; border-radius: 4px; cursor: pointer; font-weight: bold; " data-id="${
          v._id
        }" class="deleteVisitBtn">Delete</button>      `;
    } else {
      card.innerHTML = `
        <p><strong>Latitude & Longitude:</strong> ${
          v.coords ? v.coords.lat + ", " + v.coords.lng : "N/A"
        }</p>
        <p><strong>GPS Address:</strong> ${v.gpsAddress || "N/A"}</p>
        <p><strong>Visit Time:</strong> ${
          v.timestamp ? new Date(v.timestamp).toLocaleString() : "N/A"
        }</p>
        <iframe
          width="100%"
          height="300"
          frameborder="0"
          style="border:0; border-radius: 10px;"
          src="https://maps.google.com/maps?q=${v.coords.lat},${
        v.coords.lng
      }&z=14&output=embed"
          allowfullscreen>
        </iframe>
          <button style=" position: absolute; top: 10px; right: 10px; background-color: #800000; border: none; color: white; padding: 5px 8px; border-radius: 4px; cursor: pointer; font-weight: bold; " data-id="${
            v._id
          }" class="deleteVisitBtn">Delete</button>  
      `;
    }

    visitsContainer.appendChild(card);
  });
}

// Helper: Load and render links
async function loadAndRenderLinks() {
  const links = await fetchLinks();
  renderLinks(links);
}

// ===================================================
// 🎯 EVENT LISTENERS
// ===================================================

// Search filter
search.addEventListener("input", async () => {
  const links = await fetchLinks();
  renderLinks(links);
});

// Sort links by visits
sortVisits.addEventListener("click", () => {
  sortAscending = !sortAscending;
  const icon = document.querySelector("#sortVisits i");
  icon.className = sortAscending
    ? "fas fa-sort-amount-up"
    : "fas fa-sort-amount-down";

  const sorted = [...linksCache].sort((a, b) =>
    sortAscending ? a.visitCount - b.visitCount : b.visitCount - a.visitCount
  );

  renderLinks(sorted);
});

// Delete all links
deleteAllLinks.addEventListener("click", async () => {
  if (confirm("Are you sure you want to delete all your links?")) {
    await deleteAllLink();
  }
  visitsSection.style.display = "none";
});

// Event delegation for link actions
linksListEl.addEventListener("click", async (e) => {
  const target = e.target;

  if (target.classList.contains("copyUrlBtn")) {
    navigator.clipboard.writeText(target.dataset.url).then(() => {
      alert("URL copied to clipboard!");
    });
  }

  if (target.classList.contains("viewVisitsBtn")) {
    currentLinkId = target.dataset.id;
    const linkTitle = target
      .closest("li")
      .querySelector("strong a").textContent;
    selectedLinkTitle.textContent = linkTitle;
    visitsSection.style.display = "block";
    await loadVisits(currentLinkId);
  }

  if (target.classList.contains("deleteLinkBtn")) {
    await deleteLink(target.dataset.id);
    await loadAndRenderLinks();
    visitsSection.style.display = "none";
  }
});

// Event delegation for deleting visits
visitsContainer.addEventListener("click", async (e) => {
  if (e.target.classList.contains("deleteVisitBtn")) {
    await deleteVisit(e.target.dataset.id);
    if (currentLinkId) await loadVisits(currentLinkId);
  }
});

// Create new link
createLinkForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const title = titleInput.value.trim();
  if (!title) return alert("Enter a title");
  await createLink(title);
  titleInput.value = "";
  await loadAndRenderLinks();
});

// Close visits section
closeVisitsBtn.addEventListener("click", () => {
  visitsSection.style.display = "none";
});

// ===================================================
// 🚀 INITIAL LOAD
// ===================================================
loadAndRenderLinks();

// Project: Location Saver
// Designed & Developed by Loukya Sri Kudipudi
// Built with ❤️ while learning Node.js
