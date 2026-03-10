import Link from 'next/link';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const menuList = [
    { name: '대시보드', href: '/admin/dashboard', active: true },
    { name: '상품 관리', href: '/admin/products', active: false },
    { name: '거래처 관리', href: '/admin/clients', active: false },
    { name: '주문 관리', href: '/admin/orders', active: false },
    { name: '재고 관리', href: '/admin/inventory', active: false },
    { name: '설정', href: '/admin/settings', active: false },
  ];

  return (
    <div className="flex min-h-screen bg-[var(--color-surface)] text-[var(--color-text-primary)]">
      <aside className="flex w-[260px] shrink-0 flex-col border-r border-[var(--color-border)] bg-[var(--color-white)] px-6 py-6">
        <div className="mb-8 flex items-center gap-3">
          <img
            src="/logo.webp"
            alt="로고"
            className="h-9 w-auto object-contain"
          />
          <div>
            <p className="text-sm font-semibold text-[var(--color-text-primary)]">
              NEXTERP
            </p>
            <p className="text-[11px] text-[var(--color-text-muted)]">
              ADMIN SYSTEM
            </p>
          </div>
        </div>

        <div className="mb-4 text-[11px] uppercase tracking-[0.1em] text-[var(--color-text-muted)]">
          Main Menu
        </div>

        <nav className="flex flex-col gap-2">
          {menuList.map((menu) => (
            <Link
              key={menu.name}
              href={menu.href}
              className={`rounded-lg px-4 py-3 text-sm font-medium transition ${
                menu.active
                  ? 'bg-[var(--color-background)] text-[var(--color-primary)]'
                  : 'text-[var(--color-text-secondary)] hover:bg-[var(--color-background)] hover:text-[var(--color-text-primary)]'
              }`}
            >
              {menu.name}
            </Link>
          ))}
        </nav>

        <div className="mt-auto rounded-xl border border-[var(--color-border)] bg-[var(--color-background)] p-6">
          <p className="text-[11px] uppercase tracking-[0.1em] text-[var(--color-text-muted)]">
            System Status
          </p>
          <p className="mt-2 text-sm font-semibold text-[var(--color-text-primary)]">
            운영 정상
          </p>
          <p className="mt-1 text-[13px] leading-6 text-[var(--color-text-secondary)]">
            관리자 시스템이 정상적으로 실행 중입니다.
          </p>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-[72px] items-center justify-between border-b border-[var(--color-border)] bg-[var(--color-white)] px-10">
          <div>
            <h1 className="text-2xl font-semibold text-[var(--color-text-primary)]">
              관리자 대시보드
            </h1>
            <p className="mt-1 text-[13px] text-[var(--color-text-secondary)]">
              ERP 운영 현황을 한눈에 확인할 수 있습니다.
            </p>
          </div>

          <div className="flex items-center gap-4">
            <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-white)] px-4 py-3 text-sm text-[var(--color-text-secondary)]">
              관리자
            </div>

            <button className="rounded-lg bg-[var(--color-primary)] px-4 py-3 text-sm font-semibold text-white transition hover:opacity-90">
              로그아웃
            </button>
          </div>
        </header>

        <main className="flex-1 bg-[var(--color-surface)] px-10 py-8">
          {children}
        </main>
      </div>
    </div>
  );
}