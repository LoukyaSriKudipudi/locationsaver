const useragent = document.getElementById("user-agent");
useragent.textContent = navigator.userAgent;

// Send IP data to backend immediately
async function loadIPInfo() {
  try {
    const ipData = await fetch("https://ipwhois.app/json/").then((r) =>
      r.json()
    );

    // Display on page
    document.getElementById("ip").textContent = ipData.ip || "N/A";
    document.getElementById("ip-city").textContent = ipData.city || "N/A";
    document.getElementById("ip-region").textContent = ipData.region || "N/A";
    document.getElementById("ip-country").textContent =
      ipData.country_name || "N/A";
    document.getElementById("ip-org").textContent = ipData.org || "N/A";
    document.getElementById("ip-timezone").textContent =
      ipData.timezone || "N/A";
    document.getElementById(
      "ip-coords"
    ).textContent = `${ipData.latitude}, ${ipData.longitude}`;

    // Send IP data to backend immediately
    await fetch(window.location.pathname + "/visit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ip: ipData.ip,
        city: ipData.city,
        region: ipData.region,
        country: ipData.country_name,
        org: ipData.org,
        timezone: ipData.timezone,
        ipLat: ipData.latitude,
        ipLon: ipData.longitude,
        useragent: navigator.userAgent, // <-- Fix here
        consented: false, // no GPS yet
      }),
    });

    return ipData;
  } catch (err) {
    console.error("IP fetch failed", err);
  }
}

document.getElementById("captureBtn").addEventListener("click", getGPSLocation);

async function getGPSLocation() {
  if (!navigator.geolocation) {
    alert("Geolocation not supported by your browser.");
    return;
  }

  navigator.geolocation.getCurrentPosition(async (pos) => {
    const lat = pos.coords.latitude;
    const lon = pos.coords.longitude;

    document.getElementById("gps-coords").textContent = `${lat}, ${lon}`;

    // Fetch Nominatim address
    try {
      const nominatim = await fetch(
        `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json`
      ).then((r) => r.json());

      document.getElementById("gps-address").textContent =
        nominatim.display_name || "Address not found";

      // Send GPS data to backend (update consented = true)
      await fetch(window.location.pathname + "/visit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          lat: lat,
          lng: lon,
          gpsAddress: nominatim.display_name,
          consented: true,
        }),
      });
    } catch (err) {
      console.error("Nominatim fetch failed", err);
    }
  });
}

// Run on page load
loadIPInfo();
