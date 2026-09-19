/**
 * 設定示唆の校正ガードレール
 * 実行: node scripts/dev/suggestion-sanity.js   ※先に npm run build が必要
 *
 * `exclusive: true` のグループは「入力しなかった項目＝出なかった」を否定的証拠として使う。
 * これがグループのぶんだけ積み上がるので、示唆データを足していくほど
 * 「示唆を何も見ていないこと」自体が強い低設定証拠になっていく。
 * 効くのはグループ数だけではなく、グループ内の非デフォルト項目の率の合計
 * （項目が多いほどデフォルトの取り分が小さくなる）。
 * data/suggestion-ranks.json の base は「1グループの示唆が設定6で1割前後」で校正してあり、
 * グループ数が増えれば当然崩れる前提の数値なので、投入済み全機種で毎回測る。
 *
 * 判定: 初当たり20回ぶん、デフォルト行のある排他グループすべてにデフォルトを20回入れた状態で
 *   - NaN が出る                   → エラー
 *   - 設定6が MIN_TOP 未満          → 警告（この機種のグループ構成を見直す）
 *   - 設定1が MAX_BOTTOM 超         → 警告
 * 警告が複数機種で出たら、個別機種をいじるのではなく
 * data/suggestion-ranks.json の base / from / to を一律で下げる（前回の校正と同じ方法）。
 */
const { loadDist } = require("./dist-sandbox");

const { ctx } = loadDist();
const { MACHINES, buildSuggestionDetail, estimateSettings, resolveTrials, SUGGESTION_RANKS } = ctx;

// 測定条件。実戦でよくある「そこそこ回して示唆は何も出ていない」状況。
const GAMES = 6000;
const TRIALS = 20;

const MIN_TOP = 0.005;      // 設定6の下限（0.5%）
const MAX_BOTTOM = 0.60;    // 設定1の上限（60%）

const pct = (p) => [1, 2, 3, 4, 5, 6]
    .map(s => (p[s] === undefined ? "  -  " : (p[s] * 100).toFixed(1).padStart(5)))
    .join(" ");

/** そのグループの「何も示唆が出なかった」を表す項目。無ければ null（暗黙の残余バケット） */
function defaultItem(group) {
    return group.items.find(it => [].concat(it.rank).some(r => {
        const def = SUGGESTION_RANKS[r];
        return def && (def.kind === "default" || def.kind === "residual");
    })) || null;
}

const loaded = MACHINES.filter(m => m.suggestions);
if (loaded.length === 0) {
    console.log("示唆データの投入された機種がありません。");
    process.exit(0);
}

let warned = 0;
let failed = 0;

console.log(`測定条件: ${GAMES}G / 初当たり${TRIALS}回 / デフォルト行を${TRIALS}回入力\n`);
console.log("  " + "機種".padEnd(30) + " 排他G  設定1→          設定6→");

for (const m of loaded) {
    const groups = m.suggestions.groups.filter(g => g.exclusive !== false);
    const counts = {};
    let withDefault = 0;
    for (const g of groups) {
        const def = defaultItem(g);
        if (!def) continue;                       // 残余バケットが暗黙のグループは入力できない
        counts[g.id] = { [def.id]: TRIALS };
        withDefault++;
    }

    const trials = resolveTrials(m, TRIALS, TRIALS);
    const before = estimateSettings(m, GAMES, TRIALS, TRIALS, null);
    const detail = withDefault > 0 ? buildSuggestionDetail(m, trials, counts) : null;
    const after = detail ? estimateSettings(m, GAMES, TRIALS, TRIALS, detail) : before;

    const nan = Object.values(after).some(v => !Number.isFinite(v));
    const topLow = after[6] !== undefined && after[6] < MIN_TOP;
    const bottomHigh = after[1] !== undefined && after[1] > MAX_BOTTOM;

    const mark = nan ? "NG" : (topLow || bottomHigh) ? "!!" : "OK";
    const fmt = (s) => (before[s] === undefined ? "    -" : `${(before[s] * 100).toFixed(1)}→${(after[s] * 100).toFixed(1)}%`);
    console.log(`  ${mark}  ${m.id.padEnd(30)} ${String(withDefault).padStart(2)}/${groups.length}  ` +
                `${fmt(1).padEnd(15)} ${fmt(6)}`);

    if (nan) {
        console.log(`      NaN が出ています: ${pct(after)}`);
        failed++;
        continue;
    }
    if (topLow) {
        console.log(`      設定6が ${(after[6] * 100).toFixed(2)}% (下限 ${MIN_TOP * 100}%)。` +
                    `否定的証拠が強すぎます`);
        warned++;
    }
    if (bottomHigh) {
        console.log(`      設定1が ${(after[1] * 100).toFixed(1)}% (上限 ${MAX_BOTTOM * 100}%)。` +
                    `否定的証拠が強すぎます`);
        warned++;
    }
}

console.log("");
if (failed > 0) {
    console.error(`NaN が ${failed}機種で発生しています。ランク定義かグループ構成を確認してください。`);
    process.exit(1);
}
if (warned > 0) {
    console.error(`閾値超過 ${warned}件。対処は次のどちらかです。`);
    console.error("  1. 該当機種のグループを減らす / 情報量の小さいグループを exclusive:false にする");
    console.error("  2. 複数機種で出ているなら data/suggestion-ranks.json の base / from / to を一律で下げる");
    process.exit(1);
}
console.log(`校正ガードレール通過: 投入済み ${loaded.length}機種すべてが閾値内`);
