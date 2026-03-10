# パチスロ設定推測ツール - Setting Analyzer Pro

パチスロの設定推測と天井期待値を算出できるWebアプリケーションです。

## 機能

- **設定推測**: BIG/REG回数・小役回数からベイズ推定で各設定の確率を算出
- **推測要素表示**: BIG確率・REG確率・合算確率と設定相当の判定
- **天井期待値計算**: 現在ゲーム数から天井までの期待値を算出
- **機種スペック表**: 選択した機種の全設定スペックを一覧表示

## 収録機種（36機種）

### Aタイプ / BT機
- アイムジャグラーEX
- マイジャグラーV
- ファンキージャグラー2
- ゴーゴージャグラー3
- ウルトラミラクルジャグラー
- ディスクアップ ULTRAREMIX

### AT / ART機（スマスロ）
- 甲鉄城のカバネリ
- 押忍！番長4
- スマスロ北斗の拳
- からくりサーカス
- ヴァルヴレイヴ
- モンキーターンV

### 2025〜2026年 新台
- L東京喰種
- かぐや様は告らせたい
- ゴッドイーター リザレクション
- スマスロ化物語
- 北斗の拳 転生の章2
- うみねこのなく頃に2
- 攻殻機動隊
- デビルメイクライ5
- クレアの秘宝伝 BT
- 秘宝伝
- 転生したら剣でした
- エヴァンゲリオン 約束の扉
- ヴァルヴレイヴ2
- 炎炎ノ消防隊
- 鉄拳6
- プリズムナナ
- アズールレーン
- 絶対衝激IV
- とある科学の超電磁砲2
- 新鬼武者3
- 主役は銭形5
- 東京リベンジャーズ
- いざ！番長
- モンスターハンターライズ

## 使い方

1. `index.html` をブラウザで開く
2. 機種をドロップダウンから選択
3. 総ゲーム数・BIG回数・REG回数を入力
4. 必要に応じて現在ゲーム数や小役回数を入力
5. 「推測する」ボタンを押す

## 技術仕様

- HTML / CSS / JavaScript のみで動作（サーバー不要）
- ベイズ推定（対数尤度 + Log-Sum-Exp）で数値安定性を確保
- モバイルレスポンシブ対応

## 解説記事（ガイド）の追加（パターンB: レイアウト + 本文）

解説記事は「レイアウト1本 + 本文だけ別ファイル」で管理しています。

### フォルダ構成

- `templates/article-layout.html` … 共通レイアウト（ヘッダー・フッター・CSS）。変更すると全記事に反映されます。
- `articles/manifest.json` … 記事一覧（slug・タイトル・説明文）。
- `articles/{slug}.html` … 本文のみのHTML断片（`<section class="card page-card">` 〜 `</section>` の中身を書く）。
- `guide/` … ビルド後の出力先。ここに `guide/{slug}.html` が生成されます。

### 記事を1本追加する手順

1. **manifest.json に1件追加**

   `articles/manifest.json` の配列に、次の形式で1要素追加します。

   ```json
   {
     "slug": "記事のURL名（英数字とハイフンのみ）",
     "title": "記事タイトル（そのまま&lt;title&gt;とh1に使います）",
     "description": "記事の説明（meta description に使います）"
   }
   ```

2. **本文ファイルを作成**

   `articles/{slug}.html` を新規作成します。中身は **本文だけ** のHTMLです（`<!DOCTYPE>` や `<head>` は不要）。例:

   ```html
   <section class="card page-card">
       <h1 class="page-title">記事のタイトル</h1>
       <div class="page-body">
           <p>リード文。</p>
           <h2>大見出し</h2>
           <p>本文…</p>
           <h2>もうひとつの見出し</h2>
           <p>本文…</p>
       </div>
   </section>
   ```

   - 見出しは `h2` / `h3`、本文は `p` で区切ると読みやすくなります。
   - クラスは `page-card` / `page-title` / `page-body` のままにすると、既存のスタイルがそのまま効きます。

3. **ビルドを実行**

   ```bash
   node build-articles.js
   ```

   実行後、`guide/{slug}.html` が更新または新規作成されます。ブラウザで `guide/{slug}.html` を開いて表示を確認してください。

### レイアウトだけ変えたいとき

`templates/article-layout.html` を編集し、再度 `node build-articles.js` を実行すると、全記事に反映されます。本文ファイル（`articles/*.html`）は触らずに済みます。

---

## お問い合わせフォーム（Formspree）

お問い合わせページは [Formspree](https://formspree.io) で送信を受け付けています。利用するには以下を実施してください。

1. [Formspree](https://formspree.io) に無料登録する
2. 新しいフォームを作成し、表示される **Form ID**（`https://formspree.io/f/` の後ろの文字列）をコピーする
3. `contact.html` を開き、フォームの `action` 属性内の `your-form-id` を、コピーした Form ID に置き換える

```html
<!-- 変更前 -->
action="https://formspree.io/f/your-form-id"

<!-- 変更後（例） -->
action="https://formspree.io/f/abc123xyz"
```

送信後は `contact-thankyou.html` へリダイレクトされます。本番ドメインで利用する場合は、`_next` の hidden の値を本番URL（例: `https://あなたのドメイン.com/contact-thankyou.html`）に変更してください。
