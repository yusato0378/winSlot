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
  - [x] 上記を「アクセスランキング（上位5）」に差し替え（`data/access-ranking.json` → `app.js` で fetch・描画、GSC 更新は `scripts/update-access-ranking-from-gsc.js`）

- [ ] **3. “薄い量産”に見えない差別化（E-E-A-T寄せ）**
  - [x] 機種LPに「注意点（リセ運用/入力ミス/モデル外要素）」を主要機種だけ1〜3点表示して差別化
  - [x] 主要機種（上位10〜20）だけ、運用差・判断ミスしやすい点など“経験寄り”の補足を追加（全機種一律は不要）

- [ ] **4. Search Console 起点の改善ループを回す**
  - [x] GSCのCSV/TSV（検索パフォーマンス）を解析して、改善候補（CTR低/順位11〜20）を自動で `reports/gsc-actions.md` に出す仕組みを追加

---

## フェーズ7：トップ「よく見られる入口」→ アクセスランキング TOP5 化

> 目的：トップページの「よく見られる入口（すぐ探したい方向け）」（現在は手動5件固定）を、Search Console のクリック数に基づく **machines/ 配下のアクセスランキング上位5件** に差し替える。  
> 静的ホスティングのため、ランキングデータは JSON ファイルとして配信し、定期的な運用で更新する方針。

### データ層

- [x] **1. `data/access-ranking.json` を新規作成**
  - フォーマット: `{ "updated": "YYYY-MM-DD", "items": [{ "href", "title", "clicks" }, ...] }`
  - 初期値は現行の手動5件（`clicks: null`）で埋めておく
  - `.gitignore` には**含めない**（コミット対象）

### GSC → JSON 更新スクリプト

- [x] **2. `scripts/update-access-ranking-from-gsc.js` を新規作成**
  - 既存の `scripts/gsc-analyze.js` と同じ CSV/TSV パーサーを流用
  - 入力: GSC エクスポート（ページ列 + クリック数 + 表示回数）
  - 処理: `SITE_ORIGIN`（既定 `https://www.pachislot-setting.com`）配下の `machines/` パスのみ抽出 → クリック数降順 → 上位5件
  - 出力: `data/access-ranking.json` を上書き（既存 JSON の `title` は可能な限り引き継ぐ）
  - 実行例: `node scripts/update-access-ranking-from-gsc.js data/gsc.csv`

### フロントエンド（HTML / JS / CSS）

- [x] **3. `index.html` の該当ブロックを書き換え**
  - 見出しを「アクセスランキング（上位5）」に変更
  - `<ul>` → `<ol id="access-ranking-list">` に置き換え（中身は空、JS で描画）
  - ランキング補足用の `<p id="access-ranking-note">` を追加

- [x] **4. `app.js` にランキング描画ロジックを追加**
  - `init()` から `initAccessRanking()` を呼び出し
  - `fetch("data/access-ranking.json")` → 成功時は JSON から `<ol>` を組み立て
  - `href` は `machines/` 形式のみ許可（`..` 禁止、正規表現でバリデーション）
  - `innerHTML` は使わず `textContent` / `createElement` で描画（XSS 対策）
  - `clicks` が数値のときだけ「（○○ クリック）」を横に表示
  - fetch 失敗・空データ時は従来の手動5件をフォールバック表示

- [x] **5. `style.css` にランキング用スタイルを追加**
  - `.access-ranking-list`（`<ol>` 番号付き、縦並び）
  - `.access-ranking-note`（補足テキスト）
  - `.access-ranking-clicks`（クリック数の小さめ表示）

### 確認・仕上げ

- [x] **6. 動作確認**
  - JSON あり / なし / 不正データ の3パターンでフォールバックが正しく動くか確認
  - テスト用 CSV で `update-access-ranking-from-gsc.js` を実行し、JSON が正しく更新されるか確認

- [x] **7. `README.md` のビルドスクリプト表に1行追記**
  - `node scripts/update-access-ranking-from-gsc.js data/gsc.csv` の説明を追加

- [x] **8. `todo.md` フェーズ6 項目2 に差し替え済みサブ行を追記**

---

## フェーズ8：トップに「新台ピックアップ（最新5件）」を表示

> 目的：コメントアウト中のアクセスランキング枠と同じエリアに、最近追加された機種（新台）を5件表示する。  
> 新台追加のたびに自動で反映されるよう、`MACHINES` に `addedDate` フィールドを持たせて JS で最新5件を描画する方針。

### データ層

- [x] **1. `app.js` の `MACHINES` 全エントリに `addedDate` を追加**
  - 既存機種は一律で同じ日付（例: `"2026-03-01"`）を設定
  - フェーズ4 で追加した7機種は `"2026-04-01"`、フェーズ5 の6機種は `"2026-04-06"` など、実際の追加時期に合わせる
  - 今後の新台追加時は追加日を記入するルールとする

- [x] **2. `generate-landing-pages.js` の `MACHINES` にも同様に `addedDate` を追加**
  - `app.js` と同期させる（機種LP生成時に利用する可能性を残す）

### フロントエンド（HTML / JS / CSS）

- [x] **3. `index.html` にコメントアウト中のランキング枠の代わりに新台枠を追加**
  - 見出し: 「🆕 新台ピックアップ」
  - `<ul id="new-machines-list">` を配置（JS で描画）
  - 既存の「初めての方は…」案内はそのまま残す

- [x] **4. `app.js` に新台描画ロジックを追加**
  - `init()` から `initNewMachines()` を呼び出し
  - `MACHINES` を `addedDate` 降順でソート → 上位5件を取得
  - `href` は `machines/{id}/` 形式で生成、`textContent` で描画（XSS 対策）
  - 各リンクに `addedDate` を小さく表示（例: `4/6 追加`）

- [x] **5. `style.css` に新台枠用スタイルを追加**
  - `.new-machines-list`（リスト）
  - `.new-machine-date`（追加日の小さめ表示）
  - 既存のランキング用スタイルとは別に定義

### 確認・仕上げ

- [x] **6. 動作確認**
  - 新台5件が `addedDate` 降順で正しく表示されるか確認
  - `addedDate` が同じ機種が複数ある場合の並び順が安定しているか確認

- [x] **7. コメントアウト中のアクセスランキング枠を整理**
  - 新台枠が完成したら、ランキング用のコメントアウト HTML はそのまま残す（将来有効化用）

---

## フェーズ9：2026/04/20 導入新台の追加 — 完了

> 新台カレンダー（例: 1geki.jp 2026年4月）上、同日は計6機種（パチンコ3／パチスロ3）。**本サイトの対象はパチスロ3機種のみ**（パチンコは非対象）。  
> スペックは主に 1geki.jp の公開表を反映。天井はガンダムUC覚醒DRIVE・ドッチは代表ラインを設定、ミリオンゴッドは解析未確定のため `ceiling: null`。

### 対象機種一覧（パチスロ3機種・予定 `id`）

| 区分 | 仮 `id` | 表記名 |
|------|---------|--------|
| AT | `gundam_unicorn_kakusei_drive` | Lパチスロ 機動戦士ガンダムユニコーン 覚醒DRIVE |
| AT | `million_god_kiseki` | スマスロ ミリオンゴッド-神々の軌跡- |
| AT | `animal_slot_dotch` | アニマルスロット ドッチ |

### 実装プラン（共通）

- [x] **一次情報の整理**（各機種：タイプ区分 AT vs A、BIG/REG 等ラベル、通常コスト、天井・スペック・メーカー表記の参照URL／未確定は `ceiling: null` 等で明示）
- [x] **`app.js`** に `MACHINES` エントリ3件追加（`addedDate: "2026-04-20"`、既存 `id` との重複なしを確認）
- [x] **`generate-landing-pages.js`** に同内容の `MACHINES` 行＋`EDITORIAL_BY_ID`（各200〜500字目安）
- [x] **`index.html`** 対応機種リンク、AT/A 件数・総数、meta / JSON-LD の機種数表記を更新
- [x] **`about.html`** 等、機種数を書いている箇所があれば更新
- [x] **`scripts/sort-machine-list.js`** に3件追加後、`node scripts/sort-machine-list.js` → `node scripts/patch-index-machine-sort.js` で一覧を50音順に反映
- [x] **`node generate-landing-pages.js`** で `machines/*` と `sitemap.xml` を再生成
- [x] **（任意）** `setGuessElement` 新規ページ＋`GUESS_ELEMENT_PAGES` 三箇所＋`node patch-setguess-seo.js`
- [x] **`README.md`** 収録機種表の更新

### 機種別サブチェック（3件）

- [x] Lパチスロ 機動戦士ガンダムユニコーン 覚醒DRIVE（`gundam_unicorn_kakusei_drive`）
- [x] スマスロ ミリオンゴッド-神々の軌跡-（`million_god_kiseki`）
- [x] アニマルスロット ドッチ（`animal_slot_dotch`）

---

## フェーズ10：内部リンク強化（クロール／インデックス）

> 目的：Google の発見・回遊を強化する。**トップ → 各機種**は既存の一覧で担保済み。ここでは **機種 → 他機種** と **設定 → 天井 → 初心者** の明示的回遊を中心に実装する（プラン反映）。

- [x] **1. 機種LPに「他機種」セクションを追加**
  - `generate-landing-pages.js` に同タイプ（AT / A）中心で最大 N 件のリンクを生成する関数を追加
  - 総合・`ceiling/`・`setting/`・`beginner/` の **全バリアント** に出力（相対パスは `basePrefix` に合わせる）
  - 再生成: `node generate-landing-pages.js`

- [x] **2. 「設定 → 天井 → 初心者」の次ページ導線を追加**
  - `generatePage()` に読み順ナビ（例: 次に読むページへの `<a>`）を挿入
  - `machines/landing-page.css` に最小限のスタイル（例: `.lp-flow-nav`）
  - 再生成: `node generate-landing-pages.js`

- [x] **3. `SITE_URL` / canonical を www に統一して再生成**
  - `generate-landing-pages.js`・`build-articles.js` 等、`https://www.pachislot-setting.com` に揃える（sitemap と整合）
  - `node generate-landing-pages.js`、必要なら `node build-articles.js`

- [x] **4.（任意）トップ `index.html` の補助導線**
  - `#machine-list` へのアンカーリンク、または短い固定おすすめ機種リンク

- [x] **5.（任意）記事レイアウトから機種一覧へ**
  - `templates/article-layout.html` または `build-articles.js` で「対応機種一覧（`../index.html#machine-list`）」の共通リンク

---

## フェーズ11：Google インデックス未登録の修正

> **調査日:** 2026-05-03  
> **現状:** Search Console で下記5種類のインデックス問題を確認（画像参照）  
> - ページにリダイレクトがあります：**2ページ**（失敗）  
> - 代替ページ（適切な canonical タグあり）：**8ページ**（開始前）  
> - 重複：ユーザーにより正規ページとして選択されていません：**1ページ**（開始前）  
> - 検出 - インデックス未登録：**313ページ**（開始前）← 最重大  
> - クロール済み - インデックス未登録：**1ページ**（開始前）  

---

### 根本原因

#### 原因A（最重要）: `guide/` と `setGuessElement/` ページに canonical タグが存在しない

| ディレクトリ | ページ数 | canonical | サイトマップ登録 |
|---|---|---|---|
| `machines/` | 268 | ✅ あり | ✅ 268件 |
| `setGuessElement/` | 52 | ❌ なし | ✅ 52件 |
| `guide/` | 19 | ❌ なし | ✅ 19件 |
| `articles/` | 18 | ❌ なし | ❌ 未登録 |

- `guide/` は `build-articles.js` で生成されているが `<link rel="canonical">` が出力されていない。  
- `setGuessElement/` は `patch-setguess-seo.js` で生成されているが同様に未出力。  
- canonical なしのページは Google が URL バリアント（末尾スラッシュ有無・`?` パラメータ等）を重複と判断しやすい。  
- → **「代替ページ（canonicalタグあり）」「重複」「インデックス未登録」の直接原因**

#### 原因B（重要）: `articles/` 旧ページが削除されず孤立している

- `articles/` 18ページはサイトマップ未登録だが、静的ファイルとして公開中。  
- `guide/` の旧バージョン相当（ファイルサイズが `guide/` の半分以下、canonical なし）。  
- Googlebot がクロールすると `guide/` との重複コンテンツと判定。  
- 内部リンクからの参照はないが、Googlebot はサイト全体をクロールするため発見される。  
- → **「重複」「代替ページ」の原因**

#### 原因C（重要）: `vercel.json` の全パス SPA リライトが干渉している可能性

```json
{ "source": "/(.*)", "destination": "/index.html" }
```

- Vercel では static ファイルが存在するパスは rewrite をスキップするが、  
  末尾スラッシュなし URL（例: `/machines/aim_juggler_ex`）にアクセスすると **308 リダイレクト** が発生。  
- サイトマップは末尾スラッシュ付き URL で登録されているため、Google が  
  末尾スラッシュなしでアクセスした場合にリダイレクト判定される。  
- → **「ページにリダイレクトがあります」2ページの原因**

#### 原因D（中期）: 機種サブページのコンテンツが薄い（テンプレート量産）

- `machines/` 67機種 × 4ページ（main/ceiling/setting/beginner）= **268ページ**が類似テンプレート構造。  
- 設定値テーブルと内部リンクが中心で、機種固有のオリジナルテキストが少ない。  
- Google が「薄いコンテンツ」と判断しインデックスを後回しにする主因。  
- → **「検出 - インデックス未登録」313ページの大半を占める原因**

---

### 修正タスク（優先順）

#### P1（即時対応）— canonical タグ追加

- [x] **A1. `build-articles.js` に canonical 出力を追加**
  - `<head>` 内に `<link rel="canonical" href="https://www.pachislot-setting.com/guide/{{SLUG}}.html">` を挿入
  - 対象: `build-articles.js`（テンプレート or 出力関数）
  - 再生成: `node build-articles.js` → `guide/*.html` 19ファイル更新

- [x] **A2. `patch-setguess-seo.js` に canonical 出力を追加**
  - `<head>` 内に `<link rel="canonical" href="https://www.pachislot-setting.com/setGuessElement/{{SLUG}}/index.html">` を挿入  
  - 再実行: `node patch-setguess-seo.js` → `setGuessElement/*/index.html` 52ファイル更新

#### P1（即時対応）— `articles/` 旧ページの整理

- [x] **B1. `articles/` 全18ページに canonical を付与して `guide/` へ向ける**
  - 各ファイルの `<head>` に `<link rel="canonical" href="https://www.pachislot-setting.com/guide/{{SLUG}}.html">` を追加
  - `build-articles.js` に `articles/` 向け出力ロジックを追加するか、スクリプトで一括パッチ  
  - **または** `articles/` を丸ごと削除し、`vercel.json` に 301 リダイレクトルールを追加（`/articles/:slug → /guide/:slug`）  
  - ※ 削除が最もクリーンだが、外部リンクが存在する場合は canonical 対応が安全

#### P2（短期対応）— vercel.json のリダイレクト整理

- [ ] **C1. `vercel.json` に trailing slash リダイレクトを明示追加**
  - Vercel の `trailingSlash: true` オプションを利用するか、各サブパスへの 301 リダイレクトを明示
  - `articles/` を削除した場合は `/articles/:slug` → `/guide/:slug` の 301 リダイレクトも追加

  ```json
  {
    "redirects": [
      { "source": "/articles/:slug", "destination": "/guide/:slug", "permanent": true }
    ],
    "rewrites": [
      { "source": "/sitemap.xml", "destination": "/sitemap.xml" },
      { "source": "/(.*)", "destination": "/index.html" }
    ]
  }
  ```

#### P2（短期対応）— sitemap.xml の精度向上

- [ ] **D1. `setGuessElement/index.html`（一覧ページ）をサイトマップに追加**
  - 現状 `setGuessElement/` ルートの index.html がサイトマップ未登録
  - `generate-landing-pages.js` の sitemap 生成に追加（`priority: 0.7`）

- [ ] **D2. サイトマップの `lastmod` を最新化**
  - 変更のあったページの `lastmod` を `2026-05-03` 等に更新してクロール促進

#### P3（中期対応）— 薄いコンテンツページの対策

- [ ] **E1. ceiling/setting/beginner ページへの機種固有テキスト追加**
  - `generate-landing-pages.js` の ceiling/setting/beginner サブページ生成部分に  
    機種固有の説明文（`EDITORIAL_BY_ID` 等を流用）を出力するロジックを追加  
  - まず主要10〜15機種から着手

- [ ] **E2. noindex 戦略の検討**（オプション）
  - コンテンツが薄い beginner ページ等に `<meta name="robots" content="noindex">` を付与し、  
    メインページと ceiling/setting ページへインデックスを集中させる選択肢も検討

#### P3（仕上げ）— Search Console での対応確認

- [ ] **F1. 修正後に Search Console で URL 検査 → 再クロールリクエスト**
  - `guide/ceiling-basics.html` 等の代表 URL を手動リクエスト
  - サイトマップを再送信して全体のクロール促進

---

### 期待効果

| 対応 | 解消が期待される問題 |
|---|---|
| A1/A2: canonical 追加 | 代替ページ8件・重複1件・インデックス未登録の一部 |
| B1: articles/ 整理 | 重複・代替ページ |
| C1: vercel リダイレクト | リダイレクト2件 |
| D1/D2: sitemap 更新 | 検出-未登録の促進（インデックス率向上） |
| E1: コンテンツ充実 | 検出-インデックス未登録313件（中長期） |