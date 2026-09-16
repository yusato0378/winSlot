/**
 * 検証用の極小 DOM 実装
 *
 * 設定示唆の入力欄生成（renderSuggestionInputs / collectSuggestionCounts）を
 * ブラウザ無しで検証するために使う。app.js が実際に触る API だけを実装している。
 * レイアウト（375px 幅での折り返し等）は対象外で、そこは実機で見る。
 */
class MiniEl {
    constructor(tag) {
        this.tagName = String(tag).toUpperCase();
        this.className = "";
        this.children = [];
        this.dataset = {};
        this.style = {};
        this.value = "";
        this._text = "";
    }

    appendChild(child) { this.children.push(child); return child; }

    set innerHTML(v) { if (v === "") this.children = []; this._html = v; }
    get innerHTML() { return this._html || ""; }

    set textContent(v) { this._text = String(v); this.children = []; }
    get textContent() { return this._text + this.children.map(c => c.textContent).join(""); }

    /** "input.suggestion-count" 形式（タグ名 + 任意のクラス1つ）だけ対応 */
    querySelectorAll(selector) {
        const parts = selector.trim().split(".");
        if (parts.length > 2) throw new Error("mini-dom: 未対応のセレクタ " + selector);
        const tag = parts[0] ? parts[0].toUpperCase() : null;
        const cls = parts.length === 2 ? parts[1] : null;

        const out = [];
        const walk = (el) => {
            for (const c of el.children) {
                const tagOk = !tag || c.tagName === tag;
                const clsOk = !cls || String(c.className).split(" ").indexOf(cls) !== -1;
                if (tagOk && clsOk) out.push(c);
                walk(c);
            }
        };
        walk(this);
        return out;
    }

    querySelector(selector) { return this.querySelectorAll(selector)[0] || null; }

    /** 生成結果を目視・比較しやすい木構造にする */
    toTree() {
        return {
            tag: this.tagName,
            class: this.className || undefined,
            text: this._text || undefined,
            data: Object.keys(this.dataset).length ? Object.assign({}, this.dataset) : undefined,
            children: this.children.length ? this.children.map(c => c.toTree()) : undefined,
        };
    }
}

module.exports = { MiniEl };
