import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// 상품 상세 조회
export async function GET(
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

    const product = await prisma.product.findUnique({
      where: { id: productId },
    });

    if (!product) {
      return NextResponse.json(
        { message: '해당 상품을 찾을 수 없습니다.' },
        { status: 404 },
      );
    }

    return NextResponse.json(product, { status: 200 });
  } catch (error) {
    console.error('상품 상세 조회 오류:', error);
    return NextResponse.json(
      { message: '상품 상세 조회 중 오류가 발생했습니다.' },
      { status: 500 },
    );
  }
}

// 상품 수정
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

    const body = await req.json();

    const code = body.code?.trim();
    const name = body.name?.trim();
    const price = Number(body.price);
    const safetyStock = Number(body.safetyStock);
    const currentStock = Number(body.currentStock);
    const isSale = body.isSale;

    if (!code || !name) {
      return NextResponse.json(
        { message: '상품코드와 상품명은 필수입니다.' },
        { status: 400 },
      );
    }

    if (Number.isNaN(price) || price < 0) {
      return NextResponse.json(
        { message: '단가는 0 이상의 숫자여야 합니다.' },
        { status: 400 },
      );
    }

    if (Number.isNaN(safetyStock) || safetyStock < 0) {
      return NextResponse.json(
        { message: '안전재고는 0 이상의 숫자여야 합니다.' },
        { status: 400 },
      );
    }

    if (Number.isNaN(currentStock) || currentStock < 0) {
      return NextResponse.json(
        { message: '현재재고는 0 이상의 숫자여야 합니다.' },
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

    const duplicateCodeProduct = await prisma.product.findFirst({
      where: {
        code,
        NOT: {
          id: productId,
        },
      },
    });

    if (duplicateCodeProduct) {
      return NextResponse.json(
        { message: '이미 존재하는 상품코드입니다.' },
        { status: 409 },
      );
    }

    const updatedProduct = await prisma.product.update({
      where: { id: productId },
      data: {
        code,
        name,
        price,
        safetyStock,
        currentStock,
        isSale,
      },
    });

    return NextResponse.json(updatedProduct, { status: 200 });
  } catch (error) {
    console.error('상품 수정 오류:', error);
    return NextResponse.json(
      { message: '상품 수정 중 오류가 발생했습니다.' },
      { status: 500 },
    );
  }
}
