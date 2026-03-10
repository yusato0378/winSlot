/**
 * 記事ビルドスクリプト（パターンB: レイアウト1本 + 本文だけ別ファイル）
 * 実行: node build-articles.js
 *
 * - templates/article-layout.html をレイアウトとして使用
 * - articles/manifest.json に記事一覧（slug, title, description）
 * - articles/{slug}.html に本文（HTML断片）を配置
 * - 出力: guide/{slug}.html
 */

const fs = require("fs");
const path = require("path");

const DIR = __dirname;
const LAYOUT_PATH = path.join(DIR, "templates", "article-layout.html");
const MANIFEST_PATH = path.join(DIR, "articles", "manifest.json");
const ARTICLES_DIR = path.join(DIR, "articles");
const OUTPUT_DIR = path.join(DIR, "guide");

// guide/ に出力するため、CSS等は相対パス .. になる
const BASE = "..";

function build() {
  const layout = fs.readFileSync(LAYOUT_PATH, "utf8");
  const manifest = JSON.parse(fs.readFileSync(MANIFEST_PATH, "utf8"));

  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  for (const article of manifest) {
    const { slug, title, description } = article;
    const bodyPath = path.join(ARTICLES_DIR, `${slug}.html`);

    if (!fs.existsSync(bodyPath)) {
      console.warn(`Skip (body not found): ${slug}`);
      continue;
    }

    const content = fs.readFileSync(bodyPath, "utf8");
    let html = layout
      .replace(/\{\{TITLE\}\}/g, title)
      .replace(/\{\{DESCRIPTION\}\}/g, description)
      .replace(/\{\{CONTENT\}\}/, content)
      .replace(/\{\{BASE\}\}/g, BASE);

    const outPath = path.join(OUTPUT_DIR, `${slug}.html`);
    fs.writeFileSync(outPath, html, "utf8");
    console.log(`Created: guide/${slug}.html`);
  }

  // 解説記事一覧ページ（guide/index.html）を生成（本文が存在する記事のみ）
  const builtSlugs = new Set(
    manifest.filter((a) => fs.existsSync(path.join(ARTICLES_DIR, `${a.slug}.html`))).map((a) => a.slug)
  );
  const indexListItems = manifest
    .filter((a) => builtSlugs.has(a.slug))
    .map((a) => `                    <li><a href="${a.slug}.html">${a.title}</a></li>`)
    .join("\n");
  const indexContent = `<section class="card page-card">
    <h1 class="page-title">解説・使い方</h1>
    <div class="page-body">
        <p>設定推測や天井期待値の基礎を解説した記事一覧です。ツールの使い方や用語の説明もまとめています。</p>
        <ul class="guide-article-list">
${indexListItems}
        </ul>
    </div>
</section>`;

  const indexHtml = layout
    .replace(/\{\{TITLE\}\}/g, "解説・使い方")
    .replace(/\{\{DESCRIPTION\}\}/g, "設定推測や天井期待値の基礎を解説した記事一覧。ツールの使い方や用語の説明。")
    .replace(/\{\{CONTENT\}\}/, indexContent)
    .replace(/\{\{BASE\}\}/g, BASE);

  fs.writeFileSync(path.join(OUTPUT_DIR, "index.html"), indexHtml, "utf8");
  console.log("Created: guide/index.html");

  console.log(`Total: ${manifest.length} article(s) built.`);
}

build();
