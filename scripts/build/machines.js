/**
 * 機種データのローダ（唯一の正本）
 *
 * data/machines/index.json … 表示順を保った機種 id の配列
 * data/machines/{id}.json   … 1機種1ファイル（スペック・天井・cautions・guessElementPath）
 *
 * 機種追加 = data/machines/{id}.json を置き、index.json に id を1行足すだけ。
 */
const fs = require("fs");
const path = require("path");

/**
 * @param {string} root リポジトリルート
 * @returns {{ MACHINES: object[], GUESS_ELEMENT_PAGES: Record<string,string>, CAUTIONS_BY_ID: Record<string,string[]> }}
 */
function loadMachines(root) {
    const dir = path.join(root, "data", "machines");
    const order = JSON.parse(fs.readFileSync(path.join(dir, "index.json"), "utf8"));

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

        if (m.guessElementPath) GUESS_ELEMENT_PAGES[id] = m.guessElementPath;
        if (m.cautions && m.cautions.length) CAUTIONS_BY_ID[id] = m.cautions;

        MACHINES.push(m);
    }

    return { MACHINES, GUESS_ELEMENT_PAGES, CAUTIONS_BY_ID };
}

module.exports = { loadMachines };
