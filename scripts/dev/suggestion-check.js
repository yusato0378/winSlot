/**
 * 設定示唆の尤度計算の検証（フェーズ2）
 * 実行: node scripts/dev/suggestion-check.js   ※先に npm run build が必要
 *
 * dist/ に出力された実物（machines-data.js / suggestion-rates.js / app.js）を
 * ブラウザを模した vm サンドボックスで読み込み、buildSuggestionDetail と
 * estimateSettings を直接叩く。init() は DOMContentLoaded でしか走らないので
 * DOM は最小限のスタブで足りる。
 */
const { loadDist } = require("./dist-sandbox");

const { ctx, suggestionInputsEl, summaryEl } = loadDist();

const { MACHINES, buildSuggestionDetail, estimateSettings, resolveTrials,
        renderSuggestionInputs, collectSuggestionCounts,
        SUGGESTION_RATES, SUGGESTION_RANKS } = ctx;

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

// 「示唆データ未投入の機種」の代表。機種名で決め打ちすると、その機種にデータを入れた
// フェーズで検証が落ちる（noSuggestions がフェーズ6で該当した）。データから引くこと。
const noSuggestions = MACHINES.find(m => !m.suggestions);
if (!noSuggestions) {
    console.error("示唆データ未投入の機種が1つもありません。この検証の前提が崩れています。");
    process.exit(1);
}

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
check("示唆データ未投入の機種は null", buildSuggestionDetail(noSuggestions, 18, { stamp: { ryo: 1 } }) === null);

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
check("示唆データなしの機種も big", resolveTrials(noSuggestions, 18, 0) === 18);


console.log("\n[12] 入力欄の動的生成");
const otomeEl = suggestionInputsEl;

renderSuggestionInputs(otome);
check("コンテナが表示される", otomeEl.style.display === "");
const inputs = otomeEl.querySelectorAll("input.suggestion-count");
const expectedItems = otome.suggestions.groups.reduce((n, g) => n + g.items.length, 0);
check(`入力欄が項目数ぶん（${expectedItems}個）できる`, inputs.length === expectedItems, `実際 ${inputs.length}個`);
check("すべて data-group / data-item を持つ",
    inputs.every(el => el.dataset.group && el.dataset.item));
check("DOM id は付けない（機種由来文字列の衝突回避）",
    inputs.every(el => el.id === undefined || el.id === ""));
check("折り畳み（details.form-details）で包まれている",
    otomeEl.children.length === 1 && otomeEl.children[0].tagName === "DETAILS"
    && otomeEl.children[0].className === "form-details");
check("グループ見出しが3つ", otomeEl.querySelectorAll("h4.suggestion-group-label").length === 3);
check("分母のラベルが注記に入っている",
    otomeEl.querySelectorAll("p.suggestion-note")[0].textContent.includes("AT初当たり回数"));

console.log("\n[13] データ無し機種・機種未選択では出さない");
renderSuggestionInputs(noSuggestions);
check("示唆データ未投入の AT機 → 非表示", suggestionInputsEl.style.display === "none");
check("入力欄が残らない", suggestionInputsEl.querySelectorAll("input.suggestion-count").length === 0);
renderSuggestionInputs(MACHINES.find(m => m.type === "A" && !m.suggestions));
check("示唆データ未投入の Aタイプ → 非表示", suggestionInputsEl.style.display === "none");

// 入力欄の出し分けは type ではなく suggestions の有無だけで決まる。
// Aタイプにも示唆データを入れた機種があるので、出ることを明示的に確認する。
const aWithData = MACHINES.find(m => m.type === "A" && m.suggestions);
if (aWithData) {
    renderSuggestionInputs(aWithData);
    check(`示唆データ投入済みの Aタイプ（${aWithData.id}）→ 表示`, suggestionInputsEl.style.display === "");
    check("入力欄が項目数ぶんできる",
        suggestionInputsEl.querySelectorAll("input.suggestion-count").length
        === aWithData.suggestions.groups.reduce((n, g) => n + g.items.length, 0));
}
renderSuggestionInputs(null);
check("機種未選択 → 非表示", suggestionInputsEl.style.display === "none");

console.log("\n[14] 入力値の収集");
check("何も入力しなければ null", collectSuggestionCounts() === null);
renderSuggestionInputs(otome);
check("生成直後（全欄空）も null", collectSuggestionCounts() === null);

const byKey = {};
for (const el of suggestionInputsEl.querySelectorAll("input.suggestion-count")) {
    byKey[el.dataset.group + "." + el.dataset.item] = el;
}
byKey["stamp.ryo"].value = "2";
byKey["medal.m222"].value = "1";
byKey["stamp.ka"].value = "0";      // 0 は無視される
byKey["nagiSerif.yokan"].value = "";  // 空欄も無視される
const collected = collectSuggestionCounts();
check("入力した項目だけ拾う",
    JSON.stringify(collected) === JSON.stringify({ stamp: { ryo: 2 }, medal: { m222: 1 } }),
    JSON.stringify(collected));

console.log("\n[15] 生成 → 収集 → 尤度 が通しで動く");
const uiDetail = buildSuggestionDetail(otome, resolveTrials(otome, 15, 0), collected);
const uiResult = estimateSettings(otome, 5000, 15, 0, uiDetail);
check("設定1〜3が 0%（設定4以上濃厚を2回）", [1, 2, 3].every(s => uiResult[s] === 0), pct(uiResult));
check("NaN が出ない", noNaN(uiResult), pct(uiResult));
console.log("      " + pct(uiResult));

console.log("\n[16] 機種を切り替えても前の入力が残らない");
renderSuggestionInputs(noSuggestions);
renderSuggestionInputs(otome);
check("切替後は全欄が空 → null", collectSuggestionCounts() === null);


console.log("\n[17] リセット");
renderSuggestionInputs(otome);
suggestionInputsEl.querySelectorAll("input.suggestion-count")[0].value = "3";
check("リセット前は入力が拾える", collectSuggestionCounts() !== null);
ctx.onReset();
check("入力欄が消える", suggestionInputsEl.querySelectorAll("input.suggestion-count").length === 0);
check("コンテナが非表示になる", suggestionInputsEl.style.display === "none");
check("収集結果が null に戻る", collectSuggestionCounts() === null);


console.log("\n[18] 反映結果の表示");
const sumText = () => summaryEl.children.map(c => c.textContent).join("\n");
const renderFor = (counts, trials) => {
    const d = buildSuggestionDetail(otome, trials, counts);
    const plain = estimateSettings(otome, 5000, trials, 0, null);
    const res = d ? estimateSettings(otome, 5000, trials, 0, d) : plain;
    ctx.renderSuggestionSummary(d, plain, res);
    return { d, plain, res };
};

renderFor({ stamp: { ryo: 2 } }, 15);
check("コンテナが表示される", summaryEl.style.display === "");
check("見出しに分母が入る", sumText().includes("AT初当たり 15回中"), sumText().split("\n")[0]);
check("入力内容が出る", sumText().includes("良スタンプ ×2"));
check("否定された設定が出る", sumText().includes("設定1・2・3は否定されました"), sumText());
check("変化量が出る", /設定\d: \d+\.\d% → \d+\.\d%/.test(sumText()), sumText());
check("免責が出る", sumText().includes("公表値ではなく"));

console.log("\n[19] 示唆なしなら何も出さない");
ctx.renderSuggestionSummary(null);
check("非表示になる", summaryEl.style.display === "none");
check("中身が空になる", summaryEl.children.length === 0);

console.log("\n[20] 警告の表示");
renderFor({ stamp: { ka: 9 } }, 5);
check("入力超過の警告が出る", sumText().includes("⚠") && sumText().includes("超えています"), sumText());

const dBad2 = buildSuggestionDetail(synthetic, 10, { g: { only1: 1, only6: 1 } });
ctx.renderSuggestionSummary(dBad2,
    estimateSettings(synthetic, 5000, 10, 0, null),
    estimateSettings(synthetic, 5000, 10, 0, dBad2));
check("矛盾入力の警告が出る", sumText().includes("矛盾"), sumText());
check("矛盾時は否定された設定を出さない", !sumText().includes("否定されました"), sumText());
check("矛盾時も免責は出す", sumText().includes("公表値ではなく"));

console.log("\n[21] ignore ランクの注記");
const monhanLike = {
    id: "__ig__", name: "合成2", type: "AT", bigLabel: "AT初当たり", regLabel: null,
    settings: otome.settings,
    suggestions: {
        trialSource: "big",
        groups: [{
            id: "chara", label: "終了画面キャラ", exclusive: true,
            items: [
                { id: "rainbow", label: "虹", rank: "eq6" },
                { id: "inner", label: "インナー姿", rank: "ignore" },
            ],
        }],
    },
};
const dIg = buildSuggestionDetail(monhanLike, 12, { chara: { inner: 5 } });
const pIgPlain = estimateSettings(monhanLike, 5000, 12, 0, null);
const pIg = estimateSettings(monhanLike, 5000, 12, 0, dIg);
ctx.renderSuggestionSummary(dIg, pIgPlain, pIg);
check("ignore の注記が出る", sumText().includes("設定判別には使用していません"), sumText());
check("事後確率は変わらない", pct(pIg) === pct(pIgPlain), pct(pIg) + " vs " + pct(pIgPlain));


console.log("\n[22] リセットで反映結果も消える");
renderFor({ stamp: { ryo: 1 } }, 15);
check("リセット前は表示されている", summaryEl.style.display === "" && summaryEl.children.length > 0);
ctx.onReset();
check("リセット後は非表示", summaryEl.style.display === "none");
check("リセット後は中身も空", summaryEl.children.length === 0);

console.log("\n[23] 機種を切り替えただけでは結果表示を消さない（解析するまで前回の結果が残る）");
renderFor({ stamp: { ryo: 1 } }, 15);
renderSuggestionInputs(noSuggestions);
check("renderSuggestionInputs は結果表示に触らない", summaryEl.children.length > 0,
    "renderSuggestionInputs 内で renderSuggestionSummary(null) を呼んでいないか確認");


console.log("\n[24] valvrave2 — 設定キーが非連続（1,2,4,5,6）");
const valv = MACHINES.find(m => m.id === "valvrave2");
check("設定3を持たない", valv.settings[3] === undefined);
const dValv = buildSuggestionDetail(valv, 12, { czBonusEnd: { red: 4 } });
const pValv = estimateSettings(valv, 4000, 12, 0, dValv);
check("設定3の行が出ない", pValv[3] === undefined, JSON.stringify(Object.keys(pValv)));
check("5設定ぶんの値が出る", Object.keys(pValv).length === 5);
check("NaN / undefined が出ない", noNaN(pValv), pct(pValv));
check("高設定寄りに動く（赤枠＝高設定示唆×4）",
    pValv[6] > estimateSettings(valv, 4000, 12, 0, null)[6], pct(pValv));
console.log("      " + pct(pValv));

console.log("\n[25] valvrave2 — items[].rates による実測値の上書き");
const monitorItem = valv.suggestions.groups.find(g => g.id === "atEndMonitor").items[0];
check("rates が入っている", monitorItem.rates && monitorItem.rates["6"] === 0.01);
const rMon = SUGGESTION_RATES.buildGroupRates(
    valv.suggestions.groups.find(g => g.id === "atEndMonitor"),
    SUGGESTION_RANKS, Object.keys(valv.settings).map(Number).sort((a, b) => a - b));
check("設定6だけ 0.01、他は 0",
    rMon.itemRates.monitor[6] === 0.01 && [1, 2, 4, 5].every(s => rMon.itemRates.monitor[s] === 0),
    JSON.stringify(rMon.itemRates.monitor));
const pMon = estimateSettings(valv, 4000, 12, 0, buildSuggestionDetail(valv, 12, { atEndMonitor: { monitor: 1 } }));
check("設定6が 100%", (pMon[6] * 100).toFixed(1) === "100.0", pct(pMon));

console.log("\n[26] monhan_rise — ignore ランクと暗黙の残余バケット");
const monhan = MACHINES.find(m => m.id === "monhan_rise");
const pMonPlain = estimateSettings(monhan, 6000, 20, 0, null);
const dIgnoreOnly = buildSuggestionDetail(monhan, 20, { endChara: { inner: 5 } });
const pIgnoreOnly = estimateSettings(monhan, 6000, 20, 0, dIgnoreOnly);
check("インナー姿だけの入力では事後確率が変わらない",
    pct(pIgnoreOnly) === pct(pMonPlain), pct(pIgnoreOnly) + " vs " + pct(pMonPlain));
check("UI には表示される", dIgnoreOnly.groups[0].ignoredEntries.length === 1);

const pTrophy = estimateSettings(monhan, 6000, 20, 0,
    buildSuggestionDetail(monhan, 20, { trophy: { gold: 1 } }));
check("トロフィー金×1 で設定1〜3が 0%", [1, 2, 3].every(s => pTrophy[s] === 0), pct(pTrophy));
check("NaN が出ない", noNaN(pTrophy), pct(pTrophy));

const pChara = estimateSettings(monhan, 6000, 20, 0,
    buildSuggestionDetail(monhan, 20, { endChara: { lara: 2 } }));
check("デフォルト行の無いグループでも計算できる", noNaN(pChara), pct(pChara));
console.log("      トロフィー金×1: " + pct(pTrophy));
console.log("      Lara×2:        " + pct(pChara));

console.log("\n[27] street_fighter6 — trialSource が reg");
const sf6 = MACHINES.find(m => m.id === "street_fighter6");
check("trialSource が reg", sf6.suggestions.trialSource === "reg");
check("resolveTrials が REG 側を返す", resolveTrials(sf6, 30, 12) === 12);
renderSuggestionInputs(sf6);
check("入力欄の注記が「ボーナス初当たり回数」になる",
    suggestionInputsEl.querySelectorAll("p.suggestion-note")[0].textContent.includes("ボーナス初当たり回数"),
    suggestionInputsEl.querySelectorAll("p.suggestion-note")[0].textContent);
const dSf = buildSuggestionDetail(sf6, resolveTrials(sf6, 30, 12), { bonusEnd: { lukeJamie: 1 } });
check("見出しのラベルも REG 側", dSf.trialLabel === "ボーナス初当たり", dSf.trialLabel);
const pSf = estimateSettings(sf6, 6000, 30, 12, dSf);
check("設定1が 0%（設定2以上濃厚）", pSf[1] === 0, pct(pSf));
check("NaN が出ない", noNaN(pSf), pct(pSf));

// 投入済み機種はフェーズごとに増える。ここに機種名をべた書きすると、データを足したときに
// 検証が追従せず「増やした機種だけ素通し」になるので、必ずデータから引く。
const LOADED = MACHINES.filter(m => m.suggestions);

console.log(`\n[28] 投入済み${LOADED.length}機種すべてで全項目を1回ずつ入力しても壊れない`);
check("投入済み機種が1つ以上ある", LOADED.length > 0, LOADED.length + "機種");
for (const mm of LOADED) {
    const id = mm.id;
    const counts = {};
    mm.suggestions.groups.forEach(g => {
        counts[g.id] = {};
        g.items.forEach(it => { counts[g.id][it.id] = 1; });
    });
    const dd = buildSuggestionDetail(mm, 30, counts);
    const rr = estimateSettings(mm, 6000, 30, 10, dd);
    check(id + " が NaN を出さない", noNaN(rr), pct(rr));
    check(id + " の確率が合計1", Math.abs(Object.values(rr).reduce((a, b) => a + b, 0) - 1) < 1e-9);
}

console.log(`\n[29] 示唆データ未投入の${MACHINES.length - LOADED.length}機種は従来どおり`);
let untouched = 0;
for (const mm of MACHINES) {
    if (mm.suggestions) continue;
    untouched++;
    if (buildSuggestionDetail(mm, 10, { any: { x: 1 } }) !== null) {
        check(mm.id + " が null を返さない", false);
        break;
    }
}
check(`${untouched}機種すべてで示唆機能が無効`, untouched === MACHINES.length - LOADED.length,
    `未投入 ${untouched}機種 / 投入済み ${LOADED.length}機種 / 全${MACHINES.length}機種`);

if (failed > 0) { console.error(`\n検証失敗: ${failed}件`); process.exit(1); }
console.log("\n検証成功: 設定示唆の尤度計算はすべて期待どおり");
