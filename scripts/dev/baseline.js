/**
 * 設定判別の回帰テスト（設定示唆の実装で既存の推測結果が変わっていないことの確認）
 * 実行: node scripts/dev/baseline.js
 *
 * app.js の estimateSettings（示唆なし経路）を Node で再現し、
 * 計画ファイル §9 に記録した基準値と一致するかを検証する。
 * 基準値は 2026-09-16 / 示唆機能の実装前のコードで測定したもの。
 */
const path = require("path");
const { loadMachines } = require("../build/machines");

const ROOT = path.join(__dirname, "..", "..");
const { MACHINES } = loadMachines(ROOT);

/** app.js:406-438 estimateSettings の示唆なし経路と同一の計算 */
function estimateSettings(machine, totalGames, bigCount, regCount) {
    const settingKeys = Object.keys(machine.settings).map(Number);
    const logLikelihoods = {};
    settingKeys.forEach(s => {
        const spec = machine.settings[s];
        let logL = 0;
        const pBig = 1 / spec.big;
        logL += bigCount * Math.log(pBig) + (totalGames - bigCount) * Math.log(1 - pBig);
        if (spec.reg !== null && regCount > 0) {
            const pReg = 1 / spec.reg;
            logL += regCount * Math.log(pReg) + (totalGames - regCount) * Math.log(1 - pReg);
        }
        logLikelihoods[s] = logL;
    });
    const maxLogL = Math.max(...Object.values(logLikelihoods));
    const expSum = settingKeys.reduce((sum, s) => sum + Math.exp(logLikelihoods[s] - maxLogL), 0);
    const logNorm = maxLogL + Math.log(expSum);
    const posteriors = {};
    settingKeys.forEach(s => { posteriors[s] = Math.exp(logLikelihoods[s] - logNorm); });
    return posteriors;
}

/** 計画ファイル §9 の基準値（設定1〜6。その機種に無い設定は null） */
const CASES = [
    { id: "hokuto",         games: 5000, big: 18, reg: 0,  expect: [11.9, 14.0, null, 26.5, 26.4, 21.2] },
    { id: "aim_juggler_ex", games: 5000, big: 20, reg: 18, expect: [4.5, 8.2, 18.4, 21.8, 23.4, 23.6] },
    { id: "sengoku_otome5", games: 5000, big: 15, reg: 0,  expect: [18.1, 18.5, 18.9, 17.6, 15.0, 11.9] },
];

let failed = 0;
for (const c of CASES) {
    const m = MACHINES.find(x => x.id === c.id);
    if (!m) { console.error(`  NG  ${c.id}: 機種が見つかりません`); failed++; continue; }

    const p = estimateSettings(m, c.games, c.big, c.reg);
    const actual = [1, 2, 3, 4, 5, 6].map(s => (p[s] === undefined ? null : Number((p[s] * 100).toFixed(1))));
    const ok = actual.every((v, i) => v === c.expect[i]);

    const fmt = (a) => a.map(v => (v === null ? "  -  " : v.toFixed(1).padStart(5))).join(" ");
    console.log(`  ${ok ? "OK" : "NG"}  ${c.id.padEnd(16)} ${c.games}G/${c.big}/${c.reg}`);
    console.log(`      実測 ${fmt(actual)}`);
    if (!ok) { console.log(`      基準 ${fmt(c.expect)}`); failed++; }
}

if (failed > 0) {
    console.error(`\n回帰テスト失敗: ${failed}件が基準値と一致しません`);
    process.exit(1);
}
console.log("\n回帰テスト成功: 既存の推測結果に変化なし");
