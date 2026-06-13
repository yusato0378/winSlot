/**
 * 機種別ランディングページ生成
 * 出力: {out}/machines/{id}/index.html, {out}/setGuessElement/index.html, {out}/sitemap.xml
 */
const fs = require("fs");
const path = require("path");

const { loadMachines } = require("./machines");
const SITE_URL = "https://www.pachislot-setting.com";

// data/machines/ から読み込んだデータを格納（buildLandingPages 開始時にセット）
let MACHINES, GUESS_ELEMENT_PAGES, CAUTIONS_BY_ID;

function escapeHtml(str) {
    if (str == null) return "";
    return String(str)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;");
}


/**
 * 主要機種だけ「注意点（運用/入力/モデル外）」を追加して差別化する。
 * - 量産ページでも、検索意図に対して「判断ミスしやすい所」を短く提示するのが狙い
 * - 文言は“断定”せず「店舗運用差」「モデル外」前提で書く
 */

function buildCautionSection(machine) {
    const items = CAUTIONS_BY_ID[machine.id];
    if (!items || items.length === 0) return "";
    const lis = items
        .slice(0, 3)
        .map((t) => `                    <li>${escapeHtml(t)}</li>`)
        .join("\n");
    return `
            <section class="card lp-section" id="cautions">
                <h2 class="card-title"><span class="card-icon">&#9888;</span> 注意点（先に確認）</h2>
                <ul class="lp-caution-list">
${lis}
                </ul>
                <p class="lp-note">※ 本ページの数値・文章は参考情報です。店舗運用・個体差・遊技ルールに従ってご利用ください。</p>
            </section>`;
}



function calculateCeilingEV(machine, currentGames, overrideCeiling) {
    const ceiling = overrideCeiling || machine.ceiling;
    if (!ceiling || currentGames >= ceiling) return null;
    const s1key = Object.keys(machine.settings).map(Number).sort((a, b) => a - b)[0];
    const s1 = machine.settings[s1key];
    const pBonus = 1 / s1.big;
    const remaining = ceiling - currentGames;
    const costPerGame = machine.normalCostPerGame;
    let ev = 0;
    for (let g = 1; g <= remaining; g++) {
        const pFirstAt = Math.pow(1 - pBonus, g - 1) * pBonus;
        ev += pFirstAt * (machine.avgBonusReward - g * costPerGame);
    }
    const pReachCeiling = Math.pow(1 - pBonus, remaining);
    ev += pReachCeiling * (machine.ceilingReward - remaining * costPerGame);
    return { evMedals: ev, evYen: ev * 20, pReachCeiling: pReachCeiling * 100 };
}

function buildEvTable(machine, overrideCeiling, overrideTarget) {
    const ceiling = overrideCeiling || machine.ceiling;
    const target = overrideTarget || machine.ceilingTarget;
    if (!ceiling) return "";
    const step = 100;
    const rows = [];
    for (let g = 0; g <= ceiling; g += step) {
        const evData = calculateCeilingEV(machine, g, overrideCeiling);
        if (!evData) continue;
        const yen = Math.round(evData.evYen);
        const sign = yen >= 0 ? "+" : "";
        const isTarget = g >= target;
        const cls = yen >= 0 ? "positive" : "negative";
        const judgment = isTarget ? "&#9711;" : g >= target - 100 ? "&#9651;" : "&#10005;";
        rows.push(`                            <tr class="${cls}"><td>${g}G</td><td class="${cls}">${sign}${yen.toLocaleString()}円</td><td>${evData.pReachCeiling.toFixed(1)}%</td><td>${judgment}</td></tr>`);
    }
    return rows.join("\n");
}

function buildSpecTable(machine) {
    const settingKeys = Object.keys(machine.settings).map(Number).sort((a, b) => a - b);
    const hasReg = machine.regLabel && settingKeys.some(s => machine.settings[s].reg !== null);
    const hasKoyaku = machine.koyakuName && settingKeys.some(s => machine.settings[s].koyaku !== null);

    let thead = `<tr><th>設定</th><th>${machine.bigLabel}</th>`;
    if (hasReg) thead += `<th>${machine.regLabel}</th>`;
    if (hasReg) thead += `<th>合算</th>`;
    if (hasKoyaku) thead += `<th>${machine.koyakuName}</th>`;
    thead += `<th>出玉率</th></tr>`;

    const rows = settingKeys.map(s => {
        const d = machine.settings[s];
        let row = `                            <tr><td class="ge-setting s${s}">設定${s}</td><td>1/${Number(d.big).toFixed(1)}</td>`;
        if (hasReg) {
            const regVal = d.reg !== null ? `1/${Number(d.reg).toFixed(1)}` : "-";
            row += `<td>${regVal}</td>`;
            if (d.reg !== null) {
                const combined = 1 / (1 / d.big + 1 / d.reg);
                row += `<td>1/${combined.toFixed(1)}</td>`;
            } else {
                row += `<td>-</td>`;
            }
        }
        if (hasKoyaku) {
            row += `<td>${d.koyaku !== null ? `1/${Number(d.koyaku).toFixed(2)}` : "-"}</td>`;
        }
        row += `<td>${d.payout}%</td></tr>`;
        return "                            " + row;
    });

    return { thead, tbody: rows.join("\n") };
}

/** 機種LPは `/machines/{id}/` のみ。タイトル・description は設定差＋天井の1ページ構成を示す。 */
function getMachinePageMeta(machine) {
    const isAT = machine.type === "AT";
    const hasCeiling = machine.ceiling !== null && machine.ceiling > 0;
    const typeLabel = isAT ? "AT/ART機（スマスロ）" : "Aタイプ";
    const regFrag = machine.regLabel ? `・${machine.regLabel}確率` : "";
    const titleKeyword = isAT
        ? `${machine.name} 設定推測・設定差と天井期待値`
        : `${machine.name} 設定判別・設定差とスペック`;
    let descKeywords;
    if (isAT) {
        descKeywords = hasCeiling
            ? `${machine.name}の設定差・設定推測（${machine.bigLabel}確率・出玉率）と天井期待値をこのページで確認。天井${machine.ceiling}G、狙い目${machine.ceilingTarget}G〜。ゲーム数別の期待値一覧とトップの計算ツールへの導線。`
            : `${machine.name}の設定差・設定推測（${machine.bigLabel}確率${regFrag}・出玉率）を掲載。天井は非搭載または解析中のため期待値表はありません。`;
    } else {
        descKeywords = `${machine.name}の設定判別用スペック（${machine.bigLabel}・${machine.regLabel}${machine.koyakuName ? `・${machine.koyakuName}` : ""}・合算・出玉率）と設定推測ツールへの導線を掲載。`;
    }
    return { titleKeyword, descKeywords, typeLabel };
}

function getMachinePagePaths(machine) {
    const urlPath = `/machines/${machine.id}/`;
    const url = `${SITE_URL}${urlPath}`;
    const basePrefix = "../../";
    const topHref = `${basePrefix}index.html`;
    const faviconHref = `${basePrefix}favicon.png`;
    const styleHref = `${basePrefix}style.css`;
    const lpCssHref = `${basePrefix}machines/landing-page.css`;
    return { urlPath, url, basePrefix, topHref, faviconHref, styleHref, lpCssHref };
}

function generatePage(machine) {
    const isAT = machine.type === "AT";
    const hasCeiling = machine.ceiling !== null && machine.ceiling > 0;

    const meta = getMachinePageMeta(machine);
    const paths = getMachinePagePaths(machine);
    const titleKeyword = meta.titleKeyword;
    const pageTitle = `${titleKeyword} | Setting Analyzer Pro`;
    const descKeywords = meta.descKeywords;

    const spec = buildSpecTable(machine);
    const evTableRows = buildEvTable(machine);
    const resetEvTableRows = machine.resetCeiling ? buildEvTable(machine, machine.resetCeiling, machine.resetCeilingTarget) : "";
    const guessElementPath = GUESS_ELEMENT_PAGES[machine.id];
    const hasCaution = CAUTIONS_BY_ID[machine.id] && CAUTIONS_BY_ID[machine.id].length > 0;

    const settingKeys = Object.keys(machine.settings).map(Number).sort((a, b) => a - b);
    const s1key = settingKeys[0];
    const s6key = settingKeys[settingKeys.length - 1];

    const faqItems = [];
    if (hasCeiling) {
        faqItems.push({
            q: `${machine.name}の天井は何ゲーム？`,
            a: `${machine.name}の天井は${machine.ceiling}Gです。狙い目は${machine.ceilingTarget}G〜が目安です。`
        });
    }
    faqItems.push({
        q: `${machine.name}の設定${s6key}の${machine.bigLabel}確率は？`,
        a: `設定${s6key}の${machine.bigLabel}確率は1/${Number(machine.settings[s6key].big).toFixed(1)}です。出玉率は${machine.settings[s6key].payout}%です。`
    });

    const faqJsonLd = JSON.stringify({
        "@context": "https://schema.org",
        "@type": "FAQPage",
        "mainEntity": faqItems.map(f => ({
            "@type": "Question",
            "name": f.q,
            "acceptedAnswer": { "@type": "Answer", "text": f.a }
        }))
    }, null, 8);

    const breadcrumbJsonLd = JSON.stringify({
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        "itemListElement": [
            { "@type": "ListItem", "position": 1, "name": "トップ", "item": `${SITE_URL}/` },
            { "@type": "ListItem", "position": 2, "name": machine.name, "item": `${SITE_URL}/machines/${machine.id}/` }
        ]
    }, null, 8);

    const ceilingSection = hasCeiling ? `
            <section class="card lp-section" id="lp-ceiling">
                <h3 class="card-title"><span class="card-icon">&#127919;</span> 期待値一覧（ゲーム数別）</h3>
                <p class="lp-desc">設定1基準・等価（1メダル=20円）換算の一覧です。狙い目は<strong>${machine.ceilingTarget}G〜</strong>が目安です。</p>
                <div class="lp-ceiling-info">
                    <div class="lp-ceiling-item"><span class="lp-ceil-label">天井</span><span class="lp-ceil-val">${machine.ceiling}G</span></div>
                    <div class="lp-ceiling-item"><span class="lp-ceil-label">狙い目</span><span class="lp-ceil-val">${machine.ceilingTarget}G〜</span></div>
                    <div class="lp-ceiling-item"><span class="lp-ceil-label">天井恩恵</span><span class="lp-ceil-val">約${machine.ceilingReward}枚</span></div>
                </div>
                <div class="table-wrapper">
                    <table class="spec-table lp-ev-table">
                        <thead>
                            <tr><th>現在G数</th><th>期待値</th><th>天井到達率</th><th>判定</th></tr>
                        </thead>
                        <tbody>
${evTableRows}
                        </tbody>
                    </table>
                </div>
                <p class="lp-note">※ 期待値は設定${s1key}を基準に、通常時の消費メダルと天井恩恵から算出した概算値です。実際の期待値はモード状態や前兆等により変動します。</p>
            </section>` : "";

    const resetCeilingSection = hasCeiling && machine.resetCeiling ? `
            <section class="card lp-section" id="reset-ceiling-ev">
                <h3 class="card-title"><span class="card-icon">&#127919;</span> 朝一リセット時の期待値一覧</h3>
                <p class="lp-desc">朝一リセット時の天井は<strong>${machine.resetCeiling}G</strong>に短縮されます。狙い目は<strong>${machine.resetCeilingTarget}G〜</strong>が目安です。</p>
                <div class="lp-ceiling-info">
                    <div class="lp-ceiling-item"><span class="lp-ceil-label">リセット天井</span><span class="lp-ceil-val">${machine.resetCeiling}G</span></div>
                    <div class="lp-ceiling-item"><span class="lp-ceil-label">狙い目</span><span class="lp-ceil-val">${machine.resetCeilingTarget}G〜</span></div>
                </div>
                <div class="table-wrapper">
                    <table class="spec-table lp-ev-table">
                        <thead>
                            <tr><th>現在G数</th><th>期待値</th><th>天井到達率</th><th>判定</th></tr>
                        </thead>
                        <tbody>
${resetEvTableRows}
                        </tbody>
                    </table>
                </div>
                <p class="lp-note">※ 朝一リセット時の天井${machine.resetCeiling}Gを基準に算出した概算値です。</p>
            </section>` : "";

    const guessElementHref = guessElementPath ? `${paths.basePrefix}${guessElementPath}` : "";
    const guessElementLink = guessElementPath
        ? `
            <section class="card lp-section" id="guess-element">
                <h3 class="card-title"><span class="card-icon">&#128270;</span> 設定推測要素</h3>
                <p class="lp-desc">${machine.bigLabel}確率以外の設定推測要素（終了画面、子役確率など）を確認できます。</p>
                <div class="lp-cta">
                    <a href="${guessElementHref}" class="btn-primary lp-btn">設定推測要素の詳細を見る</a>
                </div>
            </section>` : "";

    const tocItems = [];
    if (hasCaution) tocItems.push(`<li><a href="#cautions">注意点（先に確認）</a></li>`);
    tocItems.push(`<li><a href="#lp-setting">設定推測・設定差</a></li>`);
    tocItems.push(`<li><a href="#spec">設定別スペック一覧</a></li>`);
    if (guessElementPath) tocItems.push(`<li><a href="#guess-element">設定推測要素</a></li>`);
    if (hasCeiling) tocItems.push(`<li><a href="#lp-ceiling">期待値一覧（表）</a></li>`);
    if (hasCeiling && machine.resetCeiling) tocItems.push(`<li><a href="#reset-ceiling-ev">朝一リセット時の期待値</a></li>`);
    tocItems.push(`<li><a href="#tool">設定推測ツールで計算</a></li>`);

    const cautionSection = buildCautionSection(machine);

    const pillarSettingIntro = `
            <div class="card lp-section lp-pillar-head">
                <h2 class="card-title" id="lp-setting"><span class="card-icon">&#127922;</span> 設定推測・設定差</h2>
                <p class="lp-desc">${escapeHtml(machine.name)}の設定別スペックと、該当機種のみ設定推測要素への導線をまとめています。</p>
            </div>`;

    const ceilingPillarInner = hasCeiling ? `${ceilingSection}
${resetCeilingSection}` : "";
    const ceilingPillarHtml = ceilingPillarInner.trim()
        ? `            <div class="lp-pillar" aria-label="期待値の表">
${ceilingPillarInner}
            </div>`
        : "";

    const lpCeilingAnchorNoTable = !hasCeiling
        ? `            <div id="lp-ceiling" class="lp-scroll-anchor" aria-hidden="true"></div>
`
        : "";

    const guideHowToHref = `${paths.basePrefix}guide/how-to-use.html`;

    const html = `<!DOCTYPE html>
<html lang="ja">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <link rel="icon" type="image/png" sizes="32x32" href="${paths.faviconHref}">
    <link rel="apple-touch-icon" href="${paths.faviconHref}">
    <meta name="google-site-verification" content="notZvvy3fn5NBCAcfut0i4SBJp3iOduLrxj6DJH0j0E" />
    <meta name="description" content="${escapeHtml(descKeywords)}">
    <meta property="og:title" content="${escapeHtml(pageTitle)}">
    <meta property="og:description" content="${escapeHtml(descKeywords)}">
    <meta property="og:type" content="article">
    <meta property="og:url" content="${paths.url}">
    <meta property="og:locale" content="ja_JP">
    <meta property="og:image" content="${SITE_URL}/og-default.png">
    <meta property="og:image:width" content="1200">
    <meta property="og:image:height" content="630">
    <meta property="og:image:alt" content="パチスロ設定推測・天井期待値ツール Setting Analyzer Pro">
    <meta name="twitter:card" content="summary_large_image">
    <meta name="twitter:title" content="${escapeHtml(pageTitle)}">
    <meta name="twitter:description" content="${escapeHtml(descKeywords)}">
    <meta name="twitter:image" content="${SITE_URL}/og-default.png">
    <link rel="canonical" href="${paths.url}">
    <title>${escapeHtml(pageTitle)}</title>
    <link rel="stylesheet" href="${paths.styleHref}">
    <link rel="stylesheet" href="${paths.lpCssHref}">
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Noto+Sans+JP:wght@400;500;700;900&display=swap" rel="stylesheet">
    <script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-9806077794369384"
         crossorigin="anonymous"></script>
    <script type="application/ld+json">
${faqJsonLd}
    </script>
    <script type="application/ld+json">
${breadcrumbJsonLd}
    </script>
</head>
<body>
    <div class="app-container lp-container">
        <header class="app-header">
            <div class="header-inner">
                <p class="app-subtitle"><a href="${paths.topHref}" class="back-link">&larr; トップに戻る</a></p>
                <h1 class="app-title">${escapeHtml(machine.name)}</h1>
                <p class="app-subtitle">${escapeHtml(titleKeyword)}</p>
            </div>
        </header>

        <main class="main-content">

            <nav class="lp-breadcrumb" aria-label="パンくずリスト">
                <ol>
                    <li><a href="${paths.topHref}">トップ</a></li>
                    <li>${escapeHtml(machine.name)}</li>
                </ol>
            </nav>
${cautionSection}
            <nav class="card lp-section">
                <h2 class="card-title"><span class="card-icon">&#128204;</span> 目次</h2>
                <ul class="lp-toc">
                    ${tocItems.join("\n                    ")}
                </ul>
            </nav>

            <div class="lp-pillar" aria-label="設定推測・設定差">
${pillarSettingIntro}
            <section class="card lp-section" id="spec">
                <h3 class="card-title"><span class="card-icon">&#128203;</span> 設定別スペック一覧</h3>
                <p class="lp-desc">${escapeHtml(machine.name)}（${escapeHtml(meta.typeLabel)}）の設定別スペック表です。${escapeHtml(machine.bigLabel)}確率と出玉率に注目して設定判別に活用してください。</p>
                <div class="table-wrapper">
                    <table class="spec-table lp-spec-table">
                        <thead>
                            ${spec.thead}
                        </thead>
                        <tbody>
${spec.tbody}
                        </tbody>
                    </table>
                </div>
            </section>
${guessElementLink}
            </div>

${ceilingPillarHtml}
${lpCeilingAnchorNoTable}            <section class="card lp-section" id="tool">
                <h2 class="card-title"><span class="card-icon">&#9889;</span> 設定推測ツールで計算する</h2>
                <p class="lp-desc">${escapeHtml(machine.name)}のデータを入力して、設定推測と期待値を自動計算できます。</p>
                <div class="lp-cta">
                    <a href="${paths.topHref}" class="btn-primary lp-btn">設定推測ツールを開く</a>
                </div>
                <p class="lp-desc lp-tool-extra"><a href="${guideHowToHref}">使い方ガイド（初心者向け）</a></p>
            </section>

            <div class="lp-back-bottom">
                <a href="${paths.topHref}" class="btn-primary lp-back-btn">
                    <span class="btn-icon">&#9664;</span>
                    トップに戻る
                </a>
            </div>

        </main>

        <footer class="app-footer">
            <div class="footer-links">
                <a href="${paths.basePrefix}privacy.html">プライバシーポリシー</a>
                <a href="${paths.basePrefix}terms.html">利用規約</a>
                <a href="${paths.basePrefix}contact.html">お問い合わせ</a>
                <a href="${paths.basePrefix}about.html">アプリについて</a>
            </div>
            <p>&copy; Setting Analyzer Pro</p>
        </footer>
    </div>
</body>
</html>`;

    return html;
}

// ============================================================
// 生成実行
// ============================================================
/**
 * @param {string} root リポジトリルート（ソース読み込み元）
 * @param {string} out  出力ルート（dist）
 */
function buildLandingPages(root, out, data) {
({ MACHINES, GUESS_ELEMENT_PAGES, CAUTIONS_BY_ID } = data || loadMachines(root));
const machinesDir = path.join(out, "machines");
if (!fs.existsSync(machinesDir)) fs.mkdirSync(machinesDir, { recursive: true });

const sitemapUrls = [`  <url>\n    <loc>${SITE_URL}/</loc>\n    <priority>1.0</priority>\n  </url>`];

MACHINES.forEach(m => {
    const dir = path.join(machinesDir, m.id);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

    const html = generatePage(m);
    fs.writeFileSync(path.join(dir, "index.html"), html, "utf-8");
    console.log(`Created: machines/${m.id}/index.html`);

    sitemapUrls.push(`  <url>\n    <loc>${SITE_URL}/machines/${m.id}/</loc>\n    <lastmod>${new Date().toISOString().slice(0,10)}</lastmod>\n    <changefreq>monthly</changefreq>\n    <priority>0.8</priority>\n  </url>`);
});

// setGuessElement/index.html（一覧ページ）生成
const machineNameMap = Object.fromEntries(MACHINES.map(m => [m.id, m.name]));
const sgListItems = Object.entries(GUESS_ELEMENT_PAGES)
    .map(([id, rel]) => {
        const dirName = path.basename(path.dirname(rel));
        const name = machineNameMap[id] || id;
        return `                    <li class="guide-article-list-item"><a href="${dirName}/">${name} 設定推測要素</a></li>`;
    })
    .join("\n");

const sgIndexHtml = `<!DOCTYPE html>
<html lang="ja">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <link rel="icon" type="image/png" sizes="32x32" href="../favicon.png">
    <link rel="apple-touch-icon" href="../favicon.png">
    <meta name="google-site-verification" content="notZvvy3fn5NBCAcfut0i4SBJp3iOduLrxj6DJH0j0E" />
    <meta name="description" content="パチスロ各機種の設定推測要素（終了画面・示唆演出・子役傾向など）一覧。${Object.keys(GUESS_ELEMENT_PAGES).length}機種対応。Setting Analyzer Pro。">
    <link rel="canonical" href="${SITE_URL}/setGuessElement/">
    <title>設定推測要素一覧（全機種） | Setting Analyzer Pro</title>
    <link rel="stylesheet" href="../style.css">
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Noto+Sans+JP:wght@400;500;700;900&display=swap" rel="stylesheet">
    <script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-9806077794369384"
         crossorigin="anonymous"></script>
</head>
<body>
    <div class="app-container">
        <header class="app-header">
            <div class="header-inner">
                <p class="app-subtitle"><a href="../index.html" class="back-link">&larr; トップに戻る</a></p>
            </div>
        </header>
        <main class="main-content">
            <section class="card page-card">
                <h1 class="page-title">設定推測要素一覧（全機種）</h1>
                <div class="page-body">
                    <p>各機種の設定推測要素（終了画面・示唆演出・子役傾向など）をまとめています。機種名をタップして確認してください。</p>
                    <ul class="guide-article-list">
${sgListItems}
                    </ul>
                </div>
            </section>
        </main>
        <footer class="app-footer">
            <div class="footer-links">
                <a href="../index.html#machine-list">対応機種一覧</a>
                <a href="../privacy.html">プライバシーポリシー</a>
                <a href="../terms.html">利用規約</a>
                <a href="../contact.html">お問い合わせ</a>
                <a href="../about.html">アプリについて</a>
            </div>
            <p>※ 本ツールの推測結果はあくまで参考値です。実際の設定を保証するものではありません。</p>
        </footer>
    </div>
</body>
</html>`;

const sgIndexPath = path.join(out, "setGuessElement", "index.html");
fs.writeFileSync(sgIndexPath, sgIndexHtml, "utf-8");
console.log("Created: setGuessElement/index.html");

// setGuessElement pages（サイトマップ：ルート一覧ページ + 各機種ページ）
const today = new Date().toISOString().slice(0, 10);
sitemapUrls.push(`  <url>\n    <loc>${SITE_URL}/setGuessElement/</loc>\n    <lastmod>${today}</lastmod>\n    <priority>0.7</priority>\n  </url>`);
Object.values(GUESS_ELEMENT_PAGES).forEach(p => {
    sitemapUrls.push(`  <url>\n    <loc>${SITE_URL}/${p.replace("index.html","")}</loc>\n    <lastmod>${today}</lastmod>\n    <priority>0.6</priority>\n  </url>`);
});

// guide/ 解説記事（manifest.json の published/updated を lastmod に使用）
const guideManifestPath = path.join(root, "articles", "manifest.json");
const guideManifestData = fs.existsSync(guideManifestPath)
    ? JSON.parse(fs.readFileSync(guideManifestPath, "utf8"))
    : [];
const guideManifestBySlug = Object.fromEntries(guideManifestData.map(a => [a.slug, a]));

const guideDir = path.join(out, "guide");
if (fs.existsSync(guideDir)) {
    fs.readdirSync(guideDir)
        .filter((f) => f.endsWith(".html"))
        .sort()
        .forEach((f) => {
            const slug = f.replace(/\.html$/, "");
            const article = guideManifestBySlug[slug];
            const lastmod = article ? (article.updated || article.published || today) : today;
            const loc = f === "index.html" ? `${SITE_URL}/guide/` : `${SITE_URL}/guide/${f}`;
            sitemapUrls.push(`  <url>\n    <loc>${loc}</loc>\n    <lastmod>${lastmod}</lastmod>\n    <changefreq>monthly</changefreq>\n    <priority>0.7</priority>\n  </url>`);
        });
}

// Static pages
["privacy.html", "terms.html", "contact.html", "about.html"].forEach(p => {
    sitemapUrls.push(`  <url>\n    <loc>${SITE_URL}/${p}</loc>\n    <priority>0.3</priority>\n  </url>`);
});

const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${sitemapUrls.join("\n")}
</urlset>`;

fs.writeFileSync(path.join(out, "sitemap.xml"), sitemap, "utf-8");
console.log("\nUpdated: sitemap.xml");
console.log(`Total: ${MACHINES.length} machine pages created`);
}

module.exports = { buildLandingPages };
