const express = require("express");
const ffmpeg = require("fluent-ffmpeg");
const fs = require("fs");
const axios = require("axios");
const multer = require("multer");
const { exec } = require("child_process");

const app = express();
app.use(express.json());

const upload = multer({ dest: "/tmp/" });

/************ 1. DOWNLOAD YOUTUBE ************/
app.post("/youtube", async (req, res) => {
  const { url } = req.body;

  const output = "/tmp/youtube.mp4";

  exec(`yt-dlp -f best -o ${output} ${url}`, (err) => {
    if (err) return res.send("❌ Lỗi tải video");

    res.send("✅ Đã tải video YouTube (server)");
  });
});

/************ 2. UPLOAD + CUT ************/
app.post("/upload-split", upload.single("video"), async (req, res) => {
  const segments = parseInt(req.body.segments);
  const inputPath = req.file.path;

  ffmpeg.ffprobe(inputPath, (err, metadata) => {
    const duration = metadata.format.duration;
    const part = duration / segments;

    let done = 0;
    let outputs = [];

    for (let i = 0; i < segments; i++) {
      const start = i * part;
      const output = `/tmp/out_${i}.mp4`;

      ffmpeg(inputPath)
        .setStartTime(start)
        .setDuration(part)
        .output(output)
        .on("end", () => {
          outputs.push(output);
          done++;

          if (done === segments) {
            res.send("✅ Đã cắt: " + outputs.join(", "));
          }
        })
        .run();
    }
  });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log("Server chạy " + PORT));
