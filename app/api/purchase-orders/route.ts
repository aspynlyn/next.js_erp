import { NextRequest, NextResponse } from "next/server";
import { PrismaClient, PartnerType, PurchaseOrderStatus } from "@/app/generated/prisma/client";

const prisma = new PrismaClient();

type PurchaseOrderItemRequest = {
  productId: number;
  quantity: number;
  unitPrice: number;
};

type CreatePurchaseOrderRequest = {
  partnerId: number;
  items: PurchaseOrderItemRequest[];
};

export async function POST(req: NextRequest) {
  try {
    const body: CreatePurchaseOrderRequest = await req.json();
    const { partnerId, items } = body;

    if (!partnerId || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { message: "공급사와 품목 정보는 필수입니다." },
        { status: 400 }
      );
    }

    for (const item of items) {
      if (
        !item.productId ||
        !item.quantity ||
        item.quantity <= 0 ||
        item.unitPrice == null ||
        item.unitPrice < 0
      ) {
        return NextResponse.json(
          { message: "품목, 수량, 단가를 올바르게 입력해주세요." },
          { status: 400 }
        );
      }
    }

    const partner = await prisma.partner.findUnique({
      where: { id: partnerId },
    });

    if (!partner) {
      return NextResponse.json(
        { message: "존재하지 않는 거래처입니다." },
        { status: 404 }
      );
    }

    if (partner.type !== PartnerType.SUPPLIER) {
      return NextResponse.json(
        { message: "발주서는 공급사 거래처만 선택할 수 있습니다." },
        { status: 400 }
      );
    }

    const productIds = items.map((item) => item.productId);

    const products = await prisma.product.findMany({
      where: {
        id: { in: productIds },
      },
      select: {
        id: true,
        isSale: true,
      },
    });

    if (products.length !== productIds.length) {
      return NextResponse.json(
        { message: "존재하지 않는 상품이 포함되어 있습니다." },
        { status: 400 }
      );
    }

    const createdOrder = await prisma.$transaction(async (tx) => {
      const purchaseOrder = await tx.purchaseOrder.create({
        data: {
          partnerId,
          status: PurchaseOrderStatus.DRAFT,
        },
      });

      await tx.purchaseOrderProduct.createMany({
        data: items.map((item) => ({
          purchaseId: purchaseOrder.id,
          productId: item.productId,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
        })),
      });

      await tx.purchaseOrderStatusLog.create({
        data: {
          purchaseId: purchaseOrder.id,
          status: PurchaseOrderStatus.DRAFT,
        },
      });

      return purchaseOrder;
    });

    return NextResponse.json(
      {
        message: "발주서가 생성되었습니다.",
        data: createdOrder,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("발주 생성 실패:", error);

    return NextResponse.json(
      { message: "발주서 생성 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}