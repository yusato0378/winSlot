/**
 * 設定示唆ランク → 設定別出現率の生成器
 *
 * 正本のランク定義は data/suggestion-ranks.json。
 * Node（scripts/build/machines.js のスキーマ検証）とブラウザ（app.js の尤度計算）の
 * 両方から使うため、CommonJS とグローバル変数の両対応にしてある。
 * ビルド時に dist/suggestion-rates.js へコピーされ、index.html が app.js より先に読み込む。
 *
 * 設計上の要点:
 * - 設定1〜6 固定の表ではなく「生成器」。機種によって settings のキーが非連続
 *   （例: valvrave2 は 1,2,4,5,6）なので、その機種の設定キー配列から率を組み立てる。
 * - 率 0 は「その設定ではこの演出は出ない」という意味を持つ。0 を潰さないこと
 *   （呼び出し側が -Infinity の代入で扱う。Math.log(0) は決して呼ばない）。
 */
(function (root) {
    "use strict";

    /** 非デフォルト項目の率の合計に許す上限。残りが必ずデフォルトの取り分になる。 */
    var MAX_NON_DEFAULT = 0.95;

    /**
     * ランク1つぶんの設定別出現率を作る。
     * @param {object} rankDef data/suggestion-ranks.json の ranks[name]
     * @param {number[]} settingKeys その機種の設定キー（昇順）
     * @param {object} [item] 機種JSONの items[] 要素（rank:"set" の settings を読む）
     * @returns {Object<number, number>} 設定 → 出現率
     */
    function rankRates(rankDef, settingKeys, item) {
        var out = {};
        var base = typeof rankDef.base === "number" ? rankDef.base : 0.05;
        var i, s, n;

        switch (rankDef.kind) {
            case "ignore":
            case "residual":
                // 呼び出し側が特別扱いする。ここでは率を持たない。
                return null;

            case "floor":
                for (i = 0; i < settingKeys.length; i++) {
                    s = settingKeys[i];
                    out[s] = s < rankDef.min ? 0 : base * (1 + (rankDef.step || 0) * (s - rankDef.min));
                }
                return out;

            case "set": {
                var allow = rankDef.settings || (item && item.settings) || [];
                for (i = 0; i < settingKeys.length; i++) {
                    s = settingKeys[i];
                    out[s] = allow.indexOf(s) === -1 ? 0 : base;
                }
                return out;
            }

            case "deny":
                for (i = 0; i < settingKeys.length; i++) {
                    s = settingKeys[i];
                    out[s] = s === rankDef.deny ? 0 : base;
                }
                return out;

            case "parity": {
                var wantEven = rankDef.parity === "even";
                for (i = 0; i < settingKeys.length; i++) {
                    s = settingKeys[i];
                    out[s] = (s % 2 === 0) === wantEven ? base * rankDef.ratio : base;
                }
                return out;
            }

            case "slope":
                // 設定の絶対値ではなく、その機種の設定キー配列上の位置で線形補間する。
                n = settingKeys.length;
                for (i = 0; i < n; i++) {
                    out[settingKeys[i]] = n === 1
                        ? rankDef.to
                        : rankDef.from + (rankDef.to - rankDef.from) * (i / (n - 1));
                }
                return out;

            case "weights":
                for (i = 0; i < settingKeys.length; i++) {
                    s = settingKeys[i];
                    out[s] = base * (rankDef.weights[String(s)] || 0);
                }
                return out;

            default:
                throw new Error("unknown rank kind: " + rankDef.kind);
        }
    }

    /**
     * 項目1つぶんの率。rank が配列（複合表記）なら各ランクの幾何平均を取る。
     * 幾何平均なら「どれか1つでも 0 なら 0」が保たれ、桁も単一ランクと同程度に収まる。
     * items[].rates があればランクより優先する（実測値が判明した演出用）。
     */
    function itemRates(item, ranks, settingKeys) {
        var i, s;

        if (item.rates) {
            var fixed = {};
            for (i = 0; i < settingKeys.length; i++) {
                s = settingKeys[i];
                fixed[s] = typeof item.rates[String(s)] === "number" ? item.rates[String(s)] : 0;
            }
            return fixed;
        }

        var names = [].concat(item.rank);
        var parts = [];
        for (i = 0; i < names.length; i++) {
            var def = ranks[names[i]];
            if (!def) throw new Error("unknown rank: " + names[i]);
            var r = rankRates(def, settingKeys, item);
            if (r) parts.push(r);
        }
        if (parts.length === 0) return null;   // ignore / residual のみ
        if (parts.length === 1) return parts[0];

        var out = {};
        for (i = 0; i < settingKeys.length; i++) {
            s = settingKeys[i];
            var prod = 1;
            for (var k = 0; k < parts.length; k++) prod *= parts[k][s];
            out[s] = prod === 0 ? 0 : Math.pow(prod, 1 / parts.length);
        }
        return out;
    }

    function isIgnored(item, ranks) {
        var names = [].concat(item.rank);
        for (var i = 0; i < names.length; i++) {
            if (ranks[names[i]] && ranks[names[i]].kind === "ignore") return true;
        }
        return false;
    }

    function isResidual(item, ranks) {
        var names = [].concat(item.rank);
        return names.length === 1 && ranks[names[0]] && ranks[names[0]].kind === "residual";
    }

    /**
     * グループ1つぶんの率をまとめて作る。設定ごとに合計 <= MAX_NON_DEFAULT に収め、
     * 残りをデフォルト（明示行が無ければ暗黙の「その他」バケット）に割り当てる。
     *
     * @returns {{ itemRates: object, ignoredIds: string[], residualId: (string|null),
     *             residualRates: object, scaledSettings: number[] }}
     */
    function buildGroupRates(group, ranks, settingKeys) {
        var rates = {};
        var ignoredIds = [];
        var residualId = null;
        var i, s, it;

        for (i = 0; i < group.items.length; i++) {
            it = group.items[i];
            if (isIgnored(it, ranks)) { ignoredIds.push(it.id); continue; }
            if (isResidual(it, ranks)) { residualId = it.id; continue; }
            rates[it.id] = itemRates(it, ranks, settingKeys);
        }

        var ids = Object.keys(rates);
        var residualRates = {};
        var scaledSettings = [];

        for (i = 0; i < settingKeys.length; i++) {
            s = settingKeys[i];
            var sum = 0;
            for (var j = 0; j < ids.length; j++) sum += rates[ids[j]][s];
            if (sum > MAX_NON_DEFAULT) {
                var factor = MAX_NON_DEFAULT / sum;
                for (var k = 0; k < ids.length; k++) rates[ids[k]][s] *= factor;   // 0 は 0 のまま
                sum = MAX_NON_DEFAULT;
                scaledSettings.push(s);
            }
            residualRates[s] = 1 - sum;
        }

        return {
            itemRates: rates,
            ignoredIds: ignoredIds,
            residualId: residualId,
            residualRates: residualRates,
            scaledSettings: scaledSettings
        };
    }

    var api = {
        MAX_NON_DEFAULT: MAX_NON_DEFAULT,
        rankRates: rankRates,
        itemRates: itemRates,
        isIgnored: isIgnored,
        isResidual: isResidual,
        buildGroupRates: buildGroupRates
    };

    if (typeof module !== "undefined" && module.exports) {
        module.exports = api;                 // Node（ビルド時の検証）
    } else {
        root.SUGGESTION_RATES = api;          // ブラウザ（app.js）
    }
})(typeof globalThis !== "undefined" ? globalThis : this);
