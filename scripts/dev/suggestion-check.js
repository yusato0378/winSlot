/**
 * 設定示唆の尤度計算の検証（フェーズ2）
 * 実行: node scripts/dev/suggestion-check.js   ※先に npm run build が必要
 *
 * dist/ に出力された実物（machines-data.js / suggestion-rates.js / app.js）を
 * ブラウザを模した vm サンドボックスで読み込み、buildSuggestionDetail と
 * estimateSettings を直接叩く。init() は DOMContentLoaded でしか走らないので
 * DOM は最小限のスタブで足りる。
 */
const fs = require("fs");
const path = require("path");
const vm = require("vm");

const DIST = path.join(__dirname, "..", "..", "dist");
for (const f of ["machines-data.js", "suggestion-rates.js", "app.js"]) {
    if (!fs.existsSync(path.join(DIST, f))) {
        console.error(`dist/${f} がありません。先に npm run build を実行してください。`);
        process.exit(1);
    }
}

// --- ブラウザ環境のスタブ ---------------------------------------------------
const stubEl = new Proxy({}, {
    get(t, k) {
        if (k === "style" || k === "dataset" || k === "classList") return stubEl;
        if (k === "value" || k === "textContent" || k === "innerHTML") return "";
        if (k === "querySelectorAll") return () => [];
        if (k === "closest" || k === "querySelector") return () => stubEl;
        if (typeof k === "symbol") return undefined;
        return () => stubEl;
    },
    set() { return true; },
});

const ctx = {
    console,
    Math, JSON, Object, Array, Number, String, Boolean, Set, Map, Infinity, NaN,
    document: {
        getElementById: () => stubEl,
        addEventListener: () => {},
        querySelectorAll: () => [],
        createElement: () => stubEl,
    },
    requestAnimationFrame: () => {},
    fetch: () => Promise.resolve({ json: () => Promise.resolve({}) }),
};
vm.createContext(ctx);
ctx.window = ctx;            // ブラウザと同じく globalThis === window にする

for (const f of ["machines-data.js", "suggestion-rates.js", "app.js"]) {
    vm.runInContext(fs.readFileSync(path.join(DIST, f), "utf8"), ctx, { filename: f });
}

const { MACHINES, buildSuggestionDetail, estimateSettings, resolveTrials } = ctx;

// --- テスト補助 -------------------------------------------------------------
let failed = 0;
function check(name, ok, detail) {
    console.log(`  ${ok ? "OK" : "NG"}  ${name}`);
    if (!ok) { failed++; if (detail !== undefined) console.log("      " + detail); }
}
const pct = (p) => [1, 2, 3, 4, 5, 6]
    .map(s => (p[s] === undefined ? "  -  " : (p[s] * 100).toFixed(1).padStart(5)))
    .join(" ");
const noNaN = (p) => Object.values(p).every(v => Number.isFinite(v));

const otome = MACHINES.find(m => m.id === "sengoku_otome5");
const hokuto = MACHINES.find(m => m.id === "hokuto");

console.log("\n[1] 後方互換 — 示唆を渡さなければ従来と同じ");
const base = estimateSettings(otome, 5000, 15, 0, null);
check("estimateSettings(..., null) が基準値と一致",
    pct(base).trim() === "18.1  18.5  18.9  17.6  15.0  11.9", pct(base));
check("第5引数を省略しても同じ",
    pct(estimateSettings(otome, 5000, 15, 0)) === pct(base));

console.log("\n[2] 入力なし / データなし機種は null");
check("counts が null なら null", buildSuggestionDetail(otome, 15, null) === null);
check("counts が空オブジェクトなら null", buildSuggestionDetail(otome, 15, {}) === null);
check("全項目0なら null", buildSuggestionDetail(otome, 15, { stamp: { ryo: 0 } }) === null);
check("示唆データ未投入の機種は null", buildSuggestionDetail(hokuto, 18, { stamp: { ryo: 1 } }) === null);

console.log("\n[3] 下限型（吉スタンプ = 設定3以上濃厚）");
const d3 = buildSuggestionDetail(otome, 15, { stamp: { kichi: 1 } });
const p3 = estimateSettings(otome, 5000, 15, 0, d3);
check("eliminated が [1,2]", JSON.stringify(d3.eliminated) === "[1,2]", JSON.stringify(d3.eliminated));
check("設定1・2が 0%", p3[1] === 0 && p3[2] === 0, pct(p3));
check("NaN が出ない", noNaN(p3), pct(p3));
check("確率の合計が 1", Math.abs(Object.values(p3).reduce((a, b) => a + b, 0) - 1) < 1e-9);
console.log("      " + pct(p3));

console.log("\n[4] ハード確定（極スタンプ = 設定6濃厚）");
const d6 = buildSuggestionDetail(otome, 15, { stamp: { goku: 1 } });
const p6 = estimateSettings(otome, 5000, 15, 0, d6);
check("設定6が 100%", (p6[6] * 100).toFixed(1) === "100.0", pct(p6));
check("他が全て 0%", [1, 2, 3, 4, 5].every(s => p6[s] === 0), pct(p6));
check("NaN が出ない", noNaN(p6), pct(p6));

console.log("\n[5] 分母0 — 初当たり0回 + 示唆2回");
const d0 = buildSuggestionDetail(otome, 0, { stamp: { ryo: 2 } });
const p0 = estimateSettings(otome, 3000, 0, 0, d0);
check("警告が出る", d0.warnings.length > 0, JSON.stringify(d0.warnings));
check("設定1〜3が 0%", [1, 2, 3].every(s => p0[s] === 0), pct(p0));
check("NaN が出ない", noNaN(p0), pct(p0));

console.log("\n[6] 入力合計が分母超過 — 初当たり5回に対し示唆9回");
const dOver = buildSuggestionDetail(otome, 5, { stamp: { ka: 9 } });
const pOver = estimateSettings(otome, 3000, 5, 0, dOver);
check("警告が出る", dOver.warnings.some(w => w.includes("超えています")), JSON.stringify(dOver.warnings));
check("計算は通る / NaN なし", noNaN(pOver), pct(pOver));

console.log("\n[7] 否定的証拠 — 20回中すべてデフォルトなら低設定寄りになる");
const dDef = buildSuggestionDetail(otome, 20, { stamp: { none: 20 } });
const pDef = estimateSettings(otome, 5000, 20, 0, dDef);
const pPlain = estimateSettings(otome, 5000, 20, 0, null);
check("設定6の確率が下がる", pDef[6] < pPlain[6], `${(pPlain[6]*100).toFixed(1)}% → ${(pDef[6]*100).toFixed(1)}%`);
check("設定1の確率が上がる", pDef[1] > pPlain[1], `${(pPlain[1]*100).toFixed(1)}% → ${(pDef[1]*100).toFixed(1)}%`);
check("NaN が出ない", noNaN(pDef), pct(pDef));

console.log("\n[8] 暗黙の残余バケット（獲得枚数グループにはデフォルト行が無い）");
const dMedal = buildSuggestionDetail(otome, 15, { medal: { m444: 1 } });
const pMedal = estimateSettings(otome, 5000, 15, 0, dMedal);
check("設定1〜3が 0%", [1, 2, 3].every(s => pMedal[s] === 0), pct(pMedal));
check("NaN が出ない", noNaN(pMedal), pct(pMedal));

console.log("\n[9] 矛盾入力 — 許容設定が交わらない2項目（合成機種）");
const synthetic = {
    id: "__synthetic__", name: "合成", type: "AT", bigLabel: "AT初当たり", regLabel: null,
    settings: otome.settings,
    suggestions: {
        trialSource: "big",
        groups: [{
            id: "g", label: "矛盾テスト", exclusive: true,
            items: [
                { id: "only1", label: "設定1のみ", rank: "set", settings: [1] },
                { id: "only6", label: "設定6のみ", rank: "eq6" },
            ],
        }],
    },
};
const dBad = buildSuggestionDetail(synthetic, 10, { g: { only1: 1, only6: 1 } });
check("applied が false", dBad.applied === false);
check("矛盾の警告が出る", dBad.warnings.some(w => w.includes("矛盾")), JSON.stringify(dBad.warnings));
const pBad = estimateSettings(synthetic, 5000, 10, 0, dBad);
check("NaN が出ない", noNaN(pBad), pct(pBad));
check("従来の結果と一致する（示唆の寄与が破棄されている）",
    pct(pBad) === pct(estimateSettings(synthetic, 5000, 10, 0, null)), pct(pBad));

console.log("\n[10] estimateSettings 側の最終ガード（applied な detail が全否定でも NaN にしない）");
const forced = { applied: true, logL: { 1: -Infinity, 2: -Infinity, 3: -Infinity, 4: -Infinity, 5: -Infinity, 6: -Infinity } };
const pForced = estimateSettings(otome, 5000, 15, 0, forced);
check("NaN が出ない", noNaN(pForced), pct(pForced));
check("従来の結果に戻る", pct(pForced) === pct(base), pct(pForced));

console.log("\n[11] resolveTrials");
check("trialSource 既定は big", resolveTrials(otome, 15, 7) === 15);
check("示唆データなしの機種も big", resolveTrials(hokuto, 18, 0) === 18);

if (failed > 0) { console.error(`\n検証失敗: ${failed}件`); process.exit(1); }
console.log("\n検証成功: 設定示唆の尤度計算はすべて期待どおり");
