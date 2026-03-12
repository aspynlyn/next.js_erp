import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ productId: string }> },
) {
  try {
    const { productId } = await params;
    const id = Number(productId);

    if (!id) {
      return NextResponse.json(
        { message: '상품 번호가 올바르지 않습니다.' },
        { status: 400 },
      );
    }

    const stockMovements = await prisma.stockMovement.findMany({
      where: {
        productId: id,
      },
      include: {
        product: {
          select: {
            id: true,
            code: true,
            name: true,
            currentStock: true,
            safetyStock: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json({
      items: stockMovements,
    });
  } catch (error) {
    console.error('상품별 재고 이력 조회 오류:', error);
    return NextResponse.json(
      { message: '상품별 재고 이력 조회 중 오류가 발생했습니다.' },
      { status: 500 },
    );
  }
}