import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// 거래처 등록
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const name = body.name?.trim();
    const type = body.type;
    const phone = body.phone?.trim();
    const email = body.email?.trim() ?? null;

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

    const partner = await prisma.partner.create({
      data: {
        name,
        type,
        phone,
        email,
      },
    });

    return NextResponse.json(partner, { status: 201 });
  } catch (error) {
    console.error('거래처 등록 오류:', error);
    return NextResponse.json(
      { message: '거래처 등록 중 오류가 발생했습니다.' },
      { status: 500 },
    );
  }
}
// 거래처 목록 조회
export async function GET(req: NextRequest) {
  try {
    const search = req.nextUrl.searchParams.get('search')?.trim() ?? '';

    const partners = await prisma.partner.findMany({
      where: search
        ? {
            OR: [
              { name: { contains: search } },
              { phone: { contains: search } },
            ],
          }
        : {},
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json(partners);
  } catch (error) {
    console.error('거래처 목록 조회 오류:', error);
    return NextResponse.json(
      { message: '거래처 목록 조회 중 오류가 발생했습니다.' },
      { status: 500 },
    );
  }
}