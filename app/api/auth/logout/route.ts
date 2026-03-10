import { NextResponse } from 'next/server';

export async function POST() {
  try {
    const res = NextResponse.json(
      { message: '로그아웃 완료' },
      { status: 200 },
    );

    res.cookies.set('erp_auth', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 0,
    });

    return res;

  } catch (error) {
    console.error('logout error:', error);

    return NextResponse.json(
      { message: '로그인 아웃 중 오류가 발생했습니다.' },
      { status: 500 },
    );
  }
}
