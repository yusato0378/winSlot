/**
 * サイトマップの lastmod を git の最終コミット日から求める。
 *
 * ビルド日を入れると全ページが毎回「今日更新」になり、Google が lastmod 自体を
 * 信用しなくなる（本当に解析情報を足したページの更新も伝わらなくなる）。
 * 浅いクローン（履歴が途中で切れている）や git が無い環境では正しい日付が取れないので、
 * その場合は null を返し、呼び出し側は lastmod を省く。誤った日付を書くよりは省く方がよい。
 */
const { execFileSync } = require("child_process");

/**
 * @returns {{ dates: Map<string, string> } | { reason: string }}
 *   取れたら パス → 最終コミット日（YYYY-MM-DD）、取れなければ理由（ビルドログに出して原因を追えるようにする）
 */
function loadGitDates(root, paths) {
    const git = args => execFileSync("git", args, {
        cwd: root, encoding: "utf8", maxBuffer: 64 * 1024 * 1024, stdio: ["ignore", "pipe", "pipe"],
    });
    try {
        // Vercel は浅いクローンが既定。環境変数 VERCEL_DEEP_CLONE=true で全履歴を取得する
        if (git(["rev-parse", "--is-shallow-repository"]).trim() !== "false") {
            return { reason: "浅いクローンで履歴が途中までしかない（VERCEL_DEEP_CLONE=true で全履歴になる）" };
        }
        const dates = new Map();
        let current = null;
        // log は新しい順に出るので、各パスについて最初に出てきた日付が最終更新日
        for (const line of git(["log", "--format=@%cs", "--name-only", "--", ...paths]).split("\n")) {
            if (line.startsWith("@")) current = line.slice(1).trim();
            else if (line.trim() && current && !dates.has(line.trim())) dates.set(line.trim(), current);
        }
        if (dates.size === 0) return { reason: "git log が空（対象ファイルのコミットが見つからない）" };
        return { dates };
    } catch (e) {
        // git が無い・.git が無い・所有者違いで拒否される（safe.directory）等。git の出力の1行目を残す
        const detail = String((e.stderr && e.stderr.toString()) || e.message).trim().split("\n")[0];
        return { reason: `git を実行できない: ${detail}` };
    }
}

/**
 * @param {string} root リポジトリルート
 * @param {string[]} paths 日付を引く対象（ディレクトリ可）。git log をこの範囲で1回だけ走らせる
 * @returns {(...files: string[]) => string | null} 渡したファイルのうち最も新しいコミット日。取れなければ null
 */
function createLastmod(root, paths) {
    const result = loadGitDates(root, paths);
    const dates = result.dates || null;
    if (dates) {
        console.log(`Sitemap: lastmod を git の履歴から取得（${dates.size}ファイル）`);
    } else {
        console.log(`Sitemap: 機種・設定推測要素ページの lastmod を省きます。理由: ${result.reason}`);
    }
    return (...files) => {
        if (!dates) return null;
        const found = files.map(f => dates.get(f.replace(/\\/g, "/"))).filter(Boolean).sort();
        return found.length ? found[found.length - 1] : null;
    };
}

module.exports = { createLastmod };
