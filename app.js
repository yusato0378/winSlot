/* ========================================
   パチスロ設定推測ツール - Application
   ======================================== */

// ============================================================
// 機種データ
// 正本は data/machines/*.json。ビルドが dist/machines-data.js を生成し、
// index.html が app.js より前に読み込むことで window.MACHINES を供給する。
// ============================================================
const MACHINES = window.MACHINES || [];

// 設定示唆演出のランク定義と率生成器。同じくビルドが供給する。
// どちらか欠ければ示唆機能はまるごと無効になり、従来どおりの推測だけが動く。
const SUGGESTION_RANKS = window.SUGGESTION_RANKS || null;
const SUGGESTION_RATES = window.SUGGESTION_RATES || null;

// ============================================================
// DOM要素
// ============================================================
const $machineSelect = document.getElementById("machine-select");
const $machineInput  = document.getElementById("machine-input");
const $comboList     = document.getElementById("combo-list");
const $comboWrapper  = document.getElementById("combo-wrapper");
const $comboToggle   = document.getElementById("combo-toggle");
const $totalGames    = document.getElementById("total-games");
const $currentGames  = document.getElementById("current-games");
const $bigCount      = document.getElementById("big-count");
const $regCount      = document.getElementById("reg-count");
const $bonusProb     = document.getElementById("bonus-prob");
const $bigLabel      = document.getElementById("big-label");
const $regLabel      = document.getElementById("reg-label");
const $machineInfoBar   = document.getElementById("machine-info-bar");
const $machineTypeBadge = document.getElementById("machine-type-badge");
const $machineCeilingInfo = document.getElementById("machine-ceiling-info");
const $resultsSection = document.getElementById("results-section");
const $settingSection = document.getElementById("setting-section");
const $settingResults = document.getElementById("setting-results");
const $mostLikely    = document.getElementById("most-likely");
const $factorSection = document.getElementById("factor-section");
const $factorResults = document.getElementById("factor-results");
const $ceilingSection = document.getElementById("ceiling-section");
const $ceilingResults = document.getElementById("ceiling-results");
const $specSection   = document.getElementById("spec-section");
const $specTable     = document.getElementById("spec-table");
const $analyzeForm   = document.getElementById("analyze-form");
const $resetBtn      = document.getElementById("reset-btn");
const $suggestionInputs = document.getElementById("suggestion-inputs");
const $suggestionSummary = document.getElementById("suggestion-summary");

// ============================================================
// コンボボックス（検索付きドロップダウン）
// ============================================================
function getMachineGroup(m) {
    if (m.type === "A") return "Aタイプ";
    return "AT / ART機";
}

let comboActiveIdx = -1;

function buildComboItems(filter) {
    $comboList.innerHTML = "";
    comboActiveIdx = -1;
    const query = (filter || "").toLowerCase();
    const groups = {};

    MACHINES.forEach(m => {
        if (query && !m.name.toLowerCase().includes(query) && !m.id.includes(query)) return;
        const g = getMachineGroup(m);
        if (!groups[g]) groups[g] = [];
        groups[g].push(m);
    });

    const groupOrder = ["Aタイプ", "AT / ART機"];
    let hasItems = false;

    groupOrder.forEach(gName => {
        const items = groups[gName];
        if (!items || items.length === 0) return;
        hasItems = true;

        const label = document.createElement("li");
        label.className = "combo-group-label";
        label.textContent = `【${gName}】`;
        $comboList.appendChild(label);

        items.forEach(m => {
            const li = document.createElement("li");
            li.className = "combo-item";
            li.dataset.id = m.id;
            if (query) {
                const idx = m.name.toLowerCase().indexOf(query);
                if (idx >= 0) {
                    li.innerHTML =
                        escapeHtml(m.name.substring(0, idx)) +
                        '<span class="combo-match">' + escapeHtml(m.name.substring(idx, idx + query.length)) + '</span>' +
                        escapeHtml(m.name.substring(idx + query.length));
                } else {
                    li.textContent = m.name;
                }
            } else {
                li.textContent = m.name;
            }
            li.addEventListener("mousedown", e => { e.preventDefault(); selectComboItem(m); });
            $comboList.appendChild(li);
        });
    });

    if (!hasItems) {
        const li = document.createElement("li");
        li.className = "combo-no-match";
        li.textContent = "該当する機種がありません";
        $comboList.appendChild(li);
    }
}

function escapeHtml(str) {
    const d = document.createElement("div");
    d.textContent = str;
    return d.innerHTML;
}

function openCombo() {
    buildComboItems($machineInput.value);
    $comboList.classList.add("open");
}

function closeCombo() {
    $comboList.classList.remove("open");
    comboActiveIdx = -1;
}

function selectComboItem(machine) {
    $machineInput.value = machine.name;
    $machineSelect.value = machine.id;
    closeCombo();
    onMachineChange();
}

function comboKeyNav(e) {
    const items = $comboList.querySelectorAll(".combo-item");
    if (!items.length) return;

    if (e.key === "ArrowDown") {
        e.preventDefault();
        comboActiveIdx = Math.min(comboActiveIdx + 1, items.length - 1);
    } else if (e.key === "ArrowUp") {
        e.preventDefault();
        comboActiveIdx = Math.max(comboActiveIdx - 1, 0);
    } else if (e.key === "Enter") {
        e.preventDefault();
        if (comboActiveIdx >= 0 && items[comboActiveIdx]) {
            const id = items[comboActiveIdx].dataset.id;
            const m = MACHINES.find(x => x.id === id);
            if (m) selectComboItem(m);
        }
        return;
    } else if (e.key === "Escape") {
        closeCombo();
        return;
    } else {
        return;
    }

    items.forEach((it, i) => it.classList.toggle("active", i === comboActiveIdx));
    items[comboActiveIdx]?.scrollIntoView({ block: "nearest" });
}

function initCombo() {
    $machineInput.addEventListener("focus", openCombo);
    $machineInput.addEventListener("input", () => {
        $machineSelect.value = "";
        onMachineChange();
        openCombo();
    });
    $machineInput.addEventListener("keydown", comboKeyNav);
    $machineInput.addEventListener("blur", () => setTimeout(closeCombo, 150));
    $comboToggle.addEventListener("click", () => {
        if ($comboList.classList.contains("open")) {
            closeCombo();
        } else {
            $machineInput.focus();
        }
    });

    document.addEventListener("click", e => {
        if (!$comboWrapper.contains(e.target)) closeCombo();
    });
}

// ============================================================
// 初期化
// ============================================================
function init() {
    initCombo();
    initAccessRanking();
    initNewMachines();
    $analyzeForm.addEventListener("submit", onAnalyze);
    $resetBtn.addEventListener("click", onReset);

    [$totalGames, $bigCount, $regCount].forEach(el => {
        el.addEventListener("input", updateBonusProb);
    });
}

// ============================================================
// アクセスランキング（data/access-ranking.json）
// ============================================================
const ACCESS_RANKING_FALLBACK = [
    { href: "machines/hokuto/#lp-ceiling", title: "スマスロ北斗の拳：天井期待値" },
    { href: "machines/kabaneri/#lp-ceiling", title: "甲鉄城のカバネリ：天井期待値" },
    { href: "machines/banchou4/#lp-setting", title: "押忍！番長4：設定推測・設定差" },
    { href: "machines/aim_juggler_ex/#lp-setting", title: "アイムジャグラーEX：設定判別（ボーナス/合算）" },
    { href: "machines/my_juggler_v/#lp-setting", title: "マイジャグラーV：設定判別（ボーナス/合算）" }
];

function isValidRankingHref(href) {
    const s = String(href || "");
    return /^machines\/[a-z0-9_-]+\/?(?:#[\w\-]+)?$/i.test(s)
        && !s.includes("..");
}

function renderAccessRanking(items, note) {
    const $list = document.getElementById("access-ranking-list");
    const $note = document.getElementById("access-ranking-note");
    if (!$list) return;

    $list.innerHTML = "";
    for (const it of items) {
        const li = document.createElement("li");
        const a = document.createElement("a");
        a.href = it.href;
        a.textContent = it.title;
        li.appendChild(a);
        if (Number.isFinite(it.clicks) && it.clicks > 0) {
            const span = document.createElement("span");
            span.className = "access-ranking-clicks";
            span.textContent = `${Number(it.clicks).toLocaleString("ja-JP")} clicks`;
            li.appendChild(span);
        }
        $list.appendChild(li);
    }

    if ($note) $note.textContent = note;
}

function initAccessRanking() {
    if (!document.getElementById("access-ranking-list")) return;

    fetch("data/access-ranking.json", { cache: "no-store" })
        .then(r => { if (!r.ok) throw new Error(r.status); return r.json(); })
        .then(data => {
            const raw = Array.isArray(data.items) ? data.items : [];
            const items = raw
                .filter(it => it && it.title && isValidRankingHref(it.href))
                .slice(0, 5);

            if (!items.length) {
                renderAccessRanking(ACCESS_RANKING_FALLBACK, "");
                return;
            }

            const hasClicks = items.some(it => Number.isFinite(it.clicks) && it.clicks > 0);
            const note = hasClicks
                ? `検索クリック数の多い順（更新: ${data.updated || "—"}）`
                : "";
            renderAccessRanking(items, note);
        })
        .catch(() => {
            renderAccessRanking(ACCESS_RANKING_FALLBACK, "");
        });
}

// ============================================================
// 新台ピックアップ（MACHINES の addedDate 降順 上位5件）
// ============================================================
function initNewMachines() {
    const $list = document.getElementById("new-machines-list");
    if (!$list) return;

    const withDate = MACHINES
        .filter(m => m.addedDate)
        .sort((a, b) => (b.addedDate > a.addedDate ? 1 : b.addedDate < a.addedDate ? -1 : 0))
        .slice(0, 5);

    if (!withDate.length) return;

    $list.innerHTML = "";
    for (const m of withDate) {
        const li = document.createElement("li");
        const a = document.createElement("a");
        a.href = "machines/" + m.id + "/";
        a.textContent = m.name;
        li.appendChild(a);

        const badge = document.createElement("span");
        badge.className = "new-machine-date";
        const parts = m.addedDate.split("-");
        badge.textContent = Number(parts[1]) + "/" + Number(parts[2]) + " 追加";
        li.appendChild(badge);

        $list.appendChild(li);
    }
}

// ============================================================
// 設定示唆演出の入力欄（機種ごとに動的生成）
// ============================================================

/** 項目のランクを人が読める文言にする（UI の補助表示用） */
function suggestionRankLabel(item) {
    return [].concat(item.rank)
        .map(name => (SUGGESTION_RANKS && SUGGESTION_RANKS[name] && SUGGESTION_RANKS[name].label) || name)
        .join(" / ");
}

/**
 * 選択中の機種の示唆項目ぶんだけ入力欄を作る。
 * データが無い機種（大半）ではコンテナごと非表示になり、従来どおりの画面になる。
 */
function renderSuggestionInputs(machine) {
    $suggestionInputs.innerHTML = "";

    const groups = machine && machine.suggestions && machine.suggestions.groups;
    if (!groups || !groups.length || !SUGGESTION_RANKS || !SUGGESTION_RATES) {
        $suggestionInputs.style.display = "none";
        return;
    }
    $suggestionInputs.style.display = "";

    // 既存の「詳細入力（合算確率）」と同じ折り畳みの流儀に合わせる
    const details = document.createElement("details");
    details.className = "form-details";

    const summary = document.createElement("summary");
    summary.textContent = "設定示唆演出の回数（任意）";
    details.appendChild(summary);

    const content = document.createElement("div");
    content.className = "form-details-content";

    groups.forEach(group => {
        const heading = document.createElement("h4");
        heading.className = "suggestion-group-label";
        heading.textContent = group.label;
        content.appendChild(heading);

        group.items.forEach(item => {
            const row = document.createElement("label");
            row.className = "suggestion-row";

            const name = document.createElement("span");
            name.className = "suggestion-item-label";
            name.textContent = item.label;

            const hint = document.createElement("span");
            hint.className = "suggestion-item-hint";
            hint.textContent = suggestionRankLabel(item);
            name.appendChild(hint);

            const input = document.createElement("input");
            input.type = "number";
            input.min = "0";
            input.step = "1";
            input.inputMode = "numeric";
            input.placeholder = "0";
            input.className = "suggestion-count";
            // 機種由来の文字列を DOM id にすると衝突するので dataset で識別する
            input.dataset.group = group.id;
            input.dataset.item = item.id;

            row.appendChild(name);
            row.appendChild(input);
            content.appendChild(row);
        });
    });

    const note = document.createElement("p");
    note.className = "form-hint suggestion-note";
    note.textContent =
        "分母は「" + suggestionTrialLabel(machine) + "回数」を使用します。"
        + "1つでも入力すると、未入力の演出は0回として計算します。"
        + "設定推測には総ゲーム数の入力も必要です。";
    content.appendChild(note);

    details.appendChild(content);
    $suggestionInputs.appendChild(details);
}

/** 入力欄から観測回数を集める。1つも入力が無ければ null（＝示唆機能を使わない） */
function collectSuggestionCounts() {
    const counts = {};
    let any = false;

    $suggestionInputs.querySelectorAll("input.suggestion-count").forEach(el => {
        const n = parseInt(el.value, 10);
        if (!Number.isFinite(n) || n <= 0) return;
        const groupId = el.dataset.group;
        if (!counts[groupId]) counts[groupId] = {};
        counts[groupId][el.dataset.item] = n;
        any = true;
    });

    return any ? counts : null;
}

// ============================================================
// イベント処理
// ============================================================
function onMachineChange() {
    const machine = getSelectedMachine();
    renderSuggestionInputs(machine);
    if (!machine) {
        $machineInfoBar.style.display = "none";
        return;
    }

    $machineInfoBar.style.display = "flex";
    $machineTypeBadge.textContent = machine.type === "A" ? "Aタイプ" : "AT / ART機";

    if (machine.ceiling) {
        $machineCeilingInfo.textContent = `天井: ${machine.ceiling}G`;
        $machineCeilingInfo.style.display = "";
    } else {
        $machineCeilingInfo.style.display = "none";
    }

    $bigLabel.textContent = machine.bigLabel + "回数";
    if (machine.regLabel) {
        $regLabel.textContent = machine.regLabel + "回数";
        $regCount.closest(".form-group").style.display = "";
    } else {
        $regLabel.textContent = "REG回数";
        $regCount.closest(".form-group").style.display = "none";
        $regCount.value = "";
    }
}

function updateBonusProb() {
    const g = parseInt($totalGames.value) || 0;
    const b = parseInt($bigCount.value) || 0;
    const r = parseInt($regCount.value) || 0;
    if (g > 0 && (b + r) > 0) {
        const prob = g / (b + r);
        $bonusProb.value = `1/${prob.toFixed(1)}`;
    } else {
        $bonusProb.value = "";
    }
}

function onAnalyze(e) {
    e.preventDefault();
    const machine = getSelectedMachine();
    if (!machine) { alert("機種を選択してください"); return; }

    const totalGames  = parseInt($totalGames.value) || 0;
    const currentGames = parseInt($currentGames.value) || 0;
    const bigCount    = parseInt($bigCount.value) || 0;
    const regCount    = parseInt($regCount.value) || 0;

    const hasTotalGames = totalGames > 0;
    const hasCurrentGames = currentGames > 0;
    const ceilingOnly = !hasTotalGames && hasCurrentGames;

    if (!hasTotalGames && !hasCurrentGames) {
        alert("総ゲーム数または現在ゲーム数を入力してください");
        return;
    }

    if (hasTotalGames) {
        const suggestionDetail = buildSuggestionDetail(
            machine, resolveTrials(machine, bigCount, regCount), collectSuggestionCounts());
        // 示唆なし版も出しておき、示唆がどれだけ効いたかを結果欄で見せる
        const plain = estimateSettings(machine, totalGames, bigCount, regCount, null);
        const results = suggestionDetail
            ? estimateSettings(machine, totalGames, bigCount, regCount, suggestionDetail)
            : plain;
        renderSettingResults(results, machine);
        renderSuggestionSummary(suggestionDetail, plain, results);
        renderFactors(machine, totalGames, bigCount, regCount);
        renderSpecTable(machine);
        $settingSection.style.display = "";
        $factorSection.style.display = "";
        $specSection.style.display = "";
    } else {
        $settingSection.style.display = "none";
        renderSuggestionSummary(null);
        $factorSection.style.display = "none";
        $specSection.style.display = "none";
    }

    renderCeiling(machine, currentGames);

    if (ceilingOnly && (!machine.ceiling || machine.ceiling <= 0)) {
        alert("この機種には天井情報がありません。設定推測を行うには総ゲーム数を入力してください。");
        return;
    }

    $resultsSection.style.display = "";
    const scrollTarget = ceilingOnly ? $ceilingSection : $resultsSection;
    scrollTarget.scrollIntoView({ behavior: "smooth", block: "start" });
}

function onReset() {
    $analyzeForm.reset();
    $machineInput.value = "";
    $machineSelect.value = "";
    $bonusProb.value = "";
    $machineInfoBar.style.display = "none";
    $resultsSection.style.display = "none";
    $settingSection.style.display = "";
    $factorSection.style.display = "";
    $factorSection.open = false;
    $specSection.style.display = "";
    $specSection.open = false;
    $regCount.closest(".form-group").style.display = "";
    $bigLabel.textContent = "BIG回数";
    $regLabel.textContent = "REG回数";
    $suggestionInputs.innerHTML = "";
    $suggestionInputs.style.display = "none";
    renderSuggestionSummary(null);
}

// ============================================================
// 設定示唆演出の尤度
// ランク定義と率生成器はビルドが供給する（window.SUGGESTION_RANKS /
// window.SUGGESTION_RATES）。どちらか欠ければ示唆機能はまるごと無効になる。
// ============================================================

/** 示唆の試行回数（分母）の出所。機種によって初当たりが big / reg のどちらに入っているかが違う。 */
function resolveTrials(machine, bigCount, regCount) {
    const src = (machine.suggestions && machine.suggestions.trialSource) || "big";
    if (src === "reg") return regCount;
    if (src === "bigPlusReg") return bigCount + regCount;
    return bigCount;
}

/** 分母として使っているカウントのラベル（UI の注記・警告文用） */
function suggestionTrialLabel(machine) {
    const src = (machine.suggestions && machine.suggestions.trialSource) || "big";
    if (src === "reg") return machine.regLabel;
    if (src === "bigPlusReg") return machine.bigLabel + "＋" + machine.regLabel;
    return machine.bigLabel;
}

/** 項目の重み（ランクに weight があれば掛け合わせる。v1 はすべて 1.0） */
function suggestionItemWeight(item, ranks) {
    let w = 1;
    for (const name of [].concat(item.rank)) {
        const def = ranks[name];
        if (def && typeof def.weight === "number") w *= def.weight;
    }
    return w;
}

/**
 * 入力された示唆の観測回数から、設定ごとの対数尤度を組み立てる。
 *
 * @param {object} machine
 * @param {number} trials resolveTrials() の値
 * @param {object|null} counts { groupId: { itemId: 回数 } }
 * @returns {null|object} 示唆データが無い / 入力が空 なら null（呼び出し側は従来どおりの計算になる）
 */
function buildSuggestionDetail(machine, trials, counts) {
    if (!machine || !machine.suggestions || !counts) return null;
    if (!SUGGESTION_RANKS || !SUGGESTION_RATES) return null;

    const ranks = SUGGESTION_RANKS;
    const settingKeys = Object.keys(machine.settings).map(Number).sort((a, b) => a - b);

    const logL = {};
    settingKeys.forEach(s => { logL[s] = 0; });
    const eliminated = new Set();
    const warnings = [];
    const groupsOut = [];
    const trialLabel = suggestionTrialLabel(machine);

    for (const group of machine.suggestions.groups) {
        const raw = counts[group.id];
        if (!raw) continue;

        const built = SUGGESTION_RATES.buildGroupRates(group, ranks, settingKeys);
        const byId = {};
        for (const item of group.items) byId[item.id] = item;

        // ignore ランク（モード示唆など）は分子からも分母からも外す。UI には出す。
        const ignoredEntries = [];
        for (const id of built.ignoredIds) {
            const n = raw[id] || 0;
            if (n > 0) ignoredEntries.push({ id: id, label: byId[id].label, count: n });
        }

        const entries = [];
        let nOthers = 0;
        for (const id of Object.keys(built.itemRates)) {
            const n = raw[id] || 0;
            if (n <= 0) continue;
            nOthers += n;
            entries.push({ id: id, label: byId[id].label, count: n });
        }
        const nResidualEntered = built.residualId ? (raw[built.residualId] || 0) : 0;
        if (nResidualEntered > 0) {
            entries.push({ id: built.residualId, label: byId[built.residualId].label, count: nResidualEntered });
        }

        const entered = nOthers + nResidualEntered;
        if (entered === 0 && ignoredEntries.length === 0) continue;

        groupsOut.push({ id: group.id, label: group.label, entries: entries, ignoredEntries: ignoredEntries });
        if (entered === 0) continue;   // ignore ランクだけの入力 → 尤度には寄与しない

        // 入力合計が分母を超えても弾かない（誤入力で解析全体を拒否するのは体験が悪い）。
        // 残余が 0 になるだけで数式は破綻しない。
        const N = Math.max(trials, entered);
        if (entered > trials) {
            warnings.push(
                "「" + group.label + "」の入力合計 " + entered + "回 が「" + trialLabel + "回数」" +
                trials + "回 を超えています（合計を試行回数として計算しました）"
            );
        }

        const exclusive = group.exclusive !== false;

        for (const s of settingKeys) {
            let add = 0;
            let impossible = false;

            for (const e of entries) {
                if (e.id === built.residualId) continue;   // 残余はまとめて後段で扱う
                const p = built.itemRates[e.id][s];
                const w = suggestionItemWeight(byId[e.id], ranks);
                if (p === 0) { impossible = true; break; }   // Math.log(0) は呼ばない
                add += w * (exclusive
                    ? e.count * Math.log(p)
                    : e.count * Math.log(p) + (N - e.count) * Math.log(1 - p));
            }

            if (!impossible && exclusive) {
                // 残余バケット（明示のデフォルト行、または暗黙の「その他」）。
                // ここが「N回中1度も高設定示唆が出なかった」という否定的証拠を担う。
                const nResidual = N - nOthers;
                if (nResidual > 0) {
                    const pr = built.residualRates[s];
                    if (pr <= 0) impossible = true;
                    else add += nResidual * Math.log(pr);
                }
            }

            if (impossible) eliminated.add(s);
            else logL[s] += add;
        }
    }

    if (groupsOut.length === 0) return null;

    for (const s of eliminated) logL[s] = -Infinity;

    // 全設定が否定された = 入力の組み合わせが矛盾している（打ち間違い）。
    // 無言で NaN を出すより、示唆の寄与を捨てて従来の結果＋警告を返す。
    const anyFinite = settingKeys.some(s => Number.isFinite(logL[s]));
    if (!anyFinite) {
        warnings.push("入力された示唆の組み合わせが矛盾しているため、示唆は設定推測に反映していません");
        settingKeys.forEach(s => { logL[s] = 0; });
        return {
            applied: false, logL: logL, eliminated: [], warnings: warnings,
            trials: trials, trialLabel: trialLabel, groups: groupsOut
        };
    }

    return {
        applied: true,
        logL: logL,
        eliminated: Array.from(eliminated).sort((a, b) => a - b),
        warnings: warnings,
        trials: trials,
        trialLabel: trialLabel,
        groups: groupsOut
    };
}

// ============================================================
// ベイズ推定による設定推測
// ============================================================
function estimateSettings(machine, totalGames, bigCount, regCount, suggestionDetail) {
    const settingKeys = Object.keys(machine.settings).map(Number);
    const logLikelihoods = {};

    settingKeys.forEach(s => {
        const spec = machine.settings[s];
        let logL = 0;

        // BIG（AT初当たり）の尤度
        const pBig = 1 / spec.big;
        logL += bigCount * Math.log(pBig) + (totalGames - bigCount) * Math.log(1 - pBig);

        // REG の尤度（データがある場合のみ）
        if (spec.reg !== null && regCount > 0) {
            const pReg = 1 / spec.reg;
            logL += regCount * Math.log(pReg) + (totalGames - regCount) * Math.log(1 - pReg);
        }

        // 設定示唆演出の尤度（省略可。渡されなければ従来と完全に同じ計算）
        if (suggestionDetail && suggestionDetail.applied) {
            const add = suggestionDetail.logL[s];
            if (add !== undefined) logL += add;
        }

        logLikelihoods[s] = logL;
    });

    // Log-Sum-Exp で数値安定性を確保。
    // 示唆で否定された設定は -Infinity になるが、maxLogL が有限なら
    // Math.exp(-Infinity - 有限値) === 0 で安全に 0% になる。
    // 全設定が -Infinity のときだけ NaN になるため、示唆を外して計算し直す。
    const maxLogL = Math.max(...Object.values(logLikelihoods));
    if (!Number.isFinite(maxLogL) && suggestionDetail) {
        return estimateSettings(machine, totalGames, bigCount, regCount, null);
    }

    const expSum = settingKeys.reduce((sum, s) => sum + Math.exp(logLikelihoods[s] - maxLogL), 0);
    const logNorm = maxLogL + Math.log(expSum);

    const posteriors = {};
    settingKeys.forEach(s => {
        posteriors[s] = Math.exp(logLikelihoods[s] - logNorm);
    });

    return posteriors;
}

// ============================================================
// 天井期待値計算
// ============================================================
function calculateCeilingEV(machine, currentGames, overrideCeiling) {
    const ceiling = overrideCeiling || machine.ceiling;
    const ceilingReward = machine.ceilingReward;
    if (!ceiling || currentGames >= ceiling) return null;

    const s1key = Object.keys(machine.settings).map(Number).sort((a, b) => a - b)[0];
    const s1 = machine.settings[s1key];
    const pBonus = 1 / s1.big;
    const remaining = ceiling - currentGames;
    const costPerGame = machine.normalCostPerGame;

    let ev = 0;
    for (let g = 1; g <= remaining; g++) {
        const pFirstAt = Math.pow(1 - pBonus, g - 1) * pBonus;
        ev += pFirstAt * (machine.avgBonusReward - g * costPerGame);
    }
    const pReachCeiling = Math.pow(1 - pBonus, remaining);
    ev += pReachCeiling * (ceilingReward - remaining * costPerGame);

    return {
        evMedals: ev,
        evYen: ev * 20,
        pReachCeiling: pReachCeiling * 100
    };
}

// ============================================================
// 描画: 設定推測結果
// ============================================================
function renderSettingResults(posteriors, machine) {
    $settingResults.innerHTML = "";
    const maxProb = Math.max(...Object.values(posteriors));
    let bestSetting = 1;

    Object.entries(posteriors).forEach(([s, prob]) => {
        if (prob >= maxProb) bestSetting = s;
        const pct = (prob * 100).toFixed(1);
        const barWidth = maxProb > 0 ? (prob / maxProb) * 100 : 0;

        const row = document.createElement("div");
        row.className = "setting-row";
        row.innerHTML = `
            <span class="setting-label" style="color:var(--setting-${s})">設定${s}</span>
            <div class="setting-bar-container">
                <div class="setting-bar s${s}" style="width:0%"></div>
            </div>
            <span class="setting-percent">${pct}%</span>
        `;
        $settingResults.appendChild(row);

        requestAnimationFrame(() => {
            requestAnimationFrame(() => {
                row.querySelector(".setting-bar").style.width = barWidth + "%";
            });
        });
    });

    const pct = (posteriors[bestSetting] * 100).toFixed(1);
    $mostLikely.innerHTML = `最も可能性の高い設定: <strong style="color:var(--setting-${bestSetting})">設定${bestSetting}</strong>（推定 ${pct}%）`;
}

// ============================================================
// 描画: 設定示唆の反映結果
// ============================================================

/** 設定番号の配列を「設定1・2・3」の形にする */
function formatSettingList(settings) {
    return "設定" + settings.join("・");
}

/**
 * 示唆が事後確率にどう効いたかを表示する。
 *
 * #factor-section（詳細な推測要素）ではなく #setting-section の中に出す。
 * あちらは details で、onReset が open=false にするため既定で閉じており、
 * 今回の主役をそこに埋めると気づかれない。
 *
 * @param {object|null} detail buildSuggestionDetail の戻り値
 * @param {object} before 示唆を反映しない事後確率
 * @param {object} after  示唆を反映した事後確率
 */
function renderSuggestionSummary(detail, before, after) {
    $suggestionSummary.innerHTML = "";

    if (!detail) {
        $suggestionSummary.style.display = "none";
        return;
    }
    $suggestionSummary.style.display = "";

    const line = (className, text) => {
        const el = document.createElement("p");
        el.className = className;
        el.textContent = text;
        $suggestionSummary.appendChild(el);
        return el;
    };

    // 見出し
    const usedTrials = Math.max(detail.trials, 0);
    line("suggestion-summary-title", detail.applied
        ? `設定示唆演出を反映しました（${detail.trialLabel} ${usedTrials}回中）`
        : "設定示唆演出の入力を確認してください");

    // 入力内容の一覧
    detail.groups.forEach(group => {
        group.entries.forEach(e => {
            line("suggestion-summary-item", `${group.label} / ${e.label} ×${e.count}`);
        });
        group.ignoredEntries.forEach(e => {
            line("suggestion-summary-ignored",
                `※「${e.label}」×${e.count} はモード・テーブル示唆のため設定判別には使用していません`);
        });
    });

    if (detail.applied) {
        // 否定された設定
        if (detail.eliminated.length > 0) {
            line("suggestion-summary-eliminated",
                `${formatSettingList(detail.eliminated)}は否定されました`);
        }

        // 変化量（最有力設定について、示唆なし → 示唆ありを並べる）
        const settingKeys = Object.keys(after).map(Number);
        let best = settingKeys[0];
        settingKeys.forEach(s => { if (after[s] > after[best]) best = s; });
        const b = (before[best] * 100).toFixed(1);
        const a = (after[best] * 100).toFixed(1);
        if (b !== a) {
            line("suggestion-summary-delta", `設定${best}: ${b}% → ${a}%`);
        }
    }

    // 警告
    detail.warnings.forEach(w => line("suggestion-summary-warning", "⚠ " + w));

    // 免責（必須）
    line("suggestion-summary-note",
        "※ 示唆演出の設定別出現率は公表値ではなく、示唆の強さから推定した目安値です。参考程度にご利用ください。");
}

// ============================================================
// 描画: 推測要素
// ============================================================
function renderFactors(machine, totalGames, bigCount, regCount) {
    $factorResults.innerHTML = "";
    const items = [];

    const bigProb = totalGames > 0 && bigCount > 0 ? totalGames / bigCount : null;
    const regProb = totalGames > 0 && regCount > 0 ? totalGames / regCount : null;
    const combinedProb = totalGames > 0 && (bigCount + regCount) > 0
        ? totalGames / (bigCount + regCount) : null;

    if (bigProb !== null) {
        items.push({
            label: `${machine.bigLabel}確率`,
            value: `1/${bigProb.toFixed(1)}`,
            hint: findClosestSetting(machine, "big", bigProb)
        });
    }

    if (machine.regLabel && regProb !== null) {
        items.push({
            label: `${machine.regLabel}確率`,
            value: `1/${regProb.toFixed(1)}`,
            hint: findClosestSetting(machine, "reg", regProb)
        });
    }

    if (combinedProb !== null && machine.regLabel) {
        items.push({
            label: "合算確率",
            value: `1/${combinedProb.toFixed(1)}`,
            hint: findClosestCombined(machine, combinedProb)
        });
    }

    items.push({
        label: "サンプル数（総ゲーム数）",
        value: totalGames.toLocaleString() + "G",
        hint: totalGames < 2000 ? "※ 2000G以下はブレが大きいため参考程度に"
            : totalGames < 5000 ? "中程度の精度"
            : "十分なサンプル数"
    });

    items.forEach(item => {
        const el = document.createElement("div");
        el.className = "factor-item";
        el.innerHTML = `
            <span class="factor-label">${item.label}</span>
            <span class="factor-value">
                ${item.value}
                ${item.hint ? `<span class="factor-hint">${item.hint}</span>` : ""}
            </span>
        `;
        $factorResults.appendChild(el);
    });

    const geUrl = machine.guessElementPath || null;
    if (geUrl) {
        const linkBox = document.createElement("div");
        linkBox.className = "ge-link-box";
        linkBox.innerHTML = `<a href="${geUrl}">&#128270; その他の設定推測要素はこちら</a>`;
        $factorResults.appendChild(linkBox);
    }
}

function findClosestSetting(machine, key, actualDenom) {
    let closest = null;
    let minDiff = Infinity;
    const settingKeys = Object.keys(machine.settings).map(Number);

    settingKeys.forEach(s => {
        const specVal = machine.settings[s][key];
        if (specVal === null) return;
        const diff = Math.abs(specVal - actualDenom);
        if (diff < minDiff) { minDiff = diff; closest = s; }
    });

    if (closest === null) return "";

    const range = findSettingRange(machine, key, actualDenom);
    return range;
}

function findSettingRange(machine, key, actualDenom) {
    const entries = Object.entries(machine.settings)
        .filter(([, v]) => v[key] !== null)
        .map(([s, v]) => ({ s: Number(s), val: v[key] }))
        .sort((a, b) => b.val - a.val);

    if (actualDenom >= entries[0].val) return `設定${entries[0].s}以下相当`;
    if (actualDenom <= entries[entries.length - 1].val) return `設定${entries[entries.length - 1].s}以上相当`;

    for (let i = 0; i < entries.length - 1; i++) {
        if (actualDenom <= entries[i].val && actualDenom >= entries[i + 1].val) {
            if (entries[i].s === entries[i + 1].s) return `設定${entries[i].s}相当`;
            const lo = Math.min(entries[i].s, entries[i + 1].s);
            const hi = Math.max(entries[i].s, entries[i + 1].s);
            return `設定${lo}〜${hi}相当`;
        }
    }
    return "";
}

function findClosestCombined(machine, actualDenom) {
    const entries = Object.entries(machine.settings)
        .filter(([, v]) => v.big !== null)
        .map(([s, v]) => {
            const pBig = 1 / v.big;
            const pReg = v.reg !== null ? 1 / v.reg : 0;
            const combined = 1 / (pBig + pReg);
            return { s: Number(s), val: combined };
        })
        .sort((a, b) => b.val - a.val);

    if (actualDenom >= entries[0].val) return `設定${entries[0].s}以下相当`;
    if (actualDenom <= entries[entries.length - 1].val) return `設定${entries[entries.length - 1].s}以上相当`;

    for (let i = 0; i < entries.length - 1; i++) {
        if (actualDenom <= entries[i].val && actualDenom >= entries[i + 1].val) {
            const lo = Math.min(entries[i].s, entries[i + 1].s);
            const hi = Math.max(entries[i].s, entries[i + 1].s);
            if (lo === hi) return `設定${lo}相当`;
            return `設定${lo}〜${hi}相当`;
        }
    }
    return "";
}

// ============================================================
// 描画: 天井情報・期待値
// ============================================================
function renderCeilingBlock(container, label, ceiling, ceilingTarget, machine, currentGames) {
    const header = document.createElement("h4");
    header.className = "ceiling-block-header";
    header.textContent = label;
    container.appendChild(header);

    const items = [];
    items.push({ label: "天井ゲーム数", value: `${ceiling}G`, cls: "neutral" });
    items.push({ label: "狙い目", value: `${ceilingTarget}G〜`, cls: "neutral", highlight: false });

    if (currentGames > 0) {
        const remaining = Math.max(0, ceiling - currentGames);
        items.push({ label: "天井までの残りゲーム数", value: `${remaining}G`, cls: "neutral" });

        const evData = calculateCeilingEV(machine, currentGames, ceiling);
        if (evData) {
            const isPositive = evData.evYen >= 0;
            const sign = isPositive ? "+" : "";
            items.push({
                label: "現在位置からの期待値",
                value: `${sign}${Math.round(evData.evYen).toLocaleString()}円`,
                cls: isPositive ? "positive" : "negative",
                highlight: true
            });
            items.push({ label: "天井到達確率", value: `${evData.pReachCeiling.toFixed(1)}%`, cls: "neutral" });
            const isTarget = currentGames >= ceilingTarget;
            items.push({
                label: "狙い目判定",
                value: isTarget ? "打つべき！" : "まだ早い",
                cls: isTarget ? "positive" : "negative",
                highlight: isTarget
            });
        }
    } else {
        items.push({ label: "期待値計算", value: "「現在ゲーム数」を入力してください", cls: "neutral" });
    }

    items.forEach(item => {
        const el = document.createElement("div");
        el.className = `ceiling-item${item.highlight ? " highlight" : ""}`;
        el.innerHTML = `
            <span class="ceiling-label">${item.label}</span>
            <span class="ceiling-value ${item.cls}">${item.value}</span>
        `;
        container.appendChild(el);
    });
}

function renderCeiling(machine, currentGames) {
    if (!machine.ceiling) {
        $ceilingSection.style.display = "none";
        return;
    }

    $ceilingSection.style.display = "";
    $ceilingResults.innerHTML = "";

    renderCeilingBlock($ceilingResults, "通常時", machine.ceiling, machine.ceilingTarget, machine, currentGames);

    if (machine.resetCeiling) {
        const sep = document.createElement("hr");
        sep.className = "ceiling-separator";
        $ceilingResults.appendChild(sep);
        renderCeilingBlock($ceilingResults, "朝一リセット時（設定変更後）", machine.resetCeiling, machine.resetCeilingTarget, machine, currentGames);
    }

    const note = document.createElement("div");
    note.className = "ceiling-note";
    note.textContent = "※ 期待値は設定1を基準に、通常時の消費メダルと天井恩恵から算出した概算値です。" +
        "実際の期待値はモード状態や前兆等により変動します。1メダル=20円換算。";
    $ceilingResults.appendChild(note);
}

// ============================================================
// 描画: スペック表
// ============================================================
function renderSpecTable(machine) {
    const thead = $specTable.querySelector("thead");
    const tbody = $specTable.querySelector("tbody");
    thead.innerHTML = "";
    tbody.innerHTML = "";

    const cols = ["設定", machine.bigLabel || "BIG"];
    if (machine.regLabel) cols.push(machine.regLabel);
    cols.push("合算");
    if (machine.koyakuName) cols.push(machine.koyakuName);
    cols.push("機械割");

    const headerRow = document.createElement("tr");
    cols.forEach(c => {
        const th = document.createElement("th");
        th.textContent = c;
        headerRow.appendChild(th);
    });
    thead.appendChild(headerRow);

    Object.entries(machine.settings).forEach(([s, spec]) => {
        const tr = document.createElement("tr");

        const tdSetting = document.createElement("td");
        tdSetting.textContent = `設定${s}`;
        tdSetting.style.color = `var(--setting-${s})`;
        tr.appendChild(tdSetting);

        const tdBig = document.createElement("td");
        tdBig.textContent = `1/${spec.big.toFixed(1)}`;
        tr.appendChild(tdBig);

        if (machine.regLabel) {
            const tdReg = document.createElement("td");
            tdReg.textContent = spec.reg !== null ? `1/${spec.reg.toFixed(1)}` : "—";
            tr.appendChild(tdReg);
        }

        const tdCombined = document.createElement("td");
        const pBig = 1 / spec.big;
        const pReg = spec.reg !== null ? 1 / spec.reg : 0;
        const combined = 1 / (pBig + pReg);
        tdCombined.textContent = `1/${combined.toFixed(1)}`;
        tr.appendChild(tdCombined);

        if (machine.koyakuName) {
            const tdKoyaku = document.createElement("td");
            tdKoyaku.textContent = spec.koyaku !== null ? `1/${spec.koyaku.toFixed(2)}` : "—";
            tr.appendChild(tdKoyaku);
        }

        const tdPayout = document.createElement("td");
        tdPayout.textContent = `${spec.payout.toFixed(1)}%`;
        if (spec.payout >= 100) tdPayout.style.color = "var(--accent-green)";
        tr.appendChild(tdPayout);

        tbody.appendChild(tr);
    });
}

// ============================================================
// ユーティリティ
// ============================================================
function getSelectedMachine() {
    const id = $machineSelect.value;
    return MACHINES.find(m => m.id === id) || null;
}

// ============================================================
// アプリ起動
// ============================================================
document.addEventListener("DOMContentLoaded", init);
