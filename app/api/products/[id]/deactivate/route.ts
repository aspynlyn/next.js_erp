import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// 상품 비활성화
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const productId = Number(id);

    if (Number.isNaN(productId)) {
      return NextResponse.json(
        { message: '올바르지 않은 상품 ID입니다.' },
        { status: 400 },
      );
    }

    const existingProduct = await prisma.product.findUnique({
      where: { id: productId },
    });

    if (!existingProduct) {
      return NextResponse.json(
        { message: '해당 상품을 찾을 수 없습니다.' },
        { status: 404 },
      );
    }

    const deactivatedProduct = await prisma.product.update({
      where: { id: productId },
      data: {
        isSale: false,
      },
    });

    return NextResponse.json(deactivatedProduct, { status: 200 });
  } catch (error) {
    console.error('상품 비활성화 오류:', error);
    return NextResponse.json(
      { message: '상품 비활성화 중 오류가 발생했습니다.' },
      { status: 500 },
    );
  }
}