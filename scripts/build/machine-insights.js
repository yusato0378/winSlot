/**
 * 機種ページに載せる「このサイトの計算から出した独自データ」。
 *
 * - 天井期待値: app.js の calculateCeilingEV と同じ式（投資は現金1枚20円・回収は換金率）。
 *   ブラウザ側と数字が食い違わないよう、式を変えるときは両方を揃えること
 *   （dist を読む検証で全機種の一致を確かめている）。
 * - 期待値がプラスになる回転数: 上の期待値が 0 以上になる最小の現在ゲーム数（10G 刻み）。
 * - 1日回したときの設定の見分けやすさ: app.js の estimateSettings と同じ尤度モデル
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

/**
 * 天井期待値の計算に使う値。app.js の ceilingEvParams と同じ。
 * `ceilingEv` がある機種は、公表の機械割や解析サイトの期待値に合わせて調整した値を使う
 * （設定判別に使う settings[].big は CZ 確率などで、天井のカウントが戻る当たりと違う機種があるため）。
 * isReset は朝一・設定変更後の天井で計算するとき。`ceilingEv.resetAvgReward` があればその平均獲得を使う。
 */
function ceilingEvParams(machine, isReset = false) {
    const s1 = machine.settings[settingKeysOf(machine)[0]];
    const ev = machine.ceilingEv;
    return ev ? {
        hitRate: ev.hitRate, avgReward: (isReset && ev.resetAvgReward) || ev.avgReward, ceilingReward: ev.ceilingReward, costPerGame: ev.costPerGame,
    } : {
        hitRate: s1.big, avgReward: machine.avgBonusReward, ceilingReward: machine.ceilingReward, costPerGame: machine.normalCostPerGame,
    };
}

/** 天井の仕組みが「ゲーム数で決まった当たり」の形で表せず、期待値を計算しない機種か */
function isCeilingEvSupported(machine) {
    return !!machine.ceiling && !machine.ceilingEvUnsupported;
}

/** app.js の calculateCeilingEV と同じ。currentGames が天井以上なら null */
function calculateCeilingEV(machine, currentGames, ceiling, exchangeYen = MEDAL_RENT_YEN) {
    if (!ceiling || currentGames >= ceiling) return null;
    const params = ceilingEvParams(machine, !!machine.resetCeiling && ceiling === machine.resetCeiling);
    const pBonus = 1 / params.hitRate;
    const remaining = ceiling - currentGames;
    const costPerGame = params.costPerGame;

    let reward = 0;
    let cost = 0;
    for (let g = 1; g <= remaining; g++) {
        const pFirstAt = Math.pow(1 - pBonus, g - 1) * pBonus;
        reward += pFirstAt * params.avgReward;
        cost += pFirstAt * g * costPerGame;
    }
    const pReachCeiling = Math.pow(1 - pBonus, remaining);
    reward += pReachCeiling * params.ceilingReward;
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
    if (!isCeilingEvSupported(machine) || !isCeilingModelConsistent(machine)) return null;
    return EXCHANGE_RATES.map(rate => ({
        rate,
        normal: breakEvenGames(machine, machine.ceiling, rate.yen),
        reset: machine.resetCeiling ? breakEvenGames(machine, machine.resetCeiling, rate.yen) : undefined,
    }));
}

// 人が1日に回せるのは多くて1万G前後。「1日」は打ち始めから閉店までしっかり回した場合の目安
const DAY_GAMES = 8000;
const HALF_DAY_GAMES = 3000;

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

/** 標準正規分布の累積分布関数（Abramowitz & Stegun 7.1.26。誤差 1.5e-7 以下） */
function normalCdf(x) {
    const t = 1 / (1 + 0.3275911 * Math.abs(x) / Math.SQRT2);
    const poly = t * (0.254829592 + t * (-0.284496736 + t * (1.421413741 + t * (-1.453152027 + t * 1.061405429))));
    const erf = 1 - poly * Math.exp(-(x * x) / 2);
    return x >= 0 ? (1 + erf) / 2 : (1 - erf) / 2;
}

/**
 * 最高設定の台を games ゲーム回したとき、データが最低設定より最高設定寄りになる確率。
 * 対数尤度比の和を正規近似して求める（P = Φ(√N・μ/σ)）。
 * 必要なゲーム数を出す形だと、多くの機種で人が1日に回せる量（約1万G）を超えて現実的でないため、
 * ゲーム数を固定して確率で見せる。
 * @returns {{ low: number, high: number, prob: number | null }} prob は 0〜1。設定差が無ければ null
 */
function discriminationProbability(machine, games) {
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

    if (!(mean > 0)) return { low, high, prob: null };
    return { low, high, prob: normalCdf(Math.sqrt(games) * mean / Math.sqrt(variance)) };
}

/** 1日（DAY_GAMES）回したときの確率から、見分けやすさを一言で */
function discriminationLevel(prob) {
    if (prob === null) return "ゲーム数では見分けられない";
    if (prob >= 0.9) return "1日回せばかなり見分けられる";
    if (prob >= 0.8) return "1日回すと傾向が見える";
    if (prob >= 0.7) return "1日回してもまだ迷いやすい";
    return "ゲーム数だけでは見分けにくい";
}

module.exports = {
    settingKeysOf,
    ceilingEvParams,
    isCeilingEvSupported,
    MEDAL_RENT_YEN,
    EXCHANGE_RATES,
    calculateCeilingEV,
    breakEvenGames,
    breakEvenTable,
    isCeilingModelConsistent,
    discriminationProbability,
    discriminationLevel,
    DAY_GAMES,
    HALF_DAY_GAMES,
};
