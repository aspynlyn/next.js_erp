import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    const search = searchParams.get('search')?.trim() ?? '';
    const page = Number(searchParams.get('page') ?? '1');
    const pageSize = Number(searchParams.get('pageSize') ?? '8');

    const currentPage = Number.isNaN(page) || page < 1 ? 1 : page;
    const take = Number.isNaN(pageSize) || pageSize < 1 ? 8 : pageSize;
    const skip = (currentPage - 1) * take;

    const where = search
      ? {
          OR: [
            {
              code: {
                contains: search,
              },
            },
            {
              name: {
                contains: search,
              },
            },
          ],
        }
      : {};

    const [items, totalCount] = await Promise.all([
      prisma.product.findMany({
        where,
        orderBy: {
          id: 'desc',
        },
        skip,
        take,
      }),
      prisma.product.count({
        where,
      }),
    ]);

    const totalPages = Math.max(1, Math.ceil(totalCount / take));

    return NextResponse.json({
      items,
      totalCount,
      totalPages,
      currentPage,
    });
  } catch (error) {
    console.error('상품 목록 조회 오류', error);

    return NextResponse.json(
      {
        message: '상품 목록을 불러오는 중 오류가 발생했습니다.',
      },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const code = String(body.code ?? '').trim();
    const name = String(body.name ?? '').trim();
    const price = Number(body.price);
    const safetyStock = Number(body.safetyStock);
    const currentStock = Number(body.currentStock);
    const isSale = Boolean(body.isSale);

    if (!code) {
      return NextResponse.json(
        { message: '상품 코드를 입력해 주세요.' },
        { status: 400 },
      );
    }

    if (!name) {
      return NextResponse.json(
        { message: '상품명을 입력해 주세요.' },
        { status: 400 },
      );
    }

    if (Number.isNaN(price) || price < 0) {
      return NextResponse.json(
        { message: '단가는 0 이상의 숫자로 입력해 주세요.' },
        { status: 400 },
      );
    }

    if (Number.isNaN(safetyStock) || safetyStock < 0) {
      return NextResponse.json(
        { message: '안전 재고는 0 이상의 숫자로 입력해 주세요.' },
        { status: 400 },
      );
    }

    if (Number.isNaN(currentStock) || currentStock < 0) {
      return NextResponse.json(
        { message: '현재 재고는 0 이상의 숫자로 입력해 주세요.' },
        { status: 400 },
      );
    }

    const duplicatedProduct = await prisma.product.findUnique({
      where: {
        code,
      },
    });

    if (duplicatedProduct) {
      return NextResponse.json(
        { message: '이미 사용 중인 상품코드입니다.' },
        { status: 409 },
      );
    }

    const product = await prisma.product.create({
      data: {
        code,
        name,
        price,
        safetyStock,
        currentStock,
        isSale,
      },
    });

    return NextResponse.json(product, { status: 201 });
  } catch (error) {
    console.error('상품 등록 오류', error);

    return NextResponse.json(
      {
        message: '상품 저장 중 오류가 발생했습니다.',
      },
      { status: 500 },
    );
  }
}
