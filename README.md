# Next.js ERP Assignment

## 1. 프로젝트 소개

Next.js 기반으로 간단한 ERP 시스템을 구현하는 과제 프로젝트입니다.  
상품 및 거래처 관리, 구매/판매 프로세스, 대시보드 기능을 구현하는 것을 목표로 합니다.

## 2. 기술 스택

### 프레임워크: Next.js (App Router)

### 라이브러리: React

### 언어: TypeScript

- 타입 안정성을 확보하고 코드 가독성을 높이기 위해 사용합니다.

### 스타일링: Tailwind CSS

- 관리자 페이지 UI를 빠르게 구성하기 위해 사용합니다.

### 런타임 환경: Node.js

### 데이터베이스: SQLite, Prisma ORM

- 로컬 환경에서 쉽게 실행 가능하고 별도 DB 서버 설치가 필요 없기 때문에 선택하였습니다.
- Next.js 환경에서 데이터베이스 모델링과 CRUD 작업을 단순화하기 위해 사용합니다.

## 3. 프로젝트 구조

```text
/app
  /dashboard         // 대시보드 요약
  /login             // 로그인
  /partners          // 거래처 CRUD
  /products          // 상품 CRUD
  /purchase-orders   // 구매 처리
  /sales-orders      // 판매 처리
```

## 4. 주요 기능

### - 관리자 로그인

### - 상품 관리 (CRUD)

### - 거래처 관리 (CRUD)

### - 발주 생성 및 입고 처리

### - 주문 생성 및 출고 처리

### - 대시보드 요약 정보

## 5. 구현 범위

## 6. 실행 방법

```bash
npm install
npm run dev
```

## 7. 설계 의도

## 8. 향후 개선 사항
