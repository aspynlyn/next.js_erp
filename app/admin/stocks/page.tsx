'use client';

import { useEffect, useState } from 'react';

type MovementType = 'IN' | 'OUT' | 'ADJUST';

type StockMovementItem = {
  id: number;
  productId: number;
  quantity: number;
  type: MovementType;
  memo: string | null;
  createdAt: string;
  refId: number | null;
  stockAfter: number;
  product: {
    id: number;
    code: string;
    name: string;
    currentStock: number;
    safetyStock: number;
  };
};

type StockMovementListResponse = {
  items: StockMovementItem[];
  totalCount: number;
  totalPages: number;
  currentPage: number;
};

const PAGE_SIZE = 8;

export default function StocksPage() {
  const [stockMovements, setStockMovements] = useState<StockMovementItem[]>([]);
  const [search, setSearch] = useState('');
  const [inputValue, setInputValue] = useState('');
  const [listError, setListError] = useState('');
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [isAdjustModalOpen, setIsAdjustModalOpen] = useState(false);
  const [selectedProductId, setSelectedProductId] = useState<number | null>(
    null,
  );
  const [selectedProductName, setSelectedProductName] = useState('');
  const [productHistory, setProductHistory] = useState<StockMovementItem[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  const [productKeyword, setProductKeyword] = useState('');

  const [adjustForm, setAdjustForm] = useState({
    productId: '',
    quantity: '',
    memo: '',
  });

  const [adjustError, setAdjustError] = useState('');
  const [adjustLoading, setAdjustLoading] = useState(false);

  const getMovementLabel = (type: MovementType) => {
    switch (type) {
      case 'IN':
        return '입고';
      case 'OUT':
        return '출고';
      case 'ADJUST':
        return '재고 조정';
      default:
        return type;
    }
  };

  const getMovementClassName = (type: MovementType) => {
    switch (type) {
      case 'IN':
        return 'border-[var(--color-success)] bg-[var(--color-white)] text-[var(--color-success)]';
      case 'OUT':
        return 'border-[var(--color-danger)] bg-[var(--color-white)] text-[var(--color-danger)]';
      case 'ADJUST':
        return 'border-[var(--color-warning)] bg-[var(--color-white)] text-[var(--color-warning)]';
      default:
        return 'border-[var(--color-border)] bg-[var(--color-white)] text-[var(--color-text-secondary)]';
    }
  };

  const formatDateTime = (value: string) => {
    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      return '-';
    }

    return `${date.toLocaleDateString('ko-KR')} ${date.toLocaleTimeString(
      'ko-KR',
      {
        hour: '2-digit',
        minute: '2-digit',
      },
    )}`;
  };

  const formatQuantity = (type: MovementType, quantity: number) => {
    if (type === 'IN') {
      return `+${quantity.toLocaleString()}개`;
    }

    if (type === 'OUT') {
      return `-${quantity.toLocaleString()}개`;
    }

    if (quantity > 0) {
      return `+${quantity.toLocaleString()}개`;
    }

    return `${quantity.toLocaleString()}개`;
  };

  const getStockStatusLabel = (currentStock: number, safetyStock: number) => {
    return currentStock <= safetyStock ? '부족' : '정상';
  };

  const getStockStatusClassName = (
    currentStock: number,
    safetyStock: number,
  ) => {
    return currentStock <= safetyStock
      ? 'border-[var(--color-warning)] bg-[var(--color-white)] text-[var(--color-warning)]'
      : 'border-[var(--color-success)] bg-[var(--color-white)] text-[var(--color-success)]';
  };

  const fetchStockMovements = async (keyword = '', page = 1) => {
    try {
      setLoading(true);
      setListError('');

      const searchParams = new URLSearchParams();

      if (keyword) {
        searchParams.set('search', keyword);
      }

      searchParams.set('page', String(page));
      searchParams.set('pageSize', String(PAGE_SIZE));

      const response = await fetch(`/api/stocks?${searchParams.toString()}`, {
        method: 'GET',
        cache: 'no-store',
      });

      const data: StockMovementListResponse = await response.json();

      if (!response.ok) {
        throw new Error(
          (data as { message?: string }).message ||
            '재고 변동 이력을 불러오는 중 오류가 발생했습니다.',
        );
      }

      setStockMovements(Array.isArray(data.items) ? data.items : []);
      setTotalPages(Number(data.totalPages ?? 1));
      setCurrentPage(Number(data.currentPage ?? page));
    } catch (error) {
      console.error(error);
      setListError(
        error instanceof Error
          ? error.message
          : '재고 변동 이력을 불러오는 중 오류가 발생했습니다.',
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStockMovements('', 1);
    fetchProducts();
  }, []);

  const handleSearch = async () => {
    setSearch(inputValue);
    setCurrentPage(1);
    await fetchStockMovements(inputValue, 1);
  };

  const handlePageChange = async (page: number) => {
    if (page < 1 || page > totalPages || page === currentPage) {
      return;
    }

    await fetchStockMovements(search, page);
  };

  const getPageNumbers = () => {
    const pages: number[] = [];
    const start = Math.max(1, currentPage - 2);
    const end = Math.min(totalPages, currentPage + 2);

    for (let page = start; page <= end; page += 1) {
      pages.push(page);
    }

    return pages;
  };

  const pageNumbers = getPageNumbers();

  const openHistoryModal = async (productId: number, productName: string) => {
    try {
      setHistoryLoading(true);
      setSelectedProductId(productId);
      setSelectedProductName(productName);
      setIsHistoryModalOpen(true);

      const response = await fetch(`/api/stocks/${productId}`, {
        method: 'GET',
        cache: 'no-store',
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || '재고 이력을 불러오는 중 오류가 발생했습니다.',
        );
      }

      setProductHistory(Array.isArray(data.items) ? data.items : []);
    } catch (error) {
      console.error(error);
      setListError(
        error instanceof Error
          ? error.message
          : '재고 이력을 불러오는 중 오류가 발생했습니다.',
      );
      setIsHistoryModalOpen(false);
    } finally {
      setHistoryLoading(false);
    }
  };

  const closeHistoryModal = () => {
    setIsHistoryModalOpen(false);
    setSelectedProductId(null);
    setSelectedProductName('');
    setProductHistory([]);
  };

  const closeAdjustModal = () => {
    setIsAdjustModalOpen(false);
    setAdjustForm({
      productId: '',
      quantity: '',
      memo: '',
    });
    setAdjustError('');
    setProductKeyword('');
  };

  const handleChangeAdjustForm = (
    key: 'productId' | 'quantity' | 'memo',
    value: string,
  ) => {
    setAdjustForm((prev) => ({
      ...prev,
      [key]: value,
    }));

    setAdjustError('');
  };

  const handleSubmitAdjust = async () => {
    if (!adjustForm.productId) {
      setAdjustError('상품을 선택해 주세요.');
      return;
    }

    if (
      !adjustForm.quantity.trim() ||
      Number.isNaN(Number(adjustForm.quantity)) ||
      Number(adjustForm.quantity) === 0
    ) {
      setAdjustError('조정 수량을 올바르게 입력해 주세요.');
      return;
    }

    try {
      setAdjustLoading(true);
      setAdjustError('');

      const response = await fetch('/api/stocks/adjust', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          productId: Number(adjustForm.productId),
          quantity: Number(adjustForm.quantity),
          memo: adjustForm.memo.trim() || null,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setAdjustError(data.message || '재고 조정 중 오류가 발생했습니다.');
        return;
      }

      closeAdjustModal();
      await fetchStockMovements(search, currentPage);
    } catch (error) {
      console.error(error);
      setAdjustError(
        error instanceof Error
          ? error.message
          : '재고 조정 중 오류가 발생했습니다.',
      );
    } finally {
      setAdjustLoading(false);
    }
  };

  const [products, setProducts] = useState<
    {
      id: number;
      code: string;
      name: string;
      currentStock: number;
      isSale: boolean;
    }[]
  >([]);

  const fetchProducts = async () => {
    try {
      const response = await fetch('/api/products?page=1&pageSize=999', {
        method: 'GET',
        cache: 'no-store',
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || '상품 목록을 불러오는 중 오류가 발생했습니다.',
        );
      }

      const items = Array.isArray(data.items) ? data.items : [];
      setProducts(items);
    } catch (error) {
      console.error(error);
      setListError(
        error instanceof Error
          ? error.message
          : '상품 목록을 불러오는 중 오류가 발생했습니다.',
      );
    }
  };

  const filteredProducts = products.filter((product) => {
    const keyword = productKeyword.trim().toLowerCase();

    if (!keyword) {
      return true;
    }

    return (
      product.code.toLowerCase().includes(keyword) ||
      product.name.toLowerCase().includes(keyword)
    );
  });

  return (
    <div className="flex flex-1 flex-col">
      <div className="flex flex-1 flex-col rounded-xl border border-[var(--color-border)] bg-[var(--color-white)] p-4 shadow-sm md:p-6">
        <div className="mb-6 flex flex-col gap-3 md:flex-row md:items-center md:justify-between md:gap-4">
          <div className="flex w-full flex-col gap-3 md:flex-row md:items-center">
            <div className="relative flex-1">
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleSearch();
                  }
                }}
                placeholder="상품 코드 또는 상품명을 입력해 주세요."
                className="h-12 w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-white)] pl-4 pr-12 text-[14px] text-[var(--color-text-primary)] outline-none transition placeholder:text-[var(--color-input-placeholder)] focus:border-[var(--color-primary)]"
              />

              <button
                type="button"
                onClick={handleSearch}
                className="absolute right-3 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-md hover:bg-[var(--color-background)]"
              >
                <img
                  src="/search.svg"
                  alt="검색"
                  className="h-5 w-5 opacity-70"
                />
              </button>
            </div>

            <button
              type="button"
              onClick={() => {
                setAdjustForm({
                  productId: '',
                  quantity: '',
                  memo: '',
                });
                setAdjustError('');
                setProductKeyword('');
                setIsAdjustModalOpen(true);
              }}
              className="h-12 w-full rounded-lg bg-[var(--color-primary)] px-4 text-[14px] font-semibold text-[var(--color-white)] transition hover:bg-[var(--color-primary-hover)] md:w-[96px] md:shrink-0"
            >
              재고 조정
            </button>
          </div>
        </div>

        {listError && (
          <div className="mb-4 rounded-lg border border-[var(--color-danger)] bg-[var(--color-white)] px-4 py-3 text-[14px] text-[var(--color-danger)]">
            {listError}
          </div>
        )}

        <div className="hidden md:block">
          <div className="overflow-hidden rounded-xl border border-[var(--color-border)] bg-[var(--color-white)]">
            <table className="w-full table-fixed border-collapse">
              <thead>
                <tr className="bg-[var(--color-background)]">
                  <th className="w-[14%] border-b border-[var(--color-border)] px-4 py-3 text-center text-[13px] font-semibold text-[var(--color-text-secondary)]">
                    변동일시
                  </th>
                  <th className="w-[10%] border-b border-[var(--color-border)] px-4 py-3 text-center text-[13px] font-semibold text-[var(--color-text-secondary)]">
                    상품 코드
                  </th>
                  <th className="w-[14%] border-b border-[var(--color-border)] px-4 py-3 text-center text-[13px] font-semibold text-[var(--color-text-secondary)]">
                    상품명
                  </th>
                  <th className="w-[10%] border-b border-[var(--color-border)] px-4 py-3 text-center text-[13px] font-semibold text-[var(--color-text-secondary)]">
                    변동 유형
                  </th>
                  <th className="w-[10%] border-b border-[var(--color-border)] px-4 py-3 text-center text-[13px] font-semibold text-[var(--color-text-secondary)]">
                    변동 수량
                  </th>
                  <th className="w-[10%] border-b border-[var(--color-border)] px-4 py-3 text-center text-[13px] font-semibold text-[var(--color-text-secondary)]">
                    현재 재고
                  </th>
                  <th className="w-[10%] border-b border-[var(--color-border)] px-4 py-3 text-center text-[13px] font-semibold text-[var(--color-text-secondary)]">
                    재고 상태
                  </th>
                  <th className="w-[14%] border-b border-[var(--color-border)] px-4 py-3 text-center text-[13px] font-semibold text-[var(--color-text-secondary)]">
                    사유
                  </th>
                  <th className="w-[10%] border-b border-[var(--color-border)] px-4 py-3 text-center text-[13px] font-semibold text-[var(--color-text-secondary)]">
                    관리
                  </th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td
                      colSpan={9}
                      className="px-4 py-10 text-center text-[15px] text-[var(--color-text-secondary)]"
                    >
                      재고 변동 이력을 불러오는 중입니다.
                    </td>
                  </tr>
                ) : stockMovements.length === 0 ? (
                  <tr>
                    <td
                      colSpan={9}
                      className="px-4 py-10 text-center text-[15px] text-[var(--color-text-secondary)]"
                    >
                      조회된 재고 변동 이력이 없습니다.
                    </td>
                  </tr>
                ) : (
                  stockMovements.map((movement) => (
                    <tr
                      key={movement.id}
                      className="border-b border-[var(--color-border)] last:border-b-0"
                    >
                      <td className="break-words px-4 py-4 text-center text-[14px] text-[var(--color-text-primary)]">
                        {formatDateTime(movement.createdAt)}
                      </td>
                      <td className="px-4 py-4 text-center text-[14px] text-[var(--color-text-primary)]">
                        {movement.product.code}
                      </td>
                      <td className="px-4 py-4 text-center text-[14px] text-[var(--color-text-primary)]">
                        {movement.product.name}
                      </td>
                      <td className="px-4 py-4 text-center">
                        <span
                          className={`inline-flex rounded-full border px-2.5 py-[3px] text-[10px] font-semibold ${getMovementClassName(
                            movement.type,
                          )}`}
                        >
                          {getMovementLabel(movement.type)}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-center text-[14px] font-semibold text-[var(--color-text-primary)]">
                        {formatQuantity(movement.type, movement.quantity)}
                      </td>
                      <td className="px-4 py-4 text-center text-[14px] text-[var(--color-text-primary)]">
                        {movement.stockAfter.toLocaleString()}개
                      </td>
                      <td className="px-4 py-4 text-center">
                        <span
                          className={`inline-flex rounded-full border px-2.5 py-[3px] text-[10px] font-semibold ${getStockStatusClassName(
                            movement.product.currentStock,
                            movement.product.safetyStock,
                          )}`}
                        >
                          {getStockStatusLabel(
                            movement.stockAfter,
                            movement.product.safetyStock,
                          )}
                        </span>
                      </td>
                      <td className="break-words px-4 py-4 text-center text-[14px] text-[var(--color-text-primary)]">
                        {movement.memo || '-'}
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center justify-center">
                          <button
                            type="button"
                            onClick={() =>
                              openHistoryModal(
                                movement.product.id,
                                movement.product.name,
                              )
                            }
                            className="rounded-lg border border-[var(--color-border)] bg-[var(--color-white)] px-4 py-2 text-[14px] font-semibold text-[var(--color-text-primary)] shadow-sm transition hover:bg-[var(--color-surface)]"
                          >
                            이력보기
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:hidden">
          {loading ? (
            <div className="col-span-1 rounded-xl border border-[var(--color-border)] bg-[var(--color-white)] px-4 py-10 text-center text-[15px] text-[var(--color-text-secondary)] sm:col-span-2">
              재고 변동 이력을 불러오는 중입니다.
            </div>
          ) : stockMovements.length === 0 ? (
            <div className="col-span-1 rounded-xl border border-[var(--color-border)] bg-[var(--color-white)] px-4 py-10 text-center text-[15px] text-[var(--color-text-secondary)] sm:col-span-2">
              조회된 재고 변동 이력이 없습니다.
            </div>
          ) : (
            stockMovements.map((movement) => (
              <div
                key={movement.id}
                className="flex flex-col rounded-xl border border-[var(--color-border)] bg-[var(--color-white)] p-4"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="truncate text-[12px] text-[var(--color-text-muted)]">
                      {movement.product.code}
                    </p>
                    <p className="mt-1 truncate text-[15px] font-semibold text-[var(--color-text-primary)]">
                      {movement.product.name}
                    </p>
                  </div>

                  <span
                    className={`shrink-0 rounded-full border px-2 py-[2px] text-[11px] font-semibold ${getMovementClassName(
                      movement.type,
                    )}`}
                  >
                    {getMovementLabel(movement.type)}
                  </span>
                </div>

                <div className="my-3 h-px bg-[var(--color-border)]" />

                <div className="space-y-2 text-[13px]">
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-[var(--color-text-muted)]">
                      변동일시
                    </span>
                    <span className="text-right font-medium text-[var(--color-text-primary)]">
                      {formatDateTime(movement.createdAt)}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-[var(--color-text-muted)]">
                      변동 수량
                    </span>
                    <span className="font-medium text-[var(--color-text-primary)]">
                      {formatQuantity(movement.type, movement.quantity)}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-[var(--color-text-muted)]">
                      현재 재고
                    </span>
                    <span className="font-medium text-[var(--color-text-primary)]">
                      {movement.stockAfter.toLocaleString()}개
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-[var(--color-text-muted)]">
                      재고 상태
                    </span>
                    <span
                      className={`inline-flex rounded-full border px-2 py-[2px] text-[11px] font-semibold ${getStockStatusClassName(
                        movement.product.currentStock,
                        movement.product.safetyStock,
                      )}`}
                    >
                      {getStockStatusLabel(
                        movement.stockAfter,
                        movement.product.safetyStock,
                      )}
                    </span>
                  </div>

                  <div className="flex items-center justify-between gap-3">
                    <span className="text-[var(--color-text-muted)]">사유</span>
                    <span className="text-right font-medium text-[var(--color-text-primary)]">
                      {movement.memo || '-'}
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() =>
                    openHistoryModal(movement.product.id, movement.product.name)
                  }
                  className="mt-4 w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-white)] py-2.5 text-[14px] font-semibold text-[var(--color-text-primary)] shadow-sm transition hover:bg-[var(--color-surface)]"
                >
                  이력보기
                </button>
              </div>
            ))
          )}
        </div>

        <div className="mt-auto pt-4">
          <div className="hidden items-center justify-center md:flex">
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => handlePageChange(1)}
                disabled={currentPage === 1}
                className="h-10 rounded-lg px-3 text-[14px] font-semibold text-[var(--color-text-primary)] transition hover:bg-[var(--color-background)] disabled:cursor-not-allowed disabled:text-[var(--color-text-muted)] disabled:hover:bg-transparent"
              >
                처음
              </button>

              <button
                type="button"
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="h-10 rounded-lg px-3 text-[14px] font-semibold text-[var(--color-text-primary)] transition hover:bg-[var(--color-background)] disabled:cursor-not-allowed disabled:text-[var(--color-text-muted)] disabled:hover:bg-transparent"
              >
                이전
              </button>

              {pageNumbers.map((page) => (
                <button
                  key={page}
                  type="button"
                  onClick={() => handlePageChange(page)}
                  className={`h-10 min-w-10 rounded-lg px-3 text-[14px] font-semibold transition ${
                    page === currentPage
                      ? 'bg-[var(--color-primary)] text-[var(--color-white)]'
                      : 'text-[var(--color-text-primary)] hover:bg-[var(--color-background)]'
                  }`}
                >
                  {page}
                </button>
              ))}

              <button
                type="button"
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="h-10 rounded-lg px-3 text-[14px] font-semibold text-[var(--color-text-primary)] transition hover:bg-[var(--color-background)] disabled:cursor-not-allowed disabled:text-[var(--color-text-muted)] disabled:hover:bg-transparent"
              >
                다음
              </button>

              <button
                type="button"
                onClick={() => handlePageChange(totalPages)}
                disabled={currentPage === totalPages}
                className="h-10 rounded-lg px-3 text-[14px] font-semibold text-[var(--color-text-primary)] transition hover:bg-[var(--color-background)] disabled:cursor-not-allowed disabled:text-[var(--color-text-muted)] disabled:hover:bg-transparent"
              >
                마지막
              </button>
            </div>
          </div>

          <div className="flex items-center justify-center gap-4 md:hidden">
            <button
              type="button"
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className="h-10 rounded-lg px-3 text-[15px] font-semibold text-[var(--color-text-primary)] transition hover:bg-[var(--color-background)] disabled:cursor-not-allowed disabled:text-[var(--color-text-muted)] disabled:hover:bg-transparent"
            >
              이전
            </button>

            <span className="text-[15px] font-semibold text-[var(--color-text-primary)]">
              {currentPage} / {totalPages}
            </span>

            <button
              type="button"
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="h-10 rounded-lg px-3 text-[15px] font-semibold text-[var(--color-text-primary)] transition hover:bg-[var(--color-background)] disabled:cursor-not-allowed disabled:text-[var(--color-text-muted)] disabled:hover:bg-transparent"
            >
              다음
            </button>
          </div>
        </div>
      </div>

      {isHistoryModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[color:var(--color-text-primary)]/30 px-4">
          <div className="max-h-[90vh] w-full max-w-4xl overflow-y-auto rounded-2xl border border-[var(--color-border)] bg-[var(--color-white)] p-4 shadow-xl md:p-6">
            <div className="mb-6 flex items-center justify-between">
              <div>
                <h2 className="text-[24px] font-bold text-[var(--color-text-primary)]">
                  재고 이력
                </h2>
                <p className="mt-1 text-[13px] text-[var(--color-text-secondary)]">
                  {selectedProductName}
                </p>
              </div>

              <button
                type="button"
                onClick={closeHistoryModal}
                className="rounded-md px-1 py-1 hover:bg-[var(--color-background)]"
              >
                <img
                  src="/cancel.svg"
                  alt="닫기"
                  className="h-5 w-5 opacity-70"
                />
              </button>
            </div>

            {historyLoading ? (
              <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-white)] px-4 py-10 text-center text-[14px] text-[var(--color-text-secondary)]">
                이력을 불러오는 중입니다.
              </div>
            ) : productHistory.length === 0 ? (
              <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-white)] px-4 py-10 text-center text-[14px] text-[var(--color-text-secondary)]">
                조회된 이력이 없습니다.
              </div>
            ) : (
              <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-white)]">
                {productHistory.map((history, index) => (
                  <div
                    key={history.id}
                    className={`flex items-center justify-between gap-4 px-4 py-4 ${
                      index !== productHistory.length - 1
                        ? 'border-b border-[var(--color-border)]'
                        : ''
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--color-background)] text-[11px] font-semibold text-[var(--color-primary)]">
                        {index + 1}
                      </div>

                      <div>
                        <p className="text-[14px] font-semibold text-[var(--color-text-primary)]">
                          {getMovementLabel(history.type)}
                        </p>
                        <p className="mt-1 text-[12px] text-[var(--color-text-secondary)]">
                          {formatQuantity(history.type, history.quantity)} /
                          재고 {history.stockAfter.toLocaleString()}개
                        </p>
                      </div>
                    </div>

                    <div className="text-right">
                      <p className="text-[13px] font-medium text-[var(--color-text-primary)]">
                        {formatDateTime(history.createdAt)}
                      </p>
                      <p className="mt-1 text-[11px] text-[var(--color-text-muted)]">
                        사유: {history.memo || '-'}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {isAdjustModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[color:var(--color-text-primary)]/30 px-4">
          <div className="w-full max-w-2xl rounded-2xl border border-[var(--color-border)] bg-[var(--color-white)] p-4 shadow-xl md:p-6">
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-[24px] font-bold text-[var(--color-text-primary)]">
                재고 조정
              </h2>
              <button
                type="button"
                onClick={closeAdjustModal}
                className="rounded-md px-1 py-1 hover:bg-[var(--color-background)]"
              >
                <img
                  src="/cancel.svg"
                  alt="닫기"
                  className="h-5 w-5 opacity-70"
                />
              </button>
            </div>

            {adjustError && (
              <div className="mb-4 rounded-lg border border-[var(--color-danger)] bg-[var(--color-white)] px-4 py-3 text-[14px] text-[var(--color-danger)]">
                {adjustError}
              </div>
            )}

            <div className="grid grid-cols-1 gap-4">
              <div>
                <label className="mb-2 block text-[13px] font-semibold text-[var(--color-text-secondary)]">
                  상품
                </label>

                <div className="mb-2">
                  <input
                    type="text"
                    value={productKeyword}
                    onChange={(e) => setProductKeyword(e.target.value)}
                    placeholder="상품 코드 또는 상품명을 검색해 주세요."
                    className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-white)] px-4 py-3 text-[14px] text-[var(--color-text-primary)] outline-none transition placeholder:text-[var(--color-input-placeholder)] focus:border-[var(--color-primary)]"
                  />
                </div>

                <div className="relative">
                  <select
                    value={adjustForm.productId}
                    onChange={(e) =>
                      handleChangeAdjustForm('productId', e.target.value)
                    }
                    className="w-full appearance-none rounded-lg border border-[var(--color-border)] bg-[var(--color-white)] px-4 py-3 pr-11 text-[14px] font-medium text-[var(--color-text-primary)] outline-none transition focus:border-[var(--color-primary)]"
                  >
                    <option value="">상품을 선택해 주세요.</option>
                    {filteredProducts.length === 0 ? (
                      <option value="" disabled>
                        검색 결과가 없습니다.
                      </option>
                    ) : (
                      filteredProducts.map((product) => (
                        <option key={product.id} value={product.id}>
                          {product.code} | {product.name}
                        </option>
                      ))
                    )}
                  </select>

                  <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-[14px] text-[var(--color-primary)]">
                    ▼
                  </span>
                </div>
              </div>

              <div>
                <label className="mb-2 block text-[13px] font-semibold text-[var(--color-text-secondary)]">
                  조정 수량
                </label>
                <input
                  type="number"
                  value={adjustForm.quantity}
                  onChange={(e) =>
                    handleChangeAdjustForm('quantity', e.target.value)
                  }
                  placeholder="증가는 양수, 차감은 음수로 입력해 주세요."
                  className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-white)] px-4 py-3 text-[14px] text-[var(--color-text-primary)] outline-none transition placeholder:text-[var(--color-input-placeholder)] focus:border-[var(--color-primary)]"
                />
              </div>

              <div>
                <label className="mb-2 block text-[13px] font-semibold text-[var(--color-text-secondary)]">
                  사유
                </label>
                <input
                  type="text"
                  value={adjustForm.memo}
                  onChange={(e) =>
                    handleChangeAdjustForm('memo', e.target.value)
                  }
                  placeholder="사유를 입력해 주세요."
                  className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-white)] px-4 py-3 text-[14px] text-[var(--color-text-primary)] outline-none transition placeholder:text-[var(--color-input-placeholder)] focus:border-[var(--color-primary)]"
                />
              </div>
            </div>

            <div className="mt-6 flex flex-col-reverse gap-3 md:flex-row md:items-center md:justify-end">
              <button
                type="button"
                onClick={closeAdjustModal}
                className="rounded-lg border border-[var(--color-border)] bg-[var(--color-white)] px-4 py-3 text-[14px] font-semibold text-[var(--color-text-primary)]"
              >
                취소
              </button>
              <button
                type="button"
                onClick={handleSubmitAdjust}
                disabled={adjustLoading}
                className="rounded-lg bg-[var(--color-primary)] px-4 py-3 text-[14px] font-semibold text-[var(--color-white)] transition hover:bg-[var(--color-primary-hover)] disabled:cursor-not-allowed disabled:bg-[var(--color-secondary)]"
              >
                {adjustLoading ? '저장 중입니다.' : '저장'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
