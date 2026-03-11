import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// 상품 목록 조회
export async function GET(req: NextRequest) {
  try {
    const search = req.nextUrl.searchParams.get('search')?.trim() ?? '';

    const products = await prisma.product.findMany({
      where: search
        ? {
            OR: [
              { name: { contains: search } },
              { code: { contains: search } },
            ],
          }
        : {},
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json(products);
  } catch (error) {
    console.error('상품 목록 조회 오류:', error);
    return NextResponse.json(
      { message: '상품 목록 조회 중 오류가 발생했습니다.' },
      { status: 500 },
    );
  }
}

// 상품 등록
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const code = body.code?.trim();
    const name = body.name?.trim();
    const price = Number(body.price);
    const safetyStock = Number(body.safetyStock);

    // 상품코드, 상품명 존재 확인
    if (!code || !name) {
      return NextResponse.json(
        { message: '상품코드와 상품명은 필수입니다.' },
        { status: 400 },
      );
    }

    // 단가 값 확인
    if (Number.isNaN(price) || price < 0) {
      return NextResponse.json(
        { message: '단가는 0 이상의 숫자여야 합니다.' },
        { status: 400 },
      );
    }

    // 안전재고 갯수 확인
    if (Number.isNaN(safetyStock) || safetyStock < 0) {
      return NextResponse.json(
        { message: '안전재고는 0 이상의 숫자여야 합니다.' },
        { status: 400 },
      );
    }

    const exist = await prisma.product.findUnique({
      where: { code },
    });

    if (exist) {
      return NextResponse.json(
        { message: '이미 존재하는 상품코드입니다.' },
        { status: 409 },
      );
    }

    const product = await prisma.product.create({
      data: {
        code,
        name,
        price,
        safetyStock,
        currentStock: 0,
      },
    });

    return NextResponse.json(product, { status: 201 });
  } catch (error) {
    console.error('상품 등록 오류:', error);
    return NextResponse.json(
      { message: '상품 등록 중 오류가 발생했습니다.' },
      { status: 500 },
    );
  }
}
