/* ========================================
   パチスロ設定推測ツール - Application
   ======================================== */

// ============================================================
// 機種データ
// bigProb / regProb / koyakuProb は「1/X」の X（分母）で格納
// ceiling: 天井ゲーム数 (null = 天井なし)
// ceilingTarget: 狙い目ゲーム数
// ceilingReward: 天井到達時の平均獲得メダル
// avgBonusReward: 通常ボーナス平均獲得メダル
// normalCostPerGame: 通常時1ゲームあたり純消費メダル
// ============================================================
const MACHINES = [
    // ==================== Aタイプ ====================
    {
        id: "aim_juggler_ex",
        name: "アイムジャグラーEX",
        type: "A",
        bigLabel: "BIG",
        regLabel: "REG",
        koyakuName: "ブドウ",
        settings: {
            1: { big: 273.1, reg: 439.8, koyaku: 6.10, payout: 97.0 },
            2: { big: 270.8, reg: 399.6, koyaku: 6.09, payout: 98.0 },
            3: { big: 269.7, reg: 331.0, koyaku: 6.08, payout: 99.9 },
            4: { big: 259.0, reg: 315.1, koyaku: 6.07, payout: 102.0 },
            5: { big: 259.0, reg: 255.0, koyaku: 6.05, payout: 104.2 },
            6: { big: 255.0, reg: 255.0, koyaku: 5.83, payout: 105.5 }
        },
        ceiling: null, ceilingTarget: null, ceilingReward: null,
        avgBonusReward: 250, normalCostPerGame: 1.8,
        addedDate: "2026-03-01"
    },
    {
        id: "my_juggler_v",
        name: "マイジャグラーV",
        type: "A",
        bigLabel: "BIG",
        regLabel: "REG",
        koyakuName: "ブドウ",
        settings: {
            1: { big: 273.1, reg: 409.6, koyaku: 5.95, payout: 97.0 },
            2: { big: 270.8, reg: 385.5, koyaku: 5.92, payout: 98.0 },
            3: { big: 266.4, reg: 336.1, koyaku: 5.88, payout: 99.9 },
            4: { big: 254.0, reg: 290.0, koyaku: 5.80, payout: 102.8 },
            5: { big: 240.1, reg: 268.6, koyaku: 5.70, payout: 105.3 },
            6: { big: 229.1, reg: 229.1, koyaku: 5.56, payout: 109.4 }
        },
        ceiling: null, ceilingTarget: null, ceilingReward: null,
        avgBonusReward: 250, normalCostPerGame: 1.8,
        addedDate: "2026-03-01"
    },
    {
        id: "funky_juggler_2",
        name: "ファンキージャグラー2",
        type: "A",
        bigLabel: "BIG",
        regLabel: "REG",
        koyakuName: "ブドウ",
        settings: {
            1: { big: 266.4, reg: 439.8, koyaku: 5.94, payout: 97.0 },
            2: { big: 259.0, reg: 407.1, koyaku: 5.92, payout: 98.5 },
            3: { big: 256.0, reg: 366.1, koyaku: 5.88, payout: 99.8 },
            4: { big: 249.2, reg: 322.8, koyaku: 5.83, payout: 102.0 },
            5: { big: 240.1, reg: 299.3, koyaku: 5.76, payout: 104.3 },
            6: { big: 219.9, reg: 262.1, koyaku: 5.67, payout: 109.0 }
        },
        ceiling: null, ceilingTarget: null, ceilingReward: null,
        avgBonusReward: 250, normalCostPerGame: 1.8,
        addedDate: "2026-03-01"
    },
    {
        id: "gogo_juggler_3",
        name: "ゴーゴージャグラー3",
        type: "A",
        bigLabel: "BIG",
        regLabel: "REG",
        koyakuName: "ブドウ",
        settings: {
            1: { big: 259.0, reg: 354.2, koyaku: 6.25, payout: 97.2 },
            2: { big: 258.0, reg: 332.7, koyaku: 6.20, payout: 98.2 },
            3: { big: 257.0, reg: 306.2, koyaku: 6.15, payout: 99.4 },
            4: { big: 254.0, reg: 268.6, koyaku: 6.07, payout: 101.6 },
            5: { big: 247.3, reg: 243.3, koyaku: 6.00, payout: 103.8 },
            6: { big: 234.9, reg: 234.9, koyaku: 5.92, payout: 106.5 }
        },
        ceiling: null, ceilingTarget: null, ceilingReward: null,
        avgBonusReward: 250, normalCostPerGame: 1.8,
        addedDate: "2026-03-01"
    },
    {
        id: "ultra_miracle_juggler",
        name: "ウルトラミラクルジャグラー",
        type: "A",
        bigLabel: "BIG",
        regLabel: "REG",
        koyakuName: "ブドウ",
        settings: {
            1: { big: 267.5, reg: 425.6, koyaku: 5.93, payout: 97.0 },
            2: { big: 261.1, reg: 402.1, koyaku: 5.93, payout: 98.1 },
            3: { big: 256.0, reg: 350.5, koyaku: 5.93, payout: 99.8 },
            4: { big: 242.7, reg: 322.8, koyaku: 5.93, payout: 102.1 },
            5: { big: 233.2, reg: 297.9, koyaku: 5.87, payout: 104.5 },
            6: { big: 216.3, reg: 277.7, koyaku: 5.81, payout: 108.1 }
        },
        ceiling: null, ceilingTarget: null, ceilingReward: null,
        avgBonusReward: 250, normalCostPerGame: 1.8,
        addedDate: "2026-03-01"
    },
    {
        id: "discup_ultraremix",
        name: "A-SLOT+ ディスクアップ ULTRAREMIX",
        type: "A",
        bigLabel: "BIG",
        regLabel: "REG",
        koyakuName: null,
        settings: {
            1: { big: 287.2, reg: 495.3, koyaku: null, payout: 99.3 },
            2: { big: 284.3, reg: 477.2, koyaku: null, payout: 100.2 },
            5: { big: 273.8, reg: 398.6, koyaku: null, payout: 103.6 },
            6: { big: 260.9, reg: 334.1, koyaku: null, payout: 107.7 }
        },
        ceiling: null, ceilingTarget: null, ceilingReward: null,
        avgBonusReward: 250, normalCostPerGame: 1.6,
        addedDate: "2026-03-01"
    },
    {
        id: "smaslo_hanabi",
        name: "スマスロ ハナビ",
        type: "A",
        bigLabel: "BIG",
        regLabel: "REG",
        koyakuName: null,
        settings: {
            1: { big: 297.9, reg: 394.8, koyaku: null, payout: 98.6 },
            2: { big: 292.6, reg: 358.1, koyaku: null, payout: 100.4 },
            3: { big: 290.0, reg: 343.3, koyaku: null, payout: 101.3 },
            4: { big: 287.4, reg: 328.5, koyaku: null, payout: 102.1 },
            5: { big: 284.9, reg: 313.6, koyaku: null, payout: 103.0 },
            6: { big: 273.1, reg: 282.5, koyaku: null, payout: 106.4 }
        },
        ceiling: null, ceilingTarget: null, ceilingReward: null,
        avgBonusReward: 250, normalCostPerGame: 1.6,
        addedDate: "2026-03-01"
    },
    {
        id: "thunder_v",
        name: "スマスロ サンダーV",
        type: "A",
        bigLabel: "BIG",
        regLabel: "REG",
        koyakuName: null,
        settings: {
            1: { big: 277.7, reg: 434.0, koyaku: null, payout: 98.5 },
            2: { big: 275.4, reg: 394.8, koyaku: null, payout: 100.0 },
            3: { big: 273.9, reg: 378.2, koyaku: null, payout: 101.0 },
            4: { big: 272.3, reg: 361.5, koyaku: null, payout: 101.9 },
            5: { big: 270.8, reg: 344.9, koyaku: null, payout: 102.9 },
            6: { big: 264.3, reg: 313.6, koyaku: null, payout: 106.0 }
        },
        ceiling: null, ceilingTarget: null, ceilingReward: null,
        avgBonusReward: 250, normalCostPerGame: 1.6,
        addedDate: "2026-03-01"
    },
    // ==================== AT / ART機（スマスロ） ====================
    {
        id: "kabaneri",
        name: "甲鉄城のカバネリ",
        type: "AT",
        bigLabel: "初当たり",
        regLabel: "ST",
        koyakuName: null,
        settings: {
            1: { big: 237.0, reg: 407.9, koyaku: null, payout: 97.8 },
            2: { big: 230.7, reg: 393.2, koyaku: null, payout: 98.8 },
            3: { big: 214.0, reg: 372.4, koyaku: null, payout: 100.7 },
            4: { big: 186.5, reg: 327.2, koyaku: null, payout: 105.9 },
            5: { big: 171.3, reg: 307.3, koyaku: null, payout: 108.4 },
            6: { big: 151.3, reg: 290.6, koyaku: null, payout: 110.0 }
        },
        ceiling: 1000, ceilingTarget: 550, ceilingReward: 600, resetCeiling: 650, resetCeilingTarget: 350,
        avgBonusReward: 400, normalCostPerGame: 2.3,
        addedDate: "2026-03-01"
    },
    {
        id: "kabaneri_unato",
        name: "スマスロ 甲鉄城のカバネリ 海門決戦",
        type: "AT",
        bigLabel: "初当たり",
        regLabel: "ST",
        koyakuName: null,
        settings: {
            1: { big: 254.2, reg: 422.5, koyaku: null, payout: 97.5 },
            2: { big: 242.3, reg: 405.9, koyaku: null, payout: 98.5 },
            3: { big: 239.6, reg: 398.7, koyaku: null, payout: 100.8 },
            4: { big: 214.0, reg: 357.2, koyaku: null, payout: 106.0 },
            5: { big: 203.2, reg: 332.6, koyaku: null, payout: 111.0 },
            6: { big: 195.1, reg: 318.5, koyaku: null, payout: 114.9 }
        },
        ceiling: 996, ceilingTarget: 550, ceilingReward: 600, resetCeiling: 596, resetCeilingTarget: 320,
        avgBonusReward: 400, normalCostPerGame: 2.3,
        addedDate: "2026-03-01"
    },
    {
        id: "banchou4",
        name: "押忍！番長4",
        type: "AT",
        bigLabel: "初当たり",
        regLabel: null,
        koyakuName: null,
        settings: {
            1: { big: 259.5, reg: null, koyaku: null, payout: 97.8 },
            2: { big: 256.3, reg: null, koyaku: null, payout: 98.9 },
            3: { big: 247.6, reg: null, koyaku: null, payout: 101.5 },
            4: { big: 236.0, reg: null, koyaku: null, payout: 106.0 },
            5: { big: 225.3, reg: null, koyaku: null, payout: 110.0 },
            6: { big: 221.1, reg: null, koyaku: null, payout: 113.1 }
        },
        ceiling: 699, ceilingTarget: 450, ceilingReward: 500, resetCeiling: null, resetCeilingTarget: null,
        avgBonusReward: 400, normalCostPerGame: 2.2,
        addedDate: "2026-03-01"
    },
    {
        id: "hokuto",
        name: "スマスロ北斗の拳",
        type: "AT",
        bigLabel: "AT初当たり",
        regLabel: null,
        koyakuName: null,
        settings: {
            1: { big: 383.4, reg: null, koyaku: null, payout: 98.0 },
            2: { big: 370.5, reg: null, koyaku: null, payout: 98.9 },
            4: { big: 297.8, reg: null, koyaku: null, payout: 105.7 },
            5: { big: 258.7, reg: null, koyaku: null, payout: 110.0 },
            6: { big: 235.1, reg: null, koyaku: null, payout: 113.0 }
        },
        ceiling: 1268, ceilingTarget: 800, ceilingReward: 1500, resetCeiling: 800, resetCeilingTarget: 500,
        avgBonusReward: 800, normalCostPerGame: 2.5,
        addedDate: "2026-03-01"
    },
    {
        id: "karakuri",
        name: "からくりサーカス",
        type: "AT",
        bigLabel: "AT初当たり",
        regLabel: "CZ合算",
        koyakuName: null,
        settings: {
            1: { big: 564, reg: 333, koyaku: null, payout: 97.5 },
            2: { big: 543, reg: 320, koyaku: null, payout: 98.7 },
            4: { big: 469, reg: 292, koyaku: null, payout: 103.0 },
            5: { big: 451, reg: 277, koyaku: null, payout: 108.1 },
            6: { big: 447, reg: 275, koyaku: null, payout: 114.9 }
        },
        ceiling: 1200, ceilingTarget: 800, ceilingReward: 500, resetCeiling: null, resetCeilingTarget: null,
        avgBonusReward: 400, normalCostPerGame: 2.3,
        addedDate: "2026-03-01"
    },
    {
        id: "valvrave",
        name: "革命機ヴァルヴレイヴ",
        type: "AT",
        bigLabel: "CZ初当たり",
        regLabel: "ボーナス",
        koyakuName: null,
        settings: {
            1: { big: 277, reg: 519, koyaku: null, payout: 97.3 },
            2: { big: 275, reg: 516, koyaku: null, payout: 98.3 },
            3: { big: 274, reg: 514, koyaku: null, payout: 100.8 },
            4: { big: 269, reg: 507, koyaku: null, payout: 103.2 },
            5: { big: 264, reg: 499, koyaku: null, payout: 107.9 },
            6: { big: 258, reg: 490, koyaku: null, payout: 114.9 }
        },
        ceiling: 1000, ceilingTarget: 700, ceilingReward: 400, resetCeiling: null, resetCeilingTarget: null,
        avgBonusReward: 300, normalCostPerGame: 2.0,
        addedDate: "2026-03-01"
    },
    {
        id: "monkey_turn_v",
        name: "モンキーターンV",
        type: "AT",
        bigLabel: "AT初当たり",
        regLabel: null,
        koyakuName: null,
        settings: {
            1: { big: 299.8, reg: null, koyaku: null, payout: 97.9 },
            2: { big: 295.5, reg: null, koyaku: null, payout: 98.9 },
            4: { big: 258.8, reg: null, koyaku: null, payout: 104.5 },
            5: { big: 235.7, reg: null, koyaku: null, payout: 110.2 },
            6: { big: 222.9, reg: null, koyaku: null, payout: 114.9 }
        },
        ceiling: 795, ceilingTarget: 500, ceilingReward: 600, resetCeiling: 495, resetCeilingTarget: 300,
        avgBonusReward: 400, normalCostPerGame: 2.4,
        addedDate: "2026-03-01"
    },
    {
        id: "tokyo_ghoul",
        name: "L 東京喰種",
        type: "AT",
        bigLabel: "AT初当たり",
        regLabel: "CZ初当たり",
        koyakuName: null,
        settings: {
            1: { big: 394.4, reg: 262.6, koyaku: null, payout: 97.5 },
            2: { big: 380.5, reg: 255.6, koyaku: null, payout: 99.0 },
            3: { big: 357.0, reg: 246.5, koyaku: null, payout: 101.6 },
            4: { big: 325.9, reg: 233.1, koyaku: null, payout: 105.6 },
            5: { big: 291.2, reg: 216.4, koyaku: null, payout: 110.3 },
            6: { big: 261.3, reg: 203.7, koyaku: null, payout: 114.9 }
        },
        ceiling: 600, ceilingTarget: 350, ceilingReward: 500, resetCeiling: 200, resetCeilingTarget: 50,
        avgBonusReward: 350, normalCostPerGame: 2.2,
        addedDate: "2026-03-01"
    },
    {
        id: "kaguya_sama",
        name: "かぐや様は告らせたい",
        type: "AT",
        bigLabel: "ボーナス初当たり",
        regLabel: null,
        koyakuName: null,
        settings: {
            1: { big: 362, reg: null, koyaku: null, payout: 97.7 },
            2: { big: 360, reg: null, koyaku: null, payout: 98.8 },
            3: { big: 357, reg: null, koyaku: null, payout: 101.2 },
            4: { big: 349, reg: null, koyaku: null, payout: 105.8 },
            5: { big: 343, reg: null, koyaku: null, payout: 110.8 },
            6: { big: 335, reg: null, koyaku: null, payout: 114.9 }
        },
        ceiling: 1100, ceilingTarget: 700, ceilingReward: 1000, resetCeiling: 800, resetCeilingTarget: 500,
        avgBonusReward: 600, normalCostPerGame: 2.0,
        addedDate: "2026-03-01"
    },
    {
        id: "god_eater",
        name: "ゴッドイーター リザレクション",
        type: "AT",
        bigLabel: "AT初当たり",
        regLabel: null,
        koyakuName: null,
        settings: {
            1: { big: 351.9, reg: null, koyaku: null, payout: 97.9 },
            2: { big: 344.5, reg: null, koyaku: null, payout: 98.9 },
            3: { big: 330.1, reg: null, koyaku: null, payout: 101.1 },
            4: { big: 317.0, reg: null, koyaku: null, payout: 105.6 },
            5: { big: 302.2, reg: null, koyaku: null, payout: 110.0 },
            6: { big: 290.3, reg: null, koyaku: null, payout: 114.9 }
        },
        ceiling: 1000, ceilingTarget: 600, ceilingReward: 1000, resetCeiling: 600, resetCeilingTarget: 300,
        avgBonusReward: 600, normalCostPerGame: 2.3,
        addedDate: "2026-03-01"
    },
    {
        id: "bakemonogatari",
        name: "スマスロ 化物語",
        type: "AT",
        bigLabel: "AT初当たり",
        regLabel: null,
        koyakuName: null,
        settings: {
            1: { big: 265.1, reg: null, koyaku: null, payout: 97.9 },
            2: { big: 260.7, reg: null, koyaku: null, payout: 98.9 },
            3: { big: 252.1, reg: null, koyaku: null, payout: 100.9 },
            4: { big: 238.8, reg: null, koyaku: null, payout: 105.0 },
            5: { big: 230.8, reg: null, koyaku: null, payout: 107.8 },
            6: { big: 219.6, reg: null, koyaku: null, payout: 112.1 }
        },
        ceiling: 1000, ceilingTarget: 600, ceilingReward: 500, resetCeiling: 600, resetCeilingTarget: 350,
        avgBonusReward: 400, normalCostPerGame: 2.2,
        addedDate: "2026-03-01"
    },
    {
        id: "hokuto_tensei2",
        name: "北斗の拳 転生の章2",
        type: "AT",
        bigLabel: "AT初当たり",
        regLabel: null,
        koyakuName: null,
        settings: {
            1: { big: 366.0, reg: null, koyaku: null, payout: 97.6 },
            2: { big: 357.0, reg: null, koyaku: null, payout: 98.4 },
            3: { big: 336.3, reg: null, koyaku: null, payout: 100.7 },
            4: { big: 298.7, reg: null, koyaku: null, payout: 106.2 },
            5: { big: 283.2, reg: null, koyaku: null, payout: 111.1 },
            6: { big: 273.1, reg: null, koyaku: null, payout: 114.9 }
        },
        ceiling: 1536, ceilingTarget: 900, ceilingReward: 1000, resetCeiling: 1280, resetCeilingTarget: 750,
        avgBonusReward: 600, normalCostPerGame: 2.3,
        addedDate: "2026-03-01"
    },
    // ==================== 2025〜2026年 新台 ====================
    {
        id: "umineko2",
        name: "うみねこのなく頃に2",
        type: "A",
        bigLabel: "BIG",
        regLabel: "REG",
        koyakuName: null,
        settings: {
            1: { big: 362.1, reg: 397.2, koyaku: null, payout: 98.4 },
            2: { big: 350.5, reg: 390.1, koyaku: null, payout: 99.6 },
            3: { big: 337.8, reg: 381.0, koyaku: null, payout: 101.2 },
            4: { big: 327.7, reg: 374.5, koyaku: null, payout: 103.4 },
            5: { big: 319.7, reg: 366.1, koyaku: null, payout: 104.7 },
            6: { big: 313.6, reg: 360.1, koyaku: null, payout: 105.5 }
        },
        ceiling: null, ceilingTarget: null, ceilingReward: null,
        avgBonusReward: 250, normalCostPerGame: 1.6,
        addedDate: "2026-03-01"
    },
    {
        id: "koukaku",
        name: "スマスロ 攻殻機動隊",
        type: "AT",
        bigLabel: "AT初当たり",
        regLabel: "CZ初当たり",
        koyakuName: null,
        settings: {
            1: { big: 336.3, reg: 238.0, koyaku: null, payout: 97.9 },
            2: { big: 332.0, reg: 236.3, koyaku: null, payout: 98.7 },
            3: { big: 319.6, reg: 231.7, koyaku: null, payout: 100.8 },
            4: { big: 298.7, reg: 220.9, koyaku: null, payout: 104.9 },
            5: { big: 285.8, reg: 214.0, koyaku: null, payout: 109.3 },
            6: { big: 278.0, reg: 210.1, koyaku: null, payout: 112.2 }
        },
        ceiling: 999, ceilingTarget: 600, ceilingReward: 600, resetCeiling: 699, resetCeilingTarget: 400,
        avgBonusReward: 400, normalCostPerGame: 2.2,
        addedDate: "2026-03-01"
    },
    {
        id: "dmc5",
        name: "デビル メイ クライ 5",
        type: "AT",
        bigLabel: "ボーナス",
        regLabel: "ST",
        koyakuName: null,
        settings: {
            1: { big: 257.0, reg: 445.4, koyaku: null, payout: 97.5 },
            2: { big: 254.1, reg: 436.5, koyaku: null, payout: 98.2 },
            3: { big: 251.5, reg: 411.2, koyaku: null, payout: 100.2 },
            4: { big: 222.6, reg: 359.6, koyaku: null, payout: 105.2 },
            5: { big: 217.3, reg: 329.5, koyaku: null, payout: 109.2 },
            6: { big: 204.1, reg: 303.9, koyaku: null, payout: 114.9 }
        },
        ceiling: 1000, ceilingTarget: 600, ceilingReward: 800, resetCeiling: 800, resetCeilingTarget: 500,
        avgBonusReward: 500, normalCostPerGame: 2.2,
        addedDate: "2026-03-01"
    },
    {
        id: "crea_hihouden",
        name: "クレアの秘宝伝 BT",
        type: "A",
        bigLabel: "BIG",
        regLabel: "REG",
        koyakuName: null,
        settings: {
            1: { big: 299.3, reg: 383.3, koyaku: null, payout: 98.1 },
            2: { big: 293.9, reg: 376.6, koyaku: null, payout: 99.2 },
            3: { big: 284.9, reg: 358.1, koyaku: null, payout: 101.2 },
            4: { big: 274.2, reg: 334.4, koyaku: null, payout: 103.7 },
            5: { big: 262.1, reg: 299.3, koyaku: null, payout: 106.6 },
            6: { big: 240.1, reg: 247.3, koyaku: null, payout: 112.3 }
        },
        ceiling: null, ceilingTarget: null, ceilingReward: null,
        avgBonusReward: 250, normalCostPerGame: 1.7,
        addedDate: "2026-03-01"
    },
    {
        id: "hihouden",
        name: "スマスロ 秘宝伝",
        type: "AT",
        bigLabel: "初当たり",
        regLabel: null,
        koyakuName: null,
        settings: {
            1: { big: 292.5, reg: null, koyaku: null, payout: 97.8 },
            2: { big: 271.4, reg: null, koyaku: null, payout: 99.0 },
            3: { big: 283.6, reg: null, koyaku: null, payout: 101.5 },
            4: { big: 257.5, reg: null, koyaku: null, payout: 105.1 },
            5: { big: 264.0, reg: null, koyaku: null, payout: 110.1 },
            6: { big: 246.0, reg: null, koyaku: null, payout: 114.7 }
        },
        ceiling: 799, ceilingTarget: 550, ceilingReward: 400, resetCeiling: 499, resetCeilingTarget: 300,
        avgBonusReward: 300, normalCostPerGame: 2.1,
        addedDate: "2026-03-01"
    },
    {
        id: "tenken",
        name: "転生したら剣でした",
        type: "AT",
        bigLabel: "AT初当たり",
        regLabel: null,
        koyakuName: null,
        settings: {
            1: { big: 403.8, reg: null, koyaku: null, payout: 97.9 },
            2: { big: 396.0, reg: null, koyaku: null, payout: 99.0 },
            3: { big: 373.4, reg: null, koyaku: null, payout: 101.2 },
            4: { big: 340.7, reg: null, koyaku: null, payout: 105.7 },
            5: { big: 325.9, reg: null, koyaku: null, payout: 109.1 },
            6: { big: 312.8, reg: null, koyaku: null, payout: 112.1 }
        },
        ceiling: 970, ceilingTarget: 600, ceilingReward: 700, resetCeiling: 600, resetCeilingTarget: 350,
        avgBonusReward: 400, normalCostPerGame: 2.3,
        addedDate: "2026-03-01"
    },
    {
        id: "eva_bt",
        name: "エヴァンゲリオン 約束の扉",
        type: "A",
        bigLabel: "BIG",
        regLabel: "REG",
        koyakuName: null,
        settings: {
            1: { big: 300.6, reg: 569.9, koyaku: null, payout: 97.7 },
            2: { big: 290.0, reg: 546.1, koyaku: null, payout: 98.9 },
            3: { big: 281.3, reg: 508.0, koyaku: null, payout: 100.7 },
            4: { big: 266.4, reg: 474.9, koyaku: null, payout: 104.5 },
            5: { big: 254.0, reg: 442.8, koyaku: null, payout: 107.0 },
            6: { big: 240.9, reg: 404.5, koyaku: null, payout: 110.9 }
        },
        ceiling: null, ceilingTarget: null, ceilingReward: null,
        avgBonusReward: 300, normalCostPerGame: 1.7,
        addedDate: "2026-03-01"
    },
    {
        id: "valvrave2",
        name: "L革命機ヴァルヴレイヴ2",
        type: "AT",
        bigLabel: "初当たり合算",
        regLabel: null,
        koyakuName: null,
        settings: {
            1: { big: 476, reg: null, koyaku: null, payout: 97.7 },
            2: { big: 473, reg: null, koyaku: null, payout: 99.3 },
            4: { big: 464, reg: null, koyaku: null, payout: 104.7 },
            5: { big: 459, reg: null, koyaku: null, payout: 110.8 },
            6: { big: 456, reg: null, koyaku: null, payout: 114.9 }
        },
        ceiling: 1500, ceilingTarget: 700, ceilingReward: 1200, resetCeiling: 1000, resetCeilingTarget: 500,
        avgBonusReward: 800, normalCostPerGame: 2.0,
        addedDate: "2026-03-01"
    },
    {
        id: "enen",
        name: "炎炎ノ消防隊",
        type: "AT",
        bigLabel: "初当たり",
        regLabel: null,
        koyakuName: null,
        settings: {
            1: { big: 272, reg: null, koyaku: null, payout: 97.7 },
            2: { big: 269, reg: null, koyaku: null, payout: 98.8 },
            3: { big: 257, reg: null, koyaku: null, payout: 101.2 },
            4: { big: 242, reg: null, koyaku: null, payout: 105.6 },
            5: { big: 236, reg: null, koyaku: null, payout: 110.2 },
            6: { big: 227, reg: null, koyaku: null, payout: 114.9 }
        },
        ceiling: 850, ceilingTarget: 550, ceilingReward: 600, resetCeiling: 650, resetCeilingTarget: 350,
        avgBonusReward: 400, normalCostPerGame: 2.2,
        addedDate: "2026-03-01"
    },
    {
        id: "tekken6",
        name: "スマスロ 鉄拳6",
        type: "AT",
        bigLabel: "ボーナス",
        regLabel: "AT初当たり",
        koyakuName: null,
        settings: {
            1: { big: 264.7, reg: 497.0, koyaku: null, payout: 97.9 },
            2: { big: 261.5, reg: 484.1, koyaku: null, payout: 98.9 },
            3: { big: 255.3, reg: 456.8, koyaku: null, payout: 100.5 },
            4: { big: 227.6, reg: 397.6, koyaku: null, payout: 105.2 },
            5: { big: 220.3, reg: 366.4, koyaku: null, payout: 110.3 },
            6: { big: 218.5, reg: 358.5, koyaku: null, payout: 114.9 }
        },
        ceiling: 900, ceilingTarget: 600, ceilingReward: 700, resetCeiling: 500, resetCeilingTarget: 300,
        avgBonusReward: 400, normalCostPerGame: 2.2,
        addedDate: "2026-03-01"
    },
    {
        id: "prism_nana",
        name: "プリズムナナ",
        type: "AT",
        bigLabel: "初当たり",
        regLabel: null,
        koyakuName: null,
        settings: {
            1: { big: 351.8, reg: null, koyaku: null, payout: 97.7 },
            2: { big: 346.9, reg: null, koyaku: null, payout: 98.5 },
            3: { big: 337.2, reg: null, koyaku: null, payout: 100.1 },
            4: { big: 306.6, reg: null, koyaku: null, payout: 105.5 },
            5: { big: 290.1, reg: null, koyaku: null, payout: 110.1 },
            6: { big: 278.6, reg: null, koyaku: null, payout: 114.9 }
        },
        ceiling: 899, ceilingTarget: 550, ceilingReward: 700, resetCeiling: 555, resetCeilingTarget: 350,
        avgBonusReward: 400, normalCostPerGame: 2.2,
        addedDate: "2026-03-01"
    },
    {
        id: "azurlane",
        name: "L アズールレーン THE ANIMATION",
        type: "AT",
        bigLabel: "AT初当たり",
        regLabel: null,
        koyakuName: null,
        settings: {
            1: { big: 598.9, reg: null, koyaku: null, payout: 97.9 },
            2: { big: 589.5, reg: null, koyaku: null, payout: 98.6 },
            3: { big: 564.2, reg: null, koyaku: null, payout: 100.7 },
            4: { big: 527.1, reg: null, koyaku: null, payout: 105.3 },
            5: { big: 483.0, reg: null, koyaku: null, payout: 110.6 },
            6: { big: 467.5, reg: null, koyaku: null, payout: 114.9 }
        },
        ceiling: 2000, ceilingTarget: 1200, ceilingReward: 1200, resetCeiling: null, resetCeilingTarget: null,
        avgBonusReward: 600, normalCostPerGame: 2.3,
        addedDate: "2026-03-01"
    },
    {
        id: "zettai4",
        name: "L 絶対衝激IV",
        type: "AT",
        bigLabel: "ボーナス",
        regLabel: "AT初当たり",
        koyakuName: null,
        settings: {
            1: { big: 270, reg: 543, koyaku: null, payout: 97.2 },
            2: { big: 261, reg: 501, koyaku: null, payout: 98.6 },
            3: { big: 254, reg: 450, koyaku: null, payout: 100.6 },
            4: { big: 241, reg: 357, koyaku: null, payout: 105.8 },
            5: { big: 231, reg: 304, koyaku: null, payout: 109.0 },
            6: { big: 225, reg: 266, koyaku: null, payout: 112.5 }
        },
        ceiling: null, ceilingTarget: null, ceilingReward: null,
        avgBonusReward: 400, normalCostPerGame: 2.2,
        addedDate: "2026-03-01"
    },
    {
        id: "railgun2",
        name: "スマスロ とある科学の超電磁砲2",
        type: "AT",
        bigLabel: "AT初当たり",
        regLabel: "CZ初当たり",
        koyakuName: null,
        settings: {
            1: { big: 317.8, reg: 175.7, koyaku: null, payout: 97.7 },
            2: { big: 311.8, reg: 172.6, koyaku: null, payout: 98.9 },
            3: { big: 304.4, reg: 168.5, koyaku: null, payout: 100.3 },
            4: { big: 272.4, reg: 156.6, koyaku: null, payout: 105.4 },
            5: { big: 248.1, reg: 145.7, koyaku: null, payout: 110.0 },
            6: { big: 235.3, reg: 137.5, koyaku: null, payout: 112.9 }
        },
        ceiling: 999, ceilingTarget: 550, ceilingReward: 600, resetCeiling: 699, resetCeilingTarget: 400,
        avgBonusReward: 400, normalCostPerGame: 2.2,
        addedDate: "2026-03-01"
    },
    {
        id: "onimusha3",
        name: "スマスロ 新鬼武者3",
        type: "AT",
        bigLabel: "AT初当たり",
        regLabel: null,
        koyakuName: null,
        settings: {
            1: { big: 379.7, reg: null, koyaku: null, payout: 97.5 },
            2: { big: 372.7, reg: null, koyaku: null, payout: 98.3 },
            3: { big: 352.8, reg: null, koyaku: null, payout: 100.2 },
            4: { big: 306.5, reg: null, koyaku: null, payout: 105.2 },
            5: { big: 297.9, reg: null, koyaku: null, payout: 109.2 },
            6: { big: 293.1, reg: null, koyaku: null, payout: 113.0 }
        },
        ceiling: 1000, ceilingTarget: 500, ceilingReward: 700, resetCeiling: 700, resetCeilingTarget: 400,
        avgBonusReward: 400, normalCostPerGame: 2.3,
        addedDate: "2026-03-01"
    },
    {
        id: "zenigata5",
        name: "L主役は銭形5",
        type: "AT",
        bigLabel: "初当たり",
        regLabel: null,
        koyakuName: null,
        settings: {
            2: { big: 424.5, reg: null, koyaku: null, payout: 97.9 },
            3: { big: 416.4, reg: null, koyaku: null, payout: 99.0 },
            4: { big: 388.1, reg: null, koyaku: null, payout: 103.2 },
            5: { big: 375.9, reg: null, koyaku: null, payout: 107.1 },
            6: { big: 300.5, reg: null, koyaku: null, payout: 112.1 }
        },
        ceiling: 1250, ceilingTarget: 800, ceilingReward: 800, resetCeiling: 850, resetCeilingTarget: 500,
        avgBonusReward: 500, normalCostPerGame: 2.3,
        addedDate: "2026-03-01"
    },
    {
        id: "tokyo_revengers",
        name: "スマスロ 東京リベンジャーズ",
        type: "AT",
        bigLabel: "初当たり",
        regLabel: "AT初当たり",
        koyakuName: null,
        settings: {
            1: { big: 282.4, reg: 482.2, koyaku: null, payout: 97.8 },
            2: { big: 279.5, reg: 474.7, koyaku: null, payout: 98.8 },
            3: { big: 272.2, reg: 456.9, koyaku: null, payout: 101.4 },
            4: { big: 255.8, reg: 414.0, koyaku: null, payout: 106.3 },
            5: { big: 249.1, reg: 393.8, koyaku: null, payout: 111.2 },
            6: { big: 240.1, reg: 373.1, koyaku: null, payout: 114.9 }
        },
        ceiling: 1190, ceilingTarget: 700, ceilingReward: 800, resetCeiling: 900, resetCeilingTarget: 550,
        avgBonusReward: 500, normalCostPerGame: 2.2,
        addedDate: "2026-03-01"
    },
    {
        id: "iza_banchou",
        name: "いざ！番長",
        type: "AT",
        bigLabel: "初当たり",
        regLabel: null,
        koyakuName: null,
        settings: {
            1: { big: 386.9, reg: null, koyaku: null, payout: 97.6 },
            2: { big: 368.5, reg: null, koyaku: null, payout: 98.9 },
            3: { big: 375.8, reg: null, koyaku: null, payout: 101.3 },
            4: { big: 332.4, reg: null, koyaku: null, payout: 106.0 },
            5: { big: 351.6, reg: null, koyaku: null, payout: 112.1 },
            6: { big: 312.1, reg: null, koyaku: null, payout: 114.9 }
        },
        ceiling: 999, ceilingTarget: 600, ceilingReward: 700, resetCeiling: 600, resetCeilingTarget: 350,
        avgBonusReward: 400, normalCostPerGame: 2.3,
        addedDate: "2026-03-01"
    },
    {
        id: "monhan_rise",
        name: "スマスロ モンスターハンターライズ",
        type: "AT",
        bigLabel: "AT初当たり",
        regLabel: null,
        koyakuName: null,
        settings: {
            1: { big: 309.5, reg: null, koyaku: null, payout: 97.9 },
            2: { big: 301.4, reg: null, koyaku: null, payout: 98.8 },
            3: { big: 290.8, reg: null, koyaku: null, payout: 100.3 },
            4: { big: 256.4, reg: null, koyaku: null, payout: 105.4 },
            5: { big: 237.1, reg: null, koyaku: null, payout: 110.1 },
            6: { big: 230.8, reg: null, koyaku: null, payout: 114.3 }
        },
        ceiling: 999, ceilingTarget: 600, ceilingReward: 700, resetCeiling: null, resetCeilingTarget: null,
        avgBonusReward: 400, normalCostPerGame: 2.2,
        addedDate: "2026-03-01"
    },
    {
        id: "enen2",
        name: "Lパチスロ 炎炎ノ消防隊2",
        type: "AT",
        bigLabel: "初当たり",
        regLabel: "炎炎ループ",
        koyakuName: null,
        settings: {
            1: { big: 272, reg: 684, koyaku: null, payout: 97.7 },
            2: { big: 269, reg: 662, koyaku: null, payout: 98.8 },
            3: { big: 257, reg: 617, koyaku: null, payout: 101.2 },
            4: { big: 242, reg: 546, koyaku: null, payout: 105.6 },
            5: { big: 236, reg: 518, koyaku: null, payout: 110.2 },
            6: { big: 227, reg: 486, koyaku: null, payout: 114.9 }
        },
        ceiling: 850, ceilingTarget: 550, ceilingReward: 600, resetCeiling: 650, resetCeilingTarget: 350,
        avgBonusReward: 400, normalCostPerGame: 2.2,
        addedDate: "2026-03-01"
    },
    {
        id: "magireco",
        name: "スマスロ マギアレコード 魔法少女まどか☆マギカ外伝",
        type: "AT",
        bigLabel: "ボーナス初当たり",
        regLabel: "AT初当たり",
        koyakuName: null,
        settings: {
            1: { big: 240.6, reg: 654.6, koyaku: null, payout: 97.6 },
            2: { big: 236.1, reg: 633.4, koyaku: null, payout: 98.9 },
            3: { big: 222.8, reg: 571.8, koyaku: null, payout: 102.0 },
            4: { big: 208.5, reg: 516.6, koyaku: null, payout: 106.0 },
            5: { big: 195.1, reg: 456.5, koyaku: null, payout: 110.4 },
            6: { big: 184.3, reg: 416.7, koyaku: null, payout: 114.9 }
        },
        ceiling: 950, ceilingTarget: 550, ceilingReward: 500, resetCeiling: 650, resetCeilingTarget: 350,
        avgBonusReward: 400, normalCostPerGame: 2.2,
        addedDate: "2026-03-01"
    },
    {
        id: "okidoki_duo",
        name: "スマスロ 沖ドキ！DUO アンコール",
        type: "AT",
        bigLabel: "初当たり",
        regLabel: null,
        koyakuName: null,
        settings: {
            1: { big: 240.0, reg: null, koyaku: null, payout: 97.2 },
            2: { big: 230.2, reg: null, koyaku: null, payout: 98.6 },
            3: { big: 215.8, reg: null, koyaku: null, payout: 102.4 },
            5: { big: 192.1, reg: null, koyaku: null, payout: 106.8 },
            6: { big: 181.0, reg: null, koyaku: null, payout: 110.0 }
        },
        ceiling: 800, ceilingTarget: 550, ceilingReward: 500, resetCeiling: null, resetCeilingTarget: null,
        avgBonusReward: 300, normalCostPerGame: 2.0,
        addedDate: "2026-03-01"
    },
    {
        id: "mushoku",
        name: "L 無職転生 ～異世界行ったら本気だす～",
        type: "AT",
        bigLabel: "AT初当たり",
        regLabel: null,
        koyakuName: null,
        settings: {
            1: { big: 416, reg: null, koyaku: null, payout: 97.7 },
            2: { big: 406, reg: null, koyaku: null, payout: 99.1 },
            3: { big: 394, reg: null, koyaku: null, payout: 100.9 },
            4: { big: 361, reg: null, koyaku: null, payout: 105.4 },
            5: { big: 327, reg: null, koyaku: null, payout: 109.5 },
            6: { big: 292, reg: null, koyaku: null, payout: 113.7 }
        },
        ceiling: 1007, ceilingTarget: 600, ceilingReward: 700, resetCeiling: 689, resetCeilingTarget: 400,
        avgBonusReward: 400, normalCostPerGame: 2.2,
        addedDate: "2026-03-01"
    },
    {
        id: "sbj",
        name: "スマスロスーパーブラックジャック",
        type: "AT",
        bigLabel: "ボーナス初当たり",
        regLabel: null,
        koyakuName: null,
        settings: {
            1: { big: 241.7, reg: null, koyaku: null, payout: 97.8 },
            2: { big: 238.8, reg: null, koyaku: null, payout: 98.7 },
            3: { big: 235.9, reg: null, koyaku: null, payout: 100.1 },
            4: { big: 201.8, reg: null, koyaku: null, payout: 105.7 },
            5: { big: 194.9, reg: null, koyaku: null, payout: 110.0 },
            6: { big: 181.3, reg: null, koyaku: null, payout: 112.7 }
        },
        ceiling: 999, ceilingTarget: 580, ceilingReward: 700, resetCeiling: 666, resetCeilingTarget: 400,
        avgBonusReward: 400, normalCostPerGame: 2.2,
        addedDate: "2026-03-01"
    },
    {
        id: "yoshimune",
        name: "吉宗",
        type: "AT",
        bigLabel: "初当たり",
        regLabel: null,
        koyakuName: null,
        settings: {
            1: { big: 378.9, reg: null, koyaku: null, payout: 97.8 },
            2: { big: 369.6, reg: null, koyaku: null, payout: 99.1 },
            3: { big: 358.8, reg: null, koyaku: null, payout: 100.6 },
            4: { big: 335.1, reg: null, koyaku: null, payout: 104.1 },
            5: { big: 318.5, reg: null, koyaku: null, payout: 107.1 },
            6: { big: 292.4, reg: null, koyaku: null, payout: 112.0 }
        },
        ceiling: 999, ceilingTarget: 600, ceilingReward: 800, resetCeiling: null, resetCeilingTarget: null,
        avgBonusReward: 600, normalCostPerGame: 2.3,
        addedDate: "2026-03-01"
    },
    {
        id: "goblin_slayer2",
        name: "スマスロ ゴブリンスレイヤーⅡ",
        type: "AT",
        bigLabel: "AT初当たり",
        regLabel: "CZ初当たり",
        koyakuName: null,
        settings: {
            1: { big: 541.6, reg: 239.3, koyaku: null, payout: 97.6 },
            2: { big: 526.4, reg: 232.3, koyaku: null, payout: 98.7 },
            3: { big: 506.4, reg: 222.9, koyaku: null, payout: 100.4 },
            4: { big: 453.2, reg: 200.4, koyaku: null, payout: 104.9 },
            5: { big: 417.8, reg: 187.3, koyaku: null, payout: 109.7 },
            6: { big: 402.4, reg: 181.9, koyaku: null, payout: 113.2 }
        },
        ceiling: 1500, ceilingTarget: 900, ceilingReward: 800, resetCeiling: 1000, resetCeilingTarget: 550,
        avgBonusReward: 500, normalCostPerGame: 2.3,
        addedDate: "2026-03-01"
    },
    {
        id: "otome4",
        name: "L戦国乙女4 戦乱に閃く炯眼の軍師",
        type: "AT",
        bigLabel: "ボーナス+AT合算",
        regLabel: "AT初当たり",
        koyakuName: null,
        settings: {
            1: { big: 272.7, reg: 429.2, koyaku: null, payout: 98.2 },
            2: { big: 267.3, reg: 417.8, koyaku: null, payout: 99.0 },
            3: { big: 255.3, reg: 393.6, koyaku: null, payout: 101.2 },
            4: { big: 238.2, reg: 361.3, koyaku: null, payout: 105.2 },
            5: { big: 223.2, reg: 334.1, koyaku: null, payout: 110.2 },
            6: { big: 217.1, reg: 319.2, koyaku: null, payout: 113.0 }
        },
        ceiling: 799, ceilingTarget: 500, ceilingReward: 500, resetCeiling: null, resetCeilingTarget: null,
        avgBonusReward: 300, normalCostPerGame: 2.2,
        addedDate: "2026-03-01"
    },
    {
        id: "toloveru",
        name: "L ToLOVEるダークネス",
        type: "AT",
        bigLabel: "AT初当たり",
        regLabel: null,
        koyakuName: null,
        settings: {
            2: { big: 352.0, reg: null, koyaku: null, payout: 98.0 },
            3: { big: 345.7, reg: null, koyaku: null, payout: 99.0 },
            4: { big: 328.4, reg: null, koyaku: null, payout: 102.5 },
            5: { big: 311.3, reg: null, koyaku: null, payout: 105.8 },
            6: { big: 311.1, reg: null, koyaku: null, payout: 110.1 }
        },
        ceiling: 999, ceilingTarget: 600, ceilingReward: 700, resetCeiling: 650, resetCeilingTarget: 350,
        avgBonusReward: 400, normalCostPerGame: 2.2,
        addedDate: "2026-03-01"
    },
    {
        id: "baki",
        name: "Ｌ範馬刃牙",
        type: "AT",
        bigLabel: "ボーナス",
        regLabel: "AT初当たり",
        koyakuName: null,
        settings: {
            1: { big: 269.4, reg: 525.3, koyaku: null, payout: 97.7 },
            2: { big: 265.7, reg: 517.1, koyaku: null, payout: 98.5 },
            3: { big: 258.3, reg: 503.2, koyaku: null, payout: 100.5 },
            4: { big: 252.1, reg: 484.5, koyaku: null, payout: 105.2 },
            5: { big: 251.0, reg: 481.9, koyaku: null, payout: 107.9 },
            6: { big: 250.1, reg: 480.4, koyaku: null, payout: 110.6 }
        },
        ceiling: 700, ceilingTarget: 400, ceilingReward: 500, resetCeiling: 200, resetCeilingTarget: 100,
        avgBonusReward: 350, normalCostPerGame: 2.2,
        addedDate: "2026-03-01"
    },
    {
        id: "biohazard5",
        name: "スマスロ バイオハザード5",
        type: "AT",
        bigLabel: "AT初当たり",
        regLabel: null,
        koyakuName: null,
        settings: {
            1: { big: 325.8, reg: null, koyaku: null, payout: 97.8 },
            2: { big: 314.4, reg: null, koyaku: null, payout: 98.8 },
            3: { big: 298.2, reg: null, koyaku: null, payout: 100.6 },
            4: { big: 271.4, reg: null, koyaku: null, payout: 104.6 },
            5: { big: 249.6, reg: null, koyaku: null, payout: 108.9 },
            6: { big: 236.2, reg: null, koyaku: null, payout: 114.9 }
        },
        ceiling: 999, ceilingTarget: 600, ceilingReward: 700, resetCeiling: 666, resetCeilingTarget: 400,
        avgBonusReward: 400, normalCostPerGame: 2.2,
        addedDate: "2026-03-01"
    },
    {
        id: "revuestarlight",
        name: "L少女☆歌劇 レヴュースタァライト -The SLOT-",
        type: "AT",
        bigLabel: "ボーナス合算",
        regLabel: "AT初当たり",
        koyakuName: null,
        settings: {
            1: { big: 184.8, reg: 359.6, koyaku: null, payout: 97.8 },
            2: { big: 182.2, reg: 346.8, koyaku: null, payout: 98.8 },
            4: { big: 169.9, reg: 277.1, koyaku: null, payout: 104.6 },
            5: { big: 165.4, reg: 255.7, koyaku: null, payout: 106.9 },
            6: { big: 160.6, reg: 232.5, koyaku: null, payout: 110.0 }
        },
        ceiling: 900, ceilingTarget: 550, ceilingReward: 600, resetCeiling: 600, resetCeilingTarget: 350,
        avgBonusReward: 400, normalCostPerGame: 2.2,
        addedDate: "2026-03-01"
    },
    {
        id: "eureka_seven_art",
        name: "交響詩篇エウレカセブン HI-EVOLUTION ZERO TYPE-ART",
        type: "AT",
        bigLabel: "ボーナス合算",
        regLabel: "ART初当たり",
        koyakuName: null,
        settings: {
            1: { big: 195.6, reg: 270.4, koyaku: null, payout: 98.1 },
            2: { big: 192.8, reg: 255.7, koyaku: null, payout: 99.0 },
            3: { big: 190.5, reg: 239.3, koyaku: null, payout: 100.3 },
            4: { big: 186.7, reg: 210.7, koyaku: null, payout: 103.6 },
            5: { big: 185.7, reg: 201.2, koyaku: null, payout: 104.8 },
            6: { big: 183.1, reg: 188.7, koyaku: null, payout: 106.4 }
        },
        ceiling: null, ceilingTarget: null, ceilingReward: null, resetCeiling: null, resetCeilingTarget: null,
        avgBonusReward: 400, normalCostPerGame: 2.2,
        addedDate: "2026-04-01"
    },
    {
        id: "shake_bt",
        name: "スマスロ シェイク ボーナストリガー",
        type: "AT",
        bigLabel: "BIG",
        regLabel: "REG",
        koyakuName: null,
        settings: {
            1: { big: 350.5, reg: 425.6, koyaku: null, payout: 98.6 },
            2: { big: 327.7, reg: 332.7, koyaku: null, payout: 100.6 },
            5: { big: 341.3, reg: 409.6, koyaku: null, payout: 103.0 },
            6: { big: 297.9, reg: 297.9, koyaku: null, payout: 106.1 }
        },
        ceiling: null, ceilingTarget: null, ceilingReward: null, resetCeiling: null, resetCeilingTarget: null,
        avgBonusReward: 400, normalCostPerGame: 1.4,
        addedDate: "2026-04-01"
    },
    {
        id: "harem_ace_bt",
        name: "翔べ！ハーレムエース",
        type: "AT",
        bigLabel: "ボーナス合算",
        regLabel: null,
        koyakuName: null,
        settings: {
            1: { big: 234.1, reg: null, koyaku: null, payout: 98.1 },
            2: { big: 220.7, reg: null, koyaku: null, payout: 99.9 },
            5: { big: 186.7, reg: null, koyaku: null, payout: 104.7 },
            6: { big: 158.7, reg: null, koyaku: null, payout: 110.0 }
        },
        ceiling: null, ceilingTarget: null, ceilingReward: null, resetCeiling: null, resetCeilingTarget: null,
        avgBonusReward: 350, normalCostPerGame: 1.2,
        addedDate: "2026-04-01"
    },
    {
        id: "alex_bt",
        name: "スマスロ アレックスブライト",
        type: "AT",
        bigLabel: "BIG",
        regLabel: "REG",
        koyakuName: null,
        settings: {
            1: { big: 309.1, reg: 428.3, koyaku: null, payout: 98.8 },
            2: { big: 303.4, reg: 409.6, koyaku: null, payout: 100.2 },
            3: { big: 299.3, reg: 388.0, koyaku: null, payout: 101.2 },
            4: { big: 297.2, reg: 376.0, koyaku: null, payout: 102.6 },
            5: { big: 295.2, reg: 366.1, koyaku: null, payout: 104.1 },
            6: { big: 287.4, reg: 312.1, koyaku: null, payout: 108.3 }
        },
        ceiling: null, ceilingTarget: null, ceilingReward: null, resetCeiling: null, resetCeilingTarget: null,
        avgBonusReward: 400, normalCostPerGame: 2.2,
        addedDate: "2026-04-01"
    },
    {
        id: "bofuri",
        name: "スマスロ痛いのは嫌なので防御力に極振りしたいと思います。",
        type: "AT",
        bigLabel: "AT初当たり",
        regLabel: null,
        koyakuName: null,
        settings: {
            1: { big: 319.0, reg: null, koyaku: null, payout: 97.9 },
            2: { big: 309.8, reg: null, koyaku: null, payout: 98.8 },
            3: { big: 307.3, reg: null, koyaku: null, payout: 100.5 },
            4: { big: 266.8, reg: null, koyaku: null, payout: 105.9 },
            5: { big: 257.1, reg: null, koyaku: null, payout: 109.5 },
            6: { big: 229.7, reg: null, koyaku: null, payout: 113.0 }
        },
        ceiling: 950, ceilingTarget: 600, ceilingReward: 700, resetCeiling: 650, resetCeilingTarget: 400,
        avgBonusReward: 450, normalCostPerGame: 1.5,
        addedDate: "2026-04-01"
    },
    {
        id: "nanatsu_maken",
        name: "L七つの魔剣が支配する",
        type: "AT",
        bigLabel: "ボーナス初当たり",
        regLabel: "ST初当たり",
        koyakuName: null,
        settings: {
            1: { big: 228.0, reg: 408.3, koyaku: null, payout: 97.9 },
            2: { big: 222.0, reg: 394.9, koyaku: null, payout: 99.0 },
            3: { big: 209.7, reg: 366.4, koyaku: null, payout: 101.1 },
            4: { big: 185.6, reg: 314.0, koyaku: null, payout: 105.5 },
            5: { big: 173.5, reg: 289.2, koyaku: null, payout: 108.5 },
            6: { big: 164.7, reg: 272.3, koyaku: null, payout: 111.0 }
        },
        ceiling: 1000, ceilingTarget: 600, ceilingReward: 700, resetCeiling: 650, resetCeilingTarget: 400,
        avgBonusReward: 400, normalCostPerGame: 2.0,
        addedDate: "2026-04-01"
    },
    {
        id: "granbelm",
        name: "回胴式遊技機 グランベルム",
        type: "AT",
        bigLabel: "ボーナス",
        regLabel: "AT初当たり",
        koyakuName: null,
        settings: {
            1: { big: 287.9, reg: 478.9, koyaku: null, payout: 97.6 },
            2: { big: 283.1, reg: 466.6, koyaku: null, payout: 98.5 },
            3: { big: 268.8, reg: 436.0, koyaku: null, payout: 100.7 },
            4: { big: 247.7, reg: 393.8, koyaku: null, payout: 104.5 },
            5: { big: 233.7, reg: 367.5, koyaku: null, payout: 107.6 },
            6: { big: 223.8, reg: 346.1, koyaku: null, payout: 110.9 }
        },
        ceiling: 649, ceilingTarget: 400, ceilingReward: 500, resetCeiling: null, resetCeilingTarget: null,
        avgBonusReward: 400, normalCostPerGame: 1.5,
        addedDate: "2026-04-01"
    },
    {
        id: "kyokou_suiritr",
        name: "L 虚構推理",
        type: "AT",
        bigLabel: "初当たり",
        regLabel: "CZ",
        koyakuName: null,
        settings: {
            1: { big: 349.0, reg: 124.5, koyaku: null, payout: 97.7 },
            2: { big: 341.3, reg: 121.9, koyaku: null, payout: 98.5 },
            3: { big: 329.3, reg: 118.6, koyaku: null, payout: 100.0 },
            4: { big: 300.2, reg: 112.5, koyaku: null, payout: 104.0 },
            5: { big: 279.7, reg: 107.1, koyaku: null, payout: 108.0 },
            6: { big: 264.8, reg: 103.5, koyaku: null, payout: 112.0 }
        },
        ceiling: 1000, ceilingTarget: 600, ceilingReward: 700, resetCeiling: 700, resetCeilingTarget: 400,
        avgBonusReward: 450, normalCostPerGame: 1.6,
        addedDate: "2026-04-06"
    },
    {
        id: "isekai_quartet_bt",
        name: "A-SLOT+ 異世界かるてっと BT",
        type: "A",
        bigLabel: "BIG",
        regLabel: "いせかる目",
        koyakuName: null,
        settings: {
            1: { big: 1337.5, reg: 107.6, koyaku: null, payout: 97.9 },
            2: { big: 1260.3, reg: 106.2, koyaku: null, payout: 99.9 },
            3: { big: 1187.0, reg: 103.2, koyaku: null, payout: 101.4 },
            4: { big: 1113.7, reg: 100.1, koyaku: null, payout: 102.9 },
            5: { big: 1040.3, reg: 97.1, koyaku: null, payout: 104.4 },
            6: { big: 923.0, reg: 89.2, koyaku: null, payout: 109.0 }
        },
        ceiling: null, ceilingTarget: null, ceilingReward: null,
        avgBonusReward: 220, normalCostPerGame: 1.5,
        addedDate: "2026-04-06"
    },
    {
        id: "jormungand",
        name: "スマスロ ヨルムンガンド",
        type: "AT",
        bigLabel: "AT初当たり",
        regLabel: "CZ",
        koyakuName: null,
        settings: {
            1: { big: 333.8, reg: 194.2, koyaku: null, payout: 97.8 },
            2: { big: 323.3, reg: 188.6, koyaku: null, payout: 98.8 },
            3: { big: 305.4, reg: 175.7, koyaku: null, payout: 100.9 },
            4: { big: 291.6, reg: 169.4, koyaku: null, payout: 104.7 },
            5: { big: 291.1, reg: 167.8, koyaku: null, payout: 109.6 },
            6: { big: 290.1, reg: 167.2, koyaku: null, payout: 113.9 }
        },
        ceiling: null, ceilingTarget: null, ceilingReward: null, resetCeiling: null, resetCeilingTarget: null,
        avgBonusReward: 400, normalCostPerGame: 1.6,
        addedDate: "2026-04-06"
    },
    {
        id: "akudama_drive",
        name: "L アクダマドライブ",
        type: "AT",
        bigLabel: "AT初当たり",
        regLabel: "CZ",
        koyakuName: null,
        settings: {
            1: { big: 555.5, reg: 166.1, koyaku: null, payout: 97.4 },
            2: { big: 550.7, reg: 165.3, koyaku: null, payout: 98.0 },
            3: { big: 543.6, reg: 163.8, koyaku: null, payout: 99.5 },
            4: { big: 517.8, reg: 159.3, koyaku: null, payout: 102.5 },
            5: { big: 487.7, reg: 154.8, koyaku: null, payout: 106.5 },
            6: { big: 472.0, reg: 152.1, koyaku: null, payout: 112.0 }
        },
        ceiling: 967, ceilingTarget: 600, ceilingReward: 700, resetCeiling: 589, resetCeilingTarget: 380,
        avgBonusReward: 450, normalCostPerGame: 1.6,
        addedDate: "2026-04-06"
    },
    {
        id: "shinuchi_yoshimune",
        name: "真打 吉宗",
        type: "AT",
        bigLabel: "AT初当たり",
        regLabel: "CZ",
        koyakuName: null,
        settings: {
            1: { big: 488.9, reg: 313.0, koyaku: null, payout: 97.8 },
            2: { big: 471.5, reg: 303.0, koyaku: null, payout: 98.6 },
            3: { big: 438.5, reg: 283.5, koyaku: null, payout: 101.0 },
            4: { big: 398.1, reg: 267.1, koyaku: null, payout: 104.5 },
            5: { big: 377.0, reg: 256.9, koyaku: null, payout: 108.0 },
            6: { big: 354.9, reg: 250.6, koyaku: null, payout: 114.0 }
        },
        ceiling: 1500, ceilingTarget: 900, ceilingReward: 850, resetCeiling: null, resetCeilingTarget: null,
        avgBonusReward: 550, normalCostPerGame: 1.6,
        addedDate: "2026-04-06"
    },
    {
        id: "lb_triple_crown_seven",
        name: "LB トリプルクラウンセブン",
        type: "A",
        bigLabel: "BIG",
        regLabel: "REG",
        koyakuName: null,
        settings: {
            1: { big: 258.0, reg: 590.4, koyaku: null, payout: 97.5 },
            2: { big: 253.0, reg: 580.0, koyaku: null, payout: 99.0 },
            3: { big: 245.3, reg: 561.4, koyaku: null, payout: 101.0 },
            4: { big: 237.7, reg: 543.0, koyaku: null, payout: 103.0 },
            5: { big: 230.0, reg: 524.3, koyaku: null, payout: 105.0 },
            6: { big: 203.5, reg: 464.8, koyaku: null, payout: 112.1 }
        },
        ceiling: null, ceilingTarget: null, ceilingReward: null,
        avgBonusReward: 280, normalCostPerGame: 1.5,
        addedDate: "2026-04-06"
    },
    {
        id: "gundam_unicorn_kakusei_drive",
        name: "Lパチスロ 機動戦士ガンダムユニコーン 覚醒DRIVE",
        type: "AT",
        bigLabel: "CZ",
        regLabel: "AT初当たり",
        koyakuName: null,
        settings: {
            1: { big: 298.5, reg: 471.9, koyaku: null, payout: 97.7 },
            2: { big: 287.0, reg: 456.6, koyaku: null, payout: 98.9 },
            3: { big: 265.1, reg: 427.8, koyaku: null, payout: 101.0 },
            4: { big: 247.7, reg: 403.9, koyaku: null, payout: 105.4 },
            5: { big: 243.9, reg: 398.3, koyaku: null, payout: 110.5 },
            6: { big: 239.8, reg: 392.3, koyaku: null, payout: 114.9 }
        },
        ceiling: 800, ceilingTarget: 500, ceilingReward: 700, resetCeiling: 400, resetCeilingTarget: 250,
        avgBonusReward: 450, normalCostPerGame: 1.6,
        addedDate: "2026-04-20"
    },
    {
        id: "million_god_kiseki",
        name: "スマスロ ミリオンゴッド-神々の軌跡-",
        type: "AT",
        bigLabel: "AT初当たり",
        regLabel: null,
        koyakuName: null,
        settings: {
            1: { big: 533.0, reg: null, koyaku: null, payout: 97.2 },
            2: { big: 420.0, reg: null, koyaku: null, payout: 99.1 },
            3: { big: 496.0, reg: null, koyaku: null, payout: 102.1 },
            4: { big: 338.0, reg: null, koyaku: null, payout: 106.9 },
            5: { big: 455.0, reg: null, koyaku: null, payout: 111.7 },
            6: { big: 295.0, reg: null, koyaku: null, payout: 114.6 }
        },
        ceiling: null, ceilingTarget: null, ceilingReward: null, resetCeiling: null, resetCeilingTarget: null,
        avgBonusReward: 550, normalCostPerGame: 1.5,
        addedDate: "2026-04-20"
    },
    {
        id: "animal_slot_dotch",
        name: "アニマルスロット ドッチ",
        type: "AT",
        bigLabel: "BIG",
        regLabel: "REG",
        koyakuName: null,
        settings: {
            1: { big: 329.7, reg: 349.5, koyaku: null, payout: 97.6 },
            2: { big: 314.7, reg: 342.8, koyaku: null, payout: 98.7 },
            3: { big: 295.6, reg: 339.4, koyaku: null, payout: 100.4 },
            4: { big: 274.3, reg: 328.1, koyaku: null, payout: 103.5 },
            5: { big: 249.1, reg: 321.5, koyaku: null, payout: 107.5 },
            6: { big: 227.4, reg: 314.3, koyaku: null, payout: 108.2 }
        },
        ceiling: 999, ceilingTarget: 650, ceilingReward: 480, resetCeiling: 499, resetCeilingTarget: 320,
        avgBonusReward: 320, normalCostPerGame: 1.5,
        addedDate: "2026-04-20"
    }
];

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
const $koyakuCount   = document.getElementById("koyaku-count");
const $bigLabel      = document.getElementById("big-label");
const $regLabel      = document.getElementById("reg-label");
const $koyakuLabel   = document.getElementById("koyaku-label");
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
    { href: "machines/hokuto/ceiling/", title: "スマスロ北斗の拳：天井・狙い目・期待値" },
    { href: "machines/kabaneri/ceiling/", title: "甲鉄城のカバネリ：天井・狙い目・期待値" },
    { href: "machines/banchou4/setting/", title: "押忍！番長4：設定差・設定推測" },
    { href: "machines/aim_juggler_ex/setting/", title: "アイムジャグラーEX：設定判別（ボーナス/合算）" },
    { href: "machines/my_juggler_v/setting/", title: "マイジャグラーV：設定判別（ボーナス/合算）" }
];

function isValidRankingHref(href) {
    return /^machines\/[a-z0-9_/\-]+\/?$/i.test(String(href || ""))
        && !String(href).includes("..");
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

    if (machine.koyakuName) {
        $koyakuLabel.innerHTML = machine.koyakuName + '回数 <span class="label-hint">(任意)</span>';
        $koyakuCount.closest(".form-group").style.display = "";
    } else {
        $koyakuLabel.innerHTML = '小役回数 <span class="label-hint">(任意)</span>';
        $koyakuCount.closest(".form-group").style.display = "none";
        $koyakuCount.value = "";
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
    const koyakuCount = parseInt($koyakuCount.value) || 0;

    const hasTotalGames = totalGames > 0;
    const hasCurrentGames = currentGames > 0;
    const ceilingOnly = !hasTotalGames && hasCurrentGames;

    if (!hasTotalGames && !hasCurrentGames) {
        alert("総ゲーム数または現在ゲーム数を入力してください");
        return;
    }

    if (hasTotalGames) {
        const results = estimateSettings(machine, totalGames, bigCount, regCount, koyakuCount);
        renderSettingResults(results, machine);
        renderFactors(machine, totalGames, bigCount, regCount, koyakuCount);
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
    $specSection.style.display = "";
    $regCount.closest(".form-group").style.display = "";
    $koyakuCount.closest(".form-group").style.display = "";
    $bigLabel.textContent = "BIG回数";
    $regLabel.textContent = "REG回数";
    $koyakuLabel.innerHTML = '小役回数 <span class="label-hint">(任意)</span>';
}

// ============================================================
// ベイズ推定による設定推測
// ============================================================
function estimateSettings(machine, totalGames, bigCount, regCount, koyakuCount) {
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

        // 小役の尤度（データがある場合のみ）
        if (spec.koyaku !== null && koyakuCount > 0) {
            const pKoyaku = 1 / spec.koyaku;
            logL += koyakuCount * Math.log(pKoyaku) + (totalGames - koyakuCount) * Math.log(1 - pKoyaku);
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
// 設定推測要素ページURL
// ============================================================
const GUESS_ELEMENT_PAGES = {
    banchou4: "setGuessElement/oshiBanchou4/index.html",
    discup_ultraremix: "setGuessElement/discupUltraremix/index.html",
    umineko2: "setGuessElement/umineko2/index.html",
    crea_hihouden: "setGuessElement/creaHihouden/index.html",
    eva_bt: "setGuessElement/evaBt/index.html",
    kabaneri: "setGuessElement/kabaneri/index.html",
    hokuto: "setGuessElement/hokuto/index.html",
    karakuri: "setGuessElement/karakuri/index.html",
    valvrave: "setGuessElement/valvrave/index.html",
    monkey_turn_v: "setGuessElement/monkeyTurnV/index.html",
    tokyo_ghoul: "setGuessElement/tokyoGhoul/index.html",
    kaguya_sama: "setGuessElement/kaguyaSama/index.html",
    god_eater: "setGuessElement/godEater/index.html",
    bakemonogatari: "setGuessElement/bakemonogatari/index.html",
    hokuto_tensei2: "setGuessElement/hokutoTensei2/index.html",
    koukaku: "setGuessElement/koukaku/index.html",
    dmc5: "setGuessElement/dmc5/index.html",
    hihouden: "setGuessElement/hihouden/index.html",
    tenken: "setGuessElement/tenken/index.html",
    valvrave2: "setGuessElement/valvrave2/index.html",
    enen: "setGuessElement/enen/index.html",
    tekken6: "setGuessElement/tekken6/index.html",
    prism_nana: "setGuessElement/prismNana/index.html",
    azurlane: "setGuessElement/azurlane/index.html",
    zettai4: "setGuessElement/zettai4/index.html",
    railgun2: "setGuessElement/railgun2/index.html",
    onimusha3: "setGuessElement/onimusha3/index.html",
    zenigata5: "setGuessElement/zenigata5/index.html",
    tokyo_revengers: "setGuessElement/tokyoRevengers/index.html",
    iza_banchou: "setGuessElement/izaBanchou/index.html",
    monhan_rise: "setGuessElement/monhanRise/index.html",
    enen2: "setGuessElement/enen2/index.html",
    magireco: "setGuessElement/magireco/index.html",
    okidoki_duo: "setGuessElement/okidokiDuo/index.html",
    mushoku: "setGuessElement/mushoku/index.html",
    sbj: "setGuessElement/sbj/index.html",
    yoshimune: "setGuessElement/yoshimune/index.html",
    goblin_slayer2: "setGuessElement/goblinSlayer2/index.html",
    otome4: "setGuessElement/otome4/index.html",
    toloveru: "setGuessElement/toloveru/index.html",
    baki: "setGuessElement/baki/index.html",
    biohazard5: "setGuessElement/biohazard5/index.html",
    revuestarlight: "setGuessElement/revuestarlight/index.html",
    kyokou_suiritr: "setGuessElement/kyokouSuiritr/index.html",
    isekai_quartet_bt: "setGuessElement/isekaiQuartetBt/index.html",
    jormungand: "setGuessElement/jormungand/index.html",
    akudama_drive: "setGuessElement/akudamaDrive/index.html",
    shinuchi_yoshimune: "setGuessElement/shinuchiYoshimune/index.html",
    lb_triple_crown_seven: "setGuessElement/lbTripleCrownSeven/index.html",
    gundam_unicorn_kakusei_drive: "setGuessElement/gundamUnicornKakuseiDrive/index.html",
    million_god_kiseki: "setGuessElement/millionGodKiseki/index.html",
    animal_slot_dotch: "setGuessElement/animalSlotDotch/index.html"
};

function getGuessElementUrl(machineId) {
    return GUESS_ELEMENT_PAGES[machineId] || null;
}

// ============================================================
// 描画: 推測要素
// ============================================================
function renderFactors(machine, totalGames, bigCount, regCount, koyakuCount) {
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

    if (machine.koyakuName && koyakuCount > 0 && totalGames > 0) {
        const koyakuProb = totalGames / koyakuCount;
        items.push({
            label: `${machine.koyakuName}確率`,
            value: `1/${koyakuProb.toFixed(2)}`,
            hint: findClosestSetting(machine, "koyaku", koyakuProb)
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

    const geUrl = getGuessElementUrl(machine.id);
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
