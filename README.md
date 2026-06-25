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
- [Cursor Skills（エージェント）](#cursor-skillsエージェント)

---

## 主な機能

| 機能 | 説明 |
|------|------|
| **設定推測** | 総ゲーム数・BIG/REG（機種によりラベル変更）から、各設定の推定確率（％）を算出 |
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

**ビルド方式**: ソース（`index.html`・`app.js`・`articles/`・`templates/`・`data/machines/`）を git 管理し、`node scripts/build.js` が **`dist/` に全ページを生成**します。Vercel はこの `dist/` を配信します。`guide/`・`machines/*/index.html`・`setGuessElement/index.html`・`sitemap.xml`・`machines-data.js` は**生成物のため git 管理外**（`.gitignore` 済み）です。

**機種データの正本は `data/machines/*.json`（1機種1ファイル）**です。以前は `app.js` と LP生成側に同じ配列が二重に存在していましたが、JSON に一本化しました。ビルドが `dist/machines-data.js`（`window.MACHINES`）を生成し、`index.html` が `app.js` より前に読み込みます。

```
winSlot/
├── index.html              # メインアプリ（machines-data.js → app.js の順で読み込む）
├── app.js                  # 推測・UI ロジックのみ（MACHINES は window から取得）
├── style.css
├── 404.html                # Vercel が未存在URLに配信（noindex）
├── favicon.png             # サイトアイコン
├── og-default.png          # OGP / Twitter カード用（トップ）
├── ads.txt                 # AdSense 用（公開ルートに配置）
├── robots.txt
├── vercel.json             # buildCommand / outputDirectory / リダイレクト
│
├── data/
│   └── machines/           # ★ 機種データの正本（1機種1 JSON）
│       ├── index.json      #   表示順を保った id の配列
│       └── {id}.json       #   スペック・天井・cautions・guessElementPath
│
├── setGuessElement/        # 設定推測要素ページ（*/index.html は手動メンテのソース）
│                           #   ※ ルートの index.html はビルド生成（git 管理外）
├── templates/
│   └── article-layout.html # 解説記事の共通レイアウト
├── articles/
│   ├── manifest.json       # 記事メタデータ
│   └── *.html              # 記事本文断片
│
├── scripts/
│   ├── build.js            # ★ ビルド統括（dist/ に全ページ生成 + machines-data.js）
│   └── build/
│       ├── machines.js       # data/machines/ のローダ（唯一の正本読み込み）
│       ├── articles.js       # guide/ を生成
│       ├── landing-pages.js  # machines/・setGuessElement/index・sitemap.xml を生成
│       └── setguess-seo.js   # setGuessElement の meta / 機種LP 導線を付与
│
├── dist/                   # ビルド出力（git 管理外。Vercel が配信）
├── .githooks/              # Git フック（post-commit で自動 push 用・任意）
└── .cursor/
    └── skills/             # Cursor Agent Skills（リポジトリ単位・任意）
```

---

## Cursor Skills（エージェント）

このリポジトリ用の [Cursor Agent Skills](https://cursor.com/docs/skills) を `.cursor/skills/` に置いています（**プロジェクト限定**。他リポジトリには自動では効きません）。

| Skill | 用途 |
|-------|------|
| `japanese-concise` | 日本語で簡潔に答える方針 |
| `post-implementation-security` | 実装後の静的サイト向けセキュリティチェックリスト |

チャットで `/japanese-concise` など Skill 名を指定して使えます（Cursor のバージョンにより UI が異なる場合があります）。

---

## ローカルでの確認

1. リポジトリをクローンまたは展開する  
2. `node scripts/build.js` を実行して `dist/` を生成する  
3. **`npm run preview`**（= `npx serve dist`）で `dist/` を配信し、ブラウザで開く

> メインアプリ単体は `index.html` を直接開いても動きますが、`guide/` や `machines/{id}/` への遷移を含めて本番同様に確認するには、ビルド後の `dist/` をローカルサーバで配信してください。

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

- Vercel は `vercel.json` の **`buildCommand`（`node scripts/build.js`）を実行**し、**`outputDirectory`（`dist/`）を配信**します。GitHub への push がトリガーです。生成物は git に含めません。  
- `vercel.json` では `/articles/:slug` → `/guide/:slug`、および旧機種LPパス（`/machines/:id/ceiling`・`setting`・`beginner` など）→ `/machines/:id/` の **301 リダイレクト**を定義しています（`trailingSlash: true` に合わせ、末尾スラッシュあり／なしの両方をカバー）。  
- 未存在URLには `dist/404.html`（`noindex`）が **HTTP 404** で返ります（以前の「全URLに index.html を 200 で返す catch-all rewrite」はソフト404の原因になるため廃止）。  
- **`vercel.json` のリダイレクト定義**は `node scripts/verify-vercel-machine-redirects.js` で確認できます（デプロイ前のチェックに利用）。  
- **デプロイ直後（本番）**: Search Console の **URL 検査**で旧パス（例: `/machines/hokuto/ceiling/`）が正規の `machines/{id}/` へリダイレクトされることを確認し、必要なら **インデックス登録をリクエスト**。**サイトマップ**から `sitemap.xml` の再送信も推奨。数週間後に **ページ** レポートでインデックスの推移を確認する（即時には完了しない運用タスク）。  
- 本番ドメイン（例: `pachislot-setting.com`）に合わせて、`index.html` の `canonical` / `og:url`、各ページの絶対URL、`contact.html` の Formspree `_next`、**Search Console の所有権確認**などを揃えてください。

---

## ビルドスクリプト

`node scripts/build.js`（= `npm run build`）が**唯一のビルド入口**です。`dist/` を空にして静的ファイルをコピーし、以下のモジュールを順に呼んで全ページを生成します。Vercel もこのコマンドを実行します。

| モジュール | 内容 |
|----------|------|
| `scripts/build/machines.js` | `data/machines/index.json` + `{id}.json` を読み、`MACHINES`・`GUESS_ELEMENT_PAGES`・`CAUTIONS_BY_ID` を返すローダ（機種データの唯一の読み込み口） |
| `scripts/build/articles.js` | `templates/article-layout.html` + `articles/*` から `dist/guide/*.html` と `dist/guide/index.html` を生成 |
| `scripts/build/landing-pages.js` | 機種データから `dist/machines/*/index.html`・`dist/setGuessElement/index.html` を生成し、`dist/sitemap.xml` を出力 |
| `scripts/build/setguess-seo.js` | `dist/setGuessElement/*/index.html`（コピー済み）に meta / OG / パンくず / 機種LP導線を付与。**既存の手書き description は上書きしない** |

`build.js` は機種データを1回だけロードして各モジュールに渡し、ブラウザ用の `dist/machines-data.js`（`window.MACHINES`）も生成します。

> ソースを編集したら `node scripts/build.js` を一度実行して `dist/` を確認すれば、本番と同じ出力になります。`dist/` は git 管理外なのでコミット対象は**ソースのみ**です。

その他の運用スクリプト（ビルドとは独立。手元で実行）:

| コマンド | 内容 |
|----------|------|
| `node scripts/gsc-analyze.js data/gsc.csv` | Search Console のCSV/TSV（検索パフォーマンス）を解析し、CTR低/順位11〜20の改善候補を `reports/gsc-actions.md` に出力 |
| `node scripts/update-access-ranking-from-gsc.js data/gsc.csv` | GSC エクスポートからクリック数上位5件を `data/access-ranking.json` に更新（トップのアクセスランキング表示用） |
| `node scripts/verify-vercel-machine-redirects.js` | `vercel.json` の 301 定義が揃っているか検証 |

---

## 解説記事の追加（パターンB）

レイアウト1本（`templates/article-layout.html`）＋本文だけ別ファイルで管理しています。

### 手順

1. **`articles/manifest.json`** に1件追加（`slug` は英数字とハイフンのみ推奨）。**`author`**（省略時は `slotterY`）・**`published`**（`YYYY-MM-DD`）を入れると、記事ページの **h1 直下**・**JSON-LD**・**一覧**に反映されます。追記更新時は **`updated`** も利用可能です。

   ```json
   {
     "slug": "my-article",
     "title": "記事タイトル",
     "description": "meta description 用の説明文",
     "author": "slotterY",
     "published": "2026-04-02"
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
   node scripts/build.js
   ```

   `dist/guide/{slug}.html` が生成され、`dist/sitemap.xml` にも自動で列挙されます。トップの **解説・使い方** セクション（`index.html`）にリンクを足す場合は手動で追加してください。

### レイアウトだけ変更したいとき

`templates/article-layout.html` を編集後、再度 `node scripts/build.js` で全記事に反映されます。

---

## 機種の追加・編集

機種データの正本は **`data/machines/{id}.json`**（1機種1ファイル）です。`app.js` にも LP生成側にもデータを書く必要はありません。

### 追加手順

1. `data/machines/{id}.json` を作成する（既存ファイルをコピーして値を変更するのが楽）。設定スペック・天井・`avgBonusReward`・`normalCostPerGame`・`addedDate` のほか、設定推測要素ページがあれば `guessElementPath`、注意点があれば `cautions`（最大3件表示）を入れる。  
2. `data/machines/index.json` の配列に **`id` を1行追加**する（この配列の順序が一覧・サイトマップの表示順になる）。  
3. `node scripts/build.js` を実行 → `dist/machines/{id}/index.html`・`dist/machines-data.js`・`dist/sitemap.xml` が更新される。  
4. トップの **`index.html`** の「対応機種一覧」（静的 `<ul>`）にも `<li><a href="machines/{id}/">…</a></li>` を追加する。  
5. 設定推測要素ページを置く場合は `setGuessElement/{dir}/index.html` を作成し、JSON の `guessElementPath` をそのパスに合わせる。

### 仕組み

- `scripts/build/machines.js` が `data/machines/` を読み、`MACHINES`（LP生成・サイトマップ用）と `window.MACHINES`（ブラウザ用 `dist/machines-data.js`）の両方を供給します。  
- 旧構成の `/machines/{id}/ceiling/` 等へのリンクは、本番の `vercel.json` で同一の `machines/{id}/` に 301 されます（ページ内 `#lp-ceiling` 等へは手動でスクロール）。

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
- `index.html`・静的ページ・`templates/article-layout.html`・ビルド生成の `machines/*` から参照。  
- `setGuessElement` を新規追加したとき、未反映なら必要に応じて:

  ```bash
  node scripts/add-favicon-setguess.js
  ```

---

## SEO（sitemap / robots）

- **`sitemap.xml`**: `dist/sitemap.xml` としてビルド時に生成されます。新ドメインへ移行した場合は生成元（`scripts/build/landing-pages.js` の `SITE_URL`）を本番ドメインに統一してください。  
- **`robots.txt`**: `Sitemap:` の URL も本番に合わせることを推奨します。  
- **`og-default.png`**: トップの SNS シェア用（`og:image` / `twitter:image`）。差し替える場合は 1200×630 前後の PNG を推奨します。

### Lighthouse（パフォーマンスの目安）

初回描画まわりの改善として、トップでは **Google Fonts のウェイトを 900 除外**（見出しは 700 に統一）、**AdSense スクリプトを `</body>` 直前**へ移しています。さらに詰める場合は次で計測します。

1. ビルドして別ターミナルで静的配信（例）: `node scripts/build.js && npx serve dist -p 8080`  
2. 計測: `npx lighthouse http://127.0.0.1:8080/ --only-categories=performance --view`  
3. レポートの **LCP 要素** と **CLS** を確認し、フォント読み込み・広告枠のレイアウトシフトなどを順に潰す

### Search Console（GSC）改善ループ（運用）

#### ベースライン記録（改善の起点）

定期的（例: 月1回または施策前後）に次を記録しておくと、施策の効果測定がしやすいです。

1. Search Console → **検索パフォーマンス** → 期間を「過去3ヶ月」などに設定  
2. **ページ** フィルタで `https://www.pachislot-setting.com/`（トップ）を選択し、**総クリック数・総表示回数・平均CTR・平均掲載順位**をメモまたはスプレッドシートに保存  
3. 同様に主要機種LP（例: `/machines/hokuto/`、`/machines/kabaneri/`）をそれぞれフィルタして同じ4指標を記録  
4. **クエリ** タブで、トップと主要LPそれぞれ **上位20クエリ**（クリック数または表示回数順）をエクスポートまたはスクリーンショットで残す  

以降の改善（メタ・導線・速度）は、このベースラインとの差分で評価します。

#### CSV からの自動解析

1. Search Console → **検索パフォーマンス** から CSV/TSV をエクスポート（クエリ×ページ推奨）  
2. `data/gsc.csv`（または任意のパス）に置く  
3. 解析:

```bash
node scripts/gsc-analyze.js data/gsc.csv
```

4. 出力された `reports/gsc-actions.md` の上位から、title/description・見出し・内部リンクなどを改善していく  

※ `data/gsc*.csv` は `.gitignore` しています（個人データ・運用データなのでコミットしない想定）。

#### 新機種追加時のチェックリスト（SEO・整合性）

`data/machines/{id}.json` を追加し `index.json` に id を足したあと、次を忘れずに行う（詳細は「機種の追加・編集」を参照）。

1. **`node scripts/build.js`** を実行する（`dist/machines/{id}/` の LP と **`dist/sitemap.xml`** の URL・`lastmod`、`dist/machines-data.js` が更新される）  
2. トップの **`index.html`** の「対応機種一覧」の該当 `<details>` 内の `<ul>` に `<li><a href="machines/{id}/">…</a></li>` を追加する  
3. 設定推測要素ページを持つ機種は、JSON に **`guessElementPath`**（例: `setGuessElement/fooBar/index.html`）を設定する  
4. デプロイ後、Search Console の **サイトマップ** から `sitemap.xml` を再送信する（任意だが推奨）  
5. 数週間後に GSC で新 URL の **表示・クリック** が付き始めているか確認する

---

## 収録機種について

- **Aタイプ**（ジャグラー系・ディスクアップ・うみねこ2・秘宝系・エヴァBT など）と **AT/ART（スマスロ）** を収録。  
- 収録数・スペックの**正本は `data/machines/*.json`**（`app.js` とLP生成側で同じ配列を二重管理していた構成から一本化済み）。下記リストはメンテ用の目次です。  
- 機種追加は「機種の追加・編集」の手順どおり JSON を1ファイル足して `node scripts/build.js`。必要なら `setGuessElement/` と `index.html` のリンクも追加します。

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
| `eureka_seven_art` | 交響詩篇エウレカセブン HI-EVOLUTION ZERO TYPE-ART |
| `shake_bt` | スマスロ シェイク ボーナストリガー |
| `harem_ace_bt` | 翔べ！ハーレムエース |
| `alex_bt` | スマスロ アレックスブライト |
| `bofuri` | スマスロ痛いのは嫌なので防御力に極振りしたいと思います。 |
| `nanatsu_maken` | L七つの魔剣が支配する |
| `granbelm` | 回胴式遊技機 グランベルム |
| `revuestarlight` | L少女☆歌劇 レヴュースタァライト -The SLOT- |
| `kyokou_suiritr` | L 虚構推理 |
| `jormungand` | スマスロ ヨルムンガンド |
| `akudama_drive` | L アクダマドライブ |
| `shinuchi_yoshimune` | 真打 吉宗 |
| `gundam_unicorn_kakusei_drive` | Lパチスロ 機動戦士ガンダムユニコーン 覚醒DRIVE |
| `million_god_kiseki` | スマスロ ミリオンゴッド-神々の軌跡- |
| `animal_slot_dotch` | アニマルスロット ドッチ |
| `biohazard_re3` | スマスロ バイオハザードRE:3 |
| `big_dream_golden_pusher` | スマスロ ビッグドリーム THE GOLDEN PUSHER |
| `super_rio_ace2` | スマスロスーパーリオエース2 |
| `takt_op_destiny` | Lタクトオーパス デスティニー |
| `lb_slot_galfy` | LBスロットGALFY |
| `dark_hibi` | スマート沖スロ ダークハイビ |

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
| `isekai_quartet_bt` | A-SLOT+ 異世界かるてっと BT |
| `lb_triple_crown_seven` | LB トリプルクラウンセブン |

LP のパスは `machines/{ID}/index.html` です。

---

## 免責

本ツールの推測結果・期待値は**参考用**であり、実際の設定や収支を保証するものではありません。パチスロは法令とホールのルールを守り、**楽しめる範囲**でご利用ください。

---

## ライセンス

未指定の場合はリポジトリ管理者の方針に従ってください。公開用リポジトリなら `LICENSE` ファイルの追加を推奨します。
