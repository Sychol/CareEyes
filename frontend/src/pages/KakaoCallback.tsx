// KakaoCallback.tsx
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const KakaoCallback = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const fetchKakaoUser = async () => {
      const code = new URL(window.location.href).searchParams.get('code');
      const state = new URL(window.location.href).searchParams.get('state'); // 'link'면 연동

      if (!code) {
        alert('인가 코드가 없습니다.');
        navigate('/login');
        return;
      }

      try {
        if (state === 'link') {
          // ✅ 연동 로직
          await axios.post('/api/member/account/link-kakao', { code }, { withCredentials: true });
          alert('카카오 계정이 연동되었습니다!');
          navigate('/profile'); // 연동 후 이동할 곳
        } else {
        // access_token 요청
        const tokenRes = await axios.post(
          'https://kauth.kakao.com/oauth/token',
          new URLSearchParams({
            grant_type: 'authorization_code',
            client_id: '99b61a29a2963e3f58d79a6f2e9eccb6',
            redirect_uri: 'http://localhost:5173/kakao/callback', // 배포시 주소 교체
            code,
          }),
          {
            // 카카오가 요구하는 Content-Type
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          }
        );

        const accessToken = tokenRes.data.access_token;

        // 사용자 정보 요청
        const kakaoRes = await axios.get('https://kapi.kakao.com/v2/user/me', {
          headers: { Authorization: `Bearer ${accessToken}` },
        });

        const kakaoId = kakaoRes.data.id;

        // 우리 서버에 kakaoId 보내기
        const serverRes = await axios.post('/api/member/kakao-login', { kakaoId });

        if (serverRes.data.status === 'NEW_USER') {
          alert('회원가입이 필요합니다.');
          navigate('/join', { state: { kakaoId } });
        } else {
          const member = serverRes.data.member;
          sessionStorage.setItem('loginMember', JSON.stringify(member));
            navigate(member.memberRole === 'ADMIN' ? '/' : '/airport');
          }
        }
      } catch (error) {
        console.error('카카오 처리 실패:', error);
        alert('카카오 로그인/연동 실패');
        navigate('/login');
      }
    };

    fetchKakaoUser();
  }, [navigate]);

  return <div>카카오 로그인 처리 중입니다...</div>;
};

export default KakaoCallback;
