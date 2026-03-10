# Next.js ERP Assignment

## 1. 프로젝트 소개

Next.js 기반으로 간단한 ERP 시스템을 구현하는 과제 프로젝트입니다.  
상품 및 거래처 관리, 구매/판매 프로세스, 대시보드 기능을 구현하는 것을 목표로 합니다.

## 2. 기술 스택

#### 프레임워크: Next.js (App Router)

#### 라이브러리: React

#### 언어: TypeScript

- 타입 안정성을 확보하고 코드 가독성을 높이기 위해 사용합니다.

#### 스타일링: Tailwind CSS

- 관리자 페이지 UI를 빠르게 구성하기 위해 사용합니다.

#### 인증: Cookie기반, Next.js Middleware

#### 런타임 환경: Node.js

#### 데이터베이스: SQLite, Prisma ORM

- 로컬 환경에서 쉽게 실행 가능하고 별도 DB 서버 설치가 필요 없기 때문에 선택하였습니다.
- Next.js 환경에서 데이터베이스 모델링과 CRUD 작업을 단순화하기 위해 사용합니다.

## 3. 프로젝트 구조

```text
/app
  /admin
    /dashboard         // 대시보드 요약
    /partners          // 거래처 CRUD
    /products          // 상품 CRUD
    /purchase-orders   // 구매 처리
    /sales-orders      // 판매 처리
  /api
    /login             // 로그인 API
    /logout            // 로그아웃 API
  /login               // 로그인
  /middleware.ts       // 인증 검증 미들웨어
```

비로그인시 접근 할 수 없는 경로를 미들웨어에서 단일화 하기 위해 보호 영역을 한 폴더로 지정하였습니다.

## 4. 주요 기능

### - 관리자 로그인

#### 개발용 계정

```text
ID: admin
Password: admin123
```

#### 인증 흐름

1. 로그인 페이지에서 관리자 계정 입력
2. /api/login API 호출
3. 서버에서 계정 검증
4. 성공 시 인증 쿠키 생성
5. middleware에서 보호 경로 접근 시 쿠키 검사
6. 인증 실패 시 로그인 페이지로 리다이렉트

#### 보호 경로

다음 경로는 인증이 필요한 관리자 영역입니다.

```text
/admin/*
```

### - 상품 관리 (CRUD)

### - 거래처 관리 (CRUD)

### - 발주 생성 및 입고 처리

### - 주문 생성 및 출고 처리

### - 대시보드 요약 정보

## 5. 구현 범위

## 6. 실행 방법

1. 저장소 클론

```bash
git clone <repository>
```

2. 패키지 설치

```bash
npm install
```

3. 개발 서버 실행

```bash
npm run dev
```

4. 브라우저 접속

```text
http://localhost:3000
```

## 7. 설계 의도

## 8. 향후 개선 사항
