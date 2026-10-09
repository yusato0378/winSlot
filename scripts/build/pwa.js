/**
 * PWA（ホーム画面に追加）用のファイルを dist/ に出す。
 * - manifest.webmanifest
 * - icons/icon-192.png・icon-512.png・icon-maskable-512.png（favicon と同じ白地に青の「ス」）
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
const ICON_BLUE = "#3d8bf2";

/** favicon と同じ意匠。maskable は Android が丸や角丸に切り抜くので、文字を中央80%の安全域に収める */
function iconSvg(size, maskable) {
    const font = Math.round(size * (maskable ? 0.5 : 0.66));
    return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" font-family="Noto Sans JP" font-weight="700">
  <rect width="${size}" height="${size}" fill="#ffffff"/>
  <text x="${size / 2}" y="${size / 2}" font-size="${font}" fill="${ICON_BLUE}" text-anchor="middle" dominant-baseline="central">ス</text>
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
    renderer.render(iconSvg(192, false), path.join(iconDir, "icon-192.png"), 192);
    renderer.render(iconSvg(512, false), path.join(iconDir, "icon-512.png"), 512);
    renderer.render(iconSvg(512, true), path.join(iconDir, "icon-maskable-512.png"), 512);
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
