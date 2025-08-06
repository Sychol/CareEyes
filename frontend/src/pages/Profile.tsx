// 회원 정보 페이지 v1.5

import React from 'react';
import { useProfileManagement } from '../hooks/useProfileManagement';

// 이미지 에셋 import
import KakaoLogo from '../assets/profile/kakao.png';
import NaverLogo from '../assets/profile/naver.png';
import GoogleLogo from '../assets/profile/google.png';
import CareEyesLogo from '../assets/logo/CareEyes_Logo.png'
/**
 * @function Profile
 * @description 사용자 프로필 정보를 표시하고 수정하는 페이지 컴포넌트입니다.
 */
const Profile = () => {
    const {
        profile,
        isLoading,
        error,
        currentPassword,
        newPassword,
        confirmNewPassword,
        passwordChangeMessage,
        newPasswordValidation,
        passwordMatch,
        isPasswordValid,
        phonePart1,
        phonePart2,
        phonePart3,
        showNewPassword,
        showConfirmNewPassword,
        isNewPasswordFocused,
        isConfirmNewPasswordFocused,
        handleEmailChange,
        handlePhonePartChange,
        handleCurrentPasswordChange,
        handleNewPasswordChange,
        handleConfirmNewPasswordChange,
        handleNewPasswordFocus,
        handleNewPasswordBlur,
        handleConfirmNewPasswordFocus,
        handleConfirmNewPasswordBlur,
        toggleNewPasswordVisibility,
        toggleConfirmNewPasswordVisibility,
        updateProfile,
        handleKakaoConnect,
        handleKakaoDisconnect,
        handleNaverConnect,
        handleNaverDisconnect,
        handleGoogleConnect,
        handleGoogleDisconnect,
    } = useProfileManagement();


    /**
     * @function handleSubmit
     * @description 폼 제출 시 프로필 정보를 업데이트합니다.
     * @param {React.FormEvent} e - 폼 이벤트 객체
     */
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        updateProfile();
    };

    /**
     * @function handleCancel
     * @description 취소 버튼 클릭 시 이전 페이지로 돌아갑니다.
     */
    const handleCancel = () => {
        window.history.back(); // 이전 페이지로 돌아가기
    };


    if (isLoading) {
        return (
            <div className="flex justify-center items-center h-screen bg-gray-100 font-inter">
                <div className="p-8 bg-white rounded-2xl shadow-lg w-full max-w-2xl text-center">
                    <p className="text-xl font-semibold text-gray-700">로딩 중...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4 sm:p-6 lg:p-8 font-inter">
            <div className="bg-white rounded-2xl shadow-lg w-full max-w-2xl p-6 sm:p-8 lg:p-10 max-h-[calc(100vh-5rem)] overflow-y-auto
                        scrollbar-hide">
                {/* 로고 또는 프로필 공간 */}
                <div className="flex justify-center mb-6">
                    <div className="w-24 h-24 rounded-full bg-gray-200 flex items-center justify-center text-gray-500">
                        {/* 필요시 로고 대신 프로필 사진 삽입 가능 */}
                        <img src={CareEyesLogo} alt="CareEyes 로고" className="w-full h-full object-cover rounded-full" />
                    </div>
                </div>
                <h1 className="text-3xl sm:text-4xl font-extrabold text-center text-gray-800 mb-8">회원정보</h1>
                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* 소셜 계정 연동 섹션 */}
                    <section className="space-y-1 mt-8">
                        <h2 className="text-2xl font-bold text-gray-700">소셜 계정</h2>

                        {/* 카카오 연동 */}
                        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl shadow-inner">
                            <div className="flex items-center gap-4">
                                <img src={KakaoLogo} alt="카카오 로고" className="w-8 h-8" />
                                <span className="text-base font-medium text-gray-700">카카오</span>
                            </div>
                            {profile.kakaoId ? (
                                <button
                                    type="button"
                                    className="px-5 py-2 bg-red-600 text-white border-none rounded-lg cursor-pointer text-base font-medium transition duration-300 ease-in-out whitespace-nowrap hover:bg-red-700"
                                    onClick={handleKakaoDisconnect}
                                    title="카카오 계정 연동 해지"
                                >
                                    연동 해제
                                </button>
                            ) : (
                                <button
                                    type="button"
                                    className="px-5 py-2 bg-yellow-400 text-black border-none rounded-lg cursor-pointer text-base font-medium transition duration-300 ease-in-out whitespace-nowrap hover:bg-yellow-500"
                                    onClick={handleKakaoConnect}
                                    title="카카오 계정 연동"
                                >
                                    연동하기
                                </button>
                            )}
                        </div>

                        {/* 네이버 연동 */}
                        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl shadow-inner">
                            <div className="flex items-center gap-4">
                                <img src={NaverLogo} alt="네이버 로고" className="w-8 h-8" />
                                <span className="text-base font-medium text-gray-700">네이버</span>
                            </div>
                            {profile.naverId ? (
                                <button
                                    type="button"
                                    className="px-5 py-2 bg-red-600 text-white border-none rounded-lg cursor-pointer text-base font-medium transition duration-300 ease-in-out whitespace-nowrap hover:bg-red-700"
                                    onClick={handleNaverDisconnect}
                                    title="네이버 계정 연동 해지"
                                >
                                    연동 해제
                                </button>
                            ) : (
                                <button
                                    type="button"
                                    className="px-5 py-2 bg-green-500 text-white border-none rounded-lg cursor-pointer text-base font-medium transition duration-300 ease-in-out whitespace-nowrap hover:bg-green-600"
                                    onClick={handleNaverConnect}
                                    title="네이버 계정 연동"
                                >
                                    연동하기
                                </button>
                            )}
                        </div>

                        {/* 구글 연동 */}
                        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl shadow-inner">
                            <div className="flex items-center gap-4">
                                <img src={GoogleLogo} alt="구글 로고" className="w-8 h-8" />
                                <span className="text-base font-medium text-gray-700">구글</span>
                            </div>
                            {profile.googleId ? (
                                <button
                                    type="button"
                                    className="px-5 py-2 bg-red-600 text-white border-none rounded-lg cursor-pointer text-base font-medium transition duration-300 ease-in-out whitespace-nowrap hover:bg-red-700"
                                    onClick={handleGoogleDisconnect}
                                    title="구글 계정 연동 해지"
                                >
                                    연동 해제
                                </button>
                            ) : (
                                <button
                                    type="button"
                                    className="px-5 py-2 bg-blue-500 text-white border-none rounded-lg cursor-pointer text-base font-medium transition duration-300 ease-in-out whitespace-nowrap hover:bg-blue-600"
                                    onClick={handleGoogleConnect}
                                    title="구글 계정 연동"
                                >
                                    연동하기
                                </button>
                            )}
                        </div>

                    </section>
                   
                    {/* 사용자 정보 섹션 */}
                    
                    <section className="space-y-4">
                        <h2 className="text-2xl font-bold text-gray-700">개인 정보</h2>

                     {/* 멤버 ID (읽기 전용) */}
<div>
    <label htmlFor="memberId" className="block text-sm font-medium text-gray-600 mb-1">ID</label>
    <input
        id="memberId"
        type="text"
        value={profile.memberId}
        className="w-full p-3 border border-gray-300 rounded-lg bg-gray-100 cursor-not-allowed" // 읽기 전용 스타일
        title="회원 ID"
        disabled // 수정 불가능하게 설정
    />
</div>

                        {/* 회원 이름 (읽기 전용) */}
                        <div>
                            <label htmlFor="memberName" className="block text-sm font-medium text-gray-600 mb-1">이름</label>
                            <input
                                id="memberName"
                                type="text"
                                value={profile.memberName}
                                className="w-full p-3 border border-gray-300 rounded-lg bg-gray-100 cursor-not-allowed" // 읽기 전용 스타일
                                title="회원 이름"
                                disabled // 수정 불가능하게 설정
                            />
                        </div>

                        <div>
                            <label htmlFor="email" className="block text-sm font-medium text-gray-600 mb-1">이메일</label>
                            <input
                                id="email"
                                type="email"
                                value={profile.email}
                                onChange={handleEmailChange}
                                className="w-full p-3 border border-gray-300 rounded-lg 
               focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 
               transition-colors duration-200"
                                placeholder="이메일 주소"
                                required
                                title="이메일 주소"
                            />
                        </div>
                        <div>
                            <label htmlFor="phoneNumber" className="block text-sm font-medium text-gray-600 mb-1">전화번호</label>
                            <div className="flex space-x-2">
                                <input
                                    id="phonePart1"
                                    type="text"
                                    value={phonePart1}
                                    onChange={(e) => handlePhonePartChange(1, e.target.value)}
                                    className="w-1/3 p-3 text-center border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-colors duration-200"
                                    maxLength={3}
                                    aria-label="전화번호 첫째 자리"
                                    title="전화번호 첫째 자리"
                                />
                                <input
                                    id="phonePart2"
                                    type="text"
                                    value={phonePart2}
                                    onChange={(e) => handlePhonePartChange(2, e.target.value)}
                                    className="w-1/3 p-3 text-center border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-colors duration-200"
                                    maxLength={4}
                                    aria-label="전화번호 둘째 자리"
                                    title="전화번호 둘째 자리"
                                />
                                <input
                                    id="phonePart3"
                                    type="text"
                                    value={phonePart3}
                                    onChange={(e) => handlePhonePartChange(3, e.target.value)}
                                    className="w-1/3 p-3 text-center border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-colors duration-200"
                                    maxLength={4}
                                    aria-label="전화번호 셋째 자리"
                                    title="전화번호 셋째 자리"
                                />
                            </div>
                        </div>

                        {/* 소속 (읽기 전용) */}
                        <div>
                            <label htmlFor="company" className="block text-sm font-medium text-gray-600 mb-1">소속</label>
                            <input
                                id="company"
                                type="text"
                                value={profile.company || ''}
                                className="w-full p-3 border border-gray-300 rounded-lg bg-gray-100 cursor-not-allowed" // 읽기 전용 스타일
                                title="소속 회사"
                                disabled // 수정 불가능하게 설정
                            />
                        </div>

                        {/* 부서 (읽기 전용) */}
                        <div>
                            <label htmlFor="department" className="block text-sm font-medium text-gray-600 mb-1">부서</label>
                            <input
                                id="department"
                                type="text"
                                value={profile.department || ''}
                                className="w-full p-3 border border-gray-300 rounded-lg bg-gray-100 cursor-not-allowed" // 읽기 전용 스타일
                                title="부서"
                                disabled // 수정 불가능하게 설정
                            />
                        </div>

                    </section>

                    {/* 비밀번호 변경 섹션 */}
                    <section className="space-y-4 mt-8">
                        <h2 className="text-2xl font-bold text-gray-700 flex items-center justify-between">
                            비밀번호 변경
                        </h2>
                        <div>
                            <label htmlFor="currentPassword" className="block text-sm font-medium text-gray-600 mb-1">현재 비밀번호</label>
                            <div className="relative">
                                <input
                                    id="currentPassword"
                                    type="password"
                                    value={currentPassword}
                                    onChange={handleCurrentPasswordChange}
                                    className="w-full p-3 pr-10 border border-gray-300 rounded-lg 
                           focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 
                           transition-colors duration-200"
                                    placeholder="현재 비밀번호를 입력해주세요"
                                    title="현재 비밀번호"
                                />
                                <span className="absolute inset-y-0 right-0 pr-3 flex items-center text-sm leading-5">
                                    <button
                                        type="button"
                                        className="text-gray-500 hover:text-gray-700"
                                        onClick={() => { console.log('비밀번호 보기/숨기기 토글') }} // 실제 토글 함수를 여기에 연결
                                        title="현재 비밀번호 보기/숨기기"
                                    >
                                        <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                                            <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                                            <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
                                        </svg>
                                    </button>
                                </span>
                            </div>
                        </div>
                        <div>
                            <label htmlFor="newPassword" className="block text-sm font-medium text-gray-600 mb-1">새 비밀번호</label>
                            <div className="relative">
                                <input
                                    id="newPassword"
                                    type={showNewPassword ? 'text' : 'password'}
                                    value={newPassword}
                                    onChange={handleNewPasswordChange}
                                    onFocus={handleNewPasswordFocus}
                                    onBlur={handleNewPasswordBlur}
                                     className="w-full p-3 pr-10 border border-gray-300 rounded-lg 
                           focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 
                           transition-colors duration-200"
                                    placeholder="8자 이상, 영문/숫자/특수문자 중 2가지 이상"
                                    title="새 비밀번호"
                                />
                                <span className="absolute inset-y-0 right-0 pr-3 flex items-center text-sm leading-5">
                                    <button
                                        type="button"
                                        className="text-gray-500 hover:text-gray-700"
                                        onClick={toggleNewPasswordVisibility}
                                        title="새 비밀번호 보기/숨기기"
                                    >
                                        <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                                            <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                                            <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
                                        </svg>
                                    </button>
                                </span>
                            </div>
                            {isNewPasswordFocused && newPassword.length > 0 && (
                                <ul className="mt-2 text-sm text-gray-600 list-inside space-y-1">
                                    <li className={`flex items-center ${newPasswordValidation.length ? 'text-green-500' : 'text-red-500'}`}>
                                        <span className="mr-2">{newPasswordValidation.length ? '✓' : '✗'}</span>
                                        8자 이상
                                    </li>
                                    <li className={`flex items-center ${newPasswordValidation.minTwoTypes ? 'text-green-500' : 'text-red-500'}`}>
                                        <span className="mr-2">{newPasswordValidation.minTwoTypes ? '✓' : '✗'}</span>
                                        2종류 이상 문자 조합
                                    </li>
                                </ul>
                            )}
                            {newPasswordValidation.warning && (
                                <p className="mt-2 text-sm text-red-500">{newPasswordValidation.warning}</p>
                            )}
                        </div>
                        <div>
                            <label htmlFor="confirmNewPassword" className="block text-sm font-medium text-gray-600 mb-1">새 비밀번호 확인</label>
                            <div className="relative">
                                <input
                                    id="confirmNewPassword"
                                    type={showConfirmNewPassword ? 'text' : 'password'}
                                    value={confirmNewPassword}
                                    onChange={handleConfirmNewPasswordChange}
                                    onFocus={handleConfirmNewPasswordFocus}
                                    onBlur={handleConfirmNewPasswordBlur}
                                     className="w-full p-3 pr-10 border border-gray-300 rounded-lg 
                           focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 
                           transition-colors duration-200"
                                    placeholder="새 비밀번호를 다시 입력해주세요"
                                    title="새 비밀번호 확인"
                                />
                                <span className="absolute inset-y-0 right-0 pr-3 flex items-center text-sm leading-5">
                                    <button
                                        type="button"
                                        className="text-gray-500 hover:text-gray-700"
                                        onClick={toggleConfirmNewPasswordVisibility}
                                        title="새 비밀번호 확인 보기/숨기기"
                                    >
                                        <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                                            <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                                            <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
                                        </svg>
                                    </button>
                                </span>
                            </div>
                            {isConfirmNewPasswordFocused && newPassword.length > 0 && (
                                <p className={`mt-2 text-sm ${passwordMatch.isMatch ? 'text-green-500' : 'text-red-500'}`}>
                                    {passwordMatch.message}
                                </p>
                            )}
                        </div>
                    </section>

                    {error && <p className="text-center mt-5 p-3 rounded-lg text-base font-medium bg-red-100 text-red-600">{error}</p>}
                    {passwordChangeMessage && <p className="text-center mt-5 p-3 rounded-lg text-base font-medium bg-green-100 text-green-600">{passwordChangeMessage}</p>}

                    {/* 버튼 섹션 */}
                    <div className="flex justify-center mt-8 gap-4">
                        <button
                            type="submit"
                            className="px-6 py-3 border-none rounded-lg text-base font-semibold cursor-pointer transition duration-300 ease-in-out min-w-32 text-center hover:-translate-y-0.5 text-white bg-careeyes"
                        >
                            정보 수정
                        </button>
                        {/* 취소 버튼 */}
                        <button
                            type="button"
                            onClick={handleCancel}
                            className="px-6 py-3 border border-gray-300 rounded-lg text-base font-semibold cursor-pointer transition duration-300 ease-in-out min-w-32 text-center hover:-translate-y-0.5 bg-white text-gray-700 hover:bg-gray-100"
                        >
                            취소
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default Profile;