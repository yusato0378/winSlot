const fs = require("fs");
const path = require("path");
const root = path.join(__dirname, "..");

const at = [
  ["machines/kabaneri/", "甲鉄城のカバネリ"],
  ["machines/kabaneri_unato/", "スマスロ 甲鉄城のカバネリ 海門決戦"],
  ["machines/banchou4/", "押忍！番長4"],
  ["machines/hokuto/", "スマスロ北斗の拳"],
  ["machines/karakuri/", "からくりサーカス"],
  ["machines/valvrave/", "革命機ヴァルヴレイヴ"],
  ["machines/monkey_turn_v/", "モンキーターンV"],
  ["machines/tokyo_ghoul/", "L 東京喰種"],
  ["machines/kaguya_sama/", "かぐや様は告らせたい"],
  ["machines/god_eater/", "ゴッドイーター リザレクション"],
  ["machines/bakemonogatari/", "スマスロ 化物語"],
  ["machines/hokuto_tensei2/", "北斗の拳 転生の章2"],
  ["machines/koukaku/", "スマスロ 攻殻機動隊"],
  ["machines/dmc5/", "デビル メイ クライ 5"],
  ["machines/hihouden/", "スマスロ 秘宝伝"],
  ["machines/tenken/", "転生したら剣でした"],
  ["machines/valvrave2/", "L革命機ヴァルヴレイヴ2"],
  ["machines/enen/", "炎炎ノ消防隊"],
  ["machines/tekken6/", "スマスロ 鉄拳6"],
  ["machines/prism_nana/", "プリズムナナ"],
  ["machines/azurlane/", "L アズールレーン THE ANIMATION"],
  ["machines/zettai4/", "L 絶対衝激IV"],
  ["machines/railgun2/", "スマスロ とある科学の超電磁砲2"],
  ["machines/onimusha3/", "スマスロ 新鬼武者3"],
  ["machines/zenigata5/", "L主役は銭形5"],
  ["machines/tokyo_revengers/", "スマスロ 東京リベンジャーズ"],
  ["machines/iza_banchou/", "いざ！番長"],
  ["machines/monhan_rise/", "スマスロ モンスターハンターライズ"],
  ["machines/enen2/", "Lパチスロ 炎炎ノ消防隊2"],
  ["machines/magireco/", "スマスロ マギアレコード 魔法少女まどか☆マギカ外伝"],
  ["machines/okidoki_duo/", "スマスロ 沖ドキ！DUO アンコール"],
  ["machines/mushoku/", "L 無職転生 ～異世界行ったら本気だす～"],
  ["machines/sbj/", "スマスロスーパーブラックジャック"],
  ["machines/yoshimune/", "吉宗"],
  ["machines/goblin_slayer2/", "スマスロ ゴブリンスレイヤーⅡ"],
  ["machines/otome4/", "L戦国乙女4 戦乱に閃く炯眼の軍師"],
  ["machines/toloveru/", "L ToLOVEるダークネス"],
  ["machines/baki/", "Ｌ範馬刃牙"],
  ["machines/biohazard5/", "スマスロ バイオハザード5"],
  ["machines/eureka_seven_art/", "交響詩篇エウレカセブン HI-EVOLUTION ZERO TYPE-ART"],
  ["machines/shake_bt/", "スマスロ シェイク ボーナストリガー"],
  ["machines/harem_ace_bt/", "翔べ！ハーレムエース"],
  ["machines/alex_bt/", "スマスロ アレックスブライト"],
  ["machines/bofuri/", "スマスロ痛いのは嫌なので防御力に極振りしたいと思います。"],
  ["machines/nanatsu_maken/", "L七つの魔剣が支配する"],
  ["machines/granbelm/", "回胴式遊技機 グランベルム"],
  ["machines/revuestarlight/", "L少女☆歌劇 レヴュースタァライト -The SLOT-"],
  ["machines/akudama_drive/", "L アクダマドライブ"],
  ["machines/kyokou_suiritr/", "L 虚構推理"],
  ["machines/jormungand/", "スマスロ ヨルムンガンド"],
  ["machines/shinuchi_yoshimune/", "真打 吉宗"],
];
const aType = [
  ["machines/aim_juggler_ex/", "アイムジャグラーEX"],
  ["machines/my_juggler_v/", "マイジャグラーV"],
  ["machines/funky_juggler_2/", "ファンキージャグラー2"],
  ["machines/gogo_juggler_3/", "ゴーゴージャグラー3"],
  ["machines/ultra_miracle_juggler/", "ウルトラミラクルジャグラー"],
  ["machines/discup_ultraremix/", "A-SLOT+ ディスクアップ ULTRAREMIX"],
  ["machines/smaslo_hanabi/", "スマスロ ハナビ"],
  ["machines/thunder_v/", "スマスロ サンダーV"],
  ["machines/umineko2/", "うみねこのなく頃に2"],
  ["machines/crea_hihouden/", "クレアの秘宝伝 BT"],
  ["machines/eva_bt/", "エヴァンゲリオン 約束の扉"],
  ["machines/isekai_quartet_bt/", "A-SLOT+ 異世界かるてっと BT"],
  ["machines/lb_triple_crown_seven/", "LB トリプルクラウンセブン"],
];
/** 50音順に近づけるため、一覧表示名から並べ替え用キーを作る */
function sortKey(displayName) {
  const overrides = {
    "L ToLOVEるダークネス": "とらぶるだーくねす",
    "L アズールレーン THE ANIMATION": "あずーるれーん",
    "A-SLOT+ ディスクアップ ULTRAREMIX": "でぃすくあっぷ",
    "A-SLOT+ 異世界かるてっと BT": "いせかるてっと",
    "LB トリプルクラウンセブン": "とりぷるくらうんせぶん",
    "真打 吉宗": "しんうちよしむね",
  };
  if (overrides[displayName]) return overrides[displayName];

  let s = displayName.trim();
  s = s.replace(/^Lパチスロ\s+/, "").replace(/^L\s+/, "").replace(/^Ｌ/, "");
  s = s.replace(/^スマスロスーパーブラックジャック/, "すーぱーぶらっくじゃっく");
  s = s.replace(/^スマスロ痛いのは嫌なので防御力に極振りしたいと思います。/, "いたいのはいやなのでぼうぎょりょく");
  s = s.replace(/^スマスロ\s+/, "");
  s = s.replace(/^スマスロ/, "");

  const m = s.match(/[\u3040-\u309f\u30a0-\u30ff\u4e00-\u9faf]/);
  if (m) {
    const i = s.indexOf(m[0]);
    return s.slice(i);
  }
  return s;
}

function sortJa(arr) {
  return arr.slice().sort((x, y) => sortKey(x[1]).localeCompare(sortKey(y[1]), "ja"));
}

function toUlLines(sorted) {
  return sorted.map(([h, t]) => `                    <li><a href="${h}">${t}</a></li>`).join("\n");
}

fs.writeFileSync(path.join(root, "at-sorted.txt"), toUlLines(sortJa(at)) + "\n", "utf8");
fs.writeFileSync(path.join(root, "a-sorted.txt"), toUlLines(sortJa(aType)) + "\n", "utf8");
console.log("Wrote at-sorted.txt, a-sorted.txt (UTF-8)");
