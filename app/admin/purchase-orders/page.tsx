'use client';

import { useEffect, useMemo, useState } from 'react';

type PurchaseOrderStatus = 'DRAFT' | 'CONFIRMED' | 'COMPLETED' | 'CANCELED';
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

type PurchaseOrderStatusLog = {
  id: number;
  purchaseId: number;
  status: PurchaseOrderStatus;
  createdAt: string;
};

type PurchaseOrderItem = {
  purchaseId: number;
  productId: number;
  quantity: number;
  unitPrice: number;
  product: {
    id: number;
    code: string;
    name: string;
    price: number;
  };
};

type PurchaseOrder = {
  id: number;
  partnerId: number;
  status: PurchaseOrderStatus;
  createdAt: string;
  partner: {
    id: number;
    name: string;
    type: PartnerType;
    phone: string;
    email: string | null;
    isActive: boolean;
  };
  purchaseOrderProducts: PurchaseOrderItem[];
  purchaseOrderStatuses: PurchaseOrderStatusLog[];
};

type PurchaseOrderListResponse = {
  items: PurchaseOrder[];
  totalCount: number;
  totalPages: number;
  currentPage: number;
};

type PurchaseOrderFormItem = {
  productId: string;
  quantity: string;
  unitPrice: string;
  productKeyword: string;
};

type PurchaseOrderForm = {
  partnerId: string;
  partnerKeyword: string;
  items: PurchaseOrderFormItem[];
};

type PurchaseOrderFormErrors = {
  partnerId?: string;
  items?: string;
  submit?: string;
};

const PAGE_SIZE = 8;

const initialForm: PurchaseOrderForm = {
  partnerId: '',
  partnerKeyword: '',
  items: [
    {
      productId: '',
      quantity: '1',
      unitPrice: '',
      productKeyword: '',
    },
  ],
};

const initialErrors: PurchaseOrderFormErrors = {};

export default function PurchaseOrdersPage() {
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>([]);
  const [suppliers, setSuppliers] = useState<Partner[]>([]);
  const [products, setProducts] = useState<Product[]>([]);

  const [search, setSearch] = useState('');
  const [inputValue, setInputValue] = useState('');

  const [loading, setLoading] = useState(false);
  const [listError, setListError] = useState('');

  const [detailError, setDetailError] = useState('');

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<PurchaseOrder | null>(
    null,
  );

  const [form, setForm] = useState<PurchaseOrderForm>(initialForm);
  const [formErrors, setFormErrors] =
    useState<PurchaseOrderFormErrors>(initialErrors);
  const [submitLoading, setSubmitLoading] = useState(false);

  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const inputBaseClass =
    'w-full rounded-lg border px-4 py-3 text-[15px] md:text-[14px] text-[var(--color-text-primary)] outline-none transition placeholder:text-[var(--color-input-placeholder)]';

  const getInputClass = (hasError?: boolean) =>
    `${inputBaseClass} ${
      hasError
        ? 'border-[var(--color-danger)] bg-[var(--color-white)] focus:border-[var(--color-danger)]'
        : 'border-[var(--color-border)] bg-[var(--color-white)] focus:border-[var(--color-primary)]'
    }`;

  const getStatusLabel = (status: PurchaseOrderStatus) => {
    switch (status) {
      case 'DRAFT':
        return '초안';
      case 'CONFIRMED':
        return '확정';
      case 'COMPLETED':
        return '완료';
      case 'CANCELED':
        return '취소';
      default:
        return status;
    }
  };

  const getStatusClassName = (status: PurchaseOrderStatus) => {
    switch (status) {
      case 'DRAFT':
        return 'border-[var(--color-border)] bg-[var(--color-white)] text-[var(--color-text-secondary)]';
      case 'CONFIRMED':
        return 'border-[var(--color-warning)] bg-[var(--color-white)] text-[var(--color-warning)]';
      case 'COMPLETED':
        return 'border-[var(--color-success)] bg-[var(--color-white)] text-[var(--color-success)]';
      case 'CANCELED':
        return 'border-[var(--color-danger)] bg-[var(--color-white)] text-[var(--color-danger)]';
      default:
        return 'border-[var(--color-border)] bg-[var(--color-white)] text-[var(--color-text-secondary)]';
    }
  };

  const formatDate = (value: string) => {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      return '-';
    }

    return date.toLocaleDateString('ko-KR');
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

  const formatPrice = (value: number) => {
    return `${value.toLocaleString('ko-KR')}원`;
  };

  const getOrderTotalPrice = (order: PurchaseOrder) => {
    return order.purchaseOrderProducts.reduce((acc, item) => {
      return acc + item.quantity * item.unitPrice;
    }, 0);
  };

  const getItemSummaryText = (order: PurchaseOrder) => {
    if (order.purchaseOrderProducts.length === 0) {
      return '-';
    }

    const firstItem = order.purchaseOrderProducts[0];
    const extraCount = order.purchaseOrderProducts.length - 1;

    return `${firstItem.product.name}${
      extraCount > 0 ? ` 외 ${extraCount}건` : ''
    }`;
  };

  const pageNumbers = useMemo(() => {
    const pages: number[] = [];
    const start = Math.max(1, currentPage - 2);
    const end = Math.min(totalPages, currentPage + 2);

    for (let page = start; page <= end; page += 1) {
      pages.push(page);
    }

    return pages;
  }, [currentPage, totalPages]);

  const fetchPurchaseOrders = async (keyword = '', page = 1) => {
    try {
      setLoading(true);
      setListError('');

      const searchParams = new URLSearchParams();

      if (keyword) {
        searchParams.set('search', keyword);
      }

      searchParams.set('page', String(page));
      searchParams.set('pageSize', String(PAGE_SIZE));

      const response = await fetch(
        `/api/purchase-orders?${searchParams.toString()}`,
        {
          method: 'GET',
          cache: 'no-store',
        },
      );

      const data: PurchaseOrderListResponse = await response.json();

      if (!response.ok) {
        throw new Error(
          (data as { message?: string }).message ||
            '발주 목록을 불러오는 중 오류가 발생했습니다.',
        );
      }

      setPurchaseOrders(Array.isArray(data.items) ? data.items : []);
      setTotalPages(Number(data.totalPages ?? 1));
      setCurrentPage(Number(data.currentPage ?? page));
    } catch (error) {
      console.error(error);
      setListError(
        error instanceof Error
          ? error.message
          : '발주 목록을 불러오는 중 오류가 발생했습니다.',
      );
    } finally {
      setLoading(false);
    }
  };

  const fetchSuppliers = async () => {
    try {
      const response = await fetch('/api/partners?page=1&pageSize=999', {
        method: 'GET',
        cache: 'no-store',
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || '공급사 목록을 불러오는 중 오류가 발생했습니다.',
        );
      }

      const items = Array.isArray(data.items) ? data.items : [];
      const supplierItems = items.filter(
        (partner: Partner) => partner.type === 'SUPPLIER' && partner.isActive,
      );

      setSuppliers(supplierItems);
    } catch (error) {
      console.error(error);
      setListError(
        error instanceof Error
          ? error.message
          : '공급사 목록을 불러오는 중 오류가 발생했습니다.',
      );
    }
  };

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
      const saleProducts = items.filter((product: Product) => product.isSale);
      setProducts(saleProducts);
    } catch (error) {
      console.error(error);
      setListError(
        error instanceof Error
          ? error.message
          : '상품 목록을 불러오는 중 오류가 발생했습니다.',
      );
    }
  };

  useEffect(() => {
    fetchPurchaseOrders('', 1);
    fetchSuppliers();
    fetchProducts();
  }, []);

  const openCreateModal = () => {
    setForm(initialForm);
    setFormErrors(initialErrors);
    setIsCreateModalOpen(true);
  };

  const closeCreateModal = () => {
    setIsCreateModalOpen(false);
    setForm(initialForm);
    setFormErrors(initialErrors);
  };

  const openDetailModal = (order: PurchaseOrder) => {
    setDetailError('');
    setSelectedOrder(order);
    setIsDetailModalOpen(true);
  };

  const closeDetailModal = () => {
    setDetailError('');
    setSelectedOrder(null);
    setIsDetailModalOpen(false);
  };

  const handleSearch = async () => {
    setSearch(inputValue);
    setCurrentPage(1);
    await fetchPurchaseOrders(inputValue, 1);
  };

  const handlePageChange = async (page: number) => {
    if (page < 1 || page > totalPages || page === currentPage) {
      return;
    }

    await fetchPurchaseOrders(search, page);
  };

  const handleChangePartner = (partnerId: string) => {
    setForm((prev) => ({
      ...prev,
      partnerId,
    }));

    setFormErrors((prev) => ({
      ...prev,
      partnerId: '',
      submit: '',
    }));
  };

  const getFilteredSuppliers = (keyword: string) => {
    const trimmedKeyword = keyword.trim().toLowerCase();

    if (!trimmedKeyword) {
      return suppliers;
    }

    return suppliers.filter((partner) => {
      return (
        partner.name.toLowerCase().includes(trimmedKeyword) ||
        partner.phone.toLowerCase().includes(trimmedKeyword)
      );
    });
  };

  const handleChangePartnerKeyword = (value: string) => {
    setForm((prev) => ({
      ...prev,
      partnerKeyword: value,
      partnerId: '',
    }));

    setFormErrors((prev) => ({
      ...prev,
      partnerId: '',
      submit: '',
    }));
  };

  const handleSelectPartner = (partnerId: string) => {
    const selectedPartner = suppliers.find(
      (partner) => String(partner.id) === partnerId,
    );

    setForm((prev) => ({
      ...prev,
      partnerId,
      partnerKeyword: selectedPartner ? selectedPartner.name : '',
    }));

    setFormErrors((prev) => ({
      ...prev,
      partnerId: '',
      submit: '',
    }));
  };

  const handleChangeItem = (
    index: number,
    key: keyof PurchaseOrderFormItem,
    value: string,
  ) => {
    setForm((prev) => {
      const nextItems = [...prev.items];
      nextItems[index] = {
        ...nextItems[index],
        [key]: value,
      };

      return {
        ...prev,
        items: nextItems,
      };
    });

    setFormErrors((prev) => ({
      ...prev,
      items: '',
      submit: '',
    }));
  };

  const handleChangeProductKeyword = (index: number, value: string) => {
    setForm((prev) => {
      const nextItems = [...prev.items];
      nextItems[index] = {
        ...nextItems[index],
        productKeyword: value,
        productId: value ? nextItems[index].productId : '',
      };

      return {
        ...prev,
        items: nextItems,
      };
    });

    setFormErrors((prev) => ({
      ...prev,
      items: '',
      submit: '',
    }));
  };

  const handleSelectProduct = (index: number, productId: string) => {
    const selectedProduct = products.find(
      (product) => String(product.id) === productId,
    );

    setForm((prev) => {
      const nextItems = [...prev.items];

      nextItems[index] = {
        ...nextItems[index],
        productId,
        unitPrice: selectedProduct ? String(selectedProduct.price) : '',
        productKeyword: selectedProduct
          ? `${selectedProduct.code} | ${selectedProduct.name}`
          : '',
      };

      return {
        ...prev,
        items: nextItems,
      };
    });

    setFormErrors((prev) => ({
      ...prev,
      items: '',
      submit: '',
    }));
  };

  const getFilteredProducts = (keyword: string) => {
    const trimmedKeyword = keyword.trim().toLowerCase();

    if (!trimmedKeyword) {
      return products;
    }

    return products.filter((product) => {
      return (
        product.code.toLowerCase().includes(trimmedKeyword) ||
        product.name.toLowerCase().includes(trimmedKeyword)
      );
    });
  };

  const handleAddItemRow = () => {
    setForm((prev) => ({
      ...prev,
      items: [
        ...prev.items,
        {
          productId: '',
          quantity: '1',
          unitPrice: '',
          productKeyword: '',
          isDropdownOpen: false,
        },
      ],
    }));
  };

  const handleRemoveItemRow = (index: number) => {
    setForm((prev) => {
      if (prev.items.length === 1) {
        return prev;
      }

      return {
        ...prev,
        items: prev.items.filter((_, itemIndex) => itemIndex !== index),
      };
    });

    setFormErrors((prev) => ({
      ...prev,
      items: '',
      submit: '',
    }));
  };

  const validateForm = () => {
    const errors: PurchaseOrderFormErrors = {};

    if (!form.partnerId) {
      errors.partnerId = '공급사를 선택해 주세요.';
    }

    const hasInvalidItems =
      form.items.length === 0 ||
      form.items.some((item) => {
        return (
          !item.productId ||
          !item.quantity.trim() ||
          Number(item.quantity) < 1 ||
          !item.unitPrice.trim() ||
          Number(item.unitPrice) < 0
        );
      });

    if (hasInvalidItems) {
      errors.items = '상품, 수량, 단가를 올바르게 입력해 주세요.';
    }

    const selectedProductIds = form.items
      .map((item) => item.productId)
      .filter(Boolean);

    const hasDuplicateProduct =
      new Set(selectedProductIds).size !== selectedProductIds.length;

    if (hasDuplicateProduct) {
      errors.items = '같은 상품은 한 번만 추가해 주세요.';
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
        partnerId: Number(form.partnerId),
        items: form.items.map((item) => ({
          productId: Number(item.productId),
          quantity: Number(item.quantity),
          unitPrice: Number(item.unitPrice),
        })),
      };

      const response = await fetch('/api/purchase-orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        setFormErrors({
          submit: data.message || '발주 등록 중 오류가 발생했습니다.',
        });
        return;
      }

      closeCreateModal();
      await fetchPurchaseOrders(search, 1);
    } catch (error) {
      console.error(error);
      setFormErrors({
        submit:
          error instanceof Error
            ? error.message
            : '발주 등록 중 오류가 발생했습니다.',
      });
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleChangeStatus = async (
    purchaseOrderId: number,
    status: PurchaseOrderStatus,
  ) => {
    try {
      setDetailError('');
      const response = await fetch(
        `/api/purchase-orders/${purchaseOrderId}/status`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ status }),
        },
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || '발주 상태 변경 중 오류가 발생했습니다.',
        );
      }

      const searchParams = new URLSearchParams();
      searchParams.set('page', String(currentPage));
      searchParams.set('pageSize', String(PAGE_SIZE));

      if (search) {
        searchParams.set('search', search);
      }

      const refreshResponse = await fetch(
        `/api/purchase-orders?${searchParams.toString()}`,
        {
          method: 'GET',
          cache: 'no-store',
        },
      );

      const refreshData: PurchaseOrderListResponse =
        await refreshResponse.json();

      if (!refreshResponse.ok) {
        throw new Error(
          (refreshData as { message?: string }).message ||
            '발주 상태 변경 후 목록을 불러오는 중 오류가 발생했습니다.',
        );
      }

      setPurchaseOrders(
        Array.isArray(refreshData.items) ? refreshData.items : [],
      );
      setTotalPages(Number(refreshData.totalPages ?? 1));
      setCurrentPage(Number(refreshData.currentPage ?? currentPage));

      if (selectedOrder) {
        const nextSelectedOrder = refreshData.items.find(
          (item) => item.id === purchaseOrderId,
        );

        if (nextSelectedOrder) {
          setSelectedOrder(nextSelectedOrder);
        }
      }
    } catch (error) {
      console.error(error);
      setDetailError(
        error instanceof Error
          ? error.message
          : '발주 상태 변경 중 오류가 발생했습니다.',
      );
    }
  };

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
                placeholder="공급사명을 입력해 주세요."
                className="h-12 w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-white)] pl-4 pr-12 text-[15px] md:text-[14px] text-[var(--color-text-primary)] outline-none transition placeholder:text-[var(--color-input-placeholder)] focus:border-[var(--color-primary)]"
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
              className="h-12 w-full rounded-lg bg-[var(--color-primary)] px-4 text-[15px] md:text-[14px] font-semibold text-[var(--color-white)] transition hover:bg-[var(--color-primary-hover)] md:w-[116px] md:shrink-0"
            >
              발주 생성하기
            </button>
          </div>
        </div>

        {listError && (
          <div className="mb-4 rounded-lg border border-[var(--color-danger)] bg-[var(--color-white)] px-4 py-3 text-[15px] md:text-[14px] text-[var(--color-danger)]">
            {listError}
          </div>
        )}

        <div className="hidden md:flex md:flex-col md:gap-4">
          {loading ? (
            <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-white)] px-4 py-10 text-center text-[15px] text-[var(--color-text-secondary)]">
              발주 목록을 불러오는 중입니다.
            </div>
          ) : purchaseOrders.length === 0 ? (
            <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-white)] px-4 py-10 text-center text-[15px] text-[var(--color-text-secondary)]">
              조회된 발주가 없습니다.
            </div>
          ) : (
            purchaseOrders.map((order) => (
              <div
                key={order.id}
                className="rounded-xl border border-[var(--color-border)] bg-[var(--color-white)] p-5"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <p className="text-[11px] text-[var(--color-text-muted)]">
                      발주번호 #{order.id}
                    </p>
                    <p className="mt-1 text-[15px] font-semibold text-[var(--color-text-primary)]">
                      {order.partner.name}
                    </p>
                    <p className="mt-1 text-[13px] text-[var(--color-text-secondary)]">
                      생성일 {formatDate(order.createdAt)}
                    </p>
                  </div>

                  <span
                    className={`inline-flex rounded-full border px-2.5 py-[3px] text-[10px] font-semibold ${getStatusClassName(order.status)}`}
                  >
                    {getStatusLabel(order.status)}
                  </span>
                </div>

                <div className="mt-4 grid grid-cols-[minmax(0,2.2fr)_minmax(90px,0.8fr)_minmax(90px,0.8fr)_minmax(140px,1fr)_auto] items-center gap-4 rounded-xl bg-[var(--color-background)] p-4">
                  <div className="min-w-0">
                    <p className="text-[11px] text-[var(--color-text-muted)]">
                      품목
                    </p>
                    <p className="mt-1 truncate text-[14px] font-semibold text-[var(--color-text-primary)]">
                      {getItemSummaryText(order)}
                    </p>
                  </div>

                  <div className="min-w-0">
                    <p className="text-[11px] text-[var(--color-text-muted)]">
                      총 상품 수
                    </p>
                    <p className="mt-1 text-[15px] font-semibold text-[var(--color-text-primary)]">
                      {order.purchaseOrderProducts.length}건
                    </p>
                  </div>

                  <div className="min-w-0">
                    <p className="text-[11px] text-[var(--color-text-muted)]">
                      총 수량
                    </p>
                    <p className="mt-1 text-[15px] font-semibold text-[var(--color-text-primary)]">
                      {order.purchaseOrderProducts.reduce(
                        (acc, item) => acc + item.quantity,
                        0,
                      )}
                      개
                    </p>
                  </div>

                  <div className="min-w-0">
                    <p className="text-[11px] text-[var(--color-text-muted)]">
                      총 금액
                    </p>
                    <p className="mt-1 whitespace-nowrap text-[15px] font-semibold text-[var(--color-text-primary)]">
                      {formatPrice(getOrderTotalPrice(order))}
                    </p>
                  </div>

                  <div className="flex items-center justify-end self-stretch">
                    <button
                      type="button"
                      onClick={() => openDetailModal(order)}
                      className="rounded-lg border border-[var(--color-border)] bg-[var(--color-white)] px-4 py-2 text-[14px] font-semibold text-[var(--color-text-primary)] shadow-sm transition hover:bg-[var(--color-surface)]"
                    >
                      상세보기
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:hidden">
          {loading ? (
            <div className="col-span-1 rounded-xl border border-[var(--color-border)] bg-[var(--color-white)] px-4 py-10 text-center text-[15px] text-[var(--color-text-secondary)] sm:col-span-2">
              발주 목록을 불러오는 중입니다.
            </div>
          ) : purchaseOrders.length === 0 ? (
            <div className="col-span-1 rounded-xl border border-[var(--color-border)] bg-[var(--color-white)] px-4 py-10 text-center text-[15px] text-[var(--color-text-secondary)] sm:col-span-2">
              조회된 발주가 없습니다.
            </div>
          ) : (
            purchaseOrders.map((order) => (
              <div
                key={order.id}
                className="rounded-xl border border-[var(--color-border)] bg-[var(--color-white)] p-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate text-[12px] text-[var(--color-text-muted)]">
                      발주번호 #{order.id}
                    </p>
                    <p className="mt-1 truncate text-[16px] font-semibold text-[var(--color-text-primary)]">
                      {order.partner.name}
                    </p>
                  </div>

                  <span
                    className={`shrink-0 rounded-full border px-2.5 py-[3px] text-[11px] font-semibold ${getStatusClassName(order.status)}`}
                  >
                    {getStatusLabel(order.status)}
                  </span>
                </div>

                <p className="mt-2 text-[13px] text-[var(--color-text-secondary)]">
                  생성일 {formatDate(order.createdAt)}
                </p>

                <div className="mt-4 rounded-xl bg-[var(--color-background)] p-4">
                  <div className="grid grid-cols-2 gap-x-4 gap-y-4">
                    <div className="min-w-0">
                      <p className="text-[12px] text-[var(--color-text-muted)]">
                        품목
                      </p>
                      <p className="mt-1 truncate text-[15px] font-semibold text-[var(--color-text-primary)]">
                        {getItemSummaryText(order)}
                      </p>
                    </div>

                    <div>
                      <p className="text-[12px] text-[var(--color-text-muted)]">
                        총 상품 수
                      </p>
                      <p className="mt-1 text-[15px] font-semibold text-[var(--color-text-primary)]">
                        {order.purchaseOrderProducts.length}건
                      </p>
                    </div>

                    <div>
                      <p className="text-[12px] text-[var(--color-text-muted)]">
                        총 수량
                      </p>
                      <p className="mt-1 text-[15px] font-semibold text-[var(--color-text-primary)]">
                        {order.purchaseOrderProducts.reduce(
                          (acc, item) => acc + item.quantity,
                          0,
                        )}
                        개
                      </p>
                    </div>

                    <div>
                      <p className="text-[12px] text-[var(--color-text-muted)]">
                        총 금액
                      </p>
                      <p className="mt-1 whitespace-nowrap text-[17px] font-bold text-[var(--color-text-primary)]">
                        {formatPrice(getOrderTotalPrice(order))}
                      </p>
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => openDetailModal(order)}
                  className="mt-4 w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-white)] py-2.5 text-[14px] font-semibold text-[var(--color-text-primary)] shadow-sm transition hover:bg-[var(--color-surface)]"
                >
                  상세보기
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

      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[color:var(--color-text-primary)]/30 px-4">
          <div className="max-h-[90vh] w-full max-w-4xl overflow-y-auto rounded-2xl border border-[var(--color-border)] bg-[var(--color-white)] p-4 shadow-xl md:p-6">
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-[28px] md:text-[24px] font-bold text-[var(--color-text-primary)]">
                발주 생성
              </h2>
              <button
                type="button"
                onClick={closeCreateModal}
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
              <div className="mb-4 rounded-lg border border-[var(--color-danger)] bg-[var(--color-white)] px-4 py-3 text-[15px] md:text-[14px] text-[var(--color-danger)]">
                {formErrors.submit}
              </div>
            )}

            <div className="mb-5">
              <label className="mb-2 block text-[13px] font-semibold text-[var(--color-text-secondary)]">
                공급사
              </label>

              <div className="space-y-2">
                <input
                  type="text"
                  value={form.partnerKeyword}
                  onChange={(e) => handleChangePartnerKeyword(e.target.value)}
                  placeholder="공급사명을 검색해 주세요."
                  className={getInputClass(!!formErrors.partnerId)}
                />

                <div className="relative">
                  <select
                    value={form.partnerId}
                    onChange={(e) => handleSelectPartner(e.target.value)}
                    className={`${getInputClass(!!formErrors.partnerId)} appearance-none pr-11 font-medium`}
                  >
                    <option value="">공급사를 선택해 주세요.</option>
                    {getFilteredSuppliers(form.partnerKeyword).map(
                      (supplier) => (
                        <option key={supplier.id} value={supplier.id}>
                          {supplier.name}
                        </option>
                      ),
                    )}
                  </select>

                  <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-[14px] text-[var(--color-primary)]">
                    ▼
                  </span>
                </div>
              </div>

              {formErrors.partnerId && (
                <p className="mt-1 text-[11px] text-[var(--color-danger)]">
                  {formErrors.partnerId}
                </p>
              )}
            </div>

            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-[16px] md:text-[15px] font-semibold text-[var(--color-text-primary)]">
                발주 품목
              </h3>
              <button
                type="button"
                onClick={handleAddItemRow}
                className="rounded-lg border border-[var(--color-border)] px-4 py-2 text-[14px] md:text-[13px] font-semibold text-[var(--color-text-primary)] transition hover:bg-[var(--color-surface)]"
              >
                품목 추가
              </button>
            </div>

            {formErrors.items && (
              <div className="mb-4 rounded-lg border border-[var(--color-danger)] bg-[var(--color-white)] px-4 py-3 text-[15px] md:text-[14px] text-[var(--color-danger)]">
                {formErrors.items}
              </div>
            )}

            <div className="hidden overflow-hidden rounded-xl border border-[var(--color-border)] md:block">
              <table className="w-full table-fixed border-collapse">
                <thead>
                  <tr className="bg-[var(--color-background)]">
                    <th className="w-[40%] border-b border-[var(--color-border)] px-4 py-3 text-center text-[13px] font-semibold text-[var(--color-text-secondary)]">
                      상품
                    </th>
                    <th className="w-[18%] border-b border-[var(--color-border)] px-4 py-3 text-center text-[13px] font-semibold text-[var(--color-text-secondary)]">
                      수량
                    </th>
                    <th className="w-[22%] border-b border-[var(--color-border)] px-4 py-3 text-center text-[13px] font-semibold text-[var(--color-text-secondary)]">
                      단가
                    </th>
                    <th className="w-[20%] border-b border-[var(--color-border)] px-4 py-3 text-center text-[13px] font-semibold text-[var(--color-text-secondary)]">
                      관리
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {form.items.map((item, index) => (
                    <tr
                      key={`${index}-${item.productId}`}
                      className="border-b border-[var(--color-border)] last:border-b-0"
                    >
                      <td className="px-4 py-3">
                        <div className="space-y-2">
                          <input
                            type="text"
                            value={item.productKeyword}
                            onChange={(e) =>
                              handleChangeProductKeyword(index, e.target.value)
                            }
                            placeholder="상품코드 또는 상품명을 검색해 주세요."
                            className={getInputClass(false)}
                          />

                          <div className="relative">
                            <select
                              value={item.productId}
                              onChange={(e) =>
                                handleSelectProduct(index, e.target.value)
                              }
                              className={`${getInputClass(false)} appearance-none pr-11 font-medium`}
                            >
                              <option value="">상품을 선택해 주세요.</option>
                              {getFilteredProducts(item.productKeyword).map(
                                (product) => (
                                  <option key={product.id} value={product.id}>
                                    {product.code} | {product.name}
                                  </option>
                                ),
                              )}
                            </select>

                            <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-[14px] text-[var(--color-primary)]">
                              ▼
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <input
                          type="number"
                          min={1}
                          value={item.quantity}
                          onChange={(e) =>
                            handleChangeItem(index, 'quantity', e.target.value)
                          }
                          className={getInputClass(false)}
                        />
                      </td>

                      <td className="px-4 py-3">
                        <input
                          type="number"
                          min={0}
                          value={item.unitPrice}
                          onChange={(e) =>
                            handleChangeItem(index, 'unitPrice', e.target.value)
                          }
                          className={getInputClass(false)}
                        />
                      </td>

                      <td className="px-4 py-3">
                        <div className="flex items-center justify-center">
                          <button
                            type="button"
                            onClick={() => handleRemoveItemRow(index)}
                            disabled={form.items.length === 1}
                            className="rounded-lg border border-[var(--color-border)] px-4 py-2 text-[13px] font-semibold text-[var(--color-text-primary)] transition hover:bg-[var(--color-surface)] disabled:cursor-not-allowed disabled:text-[var(--color-text-muted)]"
                          >
                            삭제
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="space-y-3 md:hidden">
              {form.items.map((item, index) => (
                <div
                  key={`${index}-${item.productId}`}
                  className="rounded-xl border border-[var(--color-border)] bg-[var(--color-white)] p-4"
                >
                  <div className="grid grid-cols-1 gap-3">
                    <div>
                      <label className="mb-2 block text-[13px] font-semibold text-[var(--color-text-secondary)]">
                        상품
                      </label>

                      <div className="space-y-2">
                        <input
                          type="text"
                          value={item.productKeyword}
                          onChange={(e) =>
                            handleChangeProductKeyword(index, e.target.value)
                          }
                          placeholder="상품코드 또는 상품명을 검색해 주세요."
                          className={getInputClass(false)}
                        />

                        <div className="relative">
                          <select
                            value={item.productId}
                            onChange={(e) =>
                              handleSelectProduct(index, e.target.value)
                            }
                            className={`${getInputClass(false)} appearance-none pr-11 font-medium`}
                          >
                            <option value="">상품을 선택해 주세요.</option>
                            {getFilteredProducts(item.productKeyword).map(
                              (product) => (
                                <option key={product.id} value={product.id}>
                                  {product.code} | {product.name}
                                </option>
                              ),
                            )}
                          </select>

                          <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-[14px] text-[var(--color-primary)]">
                            ▼
                          </span>
                        </div>
                      </div>
                    </div>

                    <div>
                      <label className="mb-2 block text-[13px] font-semibold text-[var(--color-text-secondary)]">
                        수량
                      </label>
                      <input
                        type="number"
                        min={1}
                        value={item.quantity}
                        onChange={(e) =>
                          handleChangeItem(index, 'quantity', e.target.value)
                        }
                        className={getInputClass(false)}
                      />
                    </div>

                    <div>
                      <label className="mb-2 block text-[13px] font-semibold text-[var(--color-text-secondary)]">
                        단가
                      </label>
                      <input
                        type="number"
                        min={0}
                        value={item.unitPrice}
                        onChange={(e) =>
                          handleChangeItem(index, 'unitPrice', e.target.value)
                        }
                        className={getInputClass(false)}
                      />
                    </div>

                    <button
                      type="button"
                      onClick={() => handleRemoveItemRow(index)}
                      disabled={form.items.length === 1}
                      className="rounded-lg border border-[var(--color-border)] py-2.5 text-[14px] font-semibold text-[var(--color-text-primary)] transition hover:bg-[var(--color-surface)] disabled:cursor-not-allowed disabled:text-[var(--color-text-muted)]"
                    >
                      삭제
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-6 rounded-xl bg-[var(--color-background)] p-4">
              <div className="flex items-center justify-between">
                <span className="text-[14px] md:text-[13px] font-semibold text-[var(--color-text-secondary)]">
                  예상 총 금액
                </span>
                <span className="text-[20px] md:text-[18px] font-bold text-[var(--color-text-primary)]">
                  {formatPrice(
                    form.items.reduce((acc, item) => {
                      return (
                        acc +
                        Number(item.quantity || 0) * Number(item.unitPrice || 0)
                      );
                    }, 0),
                  )}
                </span>
              </div>
            </div>

            <div className="mt-6 flex flex-col-reverse gap-3 md:flex-row md:items-center md:justify-end">
              <button
                type="button"
                onClick={closeCreateModal}
                className="rounded-lg border border-[var(--color-border)] bg-[var(--color-white)] px-4 py-3 text-[15px] md:text-[14px] font-semibold text-[var(--color-text-primary)]"
              >
                취소
              </button>
              <button
                type="button"
                onClick={handleSubmit}
                disabled={submitLoading}
                className="rounded-lg bg-[var(--color-primary)] px-4 py-3 text-[15px] md:text-[14px] font-semibold text-[var(--color-white)] transition hover:bg-[var(--color-primary-hover)] disabled:cursor-not-allowed disabled:bg-[var(--color-secondary)]"
              >
                {submitLoading ? '저장 중입니다.' : '저장'}
              </button>
            </div>
          </div>
        </div>
      )}

      {isDetailModalOpen && selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[color:var(--color-text-primary)]/30 px-4">
          <div className="max-h-[90vh] w-full max-w-4xl overflow-y-auto rounded-2xl border border-[var(--color-border)] bg-[var(--color-white)] p-4 shadow-xl md:p-6">
            <div className="mb-6 flex items-center justify-between">
              <div>
                <h2 className="text-[28px] md:text-[24px] font-bold text-[var(--color-text-primary)]">
                  발주 상세
                </h2>
                <p className="mt-1 text-[14px] md:text-[13px] text-[var(--color-text-secondary)]">
                  발주번호 #{selectedOrder.id}
                </p>
              </div>

              <button
                type="button"
                onClick={closeDetailModal}
                className="rounded-md px-1 py-1 hover:bg-[var(--color-background)]"
              >
                <img
                  src="/cancel.svg"
                  alt="닫기"
                  className="h-5 w-5 opacity-70"
                />
              </button>
            </div>

            {detailError && (
              <div className="mb-4 rounded-lg border border-[var(--color-danger)] bg-[var(--color-white)] px-4 py-3 text-[15px] md:text-[14px] text-[var(--color-danger)]">
                {detailError}
              </div>
            )}
            <div className="mb-5 grid grid-cols-2 gap-3 rounded-xl bg-[var(--color-background)] p-4 md:grid-cols-4">
              <div>
                <p className="text-[12px] md:text-[11px] text-[var(--color-text-muted)]">
                  공급사
                </p>
                <p className="mt-1 text-[16px] md:text-[14px] font-semibold text-[var(--color-text-primary)]">
                  {selectedOrder.partner.name}
                </p>
              </div>

              <div>
                <p className="text-[12px] md:text-[11px] text-[var(--color-text-muted)]">
                  생성일
                </p>
                <p className="mt-1 text-[16px] md:text-[14px] font-semibold text-[var(--color-text-primary)]">
                  {formatDate(selectedOrder.createdAt)}
                </p>
              </div>

              <div>
                <p className="text-[12px] md:text-[11px] text-[var(--color-text-muted)]">
                  상태
                </p>
                <span
                  className={`mt-1 inline-flex rounded-full border px-2.5 py-[3px] text-[11px] md:text-[10px] font-semibold ${getStatusClassName(selectedOrder.status)}`}
                >
                  {getStatusLabel(selectedOrder.status)}
                </span>
              </div>

              <div>
                <p className="text-[12px] md:text-[11px] text-[var(--color-text-muted)]">
                  총 금액
                </p>
                <p className="mt-1 whitespace-nowrap text-[18px] md:text-[14px] font-semibold text-[var(--color-text-primary)]">
                  {formatPrice(getOrderTotalPrice(selectedOrder))}
                </p>
              </div>
            </div>

            <div className="hidden overflow-hidden rounded-xl border border-[var(--color-border)] md:block">
              <table className="w-full table-fixed border-collapse">
                <thead>
                  <tr className="bg-[var(--color-background)]">
                    <th className="border-b border-[var(--color-border)] px-4 py-3 text-center text-[13px] font-semibold text-[var(--color-text-secondary)]">
                      상품코드
                    </th>
                    <th className="border-b border-[var(--color-border)] px-4 py-3 text-center text-[13px] font-semibold text-[var(--color-text-secondary)]">
                      상품명
                    </th>
                    <th className="border-b border-[var(--color-border)] px-4 py-3 text-center text-[13px] font-semibold text-[var(--color-text-secondary)]">
                      수량
                    </th>
                    <th className="border-b border-[var(--color-border)] px-4 py-3 text-center text-[13px] font-semibold text-[var(--color-text-secondary)]">
                      단가
                    </th>
                    <th className="border-b border-[var(--color-border)] px-4 py-3 text-center text-[13px] font-semibold text-[var(--color-text-secondary)]">
                      금액
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {selectedOrder.purchaseOrderProducts.map((item) => (
                    <tr
                      key={`${item.purchaseId}-${item.productId}`}
                      className="border-b border-[var(--color-border)] last:border-b-0"
                    >
                      <td className="px-4 py-4 text-center text-[14px] text-[var(--color-text-primary)]">
                        {item.product.code}
                      </td>
                      <td className="px-4 py-4 text-center text-[14px] text-[var(--color-text-primary)]">
                        {item.product.name}
                      </td>
                      <td className="px-4 py-4 text-center text-[14px] text-[var(--color-text-primary)]">
                        {item.quantity}개
                      </td>
                      <td className="px-4 py-4 text-center text-[14px] text-[var(--color-text-primary)]">
                        {formatPrice(item.unitPrice)}
                      </td>
                      <td className="px-4 py-4 text-center text-[14px] font-semibold text-[var(--color-text-primary)]">
                        {formatPrice(item.quantity * item.unitPrice)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="space-y-3 md:hidden">
              {selectedOrder.purchaseOrderProducts.map((item) => (
                <div
                  key={`${item.purchaseId}-${item.productId}`}
                  className="rounded-xl border border-[var(--color-border)] bg-[var(--color-white)] p-4"
                >
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <p className="text-[12px] text-[var(--color-text-muted)]">
                        상품코드
                      </p>
                      <p className="mt-1 text-[15px] font-semibold text-[var(--color-text-primary)]">
                        {item.product.code}
                      </p>
                    </div>

                    <div>
                      <p className="text-[12px] text-[var(--color-text-muted)]">
                        상품명
                      </p>
                      <p className="mt-1 text-[15px] font-semibold text-[var(--color-text-primary)]">
                        {item.product.name}
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 grid grid-cols-2 gap-3">
                    <div>
                      <p className="text-[12px] text-[var(--color-text-muted)]">
                        수량
                      </p>
                      <p className="mt-1 text-[15px] font-semibold text-[var(--color-text-primary)]">
                        {item.quantity}개
                      </p>
                    </div>

                    <div>
                      <p className="text-[12px] text-[var(--color-text-muted)]">
                        단가
                      </p>
                      <p className="mt-1 whitespace-nowrap text-[15px] font-semibold text-[var(--color-text-primary)]">
                        {formatPrice(item.unitPrice)}
                      </p>
                    </div>

                    <div className="col-span-2 rounded-lg bg-[var(--color-background)] px-4 py-3">
                      <p className="text-[12px] text-[var(--color-text-muted)]">
                        금액
                      </p>
                      <p className="mt-1 whitespace-nowrap text-[17px] font-bold text-[var(--color-text-primary)]">
                        {formatPrice(item.quantity * item.unitPrice)}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-6">
              <div className="mb-3 flex items-center justify-between">
                <h3 className="text-[16px] md:text-[15px] font-semibold text-[var(--color-text-primary)]">
                  상태 이력
                </h3>
              </div>

              {selectedOrder.purchaseOrderStatuses.length === 0 ? (
                <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-white)] px-4 py-6 text-center text-[15px] md:text-[14px] text-[var(--color-text-secondary)]">
                  상태 이력이 없습니다.
                </div>
              ) : (
                <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-white)]">
                  {selectedOrder.purchaseOrderStatuses.map((history, index) => (
                    <div
                      key={history.id}
                      className={`flex items-center justify-between gap-4 px-4 py-4 ${
                        index !== selectedOrder.purchaseOrderStatuses.length - 1
                          ? 'border-b border-[var(--color-border)]'
                          : ''
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--color-background)] text-[12px] md:text-[11px] font-semibold text-[var(--color-primary)]">
                          {index + 1}
                        </div>

                        <div>
                          <p className="text-[15px] md:text-[14px] font-semibold text-[var(--color-text-primary)]">
                            {getStatusLabel(history.status)}
                          </p>
                        </div>
                      </div>

                      <div className="text-right">
                        <p className="text-[13px] md:text-[13px] font-medium text-[var(--color-text-primary)]">
                          {formatDateTime(history.createdAt)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="mt-6 border-t border-[var(--color-border)] pt-5">
              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div className="flex items-center">
                  {(selectedOrder.status === 'DRAFT' ||
                    selectedOrder.status === 'CONFIRMED') && (
                    <button
                      type="button"
                      onClick={() =>
                        handleChangeStatus(selectedOrder.id, 'CANCELED')
                      }
                      className="rounded-lg border border-[var(--color-danger)] bg-[var(--color-white)] px-4 py-3 text-[15px] md:text-[14px] font-semibold text-[var(--color-danger)]"
                    >
                      취소 처리
                    </button>
                  )}
                </div>

                <div className="flex flex-col-reverse gap-3 md:flex-row md:items-center">
                  <button
                    type="button"
                    onClick={closeDetailModal}
                    className="rounded-lg border border-[var(--color-border)] bg-[var(--color-white)] px-4 py-3 text-[15px] md:text-[14px] font-semibold text-[var(--color-text-primary)]"
                  >
                    닫기
                  </button>

                  {selectedOrder.status === 'DRAFT' && (
                    <button
                      type="button"
                      onClick={() =>
                        handleChangeStatus(selectedOrder.id, 'CONFIRMED')
                      }
                      className="rounded-lg bg-[var(--color-primary)] px-4 py-3 text-[15px] md:text-[14px] font-semibold text-[var(--color-white)] transition hover:bg-[var(--color-primary-hover)]"
                    >
                      확정
                    </button>
                  )}

                  {selectedOrder.status === 'CONFIRMED' && (
                    <button
                      type="button"
                      onClick={() =>
                        handleChangeStatus(selectedOrder.id, 'COMPLETED')
                      }
                      className="rounded-lg bg-[var(--color-primary)] px-4 py-3 text-[15px] md:text-[14px] font-semibold text-[var(--color-white)] transition hover:bg-[var(--color-primary-hover)]"
                    >
                      완료 처리
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
