// server.js
const express = require("express");
const cors = require("cors");
const ytdl = require("ytdl-core"); // youtube-dl 라이브러리

const app = express();
const PORT = 5000;

app.use(cors());

app.get("/api/youtube-m3u8", async (req, res) => {
  const youtubeUrl = req.query.url;
  if (!youtubeUrl) {
    return res.status(400).json({ error: "Missing YouTube URL" });
  }

  try {
    const info = await ytdl.getInfo(youtubeUrl);
    const formats = ytdl.filterFormats(info.formats, "videoandaudio");
    const hlsFormat = formats.find((format) => format.mimeType.includes("application/x-mpegURL"));

    if (!hlsFormat) {
      return res.status(404).json({ error: "No HLS (m3u8) format available for this video" });
    }

    res.json({ m3u8: hlsFormat.url });
  } catch (err) {
    console.error("Error fetching HLS URL:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

app.listen(PORT, () => {
  console.log(`✅ HLS proxy server running on http://localhost:${PORT}`);
});
