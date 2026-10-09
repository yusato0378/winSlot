/**
 * 記事「天井狙い目一覧」の表（全機種ぶん）を機種データから作る。
 * 記事本文（articles/ceiling-target-list.html）の <!-- generated:ceiling-list --> をこの表に置き換える。
 *
 * 数字は機種ページの「換金率別・期待値がプラスになる回転数」と同じ計算（machine-insights.js）。
 * 手で書くと機種を追加・修正するたびに古くなるので、ビルドのたびに作り直す。
 */
const { breakEvenTable } = require("./machine-insights");

const MARKER = "<!-- generated:ceiling-list -->";

function escapeHtml(str) {
    return String(str)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;");
}

/** landing-pages.js の formatBreakEven と同じ表記 */
function formatBreakEven(games) {
    if (games === null) return "天井までマイナス";
    if (games === 0) return "いつでもプラス";
    return `${games}G〜`;
}

/** 浅いゲーム数から狙える順。天井までマイナスの機種は最後 */
const sortKey = games => (games === null ? Infinity : games);

/**
 * @param {object[]} machines 全機種（解析待ち・天井なしは自動で除く）
 * @param {string} base 記事から見たサイトルート（guide/ からなので ".."）
 */
function buildCeilingListHtml(machines, base) {
    const rows = machines
        .filter(m => !m.pending)
        .map(m => ({ m, t: breakEvenTable(m) }))
        .filter(r => r.t)
        .sort((a, b) => sortKey(a.t[0].normal) - sortKey(b.t[0].normal) || a.m.ceiling - b.m.ceiling);

    const tr = rows.map(({ m, t }) => {
        // 朝一の行は列幅を広げないよう「いつでもプラス」も 0G〜 と短く書く（記事の「一覧の見方」で説明）
        const reset = m.resetCeiling
            ? `<br><span class="ceiling-list-reset">朝一 ${t[0].reset === 0 ? "0G〜" : formatBreakEven(t[0].reset)}</span>`
            : "";
        return `                <tr><td class="ceiling-list-name"><a href="${base}/machines/${m.id}/">${escapeHtml(m.name)}</a></td>` +
            `<td>${m.ceiling}G</td><td>${formatBreakEven(t[0].normal)}${reset}</td><td>${formatBreakEven(t[2].normal)}</td></tr>`;
    }).join("\n");

    // 天井はあるが、仕組みの都合で期待値を計算していない機種（周期天井など）
    const others = machines
        .filter(m => !m.pending && m.ceiling && !breakEvenTable(m))
        .map(m => `            <li><a href="${base}/machines/${m.id}/">${escapeHtml(m.name)}</a>（天井${m.ceiling}G・解析上の狙い目${m.ceilingTarget}G〜）</li>`)
        .join("\n");

    return `<p>掲載は<strong>${rows.length}機種</strong>です。期待値がプラスになるゲーム数が浅い順に並べています。機種名から、ゲーム数別の期待値表がある機種ページに移れます。</p>
        <div class="table-wrapper">
            <table class="spec-table ceiling-list-table">
                <thead>
                    <tr><th>機種</th><th>天井</th><th>等価</th><th>5.6枚交換</th></tr>
                </thead>
                <tbody>
${tr}
                </tbody>
            </table>
        </div>${others ? `
        <p>次の機種は天井の仕組み（周期天井など）がゲーム数だけで決まらないため、期待値を計算していません。解析上の狙い目だけを載せています。</p>
        <ul>
${others}
        </ul>` : ""}`;
}

/** 記事本文に表を差し込む。目印の無い記事はそのまま返す */
function injectCeilingList(content, machines, base) {
    if (!content.includes(MARKER)) return content;
    return content.replace(MARKER, buildCeilingListHtml(machines, base));
}

module.exports = { injectCeilingList };
