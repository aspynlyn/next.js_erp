'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const router = useRouter();

  const [id, setId] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e: React.SyntheticEvent<HTMLFormElement>) => {
    // 폼 기본 동작(페이지 새로고침) 방지
    e.preventDefault();

    // 버튼 중복 클릭 방지
    if (isLoading) return;

    setError('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        // JSON 데이터 명시
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ id, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.message || '로그인에 실패했습니다.');
        return;
      }

      router.push('/admin/dashboard');

      // 서버 컴포넌트 재렌더링(쿠키가 생겼기 때문에 미들웨어나 서버 데이터 다시 읽게 하기 위함)
      router.refresh();
    } catch (error) {
      console.error(error);
      setError('서버와 통신 중 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative flex min-h-screen overflow-hidden bg-[var(--color-surface)]">
      <div
        className="pointer-events-none fixed inset-0 z-0"
        style={{
          backgroundImage: `
            linear-gradient(var(--color-grid) 1px, transparent 1px),
            linear-gradient(90deg, var(--color-grid) 1px, transparent 1px)
          `,
          backgroundSize: '48px 48px',
        }}
      />

      <div className="relative z-10 hidden min-h-screen flex-1 flex-col justify-between border-r border-[var(--color-border)] bg-[var(--color-background)] px-16 py-14 min-[901px]:flex">
        <div className="flex items-center gap-2.5 font-mono text-[11px] uppercase tracking-[0.15em] text-[var(--color-primary)]">
          <span className="inline-block h-px w-5 bg-[var(--color-primary)]" />
          Enterprise Resource Planning
        </div>

        <div style={{ animation: 'fadeUp 0.6s ease 0.1s both' }}>
          <h1 className="text-[clamp(36px,3.5vw,52px)] font-light leading-[1.2] tracking-[-0.02em] text-[var(--color-text-primary)]">
            업무의 흐름을
            <br />
            <strong className="font-semibold text-[var(--color-primary)]">
              한 곳에서
            </strong>{' '}
            관리하세요.
          </h1>

          <p className="mt-5 max-w-[360px] text-[15px] font-light leading-[1.7] text-[var(--color-text-secondary)]">
            구매·판매·재고를 실시간으로 추적하고,
            <br />
            운영 현황을 대시보드에서 즉시 파악합니다.
          </p>
        </div>

        <div className="flex gap-10">
          <div className="flex flex-col gap-1">
            <span className="font-mono text-[28px] font-medium text-[var(--color-primary)]">
              4
            </span>
            <span className="text-[11px] uppercase tracking-[0.1em] text-[var(--color-text-muted)]">
              핵심 모듈
            </span>
          </div>

          <div className="flex flex-col gap-1">
            <span className="font-mono text-[28px] font-medium text-[var(--color-primary)]">
              100%
            </span>
            <span className="text-[11px] uppercase tracking-[0.1em] text-[var(--color-text-muted)]">
              실시간 재고
            </span>
          </div>

          <div className="flex flex-col gap-1">
            <span className="font-mono text-[28px] font-medium text-[var(--color-primary)]">
              KST
            </span>
            <span className="text-[11px] uppercase tracking-[0.1em] text-[var(--color-text-muted)]">
              시간 기준
            </span>
          </div>
        </div>
      </div>

      <div className="relative z-10 flex w-[480px] shrink-0 items-center justify-center bg-[var(--color-white)] px-10 py-12 max-[900px]:w-full max-[900px]:px-6 max-[900px]:py-8">
        <div
          className="w-full max-w-[380px]"
          style={{ animation: 'fadeUp 0.5s ease both' }}
        >
          <div className="mb-12 flex items-center gap-3">
            <img
              src="/logo.webp"
              alt="옆커폰 로고"
              className="h-9 w-auto object-contain"
            />
            <div className="mt-0.5 font-mono text-[10px] tracking-[0.1em] text-[var(--color-text-muted)]">
              v1.0 · ADMIN
            </div>
          </div>

          <h2 className="mb-1.5 text-2xl font-semibold tracking-[-0.01em] text-slate-900">
            관리자 로그인
          </h2>

          <p className="mb-9 text-[13px] font-light text-[var(--color-text-secondary)]">
            계속하려면 관리자 계정으로 로그인하세요.
          </p>

          <form onSubmit={handleLogin}>
            {error && (
              <div className="mb-4 flex items-center gap-2 rounded-lg border border-[var(--color-danger-border)] bg-[var(--color-danger-soft)] px-3.5 py-3 text-[13px] text-[var(--color-danger)]">
                <svg
                  viewBox="0 0 16 16"
                  className="h-[14px] w-[14px] shrink-0 fill-[var(--color-danger)]"
                >
                  <path d="M8 1a7 7 0 100 14A7 7 0 008 1zm-.75 4a.75.75 0 011.5 0v3.5a.75.75 0 01-1.5 0V5zm.75 7a1 1 0 110-2 1 1 0 010 2z" />
                </svg>
                {error}
              </div>
            )}

            <div className="mb-4">
              <label
                htmlFor="user-id"
                className="mb-2 block text-[13px] font-light text-[var(--color-text-secondary)]"
              >
                아이디
              </label>

              <input
                id="user-id"
                type="text"
                className={`w-full rounded-lg border bg-[var(--color-surface)] px-4 py-3 text-sm text-slate-900 outline-none transition-[border-color,box-shadow,background] duration-150 placeholder:text-[var(--color-input-placeholder)] ${
                  error
                    ? 'border-red-500 shadow-[0_0_0_3px_var(--color-danger-ring)]'
                    : 'border-[var(--color-border)] focus:border-[var(--color-primary)] focus:bg-[var(--color-white)] focus:shadow-[0_0_0_3px_var(--color-primary-ring)]'
                }`}
                placeholder="아이디를 입력하세요."
                value={id}
                onChange={(e) => {
                  setId(e.target.value);
                  setError('');
                }}
                autoComplete="username"
                autoFocus
                required
              />
            </div>

            <div className="mb-4">
              <label
                htmlFor="user-pw"
                className="mb-2 block text-[13px] font-light text-[var(--color-text-secondary)]"
              >
                비밀번호
              </label>

              <input
                id="user-pw"
                type="password"
                className={`w-full rounded-lg border bg-[var(--color-surface)] px-4 py-3 text-sm text-slate-900 outline-none transition-[border-color,box-shadow,background] duration-150 placeholder:text-[var(--color-input-placeholder)] ${
                  error
                    ? 'border-red-500 shadow-[0_0_0_3px_var(--color-danger-ring)]'
                    : 'border-[var(--color-border)] focus:border-[var(--color-primary)] focus:bg-[var(--color-white)] focus:shadow-[0_0_0_3px_var(--color-primary-ring)]'
                }`}
                placeholder="비밀번호를 입력하세요."
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setError('');
                }}
                autoComplete="current-password"
                required
              />
            </div>

            <button
              type="submit"
              className="mt-2 flex w-full items-center justify-center gap-2 rounded-lg bg-[var(--color-primary)] px-4 py-[13px] text-sm font-semibold tracking-[0.01em] text-white transition-[background,transform] duration-150 hover:bg-[var(--color-primary-hover)] active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <span
                    className="h-4 w-4 rounded-full border-2 border-white/30 border-t-white"
                    style={{ animation: 'spinExact 0.7s linear infinite' }}
                  />
                  인증 중...
                </>
              ) : (
                '로그인'
              )}
            </button>
          </form>

          <div className="mt-7 flex items-center gap-2 border-t border-[var(--color-border)] pt-6">
            <span className="rounded bg-[var(--color-dev-badge-bg)] px-2 py-1 font-mono text-[10px] tracking-[0.05em] text-[var(--color-primary)]">
              DEV
            </span>
            <span className="font-mono text-xs text-[var(--color-text-muted)]">
              admin / admin123
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
