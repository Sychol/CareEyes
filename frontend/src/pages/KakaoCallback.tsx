// KakaoCallback.tsx
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useProfileManagement } from '../hooks/useProfileManagement';

const KakaoCallback = () => {
  const navigate = useNavigate();
  const { fetchUserProfile } = useProfileManagement();

  useEffect(() => {
    const run = async () => {
      const url = new URL(window.location.href);
      const code = url.searchParams.get('code');
      const state = url.searchParams.get('state'); // 'link'면 계정 연동

      if (!code) {
        alert('인가 코드가 없습니다.');
        navigate('/login');
        return;
      }

      try {
        if (state === 'link') {
          // ✅ 계정 연동: code만 서버에 전달, 교환/매핑은 백엔드에서 처리
          await axios.post('/api/member/account/link-kakao', { code }, { withCredentials: true });
          await fetchUserProfile();
          alert('카카오 계정이 연동되었습니다!');
          navigate('/profile');
          return;
        }

        // ✅ 로그인: 토큰 교환/유저조회/세션 생성 모두 백엔드에서 1회 처리
        await axios.get(`/api/auth/kakao/callback?code=${encodeURIComponent(code)}`, {
          withCredentials: true,
        });

        // 세션 확인 후 라우팅
        const me = await axios.get('/api/member/userinfo', { withCredentials: true });
        console.log('✅ 로그인 유저 정보:', me.data);
        const role = me.data.memberRole;
        navigate(role === 'ADMIN' ? '/' : '/airport');
      } catch (err: any) {
        console.error('카카오 처리 실패:', err?.response?.data || err?.message);
        alert('카카오 로그인/연동 실패');
        navigate('/login');
      }
    };

    run();
  }, [navigate, fetchUserProfile]);

  return <div>카카오 로그인 처리 중입니다...</div>;
};

export default KakaoCallback;
