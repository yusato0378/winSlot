const fs = require("fs");
const path = require("path");

const root = path.join(__dirname, "..");
const at = fs
  .readFileSync(path.join(root, "at-sorted.txt"), "utf8")
  .replace(/\r\n/g, "\n")
  .trimEnd();
const aList = fs
  .readFileSync(path.join(root, "a-sorted.txt"), "utf8")
  .replace(/\r\n/g, "\n")
  .trimEnd();

let html = fs.readFileSync(path.join(root, "index.html"), "utf8").replace(/\r\n/g, "\n");

const reAt =
  /(<ul class="machine-link-list">\n)([\s\S]*?)(\n                    <\/ul>\n                <\/details>\s*\n\s*<details class="machine-list-group">\s*\n                    <summary class="machine-list-group-title">Aタイプ)/;
if (!reAt.test(html)) throw new Error("AT machine list block not found");
html = html.replace(reAt, `$1${at}$3`);

const reA =
  /(Aタイプ<span class="machine-list-count">\d+機種<\/span><\/summary>\n                    <ul class="machine-link-list">\n)([\s\S]*?)(\n                    <\/ul>\n                <\/details>\n            <\/section>)/;
if (!reA.test(html)) throw new Error("A-type machine list block not found");
html = html.replace(reA, `$1${aList}$3`);

fs.writeFileSync(path.join(root, "index.html"), html, "utf8");
try {
  fs.unlinkSync(path.join(root, "at-sorted.txt"));
  fs.unlinkSync(path.join(root, "a-sorted.txt"));
} catch (_) {
  /* ignore */
}
console.log("index.html machine lists updated (50音順)");
