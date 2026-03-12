import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

type LowStockProduct = {
  id: number;
  code: string;
  name: string;
  currentStock: number;
  safetyStock: number;
};

type SalesTrendItem = {
  month: string;
  quantity: number;
};

const getStartOfToday = () => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return today;
};

const getStartOfTomorrow = () => {
  const tomorrow = new Date();
  tomorrow.setHours(24, 0, 0, 0);
  return tomorrow;
};

const getMonthKey = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
};

export async function GET() {
  try {
    const startOfToday = getStartOfToday();
    const startOfTomorrow = getStartOfTomorrow();

    const sixMonthsStart = new Date();
    sixMonthsStart.setDate(1);
    sixMonthsStart.setHours(0, 0, 0, 0);
    sixMonthsStart.setMonth(sixMonthsStart.getMonth() - 5);

    const [todayOrderCount, todayInboundCount, todayOutboundCount, products, outMovements] =
      await Promise.all([
        prisma.saleOrder.count({
          where: {
            createdAt: {
              gte: startOfToday,
              lt: startOfTomorrow,
            },
          },
        }),

prisma.purchaseOrderStatusLog.count({
  where: {
    status: 'COMPLETED',
    createdAt: {
      gte: startOfToday,
      lt: startOfTomorrow,
    },
  },
}),

prisma.saleOrderStatusLog.count({
  where: {
    status: 'COMPLETED',
    createdAt: {
      gte: startOfToday,
      lt: startOfTomorrow,
    },
  },
}),

        prisma.product.findMany({
          where: {
            isSale: true,
          },
          select: {
            id: true,
            code: true,
            name: true,
            currentStock: true,
            safetyStock: true,
          },
          orderBy: {
            createdAt: 'desc',
          },
        }),

        prisma.stockMovement.findMany({
          where: {
            type: 'OUT',
            createdAt: {
              gte: sixMonthsStart,
            },
          },
          select: {
            quantity: true,
            createdAt: true,
          },
          orderBy: {
            createdAt: 'asc',
          },
        }),
      ]);

    const lowStockProducts: LowStockProduct[] = products
      .filter((product) => product.currentStock <= product.safetyStock)
      .sort((a, b) => {
        if (a.currentStock !== b.currentStock) {
          return a.currentStock - b.currentStock;
        }

        return b.safetyStock - a.safetyStock;
      });

    const lowStockCount = lowStockProducts.length;

    const salesTrendMap = new Map<string, number>();

    for (let i = 0; i < 6; i += 1) {
      const date = new Date(sixMonthsStart);
      date.setMonth(sixMonthsStart.getMonth() + i);
      salesTrendMap.set(getMonthKey(date), 0);
    }

    outMovements.forEach((movement) => {
      const key = getMonthKey(new Date(movement.createdAt));

      if (!salesTrendMap.has(key)) {
        return;
      }

      salesTrendMap.set(key, (salesTrendMap.get(key) ?? 0) + movement.quantity);
    });

    const salesTrend: SalesTrendItem[] = Array.from(salesTrendMap.entries()).map(
      ([month, quantity]) => ({
        month,
        quantity,
      }),
    );

    return NextResponse.json(
      {
        summary: {
          todayOrderCount,
          todayInboundCount,
          todayOutboundCount,
          lowStockCount,
        },
        lowStockProducts: lowStockProducts.slice(0, 5),
        salesTrend,
      },
      { status: 200 },
    );
  } catch (error) {
    console.error('GET /api/dashboard error:', error);

    return NextResponse.json(
      { message: '대시보드 데이터를 불러오는 중 오류가 발생했습니다.' },
      { status: 500 },
    );
  }
}