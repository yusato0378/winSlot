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
const $machineSheet  = document.getElementById("machine-sheet");
const $sheetInput    = document.getElementById("machine-sheet-input");
const $sheetList     = document.getElementById("machine-sheet-list");
const $sheetClose    = document.getElementById("machine-sheet-close");
// PC 表示に戻ったときに元の案内文へ戻すため、HTML に書かれた文言を覚えておく
const MACHINE_INPUT_PLACEHOLDER = $machineInput.placeholder;
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
const $currentGamesGroup = document.getElementById("current-games-group");
const $resetMode     = document.getElementById("reset-mode");
const $resetModeRow  = document.getElementById("reset-mode-row");
const $formRestored  = document.getElementById("form-restored");
const $formError     = document.getElementById("form-error");
const $exchangeRate  = document.getElementById("exchange-rate");
const $summarySetting = document.getElementById("summary-setting");
const $summaryCeiling = document.getElementById("summary-ceiling");
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

// 一覧の描画先。スマホの全画面シートが開いている間はシート内の一覧、それ以外は入力欄の下のドロップダウン
let $activeList = $comboList;

function activeQuery() {
    return $activeList === $comboList ? $machineInput.value : $sheetInput.value;
}

const MACHINE_BY_ID = new Map(MACHINES.map(m => [m.id, m]));

// ---- 検索語の正規化 ----
// 全角/半角・カタカナ/ひらがな・大文字/小文字・空白や記号の有無を同一視する。
// 「すますろ ほくと」「スマスロ北斗」「ＳＢＪ」がどれも当たるようにするため。
const SEARCH_STRIP_CHAR = /[\s・!！?？\-－‐ー～〜~:：☆★.．,，'’"“”()（）［］\[\]、。]/;

/**
 * 1文字ずつ正規化し、正規化後の各文字が元の何文字目から来たかを map に残す。
 * map は機種名の一致箇所を元の表記のままハイライトするために使う。
 */
function normalizeWithMap(str) {
    let text = "";
    const map = [];
    for (let i = 0; i < str.length; i++) {
        for (const ch of str[i].normalize("NFKC").toLowerCase()) {
            if (SEARCH_STRIP_CHAR.test(ch)) continue;
            const code = ch.charCodeAt(0);
            text += (code >= 0x30a1 && code <= 0x30f6) ? String.fromCharCode(code - 0x60) : ch;
            map.push(i);
        }
    }
    return { text, map };
}

/** 検索語の正規化。半角カナの濁点（ｶﾞ）を1文字にまとめるため、先に文字列全体を NFKC にかける */
function normalizeSearch(str) {
    return normalizeWithMap(str.normalize("NFKC")).text;
}

let searchIndex = null;

/** 機種名・別名の正規化結果。入力のたびに作り直さないよう初回に一度だけ作る */
function getSearchIndex() {
    if (!searchIndex) {
        searchIndex = new Map(MACHINES.map(m => [m.id, {
            name: normalizeWithMap(m.name),
            aliases: (m.aliases || []).map(a => ({ raw: a, text: normalizeSearch(a) })),
        }]));
    }
    return searchIndex;
}

/** 入力を空白で区切り、語ごとに正規化する（空白自体は正規化で消えるため先に分ける） */
function toSearchTokens(input) {
    return (input || "").split(/\s+/).map(normalizeSearch).filter(Boolean);
}

/**
 * 機種が全ての検索語に当たるか（語ごとに機種名・別名・id のどれかに当たればよい）。
 * 「すますろ ほくと」のように機種名の一部と別名を組み合わせた入力でも当たるようにするため。
 * 当たれば { start, end }（機種名内の最初の一致範囲）と { alias }（当たった別名）を持つ
 * オブジェクトを、外れなら null を返す。
 */
function matchMachine(m, tokens) {
    const entry = getSearchIndex().get(m.id);
    const hit = {};
    for (const token of tokens) {
        const idx = entry.name.text.indexOf(token);
        if (idx >= 0) {
            if (hit.start === undefined) {
                hit.start = entry.name.map[idx];
                hit.end = entry.name.map[idx + token.length - 1] + 1;
            }
            continue;
        }
        const alias = entry.aliases.find(a => a.text.includes(token));
        if (alias) {
            if (!hit.alias) hit.alias = alias.raw;
            continue;
        }
        if (!m.id.includes(token)) return null;
    }
    return hit;
}

// ---- 絞り込みボタン ----
const NEW_MACHINE_DAYS = 60;

function isNewMachine(m) {
    if (!m.addedDate) return false;
    return Date.now() - new Date(m.addedDate).getTime() <= NEW_MACHINE_DAYS * 24 * 60 * 60 * 1000;
}

// group が同じボタン同士は排他（Aタイプ と AT・ART を同時に押すと必ず0件になるため）
const COMBO_FILTERS = [
    { id: "a",       label: "Aタイプ",  group: "type", test: m => m.type === "A" },
    { id: "at",      label: "AT・ART",  group: "type", test: m => m.type !== "A" },
    { id: "ceiling", label: "天井あり",               test: m => !!m.ceiling },
    { id: "suggest", label: "示唆あり",               test: m => !!m.suggestions },
    { id: "new",     label: "新台",                   test: isNewMachine },
];

const activeFilters = new Set();

function passesFilters(m) {
    return COMBO_FILTERS.every(f => !activeFilters.has(f.id) || f.test(m));
}

function toggleFilter(filter) {
    if (activeFilters.has(filter.id)) {
        activeFilters.delete(filter.id);
    } else {
        if (filter.group) {
            COMBO_FILTERS.forEach(f => { if (f.group === filter.group) activeFilters.delete(f.id); });
        }
        activeFilters.add(filter.id);
    }
    buildComboItems(activeQuery());
    $activeList.scrollTop = 0;
}

function buildFilterBar() {
    const li = document.createElement("li");
    li.className = "combo-filters";
    li.setAttribute("role", "group");
    li.setAttribute("aria-label", "機種の絞り込み");
    COMBO_FILTERS.forEach(f => {
        // 該当0件のボタンは出さない（新台が一定期間追加されないと新台ボタンが空振りになる）
        if (!MACHINES.some(f.test)) return;
        const on = activeFilters.has(f.id);
        const btn = document.createElement("button");
        btn.type = "button";
        btn.className = "combo-filter" + (on ? " on" : "");
        btn.textContent = f.label;
        btn.tabIndex = -1;
        btn.setAttribute("aria-pressed", String(on));
        // mousedown で処理して入力欄のフォーカスを保つ（blur で一覧が閉じるのを防ぐ）
        btn.addEventListener("mousedown", e => { e.preventDefault(); toggleFilter(f); });
        li.appendChild(btn);
    });
    return li;
}

// ---- お気に入り・最近使った機種（この端末のブラウザにだけ保存） ----
const STORAGE_KEY_FAVORITES = "winslot:favorites";
const STORAGE_KEY_RECENT = "winslot:recent";
const RECENT_MAX = 5;

let favoriteIds = [];
let recentIds = [];

/** 保存済みの機種 id 一覧を読む。収録から外れた機種の id は捨てる */
function loadIdList(key) {
    try {
        const ids = JSON.parse(localStorage.getItem(key));
        return Array.isArray(ids) ? ids.filter(id => MACHINE_BY_ID.has(id)) : [];
    } catch (e) {
        return [];
    }
}

function saveIdList(key, ids) {
    try {
        localStorage.setItem(key, JSON.stringify(ids));
    } catch (e) {
        // プライベートモード等で保存できなくても、このページを開いている間は動く
    }
}

function rememberRecent(id) {
    recentIds = [id].concat(recentIds.filter(x => x !== id)).slice(0, RECENT_MAX);
    saveIdList(STORAGE_KEY_RECENT, recentIds);
}

function lastComboItem(id) {
    const items = $activeList.querySelectorAll(`.combo-item[data-id="${id}"]`);
    return items[items.length - 1] || null;
}

function toggleFavorite(id) {
    // 一覧の上部にお気に入り欄が増減しても、押した行が画面上で動かないよう位置を合わせ直す。
    // 機種別の欄（最後に出る行）は常に存在するので、それを基準にする。
    const before = lastComboItem(id);
    const offset = before ? before.offsetTop - $activeList.scrollTop : 0;

    favoriteIds = favoriteIds.includes(id)
        ? favoriteIds.filter(x => x !== id)
        : favoriteIds.concat(id);
    saveIdList(STORAGE_KEY_FAVORITES, favoriteIds);
    buildComboItems(activeQuery());

    const after = lastComboItem(id);
    if (before && after) $activeList.scrollTop = after.offsetTop - offset;
}

// ---- 一覧の組み立て ----
function createComboItem(m, hit) {
    const li = document.createElement("li");
    li.className = "combo-item";
    li.dataset.id = m.id;

    const name = document.createElement("span");
    name.className = "combo-name";
    if (hit.start !== undefined) {
        const mark = document.createElement("span");
        mark.className = "combo-match";
        mark.textContent = m.name.substring(hit.start, hit.end);
        name.append(m.name.substring(0, hit.start), mark, m.name.substring(hit.end));
    } else {
        name.textContent = m.name;
    }
    if (hit.alias) {
        const alias = document.createElement("span");
        alias.className = "combo-alias";
        alias.textContent = hit.alias;
        name.append(alias);
    }
    li.appendChild(name);

    const fav = favoriteIds.includes(m.id);
    const star = document.createElement("button");
    star.type = "button";
    star.className = "combo-fav" + (fav ? " on" : "");
    star.textContent = fav ? "★" : "☆";
    star.tabIndex = -1;
    star.setAttribute("aria-pressed", String(fav));
    star.setAttribute("aria-label", fav ? `${m.name} をお気に入りから外す` : `${m.name} をお気に入りに追加`);
    star.addEventListener("mousedown", e => {
        e.preventDefault();
        e.stopPropagation();   // 行の mousedown（＝機種選択）まで伝えない
        toggleFavorite(m.id);
    });
    li.appendChild(star);

    li.addEventListener("mousedown", e => { e.preventDefault(); selectComboItem(m); });
    return li;
}

function appendComboLabel(text) {
    const label = document.createElement("li");
    label.className = "combo-group-label";
    label.textContent = text;
    $activeList.appendChild(label);
}

function buildComboItems(filter) {
    $activeList.innerHTML = "";
    comboActiveIdx = -1;
    $activeList.appendChild(buildFilterBar());

    const tokens = toSearchTokens(filter);
    const query = tokens.length > 0;
    const hits = new Map();
    MACHINES.forEach(m => {
        if (!passesFilters(m)) return;
        const hit = query ? matchMachine(m, tokens) : {};
        if (hit) hits.set(m.id, hit);
    });

    const sections = [];
    // お気に入り・最近使った機種は文字入力前の一覧だけに出す（検索結果で同じ機種が二重に並ばないように）
    if (!query) {
        const favs = favoriteIds.filter(id => hits.has(id));
        const recents = recentIds.filter(id => hits.has(id) && !favoriteIds.includes(id));
        if (favs.length) sections.push(["★お気に入り", favs]);
        if (recents.length) sections.push(["最近使った機種", recents]);
    }
    ["Aタイプ", "AT / ART機"].forEach(gName => {
        const ids = MACHINES.filter(m => hits.has(m.id) && getMachineGroup(m) === gName).map(m => m.id);
        if (ids.length) sections.push([gName, ids]);
    });

    if (!query && !favoriteIds.length && hits.size) {
        const tip = document.createElement("li");
        tip.className = "combo-tip";
        tip.textContent = "☆ を押すとお気に入りとして一番上に固定できます";
        $activeList.appendChild(tip);
    }

    sections.forEach(([label, ids]) => {
        appendComboLabel(`【${label}】`);
        ids.forEach(id => $activeList.appendChild(createComboItem(MACHINE_BY_ID.get(id), hits.get(id))));
    });

    if (!hits.size) {
        const li = document.createElement("li");
        li.className = "combo-no-match";
        li.textContent = activeFilters.size ? "条件に合う機種がありません（絞り込みを外してください）" : "該当する機種がありません";
        $activeList.appendChild(li);
    }
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
    rememberRecent(machine.id);
    closeCombo();
    closeSheet();
    onMachineChange();
    saveFormState();
    scheduleLiveUpdate();
}

// ============================================================
// スマホ用の全画面の機種選択シート
// 入力欄のドロップダウンだとキーボードが画面の半分を覆って一覧がほとんど見えないため、
// スマホでは画面全体を使う選択画面を開く。開いた時点ではキーボードを出さず、
// 検索欄をタップしたときだけ出す。PC は従来のドロップダウンのまま。
// ============================================================
const SHEET_MEDIA = "(max-width: 600px), (pointer: coarse) and (max-height: 500px)";

function isSheetMode() {
    return !!(window.matchMedia && window.matchMedia(SHEET_MEDIA).matches);
}

function isSheetOpen() {
    return !$machineSheet.hidden;
}

/** スマホでは機種名の欄をタップしてもキーボードを出さず、シートを開く入口にする */
function applyComboMode() {
    if (isSheetMode()) {
        $machineInput.inputMode = "none";
        $machineInput.placeholder = "タップして機種を選ぶ";
    } else {
        $machineInput.removeAttribute("inputmode");
        $machineInput.placeholder = MACHINE_INPUT_PLACEHOLDER;
    }
}

function openSheet() {
    if (isSheetOpen()) return;
    closeCombo();
    $machineInput.blur();
    $sheetInput.value = "";
    $machineSheet.hidden = false;
    document.body.classList.add("sheet-open");
    $activeList = $sheetList;
    buildComboItems("");
    $sheetList.scrollTop = 0;
    // 見出しにフォーカスを移す（検索欄に移すとキーボードが出てしまう）
    $machineSheet.focus();
    // Android の「戻る」でページから離れずシートだけ閉じられるよう、履歴を1つ積む
    if (!(history.state && history.state.machineSheet)) {
        try { history.pushState({ machineSheet: true }, ""); } catch (e) { /* 履歴が使えなくても閉じるボタンで閉じられる */ }
    }
}

/** fromPopstate は「戻る」で閉じたとき（履歴はブラウザが既に戻している） */
function closeSheet(fromPopstate) {
    if (!isSheetOpen()) return;
    $sheetInput.blur();
    $machineSheet.hidden = true;
    document.body.classList.remove("sheet-open");
    $activeList = $comboList;
    $sheetList.innerHTML = "";
    if (!fromPopstate && history.state && history.state.machineSheet) history.back();
}

function initSheet() {
    $sheetClose.addEventListener("click", () => closeSheet());
    $sheetInput.addEventListener("input", () => {
        buildComboItems($sheetInput.value);
        $sheetList.scrollTop = 0;
    });
    // 一覧を指で動かし始めたらキーボードを閉じて、一覧を広く見せる
    $sheetList.addEventListener("touchmove", () => {
        if (document.activeElement === $sheetInput) $sheetInput.blur();
    }, { passive: true });
    $machineSheet.addEventListener("keydown", e => {
        if (e.key === "Escape") closeSheet();
    });
    window.addEventListener("popstate", () => closeSheet(true));
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
            const m = MACHINE_BY_ID.get(id);
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
    favoriteIds = loadIdList(STORAGE_KEY_FAVORITES);
    recentIds = loadIdList(STORAGE_KEY_RECENT);

    applyComboMode();
    if (window.matchMedia) {
        const mq = window.matchMedia(SHEET_MEDIA);
        // 画面の回転などでスマホ表示と PC 表示が入れ替わったときに追従する
        if (mq.addEventListener) mq.addEventListener("change", applyComboMode);
    }

    $machineInput.addEventListener("focus", () => {
        if (isSheetMode()) openSheet(); else openCombo();
    });
    // フォーカスが残ったまま再タップされると focus が来ないので click でも開く
    $machineInput.addEventListener("click", () => {
        if (isSheetMode()) openSheet();
    });
    $machineInput.addEventListener("input", () => {
        $machineSelect.value = "";
        onMachineChange();
        openCombo();
    });
    $machineInput.addEventListener("keydown", comboKeyNav);
    $machineInput.addEventListener("blur", () => setTimeout(closeCombo, 150));
    $comboToggle.addEventListener("click", () => {
        if (isSheetMode()) {
            openSheet();
        } else if ($comboList.classList.contains("open")) {
            closeCombo();
        } else {
            $machineInput.focus();
        }
    });

    document.addEventListener("click", e => {
        if (!$comboWrapper.contains(e.target)) closeCombo();
    });

    initSheet();
}

// ============================================================
// 初期化
// ============================================================
function init() {
    initCombo();
    initExchangeRate();   // 復元時の再計算より前に、保存済みの換金率を反映しておく
    initAccessRanking();
    initNewMachines();
    $analyzeForm.addEventListener("submit", onAnalyze);
    $resetBtn.addEventListener("click", onReset);

    [$totalGames, $bigCount, $regCount].forEach(el => {
        el.addEventListener("input", updateBonusProb);
    });

    attachStepper($bigCount);
    attachStepper($regCount);

    restoreFormState();
    // 示唆欄は機種ごとに作り直されるので、個々の欄ではなくフォームで input をまとめて拾う
    $analyzeForm.addEventListener("input", saveFormState);
    $analyzeForm.addEventListener("input", clearFormError);
    $analyzeForm.addEventListener("input", scheduleLiveUpdate);
    // チェックボックスは環境によって input が飛ばないことがあるので change でも拾う
    $resetMode.addEventListener("change", () => {
        saveFormState();
        scheduleLiveUpdate();
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
            // <label> で包むと中の最初のボタン（−1）が label の対象になり、項目名のタップで回数が減ってしまう
            const row = document.createElement("div");
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
            input.setAttribute("aria-label", item.label);

            row.appendChild(name);
            row.appendChild(input);
            attachStepper(input, item.label);
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
let lastMachineId = null;

function onMachineChange() {
    const machine = getSelectedMachine();
    renderSuggestionInputs(machine);

    // 朝一の切替はリセット天井のある機種だけに出す。
    // 別の台に移ったら朝一かどうかも分からないので外す（同じ機種の選び直しでは残す）
    const hasReset = !!(machine && machine.ceiling && machine.resetCeiling);
    $resetModeRow.hidden = !hasReset;
    const id = machine ? machine.id : null;
    if (!hasReset || id !== lastMachineId) $resetMode.checked = false;
    lastMachineId = id;

    if (!machine) {
        $machineInfoBar.style.display = "none";
        $currentGamesGroup.style.display = "";
        return;
    }

    $machineInfoBar.style.display = "flex";
    $machineTypeBadge.textContent = machine.type === "A" ? "Aタイプ" : "AT / ART機";

    if (machine.ceiling) {
        $machineCeilingInfo.textContent = `天井: ${machine.ceiling}G` + (machine.resetCeiling ? `（朝一 ${machine.resetCeiling}G）` : "");
        $machineCeilingInfo.style.display = "";
        $currentGamesGroup.style.display = "";
    } else {
        $machineCeilingInfo.style.display = "none";
        // 天井の無い機種では現在ゲーム数を使わないので、欄ごと隠して値も捨てる
        $currentGamesGroup.style.display = "none";
        $currentGames.value = "";
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
    if (analyze({ scroll: true })) saveFormState();
}

/**
 * 入力から結果を描画する。表示できたら true。
 * scroll=false は復元時・自動更新時用（画面が勝手に結果まで飛ばないように）。
 * quiet=true は自動更新時用。入力途中で計算できないだけなので、エラーは出さない。
 */
function analyze({ scroll, quiet = false }) {
    const fail = message => {
        if (!quiet) showFormError(message);
        return false;
    };
    const machine = getSelectedMachine();
    if (!machine) return fail("機種を選択してください");

    const totalGames  = parseInt($totalGames.value) || 0;
    const currentGames = parseInt($currentGames.value) || 0;
    const bigCount    = parseInt($bigCount.value) || 0;
    const regCount    = parseInt($regCount.value) || 0;

    const hasTotalGames = totalGames > 0;
    const hasCurrentGames = currentGames > 0;
    const ceilingOnly = !hasTotalGames && hasCurrentGames;

    if (!hasTotalGames && !hasCurrentGames) {
        // 天井の無い機種は現在ゲーム数の欄自体を隠しているので、総ゲーム数だけを案内する
        return fail(machine.ceiling ? "総ゲーム数または現在ゲーム数を入力してください" : "総ゲーム数を入力してください");
    }

    let posteriors = null;
    if (hasTotalGames) {
        const suggestionDetail = buildSuggestionDetail(
            machine, resolveTrials(machine, bigCount, regCount), collectSuggestionCounts());
        // 示唆なし版も出しておき、示唆がどれだけ効いたかを結果欄で見せる
        const plain = estimateSettings(machine, totalGames, bigCount, regCount, null);
        const results = suggestionDetail
            ? estimateSettings(machine, totalGames, bigCount, regCount, suggestionDetail)
            : plain;
        posteriors = results;
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
        return fail("この機種には天井情報がありません。設定推測を行うには総ゲーム数を入力してください。");
    }

    renderSummary(machine, posteriors, totalGames, currentGames);
    clearFormError();
    $resultsSection.style.display = "";
    liveResults = true;
    // 結論カードが先頭にあるので、天井だけのときも結果の先頭へ
    if (scroll) $resultsSection.scrollIntoView({ behavior: "smooth", block: "start" });
    return true;
}

// 一度結果を出したら、以降は入力を変えるたびに結果を出し直す。
// ＋1 を押すたびに推測ボタンまで戻って押し直さなくて済むように。
let liveResults = false;
let liveTimer = null;

function scheduleLiveUpdate() {
    if (!liveResults) return;
    clearTimeout(liveTimer);
    // 数字を続けて打っている間は待ち、手が止まってから1回だけ計算する
    liveTimer = setTimeout(() => {
        // 打ち直し途中などで計算できないときは古い結果を残さない（別の機種や古い数字の結果が残ると誤解を招く）
        if (!analyze({ scroll: false, quiet: true })) $resultsSection.style.display = "none";
        saveFormState();
    }, 150);
}

function stopLiveUpdate() {
    liveResults = false;
    clearTimeout(liveTimer);
}

// ============================================================
// 回数の ＋1 / −1 ボタン
// 打ちながら数えるときにキーボードを出さずに片手で増減できるようにする。
// 欄は直接入力もできるまま残す。
// ============================================================
let stepperSeq = 0;

/**
 * input の両脇に −1 / ＋1 ボタンを付ける。
 * name は読み上げ用の項目名。文字列なら aria-label に、省略時は input の <label> を
 * aria-labelledby で参照する（BIG/REG は機種によってラベル文言が変わるため）。
 */
function attachStepper(input, name) {
    const wrap = document.createElement("div");
    wrap.className = "stepper";
    input.parentNode.insertBefore(wrap, input);

    const makeButton = (delta, text) => {
        const btn = document.createElement("button");
        btn.type = "button";
        btn.className = "stepper-btn " + (delta > 0 ? "stepper-plus" : "stepper-minus");
        btn.textContent = text;
        btn.id = `stepper-${++stepperSeq}`;
        if (typeof name === "string") {
            btn.setAttribute("aria-label", `${name}を1${delta > 0 ? "増やす" : "減らす"}`);
        } else {
            const label = input.id && document.querySelector(`label[for="${input.id}"]`);
            if (label && label.id) btn.setAttribute("aria-labelledby", `${label.id} ${btn.id}`);
        }
        btn.addEventListener("click", () => stepInput(input, delta));
        return btn;
    };

    wrap.appendChild(makeButton(-1, "−1"));
    wrap.appendChild(input);
    wrap.appendChild(makeButton(1, "＋1"));
}

function stepInput(input, delta) {
    const current = parseInt(input.value, 10) || 0;
    if (delta < 0 && current <= 0) return;   // 0 未満にはしない（空欄のまま −1 を押しても何もしない）
    input.value = String(current + delta);
    // 合算確率の再計算・入力の保存は input イベントで動くので、手入力と同じ経路に乗せる
    input.dispatchEvent(new Event("input", { bubbles: true }));
    // 押したことが目で分かるよう一瞬光らせる（連打でも毎回光るよう付け直す）
    input.classList.remove("stepped");
    void input.offsetWidth;
    input.classList.add("stepped");
}

// ============================================================
// 入力エラーの表示（alert は操作が止まるので、推測ボタンの真上に出す）
// ============================================================
function showFormError(message) {
    $formError.textContent = message;
    $formError.hidden = false;
}

function clearFormError() {
    $formError.hidden = true;
    $formError.textContent = "";
}

// ============================================================
// 入力内容の保存・復元
// スマホのブラウザは裏に回したタブを読み込み直すことが多く、ホールで台を打ちながら
// アプリを切り替えると入力が消えてしまう。この端末のブラウザにだけ保存して開き直したときに戻す。
// ============================================================
const STORAGE_KEY_FORM = "winslot:form";
// 1日の稼働（開店〜閉店）に収まる長さ。翌日に前日の台のデータが出てこないようにする
const FORM_STATE_TTL_MS = 12 * 60 * 60 * 1000;

function saveFormState() {
    const machine = getSelectedMachine();
    if (!machine && !hasFormInput()) {
        clearFormState();
        return;
    }
    const suggestions = {};
    $suggestionInputs.querySelectorAll("input.suggestion-count").forEach(el => {
        if (el.value !== "") suggestions[el.dataset.group + "/" + el.dataset.item] = el.value;
    });
    const state = {
        savedAt: Date.now(),
        machineId: machine ? machine.id : null,
        totalGames: $totalGames.value,
        bigCount: $bigCount.value,
        regCount: $regCount.value,
        resetMode: $resetMode.checked,
        currentGames: $currentGames.value,
        suggestions,
        analyzed: $resultsSection.style.display !== "none",
    };
    try {
        localStorage.setItem(STORAGE_KEY_FORM, JSON.stringify(state));
    } catch (e) {
        // 保存できない環境（プライベートモード等）では復元されないだけで、入力自体は動く
    }
}

function clearFormState() {
    try {
        localStorage.removeItem(STORAGE_KEY_FORM);
    } catch (e) {
        // 同上
    }
}

function restoreFormState() {
    let state;
    try {
        state = JSON.parse(localStorage.getItem(STORAGE_KEY_FORM));
    } catch (e) {
        return;
    }
    if (!state || typeof state !== "object") return;
    if (!(Date.now() - state.savedAt < FORM_STATE_TTL_MS)) {
        clearFormState();
        return;
    }

    const machine = state.machineId ? MACHINE_BY_ID.get(state.machineId) : null;
    if (machine) {
        $machineInput.value = machine.name;
        $machineSelect.value = machine.id;
        onMachineChange();   // 機種に合わせてラベル・示唆欄・現在ゲーム数欄の表示を整える
    }

    const setValue = (el, v) => { if (typeof v === "string" && el.closest(".form-group").style.display !== "none") el.value = v; };
    setValue($totalGames, state.totalGames);
    setValue($bigCount, state.bigCount);
    setValue($regCount, state.regCount);
    setValue($currentGames, state.currentGames);
    // 切替は表示中（＝リセット天井のある機種）のときだけ戻す
    $resetMode.checked = state.resetMode === true && !$resetModeRow.hidden;

    const suggestions = state.suggestions || {};
    let anySuggestion = false;
    $suggestionInputs.querySelectorAll("input.suggestion-count").forEach(el => {
        const v = suggestions[el.dataset.group + "/" + el.dataset.item];
        if (typeof v === "string") {
            el.value = v;
            anySuggestion = true;
        }
    });
    // 数えていた示唆回数が畳まれたままだと消えたように見えるので開いておく
    if (anySuggestion) $suggestionInputs.querySelector("details").open = true;

    updateBonusProb();
    if (!machine && !hasFormInput()) return;

    const saved = new Date(state.savedAt);
    const hh = String(saved.getHours()).padStart(2, "0");
    const mm = String(saved.getMinutes()).padStart(2, "0");
    $formRestored.textContent = `前回の入力を復元しました（${saved.getMonth() + 1}/${saved.getDate()} ${hh}:${mm} 保存）`;
    $formRestored.hidden = false;

    if (state.analyzed && machine) analyze({ scroll: false });
}

/** 入力欄（機種名・数値・示唆回数）に何か入っているか */
function hasFormInput() {
    return Array.from($analyzeForm.querySelectorAll("input"))
        // チェックボックスの value は常に "on" なので、チェックの有無で見る
        .some(el => el.type === "checkbox" ? el.checked : el.type !== "hidden" && !el.readOnly && el.value.trim() !== "");
}

function onReset() {
    // 打ちながらの誤タップで数えた回数が消えると取り返せないので、入力があるときだけ確認する
    if (hasFormInput() && !confirm("入力内容をすべて消去しますか？")) return;
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
    $currentGamesGroup.style.display = "";
    $formRestored.hidden = true;
    $resetModeRow.hidden = true;
    lastMachineId = null;
    clearFormError();
    renderSuggestionSummary(null);
    clearFormState();
    stopLiveUpdate();
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
/**
 * exchangeYen は回収メダル1枚の換金額。投資は現金で借りる前提なので常に1枚 MEDAL_RENT_YEN 円。
 * 非等価では回収側だけが目減りするため、回収と投資を分けて円にする（等価なら従来の ev*20 と一致）。
 */
function calculateCeilingEV(machine, currentGames, overrideCeiling, exchangeYen = MEDAL_RENT_YEN) {
    const ceiling = overrideCeiling || machine.ceiling;
    const ceilingReward = machine.ceilingReward;
    if (!ceiling || currentGames >= ceiling) return null;

    const s1key = Object.keys(machine.settings).map(Number).sort((a, b) => a - b)[0];
    const s1 = machine.settings[s1key];
    const pBonus = 1 / s1.big;
    const remaining = ceiling - currentGames;
    const costPerGame = machine.normalCostPerGame;

    let reward = 0;
    let cost = 0;
    for (let g = 1; g <= remaining; g++) {
        const pFirstAt = Math.pow(1 - pBonus, g - 1) * pBonus;
        reward += pFirstAt * machine.avgBonusReward;
        cost += pFirstAt * g * costPerGame;
    }
    const pReachCeiling = Math.pow(1 - pBonus, remaining);
    reward += pReachCeiling * ceilingReward;
    cost += pReachCeiling * remaining * costPerGame;

    return {
        evMedals: reward - cost,
        evYen: reward * exchangeYen - cost * MEDAL_RENT_YEN,
        pReachCeiling: pReachCeiling * 100
    };
}

// ============================================================
// 換金率（天井期待値の円換算に使う。この端末に保存して次回も使う）
// ============================================================
const MEDAL_RENT_YEN = 20;   // 貸しメダル 1000円/50枚
const EXCHANGE_RATES = [
    { id: "5.0", label: "等価（5.0枚）", yen: 100 / 5.0 },
    { id: "5.5", label: "5.5枚交換",    yen: 100 / 5.5 },
    { id: "5.6", label: "5.6枚交換",    yen: 100 / 5.6 },
    { id: "6.0", label: "6.0枚交換",    yen: 100 / 6.0 },
];
const STORAGE_KEY_EXCHANGE = "winslot:exchange";

function getExchangeRate() {
    return EXCHANGE_RATES.find(r => r.id === $exchangeRate.value) || EXCHANGE_RATES[0];
}

function initExchangeRate() {
    EXCHANGE_RATES.forEach(r => {
        const opt = document.createElement("option");
        opt.value = r.id;
        opt.textContent = r.label;
        $exchangeRate.appendChild(opt);
    });
    try {
        const saved = localStorage.getItem(STORAGE_KEY_EXCHANGE);
        if (EXCHANGE_RATES.some(r => r.id === saved)) $exchangeRate.value = saved;
    } catch (e) {
        // 読めなければ等価のまま
    }
    $exchangeRate.addEventListener("change", () => {
        try {
            localStorage.setItem(STORAGE_KEY_EXCHANGE, $exchangeRate.value);
        } catch (e) {
            // 保存できなくても、このページを開いている間は選んだ換金率で計算する
        }
        // 結論カードの判定も換金率で変わるので、天井欄だけでなく全体を出し直す
        if (liveResults) analyze({ scroll: false, quiet: true });
    });
}

// ============================================================
// 描画: 設定推測結果
// ============================================================
// ============================================================
// 結論カード（結果の先頭。ホールで画面を見て一目で判断できるよう要点だけ大きく出す）
// ============================================================
// 総ゲーム数がこれ未満だと、どの設定もほぼ横並びで「最有力」が当てにならない
const FEW_GAMES = 1500;
const SOME_GAMES = 3000;

function ceilingVerdict(evYen) {
    return evYen >= 0 ? "打つべき！" : "まだ早い";
}

/** [4, 5, 6] → "4〜6"、[5, 6] → "5・6"、[4, 6] → "4・6" */
function formatSettingKeys(keys) {
    const consecutive = keys.every((k, i) => i === 0 || k === keys[i - 1] + 1);
    return consecutive && keys.length >= 3 ? `${keys[0]}〜${keys[keys.length - 1]}` : keys.join("・");
}

function fillSummaryBlock(el, { label, value, valueClass, sub, warn }) {
    el.innerHTML = "";
    const add = (cls, text) => {
        const node = document.createElement("div");
        node.className = cls;
        node.textContent = text;
        el.appendChild(node);
    };
    add("summary-label", label);
    add("summary-value" + (valueClass ? " " + valueClass : ""), value);
    if (sub) add("summary-sub", sub);
    if (warn) add("summary-warn", warn);
    el.hidden = false;
}

function renderSummary(machine, posteriors, totalGames, currentGames) {
    if (posteriors) {
        // 設定キーは機種によって 1〜6 が揃っていない（設定3が無い等）ので、実在するキーから数える
        const keys = Object.keys(posteriors).map(Number).sort((a, b) => a - b);
        const best = keys.reduce((a, b) => (posteriors[b] >= posteriors[a] ? b : a));
        const high = keys.filter(k => k >= 4);
        const pct = p => (p * 100).toFixed(1) + "%";
        const games = totalGames.toLocaleString() + "G";
        fillSummaryBlock($summarySetting, high.length ? {
            label: `高設定（${formatSettingKeys(high)}）の可能性`,
            value: pct(high.reduce((sum, k) => sum + posteriors[k], 0)),
            sub: `最有力: 設定${best}（${pct(posteriors[best])}）`,
            warn: totalGames < FEW_GAMES ? `まだ${games}なので、ほぼ判断できません（参考程度に）`
                : totalGames < SOME_GAMES ? `${games}はまだ少なめです（参考程度に）` : "",
        } : {
            label: "最も可能性の高い設定",
            value: `設定${best}`,
            sub: pct(posteriors[best]),
        });
    } else {
        $summarySetting.hidden = true;
    }

    if (machine.ceiling && currentGames > 0) {
        const rate = getExchangeRate();
        const c = activeCeiling(machine);
        const ev = calculateCeilingEV(machine, currentGames, c.ceiling, rate.yen);
        // 朝一リセットで天井が変わる機種は、どちらの天井で判定したかを明記する
        const mode = machine.resetCeiling ? (c.isReset ? "・朝一" : "・通常時") : "";
        const label = `天井狙い（${currentGames.toLocaleString()}G${mode}）`;
        if (ev) {
            const yen = Math.round(ev.evYen);
            fillSummaryBlock($summaryCeiling, {
                label,
                value: ceilingVerdict(ev.evYen),
                valueClass: ev.evYen >= 0 ? "positive" : "negative",
                sub: `期待値 ${yen >= 0 ? "+" : ""}${yen.toLocaleString()}円（${rate.label}）`,
            });
        } else {
            fillSummaryBlock($summaryCeiling, {
                label,
                value: "天井到達済み",
                sub: `現在ゲーム数が天井（${c.ceiling}G）以上です`,
            });
        }
    } else {
        $summaryCeiling.hidden = true;
    }
}

function renderSettingResults(posteriors, machine) {
    const maxProb = Math.max(...Object.values(posteriors));
    let bestSetting = 1;

    // 同じ機種の結果を出し直すとき（入力変更での自動更新）は、棒を0から伸ばし直さずにその場で更新する。
    // ＋1 を押すたびに全部の棒が縮んで伸びると、どこが変わったのか分からなくなるため。
    const rows = $settingResults.querySelectorAll(".setting-row");
    const reuse = $settingResults.dataset.machine === machine.id && rows.length === Object.keys(posteriors).length;
    if (!reuse) {
        $settingResults.innerHTML = "";
        $settingResults.dataset.machine = machine.id;
    }

    Object.entries(posteriors).forEach(([s, prob], i) => {
        if (prob >= maxProb) bestSetting = s;
        const pct = (prob * 100).toFixed(1);
        const barWidth = maxProb > 0 ? (prob / maxProb) * 100 : 0;

        if (reuse) {
            rows[i].querySelector(".setting-bar").style.width = barWidth + "%";
            rows[i].querySelector(".setting-percent").textContent = pct + "%";
            return;
        }

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
    const rate = getExchangeRate();
    const isEqual = rate.yen === MEDAL_RENT_YEN;
    // 狙い目は機種データ側の値（等価前提）なので、非等価ではそう明記する
    items.push({ label: isEqual ? "狙い目" : "狙い目（等価の目安）", value: `${ceilingTarget}G〜`, cls: "neutral", highlight: false });

    if (currentGames > 0) {
        const remaining = Math.max(0, ceiling - currentGames);
        items.push({ label: "天井までの残りゲーム数", value: `${remaining}G`, cls: "neutral" });

        const evData = calculateCeilingEV(machine, currentGames, ceiling, rate.yen);
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
            // 判定は選んだ換金率での期待値で決める（狙い目Gは等価前提の固定値なので、非等価だと期待値と食い違う）
            items.push({
                label: "狙い目判定",
                value: ceilingVerdict(evData.evYen),
                cls: isPositive ? "positive" : "negative",
                highlight: isPositive
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

/** 結果に使う天井。朝一・設定変更後の切替がオンで、その機種にリセット天井があればそちらを使う */
function activeCeiling(machine) {
    if ($resetMode.checked && machine.resetCeiling) {
        return { isReset: true, label: "朝一・設定変更後", ceiling: machine.resetCeiling, target: machine.resetCeilingTarget };
    }
    return { isReset: false, label: "通常時", ceiling: machine.ceiling, target: machine.ceilingTarget };
}

function renderCeiling(machine, currentGames) {
    if (!machine.ceiling) {
        $ceilingSection.style.display = "none";
        return;
    }

    $ceilingSection.style.display = "";
    $ceilingResults.innerHTML = "";

    // 通常時と朝一リセット時を両方並べると判定が2つ出て迷うので、フォームの切替に合う方だけ出す
    const c = activeCeiling(machine);
    renderCeilingBlock($ceilingResults, c.label, c.ceiling, c.target, machine, currentGames);

    if (machine.resetCeiling) {
        const other = document.createElement("p");
        other.className = "ceiling-other-mode";
        other.textContent = c.isReset
            ? `参考: 通常時の天井は ${machine.ceiling}G（入力欄の「朝一・設定変更後」を外すと切り替わります）`
            : `参考: 朝一・設定変更後の天井は ${machine.resetCeiling}G（入力欄の「朝一・設定変更後」で切り替えられます）`;
        $ceilingResults.appendChild(other);
    }

    const note = document.createElement("div");
    note.className = "ceiling-note";
    const rate = getExchangeRate();
    note.textContent = "※ 期待値は設定1を基準に、通常時の消費メダルと天井恩恵から算出した概算値です。" +
        "実際の期待値はモード状態や前兆等により変動します。" +
        `投資は現金（1枚${MEDAL_RENT_YEN}円）、回収は${rate.label}（1枚${rate.yen.toFixed(2).replace(/\.?0+$/, "")}円）で換算。` +
        "判定は期待値がプラスなら「打つべき！」です。" +
        (rate.yen === MEDAL_RENT_YEN ? "" : "狙い目Gは等価を前提にした目安です。");
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
