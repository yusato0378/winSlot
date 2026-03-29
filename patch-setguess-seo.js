/**
 * setGuessElement 各ページに meta description と機種LPへのリンクを追加
 * 実行: node patch-setguess-seo.js
 *
 * GUESS_ELEMENT_PAGES は generate-landing-pages.js と同期すること
 */
const fs = require("fs");
const path = require("path");

const GENERATOR = path.join(__dirname, "generate-landing-pages.js");

const GUESS_ELEMENT_PAGES = {
    banchou4: "setGuessElement/oshiBanchou4/index.html",
    discup_ultraremix: "setGuessElement/discupUltraremix/index.html",
    umineko2: "setGuessElement/umineko2/index.html",
    crea_hihouden: "setGuessElement/creaHihouden/index.html",
    eva_bt: "setGuessElement/evaBt/index.html",
    kabaneri: "setGuessElement/kabaneri/index.html",
    hokuto: "setGuessElement/hokuto/index.html",
    karakuri: "setGuessElement/karakuri/index.html",
    valvrave: "setGuessElement/valvrave/index.html",
    monkey_turn_v: "setGuessElement/monkeyTurnV/index.html",
    tokyo_ghoul: "setGuessElement/tokyoGhoul/index.html",
    kaguya_sama: "setGuessElement/kaguyaSama/index.html",
    god_eater: "setGuessElement/godEater/index.html",
    bakemonogatari: "setGuessElement/bakemonogatari/index.html",
    hokuto_tensei2: "setGuessElement/hokutoTensei2/index.html",
    koukaku: "setGuessElement/koukaku/index.html",
    dmc5: "setGuessElement/dmc5/index.html",
    hihouden: "setGuessElement/hihouden/index.html",
    tenken: "setGuessElement/tenken/index.html",
    valvrave2: "setGuessElement/valvrave2/index.html",
    enen: "setGuessElement/enen/index.html",
    tekken6: "setGuessElement/tekken6/index.html",
    prism_nana: "setGuessElement/prismNana/index.html",
    azurlane: "setGuessElement/azurlane/index.html",
    zettai4: "setGuessElement/zettai4/index.html",
    railgun2: "setGuessElement/railgun2/index.html",
    onimusha3: "setGuessElement/onimusha3/index.html",
    zenigata5: "setGuessElement/zenigata5/index.html",
    tokyo_revengers: "setGuessElement/tokyoRevengers/index.html",
    iza_banchou: "setGuessElement/izaBanchou/index.html",
    monhan_rise: "setGuessElement/monhanRise/index.html",
    enen2: "setGuessElement/enen2/index.html",
    magireco: "setGuessElement/magireco/index.html",
    okidoki_duo: "setGuessElement/okidokiDuo/index.html",
    mushoku: "setGuessElement/mushoku/index.html",
    sbj: "setGuessElement/sbj/index.html",
    yoshimune: "setGuessElement/yoshimune/index.html",
    goblin_slayer2: "setGuessElement/goblinSlayer2/index.html",
    otome4: "setGuessElement/otome4/index.html",
    toloveru: "setGuessElement/toloveru/index.html",
    baki: "setGuessElement/baki/index.html",
    biohazard5: "setGuessElement/biohazard5/index.html",
    revuestarlight: "setGuessElement/revuestarlight/index.html",
};

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

function loadMachineNames() {
    const src = fs.readFileSync(GENERATOR, "utf8");
    const names = {};
    const re = /\{\s*id:\s*"([^"]+)",\s*name:\s*"([^"]+)"/g;
    let m;
    while ((m = re.exec(src)) !== null) {
        names[m[1]] = m[2];
    }
    return names;
}

function buildDescription(machineName) {
    return `${machineName}の設定推測要素（終了画面・示唆演出・子役傾向など）を一覧。当サイトでは設定別スペック表・天井期待値も掲載。Setting Analyzer Pro。`;
}

function patchHtml(html, machineId, machineName) {
    const desc = buildDescription(machineName);

    let out = html;

    const descLine = `    <meta name="description" content="${escapeAttr(desc)}">`;

    if (/<meta\s+name="description"\s+content="/i.test(out)) {
        out = out.replace(
            /[ \t]*<meta\s+name="description"\s+content="[^"]*"\s*>/i,
            descLine
        );
    } else {
        out = out.replace(
            /(<meta\s+name="google-site-verification"[^>]*>)\s*\n/i,
            `$1\n${descLine}\n`
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

function main() {
    const names = loadMachineNames();
    let n = 0;
    for (const [machineId, rel] of Object.entries(GUESS_ELEMENT_PAGES)) {
        const full = path.join(__dirname, rel);
        if (!fs.existsSync(full)) {
            console.error("Missing file:", rel);
            process.exit(1);
        }
        const machineName = names[machineId];
        if (!machineName) {
            console.error("No machine name for id:", machineId);
            process.exit(1);
        }
        const raw = fs.readFileSync(full, "utf8");
        const html = normalizeGuessHead(raw);
        const next = patchHtml(html, machineId, machineName);
        if (next !== raw) {
            fs.writeFileSync(full, next, "utf8");
            console.log("Patched:", rel);
            n++;
        } else {
            console.log("Unchanged:", rel);
        }
    }
    console.log(`Done. ${Object.keys(GUESS_ELEMENT_PAGES).length} page(s) processed (${n} written).`);
}

main();
