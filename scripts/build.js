/**
 * サイト全体ビルド
 * 実行: node scripts/build.js（Vercel の buildCommand からも実行される）
 *
 * 1. dist/ をクリアして静的ファイルをコピー（許可リスト方式。plan.md や reports/ 等は配信しない）
 * 2. 機種データ（data/machines/*.json）から dist/machines-data.js を生成（ブラウザ app.js 用）
 * 3. 解説記事を dist/guide/ に生成
 * 4. 機種LP・setGuessElement/index.html・sitemap.xml を dist/ に生成
 * 5. setGuessElement 各ページ（dist 上のコピー）に SEO パッチを適用
 */
const fs = require("fs");
const path = require("path");

const { loadMachines } = require("./build/machines");
const { buildArticles } = require("./build/articles");
const { buildLandingPages } = require("./build/landing-pages");
const { patchSetGuessPages } = require("./build/setguess-seo");

const ROOT = path.join(__dirname, "..");
const OUT = path.join(ROOT, "dist");

/** 配信対象の静的ファイル（リポジトリルートからの相対パス） */
const STATIC_FILES = [
    "index.html",
    "app.js",
    "style.css",
    "404.html",
    "about.html",
    "contact.html",
    "contact-thankyou.html",
    "privacy.html",
    "terms.html",
    "ads.txt",
    "robots.txt",
    "favicon.png",
    "og-default.png",
    "data/access-ranking.json",
    "machines/landing-page.css",
];

function copyStatic() {
    for (const rel of STATIC_FILES) {
        const src = path.join(ROOT, rel);
        const dest = path.join(OUT, rel);
        if (!fs.existsSync(src)) {
            throw new Error(`Static file not found: ${rel}`);
        }
        fs.mkdirSync(path.dirname(dest), { recursive: true });
        fs.copyFileSync(src, dest);
    }
    console.log(`Copied: ${STATIC_FILES.length} static file(s)`);

    // setGuessElement はディレクトリごとコピー（index.html はビルドで生成するため除外）
    fs.cpSync(path.join(ROOT, "setGuessElement"), path.join(OUT, "setGuessElement"), {
        recursive: true,
        filter: (src) => path.relative(ROOT, src) !== path.join("setGuessElement", "index.html"),
    });
    console.log("Copied: setGuessElement/");
}

/** ブラウザ app.js 用に window.MACHINES を定義する machines-data.js を生成 */
function writeMachinesData(machines) {
    const banner = "/* 自動生成（scripts/build.js）。編集しないこと。正本は data/machines/*.json */\n";
    const body = `window.MACHINES = ${JSON.stringify(machines)};\n`;
    fs.writeFileSync(path.join(OUT, "machines-data.js"), banner + body, "utf8");
    console.log(`Created: machines-data.js (${machines.length} machines)`);
}

function main() {
    fs.rmSync(OUT, { recursive: true, force: true });
    fs.mkdirSync(OUT, { recursive: true });

    const data = loadMachines(ROOT);

    copyStatic();
    writeMachinesData(data.MACHINES);
    buildArticles(ROOT, OUT);
    buildLandingPages(ROOT, OUT, data);
    patchSetGuessPages(OUT, data);

    console.log("\nBuild complete: dist/");
}

main();
