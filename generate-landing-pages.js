/**
 * 機種別ランディングページ自動生成スクリプト
 * 実行: node generate-landing-pages.js
 */
const fs = require("fs");
const path = require("path");

const SITE_URL = "https://pachislot-setting.com";

function escapeHtml(str) {
    if (str == null) return "";
    return String(str)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;");
}

/** 機種LP用の手書き解説（200〜500字目安）。未設定の機種はセクション非表示。 */
const EDITORIAL_BY_ID = {
    kabaneri: `甲鉄城のカバネリは、AT中の伸びと天井到達までのゲーム数バランスが打ち手の核になります。初当たり確率は設定差が大きく、実戦データが十分溜まるほどベイズ推測の解像度が上がりやすい機種です。\n\n天井は1000G前後が目安で、狙い目はツール上の期待値がプラスに転じ始める帯から検討するのが一般的です。朝一リセットで天井が短くなる店舗もあるため、前日の残りゲーム数とセットで見ると判断がブレにくくなります。\n\n設定判別では初当たり頻度だけでなく、ST継続の体感や示唆演出の傾向も材料になりますが、本サイトの数値はあくまで公開スペックに基づく参考値です。無理な期待値狙いは避け、資金管理と併せてご利用ください。`,

    hokuto: `スマスロ北斗の拳は、AT初当たり確率の設定差と長尺の天井が立ち回りを左右する代表格です。ゲーム数が深いほど天井期待値の影響が大きくなるため、現在位置と狙い目帯を数値で把握しておく意味が大きい機種と言えます。\n\n天井・リセット天井の扱いは店舗運用で変わりやすい点に注意が必要です。ツールの期待値は設定1基準の簡易モデルであり、モードや内部状態の差は反映しきれません。\n\n設定推測では総回転と初当たり回数のバランスが鍵になります。データが浅いうちは推定確率が振れやすいので、長めに記録してから解釈するのがおすすめです。`,

    banchou4: `押忍！番長4は、初当たり確率の設定差が比較的クリアに出やすいAT機として知られています。REGが無い構成のため、入力項目がシンプルで推測モデルと相性が良いのも特徴です。\n\n天井は699Gが目安で、深いゾーンに入った際の期待値判断が打ち続け・見切りの材料になります。前日からの持ち越しがあるホールでは、朝一のリセット有無で天井の見え方が変わるため注意してください。\n\n演出やモードで確率が揺れる局面もあるため、推測結果は「長期の傾向」を見る補助ツールとして使うのが安全です。`,

    bakemonogatari: `スマスロ化物語は、AT初当たりからの展開比重が高く、スペック差が実戦体感に現れやすいタイプです。総ゲーム数に対する初当たり回数が、設定推測の主なインプットになります。\n\n天井は1000G前後を軸に期待値を見る打ち手が多く、ツールのゲーム数別期待値は「今どの帯か」を把握するのに便利です。朝一短縮天井がある場合は別枠で評価が必要です。\n\n化物語系は示唆演出の派手さが打ち手のモチベーションに直結しがちですが、設定判別はあくまでデータの積み上げが中心です。短時間の結果に一喜一憂せず、記録を継続してください。`,

    okidoki_duo: `沖ドキ！DUO アンコールは、初当たり確率の設定差と沖スルー感の強さがポイントになる機種です。ハマりが深いほど天井期待値の比重が上がるため、現在ゲーム数の管理が重要になります。\n\nスペック表では設定6帯の初当たりが軽くなる傾向が読み取れますが、実戦では短期で大きく振れることがあります。推測結果はサンプル数が十分なときほど信頼度が上がります。\n\n「沖」系特有のテンポと天井の相対関係を意識し、無理な期待値プレイにならないよう予算と時間の上限を決めておくと安全です。`,

    aim_juggler_ex: `アイムジャグラーEXは、BIG・REG・ブドウの三要素が揃った王道ジャグラー系です。設定差は合算確率と小役に現れるため、カウンターを正確に取るほど推測精度が上がります。\n\nAタイプは天井が無い機種が多く、長期の確率収束を見るスタイルになります。数千ゲーム単位のデータがあると設定6寄りの示唆が強まりやすい一方、数百ゲームでは振れ幅が大きい点に注意してください。\n\nREG単独の偏りは設定推測で拾いやすいシグナルですが、偶発的な連チャンでも一時的に推定が膨らみます。トータルの回転数と合わせて解釈しましょう。`,

    my_juggler_v: `マイジャグラーVは、シリーズの中でも設定差が比較的フラットになりやすい一方、データ量次第では推測に寄せていける機種です。BIGとREGのバランス、ブドウの頻度が主な観測点になります。\n\nジャグラー全般に言えることですが、ハイエナ的な短時間打法では推測ツールの信頼度が下がります。同じ台で継続して記録を溜めるほど、スペック差が統計的に浮かび上がりやすくなります。\n\n「設定が付いているか」ではなく「今のデータがどの設定帯に近いか」を見るツールだと捉えると、結果の読み違いを減らせます。`,

    discup_ultraremix: `A-SLOT+ ディスクアップ ULTRAREMIXは、BIG・REGの比率と出玉率の設定差が特徴的なA+タイプです。小役が無い分、入力がシンプルで推測モデルと相性が良い面があります。\n\n一部設定が表から省略されている場合は補間データを利用しているため、厳密な公式値との差異に留意してください。遊技目的はあくまで参考情報として扱います。\n\nディスクアップ系はテンポと音楽性が打ち手を支える機種ですが、設定判別は冷静に回転数を積むほど有利です。短時間の結果だけで判断しないよう心がけましょう。`,

    smaslo_hanabi: `スマスロ ハナビは、BIG・REGのバランス型スペックで設定差が段階的に付く構成です。花火シリーズの軽快な演出の一方、データ面では合算確率と出玉率が推測の軸になります。\n\nAタイプのため天井は基本的に無く、長期の統計的傾向を見るスタイルになります。数千ゲーム規模のデータがあると、設定6寄りのシグナルが読みやすくなる傾向があります。\n\nハナビ系は「快適に回せる」ことが強みですが、設定推測は退屈な記録作業の積み重ねが精度を作ります。カウンターの取り違えにだけは注意してください。`,

    kabaneri_unato: `スマスロ 甲鉄城のカバネリ 海門決戦は、前作の枠組みを踏襲しつつスペックと天井設計が調整された後継機です。初当たり確率の設定差と天井到達までのゲーム数が、立ち回り判断の中心になります。\n\n996G前後の天井やリセット時の短縮天井は店舗運用で解釈が変わるため、ホールの前日データと併せて見るのがおすすめです。期待値表は設定1基準の概算です。\n\nアニメ原作ファンには演出期待が高い一方、設定判別は数値の積み上げが基本です。推測結果は参考値として、責任ある遊技を心がけてください。`,

    hokuto_tensei2: `北斗の拳 転生の章2は、AT初当たりから天井までの尺が長めで、ゲーム数管理が特に重要な機種です。深いハマりほど天井期待値の影響が大きくなるタイプと言えます。\n\n1536G級の天井やリセット天井の別ラインがあるため、ツール上で通常時とリセット時を分けて期待値を確認できるのが利点です。実戦では内部状態やモードでブレる点に注意してください。\n\n設定推測は初当たり回数と総回転の比率が鍵になります。データが浅い間は推定確率が振れやすいので、長めの記録を推奨します。`,

    kaguya_sama: `かぐや様は告らせたいは、ボーナス初当たりからAT展開へ繋がる構成で、スペック差が初当たり頻度に表れやすい機種です。天井・リセット天井の二段構えを意識した立ち回りが求められます。\n\n狙い目ゲーム数付近では期待値の符号が変わりやすいため、ツールの一覧表で「今いる帯」を把握しておくと判断がしやすくなります。\n\n恋愛コメディ系の演出はテンポが良い一方、設定判別は地味なカウンター管理が不可欠です。推測は補助線として使い、過信は避けましょう。`,

    koukaku: `スマスロ 攻殻機動隊は、AT初当たりとCZ初当たりの二系統を扱うスペックで、入力項目が多い分だけ材料も増える機種です。合算の見え方を理解しておくと推測結果の解釈が安定します。\n\n天井は1000G前後を軸に、リセット時は短くなるラインがあります。店舗ごとの運用差が大きいので、前日からのゲーム数確認は欠かせません。\n\n作品世界観の没入感と数値の冷静さのバランスが長く打つコツです。ツールの数値は公開情報ベースの参考値としてご利用ください。`,

    karakuri: `からくりサーカスは、AT初当たりとCZ合算の設定差が特徴的な機種です。スペック表の「CZ合算」列は、推測時の解釈に直結するため、入力データの取り方を間違えないことが重要です。\n\n天井は1200G前後が目安で、深いゾーンでは期待値判断が打ち手の意思決定に効きます。ただし内部状態や示唆でブレる局面もあるため、期待値は目安と捉えてください。\n\n長尺のストーリー演出が魅力ですが、設定判別は地道な記録が鍵です。短時間の結果に振り回されないよう、データ量を意識しましょう。`,

    god_eater: `ゴッドイーター リザレクションは、AT初当たり確率の設定差と天井恩恵の厚さが打ち味を作る機種です。ハマりが深くなるほど天井期待値の比重が上がるため、現在ゲーム数の把握が欠かせません。\n\nリセット天井ラインがある場合は、朝一と通常で期待値の見え方が変わります。ツールの二段表示を活用し、状況に合わせて読み替えてください。\n\nアクション性の高い演出はモチベーションを上げますが、設定推測は統計の積み上げです。予算と時間の上限を決め、責任ある遊技を心がけてください。`,

    funky_juggler_2: `ファンキージャグラー2は、BIG・REG・ブドウの三拍子で設定差を読み取る王道ジャグラー系です。合算確率と小役の偏りが推測の主戦場になるため、カウンターの精度がそのまま結果の信頼度に直結します。\n\nAタイプのため本機に天井はなく、長期の統計的収束を前提にした立ち回りになります。数百ゲームでは上下振れが大きいので、数千ゲーム規模で傾向を見る意識が重要です。\n\nジャグラーは「快打感」が魅力ですが、設定推測は地味な記録の積み重ねが鍵です。推測結果は参考値として扱い、過信は避けましょう。`,

    gogo_juggler_3: `ゴーゴージャグラー3は、シリーズらしいテンポの良さと、BIG・REG・ブドウのバランスで設定差が現れる構成です。REGやブドウの出方が推測要素として効きやすいため、入力漏れにだけ注意してください。\n\n天井のないAタイプのため、ツールは長期確率の傾向を見る用途が中心です。短時間の結果だけで設定を断定しようとすると誤読しやすい点に留意が必要です。\n\n同じ台で継続してデータを溜めるほど、スペック差が浮かび上がりやすくなります。ハイエナ的な短打では推測の意味が薄くなることを理解しておきましょう。`,

    ultra_miracle_juggler: `ウルトラミラクルジャグラーは、BIG・REG・ブドウの設定差をモダンな演出とともに楽しめるジャグラー系です。合算確率と小役頻度が推測の軸になるため、実測値とスペック表の突き合わせが分かりやすい機種です。\n\n天井がないAタイプのため、期待値の主戦場は「長期の確率」です。サンプルが少ないうちは推定確率が大きく振れるのが普通なので、焦らず記録を増やす姿勢が大切です。\n\n演出の派手さと統計の地味さのギャップを意識し、ツールは補助線として使うと安全です。遊技は計画範囲内で楽しんでください。`,

    thunder_v: `スマスロ サンダーVは、BIG・REGのバランス型スペックで設定差が段階的に付くAタイプです。合算確率と出玉率の推移から、長期的な傾向を読み取るスタイルが基本になります。\n\n天井は想定されていないため、ハマり時の「天井期待値」ではなく、回転数を積んだときの設定推測が主な活用方法です。数千ゲーム単位のデータがあると解像度が上がりやすいです。\n\nクラシックな打ち味を重視する打ち手に向いていますが、設定判別は冷静なカウンター管理が欠かせません。本サイトの数値は参考情報としてご利用ください。`,

    umineko2: `うみねこのなく頃に2は、BIG・REGの確率差と出玉率の段差が特徴的なAタイプです。合算の見え方が推測の中心になるため、各カウンターを正確に取ることが精度向上の近道です。\n\n天井がない構成のため、ツールは長期の統計的傾向を見る用途が中心になります。短期の連チャンや不調で推定が大きく動くことは珍しくないので、解釈に注意してください。\n\n原作ファンには演出期待が高い一方、設定推測はデータの蓄積が物を言います。無理な資金移動は避け、責任ある範囲でご利用ください。`,

    crea_hihouden: `クレアの秘宝伝 BTは、BIG・REGの設定差と出玉率のバランスが推測の核になるAタイプです。秘宝伝シリーズらしいテンポ感の一方、数値面では合算確率の推移を追うのが基本になります。\n\n天井がないため、深いハマりでも「天井到達」ではなく「確率の収束」を見る視点が重要です。データ量が増えるほど設定帯のシグナルが読みやすくなる傾向があります。\n\n演出や示唆に一喜一憂せず、ツールの推測は長期傾向の参考として使うと読み違いが減ります。`,

    eva_bt: `エヴァンゲリオン 約束の扉は、BIG・REGの確率差と出玉率が段階的に変わるAタイプです。平均ボーナス枚数の前提が他機種と異なる場合があるため、スペック表の出玉率と合わせて解釈すると安心です。\n\n天井のない構成のため、設定推測は回転数とボーナス回数の比率が主戦場になります。サンプルが浅いうちは推定が振れやすい点は他のAタイプと同様です。\n\n作品の世界観を楽しみつつ、設定判別は統計の積み上げだと割り切ると、ツールの使い方がブレにくくなります。`,

    valvrave: `革命機ヴァルヴレイヴは、CZ初当たりとボーナス（REG相当）の二系統を扱うスペックで、入力項目が多い分だけ推測の材料も増える機種です。表の見方（どちらの列が何に対応するか）を押さえると解釈が安定します。\n\n天井は1000G前後が目安で、深いゾーンでは期待値判断が立ち回りに効きます。設定1基準の期待値は概算であり、内部状態のブレは織り込みが必要です。\n\nロボットアニメらしい展開の厚みがある一方、設定推測は地道な記録が鍵です。ツールの数値は参考値としてご利用ください。`,

    monkey_turn_v: `モンキーターンVは、AT初当たり確率の設定差と中〜長尺の天井が打ち味を決める機種です。ゲーム数が深いほど天井期待値の影響が大きくなるため、現在位置の把握が重要になります。\n\nリセット天井で短くなるラインがあるため、朝一と通常で期待値の見え方を切り替えて読むと判断がしやすくなります。店舗運用差には注意してください。\n\nスポーツレース系のテンポは打ち続けやすい反面、無理な期待値プレイは禁物です。予算と時間の上限を決めて遊技しましょう。`,

    tokyo_ghoul: `L 東京喰種は、AT初当たりとCZ初当たりの二系統があり、スペック表の読み方が推測精度に直結する機種です。入力データの取り方を誤ると推定がブレやすいので、カウンターの定義を統一してください。\n\n天井は600G前後が目安で、リセット時はさらに短いラインがあります。ツールの二段表示を状況に合わせて使い分けると、狙い目帯の判断がしやすくなります。\n\nダークな演出と数値の冷静さのバランスが長く打つコツです。推測結果は保証ではないことを忘れずに。`,

    dmc5: `デビル メイ クライ 5は、ボーナスとST（REG相当）の二系統で設定差が現れるAT機です。合算の見え方を理解しておくと、推測結果の解釈が安定しやすくなります。\n\n天井・リセット天井の両方を意識する立ち回りになりやすく、ゲーム数別期待値は「今どの帯か」の把握に便利です。設定1基準の概算である点は共通の注意事項です。\n\nアクション性の高い演出は没入感を高めますが、設定判別はデータの蓄積が基本です。責任ある遊技を心がけてください。`,

    hihouden: `スマスロ 秘宝伝は、初当たり確率の設定差と天井恩恵が打ち手の判断を左右しやすい機種です。ハマりが深いほど天井期待値の比重が上がるため、現在ゲーム数の管理が欠かせません。\n\n799G前後の天井とリセット時の短縮ラインを理解しておくと、ツールの一覧表が立ち回りの補助になります。店舗や台の実情で前後する点に注意してください。\n\n秘宝伝らしいテンポと期待値の冷静さを両立させるのがコツです。推測は参考値として扱いましょう。`,

    tenken: `転生したら剣でしたは、AT初当たり確率の設定差が比較的クリアに現れやすいタイプのAT機です。総回転に対する初当たり回数が推測の主なインプットになります。\n\n天井は970G前後が目安で、リセット天井もセットで見ると朝一の判断がしやすくなります。期待値は設定1基準の簡易モデルです。\n\n異世界転生モチーフの演出を楽しみつつ、設定判別は統計の積み上げだと割り切ると安全です。`,

    valvrave2: `L革命機ヴァルヴレイヴ2は、初当たり合算の設定差と長大な天井が特徴的な機種です。ゲーム数が深いほど天井期待値の影響が大きくなるため、一覧表での帯の確認が有効です。\n\n1500G級の天井やリセット時の短縮ラインがあり、状況に応じて読み替える必要があります。恩恵枚数も大きめなので期待値の振れに注意してください。\n\n前作からの進化を体感しやすい一方、設定推測はデータ量が物を言います。無理な期待値狙いは避けましょう。`,

    enen: `炎炎ノ消防隊は、初当たり確率の設定差と天井設計が立ち回りの軸になるAT機です。ハマりが深いゾーンでは期待値判断が打ち続け・見切りに効きやすいタイプです。\n\n850G前後の天井とリセット天井の組み合わせを理解しておくと、ツールの表示が意思決定の補助になります。店舗運用で前後する点は念頭に置いてください。\n\n熱い演出と冷静な数値のバランスが長く打つコツです。推測結果は保証ではありません。`,

    tekken6: `スマスロ 鉄拳6は、ボーナスとAT初当たりの二系統でスペック差が現れる構成です。入力の取り方を統一すると推測の解釈が安定しやすくなります。\n\n天井・リセット天井があり、ゲーム数別期待値で「今いる帯」を把握すると判断がしやすいです。格闘ゲームらしいテンポの良さと期待値の見方は別物だと心得てください。\n\n対戦モチーフの没入感を楽しみつつ、設定判別は記録の蓄積が基本です。`,

    prism_nana: `プリズムナナは、初当たり確率の設定差と天井恩恵が打ち味を支えるAT機です。899G前後の天井とリセット短縮を意識した立ち回りが求められます。\n\n深いハマりほど天井期待値の比重が上がるため、現在ゲーム数の管理が欠かせません。期待値表は設定1基準の概算です。\n\nライブ・アイドル系の演出を楽しみつつ、ツールは補助線として使うと読み違いが減ります。`,

    azurlane: `L アズールレーン THE ANIMATIONは、AT初当たりの設定差が比較的広く、天井尺も長めに取られた機種です。ゲーム数管理と期待値の帯確認が立ち回りの中心になりやすいです。\n\n2000G級の天井は到達までの分散が大きくなりがちなため、期待値は「目安」として扱うのが安全です。内部状態やモードの影響も無視できません。\n\n艦隊モチーフの収集感を楽しみつつ、設定推測は長期データが有利です。責任ある遊技を心がけてください。`,

    zettai4: `L 絶対衝激IVは、ボーナスとAT初当たりの二系統で設定差を読み取るAT機です。スペック表の列の意味を押さえると推測結果の解釈が安定します。\n\n本データでは天井を持たない扱いのため、主な活用は設定推測と出玉率の比較になります。実機の天井仕様が追加される場合は別途確認が必要です。\n\nバトル系のテンポを楽しみつつ、ツールは統計の補助として使いましょう。`,

    railgun2: `スマスロ とある科学の超電磁砲2は、AT初当たりとCZ初当たりの二系統があり、入力の精度が推測に直結する機種です。合算の見方を誤ると推定がブレやすい点に注意してください。\n\n天井は999G前後が目安で、リセット時は短くなるラインがあります。ゲーム数別期待値で帯を確認すると判断材料になります。\n\n学園超能力モチーフの演出と数値の冷静さのバランスがコツです。参考値としてご利用ください。`,

    onimusha3: `スマスロ 新鬼武者3は、AT初当たり確率の設定差と天井設計が立ち回りを左右しやすい機種です。ハマりが深いほど天井期待値の影響が大きくなります。\n\n1000G前後の天井とリセット短縮をセットで見ると、朝一と通常の切り替えがしやすくなります。期待値は概算です。\n\n時代劇×アクションの没入感を楽しみつつ、設定判別はデータの積み上げが基本です。`,

    zenigata5: `L主役は銭形5は、初当たり確率の設定差と長尺の天井が特徴的なAT機です。1250G級の天井は分散が大きくなりがちなため、期待値は目安として扱うのが無難です。\n\nリセット天井のラインもあり、ツールの二段表示を活用すると状況判断がしやすくなります。店舗運用差に注意してください。\n\nルパンシリーズらしい軽妙な演出と、冷静なゲーム数管理の両立が長く打つコツです。`,

    tokyo_revengers: `スマスロ 東京リベンジャーズは、初当たりとAT初当たりの二系統を扱うスペックで、入力の取り方が推測精度に効きます。列の定義を統一して記録してください。\n\n天井は1190G前後が目安で、リセット時は短いラインがあります。深いゾーンでは期待値判断が打ち手の意思決定に効きやすいです。\n\nタイムリープ劇のテンポを楽しみつつ、ツールは参考情報として使いましょう。`,

    iza_banchou: `いざ！番長は、初当たり確率の設定差と天井・リセット天井の組み合わせが打ち味を作る番長系AT機です。ゲーム数別期待値で帯を把握すると判断がしやすくなります。\n\n999G前後の天井を軸に、朝一は短縮ラインを意識する立ち回りが一般的です。設定1基準の期待値は簡易モデルです。\n\n番長らしい熱さと、統計の地味さのギャップを理解しておくとツールの使い方がブレにくくなります。`,

    monhan_rise: `スマスロ モンスターハンターライズは、AT初当たり確率の設定差と天井設計が立ち回りの核になりやすい機種です。ハマりが深いほど天井期待値の比重が上がります。\n\n999G前後の天井が目安で、店舗によってはリセット条件の解釈が変わります。前日データの確認は欠かせません。\n\n狩猟アクションの没入感を楽しみつつ、設定推測はデータ蓄積が物を言います。`,

    enen2: `Lパチスロ 炎炎ノ消防隊2は、初当たりと炎炎ループ（REG相当）の二系統で設定差が現れる構成です。入力の定義を誤ると推測がブレやすいので、カウンターの取り方を揃えてください。\n\n天井・リセット天井は前作系統を踏襲する打ち手が多く、ゲーム数別期待値が立ち回りの補助になります。\n\n続編らしい演出の厚みがある一方、設定判別は統計の積み上げです。参考値としてご利用ください。`,

    magireco: `スマスロ マギアレコードは、ボーナス初当たりとAT初当たりの二系統があり、材料が多い分だけ入力の整合性が重要です。スペック表の列と実測の対応を押さえましょう。\n\n天井は950G前後が目安で、リセット短縮もセットで見ると朝一の判断がしやすくなります。\n\n魔法少女まどか☆マギカ外伝の世界観を楽しみつつ、ツールは補助線として使うと安全です。`,

    mushoku: `L 無職転生は、AT初当たり確率の設定差と天井・リセット天井が立ち回りを左右しやすい機種です。ハマりが深いほど期待値判断の意味が大きくなります。\n\n1007G前後の天井と短縮ラインを理解しておくと、一覧表の見方が直感的になります。店舗運用差に注意してください。\n\n異世界転生の長尺ストーリーを楽しみつつ、設定推測はデータ量が鍵です。`,

    sbj: `スマスロスーパーブラックジャックは、ボーナス初当たり中心のスペックで設定差が初当たり頻度に表れやすいタイプです。総回転とボーナス回数の比率が推測の主戦場になります。\n\n天井は999G前後が目安で、リセット短縮もあります。深いゾーンでは期待値が意思決定に効きやすい点は他AT機と同様です。\n\nカジノテイストの演出を楽しみつつ、推測結果は保証ではないことを忘れずに。`,

    yoshimune: `吉宗は、初当たり確率の設定差と天井恩恵が打ち味を支えるAT機です。999G前後の天井を軸に、ゲーム数別期待値で帯を確認する立ち回りが一般的です。\n\nリセット天井の扱いは店舗差が出やすいため、前日データと併せて見ると判断がブレにくくなります。\n\n歴史・和風テイストの没入感と、冷静なカウンター管理の両立が長く打つコツです。`,

    goblin_slayer2: `スマスロ ゴブリンスレイヤーⅡは、AT初当たりとCZ初当たりの二系統でスペック差が現れる機種です。入力の定義を統一すると推測の解釈が安定しやすくなります。\n\n1500G級の天井とリセット短縮があり、長尺ハマりでは期待値の比重が大きくなりがちです。設定1基準は概算です。\n\nダークファンタジーの世界観を楽しみつつ、設定判別は記録の蓄積が基本です。`,

    otome4: `L戦国乙女4は、ボーナス+AT合算とAT初当たりの二系統があり、表の読み方が推測に直結します。どの数値をどこに入れるかを最初に決めておくとブレが減ります。\n\n799G前後の天井が目安で、深いゾーンでは期待値判断が有効です。リセット条件は店舗差に注意してください。\n\n戦国乙女らしいキャラ魅力を楽しみつつ、ツールは参考値として使いましょう。`,

    toloveru: `L ToLOVEるダークネスは、AT初当たり確率の設定差と天井・リセット天井が立ち回りの軸になりやすい機種です。表では設定2からの記載があるため、入力時の設定キーに注意してください。\n\n999G前後の天井を軸に期待値を見る打ち手が多く、一覧表で帯を把握すると判断がしやすくなります。\n\nコメディ系のテンポを楽しみつつ、設定推測は統計の積み上げです。`,

    baki: `Ｌ範馬刃牙は、ボーナスとAT初当たりの二系統で設定差が現れるAT機です。入力の取り方を揃えると推測結果の解釈が安定しやすくなります。\n\n天井は700G前後が目安で、さらに短いリセットラインもあります。浅〜中間帯から期待値の符号が変わりやすいタイプなので一覧表が有効です。\n\nバトル漫画らしい熱量と、冷静なゲーム数管理のバランスがコツです。`,

    biohazard5: `スマスロ バイオハザード5は、AT初当たり確率の設定差と天井設計が立ち回りを左右しやすいホラーアクション系AT機です。ハマりが深いほど天井期待値の比重が上がります。\n\n999G前後の天井とリセット短縮をセットで見ると、朝一と通常の切り替えがしやすくなります。\n\nサバイバルホラーの没入感を楽しみつつ、推測は参考値として扱いましょう。`,

    revuestarlight: `L少女☆歌劇 レヴュースタァライトは、ボーナス合算とAT初当たりの二系統でスペック差が現れる構成です。入力定義を誤ると推測がブレやすいので、カウンターの取り方を統一してください。\n\n900G前後の天井とリセット短縮があり、ゲーム数別期待値が立ち回りの補助になります。\n\nステージ演出の華やかさと、統計の地味さのギャップを理解しておくとツールの使い方がブレにくくなります。責任ある遊技を心がけてください。`,

    eureka_seven_art: `交響詩篇エウレカセブン TYPE-ARTは、ボーナス合算とART初当たりの二系統で設定差が大きい6.5号機です。小役や示唆も材料になりますが、本ツールは主に回数系の入力を想定しています。\n\n天井非搭載のため、天井期待値は表示されず設定推測とスペック確認が主用途になります。長めのデータで合算・ARTのバランスを見るのがおすすめです。\n\n数値は公開情報ベースの参考値です。実機仕様の変更があればご自身でもご確認ください。`,

    shake_bt: `スマスロ シェイク ボーナストリガーは、BIG・REGの二軸で設定差が現れるBT搭載ノーマルです。奇数・偶数で傾向が分かれるため、短期データの解釈には注意が必要です。\n\n天井は非搭載です。設定推測はカウンターの定義（BIG/REG）をスペック表に合わせて統一してください。\n\nBT中の技術介入やループ率はモデルに含めきれないため、推測結果は参考値として扱ってください。`,

    harem_ace_bt: `翔べ！ハーレムエースは、ボーナス合算で設定差を読むBT搭載タイプです。設定によっては列構成が異なる表記もあるため、入力は「合算回数」中心に合わせると解釈が安定しやすいです。\n\n天井非搭載のため、長期の確率傾向を見る用途が中心になります。\n\n演出と数値のバランスを意識し、責任ある範囲でご利用ください。`,

    alex_bt: `スマスロ アレックスブライトは、BIG・REGに設定差が大きいボーナストリガー機です。合算確率の推移から設定帯を推う打ち手が一般的です。\n\n天井は非搭載です。小役や終了画面の示唆は本ツールの主入力外となるため、推測は回数データの積み上げが基本です。\n\n参考値として活用し、過信は避けましょう。`,

    bofuri: `スマスロ「防振り」は、AT初当たり確率の設定差と天井・設定変更時短縮天井が立ち回りの軸になりやすい機種です。CZや防御状態など複合仕様は簡易モデルで近似しています。\n\n950G前後の天井と短縮ラインをツールで確認し、現在ゲーム数とセットで見ると判断がしやすくなります。\n\n数値は公開スペックに基づく参考値です。`,

    nanatsu_maken: `L七つの魔剣が支配するは、ボーナス初当たりとST初当たりの二系統で設定差が現れます。入力列とカウンターの対応を取り違えないことが精度の鍵です。\n\n通常時はST間最大1000G前後の天井、設定変更時は短縮ラインがあるため、ツールの通常／リセット表示を状況に合わせて読み替えてください。\n\nコナミ系の演出を楽しみつつ、推測はデータ量を意識しましょう。`,

    granbelm: `回胴式遊技機 グランベルムは、ボーナスとAT初当たりの二系統でスペック差を読むAT機です。通常モードにより天井手前のゲーム数が変わる仕様は簡易モデルでは扱いきれないため、649G前後を代表値として期待値を見ています。\n\nCZ経由の当選などはモデル外要素が多いです。深いハマりでの目安として一覧表を活用してください。\n\n参考値としてご利用ください。`,

    kyokou_suiritr: `L 虚構推理は、CZと本ボーナス（初当たり）の二系統があり、入力の定義を揃えると設定推測の解釈が安定しやすいスマスロです。ドーナツビジョン筐体で注目された機種ですが、数値面では合算の見え方が軸になります。\n\n天井は1000G前後と短縮ラインの併用が解説されており、深いゾーンでは期待値判断が立ち回りに効きやすいタイプです。実機の「+α」消化や店舗運用差には注意してください。\n\n公開スペックに基づく参考値です。仕様変更があれば公式情報でご確認ください。`,

    isekai_quartet_bt: `A-SLOT+ 異世界かるてっと BTは、通常時のいせかる目とBIG直撃、さらにBT突入を絡めたボーナストリガー機です。BIGといせかる目の二列入力に対応し、設定差は主に当選確率に表れます。\n\n天井は非搭載のため、ツールは長期の確率傾向と回数バランスの確認が中心になります。BT中の挙動や完全攻略時の機械割は簡易モデルに織り込みきれません。\n\nサミー初のBT機として話題を集めた一台ですが、推測結果はあくまで補助線としてご利用ください。`,

    jormungand: `スマスロ ヨルムンガンドは、CZ経由からAT「ヨルムンガンドラッシュ」へ入るゲーム数上乗せ型のスマスロです。AT初当たりとCZの設定差が推測の主戦場になります。\n\n天井の詳細は導入直後は要確認になる場合があります。本データでは天井非搭載としており、主に回数ベースの設定推測にご利用ください。\n\n軍武アニメ原作のテンポを楽しみつつ、数値は参考情報として扱いましょう。`,

    akudama_drive: `L アクダマドライブは、CZとAT初当たりの二系統でスペック差が大きいスマスロです。高純増の上位ATが目玉になりがちですが、通常時の入力は表記に合わせてCZとATを分けて取ると解釈がブレにくくなります。\n\n天井は約967G＋αや短縮の589G＋αなど複数ラインが解説されています。ツールでは代表しやすいラインを載せていますが、条件によっては読み替えが必要です。\n\n三洋のオリジナル作品ベースの演出と、冷静なゲーム数管理の両立がコツです。`,

    shinuchi_yoshimune: `真打 吉宗は、旧作「吉宗」と別機種のスマスロです。CZとAT初当たりの二系統で設定差を読み、1G連や高出力ゾーンが打ち味の核になります。\n\n天井はCZ間・AT間で尺が異なる解説があり、深いハマりでは期待値の見え方が変わります。本ツールではAT間を代表する長尺を天井として近似しています。\n\n大都の看板シリーズだけに導入も大きい機種ですが、推測はデータの蓄積が基本です。参考値としてご利用ください。`,

    lb_triple_crown_seven: `LB トリプルクラウンセブンは、岡崎産業のBT搭載ノーマルで、BIG・REGの二軸から設定差を読み取るAタイプです。合算確率と出玉率の段差が推測の中心になります。\n\n天井は非搭載です。沖スロ系のモード選択や疑似遊技の細部はモデル化していません。\n\nクラシックな打ち味を重視する打ち手向けですが、設定判別はカウンターの正確さが信頼度に直結します。`,

    gundam_unicorn_kakusei_drive: `Lパチスロ 機動戦士ガンダムユニコーン 覚醒DRIVEは、通常時の彗星決戦［CZ］とAT初当たりの二系統でスペック差が現れるスマスロです。CZとATのカウンターを表記どおり分けて入力すると、ベイズ推測の解釈が安定しやすくなります。\n\n天井は解析により複数ライン（例：CZ系800G前後・設定変更時短縮など）が語られることがあり、本ツールでは代表しやすいラインを載せています。AT間の長尺天井など条件別の扱いは実機・解析の更新で要確認です。\n\n数値は公開情報・解析サイトの調査値に基づく参考です。+α消化や店舗運用差に注意してください。`,

    million_god_kiseki: `スマスロ ミリオンゴッド-神々の軌跡-は、GOD GAMEを軸にした王道のミリオン系スマスロです。設定推測ではAT初当たり確率と総回転のバランスが主なインプットになります。\n\n天井の確定表記は導入直後は解析サイトの更新を確認してください。本データでは天井非搭載としており、主にスペック確認と回数ベースの推測にご利用ください。\n\nモード・履歴・確定役などモデル外要素が大きい機種のため、推測結果は補助線として扱いましょう。`,

    animal_slot_dotch: `アニマルスロット ドッチは、BIG・REGの二軸と擬似ボーナス連打型のST「アニマルドリーム」が特徴の北電子スマスロです。通常時はリーチ目からの当選が多く、カウンターの取り方をスペック表に合わせることが重要です。\n\n天井はBIG消化後の長尺やREG後の短尺など複数パターンが解説されることがあり、本ツールではBIG後を代表するラインで近似しています。条件によっては読み替えが必要です。\n\n参考値としてご利用ください。`,
};

/**
 * 主要機種だけ「注意点（運用/入力/モデル外）」を追加して差別化する。
 * - 量産ページでも、検索意図に対して「判断ミスしやすい所」を短く提示するのが狙い
 * - 文言は“断定”せず「店舗運用差」「モデル外」前提で書く
 */
const CAUTIONS_BY_ID = {
    hokuto: [
        "朝一のリセット/据え置きで期待値の見え方が大きく変わります。前日最終G数と合わせて判断してください。",
        "本ツールの天井期待値は設定1基準の概算です。内部状態（モード/前兆など）で実際の期待値は上下します。",
        "データが浅いと推測％は大きく振れます。短時間の結果だけで断定しないのが安全です。",
    ],
    kabaneri: [
        "リセット短縮の有無は店舗運用差が出やすいので、前日データとセットで見るのがコツです。",
        "ST/示唆など体感要素はブレます。数字（初当たり・総回転）を軸に、補助材料として扱うのが無難です。",
        "期待値表は簡易モデルです。モード/前兆込みの“厳密な期待値”ではない点に注意してください。",
    ],
    banchou4: [
        "天井狙いの可否は当日のゲーム数履歴に依存します。宵越し前提での判断は店舗運用差に注意。",
        "入力項目が少ない分、総ゲーム数の取り違えがそのまま推測に効きます（カウント定義を固定）。",
        "推測％は“当たりの軽さ”に引っ張られます。短期の上振れ/下振れを前提に解釈してください。",
    ],
    karakuri: [
        "「CZ合算」の定義（どれを数えるか）を揃えないと推測がブレやすい機種です。",
        "深いハマりは期待値が見えやすい一方、内部状態で上下します。表は目安として使うのが安全です。",
    ],
    tokyo_ghoul: [
        "天井・リセット天井がある前提で表示しますが、店舗運用差（据え置きなど）は必ず確認してください。",
        "CZ/ATのカウントを混ぜると推測精度が落ちます。データの取り方を統一してください。",
    ],
    monhan_rise: [
        "リセット条件の解釈が店舗で変わりやすい機種です。前日データ確認は必須です。",
        "天井期待値は設定1基準の概算です。状態差でブレる点は織り込んでください。",
    ],
    god_eater: [
        "朝一と通常で天井の見え方が変わります（リセット短縮の扱いに注意）。",
        "期待値は概算です。内部状態や前兆の影響で上下します。",
    ],
    bakemonogatari: [
        "短縮天井の扱いは条件で変わります。朝一の状況を分けて判断してください。",
        "示唆演出の強弱より、まずは総回転と初当たり回数を優先して見るとブレにくいです。",
    ],
    okidoki_duo: [
        "短期の上下振れが大きい機種です。推測％はサンプルが溜まってから信頼度が上がります。",
        "天井期待値は設定1基準の概算です。ホール状況（設定配分）とは別物として扱ってください。",
    ],
    aim_juggler_ex: [
        "REG確率の偏りは重要ですが、短期でも振れます。できれば数千G単位で見るのが安全です。",
        "ブドウ（小役）を入れると精度が上がりますが、数え間違いは逆効果なので無理はしない方が良いです。",
    ],
    my_juggler_v: [
        "短時間・台移動が多いと推測は不安定になります。同じ台でデータを溜めるほど有利です。",
        "BIG/REGどちらかに寄った短期結果は起きます。合算と回転数も合わせて解釈してください。",
    ],
    funky_juggler_2: [
        "REGとブドウの取りこぼし/数え間違いがあると推測が崩れます。まずはBIG/REGだけでもOKです。",
        "数百Gでは結論が出にくいので、回転数を稼いでから判断する方が安全です。",
    ],
};

function buildCautionSection(machine) {
    const items = CAUTIONS_BY_ID[machine.id];
    if (!items || items.length === 0) return "";
    const lis = items
        .slice(0, 3)
        .map((t) => `                    <li>${escapeHtml(t)}</li>`)
        .join("\n");
    return `
            <section class="card lp-section" id="cautions">
                <h2 class="card-title"><span class="card-icon">&#9888;</span> 注意点（先に確認）</h2>
                <ul class="lp-caution-list">
${lis}
                </ul>
                <p class="lp-note">※ 本ページの数値・文章は参考情報です。店舗運用・個体差・遊技ルールに従ってご利用ください。</p>
            </section>`;
}

function formatEditorialParagraphs(text) {
    if (!text) return "";
    return text
        .split(/\n\n/)
        .map((p) => p.trim())
        .filter(Boolean)
        .map((p) => `                    <p class="lp-editorial-p">${escapeHtml(p)}</p>`)
        .join("\n");
}

const MACHINES = [
    { id: "aim_juggler_ex", name: "アイムジャグラーEX", type: "A", bigLabel: "BIG", regLabel: "REG", koyakuName: "ブドウ",
      settings: { 1:{big:273.1,reg:439.8,koyaku:6.10,payout:97.0}, 2:{big:270.8,reg:399.6,koyaku:6.09,payout:98.0}, 3:{big:269.7,reg:331.0,koyaku:6.08,payout:99.9}, 4:{big:259.0,reg:315.1,koyaku:6.07,payout:102.0}, 5:{big:259.0,reg:255.0,koyaku:6.05,payout:104.2}, 6:{big:255.0,reg:255.0,koyaku:5.83,payout:105.5} },
      ceiling:null, ceilingTarget:null, ceilingReward:null, avgBonusReward:250, normalCostPerGame:1.8, addedDate: "2026-03-01" },
    { id: "my_juggler_v", name: "マイジャグラーV", type: "A", bigLabel: "BIG", regLabel: "REG", koyakuName: "ブドウ",
      settings: { 1:{big:273.1,reg:409.6,koyaku:5.95,payout:97.0}, 2:{big:270.8,reg:385.5,koyaku:5.92,payout:98.0}, 3:{big:266.4,reg:336.1,koyaku:5.88,payout:99.9}, 4:{big:254.0,reg:290.0,koyaku:5.80,payout:102.8}, 5:{big:240.1,reg:268.6,koyaku:5.70,payout:105.3}, 6:{big:229.1,reg:229.1,koyaku:5.56,payout:109.4} },
      ceiling:null, ceilingTarget:null, ceilingReward:null, avgBonusReward:250, normalCostPerGame:1.8, addedDate: "2026-03-01" },
    { id: "funky_juggler_2", name: "ファンキージャグラー2", type: "A", bigLabel: "BIG", regLabel: "REG", koyakuName: "ブドウ",
      settings: { 1:{big:266.4,reg:439.8,koyaku:5.94,payout:97.0}, 2:{big:259.0,reg:407.1,koyaku:5.92,payout:98.5}, 3:{big:256.0,reg:366.1,koyaku:5.88,payout:99.8}, 4:{big:249.2,reg:322.8,koyaku:5.83,payout:102.0}, 5:{big:240.1,reg:299.3,koyaku:5.76,payout:104.3}, 6:{big:219.9,reg:262.1,koyaku:5.67,payout:109.0} },
      ceiling:null, ceilingTarget:null, ceilingReward:null, avgBonusReward:250, normalCostPerGame:1.8, addedDate: "2026-03-01" },
    { id: "gogo_juggler_3", name: "ゴーゴージャグラー3", type: "A", bigLabel: "BIG", regLabel: "REG", koyakuName: "ブドウ",
      settings: { 1:{big:259.0,reg:354.2,koyaku:6.25,payout:97.2}, 2:{big:258.0,reg:332.7,koyaku:6.20,payout:98.2}, 3:{big:257.0,reg:306.2,koyaku:6.15,payout:99.4}, 4:{big:254.0,reg:268.6,koyaku:6.07,payout:101.6}, 5:{big:247.3,reg:243.3,koyaku:6.00,payout:103.8}, 6:{big:234.9,reg:234.9,koyaku:5.92,payout:106.5} },
      ceiling:null, ceilingTarget:null, ceilingReward:null, avgBonusReward:250, normalCostPerGame:1.8, addedDate: "2026-03-01" },
    { id: "ultra_miracle_juggler", name: "ウルトラミラクルジャグラー", type: "A", bigLabel: "BIG", regLabel: "REG", koyakuName: "ブドウ",
      settings: { 1:{big:267.5,reg:425.6,koyaku:5.93,payout:97.0}, 2:{big:261.1,reg:402.1,koyaku:5.93,payout:98.1}, 3:{big:256.0,reg:350.5,koyaku:5.93,payout:99.8}, 4:{big:242.7,reg:322.8,koyaku:5.93,payout:102.1}, 5:{big:233.2,reg:297.9,koyaku:5.87,payout:104.5}, 6:{big:216.3,reg:277.7,koyaku:5.81,payout:108.1} },
      ceiling:null, ceilingTarget:null, ceilingReward:null, avgBonusReward:250, normalCostPerGame:1.8, addedDate: "2026-03-01" },
    { id: "discup_ultraremix", name: "A-SLOT+ ディスクアップ ULTRAREMIX", type: "A", bigLabel: "BIG", regLabel: "REG", koyakuName: null,
      settings: { 1:{big:287.2,reg:495.3,koyaku:null,payout:99.3}, 2:{big:284.3,reg:477.2,koyaku:null,payout:100.2}, 5:{big:273.8,reg:398.6,koyaku:null,payout:103.6}, 6:{big:260.9,reg:334.1,koyaku:null,payout:107.7} },
      ceiling:null, ceilingTarget:null, ceilingReward:null, avgBonusReward:250, normalCostPerGame:1.6, addedDate: "2026-03-01" },
    { id: "smaslo_hanabi", name: "スマスロ ハナビ", type: "A", bigLabel: "BIG", regLabel: "REG", koyakuName: null,
      settings: { 1:{big:297.9,reg:394.8,koyaku:null,payout:98.6}, 2:{big:292.6,reg:358.1,koyaku:null,payout:100.4}, 3:{big:290.0,reg:343.3,koyaku:null,payout:101.3}, 4:{big:287.4,reg:328.5,koyaku:null,payout:102.1}, 5:{big:284.9,reg:313.6,koyaku:null,payout:103.0}, 6:{big:273.1,reg:282.5,koyaku:null,payout:106.4} },
      ceiling:null, ceilingTarget:null, ceilingReward:null, avgBonusReward:250, normalCostPerGame:1.6, addedDate: "2026-03-01" },
    { id: "thunder_v", name: "スマスロ サンダーV", type: "A", bigLabel: "BIG", regLabel: "REG", koyakuName: null,
      settings: { 1:{big:277.7,reg:434.0,koyaku:null,payout:98.5}, 2:{big:275.4,reg:394.8,koyaku:null,payout:100.0}, 3:{big:273.9,reg:378.2,koyaku:null,payout:101.0}, 4:{big:272.3,reg:361.5,koyaku:null,payout:101.9}, 5:{big:270.8,reg:344.9,koyaku:null,payout:102.9}, 6:{big:264.3,reg:313.6,koyaku:null,payout:106.0} },
      ceiling:null, ceilingTarget:null, ceilingReward:null, avgBonusReward:250, normalCostPerGame:1.6, addedDate: "2026-03-01" },
    { id: "umineko2", name: "うみねこのなく頃に2", type: "A", bigLabel: "BIG", regLabel: "REG", koyakuName: null,
      settings: { 1:{big:362.1,reg:397.2,koyaku:null,payout:98.4}, 2:{big:350.5,reg:390.1,koyaku:null,payout:99.6}, 3:{big:337.8,reg:381.0,koyaku:null,payout:101.2}, 4:{big:327.7,reg:374.5,koyaku:null,payout:103.4}, 5:{big:319.7,reg:366.1,koyaku:null,payout:104.7}, 6:{big:313.6,reg:360.1,koyaku:null,payout:105.5} },
      ceiling:null, ceilingTarget:null, ceilingReward:null, avgBonusReward:250, normalCostPerGame:1.6, addedDate: "2026-03-01" },
    { id: "crea_hihouden", name: "クレアの秘宝伝 BT", type: "A", bigLabel: "BIG", regLabel: "REG", koyakuName: null,
      settings: { 1:{big:299.3,reg:383.3,koyaku:null,payout:98.1}, 2:{big:293.9,reg:376.6,koyaku:null,payout:99.2}, 3:{big:284.9,reg:358.1,koyaku:null,payout:101.2}, 4:{big:274.2,reg:334.4,koyaku:null,payout:103.7}, 5:{big:262.1,reg:299.3,koyaku:null,payout:106.6}, 6:{big:240.1,reg:247.3,koyaku:null,payout:112.3} },
      ceiling:null, ceilingTarget:null, ceilingReward:null, avgBonusReward:250, normalCostPerGame:1.7, addedDate: "2026-03-01" },
    { id: "eva_bt", name: "エヴァンゲリオン 約束の扉", type: "A", bigLabel: "BIG", regLabel: "REG", koyakuName: null,
      settings: { 1:{big:300.6,reg:569.9,koyaku:null,payout:97.7}, 2:{big:290.0,reg:546.1,koyaku:null,payout:98.9}, 3:{big:281.3,reg:508.0,koyaku:null,payout:100.7}, 4:{big:266.4,reg:474.9,koyaku:null,payout:104.5}, 5:{big:254.0,reg:442.8,koyaku:null,payout:107.0}, 6:{big:240.9,reg:404.5,koyaku:null,payout:110.9} },
      ceiling:null, ceilingTarget:null, ceilingReward:null, avgBonusReward:300, normalCostPerGame:1.7, addedDate: "2026-03-01" },
    { id: "kabaneri", name: "甲鉄城のカバネリ", type: "AT", bigLabel: "初当たり", regLabel: "ST", koyakuName: null,
      settings: { 1:{big:237.0,reg:407.9,koyaku:null,payout:97.8}, 2:{big:230.7,reg:393.2,koyaku:null,payout:98.8}, 3:{big:214.0,reg:372.4,koyaku:null,payout:100.7}, 4:{big:186.5,reg:327.2,koyaku:null,payout:105.9}, 5:{big:171.3,reg:307.3,koyaku:null,payout:108.4}, 6:{big:151.3,reg:290.6,koyaku:null,payout:110.0} },
      ceiling:1000, ceilingTarget:550, ceilingReward:600, resetCeiling:650, resetCeilingTarget:350, avgBonusReward:400, normalCostPerGame:2.3, addedDate: "2026-03-01" },
    { id: "kabaneri_unato", name: "スマスロ 甲鉄城のカバネリ 海門決戦", type: "AT", bigLabel: "初当たり", regLabel: "ST", koyakuName: null,
      settings: { 1:{big:254.2,reg:422.5,koyaku:null,payout:97.5}, 2:{big:242.3,reg:405.9,koyaku:null,payout:98.5}, 3:{big:239.6,reg:398.7,koyaku:null,payout:100.8}, 4:{big:214.0,reg:357.2,koyaku:null,payout:106.0}, 5:{big:203.2,reg:332.6,koyaku:null,payout:111.0}, 6:{big:195.1,reg:318.5,koyaku:null,payout:114.9} },
      ceiling:996, ceilingTarget:550, ceilingReward:600, resetCeiling:596, resetCeilingTarget:320, avgBonusReward:400, normalCostPerGame:2.3, addedDate: "2026-03-01" },
    { id: "banchou4", name: "押忍！番長4", type: "AT", bigLabel: "初当たり", regLabel: null, koyakuName: null,
      settings: { 1:{big:259.5,reg:null,koyaku:null,payout:97.8}, 2:{big:256.3,reg:null,koyaku:null,payout:98.9}, 3:{big:247.6,reg:null,koyaku:null,payout:101.5}, 4:{big:236.0,reg:null,koyaku:null,payout:106.0}, 5:{big:225.3,reg:null,koyaku:null,payout:110.0}, 6:{big:221.1,reg:null,koyaku:null,payout:113.1} },
      ceiling:699, ceilingTarget:450, ceilingReward:500, resetCeiling:null, resetCeilingTarget:null, avgBonusReward:400, normalCostPerGame:2.2, addedDate: "2026-03-01" },
    { id: "hokuto", name: "スマスロ北斗の拳", type: "AT", bigLabel: "AT初当たり", regLabel: null, koyakuName: null,
      settings: { 1:{big:383.4,reg:null,koyaku:null,payout:98.0}, 2:{big:370.5,reg:null,koyaku:null,payout:98.9}, 4:{big:297.8,reg:null,koyaku:null,payout:105.7}, 5:{big:258.7,reg:null,koyaku:null,payout:110.0}, 6:{big:235.1,reg:null,koyaku:null,payout:113.0} },
      ceiling:1268, ceilingTarget:800, ceilingReward:1500, resetCeiling:800, resetCeilingTarget:500, avgBonusReward:800, normalCostPerGame:2.5, addedDate: "2026-03-01" },
    { id: "karakuri", name: "からくりサーカス", type: "AT", bigLabel: "AT初当たり", regLabel: "CZ合算", koyakuName: null,
      settings: { 1:{big:564,reg:333,koyaku:null,payout:97.5}, 2:{big:543,reg:320,koyaku:null,payout:98.7}, 4:{big:469,reg:292,koyaku:null,payout:103.0}, 5:{big:451,reg:277,koyaku:null,payout:108.1}, 6:{big:447,reg:275,koyaku:null,payout:114.9} },
      ceiling:1200, ceilingTarget:800, ceilingReward:500, resetCeiling:null, resetCeilingTarget:null, avgBonusReward:400, normalCostPerGame:2.3, addedDate: "2026-03-01" },
    { id: "valvrave", name: "革命機ヴァルヴレイヴ", type: "AT", bigLabel: "CZ初当たり", regLabel: "ボーナス", koyakuName: null,
      settings: { 1:{big:277,reg:519,koyaku:null,payout:97.3}, 2:{big:275,reg:516,koyaku:null,payout:98.3}, 3:{big:274,reg:514,koyaku:null,payout:100.8}, 4:{big:269,reg:507,koyaku:null,payout:103.2}, 5:{big:264,reg:499,koyaku:null,payout:107.9}, 6:{big:258,reg:490,koyaku:null,payout:114.9} },
      ceiling:1000, ceilingTarget:700, ceilingReward:400, resetCeiling:null, resetCeilingTarget:null, avgBonusReward:300, normalCostPerGame:2.0, addedDate: "2026-03-01" },
    { id: "monkey_turn_v", name: "モンキーターンV", type: "AT", bigLabel: "AT初当たり", regLabel: null, koyakuName: null,
      settings: { 1:{big:299.8,reg:null,koyaku:null,payout:97.9}, 2:{big:295.5,reg:null,koyaku:null,payout:98.9}, 4:{big:258.8,reg:null,koyaku:null,payout:104.5}, 5:{big:235.7,reg:null,koyaku:null,payout:110.2}, 6:{big:222.9,reg:null,koyaku:null,payout:114.9} },
      ceiling:795, ceilingTarget:500, ceilingReward:600, resetCeiling:495, resetCeilingTarget:300, avgBonusReward:400, normalCostPerGame:2.4, addedDate: "2026-03-01" },
    { id: "tokyo_ghoul", name: "L 東京喰種", type: "AT", bigLabel: "AT初当たり", regLabel: "CZ初当たり", koyakuName: null,
      settings: { 1:{big:394.4,reg:262.6,koyaku:null,payout:97.5}, 2:{big:380.5,reg:255.6,koyaku:null,payout:99.0}, 3:{big:357.0,reg:246.5,koyaku:null,payout:101.6}, 4:{big:325.9,reg:233.1,koyaku:null,payout:105.6}, 5:{big:291.2,reg:216.4,koyaku:null,payout:110.3}, 6:{big:261.3,reg:203.7,koyaku:null,payout:114.9} },
      ceiling:600, ceilingTarget:350, ceilingReward:500, resetCeiling:200, resetCeilingTarget:50, avgBonusReward:350, normalCostPerGame:2.2, addedDate: "2026-03-01" },
    { id: "kaguya_sama", name: "かぐや様は告らせたい", type: "AT", bigLabel: "ボーナス初当たり", regLabel: null, koyakuName: null,
      settings: { 1:{big:362,reg:null,koyaku:null,payout:97.7}, 2:{big:360,reg:null,koyaku:null,payout:98.8}, 3:{big:357,reg:null,koyaku:null,payout:101.2}, 4:{big:349,reg:null,koyaku:null,payout:105.8}, 5:{big:343,reg:null,koyaku:null,payout:110.8}, 6:{big:335,reg:null,koyaku:null,payout:114.9} },
      ceiling:1100, ceilingTarget:700, ceilingReward:1000, resetCeiling:800, resetCeilingTarget:500, avgBonusReward:600, normalCostPerGame:2.0, addedDate: "2026-03-01" },
    { id: "god_eater", name: "ゴッドイーター リザレクション", type: "AT", bigLabel: "AT初当たり", regLabel: null, koyakuName: null,
      settings: { 1:{big:351.9,reg:null,koyaku:null,payout:97.9}, 2:{big:344.5,reg:null,koyaku:null,payout:98.9}, 3:{big:330.1,reg:null,koyaku:null,payout:101.1}, 4:{big:317.0,reg:null,koyaku:null,payout:105.6}, 5:{big:302.2,reg:null,koyaku:null,payout:110.0}, 6:{big:290.3,reg:null,koyaku:null,payout:114.9} },
      ceiling:1000, ceilingTarget:600, ceilingReward:1000, resetCeiling:600, resetCeilingTarget:300, avgBonusReward:600, normalCostPerGame:2.3, addedDate: "2026-03-01" },
    { id: "bakemonogatari", name: "スマスロ 化物語", type: "AT", bigLabel: "AT初当たり", regLabel: null, koyakuName: null,
      settings: { 1:{big:265.1,reg:null,koyaku:null,payout:97.9}, 2:{big:260.7,reg:null,koyaku:null,payout:98.9}, 3:{big:252.1,reg:null,koyaku:null,payout:100.9}, 4:{big:238.8,reg:null,koyaku:null,payout:105.0}, 5:{big:230.8,reg:null,koyaku:null,payout:107.8}, 6:{big:219.6,reg:null,koyaku:null,payout:112.1} },
      ceiling:1000, ceilingTarget:600, ceilingReward:500, resetCeiling:600, resetCeilingTarget:350, avgBonusReward:400, normalCostPerGame:2.2, addedDate: "2026-03-01" },
    { id: "hokuto_tensei2", name: "北斗の拳 転生の章2", type: "AT", bigLabel: "AT初当たり", regLabel: null, koyakuName: null,
      settings: { 1:{big:366.0,reg:null,koyaku:null,payout:97.6}, 2:{big:357.0,reg:null,koyaku:null,payout:98.4}, 3:{big:336.3,reg:null,koyaku:null,payout:100.7}, 4:{big:298.7,reg:null,koyaku:null,payout:106.2}, 5:{big:283.2,reg:null,koyaku:null,payout:111.1}, 6:{big:273.1,reg:null,koyaku:null,payout:114.9} },
      ceiling:1536, ceilingTarget:900, ceilingReward:1000, resetCeiling:1280, resetCeilingTarget:750, avgBonusReward:600, normalCostPerGame:2.3, addedDate: "2026-03-01" },
    { id: "koukaku", name: "スマスロ 攻殻機動隊", type: "AT", bigLabel: "AT初当たり", regLabel: "CZ初当たり", koyakuName: null,
      settings: { 1:{big:336.3,reg:238.0,koyaku:null,payout:97.9}, 2:{big:332.0,reg:236.3,koyaku:null,payout:98.7}, 3:{big:319.6,reg:231.7,koyaku:null,payout:100.8}, 4:{big:298.7,reg:220.9,koyaku:null,payout:104.9}, 5:{big:285.8,reg:214.0,koyaku:null,payout:109.3}, 6:{big:278.0,reg:210.1,koyaku:null,payout:112.2} },
      ceiling:999, ceilingTarget:600, ceilingReward:600, resetCeiling:699, resetCeilingTarget:400, avgBonusReward:400, normalCostPerGame:2.2, addedDate: "2026-03-01" },
    { id: "dmc5", name: "デビル メイ クライ 5", type: "AT", bigLabel: "ボーナス", regLabel: "ST", koyakuName: null,
      settings: { 1:{big:257.0,reg:445.4,koyaku:null,payout:97.5}, 2:{big:254.1,reg:436.5,koyaku:null,payout:98.2}, 3:{big:251.5,reg:411.2,koyaku:null,payout:100.2}, 4:{big:222.6,reg:359.6,koyaku:null,payout:105.2}, 5:{big:217.3,reg:329.5,koyaku:null,payout:109.2}, 6:{big:204.1,reg:303.9,koyaku:null,payout:114.9} },
      ceiling:1000, ceilingTarget:600, ceilingReward:800, resetCeiling:800, resetCeilingTarget:500, avgBonusReward:500, normalCostPerGame:2.2, addedDate: "2026-03-01" },
    { id: "hihouden", name: "スマスロ 秘宝伝", type: "AT", bigLabel: "初当たり", regLabel: null, koyakuName: null,
      settings: { 1:{big:292.5,reg:null,koyaku:null,payout:97.8}, 2:{big:271.4,reg:null,koyaku:null,payout:99.0}, 3:{big:283.6,reg:null,koyaku:null,payout:101.5}, 4:{big:257.5,reg:null,koyaku:null,payout:105.1}, 5:{big:264.0,reg:null,koyaku:null,payout:110.1}, 6:{big:246.0,reg:null,koyaku:null,payout:114.7} },
      ceiling:799, ceilingTarget:550, ceilingReward:400, resetCeiling:499, resetCeilingTarget:300, avgBonusReward:300, normalCostPerGame:2.1, addedDate: "2026-03-01" },
    { id: "tenken", name: "転生したら剣でした", type: "AT", bigLabel: "AT初当たり", regLabel: null, koyakuName: null,
      settings: { 1:{big:403.8,reg:null,koyaku:null,payout:97.9}, 2:{big:396.0,reg:null,koyaku:null,payout:99.0}, 3:{big:373.4,reg:null,koyaku:null,payout:101.2}, 4:{big:340.7,reg:null,koyaku:null,payout:105.7}, 5:{big:325.9,reg:null,koyaku:null,payout:109.1}, 6:{big:312.8,reg:null,koyaku:null,payout:112.1} },
      ceiling:970, ceilingTarget:600, ceilingReward:700, resetCeiling:600, resetCeilingTarget:350, avgBonusReward:400, normalCostPerGame:2.3, addedDate: "2026-03-01" },
    { id: "valvrave2", name: "L革命機ヴァルヴレイヴ2", type: "AT", bigLabel: "初当たり合算", regLabel: null, koyakuName: null,
      settings: { 1:{big:476,reg:null,koyaku:null,payout:97.7}, 2:{big:473,reg:null,koyaku:null,payout:99.3}, 4:{big:464,reg:null,koyaku:null,payout:104.7}, 5:{big:459,reg:null,koyaku:null,payout:110.8}, 6:{big:456,reg:null,koyaku:null,payout:114.9} },
      ceiling:1500, ceilingTarget:700, ceilingReward:1200, resetCeiling:1000, resetCeilingTarget:500, avgBonusReward:800, normalCostPerGame:2.0, addedDate: "2026-03-01" },
    { id: "enen", name: "炎炎ノ消防隊", type: "AT", bigLabel: "初当たり", regLabel: null, koyakuName: null,
      settings: { 1:{big:272,reg:null,koyaku:null,payout:97.7}, 2:{big:269,reg:null,koyaku:null,payout:98.8}, 3:{big:257,reg:null,koyaku:null,payout:101.2}, 4:{big:242,reg:null,koyaku:null,payout:105.6}, 5:{big:236,reg:null,koyaku:null,payout:110.2}, 6:{big:227,reg:null,koyaku:null,payout:114.9} },
      ceiling:850, ceilingTarget:550, ceilingReward:600, resetCeiling:650, resetCeilingTarget:350, avgBonusReward:400, normalCostPerGame:2.2, addedDate: "2026-03-01" },
    { id: "tekken6", name: "スマスロ 鉄拳6", type: "AT", bigLabel: "ボーナス", regLabel: "AT初当たり", koyakuName: null,
      settings: { 1:{big:264.7,reg:497.0,koyaku:null,payout:97.9}, 2:{big:261.5,reg:484.1,koyaku:null,payout:98.9}, 3:{big:255.3,reg:456.8,koyaku:null,payout:100.5}, 4:{big:227.6,reg:397.6,koyaku:null,payout:105.2}, 5:{big:220.3,reg:366.4,koyaku:null,payout:110.3}, 6:{big:218.5,reg:358.5,koyaku:null,payout:114.9} },
      ceiling:900, ceilingTarget:600, ceilingReward:700, resetCeiling:500, resetCeilingTarget:300, avgBonusReward:400, normalCostPerGame:2.2, addedDate: "2026-03-01" },
    { id: "prism_nana", name: "プリズムナナ", type: "AT", bigLabel: "初当たり", regLabel: null, koyakuName: null,
      settings: { 1:{big:351.8,reg:null,koyaku:null,payout:97.7}, 2:{big:346.9,reg:null,koyaku:null,payout:98.5}, 3:{big:337.2,reg:null,koyaku:null,payout:100.1}, 4:{big:306.6,reg:null,koyaku:null,payout:105.5}, 5:{big:290.1,reg:null,koyaku:null,payout:110.1}, 6:{big:278.6,reg:null,koyaku:null,payout:114.9} },
      ceiling:899, ceilingTarget:550, ceilingReward:700, resetCeiling:555, resetCeilingTarget:350, avgBonusReward:400, normalCostPerGame:2.2, addedDate: "2026-03-01" },
    { id: "azurlane", name: "L アズールレーン THE ANIMATION", type: "AT", bigLabel: "AT初当たり", regLabel: null, koyakuName: null,
      settings: { 1:{big:598.9,reg:null,koyaku:null,payout:97.9}, 2:{big:589.5,reg:null,koyaku:null,payout:98.6}, 3:{big:564.2,reg:null,koyaku:null,payout:100.7}, 4:{big:527.1,reg:null,koyaku:null,payout:105.3}, 5:{big:483.0,reg:null,koyaku:null,payout:110.6}, 6:{big:467.5,reg:null,koyaku:null,payout:114.9} },
      ceiling:2000, ceilingTarget:1200, ceilingReward:1200, resetCeiling:null, resetCeilingTarget:null, avgBonusReward:600, normalCostPerGame:2.3, addedDate: "2026-03-01" },
    { id: "zettai4", name: "L 絶対衝激IV", type: "AT", bigLabel: "ボーナス", regLabel: "AT初当たり", koyakuName: null,
      settings: { 1:{big:270,reg:543,koyaku:null,payout:97.2}, 2:{big:261,reg:501,koyaku:null,payout:98.6}, 3:{big:254,reg:450,koyaku:null,payout:100.6}, 4:{big:241,reg:357,koyaku:null,payout:105.8}, 5:{big:231,reg:304,koyaku:null,payout:109.0}, 6:{big:225,reg:266,koyaku:null,payout:112.5} },
      ceiling:null, ceilingTarget:null, ceilingReward:null, avgBonusReward:400, normalCostPerGame:2.2, addedDate: "2026-03-01" },
    { id: "railgun2", name: "スマスロ とある科学の超電磁砲2", type: "AT", bigLabel: "AT初当たり", regLabel: "CZ初当たり", koyakuName: null,
      settings: { 1:{big:317.8,reg:175.7,koyaku:null,payout:97.7}, 2:{big:311.8,reg:172.6,koyaku:null,payout:98.9}, 3:{big:304.4,reg:168.5,koyaku:null,payout:100.3}, 4:{big:272.4,reg:156.6,koyaku:null,payout:105.4}, 5:{big:248.1,reg:145.7,koyaku:null,payout:110.0}, 6:{big:235.3,reg:137.5,koyaku:null,payout:112.9} },
      ceiling:999, ceilingTarget:550, ceilingReward:600, resetCeiling:699, resetCeilingTarget:400, avgBonusReward:400, normalCostPerGame:2.2, addedDate: "2026-03-01" },
    { id: "onimusha3", name: "スマスロ 新鬼武者3", type: "AT", bigLabel: "AT初当たり", regLabel: null, koyakuName: null,
      settings: { 1:{big:379.7,reg:null,koyaku:null,payout:97.5}, 2:{big:372.7,reg:null,koyaku:null,payout:98.3}, 3:{big:352.8,reg:null,koyaku:null,payout:100.2}, 4:{big:306.5,reg:null,koyaku:null,payout:105.2}, 5:{big:297.9,reg:null,koyaku:null,payout:109.2}, 6:{big:293.1,reg:null,koyaku:null,payout:113.0} },
      ceiling:1000, ceilingTarget:500, ceilingReward:700, resetCeiling:700, resetCeilingTarget:400, avgBonusReward:400, normalCostPerGame:2.3, addedDate: "2026-03-01" },
    { id: "zenigata5", name: "L主役は銭形5", type: "AT", bigLabel: "初当たり", regLabel: null, koyakuName: null,
      settings: { 2:{big:424.5,reg:null,koyaku:null,payout:97.9}, 3:{big:416.4,reg:null,koyaku:null,payout:99.0}, 4:{big:388.1,reg:null,koyaku:null,payout:103.2}, 5:{big:375.9,reg:null,koyaku:null,payout:107.1}, 6:{big:300.5,reg:null,koyaku:null,payout:112.1} },
      ceiling:1250, ceilingTarget:800, ceilingReward:800, resetCeiling:850, resetCeilingTarget:500, avgBonusReward:500, normalCostPerGame:2.3, addedDate: "2026-03-01" },
    { id: "tokyo_revengers", name: "スマスロ 東京リベンジャーズ", type: "AT", bigLabel: "初当たり", regLabel: "AT初当たり", koyakuName: null,
      settings: { 1:{big:282.4,reg:482.2,koyaku:null,payout:97.8}, 2:{big:279.5,reg:474.7,koyaku:null,payout:98.8}, 3:{big:272.2,reg:456.9,koyaku:null,payout:101.4}, 4:{big:255.8,reg:414.0,koyaku:null,payout:106.3}, 5:{big:249.1,reg:393.8,koyaku:null,payout:111.2}, 6:{big:240.1,reg:373.1,koyaku:null,payout:114.9} },
      ceiling:1190, ceilingTarget:700, ceilingReward:800, resetCeiling:900, resetCeilingTarget:550, avgBonusReward:500, normalCostPerGame:2.2, addedDate: "2026-03-01" },
    { id: "iza_banchou", name: "いざ！番長", type: "AT", bigLabel: "初当たり", regLabel: null, koyakuName: null,
      settings: { 1:{big:386.9,reg:null,koyaku:null,payout:97.6}, 2:{big:368.5,reg:null,koyaku:null,payout:98.9}, 3:{big:375.8,reg:null,koyaku:null,payout:101.3}, 4:{big:332.4,reg:null,koyaku:null,payout:106.0}, 5:{big:351.6,reg:null,koyaku:null,payout:112.1}, 6:{big:312.1,reg:null,koyaku:null,payout:114.9} },
      ceiling:999, ceilingTarget:600, ceilingReward:700, resetCeiling:600, resetCeilingTarget:350, avgBonusReward:400, normalCostPerGame:2.3, addedDate: "2026-03-01" },
    { id: "monhan_rise", name: "スマスロ モンスターハンターライズ", type: "AT", bigLabel: "AT初当たり", regLabel: null, koyakuName: null,
      settings: { 1:{big:309.5,reg:null,koyaku:null,payout:97.9}, 2:{big:301.4,reg:null,koyaku:null,payout:98.8}, 3:{big:290.8,reg:null,koyaku:null,payout:100.3}, 4:{big:256.4,reg:null,koyaku:null,payout:105.4}, 5:{big:237.1,reg:null,koyaku:null,payout:110.1}, 6:{big:230.8,reg:null,koyaku:null,payout:114.3} },
      ceiling:999, ceilingTarget:600, ceilingReward:700, resetCeiling:null, resetCeilingTarget:null, avgBonusReward:400, normalCostPerGame:2.2, addedDate: "2026-03-01" },
    { id: "enen2", name: "Lパチスロ 炎炎ノ消防隊2", type: "AT", bigLabel: "初当たり", regLabel: "炎炎ループ", koyakuName: null,
      settings: { 1:{big:272,reg:684,koyaku:null,payout:97.7}, 2:{big:269,reg:662,koyaku:null,payout:98.8}, 3:{big:257,reg:617,koyaku:null,payout:101.2}, 4:{big:242,reg:546,koyaku:null,payout:105.6}, 5:{big:236,reg:518,koyaku:null,payout:110.2}, 6:{big:227,reg:486,koyaku:null,payout:114.9} },
      ceiling:850, ceilingTarget:550, ceilingReward:600, resetCeiling:650, resetCeilingTarget:350, avgBonusReward:400, normalCostPerGame:2.2, addedDate: "2026-03-01" },
    { id: "magireco", name: "スマスロ マギアレコード 魔法少女まどか☆マギカ外伝", type: "AT", bigLabel: "ボーナス初当たり", regLabel: "AT初当たり", koyakuName: null,
      settings: { 1:{big:240.6,reg:654.6,koyaku:null,payout:97.6}, 2:{big:236.1,reg:633.4,koyaku:null,payout:98.9}, 3:{big:222.8,reg:571.8,koyaku:null,payout:102.0}, 4:{big:208.5,reg:516.6,koyaku:null,payout:106.0}, 5:{big:195.1,reg:456.5,koyaku:null,payout:110.4}, 6:{big:184.3,reg:416.7,koyaku:null,payout:114.9} },
      ceiling:950, ceilingTarget:550, ceilingReward:500, resetCeiling:650, resetCeilingTarget:350, avgBonusReward:400, normalCostPerGame:2.2, addedDate: "2026-03-01" },
    { id: "okidoki_duo", name: "スマスロ 沖ドキ！DUO アンコール", type: "AT", bigLabel: "初当たり", regLabel: null, koyakuName: null,
      settings: { 1:{big:240.0,reg:null,koyaku:null,payout:97.2}, 2:{big:230.2,reg:null,koyaku:null,payout:98.6}, 3:{big:215.8,reg:null,koyaku:null,payout:102.4}, 5:{big:192.1,reg:null,koyaku:null,payout:106.8}, 6:{big:181.0,reg:null,koyaku:null,payout:110.0} },
      ceiling:800, ceilingTarget:550, ceilingReward:500, resetCeiling:null, resetCeilingTarget:null, avgBonusReward:300, normalCostPerGame:2.0, addedDate: "2026-03-01" },
    { id: "mushoku", name: "L 無職転生 ～異世界行ったら本気だす～", type: "AT", bigLabel: "AT初当たり", regLabel: null, koyakuName: null,
      settings: { 1:{big:416,reg:null,koyaku:null,payout:97.7}, 2:{big:406,reg:null,koyaku:null,payout:99.1}, 3:{big:394,reg:null,koyaku:null,payout:100.9}, 4:{big:361,reg:null,koyaku:null,payout:105.4}, 5:{big:327,reg:null,koyaku:null,payout:109.5}, 6:{big:292,reg:null,koyaku:null,payout:113.7} },
      ceiling:1007, ceilingTarget:600, ceilingReward:700, resetCeiling:689, resetCeilingTarget:400, avgBonusReward:400, normalCostPerGame:2.2, addedDate: "2026-03-01" },
    { id: "sbj", name: "スマスロスーパーブラックジャック", type: "AT", bigLabel: "ボーナス初当たり", regLabel: null, koyakuName: null,
      settings: { 1:{big:241.7,reg:null,koyaku:null,payout:97.8}, 2:{big:238.8,reg:null,koyaku:null,payout:98.7}, 3:{big:235.9,reg:null,koyaku:null,payout:100.1}, 4:{big:201.8,reg:null,koyaku:null,payout:105.7}, 5:{big:194.9,reg:null,koyaku:null,payout:110.0}, 6:{big:181.3,reg:null,koyaku:null,payout:112.7} },
      ceiling:999, ceilingTarget:580, ceilingReward:700, resetCeiling:666, resetCeilingTarget:400, avgBonusReward:400, normalCostPerGame:2.2, addedDate: "2026-03-01" },
    { id: "yoshimune", name: "吉宗", type: "AT", bigLabel: "初当たり", regLabel: null, koyakuName: null,
      settings: { 1:{big:378.9,reg:null,koyaku:null,payout:97.8}, 2:{big:369.6,reg:null,koyaku:null,payout:99.1}, 3:{big:358.8,reg:null,koyaku:null,payout:100.6}, 4:{big:335.1,reg:null,koyaku:null,payout:104.1}, 5:{big:318.5,reg:null,koyaku:null,payout:107.1}, 6:{big:292.4,reg:null,koyaku:null,payout:112.0} },
      ceiling:999, ceilingTarget:600, ceilingReward:800, resetCeiling:null, resetCeilingTarget:null, avgBonusReward:600, normalCostPerGame:2.3, addedDate: "2026-03-01" },
    { id: "goblin_slayer2", name: "スマスロ ゴブリンスレイヤーⅡ", type: "AT", bigLabel: "AT初当たり", regLabel: "CZ初当たり", koyakuName: null,
      settings: { 1:{big:541.6,reg:239.3,koyaku:null,payout:97.6}, 2:{big:526.4,reg:232.3,koyaku:null,payout:98.7}, 3:{big:506.4,reg:222.9,koyaku:null,payout:100.4}, 4:{big:453.2,reg:200.4,koyaku:null,payout:104.9}, 5:{big:417.8,reg:187.3,koyaku:null,payout:109.7}, 6:{big:402.4,reg:181.9,koyaku:null,payout:113.2} },
      ceiling:1500, ceilingTarget:900, ceilingReward:800, resetCeiling:1000, resetCeilingTarget:550, avgBonusReward:500, normalCostPerGame:2.3, addedDate: "2026-03-01" },
    { id: "otome4", name: "L戦国乙女4 戦乱に閃く炯眼の軍師", type: "AT", bigLabel: "ボーナス+AT合算", regLabel: "AT初当たり", koyakuName: null,
      settings: { 1:{big:272.7,reg:429.2,koyaku:null,payout:98.2}, 2:{big:267.3,reg:417.8,koyaku:null,payout:99.0}, 3:{big:255.3,reg:393.6,koyaku:null,payout:101.2}, 4:{big:238.2,reg:361.3,koyaku:null,payout:105.2}, 5:{big:223.2,reg:334.1,koyaku:null,payout:110.2}, 6:{big:217.1,reg:319.2,koyaku:null,payout:113.0} },
      ceiling:799, ceilingTarget:500, ceilingReward:500, resetCeiling:null, resetCeilingTarget:null, avgBonusReward:300, normalCostPerGame:2.2, addedDate: "2026-03-01" },
    { id: "toloveru", name: "L ToLOVEるダークネス", type: "AT", bigLabel: "AT初当たり", regLabel: null, koyakuName: null,
      settings: { 2:{big:352.0,reg:null,koyaku:null,payout:98.0}, 3:{big:345.7,reg:null,koyaku:null,payout:99.0}, 4:{big:328.4,reg:null,koyaku:null,payout:102.5}, 5:{big:311.3,reg:null,koyaku:null,payout:105.8}, 6:{big:311.1,reg:null,koyaku:null,payout:110.1} },
      ceiling:999, ceilingTarget:600, ceilingReward:700, resetCeiling:650, resetCeilingTarget:350, avgBonusReward:400, normalCostPerGame:2.2, addedDate: "2026-03-01" },
    { id: "baki", name: "Ｌ範馬刃牙", type: "AT", bigLabel: "ボーナス", regLabel: "AT初当たり", koyakuName: null,
      settings: { 1:{big:269.4,reg:525.3,koyaku:null,payout:97.7}, 2:{big:265.7,reg:517.1,koyaku:null,payout:98.5}, 3:{big:258.3,reg:503.2,koyaku:null,payout:100.5}, 4:{big:252.1,reg:484.5,koyaku:null,payout:105.2}, 5:{big:251.0,reg:481.9,koyaku:null,payout:107.9}, 6:{big:250.1,reg:480.4,koyaku:null,payout:110.6} },
      ceiling:700, ceilingTarget:400, ceilingReward:500, resetCeiling:200, resetCeilingTarget:100, avgBonusReward:350, normalCostPerGame:2.2, addedDate: "2026-03-01" },
    { id: "biohazard5", name: "スマスロ バイオハザード5", type: "AT", bigLabel: "AT初当たり", regLabel: null, koyakuName: null,
      settings: { 1:{big:325.8,reg:null,koyaku:null,payout:97.8}, 2:{big:314.4,reg:null,koyaku:null,payout:98.8}, 3:{big:298.2,reg:null,koyaku:null,payout:100.6}, 4:{big:271.4,reg:null,koyaku:null,payout:104.6}, 5:{big:249.6,reg:null,koyaku:null,payout:108.9}, 6:{big:236.2,reg:null,koyaku:null,payout:114.9} },
      ceiling:999, ceilingTarget:600, ceilingReward:700, resetCeiling:666, resetCeilingTarget:400, avgBonusReward:400, normalCostPerGame:2.2, addedDate: "2026-03-01" },
    { id: "revuestarlight", name: "L少女☆歌劇 レヴュースタァライト -The SLOT-", type: "AT", bigLabel: "ボーナス合算", regLabel: "AT初当たり", koyakuName: null,
      settings: { 1:{big:184.8,reg:359.6,koyaku:null,payout:97.8}, 2:{big:182.2,reg:346.8,koyaku:null,payout:98.8}, 4:{big:169.9,reg:277.1,koyaku:null,payout:104.6}, 5:{big:165.4,reg:255.7,koyaku:null,payout:106.9}, 6:{big:160.6,reg:232.5,koyaku:null,payout:110.0} },
      ceiling:900, ceilingTarget:550, ceilingReward:600, resetCeiling:600, resetCeilingTarget:350, avgBonusReward:400, normalCostPerGame:2.2, addedDate: "2026-03-01" },
    { id: "eureka_seven_art", name: "交響詩篇エウレカセブン HI-EVOLUTION ZERO TYPE-ART", type: "AT", bigLabel: "ボーナス合算", regLabel: "ART初当たり", koyakuName: null,
      settings: { 1:{big:195.6,reg:270.4,koyaku:null,payout:98.1}, 2:{big:192.8,reg:255.7,koyaku:null,payout:99.0}, 3:{big:190.5,reg:239.3,koyaku:null,payout:100.3}, 4:{big:186.7,reg:210.7,koyaku:null,payout:103.6}, 5:{big:185.7,reg:201.2,koyaku:null,payout:104.8}, 6:{big:183.1,reg:188.7,koyaku:null,payout:106.4} },
      ceiling:null, ceilingTarget:null, ceilingReward:null, resetCeiling:null, resetCeilingTarget:null, avgBonusReward:400, normalCostPerGame:2.2, addedDate: "2026-04-01" },
    { id: "shake_bt", name: "スマスロ シェイク ボーナストリガー", type: "AT", bigLabel: "BIG", regLabel: "REG", koyakuName: null,
      settings: { 1:{big:350.5,reg:425.6,koyaku:null,payout:98.6}, 2:{big:327.7,reg:332.7,koyaku:null,payout:100.6}, 5:{big:341.3,reg:409.6,koyaku:null,payout:103.0}, 6:{big:297.9,reg:297.9,koyaku:null,payout:106.1} },
      ceiling:null, ceilingTarget:null, ceilingReward:null, resetCeiling:null, resetCeilingTarget:null, avgBonusReward:400, normalCostPerGame:1.4, addedDate: "2026-04-01" },
    { id: "harem_ace_bt", name: "翔べ！ハーレムエース", type: "AT", bigLabel: "ボーナス合算", regLabel: null, koyakuName: null,
      settings: { 1:{big:234.1,reg:null,koyaku:null,payout:98.1}, 2:{big:220.7,reg:null,koyaku:null,payout:99.9}, 5:{big:186.7,reg:null,koyaku:null,payout:104.7}, 6:{big:158.7,reg:null,koyaku:null,payout:110.0} },
      ceiling:null, ceilingTarget:null, ceilingReward:null, resetCeiling:null, resetCeilingTarget:null, avgBonusReward:350, normalCostPerGame:1.2, addedDate: "2026-04-01" },
    { id: "alex_bt", name: "スマスロ アレックスブライト", type: "AT", bigLabel: "BIG", regLabel: "REG", koyakuName: null,
      settings: { 1:{big:309.1,reg:428.3,koyaku:null,payout:98.8}, 2:{big:303.4,reg:409.6,koyaku:null,payout:100.2}, 3:{big:299.3,reg:388.0,koyaku:null,payout:101.2}, 4:{big:297.2,reg:376.0,koyaku:null,payout:102.6}, 5:{big:295.2,reg:366.1,koyaku:null,payout:104.1}, 6:{big:287.4,reg:312.1,koyaku:null,payout:108.3} },
      ceiling:null, ceilingTarget:null, ceilingReward:null, resetCeiling:null, resetCeilingTarget:null, avgBonusReward:400, normalCostPerGame:2.2, addedDate: "2026-04-01" },
    { id: "bofuri", name: "スマスロ痛いのは嫌なので防御力に極振りしたいと思います。", type: "AT", bigLabel: "AT初当たり", regLabel: null, koyakuName: null,
      settings: { 1:{big:319.0,reg:null,koyaku:null,payout:97.9}, 2:{big:309.8,reg:null,koyaku:null,payout:98.8}, 3:{big:307.3,reg:null,koyaku:null,payout:100.5}, 4:{big:266.8,reg:null,koyaku:null,payout:105.9}, 5:{big:257.1,reg:null,koyaku:null,payout:109.5}, 6:{big:229.7,reg:null,koyaku:null,payout:113.0} },
      ceiling:950, ceilingTarget:600, ceilingReward:700, resetCeiling:650, resetCeilingTarget:400, avgBonusReward:450, normalCostPerGame:1.5, addedDate: "2026-04-01" },
    { id: "nanatsu_maken", name: "L七つの魔剣が支配する", type: "AT", bigLabel: "ボーナス初当たり", regLabel: "ST初当たり", koyakuName: null,
      settings: { 1:{big:228.0,reg:408.3,koyaku:null,payout:97.9}, 2:{big:222.0,reg:394.9,koyaku:null,payout:99.0}, 3:{big:209.7,reg:366.4,koyaku:null,payout:101.1}, 4:{big:185.6,reg:314.0,koyaku:null,payout:105.5}, 5:{big:173.5,reg:289.2,koyaku:null,payout:108.5}, 6:{big:164.7,reg:272.3,koyaku:null,payout:111.0} },
      ceiling:1000, ceilingTarget:600, ceilingReward:700, resetCeiling:650, resetCeilingTarget:400, avgBonusReward:400, normalCostPerGame:2.0, addedDate: "2026-04-01" },
    { id: "granbelm", name: "回胴式遊技機 グランベルム", type: "AT", bigLabel: "ボーナス", regLabel: "AT初当たり", koyakuName: null,
      settings: { 1:{big:287.9,reg:478.9,koyaku:null,payout:97.6}, 2:{big:283.1,reg:466.6,koyaku:null,payout:98.5}, 3:{big:268.8,reg:436.0,koyaku:null,payout:100.7}, 4:{big:247.7,reg:393.8,koyaku:null,payout:104.5}, 5:{big:233.7,reg:367.5,koyaku:null,payout:107.6}, 6:{big:223.8,reg:346.1,koyaku:null,payout:110.9} },
      ceiling:649, ceilingTarget:400, ceilingReward:500, resetCeiling:null, resetCeilingTarget:null, avgBonusReward:400, normalCostPerGame:1.5, addedDate: "2026-04-01" },
    { id: "kyokou_suiritr", name: "L 虚構推理", type: "AT", bigLabel: "初当たり", regLabel: "CZ", koyakuName: null,
      settings: { 1:{big:349.0,reg:124.5,koyaku:null,payout:97.7}, 2:{big:341.3,reg:121.9,koyaku:null,payout:98.5}, 3:{big:329.3,reg:118.6,koyaku:null,payout:100.0}, 4:{big:300.2,reg:112.5,koyaku:null,payout:104.0}, 5:{big:279.7,reg:107.1,koyaku:null,payout:108.0}, 6:{big:264.8,reg:103.5,koyaku:null,payout:112.0} },
      ceiling:1000, ceilingTarget:600, ceilingReward:700, resetCeiling:700, resetCeilingTarget:400, avgBonusReward:450, normalCostPerGame:1.6, addedDate: "2026-04-06" },
    { id: "isekai_quartet_bt", name: "A-SLOT+ 異世界かるてっと BT", type: "A", bigLabel: "BIG", regLabel: "いせかる目", koyakuName: null,
      settings: { 1:{big:1337.5,reg:107.6,koyaku:null,payout:97.9}, 2:{big:1260.3,reg:106.2,koyaku:null,payout:99.9}, 3:{big:1187.0,reg:103.2,koyaku:null,payout:101.4}, 4:{big:1113.7,reg:100.1,koyaku:null,payout:102.9}, 5:{big:1040.3,reg:97.1,koyaku:null,payout:104.4}, 6:{big:923.0,reg:89.2,koyaku:null,payout:109.0} },
      ceiling:null, ceilingTarget:null, ceilingReward:null, avgBonusReward:220, normalCostPerGame:1.5, addedDate: "2026-04-06" },
    { id: "jormungand", name: "スマスロ ヨルムンガンド", type: "AT", bigLabel: "AT初当たり", regLabel: "CZ", koyakuName: null,
      settings: { 1:{big:333.8,reg:194.2,koyaku:null,payout:97.8}, 2:{big:323.3,reg:188.6,koyaku:null,payout:98.8}, 3:{big:305.4,reg:175.7,koyaku:null,payout:100.9}, 4:{big:291.6,reg:169.4,koyaku:null,payout:104.7}, 5:{big:291.1,reg:167.8,koyaku:null,payout:109.6}, 6:{big:290.1,reg:167.2,koyaku:null,payout:113.9} },
      ceiling:null, ceilingTarget:null, ceilingReward:null, resetCeiling:null, resetCeilingTarget:null, avgBonusReward:400, normalCostPerGame:1.6, addedDate: "2026-04-06" },
    { id: "akudama_drive", name: "L アクダマドライブ", type: "AT", bigLabel: "AT初当たり", regLabel: "CZ", koyakuName: null,
      settings: { 1:{big:555.5,reg:166.1,koyaku:null,payout:97.4}, 2:{big:550.7,reg:165.3,koyaku:null,payout:98.0}, 3:{big:543.6,reg:163.8,koyaku:null,payout:99.5}, 4:{big:517.8,reg:159.3,koyaku:null,payout:102.5}, 5:{big:487.7,reg:154.8,koyaku:null,payout:106.5}, 6:{big:472.0,reg:152.1,koyaku:null,payout:112.0} },
      ceiling:967, ceilingTarget:600, ceilingReward:700, resetCeiling:589, resetCeilingTarget:380, avgBonusReward:450, normalCostPerGame:1.6, addedDate: "2026-04-06" },
    { id: "shinuchi_yoshimune", name: "真打 吉宗", type: "AT", bigLabel: "AT初当たり", regLabel: "CZ", koyakuName: null,
      settings: { 1:{big:488.9,reg:313.0,koyaku:null,payout:97.8}, 2:{big:471.5,reg:303.0,koyaku:null,payout:98.6}, 3:{big:438.5,reg:283.5,koyaku:null,payout:101.0}, 4:{big:398.1,reg:267.1,koyaku:null,payout:104.5}, 5:{big:377.0,reg:256.9,koyaku:null,payout:108.0}, 6:{big:354.9,reg:250.6,koyaku:null,payout:114.0} },
      ceiling:1500, ceilingTarget:900, ceilingReward:850, resetCeiling:null, resetCeilingTarget:null, avgBonusReward:550, normalCostPerGame:1.6, addedDate: "2026-04-06" },
    { id: "lb_triple_crown_seven", name: "LB トリプルクラウンセブン", type: "A", bigLabel: "BIG", regLabel: "REG", koyakuName: null,
      settings: { 1:{big:258.0,reg:590.4,koyaku:null,payout:97.5}, 2:{big:253.0,reg:580.0,koyaku:null,payout:99.0}, 3:{big:245.3,reg:561.4,koyaku:null,payout:101.0}, 4:{big:237.7,reg:543.0,koyaku:null,payout:103.0}, 5:{big:230.0,reg:524.3,koyaku:null,payout:105.0}, 6:{big:203.5,reg:464.8,koyaku:null,payout:112.1} },
      ceiling:null, ceilingTarget:null, ceilingReward:null, avgBonusReward:280, normalCostPerGame:1.5, addedDate: "2026-04-06" },
    { id: "gundam_unicorn_kakusei_drive", name: "Lパチスロ 機動戦士ガンダムユニコーン 覚醒DRIVE", type: "AT", bigLabel: "CZ", regLabel: "AT初当たり", koyakuName: null,
      settings: { 1:{big:298.5,reg:471.9,koyaku:null,payout:97.7}, 2:{big:287.0,reg:456.6,koyaku:null,payout:98.9}, 3:{big:265.1,reg:427.8,koyaku:null,payout:101.0}, 4:{big:247.7,reg:403.9,koyaku:null,payout:105.4}, 5:{big:243.9,reg:398.3,koyaku:null,payout:110.5}, 6:{big:239.8,reg:392.3,koyaku:null,payout:114.9} },
      ceiling:800, ceilingTarget:500, ceilingReward:700, resetCeiling:400, resetCeilingTarget:250, avgBonusReward:450, normalCostPerGame:1.6, addedDate: "2026-04-20" },
    { id: "million_god_kiseki", name: "スマスロ ミリオンゴッド-神々の軌跡-", type: "AT", bigLabel: "AT初当たり", regLabel: null, koyakuName: null,
      settings: { 1:{big:533.0,reg:null,koyaku:null,payout:97.2}, 2:{big:420.0,reg:null,koyaku:null,payout:99.1}, 3:{big:496.0,reg:null,koyaku:null,payout:102.1}, 4:{big:338.0,reg:null,koyaku:null,payout:106.9}, 5:{big:455.0,reg:null,koyaku:null,payout:111.7}, 6:{big:295.0,reg:null,koyaku:null,payout:114.6} },
      ceiling:null, ceilingTarget:null, ceilingReward:null, resetCeiling:null, resetCeilingTarget:null, avgBonusReward:550, normalCostPerGame:1.5, addedDate: "2026-04-20" },
    { id: "animal_slot_dotch", name: "アニマルスロット ドッチ", type: "AT", bigLabel: "BIG", regLabel: "REG", koyakuName: null,
      settings: { 1:{big:329.7,reg:349.5,koyaku:null,payout:97.6}, 2:{big:314.7,reg:342.8,koyaku:null,payout:98.7}, 3:{big:295.6,reg:339.4,koyaku:null,payout:100.4}, 4:{big:274.3,reg:328.1,koyaku:null,payout:103.5}, 5:{big:249.1,reg:321.5,koyaku:null,payout:107.5}, 6:{big:227.4,reg:314.3,koyaku:null,payout:108.2} },
      ceiling:999, ceilingTarget:650, ceilingReward:480, resetCeiling:499, resetCeilingTarget:320, avgBonusReward:320, normalCostPerGame:1.5, addedDate: "2026-04-20" },
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

function getMachinePageMeta(machine, variant) {
    const isAT = machine.type === "AT";
    const hasCeiling = machine.ceiling !== null && machine.ceiling > 0;
    const typeLabel = isAT ? "AT/ART機（スマスロ）" : "Aタイプ";

    // 既存（総合）
    if (!variant || variant === "main") {
        const titleKeyword = isAT
            ? `${machine.name} 設定推測・天井期待値`
            : `${machine.name} 設定判別・ボーナス確率`;
        const descKeywords = isAT
            ? (hasCeiling
                ? `${machine.name}の設定推測と天井期待値を自動計算。${machine.bigLabel}確率、出玉率から設定判別。天井${machine.ceiling}G、狙い目${machine.ceilingTarget}G〜。ゲーム数別の天井期待値一覧表も掲載。`
                : `${machine.name}の設定推測ツール。${machine.bigLabel}確率${machine.regLabel ? `・${machine.regLabel}確率` : ""}、出玉率から設定判別。天井は非搭載または解析中の機種のため、スペック確認・設定推測にお使いください。`)
            : `${machine.name}の設定推測ツール。${machine.bigLabel}確率・${machine.regLabel}確率・合算確率から設定判別。各設定のスペック一覧も掲載。`;
        return { titleKeyword, descKeywords, typeLabel };
    }

    if (variant === "ceiling") {
        const titleKeyword = hasCeiling
            ? `${machine.name} 天井・狙い目・期待値`
            : `${machine.name} 天井（非搭載/解析中）・立ち回りの注意点`;
        const descKeywords = hasCeiling
            ? `${machine.name}の天井ゲーム数、狙い目（${machine.ceilingTarget}G〜）と天井期待値一覧を掲載。設定1基準の概算で、現在G数別の期待値と到達率を確認できます。`
            : `${machine.name}の天井情報まとめ。天井は非搭載または解析中のため、設定推測・スペック確認と併せて立ち回りの注意点を整理します。`;
        return { titleKeyword, descKeywords, typeLabel };
    }

    if (variant === "setting") {
        const titleKeyword = isAT
            ? `${machine.name} 設定差・設定推測（確率/出玉率）`
            : `${machine.name} 設定判別（ボーナス/合算/小役）`;
        const descKeywords = isAT
            ? `${machine.name}の設定差（${machine.bigLabel}確率・出玉率）を一覧で確認。データ入力で設定推測も可能です。`
            : `${machine.name}の設定判別用に、BIG/REG/合算${machine.koyakuName ? `・${machine.koyakuName}` : ""}と出玉率を一覧化。データ入力で設定推測もできます。`;
        return { titleKeyword, descKeywords, typeLabel };
    }

    if (variant === "beginner") {
        const titleKeyword = `${machine.name} 設定推測の見方（初心者向け）`;
        const descKeywords = `${machine.name}の設定推測・天井期待値の見方を初心者向けに解説。入力のコツ、結果％の読み方、注意点をまとめます。`;
        return { titleKeyword, descKeywords, typeLabel };
    }

    return getMachinePageMeta(machine, "main");
}

function getMachinePagePaths(machine, variant) {
    // machines/{id}/ は既存のURLとして維持。派生ページは /ceiling/ /setting/ /beginner/
    const slug = variant && variant !== "main" ? `${variant}/` : "";
    const urlPath = `/machines/${machine.id}/${slug}`;
    const url = `${SITE_URL}${urlPath}`;
    const basePrefix = variant && variant !== "main" ? "../../../" : "../../";
    const topHref = `${basePrefix}index.html`;
    const faviconHref = `${basePrefix}favicon.png`;
    const styleHref = `${basePrefix}style.css`;
    const lpCssHref = `${basePrefix}machines/landing-page.css`;
    return { slug, urlPath, url, basePrefix, topHref, faviconHref, styleHref, lpCssHref };
}

function buildVariantNav(machine, currentVariant) {
    const items = [
        { v: "main", label: "総合" },
        { v: "ceiling", label: "天井・期待値" },
        { v: "setting", label: "設定差・推測" },
        { v: "beginner", label: "初心者向け" },
    ];
    const links = items.map(({ v, label }) => {
        const href =
            v === "main"
                ? (currentVariant === "main" ? "./" : "../")
                : (currentVariant === "main" ? `${v}/` : `../${v}/`);
        const cls = v === currentVariant ? "lp-variant-link active" : "lp-variant-link";
        return `<a class="${cls}" href="${href}">${label}</a>`;
    });
    return `
            <nav class="card lp-section lp-variant-nav" aria-label="ページ切り替え">
                <h2 class="card-title"><span class="card-icon">&#128279;</span> ページ切り替え</h2>
                <div class="lp-variant-links">
                    ${links.join("\n                    ")}
                </div>
            </nav>`;
}

function buildRelatedGuideLinks(machine, variant, basePrefix) {
    const isAT = machine.type === "AT";
    const hasCeiling = machine.ceiling !== null && machine.ceiling > 0;
    const guide = (slug) => `${basePrefix}guide/${slug}.html`;

    const links = [];

    // まずは variant の意図に寄せる
    if (variant === "ceiling") {
        links.push({ href: guide("ceiling-basics"), label: "天井とは？（基礎）" });
        links.push({ href: guide("ceiling-ev-guide"), label: "天井期待値の見方・使い方" });
        links.push({ href: guide("reset-ceiling-tips"), label: "朝一リセット天井の注意点" });
        links.push({ href: guide("medal-yen-ceiling-ev"), label: "期待値（円表示）の前提" });
    } else if (variant === "setting") {
        links.push({ href: guide("setting-basics"), label: "設定推測の基本" });
        links.push({ href: guide("data-counting"), label: "データの取り方（総G/BIG/REG）" });
        links.push({ href: guide("reading-results"), label: "推測結果％の読み方" });
        links.push({ href: guide("tool-limitations"), label: "ツールの落とし穴（注意点）" });
    } else if (variant === "beginner") {
        links.push({ href: guide("how-to-use"), label: "当サイトの使い方まとめ" });
        links.push({ href: guide("data-counting"), label: "入力データの取り方" });
        links.push({ href: guide("reading-results"), label: "結果の読み方" });
        links.push({ href: guide("responsible-play"), label: "のめり込み防止（自己管理）" });
    } else {
        links.push({ href: guide("how-to-use"), label: "当サイトの使い方まとめ" });
        links.push({ href: guide("setting-basics"), label: "設定推測の基本" });
        if (hasCeiling) links.push({ href: guide("ceiling-basics"), label: "天井の基礎" });
        links.push({ href: guide("tool-limitations"), label: "ツールの落とし穴（注意点）" });
    }

    // 機種タイプに寄せた補助リンク
    if (!isAT) {
        links.push({ href: guide("juggler-guide"), label: "Aタイプ（ジャグラー系）の判別ポイント" });
    } else {
        links.push({ href: guide("at-ceiling-guide"), label: "AT機の天井狙い（初心者向け）" });
        links.push({ href: guide("at-reg-input-guide"), label: "AT機の「REG欄」の読み替え" });
    }

    // 重複排除して上から最大6件
    const deduped = [];
    const seen = new Set();
    for (const l of links) {
        if (seen.has(l.href)) continue;
        seen.add(l.href);
        deduped.push(l);
        if (deduped.length >= 6) break;
    }

    const items = deduped
        .map((l) => `                    <li><a href="${l.href}">${l.label}</a></li>`)
        .join("\n");

    return `
            <section class="card lp-section" id="related-guides">
                <h2 class="card-title"><span class="card-icon">&#128214;</span> 関連記事（解説・使い方）</h2>
                <p class="lp-desc">設定推測・天井期待値の見方を補助する解説記事です。</p>
                <ul class="lp-related-list">
${items}
                </ul>
            </section>`;
}

function generatePage(machine, variant) {
    const isAT = machine.type === "AT";
    const hasCeiling = machine.ceiling !== null && machine.ceiling > 0;

    const v = variant || "main";
    const meta = getMachinePageMeta(machine, v);
    const paths = getMachinePagePaths(machine, v);
    const titleKeyword = meta.titleKeyword;
    const pageTitle = `${titleKeyword} | Setting Analyzer Pro`;
    const descKeywords = meta.descKeywords;

    const spec = buildSpecTable(machine);
    const evTableRows = buildEvTable(machine);
    const resetEvTableRows = machine.resetCeiling ? buildEvTable(machine, machine.resetCeiling, machine.resetCeilingTarget) : "";
    const guessElementPath = GUESS_ELEMENT_PAGES[machine.id];
    const editorialRaw = machine.editorial != null ? machine.editorial : EDITORIAL_BY_ID[machine.id];
    const editorialBody = formatEditorialParagraphs(editorialRaw);
    const hasEditorial = editorialBody.length > 0;

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
            { "@type": "ListItem", "position": 2, "name": machine.name, "item": `${SITE_URL}/machines/${machine.id}/` },
            ...(v !== "main"
                ? [{ "@type": "ListItem", "position": 3, "name": titleKeyword, "item": paths.url }]
                : [])
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

    const editorialSection = hasEditorial ? `
            <section class="card lp-section" id="editorial">
                <h2 class="card-title"><span class="card-icon">&#128172;</span> この機種について</h2>
                <div class="lp-editorial-body">
${editorialBody}
                </div>
                <p class="lp-note">※ 本解説は一般的な打ち手の整理であり、公式の仕様説明や設定保証ではありません。ホールの実情・個体差・遊技規則に従ってご利用ください。</p>
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
    if (hasEditorial) tocItems.push(`<li><a href="#editorial">この機種について</a></li>`);
    if (v === "ceiling") {
        if (hasCeiling) tocItems.push(`<li><a href="#ceiling-ev">天井期待値一覧</a></li>`);
        if (hasCeiling && machine.resetCeiling) tocItems.push(`<li><a href="#reset-ceiling-ev">朝一リセット時の天井期待値</a></li>`);
        tocItems.push(`<li><a href="#spec">設定別スペック一覧</a></li>`);
    } else if (v === "setting") {
        tocItems.push(`<li><a href="#spec">設定別スペック一覧</a></li>`);
        if (hasCeiling) tocItems.push(`<li><a href="#ceiling-ev">天井期待値一覧</a></li>`);
    } else if (v === "beginner") {
        tocItems.push(`<li><a href="#tool">設定推測ツールを使う</a></li>`);
        tocItems.push(`<li><a href="#spec">設定別スペック一覧</a></li>`);
        if (hasCeiling) tocItems.push(`<li><a href="#ceiling-ev">天井期待値一覧</a></li>`);
    } else {
        tocItems.push(`<li><a href="#spec">設定別スペック一覧</a></li>`);
        if (hasCeiling) tocItems.push(`<li><a href="#ceiling-ev">天井期待値一覧</a></li>`);
        if (hasCeiling && machine.resetCeiling) tocItems.push(`<li><a href="#reset-ceiling-ev">朝一リセット時の天井期待値</a></li>`);
    }
    tocItems.push(`<li><a href="#tool">設定推測ツールを使う</a></li>`);

    const variantNav = buildVariantNav(machine, v);
    const cautionSection = buildCautionSection(machine);
    const relatedGuidesSection = buildRelatedGuideLinks(machine, v, paths.basePrefix);

    const variantIntro = v === "ceiling"
        ? `<section class="card lp-section"><h2 class="card-title"><span class="card-icon">&#127919;</span> このページでわかること</h2><p class="lp-desc">${escapeHtml(machine.name)}の天井ゲーム数・狙い目・天井期待値を中心にまとめています。</p></section>`
        : v === "setting"
            ? `<section class="card lp-section"><h2 class="card-title"><span class="card-icon">&#127922;</span> このページでわかること</h2><p class="lp-desc">${escapeHtml(machine.name)}の設定差（確率/出玉率）と、設定推測に使う見方を中心にまとめています。</p></section>`
            : v === "beginner"
                ? `<section class="card lp-section"><h2 class="card-title"><span class="card-icon">&#128214;</span> 初心者向けのポイント</h2><p class="lp-desc">データの取り方、結果％の読み方、注意点を短く整理します。まずは「機種名＋現在ゲーム数」だけでも天井期待値が見られます。</p></section>`
                : "";

    const html = `<!DOCTYPE html>
<html lang="ja">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <link rel="icon" type="image/png" sizes="32x32" href="${paths.faviconHref}">
    <link rel="apple-touch-icon" href="${paths.faviconHref}">
    <meta name="google-site-verification" content="notZvvy3fn5NBCAcfut0i4SBJp3iOduLrxj6DJH0j0E" />
    <meta name="description" content="${descKeywords}">
    <meta property="og:title" content="${pageTitle}">
    <meta property="og:description" content="${descKeywords}">
    <meta property="og:type" content="article">
    <meta property="og:url" content="${paths.url}">
    <meta property="og:locale" content="ja_JP">
    <link rel="canonical" href="${paths.url}">
    <title>${pageTitle}</title>
    <link rel="stylesheet" href="${paths.styleHref}">
    <link rel="stylesheet" href="${paths.lpCssHref}">
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
                <p class="app-subtitle"><a href="${paths.topHref}" class="back-link">&larr; トップに戻る</a></p>
                <h1 class="app-title">${machine.name}</h1>
                <p class="app-subtitle">${titleKeyword}</p>
            </div>
        </header>

        <main class="main-content">

            <nav class="lp-breadcrumb" aria-label="パンくずリスト">
                <ol>
                    <li><a href="${paths.topHref}">トップ</a></li>
                    ${v === "main" ? `<li>${machine.name}</li>` : `<li><a href="../">${machine.name}</a></li>\n                    <li>${titleKeyword}</li>`}
                </ol>
            </nav>
${editorialSection}
${cautionSection}
${variantIntro}
${variantNav}
            <nav class="card lp-section">
                <h2 class="card-title"><span class="card-icon">&#128204;</span> 目次</h2>
                <ul class="lp-toc">
                    ${tocItems.join("\n                    ")}
                </ul>
            </nav>

            <section class="card lp-section" id="spec">
                <h2 class="card-title"><span class="card-icon">&#128203;</span> 設定別スペック一覧</h2>
                <p class="lp-desc">${machine.name}（${meta.typeLabel}）の設定別スペック表です。${machine.bigLabel}確率と出玉率に注目して設定判別に活用してください。</p>
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
${relatedGuidesSection}
            <section class="card lp-section" id="tool">
                <h2 class="card-title"><span class="card-icon">&#9889;</span> 設定推測ツールで計算する</h2>
                <p class="lp-desc">${machine.name}のデータを入力して、設定推測と天井期待値を自動計算できます。</p>
                <div class="lp-cta">
                    <a href="${paths.topHref}" class="btn-primary lp-btn">設定推測ツールを開く</a>
                </div>
            </section>

            <div class="lp-back-bottom">
                <a href="${paths.topHref}" class="btn-primary lp-back-btn">
                    <span class="btn-icon">&#9664;</span>
                    トップに戻る
                </a>
            </div>

        </main>

        <footer class="app-footer">
            <div class="footer-links">
                <a href="${paths.basePrefix}privacy.html">プライバシーポリシー</a>
                <a href="${paths.basePrefix}terms.html">利用規約</a>
                <a href="${paths.basePrefix}contact.html">お問い合わせ</a>
                <a href="${paths.basePrefix}about.html">アプリについて</a>
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

const missingEditorial = MACHINES.filter((m) => {
    const raw = m.editorial != null ? m.editorial : EDITORIAL_BY_ID[m.id];
    return !raw || !String(raw).trim();
});
if (missingEditorial.length) {
    console.error("EDITORIAL_BY_ID（または machine.editorial）が未設定の機種:", missingEditorial.map((m) => m.id).join(", "));
    process.exit(1);
}

MACHINES.forEach(m => {
    const dir = path.join(machinesDir, m.id);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

    const html = generatePage(m, "main");
    fs.writeFileSync(path.join(dir, "index.html"), html, "utf-8");
    console.log(`Created: machines/${m.id}/index.html`);

    sitemapUrls.push(`  <url>\n    <loc>${SITE_URL}/machines/${m.id}/</loc>\n    <lastmod>${new Date().toISOString().slice(0,10)}</lastmod>\n    <priority>0.8</priority>\n  </url>`);

    // intent variants (ロングテール入口)
    ["ceiling", "setting", "beginner"].forEach((v) => {
        const vDir = path.join(dir, v);
        if (!fs.existsSync(vDir)) fs.mkdirSync(vDir, { recursive: true });
        const vHtml = generatePage(m, v);
        fs.writeFileSync(path.join(vDir, "index.html"), vHtml, "utf-8");
        console.log(`Created: machines/${m.id}/${v}/index.html`);
        sitemapUrls.push(`  <url>\n    <loc>${SITE_URL}/machines/${m.id}/${v}/</loc>\n    <lastmod>${new Date().toISOString().slice(0,10)}</lastmod>\n    <priority>0.75</priority>\n  </url>`);
    });
});

// setGuessElement pages
Object.values(GUESS_ELEMENT_PAGES).forEach(p => {
    sitemapUrls.push(`  <url>\n    <loc>${SITE_URL}/${p.replace("index.html","")}</loc>\n    <lastmod>${new Date().toISOString().slice(0,10)}</lastmod>\n    <priority>0.6</priority>\n  </url>`);
});

// guide/ 解説記事
const guideDir = path.join(__dirname, "guide");
if (fs.existsSync(guideDir)) {
    const today = new Date().toISOString().slice(0, 10);
    fs.readdirSync(guideDir)
        .filter((f) => f.endsWith(".html"))
        .sort()
        .forEach((f) => {
            sitemapUrls.push(`  <url>\n    <loc>${SITE_URL}/guide/${f}</loc>\n    <lastmod>${today}</lastmod>\n    <priority>0.7</priority>\n  </url>`);
        });
}

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
