import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// 거래처 상세 조회
export async function GET(
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

    const partner = await prisma.partner.findUnique({
      where: { id: partnerId },
    });

    if (!partner) {
      return NextResponse.json(
        { message: '거래처를 찾을 수 없습니다.' },
        { status: 404 },
      );
    }

    return NextResponse.json(partner);
  } catch (error) {
    console.error('거래처 상세 조회 오류:', error);
    return NextResponse.json(
      { message: '거래처 조회 중 오류가 발생했습니다.' },
      { status: 500 },
    );
  }
}

// 거래처 수정
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

    const body = await req.json();

    const name = body.name?.trim();
    const type = body.type;
    const phone = body.phone?.trim();
    const email = body.email?.trim() ?? null;
    const isActive = body.isActive;

    if (!name || !type || !phone) {
      return NextResponse.json(
        { message: '거래처명, 유형, 연락처는 필수입니다.' },
        { status: 400 },
      );
    }

    if (type !== 'CUSTOMER' && type !== 'SUPPLIER') {
      return NextResponse.json(
        { message: '거래처 유형이 올바르지 않습니다.' },
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
        name,
        type,
        phone,
        email,
        isActive,
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error('거래처 수정 오류:', error);
    return NextResponse.json(
      { message: '거래처 수정 중 오류가 발생했습니다.' },
      { status: 500 },
    );
  }
}