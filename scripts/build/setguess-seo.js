/**
 * setGuessElement 各ページ（dist 上のコピー）に meta description と機種LPへのリンクを追加
 *
 * 対象ページ一覧と機種名は landing-pages.js の GUESS_ELEMENT_PAGES / MACHINES を参照する
 * （旧 patch-setguess-seo.js の「手動で同期」を廃止）
 */
const fs = require("fs");
const path = require("path");

const { MACHINES, GUESS_ELEMENT_PAGES } = require("./landing-pages");

const SITE_URL = "https://www.pachislot-setting.com";

function escapeAttr(str) {
    return String(str)
        .replace(/&/g, "&amp;")
        .replace(/"/g, "&quot;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;");
}

function escapeHtml(str) {
    return String(str)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;");
}

function buildDescription(machineName) {
    return `${machineName}の設定推測要素（終了画面・示唆演出・子役傾向など）を一覧。当サイトでは設定別スペック表・天井期待値も掲載。Setting Analyzer Pro。`;
}

function buildOgTags(machineName, desc, canonicalUrl) {
    const title = `${escapeAttr(machineName)} 設定推測要素 | Setting Analyzer Pro`;
    const ogImg = `${SITE_URL}/og-default.png`;
    return [
        `    <meta property="og:title" content="${title}">`,
        `    <meta property="og:description" content="${escapeAttr(desc)}">`,
        `    <meta property="og:type" content="article">`,
        `    <meta property="og:url" content="${escapeAttr(canonicalUrl)}">`,
        `    <meta property="og:locale" content="ja_JP">`,
        `    <meta property="og:image" content="${ogImg}">`,
        `    <meta property="og:image:width" content="1200">`,
        `    <meta property="og:image:height" content="630">`,
        `    <meta property="og:image:alt" content="パチスロ設定推測・天井期待値ツール Setting Analyzer Pro">`,
        `    <meta name="twitter:card" content="summary_large_image">`,
        `    <meta name="twitter:title" content="${title}">`,
        `    <meta name="twitter:description" content="${escapeAttr(desc)}">`,
        `    <meta name="twitter:image" content="${ogImg}">`,
    ].join("\n");
}

function buildBreadcrumbJsonLd(machineId, machineName, dirName) {
    const machineUrl = `${SITE_URL}/machines/${machineId}/`;
    const guessUrl = `${SITE_URL}/setGuessElement/${dirName}/`;
    const data = {
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        itemListElement: [
            { "@type": "ListItem", position: 1, name: "トップ", item: `${SITE_URL}/` },
            { "@type": "ListItem", position: 2, name: machineName, item: machineUrl },
            { "@type": "ListItem", position: 3, name: `${machineName} 設定推測要素`, item: guessUrl },
        ],
    };
    return `    <script type="application/ld+json">${JSON.stringify(data).replace(/</g, "\\u003c")}</script>`;
}

function patchHtml(html, machineId, machineName, dirName) {
    const desc = buildDescription(machineName);
    const canonicalUrl = `${SITE_URL}/setGuessElement/${dirName}/`;
    const newTitle = `${escapeHtml(machineName)} 設定推測要素 | Setting Analyzer Pro`;

    let out = html;

    const descLine = `    <meta name="description" content="${escapeAttr(desc)}">`;
    const canonicalLine = `    <link rel="canonical" href="${canonicalUrl}">`;

    // description は「無ければ汎用文を挿入」のみ。既存（手書きの機種固有文を含む）は上書きしない。
    if (!/<meta\s+name="description"\s+content="/i.test(out)) {
        out = out.replace(
            /(<meta\s+name="google-site-verification"[^>]*>)\s*\n/i,
            `$1\n${descLine}\n`
        );
    }

    if (!/<link\s+rel="canonical"/i.test(out)) {
        out = out.replace(
            /(<meta\s+name="description"[^>]*>)\s*\n/i,
            `$1\n${canonicalLine}\n`
        );
    }

    // title を統一フォーマットに更新
    out = out.replace(
        /<title>[^<]*<\/title>/i,
        `<title>${newTitle}</title>`
    );

    // OG タグ追加（未挿入のみ）
    if (!/<meta\s+property="og:title"/i.test(out)) {
        const ogBlock = buildOgTags(machineName, desc, canonicalUrl);
        out = out.replace(
            /(<link\s+rel="canonical"[^>]*>)\s*\n/i,
            `$1\n${ogBlock}\n`
        );
    }

    // BreadcrumbList JSON-LD 追加（未挿入のみ）
    if (!/BreadcrumbList/.test(out)) {
        const breadcrumb = buildBreadcrumbJsonLd(machineId, machineName, dirName);
        out = out.replace(
            /(<\/head>)/i,
            `${breadcrumb}\n$1`
        );
    }

    const lpBlock = `
            <nav class="card ge-section ge-lp-nav" aria-label="機種別スペック・天井">
                <h2 class="card-title"><span class="card-icon">&#128203;</span> スペック・天井期待値</h2>
                <p class="ge-desc">この機種の<strong>設定別スペック一覧</strong>と<strong>天井期待値</strong>（ゲーム数別）は、機種別ページで確認できます。</p>
                <div class="ge-lp-cta">
                    <a href="../../machines/${machineId}/" class="btn-primary ge-back-btn ge-lp-btn">${escapeHtml(machineName)}のスペック・天井を見る</a>
                </div>
            </nav>
`;

    if (/class="[^"]*ge-lp-nav/i.test(out) || /ge-lp-nav/.test(out)) {
        return out;
    }

    const marker = '<div class="ge-back-bottom">';
    if (!out.includes(marker)) {
        console.warn("ge-back-bottom not found, skip LP link:", machineId);
        return out;
    }
    out = out.replace(marker, `${lpBlock}\n            ${marker}`);
    return out;
}

/** 初回パッチでずれた head インデントを是正 */
function normalizeGuessHead(html) {
    let out = html;
    out = out.replace(/\n        <meta name="description"/g, "\n    <meta name=\"description\"");
    out = out.replace(/\n<title>/g, "\n    <title>");
    return out;
}

/**
 * {out}/setGuessElement/ 配下のページに SEO パッチを適用する
 * @param {string} out 出力ルート（dist）
 */
function patchSetGuessPages(out) {
    const names = Object.fromEntries(MACHINES.map((m) => [m.id, m.name]));
    let n = 0;
    for (const [machineId, rel] of Object.entries(GUESS_ELEMENT_PAGES)) {
        const full = path.join(out, rel);
        if (!fs.existsSync(full)) {
            console.error("Missing file:", rel);
            process.exit(1);
        }
        const machineName = names[machineId];
        if (!machineName) {
            console.error("No machine name for id:", machineId);
            process.exit(1);
        }
        const dirName = path.basename(path.dirname(full));
        const raw = fs.readFileSync(full, "utf8");
        const html = normalizeGuessHead(raw);
        const next = patchHtml(html, machineId, machineName, dirName);
        if (next !== raw) {
            fs.writeFileSync(full, next, "utf8");
            console.log("Patched:", rel);
            n++;
        }
    }
    console.log(`setGuessElement: ${Object.keys(GUESS_ELEMENT_PAGES).length} page(s) processed (${n} patched).`);
}

module.exports = { patchSetGuessPages };
