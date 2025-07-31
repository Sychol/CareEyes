// src/pages/Profile.tsx

import React from 'react';
import { useProfileManagement } from '../hooks/useProfileManagement';

import styles from '../styles/Profile.module.css';
import KakaoLogo from '../assets/profile/KakaoLogo.png';

/**
 * @function ProfilePage
 * @description 사용자 프로필 정보를 표시하고 수정하는 페이지 컴포넌트
 */
const ProfilePage: React.FC = () => {
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
        handleUpdateProfile,
        handleKakaoConnect,
        handleKakaoDisconnect,
    } = useProfileManagement();

    /**
     * @function renderPasswordFeedback
     * @description 새 비밀번호 유효성 검사 피드백 메시지를 렌더링합니다.
     * @returns {JSX.Element | null} 유효성 피드백 메시지 JSX 또는 null
     */
    const renderPasswordFeedback = () => {
        // 새 비밀번호 필드에 포커스가 없으면 메시지를 숨깁니다.
        if (!isNewPasswordFocused) {
            return null;
        }

        // 새 비밀번호가 비어있고, 확인 비밀번호만 입력되었거나 확인 비밀번호 필드에 포커스가 있는 경우
        if (newPassword.length === 0 && (confirmNewPassword.length > 0 || isConfirmNewPasswordFocused)) {
            return (
                <div className={styles['password-feedback-container']}>
                    <p className={styles.invalid}>
                        새 비밀번호를 먼저 입력해주세요.
                    </p>
                </div>
            );
        }

        // 새 비밀번호 필드에 포커스가 있거나, 새 비밀번호가 입력되기 시작했고 유효성 검사가 필요한 경우
        // newPasswordValidation이 null이 아닐 때만 feedback 속성에 접근
        if (newPassword.length > 0 && newPasswordValidation) {
            const feedback = newPasswordValidation?.feedback;
            // minTwoTypes 속성이 있는지 확인하고 사용합니다.
            const isMinTwoTypesValid = feedback && 'minTwoTypes' in feedback ? feedback.minTwoTypes : false;

            return (
                <div className={styles['password-feedback-container']}>
                    <p className={feedback?.length ? styles.valid : styles.invalid}>
                        비밀번호는 8자 이상이어야 합니다.
                    </p>
                    <p className={isMinTwoTypesValid ? styles.valid : styles.invalid}>
                        비밀번호는 2종류 이상 문자 조합이어야 합니다.
                    </p>
                    {newPasswordValidation?.warning && (
                        <p className={styles['warning-text']}>
                            {newPasswordValidation.warning}
                        </p>
                    )}
                </div>
            );
        }

        return null;
    };

    /**
     * @function renderConfirmPasswordMatch
     * @description 새 비밀번호 확인 필드 아래에 일치 여부 메시지를 렌더링합니다.
     * @returns {JSX.Element | null} 일치 여부 메시지 JSX 또는 null
     */
    const renderConfirmPasswordMatch = () => {
        // 확인 비밀번호 필드에 포커스가 없으면 메시지를 숨깁니다.
        if (!isConfirmNewPasswordFocused) {
            return null;
        }

        // 새 비밀번호가 입력되었고, 확인 비밀번호가 입력되기 시작했거나 포커스가 있을 때
        if (newPassword.length > 0 && (confirmNewPassword.length > 0 || isConfirmNewPasswordFocused)) {
            // passwordMatch 객체가 존재할 때만 메시지 표시
            if (passwordMatch) {
                return (
                    <div className={styles['password-feedback-container']}>
                        <p className={passwordMatch.isMatch ? styles.valid : styles.invalid}>
                            {passwordMatch.message}
                        </p>
                    </div>
                );
            } else if (isConfirmNewPasswordFocused && confirmNewPassword.length === 0) {
                // 새 비밀번호는 있는데 확인 비밀번호가 비어있고, 확인 필드에 포커스가 있는 경우
                return (
                    <div className={styles['password-feedback-container']}>
                        <p className={styles.invalid}>
                            비밀번호 확인을 입력해주세요.
                        </p>
                    </div>
                );
            }
        }
        return null;
    };

    // 로딩 중일 때 로딩 메시지를 표시합니다.
    if (isLoading) {
        return <div className={styles.loadingMessage}>프로필 정보를 불러오는 중입니다...</div>;
    }

    return (
        <div className={styles.profileContainer}>
            <h2 className={styles.pageTitle}>내 정보</h2>
            <form onSubmit={handleUpdateProfile}>
                <section>
                    <h3 className={styles.sectionTitle}>기본 정보</h3>
                    <div className={styles.formGroup}>
                        <label htmlFor="memberId" className={styles.label}>아이디</label>
                        <input
                            type="text"
                            id="memberId"
                            name="memberId"
                            value={profile.memberId}
                            readOnly
                            className={styles.inputField}
                            title="사용자 아이디"
                        />
                    </div>
                    <div className={styles.formGroup}>
                        <label htmlFor="memberName" className={styles.label}>이름</label>
                        <input
                            type="text"
                            id="memberName"
                            name="memberName"
                            value={profile.memberName}
                            readOnly // 이름 필드를 읽기 전용으로 변경
                            className={styles.inputField}
                            placeholder="이름을 입력하세요"
                            title="이름"
                        />
                    </div>
                    <div className={styles.formGroup}>
                        <label htmlFor="email" className={styles.label}>이메일</label>
                        <input
                            type="email"
                            id="email"
                            name="email"
                            value={profile.email}
                            onChange={handleEmailChange}
                            className={styles.inputField}
                            placeholder="이메일을 입력하세요"
                            title="이메일 주소"
                        />
                    </div>
                    <div className={styles.formGroup}>
                        <label htmlFor="phone" className={styles.label}>전화번호</label>
                        <div className={styles.phoneNumberInputGroup}>
                            <input
                                type="text"
                                id="phonePart1"
                                value={phonePart1}
                                onChange={(e) => handlePhonePartChange(1, e.target.value)}
                                className={`${styles.inputField} ${styles.phonePart1}`}
                                maxLength={3}
                                placeholder="010"
                                title="전화번호 첫째 자리"
                            />
                            <span>-</span>
                            <input
                                type="text"
                                id="phonePart2"
                                value={phonePart2}
                                onChange={(e) => handlePhonePartChange(2, e.target.value)}
                                className={`${styles.inputField} ${styles.phonePart2}`}
                                maxLength={4}
                                placeholder="1234"
                                title="전화번호 둘째 자리"
                            />
                            <span>-</span>
                            <input
                                type="text"
                                id="phonePart3"
                                value={phonePart3}
                                onChange={(e) => handlePhonePartChange(3, e.target.value)}
                                className={`${styles.inputField} ${styles.phonePart3}`}
                                maxLength={4}
                                placeholder="5678"
                                title="전화번호 셋째 자리"
                            />
                        </div>
                    </div>
                </section>

                <section>
                    <h3 className={styles.sectionTitle}>비밀번호 변경</h3>
                    <div className={styles.formGroup}>
                        <label htmlFor="currentPassword" className={styles.label}>현재 비밀번호</label>
                        <div className={styles.passwordFieldGroup}>
                            <input
                                type={showNewPassword ? 'text' : 'password'}
                                id="currentPassword"
                                value={currentPassword}
                                onChange={handleCurrentPasswordChange}
                                className={styles.inputField}
                                placeholder="현재 비밀번호"
                                title="현재 비밀번호"
                            />
                            <i
                                className={`${styles.passwordToggleIcon} fas ${showNewPassword ? 'fa-eye' : 'fa-eye-slash'}`}
                                onClick={toggleNewPasswordVisibility}
                                aria-label={showNewPassword ? '현재 비밀번호 숨기기' : '현재 비밀번호 보기'}
                                title={showNewPassword ? '현재 비밀번호 숨기기' : '현재 비밀번호 보기'}
                            ></i>
                        </div>
                    </div>
                    <div className={styles.formGroup}>
                        <label htmlFor="newPassword" className={styles.label}>새 비밀번호</label>
                        <div className={styles.passwordFieldGroup}>
                            <input
                                type={showNewPassword ? 'text' : 'password'}
                                id="newPassword"
                                value={newPassword}
                                onChange={handleNewPasswordChange}
                                onFocus={handleNewPasswordFocus}
                                onBlur={handleNewPasswordBlur}
                                className={styles.inputField}
                                placeholder="새 비밀번호"
                                title="새 비밀번호"
                            />
                            <i
                                className={`${styles.passwordToggleIcon} fas ${showNewPassword ? 'fa-eye' : 'fa-eye-slash'}`}
                                onClick={toggleNewPasswordVisibility}
                                aria-label={showNewPassword ? '새 비밀번호 숨기기' : '새 비밀번호 보기'}
                                title={showNewPassword ? '새 비밀번호 숨기기' : '새 비밀번호 보기'}
                            ></i>
                        </div>
                    </div>
                    {renderPasswordFeedback()}
                    <div className={styles.formGroup}>
                        <label htmlFor="confirmNewPassword" className={styles.label}>새 비밀번호 확인</label>
                        <div className={styles.passwordFieldGroup}>
                            <input
                                type={showConfirmNewPassword ? 'text' : 'password'}
                                id="confirmNewPassword"
                                value={confirmNewPassword}
                                onChange={handleConfirmNewPasswordChange}
                                onFocus={handleConfirmNewPasswordFocus}
                                onBlur={handleConfirmNewPasswordBlur}
                                className={styles.inputField}
                                placeholder="새 비밀번호 확인"
                                title="새 비밀번호 확인"
                            />
                            <i
                                className={`${styles.passwordToggleIcon} fas ${showConfirmNewPassword ? 'fa-eye' : 'fa-eye-slash'}`}
                                onClick={toggleConfirmNewPasswordVisibility}
                                aria-label={showConfirmNewPassword ? '새 비밀번호 확인 숨기기' : '새 비밀번호 확인 보기'}
                                title={showConfirmNewPassword ? '새 비밀번호 확인 숨기기' : '새 비밀번호 확인 보기'}
                            ></i>
                        </div>
                    </div>
                    {renderConfirmPasswordMatch()}
                </section>

                <section>
                    <h3 className={styles.sectionTitle}>회사 정보</h3>
                    <div className={styles.formGroup}>
                        <label htmlFor="memberRole" className={styles.label}>역할</label>
                        <input
                            type="text"
                            id="memberRole"
                            name="memberRole"
                            value={profile.memberRole === 'ADMIN' ? '관리자' : '작업자'} // '직원'을 '작업자'로 변경
                            readOnly
                            className={styles.inputField}
                            title="사용자 역할"
                        />
                    </div>
                    <div className={styles.formGroup}>
                        <label htmlFor="company" className={styles.label}>회사명</label>
                        <input
                            type="text"
                            id="company"
                            name="company"
                            value={profile.company || ''} // null일 경우 빈 문자열로 표시
                            readOnly
                            className={styles.inputField}
                            title="회사명"
                        />
                    </div>
                    <div className={styles.formGroup}>
                        <label htmlFor="department" className={styles.label}>부서</label>
                        <input
                            type="text"
                            id="department"
                            name="department"
                            value={profile.department || ''} // null일 경우 빈 문자열로 표시
                            readOnly
                            className={styles.inputField}
                            title="부서명"
                        />
                    </div>
                </section>

                <section>
                    <h3 className={styles.sectionTitle}>카카오 계정 연동</h3>
                    <div className={styles.formGroup}>
                        <label htmlFor="kakaoId" className={styles.label}>카카오 ID</label>
                        {profile.kakaoId ? (
                            <div className={styles.kakaoStatusWrapper}>
                                <span className={styles.kakaoConnectedEmail}>{profile.kakaoId}</span>
                                <button
                                    type="button"
                                    className={styles.kakaoDisconnectButton}
                                    onClick={handleKakaoDisconnect}
                                    title="카카오 계정 연동 해지"
                                >
                                    연동 해제
                                </button>
                            </div>
                        ) : (
                            <button
                                type="button"
                                className={`${styles.kakaoButton} ${styles.kakaoConnectButtonWithIcon}`}
                                onClick={handleKakaoConnect}
                                title="카카오 계정 연동"
                            >
                                <img src={KakaoLogo} alt="카카오 로그인" className={styles.kakaoButtonIcon} />
                                카카오계정 연동하기
                            </button>
                        )}
                    </div>
                </section>

                {error && <p className={styles.errorMessage}>{error}</p>}
                {passwordChangeMessage && <p className={styles.successMessage}>{passwordChangeMessage}</p>}

                <div className={styles.bottomButtonGroup}>
                    <button type="submit" className={`${styles.button} ${styles.primaryButton}`}>정보 수정</button>
                </div>
            </form>
        </div>
    );
};

export default ProfilePage;
