# 実装プラン（E-E-A-T / ガイド記事メタ情報）

## 1. `about.html` — 運営者情報の明示

- [x] **運営者名**の明示（個人運営であることの記載）
- [x] **経歴・専門性**（趣味としての経験・統計的な見方など）
- [x] **運営目的**（判断材料・学習コンテンツの提供、助長ではない旨）
- [x] **解説記事との対応**（ガイド記事の著者・公開日が `manifest.json` から出る旨の注記）

## 2. ガイド記事 — 著者名・公開日の表示仕組み

- [x] **`articles/manifest.json`** の `author` / `published`（および任意の `updated`）を正とする
- [x] **各記事ページ**：タイトル（`h1`）直下に **著者・公開日** を表示（`<time datetime>` 付き）
- [x] **構造化データ**：`Article` の JSON-LD（`author`, `datePublished`, `dateModified`）
- [x] **一覧 `guide/index.html`**：各項目に **著者・公開日** を併記
- [x] **フッター枠**：`updated` がある記事のみ「最終更新」を表示（著者・公開日は見出し下に集約）

---

実装完了後、上記チェックを付与済み。

---

# 機種LP（`machines/{id}/`）構成の整理プラン

## 目的

各機種ページが **「設定推測／設定差」** と **「天井期待値」** の2本柱だけで把握できるようにし、ナビ・目次・補助セクションの重複による迷いを減らす。

## 現状の整理（問題点）

- **入口が4系統**：総合（`index.html`）＋ `ceiling/` ＋ `setting/` ＋ `beginner/`。同系の情報が複数URLに分散し、「どこが本番か」が分かりにくい。
- **総合ページに要素が過多**：手書き解説（`EDITORIAL_BY_ID`）、解析メモ（`PARSE_NOTES_BY_ID`）、注意点（`CAUTIONS_BY_ID`）、ページ切り替え、おすすめ読み順、目次、スペック表、天井表、設定推測要素（`setGuessElement`）へのCTA、関連ガイド、他機種、ツールCTAが縦に積み上がる。
- **派生ページでも骨格が似ている**：variant ごとに「このページでわかること」＋同系ナビ＋目次＋（多くは）スペック＋天井が再掲され、差分は追加ブロック程度になりがち。
- **生成の中心**：`generate-landing-pages.js` の `generatePage()` が全 variant のHTMLを組み立て、sitemap にも `beginner` まで列挙されている。

## 目指す情報設計（2本柱の定義）

| 柱 | ページ上で含める主なブロック（案） |
|----|--------------------------------------|
| **設定推測／設定差** | 設定別スペック表、`guessElementPath` がある機種は **設定推測要素** への導線、（必要なら）設定差ハイライト `buildSettingHighlightSection` の要点をこの柱内に収める |
| **天井期待値** | 天井ゲーム数・狙い目・恩恵の要約、通常時の期待値表、リセット天井がある場合はその表、（必要なら）狙い目根拠 `buildCeilingStrategySection` をこの柱内に収める |

**共通フッター付近**：トップのツールへのCTA（「この機種で計算する」）は残し、計算導線は維持する。

## 採用方針（確定）

**A. 単一URLに集約。** 正規URLは `https://www.pachislot-setting.com/machines/{id}/` のみ。旧パス `/machines/{id}/ceiling/`・`setting/`・`beginner/` は **301 リダイレクト**（`vercel.json`）で同一URLへ寄せる。B/C は見送り。

---

## 方針A：実装プラン（手順）

### フェーズ0 — 事前確認

- [x] `vercel.json` は `trailingSlash: true` のため、リダイレクト元は **`/machines/:machineId/ceiling/`** のように末尾スラッシュ付きを主に定義し、必要なら無スラッシュ版も併記する。（実装方針として確認済み。301 の具体追記はフェーズ2）
- [x] 既存 `redirects` の後に、機種向けリダイレクトを追記する（順序は Vercel の仕様に従う）。

### フェーズ1 — `generate-landing-pages.js`（中核）

- [x] **`generatePage(machine)` を単一ページのみ生成**に変更（`variant` 引数と `ceiling` / `setting` / `beginner` 分岐を削除）。
- [x] **削除するブロック**：`buildVariantNav`、`buildReadingFlowNav`、`getMachinePageMeta` の派生分岐、`variantIntro`。
- [x] **パンくず JSON-LD**：トップ → 機種の2段のみ。
- [x] **ページ内の並び（推奨）**  
  1. HTML パンくず  
  2. （任意）`editorial` / `caution` / `parseNotes` のうち残すものを上寄せ（詳細は下「コンテンツ資産」）  
  3. **ページ内ジャンプ**（新規）：`#lp-setting`・`#lp-ceiling`・`#tool` へのリンク（旧4タブの代替）  
  4. **目次**：上記アンカー中心に簡素化  
  5. **柱1「設定推測・設定差」**（例：`section#lp-setting`）  
     - `buildSettingHighlightSection` を **全機種ページで常時出力**（現状は `setting` variant のみ）  
     - 設定別スペック表（現 `#spec`）  
     - `buildParseNotesSection`（ある場合はこの柱下）  
     - `guessElementPath` がある機種のみ「設定推測要素」CTA  
  6. **柱2「天井期待値」**（例：`section#lp-ceiling`、内に既存 `#ceiling-ev` / `#reset-ceiling-ev`）  
     - `buildCeilingStrategySection` を **常時出力**（現状は `ceiling` variant のみ）  
     - 天井期待値表・リセット天井表（現行の `ceilingSection` / `resetCeilingSection`）  
  7. **関連記事・他機種**：要件どおり2本柱に絞るなら **削除**。回遊優先なら柱2の後に現状どおり薄く残すか、実装時にどちらか一方に決める。  
  8. **`#tool`**：トップへのCTA。`beginner` LP の代替として **`guide/how-to-use.html` への1リンク** をツール近くに置いてもよい。

- [x] **`getMachinePageMeta(machine)`**：title / meta description を「1ページに設定差と天井期待値」を示す文言へ更新。
- [x] **生成ループ**：`machines/{id}/index.html` のみ書き出し。`ceiling` / `setting` / `beginner` サブディレクトリへの出力をやめる。
- [x] **sitemap**：`machines/{id}/` のみ列挙（派生3URLは出さない）。
- [x] **旧ディレクトリ**：リポジトリから `machines/*/ceiling` `setting` `beginner` を削除（**本番の301に任せる**のが推奨）。段階移行する場合のみ、一時的に meta refresh 等の薄い `index.html` を残す案も可。

### フェーズ2 — `vercel.json`

- [x] `permanent: true` で例えば次を追加（`:machineId` は動的セグメント）。`ceiling` / `setting` / `beginner` それぞれについて、**末尾スラッシュありとなし**の両方を検討。  
  - 例：`/machines/:machineId/ceiling/` → `/machines/:machineId/`  
- [x] （任意）`/machines/:id/ceiling/` → `.../machines/:id/#lp-ceiling` のハッシュ付きリダイレクトは、HTTP の `Location` にフラグメントを載せるのは実務上避けるため **ルート（末尾スラッシュ付き）のみ**に統一。

### フェーズ3 — リポジトリ内リンク・ドキュメント

- [x] **`app.js`**：深いリンクが `ceiling/` 等なら **`machines/{id}/`**（必要なら `#lp-ceiling`）へ変更。
- [x] **`build-articles.js`**：`beginner` 等の機種LP URLを修正。
- [x] **`patch-setguess-seo.js`**：機種LPへの相対パスが正しいか確認。
- [x] **`guide/*.html`**、**`data/access-ranking.json`**：機種LPリンクを単一URL＋アンカーに追随。
- [x] **`index.html`**、**`README.md`**、**`todo.md`**、**`scripts/gsc-analyze.js`** 等：旧「4テンプレ」説明を単一URLに合わせる。

### フェーズ4 — `machines/landing-page.css`

- [x] `.lp-variant-nav` / `.lp-reading-flow` が未使用なら削除または整理。`#lp-setting` / `#lp-ceiling` に `scroll-margin-top` を付与してアンカーが見切れないようにする。（ページ内ジャンプ・アンカー用スタイルを追加済み。未使用の variant / reading-flow / related-list 系 CSS を削除）

### フェーズ5 — 検証

- [x] `node generate-landing-pages.js` が成功する。
- [x] 天井ありAT・天井なしA・`guessElementPath` ありの代表機種で表示確認。
- [x] `sitemap.xml` に派生URLが含まれないこと。
- [x] 旧URL301の**定義検証**: `node scripts/verify-vercel-machine-redirects.js` で `vercel.json` を確認する。本番HTTPヘッダの最終確認・GSC（URL検査・サイトマップ再送信・数週間後のインデックス推移）は **README「デプロイ（Vercel）」** の運用手順に従う。

---

## 実装タスク一覧（ファイル単位の要約）

| 優先度 | ファイル・対象 | 内容 |
|--------|----------------|------|
| 高 | `generate-landing-pages.js` | 単一HTML生成・2柱レイアウト・sitemap 修正・派生出力削除 |
| 高 | `vercel.json` | 旧3パスから `/machines/:id/` への 301 |
| 中 | `app.js` / `build-articles.js` / 他スクリプト | 内部リンクの URL 修正 |
| 中 | `machines/landing-page.css` | アンカー・未使用スタイル |
| 低 | `README.md` / `todo.md` 等 | ドキュメント追随 |
| 運用 | `machines/**/ceiling` 等ディレクトリ | 削除（または段階削除） |

## コンテンツ資産の扱い（判断が必要な論点）

- **`EDITORIAL_BY_ID`（手書き解説）**：2柱のどちらかに **1〜2段落に圧縮**して載せる／柱の直下に「補足」として折りたたみ（`<details>`）にする／ガイド記事側へ寄せる、のいずれか。
- **`PARSE_NOTES_BY_ID`（解析メモ）**：設定推測柱に寄せるのが自然。長い場合は折りたたみ推奨。
- **`CAUTIONS_BY_ID`（注意点）**：両柱に関わるため、ページ冒頭の **短い1ブロック**に統合するか、各柱の末尾に1行ずつに分割。
- **`buildRelatedGuideLinks` / `buildRelatedMachinesSection`**：要件が「2本柱のみ」に厳密なら **削除**またはフッター近くの **最小リンク（1〜2件）** に縮小。SEO・回遊を残すならフッターに薄く残す判断も可（要件とのトレードオフを明記）。

## 推奨マイルストーン（方針A）

1. [x] **フェーズ1**（`generate-landing-pages.js`）→ 全 `machines/{id}/index.html` 再生成。  
2. [x] **フェーズ2**（`vercel.json`）→ 旧URL 301。  
3. [x] **フェーズ3**（リンク・一部ドキュメント）→ 派生ディレクトリ削除・`app.js` / `build-articles.js` / `guide` / `access-ranking.json` 追随。  
4. [x] **フェーズ4〜5**（CSS整理・`verify-vercel-machine-redirects.js`・README のデプロイ／GSC 運用手順）。

---

方針Aで実装する際は、コミットまたはIssueの冒頭に **「機種LP: 単一URL集約（方針A）」** と明記してから差分を作ると安全。

---

# SEO改善プラン（UIシンプル維持）

## 現状整理

| 区分 | 状態 |
|------|------|
| `index.html` | OG/Twitter Card・JSON-LD（WebSite+WebApplication）・canonical・GSC確認・sitemap登録 ✅ |
| `machines/*/index.html` | canonical・meta description・OG・og:image・Twitter Card・FAQPage+BreadcrumbList JSON-LD・sitemap登録（lastmod+changefreq付き） ✅ |
| `guide/*.html` | Article JSON-LD（image付き）・BreadcrumbList JSON-LD・meta description・canonical（.html付き）・sitemap登録（manifest.json日付） ✅ |
| `guide/index.html` | canonical `guide/` ✅ / ItemList JSON-LD ✅ |
| `setGuessElement/*/index.html` | canonical・OGタグ・Twitter Card・BreadcrumbList JSON-LD・title統一 ✅ |
| `robots.txt` | `/articles/`（旧パス）を Disallow ✅ |
| `sitemap.xml` | guide: manifest.json日付・changefreq:monthly・priority:0.7 ✅ / machines: changefreq:monthly ✅ |

---

## フェーズ1 — クイックウィン（メタ情報の穴埋め）

### 1-1. `og:image` を machine ページ全体に追加

- [x] `generate-landing-pages.js` の `<head>` テンプレートに `og:image`・`og:image:width`・`og:image:height`・`og:image:alt` を追加（`index.html` と同じデフォルト画像 `og-default.png` を使用）
- [x] 合わせて `twitter:card`・`twitter:title`・`twitter:description`・`twitter:image` も追加

### 1-2. `setGuessElement` ページのメタ情報を整備

- [x] **`patch-setguess-seo.js`** を拡張し、各ページに以下を追加（または `setGuessElement` 生成スクリプトがあれば同様に）：
  - `og:title`・`og:description`・`og:type`（`article`）・`og:url`・`og:locale`・`og:image`（デフォルト画像）
  - `twitter:card`・`twitter:title`・`twitter:description`・`twitter:image`
- [x] **title タグ** を `{機種名} 設定推測要素 | Setting Analyzer Pro` に統一（現状 `- パチスロ設定推測ツール` が混在）

### 1-3. `setGuessElement` ページに BreadcrumbList JSON-LD を追加

```json
{
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  "itemListElement": [
    { "@type": "ListItem", "position": 1, "name": "トップ", "item": "https://www.pachislot-setting.com/" },
    { "@type": "ListItem", "position": 2, "name": "機種名", "item": "https://www.pachislot-setting.com/machines/{id}/" },
    { "@type": "ListItem", "position": 3, "name": "設定推測要素", "item": "https://www.pachislot-setting.com/setGuessElement/{camelId}/" }
  ]
}
```

- [x] `patch-setguess-seo.js` に上記テンプレートを追加（機種IDとURL補完が必要）

### 1-4. `guide/index.html` の canonical 修正

- [x] canonical を `https://www.pachislot-setting.com/guide/index.html` → `https://www.pachislot-setting.com/guide/` に変更
- [x] sitemap.xml の `guide/index.html` エントリも `guide/` に変更（generate-landing-pages.js を修正）

---

## フェーズ2 — 構造化データの拡充

### 2-1. ガイド記事に BreadcrumbList JSON-LD を追加

- [x] `build-articles.js` の `<head>` 生成部分に BreadcrumbList を追加：
  ```
  トップ → 解説・使い方（guide/） → 記事タイトル
  ```
- [x] Article JSON-LD の `image` フィールドにデフォルトOG画像URLを追加（E-E-A-T補強）

### 2-2. `guide/index.html` に CollectionPage / ItemList JSON-LD を追加

- [x] `build-articles.js` がガイド一覧を生成するタイミングで `ItemList` 構造化データを出力：
  ```json
  {
    "@type": "ItemList",
    "name": "解説・使い方",
    "itemListElement": [
      { "@type": "ListItem", "position": 1, "url": "https://...guide/setting-basics.html", "name": "記事タイトル" },
      ...
    ]
  }
  ```

### 2-3. `index.html` の WebSite JSON-LD に `potentialAction` 追加（任意）

- [ ] 検索エンジンのサイトリンク検索ボックス対応として追加を検討（優先度低）

---

## フェーズ3 — sitemap.xml の品質改善

- [x] **`generate-landing-pages.js`**：guide ページの sitemap エントリを manifest.json の `published`/`updated` 日付に変更し、`priority: 0.7`・`changefreq: monthly` を追加
- [x] **`generate-landing-pages.js`**：machines ページの `changefreq: monthly` を追加
- [x] **`generate-landing-pages.js`**：`guide/index.html` エントリを `guide/` に変更
- [ ] **`index.html`**：sitemap の `<url>` に `lastmod`（最終コミット日または手動更新日）を追加

---

## フェーズ4 — 内部リンクとナビゲーション補強

### 4-1. about.html へのリンクをフッターに追加

- [x] 全ページ共通のフッター（`app-footer`）に「アプリについて」リンクが既に存在（templates/article-layout.html・machines・setGuessElement全ページ）
- [ ] `about.html` ページ自体にも self-referential な canonical と BreadcrumbList を確認

### 4-2. ガイド記事間の関連リンク

- [ ] `articles/manifest.json` に `related` フィールド（記事スラッグ配列）を追加できる設計にし、`build-articles.js` で記事末尾に「関連記事」セクションを出力（UI影響最小：小さなリンクリストのみ）

### 4-3. machine ページ → setGuessElement への導線確認

- [ ] 既存の CTA リンクが正しい URL（`setGuessElement/{camelId}/`）を向いているか `patch-setguess-seo.js` 実行後に確認

---

## フェーズ5 — パフォーマンス（Core Web Vitals）

- [ ] **Google Fonts の `font-display: swap` 確認**：`style.css` の `@font-face` または `<link>` 呼び出しに `&display=swap` が付いているか確認（現状付いている: ✅）
- [ ] **画像最適化**：`og-default.png` が 1200×630 で適切に圧縮されているか確認
- [ ] **`<link rel="preload">` の検討**：メインの CSS（`style.css`）を `preload` するかどうかを検討（効果はサイト規模に依存）

---

## 優先度サマリ

| フェーズ | 優先度 | 効果 | 工数 |
|----------|--------|------|------|
| 1-1 og:image on machines | 高 | OGP シェア時の見栄え・CTR | 小（ビルドスクリプト1箇所） |
| 1-2 setGuessElement OGタグ・title統一 | 高 | クロール品質・シェア | 小〜中 |
| 1-3 setGuessElement BreadcrumbList | 高 | リッチリザルト・サイト構造理解 | 小 |
| 1-4 guide/index.html canonical修正 | 高 | 重複コンテンツ回避 | 極小 |
| 2-1 guide BreadcrumbList | 中 | リッチリザルト | 小 |
| 2-2 guide/index ItemList | 中 | 構造理解 | 小 |
| 3 sitemap 品質改善 | 中 | クロール効率・鮮度シグナル | 小 |
| 4-1 about リンク | 中 | E-E-A-T | 極小 |
| 4-2 関連記事リンク | 低 | 内部リンク強化 | 中 |
| 5 Core Web Vitals | 低〜中 | ランキングシグナル | 確認のみなら小 |

---

## 実装時の注意点

- **UIへの影響ゼロ原則**：`<head>` 内の変更（メタタグ・JSON-LD）のみで完結させる。本文レイアウトは変えない。
- **生成スクリプト経由**：手書きHTMLを直接編集するのではなく、`generate-landing-pages.js`・`build-articles.js`・`patch-setguess-seo.js` を修正してビルドで全ページに反映する。
- **GSC でのモニタリング**：各フェーズ後に Google Search Console の「URL検査」「拡張機能（パンくず・FAQPage）」でリッチリザルトを確認し、インデックス登録をリクエスト。
