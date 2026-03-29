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
  - `about.html` に運営者名・経歴・運営目的を追記
  - `templates/article-layout.html` に `{{AUTHOR}}` / `{{DATE}}` プレースホルダを追加
  - `articles/manifest.json` に `author` / `date` フィールドを追加
  - `build-articles.js` を改修して著者名・公開日を記事に表示
  - 対象ファイル: `about.html`, `templates/article-layout.html`, `articles/manifest.json`, `build-articles.js`

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

## 優先度 LOW（できれば対応）

- [ ] **8. プライバシーポリシーの具体化**
  - 「アクセス解析について」の解析ツール名（Google Analytics 等）を明記
  - 日付を現在に更新
  - 対象ファイル: `privacy.html`

- [ ] **9. contact-thankyou.html に AdSense スクリプトを追加**
  - 他の全ページにある AdSense スクリプトをこのページにも追加して統一
  - 対象ファイル: `contact-thankyou.html`

- [ ] **10. AdSense 再審査を申請**
  - 上記の改善が完了したら Google AdSense に再申請

---

## 作業順序（推奨）

```
1 → 2 → 3 → 4 → 5 → 6 → 7 → 8 → 9 → 10（再審査）
```

**最重要は項目 1〜4**。これらが完了した段階で再審査に出せる状態になる。
