/**
 * 機種別ランディングページ自動生成スクリプト
 * 実行: node generate-landing-pages.js
 */
const fs = require("fs");
const path = require("path");

const SITE_URL = "https://win-slot-beta.vercel.app";

const MACHINES = [
    { id: "aim_juggler_ex", name: "アイムジャグラーEX", type: "A", bigLabel: "BIG", regLabel: "REG", koyakuName: "ブドウ",
      settings: { 1:{big:273.1,reg:439.8,koyaku:6.10,payout:97.0}, 2:{big:270.8,reg:399.6,koyaku:6.09,payout:98.0}, 3:{big:269.7,reg:331.0,koyaku:6.08,payout:99.9}, 4:{big:259.0,reg:315.1,koyaku:6.07,payout:102.0}, 5:{big:259.0,reg:255.0,koyaku:6.05,payout:104.2}, 6:{big:255.0,reg:255.0,koyaku:5.83,payout:105.5} },
      ceiling:null, ceilingTarget:null, ceilingReward:null, avgBonusReward:250, normalCostPerGame:1.8 },
    { id: "my_juggler_v", name: "マイジャグラーV", type: "A", bigLabel: "BIG", regLabel: "REG", koyakuName: "ブドウ",
      settings: { 1:{big:273.1,reg:409.6,koyaku:5.95,payout:97.0}, 2:{big:270.8,reg:385.5,koyaku:5.92,payout:98.0}, 3:{big:266.4,reg:336.1,koyaku:5.88,payout:99.9}, 4:{big:254.0,reg:290.0,koyaku:5.80,payout:102.8}, 5:{big:240.1,reg:268.6,koyaku:5.70,payout:105.3}, 6:{big:229.1,reg:229.1,koyaku:5.56,payout:109.4} },
      ceiling:null, ceilingTarget:null, ceilingReward:null, avgBonusReward:250, normalCostPerGame:1.8 },
    { id: "funky_juggler_2", name: "ファンキージャグラー2", type: "A", bigLabel: "BIG", regLabel: "REG", koyakuName: "ブドウ",
      settings: { 1:{big:266.4,reg:439.8,koyaku:5.94,payout:97.0}, 2:{big:259.0,reg:407.1,koyaku:5.92,payout:98.5}, 3:{big:256.0,reg:366.1,koyaku:5.88,payout:99.8}, 4:{big:249.2,reg:322.8,koyaku:5.83,payout:102.0}, 5:{big:240.1,reg:299.3,koyaku:5.76,payout:104.3}, 6:{big:219.9,reg:262.1,koyaku:5.67,payout:109.0} },
      ceiling:null, ceilingTarget:null, ceilingReward:null, avgBonusReward:250, normalCostPerGame:1.8 },
    { id: "gogo_juggler_3", name: "ゴーゴージャグラー3", type: "A", bigLabel: "BIG", regLabel: "REG", koyakuName: "ブドウ",
      settings: { 1:{big:259.0,reg:354.2,koyaku:6.25,payout:97.2}, 2:{big:258.0,reg:332.7,koyaku:6.20,payout:98.2}, 3:{big:257.0,reg:306.2,koyaku:6.15,payout:99.4}, 4:{big:254.0,reg:268.6,koyaku:6.07,payout:101.6}, 5:{big:247.3,reg:243.3,koyaku:6.00,payout:103.8}, 6:{big:234.9,reg:234.9,koyaku:5.92,payout:106.5} },
      ceiling:null, ceilingTarget:null, ceilingReward:null, avgBonusReward:250, normalCostPerGame:1.8 },
    { id: "ultra_miracle_juggler", name: "ウルトラミラクルジャグラー", type: "A", bigLabel: "BIG", regLabel: "REG", koyakuName: "ブドウ",
      settings: { 1:{big:267.5,reg:425.6,koyaku:5.93,payout:97.0}, 2:{big:261.1,reg:402.1,koyaku:5.93,payout:98.1}, 3:{big:256.0,reg:350.5,koyaku:5.93,payout:99.8}, 4:{big:242.7,reg:322.8,koyaku:5.93,payout:102.1}, 5:{big:233.2,reg:297.9,koyaku:5.87,payout:104.5}, 6:{big:216.3,reg:277.7,koyaku:5.81,payout:108.1} },
      ceiling:null, ceilingTarget:null, ceilingReward:null, avgBonusReward:250, normalCostPerGame:1.8 },
    { id: "discup_ultraremix", name: "A-SLOT+ ディスクアップ ULTRAREMIX", type: "A", bigLabel: "BIG", regLabel: "REG", koyakuName: null,
      settings: { 1:{big:287.2,reg:495.3,koyaku:null,payout:99.3}, 2:{big:284.3,reg:477.2,koyaku:null,payout:100.2}, 5:{big:273.8,reg:398.6,koyaku:null,payout:103.6}, 6:{big:260.9,reg:334.1,koyaku:null,payout:107.7} },
      ceiling:null, ceilingTarget:null, ceilingReward:null, avgBonusReward:250, normalCostPerGame:1.6 },
    { id: "umineko2", name: "うみねこのなく頃に2", type: "A", bigLabel: "BIG", regLabel: "REG", koyakuName: null,
      settings: { 1:{big:362.1,reg:397.2,koyaku:null,payout:98.4}, 2:{big:350.5,reg:390.1,koyaku:null,payout:99.6}, 3:{big:337.8,reg:381.0,koyaku:null,payout:101.2}, 4:{big:327.7,reg:374.5,koyaku:null,payout:103.4}, 5:{big:319.7,reg:366.1,koyaku:null,payout:104.7}, 6:{big:313.6,reg:360.1,koyaku:null,payout:105.5} },
      ceiling:null, ceilingTarget:null, ceilingReward:null, avgBonusReward:250, normalCostPerGame:1.6 },
    { id: "crea_hihouden", name: "クレアの秘宝伝 BT", type: "A", bigLabel: "BIG", regLabel: "REG", koyakuName: null,
      settings: { 1:{big:299.3,reg:383.3,koyaku:null,payout:98.1}, 2:{big:293.9,reg:376.6,koyaku:null,payout:99.2}, 3:{big:284.9,reg:358.1,koyaku:null,payout:101.2}, 4:{big:274.2,reg:334.4,koyaku:null,payout:103.7}, 5:{big:262.1,reg:299.3,koyaku:null,payout:106.6}, 6:{big:240.1,reg:247.3,koyaku:null,payout:112.3} },
      ceiling:null, ceilingTarget:null, ceilingReward:null, avgBonusReward:250, normalCostPerGame:1.7 },
    { id: "eva_bt", name: "エヴァンゲリオン 約束の扉", type: "A", bigLabel: "BIG", regLabel: "REG", koyakuName: null,
      settings: { 1:{big:300.6,reg:569.9,koyaku:null,payout:97.7}, 2:{big:290.0,reg:546.1,koyaku:null,payout:98.9}, 3:{big:281.3,reg:508.0,koyaku:null,payout:100.7}, 4:{big:266.4,reg:474.9,koyaku:null,payout:104.5}, 5:{big:254.0,reg:442.8,koyaku:null,payout:107.0}, 6:{big:240.9,reg:404.5,koyaku:null,payout:110.9} },
      ceiling:null, ceilingTarget:null, ceilingReward:null, avgBonusReward:300, normalCostPerGame:1.7 },
    { id: "kabaneri", name: "甲鉄城のカバネリ", type: "AT", bigLabel: "初当たり", regLabel: "ST", koyakuName: null,
      settings: { 1:{big:237.0,reg:407.9,koyaku:null,payout:97.8}, 2:{big:230.7,reg:393.2,koyaku:null,payout:98.8}, 3:{big:214.0,reg:372.4,koyaku:null,payout:100.7}, 4:{big:186.5,reg:327.2,koyaku:null,payout:105.9}, 5:{big:171.3,reg:307.3,koyaku:null,payout:108.4}, 6:{big:151.3,reg:290.6,koyaku:null,payout:110.0} },
      ceiling:1000, ceilingTarget:550, ceilingReward:600, resetCeiling:650, resetCeilingTarget:350, avgBonusReward:400, normalCostPerGame:2.3 },
    { id: "banchou4", name: "押忍！番長4", type: "AT", bigLabel: "初当たり", regLabel: null, koyakuName: null,
      settings: { 1:{big:259.5,reg:null,koyaku:null,payout:97.8}, 2:{big:256.3,reg:null,koyaku:null,payout:98.9}, 3:{big:247.6,reg:null,koyaku:null,payout:101.5}, 4:{big:236.0,reg:null,koyaku:null,payout:106.0}, 5:{big:225.3,reg:null,koyaku:null,payout:110.0}, 6:{big:221.1,reg:null,koyaku:null,payout:113.1} },
      ceiling:699, ceilingTarget:450, ceilingReward:500, resetCeiling:null, resetCeilingTarget:null, avgBonusReward:400, normalCostPerGame:2.2 },
    { id: "hokuto", name: "スマスロ北斗の拳", type: "AT", bigLabel: "AT初当たり", regLabel: null, koyakuName: null,
      settings: { 1:{big:383.4,reg:null,koyaku:null,payout:98.0}, 2:{big:370.5,reg:null,koyaku:null,payout:98.9}, 4:{big:297.8,reg:null,koyaku:null,payout:105.7}, 5:{big:258.7,reg:null,koyaku:null,payout:110.0}, 6:{big:235.1,reg:null,koyaku:null,payout:113.0} },
      ceiling:1268, ceilingTarget:800, ceilingReward:1500, resetCeiling:800, resetCeilingTarget:500, avgBonusReward:800, normalCostPerGame:2.5 },
    { id: "karakuri", name: "からくりサーカス", type: "AT", bigLabel: "AT初当たり", regLabel: "CZ合算", koyakuName: null,
      settings: { 1:{big:564,reg:333,koyaku:null,payout:97.5}, 2:{big:543,reg:320,koyaku:null,payout:98.7}, 4:{big:469,reg:292,koyaku:null,payout:103.0}, 5:{big:451,reg:277,koyaku:null,payout:108.1}, 6:{big:447,reg:275,koyaku:null,payout:114.9} },
      ceiling:1200, ceilingTarget:800, ceilingReward:500, resetCeiling:null, resetCeilingTarget:null, avgBonusReward:400, normalCostPerGame:2.3 },
    { id: "valvrave", name: "革命機ヴァルヴレイヴ", type: "AT", bigLabel: "CZ初当たり", regLabel: "ボーナス", koyakuName: null,
      settings: { 1:{big:277,reg:519,koyaku:null,payout:97.3}, 2:{big:275,reg:516,koyaku:null,payout:98.3}, 3:{big:274,reg:514,koyaku:null,payout:100.8}, 4:{big:269,reg:507,koyaku:null,payout:103.2}, 5:{big:264,reg:499,koyaku:null,payout:107.9}, 6:{big:258,reg:490,koyaku:null,payout:114.9} },
      ceiling:1000, ceilingTarget:700, ceilingReward:400, resetCeiling:null, resetCeilingTarget:null, avgBonusReward:300, normalCostPerGame:2.0 },
    { id: "monkey_turn_v", name: "モンキーターンV", type: "AT", bigLabel: "AT初当たり", regLabel: null, koyakuName: null,
      settings: { 1:{big:299.8,reg:null,koyaku:null,payout:97.9}, 2:{big:295.5,reg:null,koyaku:null,payout:98.9}, 4:{big:258.8,reg:null,koyaku:null,payout:104.5}, 5:{big:235.7,reg:null,koyaku:null,payout:110.2}, 6:{big:222.9,reg:null,koyaku:null,payout:114.9} },
      ceiling:795, ceilingTarget:500, ceilingReward:600, resetCeiling:495, resetCeilingTarget:300, avgBonusReward:400, normalCostPerGame:2.4 },
    { id: "tokyo_ghoul", name: "L 東京喰種", type: "AT", bigLabel: "AT初当たり", regLabel: "CZ初当たり", koyakuName: null,
      settings: { 1:{big:394.4,reg:262.6,koyaku:null,payout:97.5}, 2:{big:380.5,reg:255.6,koyaku:null,payout:99.0}, 3:{big:357.0,reg:246.5,koyaku:null,payout:101.6}, 4:{big:325.9,reg:233.1,koyaku:null,payout:105.6}, 5:{big:291.2,reg:216.4,koyaku:null,payout:110.3}, 6:{big:261.3,reg:203.7,koyaku:null,payout:114.9} },
      ceiling:600, ceilingTarget:350, ceilingReward:500, resetCeiling:200, resetCeilingTarget:50, avgBonusReward:350, normalCostPerGame:2.2 },
    { id: "kaguya_sama", name: "かぐや様は告らせたい", type: "AT", bigLabel: "ボーナス初当たり", regLabel: null, koyakuName: null,
      settings: { 1:{big:362,reg:null,koyaku:null,payout:97.7}, 2:{big:360,reg:null,koyaku:null,payout:98.8}, 3:{big:357,reg:null,koyaku:null,payout:101.2}, 4:{big:349,reg:null,koyaku:null,payout:105.8}, 5:{big:343,reg:null,koyaku:null,payout:110.8}, 6:{big:335,reg:null,koyaku:null,payout:114.9} },
      ceiling:1100, ceilingTarget:700, ceilingReward:1000, resetCeiling:800, resetCeilingTarget:500, avgBonusReward:600, normalCostPerGame:2.0 },
    { id: "god_eater", name: "ゴッドイーター リザレクション", type: "AT", bigLabel: "AT初当たり", regLabel: null, koyakuName: null,
      settings: { 1:{big:351.9,reg:null,koyaku:null,payout:97.9}, 2:{big:344.5,reg:null,koyaku:null,payout:98.9}, 3:{big:330.1,reg:null,koyaku:null,payout:101.1}, 4:{big:317.0,reg:null,koyaku:null,payout:105.6}, 5:{big:302.2,reg:null,koyaku:null,payout:110.0}, 6:{big:290.3,reg:null,koyaku:null,payout:114.9} },
      ceiling:1000, ceilingTarget:600, ceilingReward:1000, resetCeiling:600, resetCeilingTarget:300, avgBonusReward:600, normalCostPerGame:2.3 },
    { id: "bakemonogatari", name: "スマスロ 化物語", type: "AT", bigLabel: "AT初当たり", regLabel: null, koyakuName: null,
      settings: { 1:{big:265.1,reg:null,koyaku:null,payout:97.9}, 2:{big:260.7,reg:null,koyaku:null,payout:98.9}, 3:{big:252.1,reg:null,koyaku:null,payout:100.9}, 4:{big:238.8,reg:null,koyaku:null,payout:105.0}, 5:{big:230.8,reg:null,koyaku:null,payout:107.8}, 6:{big:219.6,reg:null,koyaku:null,payout:112.1} },
      ceiling:1000, ceilingTarget:600, ceilingReward:500, resetCeiling:600, resetCeilingTarget:350, avgBonusReward:400, normalCostPerGame:2.2 },
    { id: "hokuto_tensei2", name: "北斗の拳 転生の章2", type: "AT", bigLabel: "AT初当たり", regLabel: null, koyakuName: null,
      settings: { 1:{big:366.0,reg:null,koyaku:null,payout:97.6}, 2:{big:357.0,reg:null,koyaku:null,payout:98.4}, 3:{big:336.3,reg:null,koyaku:null,payout:100.7}, 4:{big:298.7,reg:null,koyaku:null,payout:106.2}, 5:{big:283.2,reg:null,koyaku:null,payout:111.1}, 6:{big:273.1,reg:null,koyaku:null,payout:114.9} },
      ceiling:1536, ceilingTarget:900, ceilingReward:1000, resetCeiling:1280, resetCeilingTarget:750, avgBonusReward:600, normalCostPerGame:2.3 },
    { id: "koukaku", name: "スマスロ 攻殻機動隊", type: "AT", bigLabel: "AT初当たり", regLabel: "CZ初当たり", koyakuName: null,
      settings: { 1:{big:336.3,reg:238.0,koyaku:null,payout:97.9}, 2:{big:332.0,reg:236.3,koyaku:null,payout:98.7}, 3:{big:319.6,reg:231.7,koyaku:null,payout:100.8}, 4:{big:298.7,reg:220.9,koyaku:null,payout:104.9}, 5:{big:285.8,reg:214.0,koyaku:null,payout:109.3}, 6:{big:278.0,reg:210.1,koyaku:null,payout:112.2} },
      ceiling:999, ceilingTarget:600, ceilingReward:600, resetCeiling:699, resetCeilingTarget:400, avgBonusReward:400, normalCostPerGame:2.2 },
    { id: "dmc5", name: "デビル メイ クライ 5", type: "AT", bigLabel: "ボーナス", regLabel: "ST", koyakuName: null,
      settings: { 1:{big:257.0,reg:445.4,koyaku:null,payout:97.5}, 2:{big:254.1,reg:436.5,koyaku:null,payout:98.2}, 3:{big:251.5,reg:411.2,koyaku:null,payout:100.2}, 4:{big:222.6,reg:359.6,koyaku:null,payout:105.2}, 5:{big:217.3,reg:329.5,koyaku:null,payout:109.2}, 6:{big:204.1,reg:303.9,koyaku:null,payout:114.9} },
      ceiling:1000, ceilingTarget:600, ceilingReward:800, resetCeiling:800, resetCeilingTarget:500, avgBonusReward:500, normalCostPerGame:2.2 },
    { id: "hihouden", name: "スマスロ 秘宝伝", type: "AT", bigLabel: "初当たり", regLabel: null, koyakuName: null,
      settings: { 1:{big:292.5,reg:null,koyaku:null,payout:97.8}, 2:{big:271.4,reg:null,koyaku:null,payout:99.0}, 3:{big:283.6,reg:null,koyaku:null,payout:101.5}, 4:{big:257.5,reg:null,koyaku:null,payout:105.1}, 5:{big:264.0,reg:null,koyaku:null,payout:110.1}, 6:{big:246.0,reg:null,koyaku:null,payout:114.7} },
      ceiling:799, ceilingTarget:550, ceilingReward:400, resetCeiling:499, resetCeilingTarget:300, avgBonusReward:300, normalCostPerGame:2.1 },
    { id: "tenken", name: "転生したら剣でした", type: "AT", bigLabel: "AT初当たり", regLabel: null, koyakuName: null,
      settings: { 1:{big:403.8,reg:null,koyaku:null,payout:97.9}, 2:{big:396.0,reg:null,koyaku:null,payout:99.0}, 3:{big:373.4,reg:null,koyaku:null,payout:101.2}, 4:{big:340.7,reg:null,koyaku:null,payout:105.7}, 5:{big:325.9,reg:null,koyaku:null,payout:109.1}, 6:{big:312.8,reg:null,koyaku:null,payout:112.1} },
      ceiling:970, ceilingTarget:600, ceilingReward:700, resetCeiling:600, resetCeilingTarget:350, avgBonusReward:400, normalCostPerGame:2.3 },
    { id: "valvrave2", name: "L革命機ヴァルヴレイヴ2", type: "AT", bigLabel: "初当たり合算", regLabel: null, koyakuName: null,
      settings: { 1:{big:476,reg:null,koyaku:null,payout:97.7}, 2:{big:473,reg:null,koyaku:null,payout:99.3}, 4:{big:464,reg:null,koyaku:null,payout:104.7}, 5:{big:459,reg:null,koyaku:null,payout:110.8}, 6:{big:456,reg:null,koyaku:null,payout:114.9} },
      ceiling:1500, ceilingTarget:700, ceilingReward:1200, resetCeiling:1000, resetCeilingTarget:500, avgBonusReward:800, normalCostPerGame:2.0 },
    { id: "enen", name: "炎炎ノ消防隊", type: "AT", bigLabel: "初当たり", regLabel: null, koyakuName: null,
      settings: { 1:{big:272,reg:null,koyaku:null,payout:97.7}, 2:{big:269,reg:null,koyaku:null,payout:98.8}, 3:{big:257,reg:null,koyaku:null,payout:101.2}, 4:{big:242,reg:null,koyaku:null,payout:105.6}, 5:{big:236,reg:null,koyaku:null,payout:110.2}, 6:{big:227,reg:null,koyaku:null,payout:114.9} },
      ceiling:850, ceilingTarget:550, ceilingReward:600, resetCeiling:650, resetCeilingTarget:350, avgBonusReward:400, normalCostPerGame:2.2 },
    { id: "tekken6", name: "スマスロ 鉄拳6", type: "AT", bigLabel: "ボーナス", regLabel: "AT初当たり", koyakuName: null,
      settings: { 1:{big:264.7,reg:497.0,koyaku:null,payout:97.9}, 2:{big:261.5,reg:484.1,koyaku:null,payout:98.9}, 3:{big:255.3,reg:456.8,koyaku:null,payout:100.5}, 4:{big:227.6,reg:397.6,koyaku:null,payout:105.2}, 5:{big:220.3,reg:366.4,koyaku:null,payout:110.3}, 6:{big:218.5,reg:358.5,koyaku:null,payout:114.9} },
      ceiling:900, ceilingTarget:600, ceilingReward:700, resetCeiling:500, resetCeilingTarget:300, avgBonusReward:400, normalCostPerGame:2.2 },
    { id: "prism_nana", name: "プリズムナナ", type: "AT", bigLabel: "初当たり", regLabel: null, koyakuName: null,
      settings: { 1:{big:351.8,reg:null,koyaku:null,payout:97.7}, 2:{big:346.9,reg:null,koyaku:null,payout:98.5}, 3:{big:337.2,reg:null,koyaku:null,payout:100.1}, 4:{big:306.6,reg:null,koyaku:null,payout:105.5}, 5:{big:290.1,reg:null,koyaku:null,payout:110.1}, 6:{big:278.6,reg:null,koyaku:null,payout:114.9} },
      ceiling:899, ceilingTarget:550, ceilingReward:700, resetCeiling:555, resetCeilingTarget:350, avgBonusReward:400, normalCostPerGame:2.2 },
    { id: "azurlane", name: "L アズールレーン THE ANIMATION", type: "AT", bigLabel: "AT初当たり", regLabel: null, koyakuName: null,
      settings: { 1:{big:598.9,reg:null,koyaku:null,payout:97.9}, 2:{big:589.5,reg:null,koyaku:null,payout:98.6}, 3:{big:564.2,reg:null,koyaku:null,payout:100.7}, 4:{big:527.1,reg:null,koyaku:null,payout:105.3}, 5:{big:483.0,reg:null,koyaku:null,payout:110.6}, 6:{big:467.5,reg:null,koyaku:null,payout:114.9} },
      ceiling:2000, ceilingTarget:1200, ceilingReward:1200, resetCeiling:null, resetCeilingTarget:null, avgBonusReward:600, normalCostPerGame:2.3 },
    { id: "zettai4", name: "L 絶対衝激IV", type: "AT", bigLabel: "ボーナス", regLabel: "AT初当たり", koyakuName: null,
      settings: { 1:{big:270,reg:543,koyaku:null,payout:97.2}, 2:{big:261,reg:501,koyaku:null,payout:98.6}, 3:{big:254,reg:450,koyaku:null,payout:100.6}, 4:{big:241,reg:357,koyaku:null,payout:105.8}, 5:{big:231,reg:304,koyaku:null,payout:109.0}, 6:{big:225,reg:266,koyaku:null,payout:112.5} },
      ceiling:null, ceilingTarget:null, ceilingReward:null, avgBonusReward:400, normalCostPerGame:2.2 },
    { id: "railgun2", name: "スマスロ とある科学の超電磁砲2", type: "AT", bigLabel: "AT初当たり", regLabel: "CZ初当たり", koyakuName: null,
      settings: { 1:{big:317.8,reg:175.7,koyaku:null,payout:97.7}, 2:{big:311.8,reg:172.6,koyaku:null,payout:98.9}, 3:{big:304.4,reg:168.5,koyaku:null,payout:100.3}, 4:{big:272.4,reg:156.6,koyaku:null,payout:105.4}, 5:{big:248.1,reg:145.7,koyaku:null,payout:110.0}, 6:{big:235.3,reg:137.5,koyaku:null,payout:112.9} },
      ceiling:999, ceilingTarget:550, ceilingReward:600, resetCeiling:699, resetCeilingTarget:400, avgBonusReward:400, normalCostPerGame:2.2 },
    { id: "onimusha3", name: "スマスロ 新鬼武者3", type: "AT", bigLabel: "AT初当たり", regLabel: null, koyakuName: null,
      settings: { 1:{big:379.7,reg:null,koyaku:null,payout:97.5}, 2:{big:372.7,reg:null,koyaku:null,payout:98.3}, 3:{big:352.8,reg:null,koyaku:null,payout:100.2}, 4:{big:306.5,reg:null,koyaku:null,payout:105.2}, 5:{big:297.9,reg:null,koyaku:null,payout:109.2}, 6:{big:293.1,reg:null,koyaku:null,payout:113.0} },
      ceiling:1000, ceilingTarget:500, ceilingReward:700, resetCeiling:700, resetCeilingTarget:400, avgBonusReward:400, normalCostPerGame:2.3 },
    { id: "zenigata5", name: "L主役は銭形5", type: "AT", bigLabel: "初当たり", regLabel: null, koyakuName: null,
      settings: { 2:{big:424.5,reg:null,koyaku:null,payout:97.9}, 3:{big:416.4,reg:null,koyaku:null,payout:99.0}, 4:{big:388.1,reg:null,koyaku:null,payout:103.2}, 5:{big:375.9,reg:null,koyaku:null,payout:107.1}, 6:{big:300.5,reg:null,koyaku:null,payout:112.1} },
      ceiling:1250, ceilingTarget:800, ceilingReward:800, resetCeiling:850, resetCeilingTarget:500, avgBonusReward:500, normalCostPerGame:2.3 },
    { id: "tokyo_revengers", name: "スマスロ 東京リベンジャーズ", type: "AT", bigLabel: "初当たり", regLabel: "AT初当たり", koyakuName: null,
      settings: { 1:{big:282.4,reg:482.2,koyaku:null,payout:97.8}, 2:{big:279.5,reg:474.7,koyaku:null,payout:98.8}, 3:{big:272.2,reg:456.9,koyaku:null,payout:101.4}, 4:{big:255.8,reg:414.0,koyaku:null,payout:106.3}, 5:{big:249.1,reg:393.8,koyaku:null,payout:111.2}, 6:{big:240.1,reg:373.1,koyaku:null,payout:114.9} },
      ceiling:1190, ceilingTarget:700, ceilingReward:800, resetCeiling:900, resetCeilingTarget:550, avgBonusReward:500, normalCostPerGame:2.2 },
    { id: "iza_banchou", name: "いざ！番長", type: "AT", bigLabel: "初当たり", regLabel: null, koyakuName: null,
      settings: { 1:{big:386.9,reg:null,koyaku:null,payout:97.6}, 2:{big:368.5,reg:null,koyaku:null,payout:98.9}, 3:{big:375.8,reg:null,koyaku:null,payout:101.3}, 4:{big:332.4,reg:null,koyaku:null,payout:106.0}, 5:{big:351.6,reg:null,koyaku:null,payout:112.1}, 6:{big:312.1,reg:null,koyaku:null,payout:114.9} },
      ceiling:999, ceilingTarget:600, ceilingReward:700, resetCeiling:600, resetCeilingTarget:350, avgBonusReward:400, normalCostPerGame:2.3 },
    { id: "monhan_rise", name: "スマスロ モンスターハンターライズ", type: "AT", bigLabel: "AT初当たり", regLabel: null, koyakuName: null,
      settings: { 1:{big:309.5,reg:null,koyaku:null,payout:97.9}, 2:{big:301.4,reg:null,koyaku:null,payout:98.8}, 3:{big:290.8,reg:null,koyaku:null,payout:100.3}, 4:{big:256.4,reg:null,koyaku:null,payout:105.4}, 5:{big:237.1,reg:null,koyaku:null,payout:110.1}, 6:{big:230.8,reg:null,koyaku:null,payout:114.3} },
      ceiling:999, ceilingTarget:600, ceilingReward:700, resetCeiling:null, resetCeilingTarget:null, avgBonusReward:400, normalCostPerGame:2.2 },
    { id: "enen2", name: "Lパチスロ 炎炎ノ消防隊2", type: "AT", bigLabel: "初当たり", regLabel: "炎炎ループ", koyakuName: null,
      settings: { 1:{big:272,reg:684,koyaku:null,payout:97.7}, 2:{big:269,reg:662,koyaku:null,payout:98.8}, 3:{big:257,reg:617,koyaku:null,payout:101.2}, 4:{big:242,reg:546,koyaku:null,payout:105.6}, 5:{big:236,reg:518,koyaku:null,payout:110.2}, 6:{big:227,reg:486,koyaku:null,payout:114.9} },
      ceiling:850, ceilingTarget:550, ceilingReward:600, resetCeiling:650, resetCeilingTarget:350, avgBonusReward:400, normalCostPerGame:2.2 },
    { id: "magireco", name: "スマスロ マギアレコード 魔法少女まどか☆マギカ外伝", type: "AT", bigLabel: "ボーナス初当たり", regLabel: "AT初当たり", koyakuName: null,
      settings: { 1:{big:240.6,reg:654.6,koyaku:null,payout:97.6}, 2:{big:236.1,reg:633.4,koyaku:null,payout:98.9}, 3:{big:222.8,reg:571.8,koyaku:null,payout:102.0}, 4:{big:208.5,reg:516.6,koyaku:null,payout:106.0}, 5:{big:195.1,reg:456.5,koyaku:null,payout:110.4}, 6:{big:184.3,reg:416.7,koyaku:null,payout:114.9} },
      ceiling:950, ceilingTarget:550, ceilingReward:500, resetCeiling:650, resetCeilingTarget:350, avgBonusReward:400, normalCostPerGame:2.2 },
    { id: "okidoki_duo", name: "スマスロ 沖ドキ！DUO アンコール", type: "AT", bigLabel: "初当たり", regLabel: null, koyakuName: null,
      settings: { 1:{big:240.0,reg:null,koyaku:null,payout:97.2}, 2:{big:230.2,reg:null,koyaku:null,payout:98.6}, 3:{big:215.8,reg:null,koyaku:null,payout:102.4}, 5:{big:192.1,reg:null,koyaku:null,payout:106.8}, 6:{big:181.0,reg:null,koyaku:null,payout:110.0} },
      ceiling:800, ceilingTarget:550, ceilingReward:500, resetCeiling:null, resetCeilingTarget:null, avgBonusReward:300, normalCostPerGame:2.0 },
    { id: "mushoku", name: "L 無職転生 ～異世界行ったら本気だす～", type: "AT", bigLabel: "AT初当たり", regLabel: null, koyakuName: null,
      settings: { 1:{big:416,reg:null,koyaku:null,payout:97.7}, 2:{big:406,reg:null,koyaku:null,payout:99.1}, 3:{big:394,reg:null,koyaku:null,payout:100.9}, 4:{big:361,reg:null,koyaku:null,payout:105.4}, 5:{big:327,reg:null,koyaku:null,payout:109.5}, 6:{big:292,reg:null,koyaku:null,payout:113.7} },
      ceiling:1007, ceilingTarget:600, ceilingReward:700, resetCeiling:689, resetCeilingTarget:400, avgBonusReward:400, normalCostPerGame:2.2 },
    { id: "sbj", name: "スマスロスーパーブラックジャック", type: "AT", bigLabel: "ボーナス初当たり", regLabel: null, koyakuName: null,
      settings: { 1:{big:241.7,reg:null,koyaku:null,payout:97.8}, 2:{big:238.8,reg:null,koyaku:null,payout:98.7}, 3:{big:235.9,reg:null,koyaku:null,payout:100.1}, 4:{big:201.8,reg:null,koyaku:null,payout:105.7}, 5:{big:194.9,reg:null,koyaku:null,payout:110.0}, 6:{big:181.3,reg:null,koyaku:null,payout:112.7} },
      ceiling:999, ceilingTarget:580, ceilingReward:700, resetCeiling:666, resetCeilingTarget:400, avgBonusReward:400, normalCostPerGame:2.2 },
    { id: "yoshimune", name: "吉宗", type: "AT", bigLabel: "初当たり", regLabel: null, koyakuName: null,
      settings: { 1:{big:378.9,reg:null,koyaku:null,payout:97.8}, 2:{big:369.6,reg:null,koyaku:null,payout:99.1}, 3:{big:358.8,reg:null,koyaku:null,payout:100.6}, 4:{big:335.1,reg:null,koyaku:null,payout:104.1}, 5:{big:318.5,reg:null,koyaku:null,payout:107.1}, 6:{big:292.4,reg:null,koyaku:null,payout:112.0} },
      ceiling:999, ceilingTarget:600, ceilingReward:800, resetCeiling:null, resetCeilingTarget:null, avgBonusReward:600, normalCostPerGame:2.3 },
    { id: "goblin_slayer2", name: "スマスロ ゴブリンスレイヤーⅡ", type: "AT", bigLabel: "AT初当たり", regLabel: "CZ初当たり", koyakuName: null,
      settings: { 1:{big:541.6,reg:239.3,koyaku:null,payout:97.6}, 2:{big:526.4,reg:232.3,koyaku:null,payout:98.7}, 3:{big:506.4,reg:222.9,koyaku:null,payout:100.4}, 4:{big:453.2,reg:200.4,koyaku:null,payout:104.9}, 5:{big:417.8,reg:187.3,koyaku:null,payout:109.7}, 6:{big:402.4,reg:181.9,koyaku:null,payout:113.2} },
      ceiling:1500, ceilingTarget:900, ceilingReward:800, resetCeiling:1000, resetCeilingTarget:550, avgBonusReward:500, normalCostPerGame:2.3 },
    { id: "otome4", name: "L戦国乙女4 戦乱に閃く炯眼の軍師", type: "AT", bigLabel: "ボーナス+AT合算", regLabel: "AT初当たり", koyakuName: null,
      settings: { 1:{big:272.7,reg:429.2,koyaku:null,payout:98.2}, 2:{big:267.3,reg:417.8,koyaku:null,payout:99.0}, 3:{big:255.3,reg:393.6,koyaku:null,payout:101.2}, 4:{big:238.2,reg:361.3,koyaku:null,payout:105.2}, 5:{big:223.2,reg:334.1,koyaku:null,payout:110.2}, 6:{big:217.1,reg:319.2,koyaku:null,payout:113.0} },
      ceiling:799, ceilingTarget:500, ceilingReward:500, resetCeiling:null, resetCeilingTarget:null, avgBonusReward:300, normalCostPerGame:2.2 },
    { id: "toloveru", name: "L ToLOVEるダークネス", type: "AT", bigLabel: "AT初当たり", regLabel: null, koyakuName: null,
      settings: { 2:{big:352.0,reg:null,koyaku:null,payout:98.0}, 3:{big:345.7,reg:null,koyaku:null,payout:99.0}, 4:{big:328.4,reg:null,koyaku:null,payout:102.5}, 5:{big:311.3,reg:null,koyaku:null,payout:105.8}, 6:{big:311.1,reg:null,koyaku:null,payout:110.1} },
      ceiling:999, ceilingTarget:600, ceilingReward:700, resetCeiling:650, resetCeilingTarget:350, avgBonusReward:400, normalCostPerGame:2.2 },
    { id: "baki", name: "Ｌ範馬刃牙", type: "AT", bigLabel: "ボーナス", regLabel: "AT初当たり", koyakuName: null,
      settings: { 1:{big:269.4,reg:525.3,koyaku:null,payout:97.7}, 2:{big:265.7,reg:517.1,koyaku:null,payout:98.5}, 3:{big:258.3,reg:503.2,koyaku:null,payout:100.5}, 4:{big:252.1,reg:484.5,koyaku:null,payout:105.2}, 5:{big:251.0,reg:481.9,koyaku:null,payout:107.9}, 6:{big:250.1,reg:480.4,koyaku:null,payout:110.6} },
      ceiling:700, ceilingTarget:400, ceilingReward:500, resetCeiling:200, resetCeilingTarget:100, avgBonusReward:350, normalCostPerGame:2.2 },
    { id: "biohazard5", name: "スマスロ バイオハザード5", type: "AT", bigLabel: "AT初当たり", regLabel: null, koyakuName: null,
      settings: { 1:{big:325.8,reg:null,koyaku:null,payout:97.8}, 2:{big:314.4,reg:null,koyaku:null,payout:98.8}, 3:{big:298.2,reg:null,koyaku:null,payout:100.6}, 4:{big:271.4,reg:null,koyaku:null,payout:104.6}, 5:{big:249.6,reg:null,koyaku:null,payout:108.9}, 6:{big:236.2,reg:null,koyaku:null,payout:114.9} },
      ceiling:999, ceilingTarget:600, ceilingReward:700, resetCeiling:666, resetCeilingTarget:400, avgBonusReward:400, normalCostPerGame:2.2 },
    { id: "revuestarlight", name: "L少女☆歌劇 レヴュースタァライト -The SLOT-", type: "AT", bigLabel: "ボーナス合算", regLabel: "AT初当たり", koyakuName: null,
      settings: { 1:{big:184.8,reg:359.6,koyaku:null,payout:97.8}, 2:{big:182.2,reg:346.8,koyaku:null,payout:98.8}, 4:{big:169.9,reg:277.1,koyaku:null,payout:104.6}, 5:{big:165.4,reg:255.7,koyaku:null,payout:106.9}, 6:{big:160.6,reg:232.5,koyaku:null,payout:110.0} },
      ceiling:900, ceilingTarget:550, ceilingReward:600, resetCeiling:600, resetCeilingTarget:350, avgBonusReward:400, normalCostPerGame:2.2 },
];

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
    revuestarlight: "setGuessElement/revuestarlight/index.html"
};

function calculateCeilingEV(machine, currentGames, overrideCeiling) {
    const ceiling = overrideCeiling || machine.ceiling;
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
    ev += pReachCeiling * (machine.ceilingReward - remaining * costPerGame);
    return { evMedals: ev, evYen: ev * 20, pReachCeiling: pReachCeiling * 100 };
}

function buildEvTable(machine, overrideCeiling, overrideTarget) {
    const ceiling = overrideCeiling || machine.ceiling;
    const target = overrideTarget || machine.ceilingTarget;
    if (!ceiling) return "";
    const step = 100;
    const rows = [];
    for (let g = 0; g <= ceiling; g += step) {
        const evData = calculateCeilingEV(machine, g, overrideCeiling);
        if (!evData) continue;
        const yen = Math.round(evData.evYen);
        const sign = yen >= 0 ? "+" : "";
        const isTarget = g >= target;
        const cls = yen >= 0 ? "positive" : "negative";
        const judgment = isTarget ? "&#9711;" : g >= target - 100 ? "&#9651;" : "&#10005;";
        rows.push(`                            <tr class="${cls}"><td>${g}G</td><td class="${cls}">${sign}${yen.toLocaleString()}円</td><td>${evData.pReachCeiling.toFixed(1)}%</td><td>${judgment}</td></tr>`);
    }
    return rows.join("\n");
}

function buildSpecTable(machine) {
    const settingKeys = Object.keys(machine.settings).map(Number).sort((a, b) => a - b);
    const hasReg = machine.regLabel && settingKeys.some(s => machine.settings[s].reg !== null);
    const hasKoyaku = machine.koyakuName && settingKeys.some(s => machine.settings[s].koyaku !== null);

    let thead = `<tr><th>設定</th><th>${machine.bigLabel}</th>`;
    if (hasReg) thead += `<th>${machine.regLabel}</th>`;
    if (hasReg) thead += `<th>合算</th>`;
    if (hasKoyaku) thead += `<th>${machine.koyakuName}</th>`;
    thead += `<th>出玉率</th></tr>`;

    const rows = settingKeys.map(s => {
        const d = machine.settings[s];
        let row = `                            <tr><td class="ge-setting s${s}">設定${s}</td><td>1/${Number(d.big).toFixed(1)}</td>`;
        if (hasReg) {
            const regVal = d.reg !== null ? `1/${Number(d.reg).toFixed(1)}` : "-";
            row += `<td>${regVal}</td>`;
            if (d.reg !== null) {
                const combined = 1 / (1 / d.big + 1 / d.reg);
                row += `<td>1/${combined.toFixed(1)}</td>`;
            } else {
                row += `<td>-</td>`;
            }
        }
        if (hasKoyaku) {
            row += `<td>${d.koyaku !== null ? `1/${Number(d.koyaku).toFixed(2)}` : "-"}</td>`;
        }
        row += `<td>${d.payout}%</td></tr>`;
        return "                            " + row;
    });

    return { thead, tbody: rows.join("\n") };
}

function generatePage(machine) {
    const isAT = machine.type === "AT";
    const typeName = isAT ? "AT/ART機（スマスロ）" : "Aタイプ";
    const hasCeiling = machine.ceiling !== null && machine.ceiling > 0;

    const titleKeyword = isAT
        ? `${machine.name} 設定推測・天井期待値`
        : `${machine.name} 設定判別・ボーナス確率`;
    const pageTitle = `${titleKeyword} | Setting Analyzer Pro`;

    const descKeywords = isAT
        ? `${machine.name}の設定推測と天井期待値を自動計算。${machine.bigLabel}確率、出玉率から設定判別。天井${machine.ceiling}G、狙い目${machine.ceilingTarget}G〜。ゲーム数別の天井期待値一覧表も掲載。`
        : `${machine.name}の設定推測ツール。${machine.bigLabel}確率・${machine.regLabel}確率・合算確率から設定判別。各設定のスペック一覧も掲載。`;

    const spec = buildSpecTable(machine);
    const evTableRows = buildEvTable(machine);
    const resetEvTableRows = machine.resetCeiling ? buildEvTable(machine, machine.resetCeiling, machine.resetCeilingTarget) : "";
    const guessElementPath = GUESS_ELEMENT_PAGES[machine.id];

    const settingKeys = Object.keys(machine.settings).map(Number).sort((a, b) => a - b);
    const s1key = settingKeys[0];
    const s6key = settingKeys[settingKeys.length - 1];

    const faqItems = [];
    if (hasCeiling) {
        faqItems.push({
            q: `${machine.name}の天井は何ゲーム？`,
            a: `${machine.name}の天井は${machine.ceiling}Gです。狙い目は${machine.ceilingTarget}G〜が目安です。`
        });
    }
    faqItems.push({
        q: `${machine.name}の設定${s6key}の${machine.bigLabel}確率は？`,
        a: `設定${s6key}の${machine.bigLabel}確率は1/${Number(machine.settings[s6key].big).toFixed(1)}です。出玉率は${machine.settings[s6key].payout}%です。`
    });

    const faqJsonLd = JSON.stringify({
        "@context": "https://schema.org",
        "@type": "FAQPage",
        "mainEntity": faqItems.map(f => ({
            "@type": "Question",
            "name": f.q,
            "acceptedAnswer": { "@type": "Answer", "text": f.a }
        }))
    }, null, 8);

    const breadcrumbJsonLd = JSON.stringify({
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        "itemListElement": [
            { "@type": "ListItem", "position": 1, "name": "トップ", "item": `${SITE_URL}/` },
            { "@type": "ListItem", "position": 2, "name": machine.name, "item": `${SITE_URL}/machines/${machine.id}/` }
        ]
    }, null, 8);

    const ceilingSection = hasCeiling ? `
            <section class="card lp-section" id="ceiling-ev">
                <h2 class="card-title"><span class="card-icon">&#127919;</span> 天井期待値一覧（ゲーム数別）</h2>
                <p class="lp-desc">設定1基準・等価（1メダル=20円）換算の天井期待値です。狙い目は<strong>${machine.ceilingTarget}G〜</strong>が目安です。</p>
                <div class="lp-ceiling-info">
                    <div class="lp-ceiling-item"><span class="lp-ceil-label">天井</span><span class="lp-ceil-val">${machine.ceiling}G</span></div>
                    <div class="lp-ceiling-item"><span class="lp-ceil-label">狙い目</span><span class="lp-ceil-val">${machine.ceilingTarget}G〜</span></div>
                    <div class="lp-ceiling-item"><span class="lp-ceil-label">天井恩恵</span><span class="lp-ceil-val">約${machine.ceilingReward}枚</span></div>
                </div>
                <div class="table-wrapper">
                    <table class="spec-table lp-ev-table">
                        <thead>
                            <tr><th>現在G数</th><th>期待値</th><th>天井到達率</th><th>判定</th></tr>
                        </thead>
                        <tbody>
${evTableRows}
                        </tbody>
                    </table>
                </div>
                <p class="lp-note">※ 期待値は設定${s1key}を基準に、通常時の消費メダルと天井恩恵から算出した概算値です。実際の期待値はモード状態や前兆等により変動します。</p>
            </section>` : "";

    const resetCeilingSection = hasCeiling && machine.resetCeiling ? `
            <section class="card lp-section" id="reset-ceiling-ev">
                <h2 class="card-title"><span class="card-icon">&#127919;</span> 朝一リセット時の天井期待値</h2>
                <p class="lp-desc">朝一リセット時の天井は<strong>${machine.resetCeiling}G</strong>に短縮されます。狙い目は<strong>${machine.resetCeilingTarget}G〜</strong>が目安です。</p>
                <div class="lp-ceiling-info">
                    <div class="lp-ceiling-item"><span class="lp-ceil-label">リセット天井</span><span class="lp-ceil-val">${machine.resetCeiling}G</span></div>
                    <div class="lp-ceiling-item"><span class="lp-ceil-label">狙い目</span><span class="lp-ceil-val">${machine.resetCeilingTarget}G〜</span></div>
                </div>
                <div class="table-wrapper">
                    <table class="spec-table lp-ev-table">
                        <thead>
                            <tr><th>現在G数</th><th>期待値</th><th>天井到達率</th><th>判定</th></tr>
                        </thead>
                        <tbody>
${resetEvTableRows}
                        </tbody>
                    </table>
                </div>
                <p class="lp-note">※ 朝一リセット時の天井${machine.resetCeiling}Gを基準に算出した概算値です。</p>
            </section>` : "";

    const guessElementLink = guessElementPath
        ? `
            <section class="card lp-section">
                <h2 class="card-title"><span class="card-icon">&#128270;</span> 設定推測要素</h2>
                <p class="lp-desc">${machine.bigLabel}確率以外の設定推測要素（終了画面、子役確率など）を確認できます。</p>
                <div class="lp-cta">
                    <a href="../../${guessElementPath}" class="btn-primary lp-btn">設定推測要素の詳細を見る</a>
                </div>
            </section>` : "";

    const tocItems = [];
    tocItems.push(`<li><a href="#spec">設定別スペック一覧</a></li>`);
    if (hasCeiling) tocItems.push(`<li><a href="#ceiling-ev">天井期待値一覧</a></li>`);
    if (hasCeiling && machine.resetCeiling) tocItems.push(`<li><a href="#reset-ceiling-ev">朝一リセット時の天井期待値</a></li>`);
    tocItems.push(`<li><a href="#tool">設定推測ツールを使う</a></li>`);

    const html = `<!DOCTYPE html>
<html lang="ja">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <link rel="icon" type="image/png" sizes="32x32" href="../../favicon.png">
    <link rel="apple-touch-icon" href="../../favicon.png">
    <meta name="google-site-verification" content="notZvvy3fn5NBCAcfut0i4SBJp3iOduLrxj6DJH0j0E" />
    <meta name="description" content="${descKeywords}">
    <meta property="og:title" content="${pageTitle}">
    <meta property="og:description" content="${descKeywords}">
    <meta property="og:type" content="article">
    <meta property="og:url" content="${SITE_URL}/machines/${machine.id}/">
    <meta property="og:locale" content="ja_JP">
    <link rel="canonical" href="${SITE_URL}/machines/${machine.id}/">
    <title>${pageTitle}</title>
    <link rel="stylesheet" href="../../style.css">
    <link rel="stylesheet" href="../../machines/landing-page.css">
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Noto+Sans+JP:wght@400;500;700;900&display=swap" rel="stylesheet">
    <script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-9806077794369384"
         crossorigin="anonymous"></script>
    <script type="application/ld+json">
${faqJsonLd}
    </script>
    <script type="application/ld+json">
${breadcrumbJsonLd}
    </script>
</head>
<body>
    <div class="app-container lp-container">
        <header class="app-header">
            <div class="header-inner">
                <p class="app-subtitle"><a href="../../index.html" class="back-link">&larr; トップに戻る</a></p>
                <h1 class="app-title">${machine.name}</h1>
                <p class="app-subtitle">${titleKeyword}</p>
            </div>
        </header>

        <main class="main-content">

            <nav class="lp-breadcrumb" aria-label="パンくずリスト">
                <ol>
                    <li><a href="../../index.html">トップ</a></li>
                    <li>${machine.name}</li>
                </ol>
            </nav>

            <nav class="card lp-section">
                <h2 class="card-title"><span class="card-icon">&#128204;</span> 目次</h2>
                <ul class="lp-toc">
                    ${tocItems.join("\n                    ")}
                </ul>
            </nav>

            <section class="card lp-section" id="spec">
                <h2 class="card-title"><span class="card-icon">&#128203;</span> 設定別スペック一覧</h2>
                <p class="lp-desc">${machine.name}（${typeName}）の設定別スペック表です。${machine.bigLabel}確率と出玉率に注目して設定判別に活用してください。</p>
                <div class="table-wrapper">
                    <table class="spec-table lp-spec-table">
                        <thead>
                            ${spec.thead}
                        </thead>
                        <tbody>
${spec.tbody}
                        </tbody>
                    </table>
                </div>
            </section>
${ceilingSection}
${resetCeilingSection}
${guessElementLink}
            <section class="card lp-section" id="tool">
                <h2 class="card-title"><span class="card-icon">&#9889;</span> 設定推測ツールで計算する</h2>
                <p class="lp-desc">${machine.name}のデータを入力して、設定推測と天井期待値を自動計算できます。</p>
                <div class="lp-cta">
                    <a href="../../index.html" class="btn-primary lp-btn">設定推測ツールを開く</a>
                </div>
            </section>

            <div class="lp-back-bottom">
                <a href="../../index.html" class="btn-primary lp-back-btn">
                    <span class="btn-icon">&#9664;</span>
                    トップに戻る
                </a>
            </div>

        </main>

        <footer class="app-footer">
            <div class="footer-links">
                <a href="../../privacy.html">プライバシーポリシー</a>
                <a href="../../terms.html">利用規約</a>
                <a href="../../contact.html">お問い合わせ</a>
                <a href="../../about.html">アプリについて</a>
            </div>
            <p>&copy; Setting Analyzer Pro</p>
        </footer>
    </div>
</body>
</html>`;

    return html;
}

// ============================================================
// 生成実行
// ============================================================
const machinesDir = path.join(__dirname, "machines");
if (!fs.existsSync(machinesDir)) fs.mkdirSync(machinesDir, { recursive: true });

const sitemapUrls = [`  <url>\n    <loc>${SITE_URL}/</loc>\n    <priority>1.0</priority>\n  </url>`];

MACHINES.forEach(m => {
    const dir = path.join(machinesDir, m.id);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

    const html = generatePage(m);
    fs.writeFileSync(path.join(dir, "index.html"), html, "utf-8");
    console.log(`Created: machines/${m.id}/index.html`);

    sitemapUrls.push(`  <url>\n    <loc>${SITE_URL}/machines/${m.id}/</loc>\n    <lastmod>${new Date().toISOString().slice(0,10)}</lastmod>\n    <priority>0.8</priority>\n  </url>`);
});

// setGuessElement pages
Object.values(GUESS_ELEMENT_PAGES).forEach(p => {
    sitemapUrls.push(`  <url>\n    <loc>${SITE_URL}/${p.replace("index.html","")}</loc>\n    <lastmod>${new Date().toISOString().slice(0,10)}</lastmod>\n    <priority>0.6</priority>\n  </url>`);
});

// Static pages
["privacy.html", "terms.html", "contact.html", "about.html"].forEach(p => {
    sitemapUrls.push(`  <url>\n    <loc>${SITE_URL}/${p}</loc>\n    <priority>0.3</priority>\n  </url>`);
});

const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${sitemapUrls.join("\n")}
</urlset>`;

fs.writeFileSync(path.join(__dirname, "sitemap.xml"), sitemap, "utf-8");
console.log("\nUpdated: sitemap.xml");
console.log(`Total: ${MACHINES.length} machine pages created`);
