/**
 * 記事ビルドスクリプト（パターンB: レイアウト1本 + 本文だけ別ファイル）
 * 実行: node build-articles.js
 *
 * - templates/article-layout.html をレイアウトとして使用（{{ARTICLE_HEAD_EXTRA}}=JSON-LD、本文は h1 直下に著者・公開日を注入）
 * - articles/manifest.json に記事一覧（slug, title, description, author, published, updated 任意）
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
/** 構造化データ・canonical 用（index.html の canonical と揃える） */
const SITE_URL = "https://pachislot-setting.com";

function escapeHtml(str) {
  if (str == null) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/** タイトル直下：著者・公開日（manifest の author / published） */
function buildArticleMetaLead(article) {
  const author = escapeHtml(article.author || "slotterY");
  const parts = [`<span class="article-meta-item"><strong>著者</strong>：${author}</span>`];
  if (article.published) {
    const d = escapeHtml(article.published);
    parts.push(
      `<span class="article-meta-item"><strong>公開日</strong>：<time datetime="${d}">${d}</time></span>`
    );
  }
  return `<div class="article-meta-lead" aria-label="記事情報">${parts.join(
    '<span class="article-meta-sep" aria-hidden="true"> · </span>'
  )}</div>`;
}

function injectMetaAfterFirstH1(html, metaLeadHtml) {
  const idx = html.toLowerCase().indexOf("</h1>");
  if (idx === -1) return metaLeadHtml + html;
  const end = idx + 5;
  return `${html.slice(0, end)}\n    ${metaLeadHtml}${html.slice(end)}`;
}

/** Article JSON-LD（検索エンジン向け） */
function buildArticleJsonLd(article) {
  const author = article.author || "slotterY";
  const url = `${SITE_URL}/guide/${encodeURIComponent(article.slug)}.html`;
  const data = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: article.title,
    description: article.description || "",
    url,
    author: { "@type": "Person", name: author },
    publisher: {
      "@type": "Organization",
      name: "Setting Analyzer Pro",
      url: SITE_URL,
    },
  };
  if (article.published) {
    data.datePublished = article.published;
    data.dateModified = article.updated || article.published;
  }
  const json = JSON.stringify(data).replace(/</g, "\\u003c");
  return `    <script type="application/ld+json">${json}</script>`;
}

/** 本文末：最終更新のみ（著者・公開日は見出し下に表示） */
function buildArticleFooter(article) {
  if (!article.updated) return "";
  const u = escapeHtml(article.updated);
  return `
            <aside class="article-footer-meta card" aria-label="更新情報">
                <p class="article-updated">最終更新：<time datetime="${u}">${u}</time></p>
            </aside>`;
}

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

    let content = fs.readFileSync(bodyPath, "utf8");
    content = injectMetaAfterFirstH1(content, buildArticleMetaLead(article));
    const articleFooter = buildArticleFooter(article);
    const headExtra = buildArticleJsonLd(article);
    let html = layout
      .replace(/\{\{TITLE\}\}/g, title)
      .replace(/\{\{DESCRIPTION\}\}/g, description)
      .replace(/\{\{CONTENT\}\}/, content)
      .replace(/\{\{ARTICLE_FOOTER\}\}/g, articleFooter)
      .replace(/\{\{ARTICLE_HEAD_EXTRA\}\}/g, headExtra)
      .replace(/\{\{BASE\}\}/g, BASE);

    const outPath = path.join(OUTPUT_DIR, `${slug}.html`);
    fs.writeFileSync(outPath, html, "utf8");
    console.log(`Created: guide/${slug}.html`);
  }

  // 解説記事一覧ページ（guide/index.html）を生成（本文が存在する記事のみ）
  const builtSlugs = new Set(
    manifest.filter((a) => fs.existsSync(path.join(ARTICLES_DIR, `${a.slug}.html`))).map((a) => a.slug)
  );
  const manifestIndex = new Map(manifest.map((a, i) => [a.slug, i]));
  const indexArticles = manifest
    .filter((a) => builtSlugs.has(a.slug))
    .slice()
    .sort((a, b) => {
      const ta = a.published ? Date.parse(a.published + "T12:00:00") : 0;
      const tb = b.published ? Date.parse(b.published + "T12:00:00") : 0;
      if (tb !== ta) return tb - ta;
      return manifestIndex.get(a.slug) - manifestIndex.get(b.slug);
    });
  const indexListItems = indexArticles
    .map((a) => {
      const author = escapeHtml(a.author || "slotterY");
      const pub = a.published ? escapeHtml(a.published) : "";
      const meta = pub
        ? `<span class="guide-article-list-meta">${author} · 公開 ${pub}</span>`
        : `<span class="guide-article-list-meta">${author}</span>`;
      return `                    <li class="guide-article-list-item"><a href="${a.slug}.html">${a.title}</a>${meta}</li>`;
    })
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
    .replace(/\{\{ARTICLE_FOOTER\}\}/g, "")
    .replace(/\{\{ARTICLE_HEAD_EXTRA\}\}/g, "")
    .replace(/\{\{BASE\}\}/g, BASE);

  fs.writeFileSync(path.join(OUTPUT_DIR, "index.html"), indexHtml, "utf8");
  console.log("Created: guide/index.html");

  console.log(`Total: ${manifest.length} article(s) built.`);
}

build();
