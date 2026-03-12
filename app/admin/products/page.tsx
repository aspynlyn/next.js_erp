'use client';

import { useEffect, useState } from 'react';

type Product = {
  id: number;
  code: string;
  name: string;
  price: number;
  safetyStock: number;
  currentStock: number;
  isSale: boolean;
  createdAt: string;
};

type ProductForm = {
  code: string;
  name: string;
  price: string;
  safetyStock: string;
  currentStock: string;
  isSale: boolean;
};

type ProductFormErrors = Partial<Record<keyof ProductForm, string>> & {
  submit?: string;
};

const initialForm: ProductForm = {
  code: '',
  name: '',
  price: '',
  safetyStock: '',
  currentStock: '0',
  isSale: true,
};

const initialErrors: ProductFormErrors = {};
const PAGE_SIZE = 8;

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [search, setSearch] = useState('');
  const [inputValue, setInputValue] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [selectedProductId, setSelectedProductId] = useState<number | null>(
    null,
  );
  const [form, setForm] = useState<ProductForm>(initialForm);
  const [formErrors, setFormErrors] =
    useState<ProductFormErrors>(initialErrors);
  const [listError, setListError] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const inputBaseClass =
    'w-full rounded-lg border px-4 py-3 text-[14px] text-[var(--color-text-primary)] outline-none transition placeholder:text-[var(--color-input-placeholder)]';

  const getInputClass = (hasError?: boolean) =>
    `${inputBaseClass} ${
      hasError
        ? 'border-[var(--color-danger)] bg-[var(--color-white)] focus:border-[var(--color-danger)]'
        : 'border-[var(--color-border)] bg-[var(--color-white)] focus:border-[var(--color-primary)]'
    }`;

  const fetchProducts = async (keyword = '', page = 1) => {
    try {
      setLoading(true);
      setListError('');

      const searchParams = new URLSearchParams();

      if (keyword) {
        searchParams.set('search', keyword);
      }

      searchParams.set('page', String(page));
      searchParams.set('pageSize', String(PAGE_SIZE));

      const response = await fetch(`/api/products?${searchParams.toString()}`, {
        method: 'GET',
        cache: 'no-store',
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || '상품 목록을 불러오는 중 오류가 발생했습니다.',
        );
      }

      setProducts(Array.isArray(data.items) ? data.items : []);
      setTotalPages(Number(data.totalPages ?? 1));
      setCurrentPage(Number(data.currentPage ?? page));
    } catch (error) {
      console.error(error);
      setListError(
        error instanceof Error
          ? error.message
          : '상품 목록을 불러오는 중 오류가 발생했습니다.',
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts('', 1);
  }, []);

  const openCreateModal = () => {
    setIsEditMode(false);
    setSelectedProductId(null);
    setForm(initialForm);
    setFormErrors(initialErrors);
    setIsModalOpen(true);
  };

  const openEditModal = async (productId: number) => {
    try {
      setSubmitLoading(true);
      setFormErrors(initialErrors);

      const response = await fetch(`/api/products/${productId}`, {
        method: 'GET',
        cache: 'no-store',
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || '상품 정보를 불러오는 중 오류가 발생했습니다.',
        );
      }

      setIsEditMode(true);
      setSelectedProductId(productId);
      setForm({
        code: data.code ?? '',
        name: data.name ?? '',
        price: String(data.price ?? ''),
        safetyStock: String(data.safetyStock ?? ''),
        currentStock: String(data.currentStock ?? 0),
        isSale: Boolean(data.isSale),
      });
      setIsModalOpen(true);
    } catch (error) {
      console.error(error);
      setListError(
        error instanceof Error
          ? error.message
          : '상품 정보를 불러오는 중 오류가 발생했습니다.',
      );
    } finally {
      setSubmitLoading(false);
    }
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setIsEditMode(false);
    setSelectedProductId(null);
    setForm(initialForm);
    setFormErrors(initialErrors);
  };

  const handleSearch = async () => {
    setSearch(inputValue);
    setCurrentPage(1);
    await fetchProducts(inputValue, 1);
  };

  const handlePageChange = async (page: number) => {
    if (page < 1 || page > totalPages || page === currentPage) {
      return;
    }

    await fetchProducts(search, page);
  };

  const handleChangeForm = (
    key: keyof ProductForm,
    value: string | boolean,
  ) => {
    setForm((prev) => ({
      ...prev,
      [key]: value,
    }));

    setFormErrors((prev) => ({
      ...prev,
      [key]: '',
      submit: '',
    }));
  };

  const validateForm = () => {
    const errors: ProductFormErrors = {};

    if (!form.code.trim()) {
      errors.code = '상품 코드를 입력해 주세요.';
    }

    if (!form.name.trim()) {
      errors.name = '상품명을 입력해 주세요.';
    }

    if (Number.isNaN(Number(form.price)) || Number(form.price) < 0) {
      errors.price = '단가는 0 이상의 숫자로 입력해 주세요.';
    }

    if (
      Number.isNaN(Number(form.safetyStock)) ||
      Number(form.safetyStock) < 0
    ) {
      errors.safetyStock = '안전 재고는 0 이상의 숫자로 입력해 주세요.';
    }

    if (
      Number.isNaN(Number(form.currentStock)) ||
      Number(form.currentStock) < 0
    ) {
      errors.currentStock = '현재 재고는 0 이상의 숫자로 입력해 주세요.';
    }

    return errors;
  };

  const handleSubmit = async () => {
    const errors = validateForm();

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    try {
      setSubmitLoading(true);
      setFormErrors(initialErrors);

      const payload = {
        code: form.code.trim(),
        name: form.name.trim(),
        price: Number(form.price),
        safetyStock: Number(form.safetyStock),
        currentStock: Number(form.currentStock),
        isSale: form.isSale,
      };

      const url =
        isEditMode && selectedProductId
          ? `/api/products/${selectedProductId}`
          : '/api/products';

      const method = isEditMode ? 'PATCH' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        const nextErrors: ProductFormErrors = {};

        if (data.message?.includes('상품코드')) {
          nextErrors.code = data.message;
        } else {
          nextErrors.submit =
            data.message || '상품 저장 중 오류가 발생했습니다.';
        }

        setFormErrors(nextErrors);
        return;
      }

      closeModal();
      await fetchProducts(search, currentPage);
    } catch (error) {
      console.error(error);
      setFormErrors({
        submit:
          error instanceof Error
            ? error.message
            : '상품 저장 중 오류가 발생했습니다.',
      });
    } finally {
      setSubmitLoading(false);
    }
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
                  if (e.key === 'Enter') handleSearch();
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
              onClick={openCreateModal}
              className="h-12 w-full rounded-lg bg-[var(--color-primary)] text-[14px] font-semibold text-[var(--color-white)] transition hover:bg-[var(--color-primary-hover)] md:w-[96px] md:shrink-0"
            >
              상품 등록
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
                  <th className="border-b border-[var(--color-border)] px-4 py-3 text-center text-[13px] font-semibold text-[var(--color-text-secondary)]">
                    상품 코드
                  </th>
                  <th className="border-b border-[var(--color-border)] px-4 py-3 text-center text-[13px] font-semibold text-[var(--color-text-secondary)]">
                    상품명
                  </th>
                  <th className="border-b border-[var(--color-border)] px-4 py-3 text-center text-[13px] font-semibold text-[var(--color-text-secondary)]">
                    단가
                  </th>
                  <th className="border-b border-[var(--color-border)] px-4 py-3 text-center text-[13px] font-semibold text-[var(--color-text-secondary)]">
                    안전 재고
                  </th>
                  <th className="border-b border-[var(--color-border)] px-4 py-3 text-center text-[13px] font-semibold text-[var(--color-text-secondary)]">
                    현재 재고
                  </th>
                  <th className="border-b border-[var(--color-border)] px-4 py-3 text-center text-[13px] font-semibold text-[var(--color-text-secondary)]">
                    상태
                  </th>
                  <th className="border-b border-[var(--color-border)] px-4 py-3 text-center text-[13px] font-semibold text-[var(--color-text-secondary)]">
                    관리
                  </th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td
                      colSpan={7}
                      className="px-4 py-10 text-center text-[15px] text-[var(--color-text-secondary)]"
                    >
                      상품 목록을 불러오는 중입니다.
                    </td>
                  </tr>
                ) : products.length === 0 ? (
                  <tr>
                    <td
                      colSpan={7}
                      className="px-4 py-10 text-center text-[15px] text-[var(--color-text-secondary)]"
                    >
                      조회된 상품이 없습니다.
                    </td>
                  </tr>
                ) : (
                  products.map((product) => (
                    <tr
                      key={product.id}
                      className="border-b border-[var(--color-border)] last:border-b-0"
                    >
                      <td className="px-4 py-4 text-center text-[15px] text-[var(--color-text-primary)]">
                        {product.code}
                      </td>
                      <td className="px-4 py-4 text-center text-[15px] text-[var(--color-text-primary)]">
                        {product.name}
                      </td>
                      <td className="px-4 py-4 text-center text-[15px] text-[var(--color-text-primary)]">
                        {product.price.toLocaleString()}원
                      </td>
                      <td className="px-4 py-4 text-center text-[15px] text-[var(--color-text-primary)]">
                        {product.safetyStock.toLocaleString()}개
                      </td>
                      <td className="px-4 py-4 text-center text-[15px] text-[var(--color-text-primary)]">
                        {product.currentStock.toLocaleString()}개
                      </td>
                      <td className="px-4 py-4 text-center">
                        <span
                          className={`inline-flex rounded-full border px-2.5 py-[3px] text-[10px] font-semibold ${
                            product.isSale
                              ? 'border-[var(--color-success-border)] bg-[var(--color-white)] text-[var(--color-success)]'
                              : 'border-[var(--color-danger-border)] bg-[var(--color-white)] text-[var(--color-danger)]'
                          }`}
                        >
                          {product.isSale ? '활성' : '비활성'}
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            type="button"
                            onClick={() => openEditModal(product.id)}
                            className="rounded-lg border border-[var(--color-border)] px-4 py-2 text-[14px] font-semibold text-[var(--color-text-primary)] transition hover:bg-[var(--color-surface)]"
                          >
                            수정
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
              상품 목록을 불러오는 중입니다.
            </div>
          ) : products.length === 0 ? (
            <div className="col-span-1 rounded-xl border border-[var(--color-border)] bg-[var(--color-white)] px-4 py-10 text-center text-[15px] text-[var(--color-text-secondary)] sm:col-span-2">
              조회된 상품이 없습니다.
            </div>
          ) : (
            products.map((product) => (
              <div
                key={product.id}
                className="flex flex-col rounded-xl border border-[var(--color-border)] bg-[var(--color-white)] p-4"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="truncate text-[12px] text-[var(--color-text-muted)]">
                      {product.code}
                    </p>
                    <p className="mt-1 truncate text-[15px] font-semibold text-[var(--color-text-primary)]">
                      {product.name}
                    </p>
                  </div>

                  <span
                    className={`shrink-0 rounded-full border px-2 py-[2px] text-[11px] font-semibold ${
                      product.isSale
                        ? 'border-[var(--color-success)] text-[var(--color-success)]'
                        : 'border-[var(--color-danger)] text-[var(--color-danger)]'
                    }`}
                  >
                    {product.isSale ? '활성' : '비활성'}
                  </span>
                </div>

                <div className="my-3 h-px bg-[var(--color-border)]" />

                <div className="space-y-2 text-[13px]">
                  <div className="flex items-center justify-between">
                    <span className="text-[var(--color-text-muted)]">단가</span>
                    <span className="font-medium text-[var(--color-text-primary)]">
                      {product.price.toLocaleString()}원
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-[var(--color-text-muted)]">
                      현재 재고
                    </span>
                    <span className="font-medium text-[var(--color-text-primary)]">
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

                <button
                  type="button"
                  onClick={() => openEditModal(product.id)}
                  className="mt-4 rounded-lg border border-[var(--color-border)] py-2.5 text-[14px] font-semibold text-[var(--color-text-primary)] transition hover:bg-[var(--color-surface)]"
                >
                  수정
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

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[color:var(--color-text-primary)]/30 px-4">
          <div className="w-full max-w-2xl rounded-2xl border border-[var(--color-border)] bg-[var(--color-white)] p-4 shadow-xl md:p-6">
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-[24px] font-bold text-[var(--color-text-primary)]">
                {isEditMode ? '상품 수정' : '상품 등록'}
              </h2>
              <button
                type="button"
                onClick={closeModal}
                className="rounded-md px-1 py-1 hover:bg-[var(--color-background)]"
              >
                <img
                  src="/cancel.svg"
                  alt="닫기"
                  className="h-5 w-5 opacity-70"
                />
              </button>
            </div>

            {formErrors.submit && (
              <div className="mb-4 rounded-lg border border-[var(--color-danger)] bg-[var(--color-white)] px-4 py-3 text-[14px] text-[var(--color-danger)]">
                {formErrors.submit}
              </div>
            )}

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <label className="mb-2 block text-[13px] font-semibold text-[var(--color-text-secondary)]">
                  상품 코드
                </label>
                <input
                  type="text"
                  value={form.code}
                  onChange={(e) => handleChangeForm('code', e.target.value)}
                  className={getInputClass(!!formErrors.code)}
                />
                {formErrors.code && (
                  <p className="mt-1 text-[11px] text-[var(--color-danger)]">
                    {formErrors.code}
                  </p>
                )}
              </div>

              <div>
                <label className="mb-2 block text-[13px] font-semibold text-[var(--color-text-secondary)]">
                  상품명
                </label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => handleChangeForm('name', e.target.value)}
                  className={getInputClass(!!formErrors.name)}
                />
                {formErrors.name && (
                  <p className="mt-1 text-[11px] text-[var(--color-danger)]">
                    {formErrors.name}
                  </p>
                )}
              </div>

              <div>
                <label className="mb-2 block text-[13px] font-semibold text-[var(--color-text-secondary)]">
                  단가
                </label>
                <input
                  type="number"
                  value={form.price}
                  onChange={(e) => handleChangeForm('price', e.target.value)}
                  className={getInputClass(!!formErrors.price)}
                />
                {formErrors.price && (
                  <p className="mt-1 text-[11px] text-[var(--color-danger)]">
                    {formErrors.price}
                  </p>
                )}
              </div>

              <div>
                <label className="mb-2 block text-[13px] font-semibold text-[var(--color-text-secondary)]">
                  안전 재고
                </label>
                <input
                  type="number"
                  value={form.safetyStock}
                  onChange={(e) =>
                    handleChangeForm('safetyStock', e.target.value)
                  }
                  className={getInputClass(!!formErrors.safetyStock)}
                />
                {formErrors.safetyStock && (
                  <p className="mt-1 text-[11px] text-[var(--color-danger)]">
                    {formErrors.safetyStock}
                  </p>
                )}
              </div>

              <div>
                <label className="mb-2 block text-[13px] font-semibold text-[var(--color-text-secondary)]">
                  현재 재고
                </label>
                <input
                  type="number"
                  value={form.currentStock}
                  onChange={(e) =>
                    handleChangeForm('currentStock', e.target.value)
                  }
                  className={getInputClass(!!formErrors.currentStock)}
                />
                {formErrors.currentStock && (
                  <p className="mt-1 text-[11px] text-[var(--color-danger)]">
                    {formErrors.currentStock}
                  </p>
                )}
              </div>

              <div>
                <label className="mb-2 block text-[13px] font-semibold text-[var(--color-text-secondary)]">
                  판매 여부
                </label>
                <div className="relative">
                  <select
                    value={form.isSale ? 'true' : 'false'}
                    onChange={(e) =>
                      handleChangeForm('isSale', e.target.value === 'true')
                    }
                    className={`${getInputClass(false)} appearance-none pr-11 font-medium`}
                  >
                    <option value="true">활성</option>
                    <option value="false">비활성</option>
                  </select>

                  <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-[14px] text-[var(--color-primary)]">
                    ▼
                  </span>
                </div>
              </div>
            </div>

            <div className="mt-6 flex flex-col-reverse gap-3 md:flex-row md:items-center md:justify-end">
              <button
                type="button"
                onClick={closeModal}
                className="rounded-lg border border-[var(--color-border)] bg-[var(--color-white)] px-4 py-3 text-[14px] font-semibold text-[var(--color-text-primary)]"
              >
                취소
              </button>
              <button
                type="button"
                onClick={handleSubmit}
                disabled={submitLoading}
                className="rounded-lg bg-[var(--color-primary)] px-4 py-3 text-[14px] font-semibold text-[var(--color-white)] transition hover:bg-[var(--color-primary-hover)] disabled:cursor-not-allowed disabled:bg-[var(--color-secondary)]"
              >
                {submitLoading ? '저장 중입니다.' : '저장'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}