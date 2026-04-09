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

---

## フェーズ5：2026/04/06 導入新台の追加 — 完了

> スペック・天井は解析サイト・P-WORLD 等を参照し `app.js` に反映。**ヨルムンガンド**は天井未確定のため `ceiling: null`。**setGuessElement** は新台6種分を追加済み。

### 対象機種（実装済み `id`）

| 区分 | `id` | 表記名 |
|------|------|--------|
| AT | `kyokou_suiritr` | L 虚構推理 |
| A | `isekai_quartet_bt` | A-SLOT+ 異世界かるてっと BT |
| AT | `jormungand` | スマスロ ヨルムンガンド |
| AT | `akudama_drive` | L アクダマドライブ |
| AT | `shinuchi_yoshimune` | 真打 吉宗 |
| A | `lb_triple_crown_seven` | LB トリプルクラウンセブン |

- [x] **一次情報の整理**（各機種：タイプ区分 AT vs A、BIG/REGラベル、通常コスト、天井・スペックの参照URL）
- [x] **`app.js`** に `MACHINES` エントリ6件追加（既存 `yoshimune` 等との重複がないか確認）
- [x] **`generate-landing-pages.js`** に同内容の `MACHINES` 行＋`EDITORIAL_BY_ID`（各200〜500字目安）
- [x] **`index.html`** 対応機種リンク、AT/A件数・総数、meta / JSON-LD の機種数表記を更新
- [x] **`about.html`** 等、機種数を書いている箇所があれば更新
- [x] **`scripts/sort-machine-list.js`** に6件追加後、`node scripts/sort-machine-list.js` → `node scripts/patch-index-machine-sort.js` で一覧を50音順に反映
- [x] **`node generate-landing-pages.js`** で `machines/*` と `sitemap.xml` を再生成
- [x] **（任意）** `setGuessElement` 新規ページ＋`GUESS_ELEMENT_PAGES` 三箇所＋`patch-setguess-seo.js`
- [x] **`README.md`** 収録機種表の更新

### 機種別サブチェック（6件）

- [x] L 虚構推理（`kyokou_suiritr`）
- [x] A-SLOT+ 異世界かるてっと BT（`isekai_quartet_bt`）
- [x] スマスロ ヨルムンガンド（`jormungand`）
- [x] L アクダマドライブ（`akudama_drive`）
- [x] 真打 吉宗（`shinuchi_yoshimune`）
- [x] LB トリプルクラウンセブン（`lb_triple_crown_seven`）

---

## フェーズ6（アクセス増：優先度 HIGH）— 進行中

> 目的：検索流入（ロングテール）と回遊を増やす。機種LP大量生成の強みを活かして「意図別ページ」＋「内部リンク」を先に固める。

- [x] **1. ロングテール用の入口ページを増やす（機種×意図別）**
  - [x] 機種LPを「天井特化」「設定差特化」「初心者向け（どこ見る）」の3テンプレに再構成（同一情報でも見出し/導入/FAQを寄せる）
  - [x] 各テンプレで狙うKWを定義（例：`機種名 天井 何g` / `機種名 狙い目` / `機種名 設定差 初当たり` / `機種名 設定判別`）
  - [x] canonical 方針を決める（別ページとして勝たせる or 既存機種LPへ集約）

- [ ] **2. 内部リンクを設計して回遊と評価集中を作る**
  - [x] `machines/*/index.html` に「関連記事（guide）」を機種タイプ/天井有無で出し分けて追加
  - [x] `guide/*.html` の本文末に「関連機種」ブロックを自動挿入（複数の `machines/{id}/` へのリンクを配置）
  - [x] トップ `index.html` に「よく見られる入口」枠を追加して機種LP（派生ページ含む）への深いリンクを増やす

- [ ] **3. “薄い量産”に見えない差別化（E-E-A-T寄せ）**
  - [x] 機種LPに「注意点（リセ運用/入力ミス/モデル外要素）」を主要機種だけ1〜3点表示して差別化
  - [x] 主要機種（上位10〜20）だけ、運用差・判断ミスしやすい点など“経験寄り”の補足を追加（全機種一律は不要）

- [ ] **4. Search Console 起点の改善ループを回す**
  - [x] GSCのCSV/TSV（検索パフォーマンス）を解析して、改善候補（CTR低/順位11〜20）を自動で `reports/gsc-actions.md` に出す仕組みを追加