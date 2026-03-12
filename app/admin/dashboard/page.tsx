'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';

type DashboardSummary = {
  todayOrderCount: number;
  todayInboundCount: number;
  todayOutboundCount: number;
  lowStockCount: number;
};

type LowStockProduct = {
  id: number;
  code: string;
  name: string;
  currentStock: number;
  safetyStock: number;
};

type SalesTrendItem = {
  month: string;
  quantity: number;
};

type DashboardResponse = {
  summary: DashboardSummary;
  lowStockProducts: LowStockProduct[];
  salesTrend: SalesTrendItem[];
};

const initialData: DashboardResponse = {
  summary: {
    todayOrderCount: 0,
    todayInboundCount: 0,
    todayOutboundCount: 0,
    lowStockCount: 0,
  },
  lowStockProducts: [],
  salesTrend: [],
};

export default function DashboardPage() {
  const [dashboardData, setDashboardData] =
    useState<DashboardResponse>(initialData);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchDashboard = async () => {
    try {
      setLoading(true);
      setError('');

      const response = await fetch('/api/dashboard', {
        method: 'GET',
        cache: 'no-store',
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || '대시보드 데이터를 불러오는 중 오류가 발생했습니다.',
        );
      }

      setDashboardData({
        summary: {
          todayOrderCount: Number(data.summary?.todayOrderCount ?? 0),
          todayInboundCount: Number(data.summary?.todayInboundCount ?? 0),
          todayOutboundCount: Number(data.summary?.todayOutboundCount ?? 0),
          lowStockCount: Number(data.summary?.lowStockCount ?? 0),
        },
        lowStockProducts: Array.isArray(data.lowStockProducts)
          ? data.lowStockProducts
          : [],
        salesTrend: Array.isArray(data.salesTrend) ? data.salesTrend : [],
      });
    } catch (error) {
      console.error(error);
      setError(
        error instanceof Error
          ? error.message
          : '대시보드 데이터를 불러오는 중 오류가 발생했습니다.',
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  const maxTrendQuantity = useMemo(() => {
    if (dashboardData.salesTrend.length === 0) {
      return 0;
    }

    return Math.max(
      ...dashboardData.salesTrend.map((item) => item.quantity),
      0,
    );
  }, [dashboardData.salesTrend]);

  const getBarHeight = (quantity: number) => {
    if (maxTrendQuantity <= 0) {
      return 12;
    }

    const height = (quantity / maxTrendQuantity) * 160;
    return Math.max(height, 12);
  };

  const formatMonthLabel = (month: string) => {
    const [year, monthValue] = month.split('-');

    if (!year || !monthValue) {
      return month;
    }

    return `${Number(monthValue)}월`;
  };

  const kpiCards = [
    {
      title: '오늘 주문',
      value: dashboardData.summary.todayOrderCount.toLocaleString(),
      description: '오늘 생성된 주문 건수',
    },
    {
      title: '오늘 입고',
      value: dashboardData.summary.todayInboundCount.toLocaleString(),
      description: '오늘 처리된 입고 건수',
    },
    {
      title: '오늘 출고',
      value: dashboardData.summary.todayOutboundCount.toLocaleString(),
      description: '오늘 처리된 출고 건수',
    },
    {
      title: '재고 부족 품목',
      value: dashboardData.summary.lowStockCount.toLocaleString(),
      description: '안전재고 이하 상품 수',
    },
  ];

  return (
    <div className="flex flex-1 flex-col">
      {error && (
        <div className="mb-4 rounded-lg border border-[var(--color-danger)] bg-[var(--color-white)] px-4 py-3 text-[14px] text-[var(--color-danger)]">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {kpiCards.map((card) => (
          <div
            key={card.title}
            className="rounded-xl border border-[var(--color-border)] bg-[var(--color-white)] p-6 shadow-sm"
          >
            <p className="text-[13px] font-semibold text-[var(--color-text-secondary)]">
              {card.title}
            </p>
            <p className="mt-4 text-[36px] font-bold leading-none text-[var(--color-text-primary)]">
              {loading ? '-' : card.value}
            </p>
            <p className="mt-4 text-[13px] text-[var(--color-text-secondary)]">
              {card.description}
            </p>
          </div>
        ))}
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 xl:grid-cols-3">
        <div className="xl:col-span-2">
          <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-white)] p-6 shadow-sm">
            <div className="mb-6 flex items-center justify-between gap-4">
              <div>
                <h2 className="text-[24px] font-bold text-[var(--color-text-primary)]">
                  재고 부족 상품
                </h2>
                {dashboardData.summary.lowStockCount === 0 ? (
                  <p className="mt-1 text-[13px] text-[var(--color-text-secondary)]">
                    현재 재고 부족 상품이 없습니다.
                  </p>
                ) : dashboardData.summary.lowStockCount <= 5 ? (
                  <p className="mt-1 text-[13px] text-[var(--color-text-secondary)]">
                    현재 안전재고 이하 상품 목록입니다.
                  </p>
                ) : (
                  <p className="mt-1 text-[13px] text-[var(--color-text-secondary)]">
                    현재 안전재고 이하 상품{' '}
                    {dashboardData.summary.lowStockCount.toLocaleString()}개 중{' '}
                    {Math.min(
                      dashboardData.summary.lowStockCount,
                      5,
                    ).toLocaleString()}
                    개를 표시합니다.
                  </p>
                )}
              </div>
            </div>

            <div className="hidden md:block">
              <div className="overflow-hidden rounded-xl border border-[var(--color-border)] bg-[var(--color-white)]">
                <table className="w-full table-fixed border-collapse">
                  <thead>
                    <tr className="bg-[var(--color-background)]">
                      <th className="w-[25%] border-b border-[var(--color-border)] px-4 py-3 text-center text-[13px] font-semibold text-[var(--color-text-secondary)]">
                        상품 코드
                      </th>
                      <th className="w-[25%] border-b border-[var(--color-border)] px-4 py-3 text-center text-[13px] font-semibold text-[var(--color-text-secondary)]">
                        상품명
                      </th>
                      <th className="w-[25%] border-b border-[var(--color-border)] px-4 py-3 text-center text-[13px] font-semibold text-[var(--color-text-secondary)]">
                        현재 재고
                      </th>
                      <th className="w-[25%] border-b border-[var(--color-border)] px-4 py-3 text-center text-[13px] font-semibold text-[var(--color-text-secondary)]">
                        안전 재고
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {loading ? (
                      <tr>
                        <td
                          colSpan={4}
                          className="px-4 py-10 text-center text-[15px] text-[var(--color-text-secondary)]"
                        >
                          재고 부족 상품을 불러오는 중입니다.
                        </td>
                      </tr>
                    ) : dashboardData.lowStockProducts.length === 0 ? (
                      <tr>
                        <td
                          colSpan={4}
                          className="px-4 py-10 text-center text-[15px] text-[var(--color-text-secondary)]"
                        >
                          현재 재고 부족 상품이 없습니다.
                        </td>
                      </tr>
                    ) : (
                      dashboardData.lowStockProducts.map((product) => (
                        <tr
                          key={product.id}
                          className="border-b border-[var(--color-border)] last:border-b-0"
                        >
                          <td className="px-4 py-4 text-center text-[15px] text-[var(--color-text-primary)]">
                            {product.code}
                          </td>
                          <td className="truncate px-4 py-4 text-center text-[15px] text-[var(--color-text-primary)]">
                            {product.name}
                          </td>
                          <td className="px-4 py-4 text-center text-[15px] font-semibold text-[var(--color-danger)]">
                            {product.currentStock.toLocaleString()}개
                          </td>
                          <td className="px-4 py-4 text-center text-[15px] text-[var(--color-text-primary)]">
                            {product.safetyStock.toLocaleString()}개
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3 md:hidden">
              {loading ? (
                <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-white)] px-4 py-10 text-center text-[15px] text-[var(--color-text-secondary)]">
                  재고 부족 상품을 불러오는 중입니다.
                </div>
              ) : dashboardData.lowStockProducts.length === 0 ? (
                <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-white)] px-4 py-10 text-center text-[15px] text-[var(--color-text-secondary)]">
                  현재 재고 부족 상품이 없습니다.
                </div>
              ) : (
                dashboardData.lowStockProducts.map((product) => (
                  <div
                    key={product.id}
                    className="rounded-xl border border-[var(--color-border)] bg-[var(--color-white)] p-4"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-[12px] text-[var(--color-text-muted)]">
                        {product.code}
                      </p>
                      <p className="mt-1 truncate text-[15px] font-semibold text-[var(--color-text-primary)]">
                        {product.name}
                      </p>
                    </div>

                    <div className="my-3 h-px bg-[var(--color-border)]" />

                    <div className="space-y-2 text-[13px]">
                      <div className="flex items-center justify-between">
                        <span className="text-[var(--color-text-muted)]">
                          현재 재고
                        </span>
                        <span className="font-medium text-[var(--color-danger)]">
                          {product.currentStock.toLocaleString()}개
                        </span>
                      </div>

                      <div className="flex items-center justify-between">
                        <span className="text-[var(--color-text-muted)]">
                          안전 재고
                        </span>
                        <span className="font-medium text-[var(--color-text-primary)]">
                          {product.safetyStock.toLocaleString()}개
                        </span>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        <div>
          <div className="h-full rounded-xl border border-[var(--color-border)] bg-[var(--color-white)] p-6 shadow-sm">
            <div className="flex h-full flex-col">
              <div className="mb-6">
                <h2 className="text-[24px] font-bold text-[var(--color-text-primary)]">
                  빠른 메뉴
                </h2>
                <p className="mt-1 text-[13px] text-[var(--color-text-secondary)]">
                  자주 사용하는 화면으로 빠르게 이동할 수 있습니다.
                </p>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-1">
                <Link
                  href="/admin/products"
                  className="rounded-lg border border-[var(--color-border)] bg-[var(--color-white)] px-4 py-3 text-center text-[14px] font-semibold text-[var(--color-text-primary)] transition hover:bg-[var(--color-surface)]"
                >
                  상품 관리
                </Link>

                <Link
                  href="/admin/partners"
                  className="rounded-lg border border-[var(--color-border)] bg-[var(--color-white)] px-4 py-3 text-center text-[14px] font-semibold text-[var(--color-text-primary)] transition hover:bg-[var(--color-surface)]"
                >
                  거래처 관리
                </Link>

                <Link
                  href="/admin/purchase-orders"
                  className="rounded-lg border border-[var(--color-border)] bg-[var(--color-white)] px-4 py-3 text-center text-[14px] font-semibold text-[var(--color-text-primary)] transition hover:bg-[var(--color-surface)]"
                >
                  발주 관리
                </Link>

                <Link
                  href="/admin/sales-orders"
                  className="rounded-lg border border-[var(--color-border)] bg-[var(--color-white)] px-4 py-3 text-center text-[14px] font-semibold text-[var(--color-text-primary)] transition hover:bg-[var(--color-surface)]"
                >
                  주문 관리
                </Link>

                <Link
                  href="/admin/stocks"
                  className="rounded-lg border border-[var(--color-border)] bg-[var(--color-white)] px-4 py-3 text-center text-[14px] font-semibold text-[var(--color-text-primary)] transition hover:bg-[var(--color-surface)]"
                >
                  재고 관리
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-6 rounded-xl border border-[var(--color-border)] bg-[var(--color-white)] p-6 shadow-sm">
        <div className="mb-6">
          <h2 className="text-[24px] font-bold text-[var(--color-text-primary)]">
            최근 6개월 판매량 추이
          </h2>
          <p className="mt-1 text-[13px] text-[var(--color-text-secondary)]">
            출고 처리된 수량 기준 월별 판매량입니다.
          </p>
        </div>

        {loading ? (
          <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-white)] px-4 py-16 text-center text-[15px] text-[var(--color-text-secondary)]">
            판매량 추이를 불러오는 중입니다.
          </div>
        ) : dashboardData.salesTrend.length === 0 ? (
          <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-white)] px-4 py-16 text-center text-[15px] text-[var(--color-text-secondary)]">
            최근 6개월 판매량 데이터가 없습니다.
          </div>
        ) : (
          <>
            <div className="hidden md:grid md:grid-cols-6 md:gap-4">
              {dashboardData.salesTrend.map((item) => (
                <div
                  key={item.month}
                  className="flex min-h-[240px] flex-col items-center justify-end"
                >
                  <p className="mb-3 text-[13px] font-semibold text-[var(--color-text-primary)]">
                    {item.quantity.toLocaleString()}개
                  </p>

                  <div className="flex h-[180px] w-full items-end justify-center rounded-lg bg-[var(--color-background)] px-3 py-3">
                    <div
                      className="w-full max-w-[72px] rounded-md bg-[var(--color-primary)] transition-all"
                      style={{ height: `${getBarHeight(item.quantity)}px` }}
                    />
                  </div>

                  <p className="mt-3 text-[13px] font-medium text-[var(--color-text-secondary)]">
                    {formatMonthLabel(item.month)}
                  </p>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-1 gap-3 md:hidden">
              {dashboardData.salesTrend.map((item) => (
                <div
                  key={item.month}
                  className="rounded-xl border border-[var(--color-border)] bg-[var(--color-white)] p-4"
                >
                  <div className="mb-3 flex items-center justify-between gap-3">
                    <span className="text-[14px] font-semibold text-[var(--color-text-primary)]">
                      {formatMonthLabel(item.month)}
                    </span>
                    <span className="text-[14px] font-semibold text-[var(--color-text-primary)]">
                      {item.quantity.toLocaleString()}개
                    </span>
                  </div>

                  <div className="h-3 overflow-hidden rounded-full bg-[var(--color-background)]">
                    <div
                      className="h-full rounded-full bg-[var(--color-primary)]"
                      style={{
                        width: `${
                          maxTrendQuantity > 0
                            ? (item.quantity / maxTrendQuantity) * 100
                            : 0
                        }%`,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}