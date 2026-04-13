const express = require("express");
const ffmpeg = require("fluent-ffmpeg");
const fs = require("fs");
const axios = require("axios");

const app = express();
app.use(express.json());

app.post("/split", async (req, res) => {
  const { url, segments } = req.body;

  const inputPath = "/tmp/input.mp4";

  const writer = fs.createWriteStream(inputPath);
  const response = await axios({
    url,
    method: "GET",
    responseType: "stream"
  });

  response.data.pipe(writer);

  writer.on("finish", () => {
    ffmpeg.ffprobe(inputPath, (err, metadata) => {
      const duration = metadata.format.duration;
      const part = duration / segments;

      let done = 0;
      let outputs = [];

      for (let i = 0; i < segments; i++) {
        const start = i * part;
        const output = `/tmp/output_${i}.mp4`;

        ffmpeg(inputPath)
          .setStartTime(start)
          .setDuration(part)
          .output(output)
          .on("end", () => {
            outputs.push(output);
            done++;

            if (done === parseInt(segments)) {
              res.send("✅ Xong: " + outputs.join("<br>"));
            }
          })
          .run();
      }
    });
  });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log("Server chạy " + PORT));
