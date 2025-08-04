// KakaoCallback.tsx
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const KakaoCallback = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const fetchKakaoUser = async () => {
      const code = new URL(window.location.href).searchParams.get('code');
      if (!code) {
        alert('오류가 발생했습니다.'); // 코드가 없으면 오류 처리
        console.error('Kakao login code not found');
        navigate('/login');
        return;
      }

      try {
        // access_token 요청
        const tokenRes = await axios.post(
          'https://kauth.kakao.com/oauth/token',
          new URLSearchParams({
            grant_type: 'authorization_code',
            client_id: '99b61a29a2963e3f58d79a6f2e9eccb6',
            redirect_uri: 'http://49.50.134.171:80/kakao/callback', // 배포시 주소 교체
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
          sessionStorage.setItem('loginMember', JSON.stringify(serverRes.data.member));
          navigate('/dashboard');
        }
      } catch (error) {
        console.error('카카오 로그인 처리 실패:', error);
        alert('카카오 로그인 중 오류 발생');
        navigate('/login');
      }
    };

    fetchKakaoUser();
  }, [navigate]);

  return <div>카카오 로그인 처리 중입니다...</div>;
};

export default KakaoCallback;
