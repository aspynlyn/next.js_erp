import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

type UpdatePurchaseOrderStatusRequest = {
  status: 'DRAFT' | 'CONFIRMED' | 'COMPLETED' | 'CANCELED';
};

// 발주 상태 변경
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const purchaseOrderId = Number(id);
    const body: UpdatePurchaseOrderStatusRequest = await req.json();
    const nextStatus = body.status;

    if (!purchaseOrderId || !nextStatus) {
      return NextResponse.json(
        { message: '발주 번호와 변경 상태는 필수입니다.' },
        { status: 400 },
      );
    }

    if (
      nextStatus !== 'DRAFT' &&
      nextStatus !== 'CONFIRMED' &&
      nextStatus !== 'COMPLETED' &&
      nextStatus !== 'CANCELED'
    ) {
      return NextResponse.json(
        { message: '변경할 상태 값이 올바르지 않습니다.' },
        { status: 400 },
      );
    }

    const purchaseOrder = await prisma.purchaseOrder.findUnique({
      where: {
        id: purchaseOrderId,
      },
      include: {
        purchaseOrderProducts: true,
      },
    });

    if (!purchaseOrder) {
      return NextResponse.json(
        { message: '존재하지 않는 발주서입니다.' },
        { status: 404 },
      );
    }

    if (
      purchaseOrder.status === 'COMPLETED' ||
      purchaseOrder.status === 'CANCELED'
    ) {
      return NextResponse.json(
        { message: '완료 또는 취소된 발주서는 상태를 변경할 수 없습니다.' },
        { status: 400 },
      );
    }

    if (purchaseOrder.status === 'DRAFT' && nextStatus === 'COMPLETED') {
      return NextResponse.json(
        { message: '초안 상태에서는 바로 완료 처리할 수 없습니다.' },
        { status: 400 },
      );
    }

    if (purchaseOrder.status === nextStatus) {
      return NextResponse.json(
        { message: '현재 상태와 동일합니다.' },
        { status: 400 },
      );
    }

    const updatedPurchaseOrder = await prisma.$transaction(async (tx) => {
      const updatedOrder = await tx.purchaseOrder.update({
        where: {
          id: purchaseOrderId,
        },
        data: {
          status: nextStatus,
        },
      });

      await tx.purchaseOrderStatusLog.create({
        data: {
          purchaseId: purchaseOrderId,
          status: nextStatus,
        },
      });

      if (nextStatus === 'COMPLETED') {
        for (const item of purchaseOrder.purchaseOrderProducts) {
          const updatedProduct = await tx.product.update({
            where: {
              id: item.productId,
            },
            data: {
              currentStock: {
                increment: item.quantity,
              },
            },
          });

          await tx.stockMovement.create({
            data: {
              productId: item.productId,
              quantity: item.quantity,
              type: 'IN',
              memo: `발주 입고 처리 (발주번호: ${purchaseOrderId})`,
              refId: purchaseOrderId,
              stockAfter: updatedProduct.currentStock,
            },
          });
        }
      }

      return updatedOrder;
    });

    return NextResponse.json(updatedPurchaseOrder);
  } catch (error) {
    console.error('발주 상태 변경 오류:', error);
    return NextResponse.json(
      {
        message: '발주 상태 변경 중 오류가 발생했습니다.',
      },
      { status: 500 },
    );
  }
}
