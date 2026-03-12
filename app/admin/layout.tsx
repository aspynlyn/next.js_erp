'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768) {
        setIsMobileMenuOpen(false);
      }
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  const menuList = [
    {
      name: '대시보드',
      href: '/admin/dashboard',
      title: '관리자 대시보드',
      description: 'ERP 운영 현황을 한눈에 확인할 수 있습니다.',
    },
    {
      name: '상품 관리',
      href: '/admin/products',
      title: '상품 관리',
      description: '상품 정보를 등록하고 수정할 수 있습니다.',
    },
    {
      name: '거래처 관리',
      href: '/admin/partners',
      title: '거래처 관리',
      description: '거래처 정보를 확인하고 관리할 수 있습니다.',
    },
    {
      name: '발주 관리',
      href: '/admin/purchase-orders',
      title: '발주 관리',
      description: '발주 내역과 진행 상태를 관리할 수 있습니다.',
    },
    {
      name: '주문 관리',
      href: '/admin/sales-orders',
      title: '주문 관리',
      description: '주문 내역과 진행 상태를 관리할 수 있습니다.',
    },
    {
      name: '재고 관리',
      href: '/admin/stocks',
      title: '재고 관리',
      description: '현재 재고 현황과 입출고 상태를 확인할 수 있습니다.',
    },
    {
      name: '설정',
      href: '/admin/settings',
      title: '설정',
      description: '관리자 시스템 환경을 설정할 수 있습니다.',
    },
  ];

  const currentMenu =
    menuList.find((menu) => pathname.startsWith(menu.href)) || menuList[0];

  const renderMenu = (isMobile = false) => (
    <nav className="flex flex-col gap-2">
      {menuList.map((menu) => {
        const isActive = pathname.startsWith(menu.href);

        return (
          <Link
            key={menu.name}
            href={menu.href}
            onClick={() => {
              if (isMobile) {
                setIsMobileMenuOpen(false);
              }
            }}
            className={`rounded-lg px-4 py-3 text-sm font-medium transition ${
              isActive
                ? 'bg-[var(--color-background)] text-[var(--color-primary)]'
                : 'text-[var(--color-text-secondary)] hover:bg-[var(--color-background)] hover:text-[var(--color-text-primary)]'
            }`}
          >
            {menu.name}
          </Link>
        );
      })}
    </nav>
  );

  return (
    <div className="min-h-screen bg-[var(--color-surface)] text-[var(--color-text-primary)]">
      <aside className="fixed left-0 top-0 hidden h-screen w-[260px] flex-col border-r border-[var(--color-border)] bg-[var(--color-white)] px-6 py-6 md:flex">
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

        {renderMenu()}

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

      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <button
            type="button"
            aria-label="메뉴 닫기"
            onClick={() => setIsMobileMenuOpen(false)}
            className="absolute inset-0 bg-black/30"
          />
          <aside className="relative flex h-full w-[260px] flex-col border-r border-[var(--color-border)] bg-[var(--color-white)] px-6 py-6 shadow-xl">
            <div className="mb-8 flex items-center justify-between">
              <div className="flex items-center gap-3">
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

              <button
                type="button"
                aria-label="메뉴 닫기"
                onClick={() => setIsMobileMenuOpen(false)}
                className="flex h-9 w-9 items-center justify-center rounded-lg hover:bg-[var(--color-background)]"
              >
                <span className="text-xl leading-none text-[var(--color-text-primary)]">
                  ×
                </span>
              </button>
            </div>

            <div className="mb-4 text-[11px] uppercase tracking-[0.1em] text-[var(--color-text-muted)]">
              Main Menu
            </div>

            {renderMenu(true)}

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
        </div>
      )}

      <div className="flex min-h-screen min-w-0 flex-1 flex-col md:ml-[260px]">
        <header className="flex h-[64px] items-center justify-between border-b border-[var(--color-border)] bg-[var(--color-white)] px-4 md:hidden">
          <div className="flex items-center gap-3">
            <button
              type="button"
              aria-label="메뉴 열기"
              onClick={() => setIsMobileMenuOpen(true)}
              className="flex h-10 w-10 items-center justify-center rounded-lg border border-[var(--color-border)] bg-[var(--color-white)]"
            >
              <div className="flex flex-col gap-[3px]">
                <span className="block h-[2px] w-4 bg-[var(--color-text-primary)]" />
                <span className="block h-[2px] w-4 bg-[var(--color-text-primary)]" />
                <span className="block h-[2px] w-4 bg-[var(--color-text-primary)]" />
              </div>
            </button>

            <div>
              <h1 className="text-[15px] font-semibold text-[var(--color-text-primary)]">
                {currentMenu.title}
              </h1>
            </div>
          </div>

          <button className="rounded-lg bg-[var(--color-primary)] px-3 py-2 text-[13px] font-semibold text-white transition hover:opacity-90">
            로그아웃
          </button>
        </header>

        <header className="hidden h-[72px] items-center justify-between border-b border-[var(--color-border)] bg-[var(--color-white)] px-10 md:flex">
          <div>
            <h1 className="text-2xl font-semibold text-[var(--color-text-primary)]">
              {currentMenu.title}
            </h1>
            <p className="mt-1 text-[13px] text-[var(--color-text-secondary)]">
              {currentMenu.description}
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

        <main className="flex flex-1 flex-col bg-[var(--color-background)] px-4 py-4 md:px-10 md:py-8">
          {children}
        </main>
      </div>
    </div>
  );
}
