/**
 * サイトマップの lastmod を git の最終コミット日から求める。
 *
 * ビルド日を入れると全ページが毎回「今日更新」になり、Google が lastmod 自体を
 * 信用しなくなる（本当に解析情報を足したページの更新も伝わらなくなる）。
 * 浅いクローン（履歴が途中で切れている）や git が無い環境では正しい日付が取れないので、
 * その場合は null を返し、呼び出し側は lastmod を省く。誤った日付を書くよりは省く方がよい。
 */
const { execFileSync } = require("child_process");

/** @returns {Map<string, string> | null} パス → 最終コミット日（YYYY-MM-DD） */
function loadGitDates(root, paths) {
    try {
        const git = args => execFileSync("git", args, { cwd: root, encoding: "utf8", maxBuffer: 64 * 1024 * 1024 });
        if (git(["rev-parse", "--is-shallow-repository"]).trim() !== "false") return null;

        const dates = new Map();
        let current = null;
        // log は新しい順に出るので、各パスについて最初に出てきた日付が最終更新日
        for (const line of git(["log", "--format=@%cs", "--name-only", "--", ...paths]).split("\n")) {
            if (line.startsWith("@")) current = line.slice(1).trim();
            else if (line.trim() && current && !dates.has(line.trim())) dates.set(line.trim(), current);
        }
        return dates;
    } catch (e) {
        return null;
    }
}

/**
 * @param {string} root リポジトリルート
 * @param {string[]} paths 日付を引く対象（ディレクトリ可）。git log をこの範囲で1回だけ走らせる
 * @returns {(...files: string[]) => string | null} 渡したファイルのうち最も新しいコミット日。取れなければ null
 */
function createLastmod(root, paths) {
    const dates = loadGitDates(root, paths);
    if (!dates) console.log("Sitemap: git の履歴が取れない（浅いクローン等）ため、機種・設定推測要素ページの lastmod を省きます");
    return (...files) => {
        if (!dates) return null;
        const found = files.map(f => dates.get(f.replace(/\\/g, "/"))).filter(Boolean).sort();
        return found.length ? found[found.length - 1] : null;
    };
}

module.exports = { createLastmod };
