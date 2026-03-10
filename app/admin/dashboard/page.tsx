'use client';

import { useRouter } from 'next/navigation';

export default function DashboardPage() {
  const router = useRouter();

  const handleLogout = async () => {
    await fetch('/api/logout', {
      method: 'POST',
    });

    router.push('/login');
    router.refresh();
  };

  return (
    <div style={{ padding: '40px' }}>
      <h1>대시보드</h1>
      <p>로그인된 사용자만 접근 가능</p>
      <button onClick={handleLogout} style={{ marginTop: '20px' }}>
        로그아웃
      </button>
    </div>
  );
}