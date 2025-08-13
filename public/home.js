// Check if token exists
const token = localStorage.getItem("token");
if (!token) {
  window.location.href = "login.html";
} else {
  document.getElementById("welcomeMessage").textContent = "You are logged in!";
}

// Logout button
document.getElementById("logoutBtn").addEventListener("click", () => {
  localStorage.removeItem("token");
  window.location.href = "login.html";
});

// Fetch all links
async function fetchLinks() {
  const res = await fetch("/api/v1/links", {
    headers: { Authorization: "Bearer " + token },
  });
  const data = await res.json();
  return data.data || [];
}

// Fetch visits for a link
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

// Delete link by ID
async function deleteLink(id) {
  if (!confirm("Delete this link?")) return;
  await fetch(`/api/v1/links/${id}`, {
    method: "DELETE",
    headers: { Authorization: "Bearer " + token },
  });
}

// Delete visit by ID
async function deleteVisit(id) {
  if (!confirm("Delete this visit?")) return;
  await fetch(`/api/v1/visits/${id}`, {
    method: "DELETE",
    headers: { Authorization: "Bearer " + token },
  });
}

const linksListEl = document.getElementById("linksList");
const visitsSection = document.getElementById("visitsSection");
const visitsTableBody = document.getElementById("visitsTableBody");
const selectedLinkTitle = document.getElementById("selectedLinkTitle");
let currentLinkId = null;

function renderLinks(links) {
  linksListEl.innerHTML = "";
  links.forEach((link) => {
    const li = document.createElement("li");
    li.innerHTML = `
  <strong>
    <a href="${link.url}" target="_blank" class="link-url">${
      link.title || link.slug
    }</a>
  </strong>
  <button data-url="${
    link.url
  }" class="copyUrlBtn" title="Copy URL">Copy Link</button>
  (Visits: ${link.visitCount || 0})
  <button data-id="${link._id}" class="viewVisitsBtn">View Visits</button>
  <button data-id="${link._id}" class="deleteLinkBtn">Delete</button>
`;

    linksListEl.appendChild(li);
  });

  document.querySelectorAll(".copyUrlBtn").forEach((btn) => {
    btn.onclick = () => {
      const urlToCopy = btn.dataset.url;
      navigator.clipboard
        .writeText(urlToCopy)
        .then(() => {
          alert("URL copied to clipboard!");
        })
        .catch(() => {
          alert("Failed to copy URL.");
        });
    };
  });

  // Attach event listeners to view visits buttons
  document.querySelectorAll(".viewVisitsBtn").forEach((btn) => {
    btn.onclick = async () => {
      currentLinkId = btn.dataset.id;

      // Find the corresponding title text to show
      const linkTitle = btn.parentElement.querySelector("strong a").textContent;
      selectedLinkTitle.textContent = linkTitle;

      visitsSection.style.display = "block";
      await loadVisits(currentLinkId);
    };
  });

  // Attach event listeners to delete link buttons
  document.querySelectorAll(".deleteLinkBtn").forEach((btn) => {
    btn.onclick = async () => {
      const id = btn.dataset.id;
      await deleteLink(id);
      await loadAndRenderLinks();
      visitsSection.style.display = "none";
    };
  });
}

async function loadVisits(linkId) {
  const visits = await fetchVisits(linkId);
  // visitsTableBody.innerHTML = "";

  const visitsContainer = document.getElementById("visitsContainer");
  visitsContainer.innerHTML = "";

  visits.forEach((v) => {
    const card = document.createElement("div");
    card.className = "visit-card";
    card.style = `
    border: 1px solid #ccc;
    padding: 1rem;
    border-radius: 8px;
    box-shadow: 0 2px 5px rgba(0,0,0,0.1);
    position: relative;
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
    <p style="max-width: 100%" title="${v.useragent || "N/A"}">
      <strong>User Agent:</strong> ${v.useragent || "N/A"}
    </p>
    <button data-id="${v._id}" class="deleteVisitBtn" style="
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
    ">Delete</button>
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
    
    <button data-id="${v._id}" class="deleteVisitBtn" style="
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
    ">Delete</button>
  `;
    }
    visitsContainer.appendChild(card);
  });

  // Attach delete visit buttons listeners
  document.querySelectorAll(".deleteVisitBtn").forEach((btn) => {
    btn.onclick = async () => {
      const id = btn.dataset.id;
      await deleteVisit(id);
      await loadVisits(linkId);
    };
  });
}

async function loadAndRenderLinks() {
  const links = await fetchLinks();
  renderLinks(links);
}

// Handle form submission for creating new link
document.getElementById("createLinkForm").onsubmit = async (e) => {
  e.preventDefault();
  const titleInput = document.getElementById("title");
  const title = titleInput.value.trim();
  if (!title) {
    alert("Enter a title");
    return;
  }
  await createLink(title);
  titleInput.value = "";
  await loadAndRenderLinks();
};

// Close visits section button
document.getElementById("closeVisitsBtn").onclick = () => {
  visitsSection.style.display = "none";
};

// Initial load of links
loadAndRenderLinks();
