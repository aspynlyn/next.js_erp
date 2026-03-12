import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const productId = Number(body.productId);
    const quantity = Number(body.quantity);
    const memo =
      typeof body.memo === 'string' && body.memo.trim()
        ? body.memo.trim()
        : null;

    if (!productId || Number.isNaN(productId)) {
      return NextResponse.json(
        { message: '상품 정보가 올바르지 않습니다.' },
        { status: 400 },
      );
    }

    if (!quantity || Number.isNaN(quantity)) {
      return NextResponse.json(
        { message: '조정 수량이 올바르지 않습니다.' },
        { status: 400 },
      );
    }

    const product = await prisma.product.findUnique({
      where: { id: productId },
    });

    if (!product) {
      return NextResponse.json(
        { message: '상품을 찾을 수 없습니다.' },
        { status: 404 },
      );
    }

    const nextStock = product.currentStock + quantity;

    if (nextStock < 0) {
      return NextResponse.json(
        { message: '현재 재고보다 많이 차감할 수 없습니다.' },
        { status: 400 },
      );
    }

    const result = await prisma.$transaction(async (tx) => {
      const updatedProduct = await tx.product.update({
        where: { id: productId },
        data: {
          currentStock: nextStock,
        },
      });

      const stockMovement = await tx.stockMovement.create({
        data: {
          productId,
          quantity,
          type: 'ADJUST',
          memo,
          refId: null,
          stockAfter: nextStock,
        },
      });

      return {
        updatedProduct,
        stockMovement,
      };
    });

    return NextResponse.json(
      {
        message: '재고 조정이 완료되었습니다.',
        item: result.stockMovement,
      },
      { status: 200 },
    );
  } catch (error) {
    console.error('POST /api/stocks/adjust error:', error);

    return NextResponse.json(
      { message: '재고 조정 중 오류가 발생했습니다.' },
      { status: 500 },
    );
  }
}