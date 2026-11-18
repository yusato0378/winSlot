/**
 * 設定推測要素の原稿（setGuessElement/{dir}/index.html）から、機種ページに差し込む節を取り出す。
 * 原稿は毎朝のルーチンが書き足すので編集元として残し、公開は機種ページ（/machines/{id}/）に一本化する。
 * 旧URL（/setGuessElement/{dir}/）には機種ページへ転送するだけのページを置く。
 */
const fs = require("fs");
const path = require("path");

const SITE_URL = "https://www.pachislot-setting.com";

// 天井の節は、機種ページの天井期待値表と同じ並びに置く
const CEILING_IDS = new Set(["tenjou", "ceiling"]);
// 機種ページの「設定別スペック一覧」と表が重なる節。表は外し、説明文と注記だけをスペック一覧の下に付ける
const SPEC_IDS = new Set(["spec", "hatsuatari"]);

const TABLE_WRAPPER = /\s*<div class="table-wrapper">[\s\S]*?<\/div>/;

function escapeHtml(str) {
    return String(str)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;");
}

/** 見出しの文字だけ（アイコンの実体参照とタグを外す） */
function headingText(inner) {
    const m = inner.match(/<h2[^>]*>([\s\S]*?)<\/h2>/);
    return m ? m[1].replace(/<[^>]+>/g, "").replace(/&#\d+;/g, "").trim() : "";
}

/**
 * スペック系の節から、表を外した残り（説明文・注記・ポイント）を返す。
 * 「基本スペック」は表をすべて、「初当たり確率」は最初の表（スペック一覧と同じ値）だけ外す。
 */
function specNotes(id, inner) {
    let body = inner.replace(/\s*<h2[^>]*>[\s\S]*?<\/h2>/, "");
    if (id === "spec") body = body.replace(new RegExp(TABLE_WRAPPER.source, "g"), "");
    else body = body.replace(TABLE_WRAPPER, "");
    return body.replace(/<[^>]+>/g, "").trim() ? body.trim() : "";
}

/**
 * @param {string} root リポジトリルート
 * @param {string} rel  原稿のパス（setGuessElement/{dir}/index.html）
 * @returns {{ sections: {id: string, title: string, html: string}[], ceilingSections: {id: string, title: string, html: string}[], specNotes: string }}
 */
function loadGuessContent(root, rel) {
    const src = fs.readFileSync(path.join(root, rel), "utf8").replace(/\r\n/g, "\n");
    const sections = [];
    const ceilingSections = [];
    const notes = [];
    for (const [, id, inner] of src.matchAll(/<section class="card ge-section" id="([^"]+)">([\s\S]*?)<\/section>/g)) {
        if (SPEC_IDS.has(id)) {
            const n = specNotes(id, inner);
            if (n) notes.push(n);
            continue;
        }
        // 節の中に h3 の小見出しを持つ原稿があるので、節の見出しは h2 のまま差し込む
        const section = { id, title: headingText(inner), html: `            <section class="card lp-section ge-section" id="${id}">${inner}</section>` };
        (CEILING_IDS.has(id) ? ceilingSections : sections).push(section);
    }
    return { sections, ceilingSections, specNotes: notes.join("\n") };
}

/** 旧URL（/setGuessElement/{dir}/）に置く、機種ページへ転送するだけのページ */
function redirectPage(machineId, machineName) {
    const url = `${SITE_URL}/machines/${machineId}/`;
    return `<!DOCTYPE html>
<html lang="ja">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${escapeHtml(machineName)} | Setting Analyzer Pro</title>
    <link rel="canonical" href="${url}">
    <meta http-equiv="refresh" content="0; url=${url}">
    <script>location.replace("../../machines/${machineId}/#guess-element");</script>
</head>
<body>
    <p>${escapeHtml(machineName)}の設定推測要素は<a href="${url}">機種ページ</a>に移りました。</p>
</body>
</html>`;
}

/**
 * {out}/setGuessElement/{dir}/index.html を機種ページへの転送ページに置き換える
 * @param {string} out 出力ルート（dist）
 * @param {{ MACHINES: object[], GUESS_ELEMENT_PAGES: Record<string,string> }} data 機種データ
 */
function writeGuessRedirects(out, data) {
    const names = Object.fromEntries(data.MACHINES.map((m) => [m.id, m.name]));
    for (const [machineId, rel] of Object.entries(data.GUESS_ELEMENT_PAGES)) {
        if (!names[machineId]) {
            console.error("No machine name for id:", machineId);
            process.exit(1);
        }
        fs.writeFileSync(path.join(out, rel), redirectPage(machineId, names[machineId]), "utf8");
    }
    console.log(`setGuessElement: ${Object.keys(data.GUESS_ELEMENT_PAGES).length} page(s) redirected to machine pages.`);
}

module.exports = { loadGuessContent, writeGuessRedirects };
