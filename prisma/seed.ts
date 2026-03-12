import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3';
import { PrismaClient } from '../app/generated/prisma/client';

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error('DATABASE_URL이 설정되지 않았습니다.');
}

const adapter = new PrismaBetterSqlite3({
  url: databaseUrl,
});

const prisma = new PrismaClient({ adapter });

function addDays(date: Date, days: number) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

function addMonths(date: Date, months: number) {
  const next = new Date(date);
  next.setMonth(next.getMonth() + months);
  return next;
}

function setTime(date: Date, hour: number, minute = 0) {
  const next = new Date(date);
  next.setHours(hour, minute, 0, 0);
  return next;
}

async function main() {
  console.log('시연용 더미데이터 생성 시작');

  await prisma.stockMovement.deleteMany();
  await prisma.saleOrderStatusLog.deleteMany();
  await prisma.purchaseOrderStatusLog.deleteMany();
  await prisma.saleOrderProduct.deleteMany();
  await prisma.purchaseOrderProduct.deleteMany();
  await prisma.saleOrder.deleteMany();
  await prisma.purchaseOrder.deleteMany();
  await prisma.partner.deleteMany();
  await prisma.product.deleteMany();
  await prisma.user.deleteMany();

  const suppliers = await Promise.all(
    Array.from({ length: 6 }, (_, index) =>
      prisma.partner.create({
        data: {
          name: `공급사${index + 1}`,
          type: 'SUPPLIER',
          phone: `010-1000-000${index + 1}`,
          email: `supplier${index + 1}@test.com`,
          isActive: true,
        },
      }),
    ),
  );

  const customers = await Promise.all(
    Array.from({ length: 6 }, (_, index) =>
      prisma.partner.create({
        data: {
          name: `고객사${index + 1}`,
          type: 'CUSTOMER',
          phone: `010-2000-000${index + 1}`,
          email: `customer${index + 1}@test.com`,
          isActive: true,
        },
      }),
    ),
  );

  const initialStocks = [
    18, 26, 30, 16, 12, 45, 52, 38, 28, 32, 60, 48, 32, 28, 30, 55, 42, 29, 16,
    24, 65, 58, 35, 24, 27, 70, 40, 30, 26, 22,
  ];

  const safetyStocks = [
    10, 18, 18, 8, 8, 20, 20, 20, 20, 18, 20, 20, 20, 18, 18, 20, 20, 18, 10,
    12, 20, 20, 20, 18, 18, 20, 20, 20, 16, 10,
  ];

  const products = await Promise.all(
    Array.from({ length: 30 }, (_, index) =>
      prisma.product.create({
        data: {
          code: `P${String(index + 1).padStart(3, '0')}`,
          name: `상품${index + 1}`,
          price: 1000 + (index + 1) * 150,
          safetyStock: safetyStocks[index],
          currentStock: initialStocks[index],
          isSale: true,
        },
      }),
    ),
  );

  const stockMap = new Map<number, number>();
  products.forEach((product) => {
    stockMap.set(product.id, product.currentStock);
  });

  const updateStock = async (
    productId: number,
    quantity: number,
    type: 'IN' | 'OUT' | 'ADJUST',
    createdAt: Date,
    memo: string,
    refId: number | null,
  ) => {
    const currentStock = stockMap.get(productId) ?? 0;

    let nextStock = currentStock;

    if (type === 'OUT') {
      nextStock = Math.max(currentStock - quantity, 0);
    } else {
      nextStock = Math.max(currentStock + quantity, 0);
    }

    await prisma.product.update({
      where: { id: productId },
      data: { currentStock: nextStock },
    });

    await prisma.stockMovement.create({
      data: {
        productId,
        quantity,
        type,
        memo,
        refId,
        stockAfter: nextStock,
        createdAt,
      },
    });

    stockMap.set(productId, nextStock);
  };

  const now = new Date();

  // 최근 6개월 완료 주문 생성
  const monthlyOrderCounts = [3, 4, 5, 6, 5, 7];
  const monthlyBaseQuantities = [8, 12, 16, 20, 18, 24];

  for (let monthIndex = 0; monthIndex < 6; monthIndex += 1) {
    const baseDate = addMonths(
      new Date(now.getFullYear(), now.getMonth(), 1),
      monthIndex - 5,
    );
    const orderCount = monthlyOrderCounts[monthIndex];
    const baseQty = monthlyBaseQuantities[monthIndex];

    for (let i = 0; i < orderCount; i += 1) {
      const customer = customers[(monthIndex + i) % customers.length];
      const createdAt = setTime(addDays(baseDate, i + 2), 10 + (i % 5), 15);

      const saleOrder = await prisma.saleOrder.create({
        data: {
          partnerId: customer.id,
          status: 'COMPLETED',
          createdAt,
        },
      });

      await prisma.saleOrderStatusLog.create({
        data: {
          saleId: saleOrder.id,
          status: 'RECEIVED',
          createdAt,
        },
      });

      await prisma.saleOrderStatusLog.create({
        data: {
          saleId: saleOrder.id,
          status: 'PROCESSING',
          createdAt,
        },
      });

      await prisma.saleOrderStatusLog.create({
        data: {
          saleId: saleOrder.id,
          status: 'COMPLETED',
          createdAt: addDays(createdAt, 1),
        },
      });

      const firstProduct = products[(monthIndex * 3 + i) % products.length];
      const secondProduct =
        products[(monthIndex * 3 + i + 7) % products.length];

      const firstQty = baseQty + (i % 3);
      const secondQty = Math.max(2, Math.floor(baseQty / 2) - (i % 2));

      await prisma.saleOrderProduct.create({
        data: {
          saleId: saleOrder.id,
          productId: firstProduct.id,
          quantity: firstQty,
          unitPrice: firstProduct.price,
        },
      });

      await updateStock(
        firstProduct.id,
        firstQty,
        'OUT',
        addDays(createdAt, 1),
        '더미 출고 처리',
        saleOrder.id,
      );

      await prisma.saleOrderProduct.create({
        data: {
          saleId: saleOrder.id,
          productId: secondProduct.id,
          quantity: secondQty,
          unitPrice: secondProduct.price,
        },
      });

      await updateStock(
        secondProduct.id,
        secondQty,
        'OUT',
        addDays(createdAt, 1),
        '더미 출고 처리',
        saleOrder.id,
      );
    }
  }

  // 최근 6개월 완료 발주 생성
  for (let monthIndex = 0; monthIndex < 6; monthIndex += 1) {
    const baseDate = addMonths(
      new Date(now.getFullYear(), now.getMonth(), 1),
      monthIndex - 5,
    );

    for (let i = 0; i < 2; i += 1) {
      const supplier = suppliers[(monthIndex + i) % suppliers.length];
      const createdAt = setTime(addDays(baseDate, i + 3), 9 + i, 20);

      const purchaseOrder = await prisma.purchaseOrder.create({
        data: {
          partnerId: supplier.id,
          status: 'COMPLETED',
          createdAt,
        },
      });

      await prisma.purchaseOrderStatusLog.create({
        data: {
          purchaseId: purchaseOrder.id,
          status: 'DRAFT',
          createdAt,
        },
      });

      await prisma.purchaseOrderStatusLog.create({
        data: {
          purchaseId: purchaseOrder.id,
          status: 'CONFIRMED',
          createdAt,
        },
      });

      await prisma.purchaseOrderStatusLog.create({
        data: {
          purchaseId: purchaseOrder.id,
          status: 'COMPLETED',
          createdAt: addDays(createdAt, 1),
        },
      });

      const firstProduct =
        products[(monthIndex * 2 + i + 10) % products.length];
      const secondProduct =
        products[(monthIndex * 2 + i + 15) % products.length];

      const firstQty = 15 + monthIndex + i;
      const secondQty = 10 + monthIndex;

      await prisma.purchaseOrderProduct.create({
        data: {
          purchaseId: purchaseOrder.id,
          productId: firstProduct.id,
          quantity: firstQty,
          unitPrice: firstProduct.price,
        },
      });

      await updateStock(
        firstProduct.id,
        firstQty,
        'IN',
        addDays(createdAt, 1),
        '더미 입고 처리',
        purchaseOrder.id,
      );

      await prisma.purchaseOrderProduct.create({
        data: {
          purchaseId: purchaseOrder.id,
          productId: secondProduct.id,
          quantity: secondQty,
          unitPrice: secondProduct.price,
        },
      });

      await updateStock(
        secondProduct.id,
        secondQty,
        'IN',
        addDays(createdAt, 1),
        '더미 입고 처리',
        purchaseOrder.id,
      );
    }
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // 오늘 완료 주문 2건
  for (let i = 0; i < 2; i += 1) {
    const customer = customers[i];
    const createdAt = setTime(today, 10 + i, 10);

    const saleOrder = await prisma.saleOrder.create({
      data: {
        partnerId: customer.id,
        status: 'COMPLETED',
        createdAt,
      },
    });

    await prisma.saleOrderStatusLog.create({
      data: {
        saleId: saleOrder.id,
        status: 'RECEIVED',
        createdAt,
      },
    });

    await prisma.saleOrderStatusLog.create({
      data: {
        saleId: saleOrder.id,
        status: 'PROCESSING',
        createdAt: setTime(today, 11 + i, 0),
      },
    });

    await prisma.saleOrderStatusLog.create({
      data: {
        saleId: saleOrder.id,
        status: 'COMPLETED',
        createdAt: setTime(today, 14 + i, 20),
      },
    });

    const product = products[i];
    const quantity = 4 + i;

    await prisma.saleOrderProduct.create({
      data: {
        saleId: saleOrder.id,
        productId: product.id,
        quantity,
        unitPrice: product.price,
      },
    });

    await updateStock(
      product.id,
      quantity,
      'OUT',
      setTime(today, 14 + i, 20),
      '오늘 출고 처리',
      saleOrder.id,
    );
  }

  // 오늘 진행 중 주문 2건
  for (let i = 0; i < 2; i += 1) {
    const customer = customers[i + 2];
    const createdAt = setTime(today, 15 + i, 5);

    const saleOrder = await prisma.saleOrder.create({
      data: {
        partnerId: customer.id,
        status: i === 0 ? 'RECEIVED' : 'PROCESSING',
        createdAt,
      },
    });

    await prisma.saleOrderStatusLog.create({
      data: {
        saleId: saleOrder.id,
        status: 'RECEIVED',
        createdAt,
      },
    });

    if (i === 1) {
      await prisma.saleOrderStatusLog.create({
        data: {
          saleId: saleOrder.id,
          status: 'PROCESSING',
          createdAt: setTime(today, 16, 0),
        },
      });
    }

    const product = products[i + 5];
    await prisma.saleOrderProduct.create({
      data: {
        saleId: saleOrder.id,
        productId: product.id,
        quantity: 3 + i,
        unitPrice: product.price,
      },
    });
  }

  // 오늘 취소 주문 1건
  {
    const createdAt = setTime(today, 13, 30);
    const saleOrder = await prisma.saleOrder.create({
      data: {
        partnerId: customers[5].id,
        status: 'CANCELED',
        createdAt,
      },
    });

    await prisma.saleOrderStatusLog.create({
      data: {
        saleId: saleOrder.id,
        status: 'RECEIVED',
        createdAt,
      },
    });

    await prisma.saleOrderStatusLog.create({
      data: {
        saleId: saleOrder.id,
        status: 'CANCELED',
        createdAt: setTime(today, 15, 10),
      },
    });

    await prisma.saleOrderProduct.create({
      data: {
        saleId: saleOrder.id,
        productId: products[11].id,
        quantity: 5,
        unitPrice: products[11].price,
      },
    });
  }

  // 오늘 완료 발주 2건
  for (let i = 0; i < 2; i += 1) {
    const supplier = suppliers[i];
    const createdAt = setTime(today, 9 + i, 15);

    const purchaseOrder = await prisma.purchaseOrder.create({
      data: {
        partnerId: supplier.id,
        status: 'COMPLETED',
        createdAt,
      },
    });

    await prisma.purchaseOrderStatusLog.create({
      data: {
        purchaseId: purchaseOrder.id,
        status: 'DRAFT',
        createdAt,
      },
    });

    await prisma.purchaseOrderStatusLog.create({
      data: {
        purchaseId: purchaseOrder.id,
        status: 'CONFIRMED',
        createdAt: setTime(today, 10 + i, 0),
      },
    });

    await prisma.purchaseOrderStatusLog.create({
      data: {
        purchaseId: purchaseOrder.id,
        status: 'COMPLETED',
        createdAt: setTime(today, 11 + i, 40),
      },
    });

    const product = products[i + 12];
    const quantity = 12 + i * 3;

    await prisma.purchaseOrderProduct.create({
      data: {
        purchaseId: purchaseOrder.id,
        productId: product.id,
        quantity,
        unitPrice: product.price,
      },
    });

    await updateStock(
      product.id,
      quantity,
      'IN',
      setTime(today, 11 + i, 40),
      '오늘 입고 처리',
      purchaseOrder.id,
    );
  }

  // 오늘 진행 중 발주 2건
  for (let i = 0; i < 2; i += 1) {
    const supplier = suppliers[i + 2];
    const createdAt = setTime(today, 12 + i, 10);

    const purchaseOrder = await prisma.purchaseOrder.create({
      data: {
        partnerId: supplier.id,
        status: i === 0 ? 'DRAFT' : 'CONFIRMED',
        createdAt,
      },
    });

    await prisma.purchaseOrderStatusLog.create({
      data: {
        purchaseId: purchaseOrder.id,
        status: 'DRAFT',
        createdAt,
      },
    });

    if (i === 1) {
      await prisma.purchaseOrderStatusLog.create({
        data: {
          purchaseId: purchaseOrder.id,
          status: 'CONFIRMED',
          createdAt: setTime(today, 13, 20),
        },
      });
    }

    await prisma.purchaseOrderProduct.create({
      data: {
        purchaseId: purchaseOrder.id,
        productId: products[i + 20].id,
        quantity: 9 + i,
        unitPrice: products[i + 20].price,
      },
    });
  }

  // 오늘 취소 발주 1건
  {
    const createdAt = setTime(today, 16, 10);
    const purchaseOrder = await prisma.purchaseOrder.create({
      data: {
        partnerId: suppliers[5].id,
        status: 'CANCELED',
        createdAt,
      },
    });

    await prisma.purchaseOrderStatusLog.create({
      data: {
        purchaseId: purchaseOrder.id,
        status: 'DRAFT',
        createdAt,
      },
    });

    await prisma.purchaseOrderStatusLog.create({
      data: {
        purchaseId: purchaseOrder.id,
        status: 'CANCELED',
        createdAt: setTime(today, 17, 0),
      },
    });

    await prisma.purchaseOrderProduct.create({
      data: {
        purchaseId: purchaseOrder.id,
        productId: products[24].id,
        quantity: 11,
        unitPrice: products[24].price,
      },
    });
  }

  // 오늘 ADJUST 3건
  await updateStock(
    products[2].id,
    -2,
    'ADJUST',
    setTime(today, 18, 0),
    '실사 차이 조정',
    null,
  );

  await updateStock(
    products[7].id,
    4,
    'ADJUST',
    setTime(today, 18, 20),
    '재고 보정',
    null,
  );

  await updateStock(
    products[18].id,
    -3,
    'ADJUST',
    setTime(today, 18, 40),
    '파손 수량 반영',
    null,
  );

  // 내일 데이터
  const tomorrow = addDays(today, 1);

  // 내일 완료 주문 2건
  for (let i = 0; i < 2; i += 1) {
    const createdAt = setTime(tomorrow, i, 30);

    const saleOrder = await prisma.saleOrder.create({
      data: {
        partnerId: customers[i].id,
        status: 'COMPLETED',
        createdAt,
      },
    });

    await prisma.saleOrderStatusLog.create({
      data: {
        saleId: saleOrder.id,
        status: 'RECEIVED',
        createdAt,
      },
    });

    await prisma.saleOrderStatusLog.create({
      data: {
        saleId: saleOrder.id,
        status: 'PROCESSING',
        createdAt: setTime(tomorrow, 1 + i, 0),
      },
    });

    await prisma.saleOrderStatusLog.create({
      data: {
        saleId: saleOrder.id,
        status: 'COMPLETED',
        createdAt: setTime(tomorrow, 2 + i, 0),
      },
    });

    const product = products[i + 8];
    const quantity = 5 + i;

    await prisma.saleOrderProduct.create({
      data: {
        saleId: saleOrder.id,
        productId: product.id,
        quantity,
        unitPrice: product.price,
      },
    });

    await updateStock(
      product.id,
      quantity,
      'OUT',
      setTime(tomorrow, 2 + i, 0),
      '출고 처리',
      saleOrder.id,
    );
  }

  // 내일 진행 중 주문 1건
  {
    const createdAt = setTime(tomorrow, 2, 10);
    const saleOrder = await prisma.saleOrder.create({
      data: {
        partnerId: customers[3].id,
        status: 'PROCESSING',
        createdAt,
      },
    });

    await prisma.saleOrderStatusLog.create({
      data: {
        saleId: saleOrder.id,
        status: 'RECEIVED',
        createdAt,
      },
    });

    await prisma.saleOrderStatusLog.create({
      data: {
        saleId: saleOrder.id,
        status: 'PROCESSING',
        createdAt: setTime(tomorrow, 2, 0),
      },
    });

    await prisma.saleOrderProduct.create({
      data: {
        saleId: saleOrder.id,
        productId: products[14].id,
        quantity: 6,
        unitPrice: products[14].price,
      },
    });
  }

  // 내일 완료 발주 2건
  for (let i = 0; i < 2; i += 1) {
    const createdAt = setTime(tomorrow, i, 0);

    const purchaseOrder = await prisma.purchaseOrder.create({
      data: {
        partnerId: suppliers[i].id,
        status: 'COMPLETED',
        createdAt,
      },
    });

    await prisma.purchaseOrderStatusLog.create({
      data: {
        purchaseId: purchaseOrder.id,
        status: 'DRAFT',
        createdAt,
      },
    });

    await prisma.purchaseOrderStatusLog.create({
      data: {
        purchaseId: purchaseOrder.id,
        status: 'CONFIRMED',
        createdAt: setTime(tomorrow, 1 + i, 10),
      },
    });

    await prisma.purchaseOrderStatusLog.create({
      data: {
        purchaseId: purchaseOrder.id,
        status: 'COMPLETED',
        createdAt: setTime(tomorrow, 2 + i, 30),
      },
    });

    const product = products[i + 16];
    const quantity = 14 + i * 2;

    await prisma.purchaseOrderProduct.create({
      data: {
        purchaseId: purchaseOrder.id,
        productId: product.id,
        quantity,
        unitPrice: product.price,
      },
    });

    await updateStock(
      product.id,
      quantity,
      'IN',
      setTime(tomorrow, 2 + i, 30),
      '입고 처리',
      purchaseOrder.id,
    );
  }

  // 내일 CONFIRMED 발주 1건
  {
    const createdAt = setTime(tomorrow, 1, 20);
    const purchaseOrder = await prisma.purchaseOrder.create({
      data: {
        partnerId: suppliers[4].id,
        status: 'CONFIRMED',
        createdAt,
      },
    });

    await prisma.purchaseOrderStatusLog.create({
      data: {
        purchaseId: purchaseOrder.id,
        status: 'DRAFT',
        createdAt,
      },
    });

    await prisma.purchaseOrderStatusLog.create({
      data: {
        purchaseId: purchaseOrder.id,
        status: 'CONFIRMED',
        createdAt: setTime(tomorrow, 2, 0),
      },
    });

    await prisma.purchaseOrderProduct.create({
      data: {
        purchaseId: purchaseOrder.id,
        productId: products[22].id,
        quantity: 10,
        unitPrice: products[22].price,
      },
    });
  }

  // 내일 ADJUST 2건
  await updateStock(
    products[4].id,
    3,
    'ADJUST',
    setTime(tomorrow, 2, 10),
    '재고 보정',
    null,
  );

  await updateStock(
    products[25].id,
    -2,
    'ADJUST',
    setTime(tomorrow, 1, 30),
    '파손 반영',
    null,
  );

  console.log('더미데이터 생성 완료');
}

main()
  .catch((error) => {
    console.error('시드 실행 중 오류 발생');
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
