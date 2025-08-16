// Check if token exists
const token = localStorage.getItem("token");
if (!token) {
  window.location.href = "login.html";
}

// Elements
const logoutBtn = document.getElementById("logoutBtn");
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

let currentLinkId = null;

async function getUser() {
  const res = await fetch("/api/v1/users", {
    headers: { Authorization: "Bearer " + token },
  });
  const user = await res.json();
  username.textContent = `😎 ${user.data.name}`;
}

getUser();
// Logout
logoutBtn.addEventListener("click", () => {
  localStorage.removeItem("token");
  window.location.href = "login.html";
});

let linksCache = [];
let sortAscending = true;

// API calls
const search = document.querySelector("#search");
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

search.addEventListener("input", async () => {
  const links = await fetchLinks();
  renderLinks(links);
});

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

async function deleteAllLink() {
  await fetch("/api/v1/links", {
    method: "DELETE",
    headers: { Authorization: "Bearer " + token },
  });
  const links = await fetchLinks();
  renderLinks(links);
}

deleteAllLinks.addEventListener("click", async () => {
  if (confirm("Are you sure you want to delete all your links?")) {
    deleteAllLink();
  }
  visitsSection.style.display = "none";
});

async function fetchVisits(linkId) {
  const res = await fetch(`/api/v1/links/${linkId}/visits?limit=20`, {
    headers: { Authorization: "Bearer " + token },
  });
  const data = await res.json();
  return data.data || [];
}

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

async function deleteLink(id) {
  if (!confirm("Delete this link?")) return;
  await fetch(`/api/v1/links/${id}`, {
    method: "DELETE",
    headers: { Authorization: "Bearer " + token },
  });
}

async function deleteVisit(id) {
  if (!confirm("Delete this visit?")) return;
  await fetch(`/api/v1/visits/${id}`, {
    method: "DELETE",
    headers: { Authorization: "Bearer " + token },
  });
}

// Render links
function renderLinks(links) {
  linksListEl.innerHTML = "";
  links.forEach((link) => {
    const li = document.createElement("li");
    li.innerHTML = `
      <strong>
        <a href="${link.url}" target="_blank" class="link-url">${
      link.title || link.slug
    }</a> (Visits: ${link.visitCount || 0})
      </strong>
      <div class="linkButtons">
        <button data-url="${
          link.url
        }" class="copyUrlBtn" title="Copy URL">Copy Link</button>
        <button data-id="${link._id}" class="viewVisitsBtn">View Visits</button>
        <button data-id="${link._id}" class="deleteLinkBtn">Delete</button>
      </div>
    `;
    linksListEl.appendChild(li);
  });
}

// Load visits
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
        <button data-id="${v._id}" 
        style="
      position: absolute;
      top: 10px;
      right: 10px;
      background-color: #e74c3c;
      border: none;
      color: white;
      padding: 5px 8px;
      border-radius: 4px;
      cursor: pointer;
      font-weight: bold;
    " class="deleteVisitBtn">Delete</button>
      `;
    } else {
      card.innerHTML = `
        <p><strong>Latitude and Longitude:</strong> ${
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
        <button style="
      position: absolute;
      top: 10px;
      right: 10px;
      background-color: #e74c3c;
      border: none;
      color: white;
      padding: 5px 8px;
      border-radius: 4px;
      cursor: pointer;
      font-weight: bold;
    " data-id="${v._id}" class="deleteVisitBtn">Delete</button>
      `;
    }

    visitsContainer.appendChild(card);
  });
}

// Load & render links
async function loadAndRenderLinks() {
  const links = await fetchLinks();
  renderLinks(links);
}

// Event delegation for links list
linksListEl.addEventListener("click", async (e) => {
  const target = e.target;

  // Copy URL
  if (target.classList.contains("copyUrlBtn")) {
    navigator.clipboard.writeText(target.dataset.url).then(() => {
      alert("URL copied to clipboard!");
    });
  }

  // View Visits
  if (target.classList.contains("viewVisitsBtn")) {
    currentLinkId = target.dataset.id;
    const linkTitle = target
      .closest("li")
      .querySelector("strong a").textContent;
    selectedLinkTitle.textContent = linkTitle;
    visitsSection.style.display = "block";
    await loadVisits(currentLinkId);
  }

  // Delete Link
  if (target.classList.contains("deleteLinkBtn")) {
    const id = target.dataset.id;
    await deleteLink(id);
    await loadAndRenderLinks();
    visitsSection.style.display = "none";
  }
});

// Event delegation for delete visit buttons
visitsContainer.addEventListener("click", async (e) => {
  if (e.target.classList.contains("deleteVisitBtn")) {
    const id = e.target.dataset.id;
    await deleteVisit(id);
    if (currentLinkId) await loadVisits(currentLinkId);
  }
});

// Handle create link form
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

// Initial load
loadAndRenderLinks();

// <!-- desgined by loukya sri kudipudi -->
