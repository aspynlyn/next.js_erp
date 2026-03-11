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
    const page = Number(req.nextUrl.searchParams.get('page') ?? '1');
    const pageSize = Number(req.nextUrl.searchParams.get('pageSize') ?? '8');

    const currentPage = Number.isNaN(page) || page < 1 ? 1 : page;
    const take = Number.isNaN(pageSize) || pageSize < 1 ? 8 : pageSize;
    const skip = (currentPage - 1) * take;

    const where = search
      ? {
          name: { contains: search },
        }
      : {};

    const [partners, totalCount] = await Promise.all([
      prisma.partner.findMany({
        where,
        orderBy: {
          createdAt: 'desc',
        },
        skip,
        take,
      }),
      prisma.partner.count({
        where,
      }),
    ]);

    const totalPages = Math.max(1, Math.ceil(totalCount / take));

    return NextResponse.json({
      items: partners,
      totalCount,
      totalPages,
      currentPage,
    });
  } catch (error) {
    console.error('거래처 목록 조회 오류:', error);
    return NextResponse.json(
      { message: '거래처 목록 조회 중 오류가 발생했습니다.' },
      { status: 500 },
    );
  }
}