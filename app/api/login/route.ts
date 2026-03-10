import { NextResponse } from 'next/server';
// api 응답 만드는 객체

// 하드코딩 계정
const ADMIN_ID = 'admin';
const ADMIN_PASSWORD = 'admin123';

// 로그인 요청
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { id, password } = body;

    if (!id || !password) {
      return NextResponse.json(
        { message: '아이디와 비밀번호를 입력하세요.' },
        { status: 400 },
      );
    }

    if (id !== ADMIN_ID || password !== ADMIN_PASSWORD) {
      return NextResponse.json(
        { message: '아이디 또는 비밀번호가 올바르지 않습니다.' },
        { status: 401 },
      );
    }

    const response = NextResponse.json(
      { message: '로그인 성공' },
      { status: 200 },
    );

    // 쿠키 저장 (이름: erp_auth, 값: admin)
    response.cookies.set('erp_auth', 'admin', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24,
    });

    return response;
  } catch (error) {
    console.error('login error', error);

    return NextResponse.json(
      { message: '로그인 처리 중 오류가 발생했습니다.' },
      { status: 500 },
    );
  }
}
