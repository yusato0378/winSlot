// Add favicon links to setGuessElement/*/index.html (only if missing)
// Run: node scripts/add-favicon-setguess.js
const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..", "setGuessElement");
const NEEDLE = '<meta name="viewport" content="width=device-width, initial-scale=1.0">';
const INSERT =
  NEEDLE +
  "\n    <link rel=\"icon\" type=\"image/png\" sizes=\"32x32\" href=\"../../favicon.png\">" +
  "\n    <link rel=\"apple-touch-icon\" href=\"../../favicon.png\">";

function walk(dir) {
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, ent.name);
    if (ent.isDirectory()) {
      walk(p);
    } else if (ent.name === "index.html") {
      let c = fs.readFileSync(p, "utf8");
      if (c.includes('rel="icon"')) continue;
      if (!c.includes(NEEDLE)) {
        console.warn("skip (viewport not found):", p);
        continue;
      }
      fs.writeFileSync(p, c.replace(NEEDLE, INSERT), "utf8");
      console.log("updated:", p);
    }
  }
}

if (!fs.existsSync(ROOT)) {
  console.error("setGuessElement not found:", ROOT);
  process.exit(1);
}
walk(ROOT);
console.log("done.");
