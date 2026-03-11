'use client';

import { useEffect, useState } from 'react';

type PartnerType = 'CUSTOMER' | 'SUPPLIER';

type Partner = {
  id: number;
  name: string;
  type: PartnerType;
  phone: string;
  email: string | null;
  isActive: boolean;
  createdAt: string;
};

type PartnerForm = {
  name: string;
  type: PartnerType;
  phone: string;
  email: string;
  isActive: boolean;
};

type PartnerFormErrors = Partial<Record<keyof PartnerForm, string>> & {
  submit?: string;
};

const initialForm: PartnerForm = {
  name: '',
  type: 'CUSTOMER',
  phone: '',
  email: '',
  isActive: true,
};

const initialErrors: PartnerFormErrors = {};
const PAGE_SIZE = 8;

export default function partnersPage() {
  const [partners, setpartners] = useState<Partner[]>([]);
  const [search, setSearch] = useState('');
  const [inputValue, setInputValue] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [selectedPartnerId, setSelectedPartnerId] = useState<number | null>(
    null,
  );
  const [form, setForm] = useState<PartnerForm>(initialForm);
  const [formErrors, setFormErrors] =
    useState<PartnerFormErrors>(initialErrors);
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

  const getPartnerTypeLabel = (type: PartnerType) => {
    return type === 'CUSTOMER' ? '고객사' : '공급처';
  };

  const fetchpartners = async (keyword = '', page = 1) => {
    try {
      setLoading(true);
      setListError('');

      const searchParams = new URLSearchParams();

      if (keyword) {
        searchParams.set('search', keyword);
      }

      searchParams.set('page', String(page));
      searchParams.set('pageSize', String(PAGE_SIZE));

      const response = await fetch(`/api/partners?${searchParams.toString()}`, {
        method: 'GET',
        cache: 'no-store',
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || '거래처 목록을 불러오는 중 오류가 발생했습니다.',
        );
      }

      setpartners(Array.isArray(data.items) ? data.items : []);
      setTotalPages(Number(data.totalPages ?? 1));
      setCurrentPage(Number(data.currentPage ?? page));
    } catch (error) {
      console.error(error);
      setListError(
        error instanceof Error
          ? error.message
          : '거래처 목록을 불러오는 중 오류가 발생했습니다.',
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchpartners('', 1);
  }, []);

  const openCreateModal = () => {
    setIsEditMode(false);
    setSelectedPartnerId(null);
    setForm(initialForm);
    setFormErrors(initialErrors);
    setIsModalOpen(true);
  };

  const openEditModal = async (PartnerId: number) => {
    try {
      setSubmitLoading(true);
      setFormErrors(initialErrors);

      const response = await fetch(`/api/partners/${PartnerId}`, {
        method: 'GET',
        cache: 'no-store',
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || '거래처 정보를 불러오는 중 오류가 발생했습니다.',
        );
      }

      setIsEditMode(true);
      setSelectedPartnerId(PartnerId);
      setForm({
        name: data.name ?? '',
        type: data.type ?? 'CUSTOMER',
        phone: data.phone ?? '',
        email: data.email ?? '',
        isActive: Boolean(data.isActive),
      });
      setIsModalOpen(true);
    } catch (error) {
      console.error(error);
      setListError(
        error instanceof Error
          ? error.message
          : '거래처 정보를 불러오는 중 오류가 발생했습니다.',
      );
    } finally {
      setSubmitLoading(false);
    }
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setIsEditMode(false);
    setSelectedPartnerId(null);
    setForm(initialForm);
    setFormErrors(initialErrors);
  };

  const handleSearch = async () => {
    setSearch(inputValue);
    setCurrentPage(1);
    await fetchpartners(inputValue, 1);
  };

  const handlePageChange = async (page: number) => {
    if (page < 1 || page > totalPages || page === currentPage) {
      return;
    }

    await fetchpartners(search, page);
  };

  const handleChangeForm = (
    key: keyof PartnerForm,
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
    const errors: PartnerFormErrors = {};

    if (!form.name.trim()) {
      errors.name = '거래처명을 입력해 주세요.';
    }

    if (!form.phone.trim()) {
      errors.phone = '연락처를 입력해 주세요.';
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
        name: form.name.trim(),
        type: form.type,
        phone: form.phone.trim(),
        email: form.email.trim() || null,
        isActive: form.isActive,
      };

      const url =
        isEditMode && selectedPartnerId
          ? `/api/partners/${selectedPartnerId}`
          : '/api/partners';

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
        const nextErrors: PartnerFormErrors = {};

        nextErrors.submit =
          data.message || '거래처 저장 중 오류가 발생했습니다.';

        setFormErrors(nextErrors);
        return;
      }

      closeModal();
      await fetchpartners(search, currentPage);
    } catch (error) {
      console.error(error);
      setFormErrors({
        submit:
          error instanceof Error
            ? error.message
            : '거래처 저장 중 오류가 발생했습니다.',
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
                placeholder="거래처명 또는 연락처를 입력해 주세요."
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
              거래처 등록
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
                    거래처명
                  </th>
                  <th className="border-b border-[var(--color-border)] px-4 py-3 text-center text-[13px] font-semibold text-[var(--color-text-secondary)]">
                    구분
                  </th>
                  <th className="border-b border-[var(--color-border)] px-4 py-3 text-center text-[13px] font-semibold text-[var(--color-text-secondary)]">
                    연락처
                  </th>
                  <th className="border-b border-[var(--color-border)] px-4 py-3 text-center text-[13px] font-semibold text-[var(--color-text-secondary)]">
                    이메일
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
                      colSpan={6}
                      className="px-4 py-10 text-center text-[15px] text-[var(--color-text-secondary)]"
                    >
                      거래처 목록을 불러오는 중입니다.
                    </td>
                  </tr>
                ) : partners.length === 0 ? (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-4 py-10 text-center text-[15px] text-[var(--color-text-secondary)]"
                    >
                      조회된 거래처가 없습니다.
                    </td>
                  </tr>
                ) : (
                  partners.map((Partner) => (
                    <tr
                      key={Partner.id}
                      className="border-b border-[var(--color-border)] last:border-b-0"
                    >
                      <td className="px-4 py-4 text-center text-[15px] text-[var(--color-text-primary)]">
                        {Partner.name}
                      </td>
                      <td className="px-4 py-4 text-center text-[15px] text-[var(--color-text-primary)]">
                        {getPartnerTypeLabel(Partner.type)}
                      </td>
                      <td className="break-all px-4 py-4 text-center text-[15px] text-[var(--color-text-primary)]">
                        {Partner.phone}
                      </td>
                      <td className="break-all px-4 py-4 text-center text-[15px] text-[var(--color-text-primary)]">
                        {Partner.email || '-'}
                      </td>
                      <td className="px-4 py-4 text-center">
                        <span
                          className={`inline-flex rounded-full border px-2.5 py-[3px] text-[10px] font-semibold ${
                            Partner.isActive
                              ? 'border-[var(--color-success-border)] bg-[var(--color-white)] text-[var(--color-success)]'
                              : 'border-[var(--color-danger-border)] bg-[var(--color-white)] text-[var(--color-danger)]'
                          }`}
                        >
                          {Partner.isActive ? '활성' : '비활성'}
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            type="button"
                            onClick={() => openEditModal(Partner.id)}
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
            <div className="col-span-1 rounded-xl border border-[var(--color-border)] bg-[var(--color-white)] px-4 py-10 text-center text-[14px] text-[var(--color-text-secondary)] sm:col-span-2">
              거래처 목록을 불러오는 중입니다.
            </div>
          ) : partners.length === 0 ? (
            <div className="col-span-1 rounded-xl border border-[var(--color-border)] bg-[var(--color-white)] px-4 py-10 text-center text-[14px] text-[var(--color-text-secondary)] sm:col-span-2">
              조회된 거래처가 없습니다.
            </div>
          ) : (
            partners.map((Partner) => (
              <div
                key={Partner.id}
                className="flex flex-col rounded-xl border border-[var(--color-border)] bg-[var(--color-white)] p-4"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="truncate text-[11px] text-[var(--color-text-muted)]">
                      {getPartnerTypeLabel(Partner.type)}
                    </p>
                    <p className="mt-1 truncate text-[14px] font-semibold text-[var(--color-text-primary)]">
                      {Partner.name}
                    </p>
                  </div>

                  <span
                    className={`shrink-0 rounded-full border px-2 py-[2px] text-[10px] font-semibold ${
                      Partner.isActive
                        ? 'border-[var(--color-success)] text-[var(--color-success)]'
                        : 'border-[var(--color-danger)] text-[var(--color-danger)]'
                    }`}
                  >
                    {Partner.isActive ? '활성' : '비활성'}
                  </span>
                </div>

                <div className="my-3 h-px bg-[var(--color-border)]" />

                <div className="space-y-1 text-[12px]">
                  <div className="flex items-center justify-between">
                    <span className="text-[var(--color-text-muted)]">
                      연락처
                    </span>
                    <span className="font-medium text-[var(--color-text-primary)]">
                      {Partner.phone}
                    </span>
                  </div>

                  <div className="flex items-center justify-between gap-3">
                    <span className="text-[var(--color-text-muted)]">
                      이메일
                    </span>
                    <span className="truncate font-medium text-[var(--color-text-primary)]">
                      {Partner.email || '-'}
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => openEditModal(Partner.id)}
                  className="mt-4 rounded-lg border border-[var(--color-border)] py-2 text-[13px] font-semibold text-[var(--color-text-primary)] transition hover:bg-[var(--color-surface)]"
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
              className="h-10 rounded-lg px-3 text-[14px] font-semibold text-[var(--color-text-primary)] transition hover:bg-[var(--color-background)] disabled:cursor-not-allowed disabled:text-[var(--color-text-muted)] disabled:hover:bg-transparent"
            >
              이전
            </button>

            <span className="text-[14px] font-semibold text-[var(--color-text-primary)]">
              {currentPage} / {totalPages}
            </span>

            <button
              type="button"
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="h-10 rounded-lg px-3 text-[14px] font-semibold text-[var(--color-text-primary)] transition hover:bg-[var(--color-background)] disabled:cursor-not-allowed disabled:text-[var(--color-text-muted)] disabled:hover:bg-transparent"
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
                {isEditMode ? '거래처 수정' : '거래처 등록'}
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
                  거래처명
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
                  구분
                </label>
                <div className="relative">
                  <select
                    value={form.type}
                    onChange={(e) => handleChangeForm('type', e.target.value)}
                    className={`${getInputClass(false)} appearance-none pr-11 font-medium`}
                  >
                    <option value="CUSTOMER">고객사</option>
                    <option value="SUPPLIER">공급사</option>
                  </select>

                  <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-[14px] text-[var(--color-primary)]">
                    ▼
                  </span>
                </div>
              </div>

              <div>
                <label className="mb-2 block text-[13px] font-semibold text-[var(--color-text-secondary)]">
                  연락처
                </label>
                <input
                  type="text"
                  value={form.phone}
                  onChange={(e) => handleChangeForm('phone', e.target.value)}
                  className={getInputClass(!!formErrors.phone)}
                />
                {formErrors.phone && (
                  <p className="mt-1 text-[11px] text-[var(--color-danger)]">
                    {formErrors.phone}
                  </p>
                )}
              </div>

              <div>
                <label className="mb-2 block text-[13px] font-semibold text-[var(--color-text-secondary)]">
                  이메일
                </label>
                <input
                  type="text"
                  value={form.email}
                  onChange={(e) => handleChangeForm('email', e.target.value)}
                  className={getInputClass(false)}
                />
              </div>

              <div>
                <label className="mb-2 block text-[13px] font-semibold text-[var(--color-text-secondary)]">
                  사용 여부
                </label>
                <div className="relative">
                  <select
                    value={form.isActive ? 'true' : 'false'}
                    onChange={(e) =>
                      handleChangeForm('isActive', e.target.value === 'true')
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
