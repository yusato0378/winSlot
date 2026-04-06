---
name: post-implementation-security
description: コード変更・実装完了後に、このリポジトリ向けのセキュリティ観点チェックを行うときに使う。
---

# 実装後セキュリティチェック（winSlot）

本リポジトリは **静的 HTML + クライアント JS** が中心で `package.json` なし。**自動スキャナ必須**ではなく、以下の **軽量レビュー** を実装後に実施する。

## 1. DOM / XSS まわり

- **`innerHTML` / `insertAdjacentHTML`** に、ユーザー入力・URL パラメータ・未サニタイズ文字列を渡していないか確認する。
- 既存の [`app.js`](../../../app.js) では `innerHTML` が多く使われている。変更時は **固定テンプレート + 数値・既知 enum のみ** になっているか、または **`textContent` / `escapeHtml` 相当**で足りるかを確認する。
- **`eval` / `new Function` / `document.write`** の新規利用は避ける（導入されていないか grep）。

## 2. リンク・外部リソース

- **`target="_blank"`** のリンクに **`rel="noopener noreferrer"`** があるか（新規追加分）。

## 3. シークレット

- API キー、トークン、パスワード、私鍵が **リポジトリに含まれていないか**（コミット差分・環境変数の誤コミット）。

## 4. 生成 HTML

- [`generate-landing-pages.js`](../../../generate-landing-pages.js) / [`build-articles.js`](../../../build-articles.js) などでユーザー由来・外部データを埋め込む場合、**既存の `escapeHtml` 等と同じ方針**でエスケープしているか。

## 5. 報告の仕方

チェック後、**問題なし** / **要対応（ファイル:行 の目安）** を簡潔にまとめる。自動修正まで必須としないが、**高リスクは必ず指摘**する。

## 将来（任意）

`package.json` を導入したら **`npm audit`** をこの Skill に追記する。

## 使い方（任意）

実装タスクの末尾で `/post-implementation-security` や Skill 指定により、このチェックリストを踏む。
