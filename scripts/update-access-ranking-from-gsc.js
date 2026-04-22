/**
 * Search Console の CSV/TSV から machines/ 配下のクリック数上位5件を
 * data/access-ranking.json に書き出す。
 *
 * 使い方:
 *   node scripts/update-access-ranking-from-gsc.js data/gsc.csv
 *
 * 想定入力:
 *   - GSC「検索パフォーマンス」のエクスポート（ページ単位 or クエリ×ページ）
 *   - 必須列: page（ページ）, clicks（クリック数）
 *
 * 環境変数:
 *   SITE_ORIGIN  本番オリジン（既定: https://www.pachislot-setting.com）
 *   RANKING_SIZE 上位何件を出すか（既定: 5）
 */
const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..");
const DEFAULT_INPUT = path.join(ROOT, "data", "gsc.csv");
const OUT_PATH = path.join(ROOT, "data", "access-ranking.json");
const SITE_ORIGIN = (process.env.SITE_ORIGIN || "https://www.pachislot-setting.com").replace(/\/$/, "");
const RANKING_SIZE = Number(process.env.RANKING_SIZE) || 5;

// ── CSV/TSV パーサー（gsc-analyze.js と同一ロジック） ──

function detectDelimiter(text) {
  const firstLine = text.split(/\r?\n/, 1)[0] || "";
  const tabs = (firstLine.match(/\t/g) || []).length;
  const commas = (firstLine.match(/,/g) || []).length;
  return tabs > commas ? "\t" : ",";
}

function parseDelimited(text, delimiter) {
  const rows = [];
  let row = [];
  let field = "";
  let inQuotes = false;

  const pushField = () => { row.push(field); field = ""; };
  const pushRow = () => {
    if (row.length === 1 && row[0] === "") return;
    rows.push(row);
    row = [];
  };

  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    const next = text[i + 1];
    if (inQuotes) {
      if (ch === '"' && next === '"') { field += '"'; i++; continue; }
      if (ch === '"') { inQuotes = false; continue; }
      field += ch;
      continue;
    }
    if (ch === '"') { inQuotes = true; continue; }
    if (ch === delimiter) { pushField(); continue; }
    if (ch === "\n") { pushField(); pushRow(); continue; }
    if (ch === "\r") continue;
    field += ch;
  }
  pushField();
  pushRow();
  return rows;
}

function normHeader(s) {
  return String(s || "").trim().toLowerCase()
    .replace(/\s+/g, "")
    .replace(/[（）()]/g, "");
}

function parseNumberLike(s) {
  if (s == null) return NaN;
  const t = String(s).trim();
  if (!t) return NaN;
  const pct = t.endsWith("%");
  const cleaned = t.replace(/[%,'\s]/g, "");
  const v = Number(cleaned);
  if (Number.isNaN(v)) return NaN;
  return pct ? v / 100 : v;
}

// ── URL → 相対パス変換 ──

function stripWww(hostname) {
  return hostname.replace(/^www\./, "");
}

function toRelativeHref(pageUrl) {
  const p = String(pageUrl || "").trim();
  if (!p) return null;
  let u;
  try { u = new URL(p); } catch { return null; }
  const base = new URL(SITE_ORIGIN);
  if (u.protocol !== base.protocol) return null;
  if (stripWww(u.hostname) !== stripWww(base.hostname)) return null;
  let rel = (u.pathname || "/").replace(/^\//, "");
  if (rel.includes("..")) return null;
  if (p.endsWith("/") && rel && !rel.endsWith("/")) rel += "/";
  return rel || null;
}

function isMachinesPath(rel) {
  return /^machines\/[a-z0-9_/\-]+\/?$/i.test(rel || "");
}

// ── 既存 JSON からタイトルを引き継ぐ ──

function loadExistingTitles() {
  const map = new Map();
  if (!fs.existsSync(OUT_PATH)) return map;
  try {
    const j = JSON.parse(fs.readFileSync(OUT_PATH, "utf8"));
    for (const it of j.items || []) {
      if (it.href && it.title) {
        map.set(it.href.replace(/\/?$/, "/"), it.title);
      }
    }
  } catch { /* ignore */ }
  return map;
}

function fallbackTitle(href) {
  const parts = href.replace(/\/$/, "").split("/");
  const last = parts[parts.length - 1] || parts[parts.length - 2] || href;
  return `${last}（タイトル要確認）`;
}

// ── メイン ──

function main() {
  const inputPath = process.argv[2]
    ? path.resolve(process.argv[2])
    : DEFAULT_INPUT;

  if (!fs.existsSync(inputPath)) {
    console.error(`入力ファイルが見つかりません: ${inputPath}`);
    console.error(`例: node scripts/update-access-ranking-from-gsc.js data/gsc.csv`);
    process.exit(1);
  }

  const raw = fs.readFileSync(inputPath, "utf8").replace(/^\ufeff/, "");
  const delimiter = detectDelimiter(raw);
  const rows = parseDelimited(raw, delimiter);
  if (rows.length < 2) {
    console.error("データ行がありません。");
    process.exit(1);
  }

  const headers = rows[0].map(normHeader);
  const colIndex = (candidates) => {
    for (const c of candidates) {
      const idx = headers.indexOf(c);
      if (idx !== -1) return idx;
    }
    return -1;
  };

  const idxPage = colIndex(["page", "ページ", "上位のページ", "上位のぺーじ", "landingpage", "url"]);
  const idxClicks = colIndex(["clicks", "クリック数", "クリック"]);

  if (idxPage === -1 || idxClicks === -1) {
    console.error("必須列が見つかりません。page, clicks が必要です。");
    console.error("検出されたヘッダー:", rows[0]);
    process.exit(1);
  }

  // ページ単位でクリック数を集計（クエリ×ページ形式への対応）
  const byPage = new Map();
  for (const r of rows.slice(1)) {
    const page = (r[idxPage] || "").trim();
    if (!page) continue;
    const clicks = parseNumberLike(r[idxClicks]);
    const c = Number.isFinite(clicks) ? clicks : 0;
    byPage.set(page, (byPage.get(page) || 0) + c);
  }

  // machines/ のみ抽出 → クリック降順
  const ranked = [];
  for (const [page, clicks] of byPage) {
    const href = toRelativeHref(page);
    if (!href || !isMachinesPath(href)) continue;
    const norm = href.endsWith("/") ? href : `${href}/`;
    ranked.push({ href: norm, clicks });
  }
  ranked.sort((a, b) => b.clicks - a.clicks);

  const top = ranked.slice(0, RANKING_SIZE);
  if (top.length === 0) {
    console.error(`machines/ 配下のページが見つかりませんでした（オリジン: ${SITE_ORIGIN}）`);
    process.exit(1);
  }

  // 既存タイトルを可能な限り引き継ぐ
  const existingTitles = loadExistingTitles();
  const items = top.map((row) => ({
    href: row.href,
    title: existingTitles.get(row.href) || fallbackTitle(row.href),
    clicks: Math.round(row.clicks),
  }));

  const out = {
    updated: new Date().toISOString().slice(0, 10),
    items,
  };

  fs.writeFileSync(OUT_PATH, JSON.stringify(out, null, 2) + "\n", "utf8");
  const relOut = path.relative(ROOT, OUT_PATH).replace(/\\/g, "/");
  console.log(`Wrote: ${relOut} (${items.length} items)`);
  for (const it of items) {
    console.log(`  ${it.clicks} clicks  ${it.href}  ${it.title}`);
  }
}

main();
