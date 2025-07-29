import React, { useState, useEffect, FormEvent } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
// CSS 파일 임포트
import '../styles/Login.css';
// 유효성 검사 함수 임포트
import { validateLoginForm } from '../ts/Login/Login';
// 필요한 이미지 파일들 임포트
import CareEyesLogo from '../assets/logo/CareEyes_title Logo_nobg.png';
import KakaoIconImage from '../assets/profile/KakaoLogo.png';
import NaverIconImage from '../assets/profile/NaverLogo.png';


/**
 * @function Login
 * @description 로그인 페이지 컴포넌트
 * @returns {JSX.Element} Login 컴포넌트
 */
const Login = () => {
  // 상태 변수 선언
  const [memberId, setMemberId] = useState('');
  const [memberPw, setMemberPw] = useState('');
  const [rememberMe, setRememberMe] = useState(false);

  const [memberIdError, setMemberIdError] = useState('');
  const [memberPwError, setMemberPwError] = useState('');
  const [kakaoLoginUrl, setKakaoLoginUrl] = useState('');
  const navigate = useNavigate();

  // 카카오 로그인 URL 불러오기
  useEffect(() => {
    axios.get('/oauth/kakao/url')
      .then(res => {
        console.log('카카오 로그인 URL:', kakaoLoginUrl);
        setKakaoLoginUrl(res.data);
      })
      .catch(err => console.error('Kakao URL 불러오기 실패:', err));
  }, []);

  /**
   * @function GoogleIcon
   * @description 구글 로고 SVG 아이콘을 렌더링하는 컴포넌트.
   * @returns {JSX.Element} 구글 SVG 아이콘 엘리먼트.
   */
  const GoogleIcon = () => (
    <svg version="1.1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" xmlnsXlink="http://www.w3.org/1999/xlink" className="google-icon-svg">
      <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"></path>
      <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"></path>
      <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"></path>
      <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"></path>
      <path fill="none" d="M0 0h48v48H0z"></path>
    </svg>
  );

  /**
   * @function handleSubmit
   * @description 로그인 폼 제출 시 실행되는 함수. 유효성 검사 후 로그인 로직 실행.
   * @param {FormEvent<HTMLFormElement>} e - 폼 제출 이벤트 객체.
   */
  const handleSubmit = async (e: FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();

    const { MEMBER_IDError: newMemberIdError, PWError: newMemberPwError, isValid } = validateLoginForm(memberId, memberPw);

    setMemberIdError(newMemberIdError);
    setMemberPwError(newMemberPwError);

    if (!isValid) {
      return;
    }

    console.log('Login attempt:', { memberId, memberPw, rememberMe });

    // 로그인 API 호출 (백엔드로 아이디와 비밀번호를 전송)
    try {
      const response = await axios.post('/api/login', { memberId, memberPw });
      console.log('Login successful:', response.data);

      // DOM 조작 대신 메시지 상태를 업데이트하는 방식으로 변경
      alert('로그인 성공!');
    } catch (error: any) {
      console.error('Login failed:', error);
      // DOM 조작 대신 메시지 상태를 업데이트하는 방식으로 변경
      alert(error.response?.data?.message || '로그인 실패: 아이디 또는 비밀번호를 다시 확인해주세요.');
    }
  };

  /**
   * @function goManager
   * @description 관리자 페이지로 이동합니다.
   */
  const goManager = () => {
    navigate('/manager');
  };

  /**
   * @function goWorker
   * @description 작업자 페이지로 이동합니다.
   */
  const goWorker = () => {
    navigate('/worker');
  };

  return (
    // 로그인 페이지 전체 컨테이너
    <div className="login-container">
      <div className="login-right-panel">
        <div className="login-form">
          {/* 로고 섹션 */}
          <div className="logo-section">
            <div className="logo-icon">
              <img src={CareEyesLogo} alt="CareEyes Logo" className="logo-image" />
            </div>
            <h1 className="logo-title">CareEyes</h1>
            <p className="logo-subtitle">활주로 FOD 탐지 서비스 CareEyes</p>
          </div>

          {/* 로그인 폼 */}
          <form onSubmit={handleSubmit}>
            <div className="input-group">
              <input
                type="text"
                className="input-field"
                placeholder="아이디"
                value={memberId}
                onChange={(e) => setMemberId(e.target.value)}
              />
            </div>
            {memberIdError && <span className="error-message">{memberIdError}</span>}
            <div className="input-group">
              <input
                type="password"
                className="input-field"
                placeholder="비밀번호"
                value={memberPw}
                onChange={(e) => setMemberPw(e.target.value)}
              />
            </div>
            {memberPwError && <span className="error-message">{memberPwError}</span>}

            {/* 아이디 기억하기 체크박스 */}
            <div className="checkbox-container">
              <input
                type="checkbox"
                id="remember"
                className="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
              />
              <label htmlFor="remember" className="checkbox-label">
                아이디 기억하기
              </label>
            </div>

            {/* 로그인 버튼 */}
            <button type="submit" className="login-button">
              로그인
            </button>
          </form>

          {/* 소셜 로그인 버튼*/}
          <div className="social-section">
            <p>또는 소셜 계정으로 로그인</p>
            <div className="social-icons">
              <button
                onClick={() => {
                  if (kakaoLoginUrl) {
                    console.log('이동할 URL 👉', kakaoLoginUrl);
                    window.location.href = kakaoLoginUrl;
                  } else {
                    alert('카카오 로그인 URL을 불러오는 중입니다. 잠시 후 다시 시도해주세요.');
                  }
                }}
                className="kakao-material-button"
                type="button"
                aria-label="카카오 로그인"
              >
                <div className="kakao-material-button-content-wrapper">
                  <div className="kakao-material-button-icon">
                    <img src={KakaoIconImage} alt="카카오 로그인" className="kakao-icon-image" />
                  </div>
                  <span className="kakao-material-button-contents">Kakao 로그인</span>
                </div>
              </button>
              <button
                onClick={() => window.open('https://www.naver.com', '_blank')}
                className="naver-material-button"
                type="button"
              >
                <div className="naver-material-button-content-wrapper">
                  <div className="naver-material-button-icon">
                    <img src={NaverIconImage} alt="네이버 로그인" className="naver-icon-image" />
                  </div>
                  <span className="naver-material-button-contents">Naver 로그인</span>
                </div>
              </button>
              <button className="gsi-material-button">
                <div className="gsi-material-button-state"></div>
                <div className="gsi-material-button-content-wrapper">
                  <div className="gsi-material-button-icon">
                    <svg version="1.1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" xmlnsXlink="http://www.w3.org/1999/xlink" className="google-icon-svg">
                      <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"></path>
                      <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"></path>
                      <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"></path>
                      <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"></path>
                      <path fill="none" d="M0 0h48v48H0z"></path>
                    </svg>
                  </div>
                  <span className="gsi-material-button-contents">Google 로그인</span>
                </div>
              </button>
            </div>
          </div>

          {/* 회원가입 페이지 이동 */}
          <div className="join-section">
            <p className="join-text">
              아직 회원이 아니신가요?{' '}
              <Link to="/join" className="join-link">
                회원가입
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
