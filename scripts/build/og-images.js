/**
 * 機種ページの OGP 画像（1200×630 PNG）を生成する。
 * 出力: {out}/machines/{id}/og.png
 *
 * X などでシェアされたときに、トップ共通の画像ではなく機種名と天井・機械割が見えるようにする。
 * SVG で組み立てて resvg で PNG にする（X は SVG の og:image を表示しないため）。
 * Vercel のビルド環境には日本語フォントが無いので、assets/fonts/ の Noto Sans JP だけを使う。
 */
const crypto = require("crypto");
const fs = require("fs");
const path = require("path");
const { Resvg } = require("@resvg/resvg-js");

const { settingKeysOf, breakEvenTable } = require("./machine-insights");

const W = 1200;
const H = 630;
const PAD = 80;
const FONT_FILE = path.join(__dirname, "..", "..", "assets", "fonts", "NotoSansJP_700Bold.ttf");
const CACHE_DIR = path.join(__dirname, "..", "..", "node_modules", ".cache", "og-images");
const GOLD = "#e8c15a";

function escapeXml(str) {
    return String(str)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;");
}

/**
 * 文字幅の見積もり（em 単位）。resvg では描画前に幅を測れないので、
 * 和文は全角1em、欧文・数字はやや広めに見積もって、はみ出さない側に倒す。
 */
function textWidthEm(text) {
    let w = 0;
    for (const ch of text) {
        const c = ch.codePointAt(0);
        if (c === 0x20) w += 0.3;
        else if (c < 0x80) w += /[A-Z0-9]/.test(ch) ? 0.66 : 0.58;
        else if (c >= 0xff61 && c <= 0xff9f) w += 0.55;   // 半角カナ
        else w += 1.0;
    }
    return w;
}

/** 機種名を1〜2行に収める。行の区切りはスペースを優先し、無ければ文字数の真ん中 */
function layoutTitle(name) {
    const maxW = W - PAD * 2;
    for (const size of [88, 80, 72]) {
        if (textWidthEm(name) * size <= maxW) return { size, lines: [name] };
    }
    const chars = Array.from(name);
    const candidates = [];
    chars.forEach((ch, i) => { if (ch === " " || ch === "　") candidates.push(i); });
    const mid = chars.length / 2;
    const cut = candidates.length
        ? candidates.reduce((a, b) => (Math.abs(b - mid) < Math.abs(a - mid) ? b : a))
        : Math.ceil(mid);
    const first = chars.slice(0, cut).join("").trim();
    const second = chars.slice(cut).join("").trim();
    const widest = Math.max(textWidthEm(first), textWidthEm(second));
    const size = Math.min(76, Math.floor(maxW / widest));
    return { size, lines: [first, second] };
}

function formatPayoutRange(machine) {
    const payouts = settingKeysOf(machine).map(s => machine.settings[s].payout);
    return `機械割 ${Math.min(...payouts).toFixed(1)}〜${Math.max(...payouts).toFixed(1)}%`;
}

/** 画像の下段に並べる要点（最大3つ）。機種ページの内容と同じ数字だけを使う */
function buildChips(machine) {
    const payout = formatPayoutRange(machine);
    if (machine.pending) {
        const [, mo, d] = (machine.addedDate || "").split("-");
        return [mo ? `${Number(mo)}/${Number(d)} 導入` : null, payout].filter(Boolean);
    }
    if (machine.ceiling) {
        const chips = [`天井 ${machine.ceiling}G`];
        const be = breakEvenTable(machine);
        const equal = be && be[0].normal;
        if (be && equal !== null) {
            chips.push(equal === 0 ? "等価 いつでもプラス" : `等価 ${equal}G〜でプラス`);
        } else if (machine.ceilingTarget) {
            chips.push(`狙い目 ${machine.ceilingTarget}G〜`);
        }
        chips.push(payout);
        return chips;
    }
    return [payout, "設定推測に対応"];
}

function buildSvg(machine) {
    const title = layoutTitle(machine.name);
    const lineGap = Math.round(title.size * 1.25);
    // タイトルの塊を上下中央（区切り線より上の領域）に置く
    const titleTop = 245 - ((title.lines.length - 1) * lineGap) / 2;
    const titleSvg = title.lines.map((line, i) =>
        `<text x="${W / 2}" y="${titleTop + i * lineGap}" font-size="${title.size}" fill="#ffffff" text-anchor="middle" dominant-baseline="middle">${escapeXml(line)}</text>`
    ).join("\n  ");

    const badge = machine.pending ? "解析待ち" : machine.type === "AT" ? "AT / ART機" : "Aタイプ";
    const badgeSize = 28;
    const badgeW = Math.round(textWidthEm(badge) * badgeSize + 44);
    const badgeFill = machine.pending ? "#c0392b" : "rgba(232,193,90,0.14)";
    const badgeText = machine.pending ? "#ffffff" : GOLD;

    // 要点のチップ。幅が足りなければ後ろから落とす
    const chipSize = 34;
    const chipGap = 24;
    let chips = buildChips(machine).map(t => ({ t, w: Math.round(textWidthEm(t) * chipSize + 56) }));
    const total = () => chips.reduce((s, c) => s + c.w, 0) + chipGap * (chips.length - 1);
    while (chips.length > 1 && total() > W - PAD * 2) chips = chips.slice(0, -1);
    let x = (W - total()) / 2;
    const chipY = 448;
    const chipH = 72;
    const chipSvg = chips.map(c => {
        const svg = `<rect x="${x}" y="${chipY}" width="${c.w}" height="${chipH}" rx="36" fill="rgba(232,193,90,0.12)" stroke="${GOLD}" stroke-width="2"/>
  <text x="${x + c.w / 2}" y="${chipY + chipH / 2}" font-size="${chipSize}" fill="${GOLD}" text-anchor="middle" dominant-baseline="central">${escapeXml(c.t)}</text>`;
        x += c.w + chipGap;
        return svg;
    }).join("\n  ");

    return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" font-family="Noto Sans JP" font-weight="700">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#0a0f2e"/>
      <stop offset="1" stop-color="#1d1652"/>
    </linearGradient>
    <radialGradient id="glow" cx="0.5" cy="0.42" r="0.6">
      <stop offset="0" stop-color="#3a2f8f" stop-opacity="0.55"/>
      <stop offset="1" stop-color="#3a2f8f" stop-opacity="0"/>
    </radialGradient>
    <linearGradient id="line" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0" stop-color="${GOLD}" stop-opacity="0"/>
      <stop offset="0.5" stop-color="${GOLD}" stop-opacity="1"/>
      <stop offset="1" stop-color="${GOLD}" stop-opacity="0"/>
    </linearGradient>
  </defs>
  <rect width="${W}" height="${H}" fill="url(#bg)"/>
  <rect width="${W}" height="${H}" fill="url(#glow)"/>
  <rect x="24" y="24" width="${W - 48}" height="${H - 48}" rx="20" fill="none" stroke="${GOLD}" stroke-opacity="0.35" stroke-width="2"/>
  <text x="${PAD}" y="92" font-size="28" fill="${GOLD}" letter-spacing="3" dominant-baseline="middle">Setting Analyzer Pro</text>
  <rect x="${W - PAD - badgeW}" y="68" width="${badgeW}" height="48" rx="24" fill="${badgeFill}" stroke="${machine.pending ? "none" : GOLD}" stroke-width="2"/>
  <text x="${W - PAD - badgeW / 2}" y="92" font-size="${badgeSize}" fill="${badgeText}" text-anchor="middle" dominant-baseline="central">${escapeXml(badge)}</text>
  ${titleSvg}
  <rect x="${PAD}" y="402" width="${W - PAD * 2}" height="2" fill="url(#line)"/>
  ${chipSvg}
  <text x="${W / 2}" y="574" font-size="26" fill="#b8bde0" text-anchor="middle" dominant-baseline="middle" letter-spacing="2">パチスロ天井期待値・設定推測ツール ｜ pachislot-setting.com</text>
</svg>`;
}

/**
 * @param {string} out 出力ルート（dist）
 * @param {{ MACHINES: object[] }} data 機種データ
 */
function buildOgImages(out, data) {
    // 描画は1枚0.4秒ほど（ほぼ日本語フォントの読み込み）かかるので、SVG とフォントが同じなら前回の PNG を使い回す
    const font = fs.readFileSync(FONT_FILE);
    const fontHash = crypto.createHash("sha1").update(font).digest("hex");
    fs.mkdirSync(CACHE_DIR, { recursive: true });
    const fontBuffers = [font];
    let rendered = 0;
    const used = new Set();
    for (const m of data.MACHINES) {
        const svg = buildSvg(m);
        const name = crypto.createHash("sha1").update(fontHash + svg).digest("hex") + ".png";
        used.add(name);
        const cached = path.join(CACHE_DIR, name);
        if (!fs.existsSync(cached)) {
            const png = new Resvg(svg, {
                fitTo: { mode: "width", value: W },
                font: { fontBuffers, loadSystemFonts: false, defaultFontFamily: "Noto Sans JP" },
            }).render().asPng();
            fs.writeFileSync(cached, png);
            rendered++;
        }
        fs.copyFileSync(cached, path.join(out, "machines", m.id, "og.png"));
    }
    // 機種データが変わって使われなくなった画像は消す（キャッシュが増え続けないように）
    for (const f of fs.readdirSync(CACHE_DIR)) {
        if (!used.has(f)) fs.unlinkSync(path.join(CACHE_DIR, f));
    }
    console.log(`Created: machines/*/og.png (${data.MACHINES.length} images, 新規描画 ${rendered})`);
}

module.exports = { buildOgImages, buildSvg };
