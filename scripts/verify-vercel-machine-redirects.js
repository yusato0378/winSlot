/**
 * vercel.json の機種LP旧パス → 単一URL への 301 定義を検証する。
 * 本番HTTPヘッダの確認はデプロイ後に別途行う（SSL/環境に依存）。
 */
const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..");
const VERCEL_PATH = path.join(ROOT, "vercel.json");

const EXPECTED_SUFFIXES = ["ceiling", "setting", "beginner"];
const DEST = "/machines/:machineId/";

function main() {
  const raw = fs.readFileSync(VERCEL_PATH, "utf8");
  const cfg = JSON.parse(raw);

  if (cfg.trailingSlash !== true) {
    console.error("vercel.json: trailingSlash は true である必要があります。");
    process.exit(1);
  }

  const redirects = Array.isArray(cfg.redirects) ? cfg.redirects : [];
  const articles = redirects.find(
    (r) =>
      r &&
      r.source === "/articles/:slug" &&
      r.destination === "/guide/:slug" &&
      r.permanent === true
  );
  if (!articles) {
    console.error("vercel.json: /articles/:slug → /guide/:slug の permanent リダイレクトが見つかりません。");
    process.exit(1);
  }

  for (const suf of EXPECTED_SUFFIXES) {
    for (const slash of ["", "/"]) {
      const source = `/machines/:machineId/${suf}${slash}`;
      const rule = redirects.find(
        (r) =>
          r &&
          r.source === source &&
          r.destination === DEST &&
          r.permanent === true
      );
      if (!rule) {
        console.error(
          `vercel.json: 期待するリダイレクトがありません: ${JSON.stringify({ source, destination: DEST, permanent: true })}`
        );
        process.exit(1);
      }
    }
  }

  console.log("OK: vercel.json の articles リダイレクトと機種旧パス（ceiling/setting/beginner・末尾スラッシュ有無）の301定義を確認しました。");
}

main();
