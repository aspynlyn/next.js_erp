import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

type UpdateSaleOrderStatusRequest = {
  status: 'RECEIVED' | 'PROCESSING' | 'COMPLETED' | 'CANCELED';
};

// 주문 상태 변경
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const saleOrderId = Number(id);
    const body: UpdateSaleOrderStatusRequest = await req.json();
    const nextStatus = body.status;

    if (!saleOrderId || !nextStatus) {
      return NextResponse.json(
        { message: '주문 번호와 변경 상태는 필수입니다.' },
        { status: 400 },
      );
    }

    if (
      nextStatus !== 'RECEIVED' &&
      nextStatus !== 'PROCESSING' &&
      nextStatus !== 'COMPLETED' &&
      nextStatus !== 'CANCELED'
    ) {
      return NextResponse.json(
        { message: '변경할 상태 값이 올바르지 않습니다.' },
        { status: 400 },
      );
    }

    const saleOrder = await prisma.saleOrder.findUnique({
      where: {
        id: saleOrderId,
      },
      include: {
        saleOrderProducts: {
          include: {
            product: true,
          },
        },
      },
    });

    if (!saleOrder) {
      return NextResponse.json(
        { message: '존재하지 않는 주문서입니다.' },
        { status: 404 },
      );
    }

    if (
      saleOrder.status === 'COMPLETED' ||
      saleOrder.status === 'CANCELED'
    ) {
      return NextResponse.json(
        { message: '완료 또는 취소된 주문서는 상태를 변경할 수 없습니다.' },
        { status: 400 },
      );
    }

    if (
      saleOrder.status === 'RECEIVED' &&
      nextStatus === 'COMPLETED'
    ) {
      return NextResponse.json(
        { message: '접수 상태에서는 바로 완료 처리할 수 없습니다.' },
        { status: 400 },
      );
    }

    if (saleOrder.status === nextStatus) {
      return NextResponse.json(
        { message: '현재 상태와 동일합니다.' },
        { status: 400 },
      );
    }

    // 출고 완료 직전 재고 재검증
    if (nextStatus === 'COMPLETED') {
      for (const item of saleOrder.saleOrderProducts) {
        if (item.quantity > item.product.currentStock) {
          return NextResponse.json(
            {
              message: `${item.product.name}의 재고가 부족하여 출고 완료 처리할 수 없습니다.`,
            },
            { status: 400 },
          );
        }
      }
    }

    const updatedSaleOrder = await prisma.$transaction(async (tx) => {
      const updatedOrder = await tx.saleOrder.update({
        where: {
          id: saleOrderId,
        },
        data: {
          status: nextStatus,
        },
      });

      await tx.saleOrderStatusLog.create({
        data: {
          saleId: saleOrderId,
          status: nextStatus,
        },
      });

      if (nextStatus === 'COMPLETED') {
        for (const item of saleOrder.saleOrderProducts) {
          await tx.product.update({
            where: {
              id: item.productId,
            },
            data: {
              currentStock: {
                decrement: item.quantity,
              },
            },
          });

          await tx.stockMovement.create({
            data: {
              productId: item.productId,
              quantity: item.quantity,
              type: 'OUT',
              memo: `주문 출고 처리 (주문번호: ${saleOrderId})`,
              refId: saleOrderId,
            },
          });
        }
      }

      return updatedOrder;
    });

    return NextResponse.json(updatedSaleOrder);
  } catch (error) {
    console.error('주문 상태 변경 오류:', error);
    return NextResponse.json(
      { message: '주문 상태 변경 중 오류가 발생했습니다.' },
      { status: 500 },
    );
  }
}