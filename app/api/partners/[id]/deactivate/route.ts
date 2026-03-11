import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// 거래처 비활성화
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const partnerId = Number(id);

    if (Number.isNaN(partnerId)) {
      return NextResponse.json(
        { message: '올바르지 않은 거래처 ID입니다.' },
        { status: 400 },
      );
    }

    const exist = await prisma.partner.findUnique({
      where: { id: partnerId },
    });

    if (!exist) {
      return NextResponse.json(
        { message: '거래처를 찾을 수 없습니다.' },
        { status: 404 },
      );
    }

    const updated = await prisma.partner.update({
      where: { id: partnerId },
      data: {
        isActive: false,
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error('거래처 비활성화 오류:', error);
    return NextResponse.json(
      { message: '거래처 비활성화 중 오류가 발생했습니다.' },
      { status: 500 },
    );
  }
}