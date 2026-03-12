import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

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
          product: {
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
          },
        }
      : {};

    const [stockMovements, totalCount] = await Promise.all([
      prisma.stockMovement.findMany({
        where,
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
        skip,
        take,
      }),
      prisma.stockMovement.count({
        where,
      }),
    ]);

    const totalPages = Math.max(1, Math.ceil(totalCount / take));

    return NextResponse.json({
      items: stockMovements,
      totalCount,
      totalPages,
      currentPage,
    });
  } catch (error) {
    console.error('재고 변동 이력 조회 오류:', error);
    return NextResponse.json(
      { message: '재고 변동 이력 조회 중 오류가 발생했습니다.' },
      { status: 500 },
    );
  }
}