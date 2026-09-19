/**
 * dist/ の実物をブラウザ相当の vm サンドボックスで読み込む共通処理。
 * suggestion-check.js と suggestion-sanity.js の両方から使う。
 *
 * init() は DOMContentLoaded でしか走らないので DOM は最小限のスタブで足りるが、
 * renderSuggestionInputs / renderSuggestionSummary の出力を読む検証があるため、
 * その2つの差し込み先だけは MiniEl の実体を返す。
 */
const fs = require("fs");
const path = require("path");
const vm = require("vm");
const { MiniEl } = require("./mini-dom");

const DIST_FILES = ["machines-data.js", "suggestion-rates.js", "app.js"];

/**
 * @returns {{ ctx: object, suggestionInputsEl: MiniEl, summaryEl: MiniEl }}
 */
function loadDist() {
    const DIST = path.join(__dirname, "..", "..", "dist");
    for (const f of DIST_FILES) {
        if (!fs.existsSync(path.join(DIST, f))) {
            console.error(`dist/${f} がありません。先に npm run build を実行してください。`);
            process.exit(1);
        }
    }

    const suggestionInputsEl = new MiniEl("div");
    const summaryEl = new MiniEl("div");

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
            getElementById: (id) => (id === "suggestion-inputs" ? suggestionInputsEl
                : id === "suggestion-summary" ? summaryEl
                : stubEl),
            addEventListener: () => {},
            querySelectorAll: () => [],
            createElement: (tag) => new MiniEl(tag),
        },
        requestAnimationFrame: () => {},
        fetch: () => Promise.resolve({ json: () => Promise.resolve({}) }),
    };
    vm.createContext(ctx);
    ctx.window = ctx;            // ブラウザと同じく globalThis === window にする

    for (const f of DIST_FILES) {
        vm.runInContext(fs.readFileSync(path.join(DIST, f), "utf8"), ctx, { filename: f });
    }

    return { ctx, suggestionInputsEl, summaryEl };
}

module.exports = { loadDist };
