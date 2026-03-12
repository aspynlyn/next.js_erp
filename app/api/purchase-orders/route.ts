import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

type PurchaseOrderItemRequest = {
  productId: number;
  quantity: number;
  unitPrice: number;
};

type CreatePurchaseOrderRequest = {
  partnerId: number;
  items: PurchaseOrderItemRequest[];
};

// 발주 등록
export async function POST(req: NextRequest) {
  try {
    const body: CreatePurchaseOrderRequest = await req.json();

    const partnerId = Number(body.partnerId);
    const items: PurchaseOrderItemRequest[] = Array.isArray(body.items)
      ? body.items
      : [];

    if (!partnerId || items.length === 0) {
      return NextResponse.json(
        { message: '공급사와 품목 정보는 필수입니다.' },
        { status: 400 },
      );
    }

    for (const item of items) {
      const productId = Number(item.productId);
      const quantity = Number(item.quantity);
      const unitPrice = Number(item.unitPrice);

      if (!productId || quantity < 1 || unitPrice < 0) {
        return NextResponse.json(
          { message: '품목, 수량, 단가를 올바르게 입력해주세요.' },
          { status: 400 },
        );
      }
    }

    const partner = await prisma.partner.findUnique({
      where: {
        id: partnerId,
      },
    });

    if (!partner) {
      return NextResponse.json(
        { message: '존재하지 않는 거래처입니다.' },
        { status: 404 },
      );
    }

    if (partner.type !== 'SUPPLIER') {
      return NextResponse.json(
        { message: '발주서는 공급사 거래처만 선택할 수 있습니다.' },
        { status: 400 },
      );
    }

    const productIds = items.map((item) => Number(item.productId));

    const products = await prisma.product.findMany({
      where: {
        id: {
          in: productIds,
        },
      },
      select: {
        id: true,
      },
    });

    if (products.length !== productIds.length) {
      return NextResponse.json(
        { message: '존재하지 않는 상품이 포함되어 있습니다.' },
        { status: 400 },
      );
    }

    const purchaseOrder = await prisma.$transaction(async (tx) => {
      const createdPurchaseOrder = await tx.purchaseOrder.create({
        data: {
          partnerId,
          status: 'DRAFT',
        },
      });

      await tx.purchaseOrderProduct.createMany({
        data: items.map((item) => ({
          purchaseId: createdPurchaseOrder.id,
          productId: Number(item.productId),
          quantity: Number(item.quantity),
          unitPrice: Number(item.unitPrice),
        })),
      });

      await tx.purchaseOrderStatusLog.create({
        data: {
          purchaseId: createdPurchaseOrder.id,
          status: 'DRAFT',
        },
      });

      return createdPurchaseOrder;
    });

    return NextResponse.json(purchaseOrder, { status: 201 });
  } catch (error) {
    console.error('발주 등록 오류:', error);
    return NextResponse.json(
      { message: '발주 등록 중 오류가 발생했습니다.' },
      { status: 500 },
    );
  }
}

// 발주 목록 조회
export async function GET(req: NextRequest) {
  try {
    const search = req.nextUrl.searchParams.get('search')?.trim() ?? '';
    const page = Number(req.nextUrl.searchParams.get('page') ?? '1');
    const pageSize = Number(req.nextUrl.searchParams.get('pageSize') ?? '8');

    const currentPage = Number.isNaN(page) || page < 1 ? 1 : page;
    const take = Number.isNaN(pageSize) || pageSize < 1 ? 8 : pageSize;
    const skip = (currentPage - 1) * take;

    const where = search
      ? {
          partner: {
            name: {
              contains: search,
            },
          },
        }
      : {};

    const [purchaseOrders, totalCount] = await Promise.all([
      prisma.purchaseOrder.findMany({
        where,
        include: {
          partner: true,
          purchaseOrderProducts: {
            include: {
              product: true,
            },
          },
          purchaseOrderStatuses: {
            orderBy: {
              createdAt: 'asc',
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
        skip,
        take,
      }),
      prisma.purchaseOrder.count({
        where,
      }),
    ]);

    const totalPages = Math.max(1, Math.ceil(totalCount / take));

    return NextResponse.json({
      items: purchaseOrders,
      totalCount,
      totalPages,
      currentPage,
    });
  } catch (error) {
    console.error('발주 목록 조회 오류:', error);
    return NextResponse.json(
      { message: '발주 목록 조회 중 오류가 발생했습니다.' },
      { status: 500 },
    );
  }
}
