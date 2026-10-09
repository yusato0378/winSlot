/**
 * PWA（ホーム画面に追加）用のファイルを dist/ に出す。
 * - manifest.webmanifest
 * - アイコン（天井ラインと右肩上がりの棒グラフ。紺地に金で OGP 画像と同じ配色）
 *   - favicon.png … 全ページのタブ用。小さく表示されるので棒を3本に減らし、線を太くした版
 *   - icons/apple-touch-icon.png（iPhone のホーム画面）・icon-192/512.png・icon-maskable-512.png（Android・PWA）
 * - sw.js（ルートの sw.js に、バージョンと最初に保存するファイルの一覧を埋める）
 *
 * ほかの生成物（machines-data.js 等）が揃ってから呼ぶこと。バージョンはそれらの中身から決めるので、
 * 機種データやアプリを直すと Service Worker も入れ替わり、古い保存分が消える。
 */
const crypto = require("crypto");
const fs = require("fs");
const path = require("path");

const { createRenderer } = require("./og-images");

// 最初の1回で保存しておく、トップの計算ツールが動くのに必要なファイル
const PRECACHE = [
    "/",
    "/style.css",
    "/app.js",
    "/machines-data.js",
    "/suggestion-rates.js",
    "/favicon.png",
    "/manifest.webmanifest",
    "/icons/icon-192.png",
];

const THEME = "#0f1123";   // style.css の --bg-primary
const GOLD = "#e8c15a";

const ICON_DEFS = `<defs>
  <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#141a46"/><stop offset="1" stop-color="#2a1d63"/></linearGradient>
  <linearGradient id="gold" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#f6dc8c"/><stop offset="1" stop-color="#c99a2e"/></linearGradient>
  <radialGradient id="glow" cx="0.5" cy="0.35" r="0.7"><stop offset="0" stop-color="#4b3fb0" stop-opacity="0.6"/><stop offset="1" stop-color="#4b3fb0" stop-opacity="0"/></radialGradient>
</defs>`;

// 中身は 512 四方の座標。Android の maskable は中央80%（51〜461）しか見えない前提なので、その中に収める
const MARK = `<line x1="96" y1="150" x2="416" y2="150" stroke="${GOLD}" stroke-width="14" stroke-dasharray="26 18" stroke-linecap="round"/>
  <rect x="110" y="330" width="62" height="80" rx="14" fill="#6f7bd6"/>
  <rect x="190" y="275" width="62" height="135" rx="14" fill="#8a95e6"/>
  <rect x="270" y="215" width="62" height="195" rx="14" fill="#a9b2f2"/>
  <rect x="350" y="165" width="62" height="245" rx="14" fill="url(#gold)"/>`;
// タブ（16〜32px）用。点線や4本目の棒はつぶれるので、実線と3本の太い棒にする
const MARK_SMALL = `<line x1="70" y1="120" x2="442" y2="120" stroke="${GOLD}" stroke-width="34" stroke-linecap="round"/>
  <rect x="80" y="330" width="80" height="110" rx="16" fill="#8a95e6"/>
  <rect x="216" y="245" width="80" height="195" rx="16" fill="#a9b2f2"/>
  <rect x="352" y="170" width="80" height="270" rx="16" fill="url(#gold)"/>`;

/**
 * @param {string} mark 中身
 * @param {number} radius 背景の角丸（512 四方での値）。iPhone と maskable は OS が角を丸めるので 0（四角）にする
 */
function iconSvg(mark, radius) {
    return `<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512">${ICON_DEFS}
  <rect width="512" height="512" rx="${radius}" fill="url(#bg)"/>
  <rect width="512" height="512" rx="${radius}" fill="url(#glow)"/>
  ${mark}
</svg>`;
}

/**
 * @param {string} root リポジトリルート
 * @param {string} out  出力ルート（dist）
 */
function buildPwa(root, out) {
    const iconDir = path.join(out, "icons");
    fs.mkdirSync(iconDir, { recursive: true });
    const renderer = createRenderer("pwa-icons");
    // favicon.png は全ページ（手書きのページも含む）が apple-touch-icon にも使っているので、角丸なしの四角にする
    renderer.render(iconSvg(MARK_SMALL, 0), path.join(out, "favicon.png"), 180);
    renderer.render(iconSvg(MARK, 0), path.join(iconDir, "apple-touch-icon.png"), 180);
    renderer.render(iconSvg(MARK, 112), path.join(iconDir, "icon-192.png"), 192);
    renderer.render(iconSvg(MARK, 112), path.join(iconDir, "icon-512.png"), 512);
    renderer.render(iconSvg(MARK, 0), path.join(iconDir, "icon-maskable-512.png"), 512);
    renderer.finish();

    const manifest = {
        name: "Setting Analyzer Pro｜天井期待値・設定推測",
        short_name: "天井期待値",
        description: "スマスロ・パチスロの天井期待値と設定推測をホールで計算するツール",
        lang: "ja",
        start_url: "/",
        scope: "/",
        display: "standalone",
        background_color: THEME,
        theme_color: THEME,
        icons: [
            { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
            { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
            { src: "/icons/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
        ],
    };
    fs.writeFileSync(path.join(out, "manifest.webmanifest"), JSON.stringify(manifest, null, 2), "utf8");

    // バージョン = 最初に保存するファイルの中身のハッシュ
    const hash = crypto.createHash("sha1");
    for (const url of PRECACHE) {
        const file = url === "/" ? "index.html" : url.slice(1);
        hash.update(fs.readFileSync(path.join(out, file)));
    }
    const version = hash.digest("hex").slice(0, 12);
    // 置き換えは代入の行で行う（sw.js 冒頭のコメントにも同じ文字列があるため）
    let sw = fs.readFileSync(path.join(root, "sw.js"), "utf8");
    for (const [from, to] of [
        ['const VERSION = "__VERSION__";', `const VERSION = "${version}";`],
        ["const PRECACHE = __PRECACHE__;", `const PRECACHE = ${JSON.stringify(PRECACHE)};`],
    ]) {
        if (!sw.includes(from)) throw new Error(`sw.js に「${from}」がありません`);
        sw = sw.replace(from, to);
    }
    fs.writeFileSync(path.join(out, "sw.js"), sw, "utf8");
    console.log(`Created: manifest.webmanifest・icons/・sw.js（version ${version}）`);
}

module.exports = { buildPwa };
