const express = require("express");
const ffmpeg = require("fluent-ffmpeg");
const fs = require("fs");
const multer = require("multer");

const app = express();

const upload = multer({ dest: "/tmp/" });

app.post("/split", upload.single("video"), (req, res) => {
  const segments = Math.max(2, Math.min(10, parseInt(req.body.segments)));
  const inputPath = req.file.path;

  ffmpeg.ffprobe(inputPath, (err, metadata) => {
    if (err) return res.send("❌ Không đọc được video");

    const duration = metadata.format.duration;
    const part = duration / segments;

    let i = 0;
    let outputs = [];

    function runNext() {
      if (i >= segments) {
        return res.send("✅ Đã cắt xong " + segments + " đoạn");
      }

      const start = i * part;
      const output = `/tmp/out_${i}.mp4`;

      ffmpeg(inputPath)
  .setStartTime(start)
  .setDuration(part)
  .outputOptions("-c copy") // 👈 QUAN TRỌNG
  .output(output)
        .on("start", () => {
          console.log("🚀 Đang xử lý đoạn", i);
        })
        .on("end", () => {
          outputs.push(output);
          i++;
          runNext();
        })
        .on("error", (err) => {
          console.log(err);
          res.send("❌ Lỗi xử lý video");
        })
        .run();
    }

    runNext();
  });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log("Server chạy " + PORT));
