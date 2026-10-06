/**
 * 機種ページに載せる「このサイトの計算から出した独自データ」。
 *
 * - 天井期待値: app.js の calculateCeilingEV と同じ式（投資は現金1枚20円・回収は換金率）。
 *   ブラウザ側と数字が食い違わないよう、式を変えるときは両方を揃えること
 *   （dist を読む検証で全機種の一致を確かめている）。
 * - 期待値がプラスになる回転数: 上の期待値が 0 以上になる最小の現在ゲーム数（10G 刻み）。
 * - 設定判別に必要なゲーム数: app.js の estimateSettings と同じ尤度モデル
 *   （BIG と REG をそれぞれ1ゲームごとの独立な当選として扱う）で、最低設定と最高設定を比べる。
 */

const MEDAL_RENT_YEN = 20;   // 貸しメダル 1000円/50枚
// app.js の EXCHANGE_RATES と同じ並び・値
const EXCHANGE_RATES = [
    { id: "5.0", label: "等価（5.0枚）", yen: 100 / 5.0 },
    { id: "5.5", label: "5.5枚交換",    yen: 100 / 5.5 },
    { id: "5.6", label: "5.6枚交換",    yen: 100 / 5.6 },
    { id: "6.0", label: "6.0枚交換",    yen: 100 / 6.0 },
];

function settingKeysOf(machine) {
    return Object.keys(machine.settings).map(Number).sort((a, b) => a - b);
}

/** app.js の calculateCeilingEV と同じ。currentGames が天井以上なら null */
function calculateCeilingEV(machine, currentGames, ceiling, exchangeYen = MEDAL_RENT_YEN) {
    if (!ceiling || currentGames >= ceiling) return null;
    const s1 = machine.settings[settingKeysOf(machine)[0]];
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
    reward += pReachCeiling * machine.ceilingReward;
    cost += pReachCeiling * remaining * costPerGame;

    return {
        evMedals: reward - cost,
        evYen: reward * exchangeYen - cost * MEDAL_RENT_YEN,
        pReachCeiling: pReachCeiling * 100,
    };
}

const BREAK_EVEN_STEP = 10;

/**
 * 期待値が 0 以上になる最小の現在ゲーム数（10G 刻み）。
 * 天井の直前まで回してもプラスにならなければ null。
 * 期待値は現在ゲーム数に対して単調とは限らない（恩恵や消費の設定次第）ので、二分探索せず頭から順に見る。
 */
function breakEvenGames(machine, ceiling, exchangeYen) {
    for (let g = 0; g < ceiling; g += BREAK_EVEN_STEP) {
        const ev = calculateCeilingEV(machine, g, ceiling, exchangeYen);
        if (ev && ev.evYen >= 0) return g;
    }
    return null;
}

/**
 * 天井期待値の入力（純増・通常時の消費・天井恩恵）が出玉率と矛盾していないか。
 *
 * 当たった直後（0G）は台が毎回戻ってくる状態なので、設定1を0Gから次の当たりまで打つ期待値がプラスなら、
 * その台を打ち続けるだけで勝てる＝出玉率が100%を超えることになる。設定1の出玉率は100%未満なので、
 * 通常時の天井で0Gからプラスになるなら入力値のどれかが実際より甘い（朝一リセットは最初の1回だけなので対象外）。
 */
function isCeilingModelConsistent(machine) {
    const ev = calculateCeilingEV(machine, 0, machine.ceiling, MEDAL_RENT_YEN);
    return !ev || ev.evYen < 0;
}

/**
 * 換金率ごとの「期待値がプラスになる回転数」。朝一リセットのある機種は朝一側も出す。
 * 入力値が出玉率と矛盾する機種は、誤った「いつでもプラス」を載せないよう null を返す。
 */
function breakEvenTable(machine) {
    if (!machine.ceiling || !isCeilingModelConsistent(machine)) return null;
    return EXCHANGE_RATES.map(rate => ({
        rate,
        normal: breakEvenGames(machine, machine.ceiling, rate.yen),
        reset: machine.resetCeiling ? breakEvenGames(machine, machine.resetCeiling, rate.yen) : undefined,
    }));
}

// 標準正規分布の 90% 点。「9割の確率で」の 9割
const Z_90 = 1.2816;
// これを超えるゲーム数は「ゲーム数だけではほぼ見分けられない」として数字を出さない
const DISCRIMINATION_CAP = 20000;

/**
 * 1ゲームあたりの対数尤度比（高設定 / 低設定）の平均と分散。真の設定が高設定のときの値。
 * 当選確率 pH（高設定）・pL（低設定）のベルヌーイ1回ぶん。
 */
function bernoulliLlr(pH, pL) {
    const win = Math.log(pH / pL);
    const lose = Math.log((1 - pH) / (1 - pL));
    const mean = pH * win + (1 - pH) * lose;              // = KL(pH || pL)
    const variance = pH * (1 - pH) * (win - lose) ** 2;
    return { mean, variance };
}

/**
 * 最高設定の台を打ったとき、何ゲーム回せば「9割の確率で、データが最低設定より最高設定寄りになる」か。
 * 対数尤度比の和を正規近似して求める（N = (z・σ/μ)²）。
 * @returns {{ low: number, high: number, games: number | null }} games は100G単位に切り上げ。上限超えは null
 */
function discriminationGames(machine) {
    const keys = settingKeysOf(machine);
    const low = keys[0];
    const high = keys[keys.length - 1];
    const L = machine.settings[low];
    const H = machine.settings[high];

    let mean = 0;
    let variance = 0;
    const add = (pH, pL) => {
        if (!(pH > 0 && pL > 0) || pH === pL) return;
        const r = bernoulliLlr(pH, pL);
        mean += r.mean;
        variance += r.variance;
    };
    add(1 / H.big, 1 / L.big);
    if (H.reg !== null && L.reg !== null) add(1 / H.reg, 1 / L.reg);

    if (mean <= 0) return { low, high, games: null };
    const n = (Z_90 * Math.sqrt(variance) / mean) ** 2;
    const games = Math.ceil(n / 100) * 100;
    return { low, high, games: games > DISCRIMINATION_CAP ? null : games };
}

/** 1日しっかり回せるゲーム数の目安との比較で、見分けやすさを一言で */
function discriminationLevel(games) {
    if (games === null) return "ゲーム数だけではほぼ見分けられない";
    if (games <= 3000) return "比較的見分けやすい";
    if (games <= 8000) return "1日しっかり回すと傾向が見える";
    return "ゲーム数だけでは見分けにくい";
}

module.exports = {
    settingKeysOf,
    MEDAL_RENT_YEN,
    EXCHANGE_RATES,
    calculateCeilingEV,
    breakEvenGames,
    breakEvenTable,
    isCeilingModelConsistent,
    discriminationGames,
    discriminationLevel,
    DISCRIMINATION_CAP,
};
