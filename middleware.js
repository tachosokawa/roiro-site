// ============================================================
// middleware.js — staging（テスト環境）だけに Basic 認証をかける
//
//   ・本番（main → roiro.co）  … 認証なしで公開（誰でも閲覧可）
//   ・staging などのプレビュー … ユーザー名／パスワードが必要
//
//   ※このファイルは Vercel 上でのみ動作します。
//     ローカルでHTMLファイルを開いて確認する作業には影響しません。
// ============================================================

export const config = {
  // ページ（HTML）だけを認証対象にする。
  // CSS・JS・画像・フォントなどの静的ファイルは認証なしで即読み込み
  // → staging でのスタイル適用前のちらつき（FOUC）を防ぐ。
  // ※ページの中身（コピー等）は引き続き保護される。
  matcher: ['/((?!.*\\.(?:css|js|mjs|svg|png|jpe?g|webp|gif|ico|webmanifest|woff2?|ttf|map)$).*)'],
};

// ▼▼ ここを書き換えればユーザー名・パスワードを変更できます ▼▼
const USER = 'roiro';
const PASS = 'roiro2026!';
// ▲▲ クライアントには「テストURL」＋「この2つ」を伝えてください ▲▲

export default function middleware(request) {
  // 本番環境（roiro.co / main）は保護しない＝誰でも見られる
  if (process.env.VERCEL_ENV === 'production') {
    return;
  }

  // それ以外（staging などのプレビュー）は Basic 認証を要求
  const auth = request.headers.get('authorization');
  if (auth && auth.startsWith('Basic ')) {
    try {
      const decoded = atob(auth.slice(6)); // "user:pass" を復号
      const i = decoded.indexOf(':');
      const user = decoded.slice(0, i);
      const pass = decoded.slice(i + 1);
      if (user === USER && pass === PASS) {
        return; // 認証OK → そのまま表示
      }
    } catch (e) {
      // 復号に失敗した場合は下の 401 へ
    }
  }

  // 未認証 → ブラウザにユーザー名／パスワード入力を促す
  return new Response('認証が必要です', {
    status: 401,
    headers: {
      'WWW-Authenticate': 'Basic realm="ROIRO Staging", charset="UTF-8"',
    },
  });
}
