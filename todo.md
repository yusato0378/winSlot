# AdSense 審査対策 TODO

> Google AdSense「有用性の低いコンテンツ」での審査落ちに対する改善タスク一覧。
> 完了したらチェックを入れてください。

---

## フェーズ1（優先度 HIGH：1〜4）— 完了

- [x] **1. 機種LPに手書き解説を追加**
  - `generate-landing-pages.js` の `MACHINES` に `editorial` フィールドを追加
  - `generatePage()` の `<h1>` 直下に解説セクションを挿入する仕組みを作る
  - 主要10〜15機種分の解説（200〜500字）を執筆
  - 対象ファイル: `generate-landing-pages.js`, `machines/*/index.html`（再生成）

- [x] **2. 運営者情報・著者情報を明示（E-E-A-T対策）**
  - `about.html` に運営者名・経歴・運営目的を追記（詳細は `plan.md`）
  - `templates/article-layout.html` に `{{ARTICLE_HEAD_EXTRA}}`（JSON-LD）を追加
  - `articles/manifest.json` に `author` / `published`（任意 `updated`）を記載
  - `build-articles.js` で h1 直下に著者・公開日、`<head>` に Article JSON-LD、`guide/index` 一覧にも著者・公開日を表示
  - 対象ファイル: `about.html`, `templates/article-layout.html`, `articles/manifest.json`, `build-articles.js`, `style.css`

- [x] **3. sitemap.xml に guide/ 記事を追加**
  - `generate-landing-pages.js` の sitemap 生成ロジックに `guide/*.html` の URL を追加
  - priority は `0.7` 程度
  - 対象ファイル: `generate-landing-pages.js`, `sitemap.xml`（再生成）

- [x] **4. メタ情報の不整合を修正**
  - `index.html` の meta description / JSON-LD の「36機種」→「51機種」
  - `about.html` の meta description の「36機種」→「51機種」
  - 対象ファイル: `index.html`, `about.html`

---

## フェーズ2（優先度 MEDIUM：5〜7）— 完了

- [x] **5. setGuessElement に meta description を追加**
  - 全43ページの `<head>` に機種名を含んだ固有の description を追加
  - 一括スクリプト: `node patch-setguess-seo.js`（`generate-landing-pages.js` の機種名を参照）
  - 対象ファイル: `setGuessElement/*/index.html`

- [x] **6. setGuessElement から機種LPへの相互リンクを追加**
  - 各ページの戻るボタン直前に「スペック・天井期待値」ナビ（`machines/{id}/`）を追加（同上スクリプト）
  - 対象ファイル: `setGuessElement/*/index.html`, `setGuessElement/guess-element.css`

- [x] **7. glossary.html の見出し構造を修正**
  - 用語見出しを h3 → h2 に変更（h1 の直下で h2 を飛ばさない）
  - 対象ファイル: `articles/glossary.html` → `node build-articles.js` で `guide/glossary.html` を再生成

---

## フェーズ3（優先度 LOW：8〜9）— 完了

- [x] **8. プライバシーポリシーの具体化**
  - Google AdSense（提供者・目的）を明記。GA4 等のアクセス解析は**現状未導入**と記載し、導入時はポリシー改定すると明記
  - 最終更新日を更新
  - 対象ファイル: `privacy.html`

- [x] **9. contact-thankyou.html に AdSense スクリプトを追加**
  - `google-adsense-account` メタと `adsbygoogle.js` を他ページと同様に追加
  - 対象ファイル: `contact-thankyou.html`

---

## 手作業（リポジトリ外）

- [x] **10. AdSense 再審査を申請**
  - 本番デプロイ後、Google AdSense 管理画面からサイトを再申請する（コード変更では完了しません）

---

## 作業順序（推奨）

```
1 → 2 → 3 → 4 → 5 → 6 → 7 → 8 → 9 → 10（再審査）
```

**最重要は項目 1〜4**。これらが完了した段階で再審査に出せる状態になる。

---

## フェーズ4：新規機種7件の追加 — 完了

> リストのうち「L ToLOVEるダークネス」「L 無職転生」は既存収録のため対象外。

- [x] **データ準備**（7機種分のスペック・天井・コストを一次資料から整理）
- [x] **`app.js`** に `MACHINES` エントリ7件追加（`id` / `bigLabel`・`regLabel` を機種仕様に合わせる）
- [x] **`generate-landing-pages.js`** に同内容の `MACHINES` 行＋`EDITORIAL_BY_ID` 7件
- [x] **`index.html`** 対応機種リンク＋AT件数・総数・meta/JSON-LDの機種数表記を更新
- [x] **`about.html`** 等、機種数を記載している箇所があれば更新
- [x] **`node generate-landing-pages.js`** で `machines/*` と `sitemap.xml` を再生成
- [x] **（任意）** `setGuessElement` … **今回は未作成**（LP・本ツールのみ追加。必要なら後からページ＋`GUESS_ELEMENT_PAGES` 三箇所＋`patch-setguess-seo.js`）
- [x] **`README.md`** 収録機種表の更新

### 機種別サブチェック（7件）

- [x] エウレカセブンART（`eureka_seven_art`）
- [x] SHAKE BT（`shake_bt`）
- [x] ハーレムエース BT（`harem_ace_bt`）
- [x] ALEX BT（`alex_bt`）
- [x] スマスロ痛いのは嫌なので防御力に極振りしたいと思います。（`bofuri`）
- [x] 七つの魔剣が支配する（`nanatsu_maken`）
- [x] 回胴式遊技機 グランベルム（`granbelm`）
