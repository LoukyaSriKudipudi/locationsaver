const videoDownloaderForm = document.getElementById("videoDownloaderForm");
const inputURL = document.querySelector(".inputURL");
const DownloadStatus = document.getElementById("DownloadStatus");
const downloadOptions = document.getElementById("downloadOptions");

videoDownloaderForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  const url = inputURL.value;
  let audioonly = downloadOptions.value || false; // assuming a checkbox

  DownloadStatus.textContent = "Downloading...";

  try {
    const res = await fetch("/videodownloader/download", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url, audioonly }),
    });

    const data = await res.json();
    if (data.message) {
      DownloadStatus.textContent = data.message;

      const a = document.createElement("a");
      a.href = "https://t.me/loukyaecho";
      a.textContent = " Go to Telegram group";
      DownloadStatus.append(a);
    }
  } catch (err) {
    console.error(err);
    DownloadStatus.textContent = "Error downloading video";
  }
});
