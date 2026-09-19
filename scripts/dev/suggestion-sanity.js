/**
 * 設定示唆の校正ガードレール
 * 実行: node scripts/dev/suggestion-sanity.js   ※先に npm run build が必要
 *
 * `exclusive: true` のグループは「入力しなかった項目＝出なかった」を否定的証拠として使う。
 * これがグループのぶんだけ積み上がるので、示唆データを足していくほど
 * 「示唆を何も見ていないこと」自体が強い低設定証拠になっていく。
 * 効くのはグループ数ではなく、グループ内の非デフォルト項目の率の合計
 * （項目が多いほどデフォルトの取り分が小さくなる）。
 *
 * 測るのは事後確率ではなく尤度比。事後確率は機種のスペックと測定点に依存するので、
 * 「設定6の事後確率が何%まで落ちたか」では機種間で比べられない
 * （初当たり確率の重い機種は示唆と無関係に設定6が低く出る）。
 * 示唆そのものの強さは「初当たり20回ぶん、どのグループにも示唆が1つも出なかった」の
 * 尤度比＝最高設定 : 最低設定 で見る。これはスペックに依存しない。
 *
 * 判定:
 *   - NaN が出る                     → エラー
 *   - 尤度比が HARD_LR 超            → エラー（示唆を見ていないだけで設定が決まってしまう）
 *   - 1グループの示唆出現率が HARD_MASS 超 → エラー（項目を盛りすぎ）
 *   - 尤度比が SOFT_LR 超            → 表示のみ（校正の見直し候補。フェーズ8で判断する）
 *
 * data/suggestion-ranks.json の base は「1グループの示唆が設定6で1割前後」を目安にした数値。
 * 複数機種でエラーになるなら、個別機種をいじらず base / from / to を一律で下げる。
 */
const { loadDist } = require("./dist-sandbox");

const { ctx } = loadDist();
const { MACHINES, buildSuggestionDetail, estimateSettings, resolveTrials,
        SUGGESTION_RATES, SUGGESTION_RANKS } = ctx;

const TRIALS = 20;          // 「初当たり20回ぶん、示唆は何も出ていない」を基準の観測とする
const GAMES = 6000;         // 事後確率を参考表示するためだけに使う

const SOFT_LR = 100;        // ここを超えたら校正の見直し候補（表示のみ）
const HARD_LR = 1000;       // ここを超えたら落とす
const HARD_MASS = 0.30;     // 1グループの最高設定での示唆出現率の上限

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

const rows = [];
let failed = 0;

for (const m of loaded) {
    const keys = Object.keys(m.settings).map(Number).sort((a, b) => a - b);
    const top = keys[keys.length - 1];
    const bot = keys[0];

    let pNoneTop = 1, pNoneBot = 1;
    const groups = [];
    for (const g of m.suggestions.groups) {
        const built = SUGGESTION_RATES.buildGroupRates(g, SUGGESTION_RANKS, keys);
        const exclusive = g.exclusive !== false;
        const mass = 1 - built.residualRates[top];
        if (exclusive) {
            pNoneTop *= built.residualRates[top];
            pNoneBot *= built.residualRates[bot];
        }
        groups.push({ id: g.id, items: g.items.length, exclusive, mass });
    }

    // 「TRIALS 回すべて示唆なし」の尤度比（最低設定が最高設定の何倍もっともらしいか）
    const lr = Math.pow(pNoneBot, TRIALS) / Math.pow(pNoneTop, TRIALS);

    // 参考: 同じ観測での事後確率の動き（デフォルト行のあるグループにだけ入力できる）
    const counts = {};
    for (const g of m.suggestions.groups) {
        if (g.exclusive === false) continue;
        const def = defaultItem(g);
        if (def) counts[g.id] = { [def.id]: TRIALS };
    }
    const before = estimateSettings(m, GAMES, TRIALS, TRIALS, null);
    const detail = Object.keys(counts).length > 0
        ? buildSuggestionDetail(m, resolveTrials(m, TRIALS, TRIALS), counts) : null;
    const after = detail ? estimateSettings(m, GAMES, TRIALS, TRIALS, detail) : before;
    const nan = Object.values(after).some(v => !Number.isFinite(v));

    const overMass = groups.filter(g => g.exclusive && g.mass > HARD_MASS);
    const hard = nan || lr > HARD_LR || overMass.length > 0;
    rows.push({ m, top, bot, lr, groups, before, after, nan, overMass, hard });
    if (hard) failed++;
}

rows.sort((a, b) => b.lr - a.lr);

console.log(`基準の観測: 初当たり${TRIALS}回ぶん、どのグループにも示唆が1つも出ていない\n`);
for (const r of rows) {
    const mark = r.hard ? "NG" : (r.lr > SOFT_LR ? "!!" : "OK");
    console.log(`  ${mark}  ${r.m.id.padEnd(24)} 尤度比 設定${r.top}:設定${r.bot} = 1:${r.lr.toFixed(1)}` +
        `   （参考: 設定${r.top}の事後確率 ${(r.before[r.top] * 100).toFixed(1)}%→${(r.after[r.top] * 100).toFixed(1)}%）`);
    for (const g of r.groups) {
        const gm = g.exclusive && g.mass > HARD_MASS ? "  ← 上限超過" : "";
        console.log(`        ${g.exclusive ? "排他 " : "独立 "} ${g.id.padEnd(16)} 項目${String(g.items).padStart(2)}` +
            `  設定${r.top}で示唆が出る率 ${(g.mass * 100).toFixed(1)}%${gm}`);
    }
    if (r.nan) console.log("        NaN が出ています");
}

console.log("");
if (failed > 0) {
    console.error(`閾値超過 ${failed}機種（尤度比の上限 1:${HARD_LR} / 1グループの示唆出現率の上限 ${HARD_MASS * 100}%）。`);
    console.error("  1. その機種の項目を減らす / 情報量の小さいグループを exclusive:false にする");
    console.error("  2. 複数機種で出ているなら data/suggestion-ranks.json の base / from / to を一律で下げる");
    process.exit(1);
}
const soft = rows.filter(r => r.lr > SOFT_LR);
if (soft.length > 0) {
    console.log(`校正ガードレール通過（投入済み ${loaded.length}機種）。` +
        `ただし尤度比が 1:${SOFT_LR} を超えている機種が ${soft.length}件あります: ` +
        soft.map(r => r.m.id).join(", "));
    console.log("  示唆を1つも見ていないだけで設定が決まってしまう水準です。フェーズ8の再校正で見直してください。");
} else {
    console.log(`校正ガードレール通過: 投入済み ${loaded.length}機種すべてが閾値内`);
}
