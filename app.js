/* ========================================
   パチスロ設定推測ツール - Application
   ======================================== */

// ============================================================
// 機種データ
// 正本は data/machines/*.json。ビルドが dist/machines-data.js を生成し、
// index.html が app.js より前に読み込むことで window.MACHINES を供給する。
// ============================================================
const MACHINES = window.MACHINES || [];

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
// イベント処理
// ============================================================
function onMachineChange() {
    const machine = getSelectedMachine();
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
        const results = estimateSettings(machine, totalGames, bigCount, regCount);
        renderSettingResults(results, machine);
        renderFactors(machine, totalGames, bigCount, regCount);
        renderSpecTable(machine);
        $settingSection.style.display = "";
        $factorSection.style.display = "";
        $specSection.style.display = "";
    } else {
        $settingSection.style.display = "none";
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
}

// ============================================================
// ベイズ推定による設定推測
// ============================================================
function estimateSettings(machine, totalGames, bigCount, regCount) {
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

        logLikelihoods[s] = logL;
    });

    // Log-Sum-Exp で数値安定性を確保
    const maxLogL = Math.max(...Object.values(logLikelihoods));
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
