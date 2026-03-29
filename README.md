# Setting Analyzer Pro（パチスロ設定推測・期待値計算ツール）

パチスロ・スマスロの**設定推測**（ベイズ推定）と**天井期待値**をブラウザで計算できる静的サイトです。  
機種データは `app.js` に保持し、解説記事・機種別ランディングページは Node スクリプトで HTML を生成します。

---

## 目次

- [主な機能](#主な機能)
- [技術スタック](#技術スタック)
- [ディレクトリ構成](#ディレクトリ構成)
- [ローカルでの確認](#ローカルでの確認)
- [コミット後の自動 `git push`（任意）](#コミット後の自動-git-push任意)
- [デプロイ（Vercel）](#デプロイvercel)
- [ビルドスクリプト](#ビルドスクリプト)
- [解説記事の追加](#解説記事の追加パターンb)
- [機種別ランディングページの再生成](#機種別ランディングページの再生成)
- [お問い合わせ（Formspree）](#お問い合わせformspree)
- [Google AdSense / ads.txt](#google-adsense--adstxt)
- [ファビコン](#ファビコン)
- [SEO（sitemap / robots）](#seositemap--robots)
- [収録機種について](#収録機種について)
- [AT / ART機（スマスロ）](#at--art機スマスロ)
- [Aタイプ](#aタイプ)
- [免責](#免責)

---

## 主な機能

| 機能 | 説明 |
|------|------|
| **設定推測** | 総ゲーム数・BIG/REG（機種によりラベル変更）・任意で小役回数から、各設定の推定確率（％）を算出 |
| **天井期待値** | 現在ゲーム数から天井到達までの期待値・狙い目ゲーム数。機種により**通常時／朝一リセット時**を表示 |
| **機種スペック表** | 選択機種の設定別スペックを一覧表示 |
| **設定推測要素ページ** | `setGuessElement/` 配下に機種別の判別要素（外部画像リンク含む） |
| **解説記事** | `guide/` に設定・天井・ツールの使い方などの記事（テンプレート＋本文で生成） |

- **天井のみ**：機種名と現在ゲーム数だけ入力して「推測する」でも、天井期待値ブロックのみ表示可能。

---

## 技術スタック

- **フロント**: HTML / CSS / JavaScript（`index.html` + `app.js` + `style.css`）
- **計算**: ベイズ推定（対数尤度 + Log-Sum-Exp で数値安定化）
- **ホスティング想定**: 静的ファイルのまま配信（サーバー不要）
- **ビルド**: Node.js（記事生成・機種LP生成のみ）

---

## ディレクトリ構成

```
winSlot/
├── index.html              # メインアプリ
├── app.js                  # 機種データ・推測・UI
├── style.css
├── favicon.png             # サイトアイコン
├── ads.txt                 # AdSense 用（公開ルートに配置）
├── robots.txt
├── sitemap.xml             # 生成スクリプト実行時に更新される場合あり
├── vercel.json             # Vercel ルーティング例
│
├── guide/                  # 解説記事（build-articles.js の出力）
├── machines/               # 機種別LP（generate-landing-pages.js の出力）
├── setGuessElement/        # 設定推測要素ページ（手動メンテ）
│
├── templates/
│   └── article-layout.html # 解説記事の共通レイアウト
├── articles/
│   ├── manifest.json       # 記事メタデータ
│   └── *.html              # 記事本文断片
│
├── build-articles.js       # guide/ を生成
├── generate-landing-pages.js  # machines/ と sitemap 更新
├── patch-setguess-seo.js # setGuessElement の meta / 機種LP 導線を一括更新
├── .githooks/              # Git フック（post-commit で自動 push 用・任意）
└── scripts/
    └── add-favicon-setguess.js  # setGuessElement に favicon 挿入（任意）
```

---

## ローカルでの確認

1. リポジトリをクローンまたは展開する  
2. **`index.html` をブラウザで開く**（または Live Server / `npx serve .` などでルートを配信）

> `file://` でもメインアプリは動きます。相対パスで `guide/` 等へ遷移する場合は、ルートをドキュメントルートにしたローカルサーバの方が安全です。

### 使い方（アプリ）

1. 機種名を入力または候補から選択  
2. 総ゲーム数・BIG/REG 等を入力（天井のみなら現在ゲーム数のみでも可）  
3. **推測する** を押す  

---

## コミット後の自動 `git push`（任意）

**ファイルを保存しただけでは GitHub に送られません。**  
Git は「コミット」された変更だけを push できます。このリポジトリでは、**コミットが終わった直後に `git push` する** Git フックを用意しています（Vercel は従来どおり **GitHub への push をトリガー**にデプロイ）。

### 注意

- **ローカルでのみ有効**です。`core.hooksPath` は各クローンごとに1回設定が必要です。
- **すべてのコミットのあと**に push が走ります。まとめてコミットしたくない場合は `git commit --no-verify` でフックをスキップできます。
- **upstream（`git push -u`）が未設定**のブランチでは push をスキップし、メッセージを出します。初回だけ手動で `git push -u origin <ブランチ名>` してください。

### 有効化（リポジトリのルートで1回）

```bash
git config core.hooksPath .githooks
```

**macOS / Linux** ではフックに実行権限が必要なことがあります。

```bash
chmod +x .githooks/post-commit
```

**Windows（Git for Windows）** では通常、そのままで動きます。

### 無効に戻す

```bash
git config --unset core.hooksPath
```

（デフォルトの `.git/hooks` に戻ります。）

### フックの中身

- `.githooks/post-commit` … 追跡ブランチがあるときだけ `git push` を実行

---

## デプロイ（Vercel）

- プロジェクト**ルート**をそのままデプロイしてください（`index.html` がトップに来る構成）。  
- `vercel.json` では `/` → `/index.html` の例を入れています。  
- 本番ドメイン（例: `pachislot-setting.com`）に合わせて、`index.html` の `canonical` / `og:url`、各ページの絶対URL、`contact.html` の Formspree `_next`、**Search Console の所有権確認**などを揃えてください。

---

## ビルドスクリプト

| コマンド | 内容 |
|----------|------|
| `node build-articles.js` | `templates/article-layout.html` + `articles/*` から `guide/*.html` と `guide/index.html` を生成 |
| `node generate-landing-pages.js` | `app.js` と同系の機種データから `machines/*/index.html` を再生成し、`sitemap.xml` を更新 |
| `node patch-setguess-seo.js` | `setGuessElement/*/index.html` に meta description と機種LP（`machines/{id}/`）へのリンクを一括反映（`generate-landing-pages.js` の `GUESS_ELEMENT_PAGES` と機種名と同期すること） |

**記事や機種LPを編集したあと**、該当スクリプトを再実行すると HTML が上書きされます。`setGuessElement/` の SEO 用メタ・LP 導線は `patch-setguess-seo.js`、それ以外の本文は手編集です。

---

## 解説記事の追加（パターンB）

レイアウト1本（`templates/article-layout.html`）＋本文だけ別ファイルで管理しています。

### 手順

1. **`articles/manifest.json`** に1件追加（`slug` は英数字とハイフンのみ推奨）

   ```json
   {
     "slug": "my-article",
     "title": "記事タイトル",
     "description": "meta description 用の説明文"
   }
   ```

2. **`articles/{slug}.html`** を新規作成（`<!DOCTYPE>` 不要）。既存記事と同様に次の骨子で:

   ```html
   <section class="card page-card">
       <h1 class="page-title">記事タイトル</h1>
       <div class="page-body">
           <p>リード文</p>
           <h2>見出し</h2>
           <p>本文…</p>
       </div>
   </section>
   ```

3. ルートで実行:

   ```bash
   node build-articles.js
   ```

4. トップの **解説・使い方** セクション（`index.html`）にリンクを足す場合は手動で `guide/{slug}.html` を追加。`sitemap.xml` にも URL を追加すると SEO 的に望ましいです。

### レイアウトだけ変更したいとき

`templates/article-layout.html` を編集後、再度 `node build-articles.js` で全記事に反映されます。

---

## 機種別ランディングページの再生成

- 機種データや LP テンプレートを `generate-landing-pages.js` 側で変更したら:

  ```bash
  node generate-landing-pages.js
  ```

- 出力は `machines/{machine_id}/index.html`。**既存ファイルは上書き**されます。

---

## お問い合わせ（Formspree）

[Formspree](https://formspree.io) でフォーム送信を受け付けています。

1. Formspree でフォームを作成し、**Form ID**（`https://formspree.io/f/` の後ろ）を取得  
2. `contact.html` の `<form action="https://formspree.io/f/...">` をその ID に合わせる  
3. 本番URL用に hidden の `_next` を `https://あなたのドメイン/contact-thankyou.html` などに変更  

スパム対策用に `_gotcha`（ハニーポット）を入れています。

---

## Google AdSense / ads.txt

- 各ページ `<head>` に AdSense スクリプトを埋め込んでいます（クライアントIDはご自身のものに差し替え可能）。  
- **`ads.txt`** をサイト**ルート**に置き、クローラが `https://ドメイン/ads.txt` で取得できるようにしてください（Vercel ならリポジトリ直下でOK）。

---

## ファビコン

- ルートに `favicon.png` を配置。  
- `index.html`・静的ページ・`templates/article-layout.html`・`generate-landing-pages.js` 生成の `machines/*` から参照。  
- `setGuessElement` を新規追加したとき、未反映なら必要に応じて:

  ```bash
  node scripts/add-favicon-setguess.js
  ```

---

## SEO（sitemap / robots）

- **`sitemap.xml`**: URL 一覧。`generate-landing-pages.js` 実行で更新される部分があります。新ドメインへ移行した場合は `loc` を本番ドメインに統一してください。  
- **`robots.txt`**: `Sitemap:` の URL も本番に合わせることを推奨します。

---

## 収録機種について

- **Aタイプ**（ジャグラー系・ディスクアップ・うみねこ2・秘宝系・エヴァBT など）と **AT/ART（スマスロ）** を収録。  
- 収録数・スペックの**正本は `app.js` 内の `MACHINES` 配列**。下記リストはメンテ用の目次です（機種追加時は **ここ・`index.html` の対応機種一覧・`generate-landing-pages.js`** を揃えて更新してください）。  
- 機種追加時は `app.js` と `generate-landing-pages.js` のデータを同期し、`node generate-landing-pages.js` を実行。必要なら `setGuessElement/` と `index.html` のリンクも追加します。

### AT / ART機（スマスロ）

| ID | 機種名 |
|----|--------|
| `kabaneri` | 甲鉄城のカバネリ |
| `kabaneri_unato` | スマスロ 甲鉄城のカバネリ 海門決戦 |
| `banchou4` | 押忍！番長4 |
| `hokuto` | スマスロ北斗の拳 |
| `karakuri` | からくりサーカス |
| `valvrave` | 革命機ヴァルヴレイヴ |
| `monkey_turn_v` | モンキーターンV |
| `tokyo_ghoul` | L 東京喰種 |
| `kaguya_sama` | かぐや様は告らせたい |
| `god_eater` | ゴッドイーター リザレクション |
| `bakemonogatari` | スマスロ 化物語 |
| `hokuto_tensei2` | 北斗の拳 転生の章2 |
| `koukaku` | スマスロ 攻殻機動隊 |
| `dmc5` | デビル メイ クライ 5 |
| `hihouden` | スマスロ 秘宝伝 |
| `tenken` | 転生したら剣でした |
| `valvrave2` | L革命機ヴァルヴレイヴ2 |
| `enen` | 炎炎ノ消防隊 |
| `tekken6` | スマスロ 鉄拳6 |
| `prism_nana` | プリズムナナ |
| `azurlane` | L アズールレーン THE ANIMATION |
| `zettai4` | L 絶対衝激IV |
| `railgun2` | スマスロ とある科学の超電磁砲2 |
| `onimusha3` | スマスロ 新鬼武者3 |
| `zenigata5` | L主役は銭形5 |
| `tokyo_revengers` | スマスロ 東京リベンジャーズ |
| `iza_banchou` | いざ！番長 |
| `monhan_rise` | スマスロ モンスターハンターライズ |
| `enen2` | Lパチスロ 炎炎ノ消防隊2 |
| `magireco` | スマスロ マギアレコード 魔法少女まどか☆マギカ外伝 |
| `okidoki_duo` | スマスロ 沖ドキ！DUO アンコール |
| `mushoku` | L 無職転生 ～異世界行ったら本気だす～ |
| `sbj` | スマスロスーパーブラックジャック |
| `yoshimune` | 吉宗 |
| `goblin_slayer2` | スマスロ ゴブリンスレイヤーⅡ |
| `otome4` | L戦国乙女4 戦乱に閃く炯眼の軍師 |
| `toloveru` | L ToLOVEるダークネス |
| `baki` | Ｌ範馬刃牙 |
| `biohazard5` | スマスロ バイオハザード5 |
| `revuestarlight` | L少女☆歌劇 レヴュースタァライト -The SLOT- |

### Aタイプ

| ID | 機種名 |
|----|--------|
| `aim_juggler_ex` | アイムジャグラーEX |
| `my_juggler_v` | マイジャグラーV |
| `funky_juggler_2` | ファンキージャグラー2 |
| `gogo_juggler_3` | ゴーゴージャグラー3 |
| `ultra_miracle_juggler` | ウルトラミラクルジャグラー |
| `discup_ultraremix` | A-SLOT+ ディスクアップ ULTRAREMIX |
| `smaslo_hanabi` | スマスロ ハナビ |
| `thunder_v` | スマスロ サンダーV |
| `umineko2` | うみねこのなく頃に2 |
| `crea_hihouden` | クレアの秘宝伝 BT |
| `eva_bt` | エヴァンゲリオン 約束の扉 |

LP のパスは `machines/{ID}/index.html` です。

---

## 免責

本ツールの推測結果・期待値は**参考用**であり、実際の設定や収支を保証するものではありません。パチスロは法令とホールのルールを守り、**楽しめる範囲**でご利用ください。

---

## ライセンス

未指定の場合はリポジトリ管理者の方針に従ってください。公開用リポジトリなら `LICENSE` ファイルの追加を推奨します。
