/**
 * Search Console CSV/TSV を読み込み、改善候補（CTR低/順位11〜20）をMarkdownにまとめる。
 *
 * 使い方:
 *   node scripts/gsc-analyze.js data/gsc.csv
 *
 * 想定入力:
 * - Search Console の「検索パフォーマンス」からエクスポートした CSV/TSV
 * - 列: query, page, clicks, impressions, ctr, position（表記ゆれに対応）
 *
 * 出力:
 * - reports/gsc-actions.md
 */
const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..");
const DEFAULT_INPUT = path.join(ROOT, "data", "gsc.csv");
const OUT_DIR = path.join(ROOT, "reports");
const OUT_PATH = path.join(OUT_DIR, "gsc-actions.md");

function ensureDir(p) {
  if (!fs.existsSync(p)) fs.mkdirSync(p, { recursive: true });
}

function detectDelimiter(text) {
  // TSV はタブが多い傾向
  const firstLine = text.split(/\r?\n/, 1)[0] || "";
  const tabs = (firstLine.match(/\t/g) || []).length;
  const commas = (firstLine.match(/,/g) || []).length;
  return tabs > commas ? "\t" : ",";
}

function parseDelimited(text, delimiter) {
  // 最小限のCSVパーサ（ダブルクォート対応）
  const rows = [];
  let row = [];
  let field = "";
  let inQuotes = false;

  const pushField = () => {
    row.push(field);
    field = "";
  };
  const pushRow = () => {
    // 末尾の空行は捨てる
    if (row.length === 1 && row[0] === "") return;
    rows.push(row);
    row = [];
  };

  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    const next = text[i + 1];

    if (inQuotes) {
      if (ch === '"' && next === '"') {
        field += '"';
        i++;
        continue;
      }
      if (ch === '"') {
        inQuotes = false;
        continue;
      }
      field += ch;
      continue;
    }

    if (ch === '"') {
      inQuotes = true;
      continue;
    }
    if (ch === delimiter) {
      pushField();
      continue;
    }
    if (ch === "\n") {
      pushField();
      pushRow();
      continue;
    }
    if (ch === "\r") {
      // ignore
      continue;
    }
    field += ch;
  }
  pushField();
  pushRow();
  return rows;
}

function normHeader(s) {
  return String(s || "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "")
    .replace(/[（）()]/g, "");
}

function parseNumberLike(s) {
  if (s == null) return NaN;
  const t = String(s).trim();
  if (!t) return NaN;
  // "12.3%" のような場合
  const pct = t.endsWith("%");
  const cleaned = t.replace(/[%,'\s]/g, "");
  const v = Number(cleaned);
  if (Number.isNaN(v)) return NaN;
  return pct ? v / 100 : v;
}

function toFixedOrDash(n, digits) {
  return Number.isFinite(n) ? n.toFixed(digits) : "-";
}

function groupBy(arr, keyFn) {
  const m = new Map();
  for (const x of arr) {
    const k = keyFn(x);
    if (!m.has(k)) m.set(k, []);
    m.get(k).push(x);
  }
  return m;
}

function main() {
  const inputPath = process.argv[2] ? path.resolve(process.argv[2]) : DEFAULT_INPUT;
  if (!fs.existsSync(inputPath)) {
    console.error(`Input not found: ${inputPath}`);
    console.error(`例: node scripts/gsc-analyze.js data/gsc.csv`);
    process.exit(1);
  }

  const raw = fs.readFileSync(inputPath, "utf8");
  const delimiter = detectDelimiter(raw);
  const rows = parseDelimited(raw, delimiter);
  if (rows.length < 2) {
    console.error("No data rows found.");
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

  const idxQuery = colIndex(["query", "検索キーワード", "検索語句", "検索語句数", "searchquery", "上位のクエリ"]);
  const idxPage = colIndex(["page", "ページ", "上位のページ", "上位のぺーじ", "landingpage", "url"]);
  const idxClicks = colIndex(["clicks", "クリック数", "クリック"]);
  const idxImpr = colIndex(["impressions", "表示回数", "表示"]);
  const idxCtr = colIndex(["ctr", "クリック率"]);
  const idxPos = colIndex(["position", "平均掲載順位", "平均順位"]);

  if (idxQuery === -1 || idxPage === -1 || idxClicks === -1 || idxImpr === -1 || idxPos === -1) {
    console.error("Required columns not found. Need at least: query, page, clicks, impressions, position");
    console.error("Detected headers:", rows[0]);
    process.exit(1);
  }

  const data = rows.slice(1).map((r) => {
    const query = (r[idxQuery] || "").trim();
    const page = (r[idxPage] || "").trim();
    const clicks = parseNumberLike(r[idxClicks]);
    const impressions = parseNumberLike(r[idxImpr]);
    const ctr = idxCtr !== -1 ? parseNumberLike(r[idxCtr]) : (Number.isFinite(clicks) && Number.isFinite(impressions) && impressions > 0 ? clicks / impressions : NaN);
    const position = parseNumberLike(r[idxPos]);
    return { query, page, clicks, impressions, ctr, position };
  }).filter((x) => x.query && x.page);

  // しきい値（必要なら後で調整）
  const MIN_IMPRESSIONS = 100;
  const CTR_LOW = 0.01; // 1%
  const POS_LOW = 11;
  const POS_HIGH = 20;

  const ctrLow = data
    .filter((x) => x.impressions >= MIN_IMPRESSIONS && x.ctr <= CTR_LOW)
    .sort((a, b) => (b.impressions - a.impressions) || (a.ctr - b.ctr));

  const posMid = data
    .filter((x) => x.impressions >= MIN_IMPRESSIONS && x.position >= POS_LOW && x.position <= POS_HIGH)
    .sort((a, b) => (a.position - b.position) || (b.impressions - a.impressions));

  // ページ単位の集計（どこを直すべきか）
  const byPage = groupBy(data, (x) => x.page);
  const pageStats = [];
  for (const [page, rows] of byPage) {
    const impr = rows.reduce((s, x) => s + (Number.isFinite(x.impressions) ? x.impressions : 0), 0);
    const clicks = rows.reduce((s, x) => s + (Number.isFinite(x.clicks) ? x.clicks : 0), 0);
    const ctr = impr > 0 ? clicks / impr : NaN;
    const bestPos = rows.reduce((m, x) => (Number.isFinite(x.position) ? Math.min(m, x.position) : m), Infinity);
    pageStats.push({ page, impressions: impr, clicks, ctr, bestPos });
  }
  pageStats.sort((a, b) => (b.impressions - a.impressions));

  const now = new Date();
  const ymd = now.toISOString().slice(0, 10);

  const mdLines = [];
  mdLines.push(`# GSC 改善アクション（自動抽出）`);
  mdLines.push(``);
  mdLines.push(`- 生成日: ${ymd}`);
  mdLines.push(`- 入力: \`${path.relative(ROOT, inputPath).replace(/\\/g, "/")}\``);
  mdLines.push(`- しきい値: impressions >= ${MIN_IMPRESSIONS}, CTR <= ${(CTR_LOW * 100).toFixed(1)}%, position ${POS_LOW}-${POS_HIGH}`);
  mdLines.push(``);
  mdLines.push(`## まずやる（CTR改善：表示回数が多いのにクリックされない）`);
  mdLines.push(`- 施策: title/description をクエリ意図に寄せる、冒頭1画面の要点を強化、FAQの追加（機種LPはFAQ JSON-LDが効きやすい）`);
  mdLines.push(``);
  if (ctrLow.length === 0) {
    mdLines.push(`該当なし。`);
  } else {
    mdLines.push(`| query | page | impressions | clicks | ctr | pos | 推奨 |`);
    mdLines.push(`|---|---|---:|---:|---:|---:|---|`);
    for (const x of ctrLow.slice(0, 80)) {
      const rec = x.page.includes("/machines/") ? "title/desc寄せ + 冒頭/注意点/関連記事" : "title/desc寄せ + 見出し/導線";
      mdLines.push(`| ${x.query.replace(/\|/g, "\\|")} | ${x.page.replace(/\|/g, "\\|")} | ${Math.round(x.impressions)} | ${Math.round(x.clicks)} | ${(x.ctr * 100).toFixed(2)}% | ${toFixedOrDash(x.position, 1)} | ${rec} |`);
    }
  }

  mdLines.push(``);
  mdLines.push(`## 次にやる（順位 11〜20：少しの強化で上がりやすい帯）`);
  mdLines.push(`- 施策: 見出しの追加/再配置、関連リンク増、検索意図に合わせた“意図別ページ”へ誘導（ceiling/setting/beginner）`);
  mdLines.push(``);
  if (posMid.length === 0) {
    mdLines.push(`該当なし。`);
  } else {
    mdLines.push(`| query | page | impressions | clicks | ctr | pos | 推奨 |`);
    mdLines.push(`|---|---|---:|---:|---:|---:|---|`);
    for (const x of posMid.slice(0, 80)) {
      const rec = x.page.includes("/machines/") ? "見出し/FAQ追加 + 内部リンク" : "セクション追加 + 内部リンク";
      mdLines.push(`| ${x.query.replace(/\|/g, "\\|")} | ${x.page.replace(/\|/g, "\\|")} | ${Math.round(x.impressions)} | ${Math.round(x.clicks)} | ${(x.ctr * 100).toFixed(2)}% | ${toFixedOrDash(x.position, 1)} | ${rec} |`);
    }
  }

  mdLines.push(``);
  mdLines.push(`## ページ別サマリ（優先度付け用）`);
  mdLines.push(`| page | impressions | clicks | ctr | best pos |`);
  mdLines.push(`|---|---:|---:|---:|---:|`);
  for (const p of pageStats.slice(0, 60)) {
    mdLines.push(`| ${p.page.replace(/\|/g, "\\|")} | ${Math.round(p.impressions)} | ${Math.round(p.clicks)} | ${(p.ctr * 100).toFixed(2)}% | ${Number.isFinite(p.bestPos) ? p.bestPos.toFixed(1) : "-"} |`);
  }

  ensureDir(OUT_DIR);
  fs.writeFileSync(OUT_PATH, mdLines.join("\n") + "\n", "utf8");
  console.log(`Wrote: ${path.relative(ROOT, OUT_PATH).replace(/\\/g, "/")}`);
}

main();

