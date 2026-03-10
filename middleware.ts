import { NextRequest, NextResponse } from 'next/server';

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const authCookie = req.cookies.get('erp_auth')?.value;

  const isLoginPage = pathname === '/login';
  const isProtectedPage = pathname.startsWith('/admin');

  // 보호 페이지 접근 && 쿠키 없음 -> 로그인 페이지로 이동
  if (isProtectedPage && !authCookie) {
    return NextResponse.redirect(new URL('/login', req.url));
  }

  // 로그인 페이지 접근 && 쿠키 있음 -> 대시보드 페이지로 이동
  if (isLoginPage && authCookie) {
    return NextResponse.redirect(new URL('/admin/dashboard', req.url));
  }

  return NextResponse.next();
}

// 미들웨어 실행 될 위지 지정
export const config = {
  matcher: ['/login', '/admin/:path*'],
};
