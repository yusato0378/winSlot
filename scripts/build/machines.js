/**
 * 機種データのローダ（唯一の正本）
 *
 * data/machines/index.json … 表示順を保った機種 id の配列
 * data/machines/{id}.json   … 1機種1ファイル（スペック・天井・cautions・guessElementPath・suggestions）
 * data/suggestion-ranks.json … 設定示唆ランク → 出現率の定義
 *
 * 機種追加 = data/machines/{id}.json を置き、index.json に id を1行足すだけ。
 */
const fs = require("fs");
const path = require("path");

const RATES = require("./suggestion-rates");

const TRIAL_SOURCES = ["big", "reg", "bigPlusReg"];

/**
 * 機種JSONの suggestions を検証する。
 *
 * ランク名を1文字打ち間違えると、ブラウザ側で率が undefined → Math.log(undefined) が NaN
 * → その機種の事後確率が全設定 NaN になり、画面には「NaN%」としか出ず原因が追えない。
 * ランタイム検証は無いので、ここで落とすのが唯一の防波堤。
 */
function validateSuggestions(id, m, ranks) {
    const sg = m.suggestions;
    if (sg === undefined || sg === null) return;   // 未投入の機種はここで抜ける

    const fail = (msg) => { throw new Error(`${id}.json suggestions: ${msg}`); };

    if (typeof sg !== "object" || Array.isArray(sg)) fail("オブジェクトではありません");

    const trialSource = sg.trialSource === undefined ? "big" : sg.trialSource;
    if (TRIAL_SOURCES.indexOf(trialSource) === -1) {
        fail(`trialSource="${trialSource}" は不正（${TRIAL_SOURCES.join(" / ")} のいずれか）`);
    }
    // regLabel が null だと入力欄自体が非表示（app.js の onMachineChange）になり、分母が常に0になる。
    if ((trialSource === "reg" || trialSource === "bigPlusReg") && m.regLabel === null) {
        fail(`trialSource="${trialSource}" だが regLabel が null。分母が常に0になります`);
    }

    if (!Array.isArray(sg.groups) || sg.groups.length === 0) fail("groups が非空配列ではありません");

    const settingKeys = Object.keys(m.settings).map(Number).sort((a, b) => a - b);
    const seenGroups = new Set();

    for (const group of sg.groups) {
        if (!group.id) fail("group.id が空です");
        if (seenGroups.has(group.id)) fail(`group.id="${group.id}" が重複しています`);
        seenGroups.add(group.id);
        if (!group.label) fail(`group "${group.id}": label が空です`);
        if (!Array.isArray(group.items) || group.items.length === 0) {
            fail(`group "${group.id}": items が非空配列ではありません`);
        }

        const seenItems = new Set();
        let residualCount = 0;

        for (const item of group.items) {
            const where = `group "${group.id}" item "${item.id}"`;
            if (!item.id) fail(`group "${group.id}": item.id が空です`);
            if (seenItems.has(item.id)) fail(`group "${group.id}": item.id="${item.id}" が重複しています`);
            seenItems.add(item.id);
            if (!item.label) fail(`${where}: label が空です`);
            if (!item.rank) fail(`${where}: rank がありません`);

            for (const name of [].concat(item.rank)) {
                const def = ranks[name];
                if (!def) fail(`${where}: 未知のランク "${name}"（data/suggestion-ranks.json にありません）`);

                // floor / set の対象設定がこの機種に存在しないと、実質より弱いランクと同義になる。
                if (def.kind === "floor" && settingKeys.indexOf(def.min) === -1) {
                    console.warn(`  警告: ${id}.json ${where}: ランク "${name}" の設定${def.min}がこの機種にありません`);
                }
            }

            if (RATES.isResidual(item, ranks)) residualCount++;

            const allow = item.settings;
            if (allow !== undefined) {
                if (!Array.isArray(allow) || allow.length === 0) fail(`${where}: settings が非空配列ではありません`);
                for (const s of allow) {
                    if (settingKeys.indexOf(s) === -1) fail(`${where}: settings に存在しない設定${s}が含まれます`);
                }
            }
            for (const name of [].concat(item.rank)) {
                if (ranks[name].kind === "set" && !ranks[name].settings && allow === undefined) {
                    fail(`${where}: rank "${name}" には settings 配列が必要です`);
                }
            }

            if (item.rates !== undefined) {
                for (const key of Object.keys(item.rates)) {
                    if (settingKeys.indexOf(Number(key)) === -1) fail(`${where}: rates に存在しない設定${key}が含まれます`);
                }
            }
        }

        if (residualCount > 1) fail(`group "${group.id}": デフォルト行が${residualCount}個あります（最大1個）`);

        // 率の実現可能性。デフォルトの取り分が無くなるグループを数値レベルで検出する。
        const built = RATES.buildGroupRates(group, ranks, settingKeys);
        if (built.scaledSettings.length > 0) {
            fail(`group "${group.id}": 設定${built.scaledSettings.join("・")}で非デフォルト率の合計が` +
                 `${RATES.MAX_NON_DEFAULT}を超えています（項目が多すぎるか base が高すぎます）`);
        }
    }
}

/**
 * @param {string} root リポジトリルート
 * @returns {{ MACHINES: object[], GUESS_ELEMENT_PAGES: Record<string,string>, CAUTIONS_BY_ID: Record<string,string[]>, SUGGESTION_RANKS: object }}
 */
function loadMachines(root) {
    const dir = path.join(root, "data", "machines");
    const order = JSON.parse(fs.readFileSync(path.join(dir, "index.json"), "utf8"));
    const rankFile = JSON.parse(fs.readFileSync(path.join(root, "data", "suggestion-ranks.json"), "utf8"));
    const ranks = rankFile.ranks;

    const MACHINES = [];
    const GUESS_ELEMENT_PAGES = {};
    const CAUTIONS_BY_ID = {};

    for (const id of order) {
        const m = JSON.parse(fs.readFileSync(path.join(dir, `${id}.json`), "utf8"));
        if (m.id !== id) {
            throw new Error(`id mismatch: index.json="${id}" but ${id}.json has id="${m.id}"`);
        }
        // 設定キーは JSON では文字列。数値キーの object に戻して既存ロジックと揃える。
        const settings = {};
        for (const k of Object.keys(m.settings)) settings[Number(k)] = m.settings[k];
        m.settings = settings;

        validateSuggestions(id, m, ranks);

        if (m.guessElementPath) GUESS_ELEMENT_PAGES[id] = m.guessElementPath;
        if (m.cautions && m.cautions.length) CAUTIONS_BY_ID[id] = m.cautions;

        MACHINES.push(m);
    }

    return { MACHINES, GUESS_ELEMENT_PAGES, CAUTIONS_BY_ID, SUGGESTION_RANKS: ranks };
}

module.exports = { loadMachines };
