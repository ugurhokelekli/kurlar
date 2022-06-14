// Oluşturulan output dosyalarını temizler.

import fs from "fs";

export default function clear() {
  var files = fs.readdirSync("./");
  files.forEach(function (file) {
    if (file.indexOf("output_") > -1) {
      fs.unlinkSync(file);
    }
  });
  fs.unlinkSync("result.json");
  fs.unlinkSync("final.json");
  fs.unlinkSync("final.md");
}
