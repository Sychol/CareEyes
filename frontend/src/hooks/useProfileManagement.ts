// src/hooks/useProfileManagement.ts

import { useState, useEffect, useCallback, useMemo } from 'react';
import { UserProfile, DEFAULT_USER_PROFILE } from '../types/src/types/user';
import axios from 'axios';

/**
 * @function useProfileManagement
 * @description 사용자 프로필 정보 조회, 수정 및 소셜 계정 연동을 관리하는 커스텀 훅입니다.
 * @returns {object} 프로필 관련 상태, 핸들러 함수들
 */
export const useProfileManagement = () => {
    const [profile, setProfile] = useState<UserProfile>(DEFAULT_USER_PROFILE);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // 비밀번호 변경 관련 상태
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmNewPassword, setConfirmNewPassword] = useState('');
    const [passwordChangeMessage, setPasswordChangeMessage] = useState<string | null>(null);

    // 전화번호를 부분별로 관리
    const [phonePart1, setPhonePart1] = useState('');
    const [phonePart2, setPhonePart2] = useState('');
    const [phonePart3, setPhonePart3] = useState('');

    // 새 비밀번호 가시성 상태
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [showConfirmNewPassword, setShowConfirmNewPassword] = useState(false);

    // 비밀번호 유효성 검사 관련 상태 (포커스 여부)
    const [isNewPasswordFocused, setIsNewPasswordFocused] = useState(false);
    const [isConfirmNewPasswordFocused, setIsConfirmNewPasswordFocused] = useState(false);

    const handleWithdrawal = async () => {
    // 사용자에게 확인 메시지를 표시
    if (window.confirm("정말로 회원 탈퇴를 하시겠습니까? 모든 정보가 삭제되며 되돌릴 수 없습니다.")) {
        try {
            const response = await axios.post('/api/withdrawal'); // 실제 API 경로로 수정
            if (response.data.success) {
                // 탈퇴 성공 시, 로그아웃 처리 후 로그인 페이지로 이동
                alert("회원 탈퇴가 완료되었습니다.");
                // 로그인 페이지로 이동하는 로직 추가
                // 예: window.location.href = '/login';
            } else {
                alert("회원 탈퇴에 실패했습니다: " + response.data.message);
            }
        } catch (err) {
            console.error(err);
            alert("회원 탈퇴 중 오류가 발생했습니다.");
        }
    }
};

    /**
     * @function fetchUserProfile
     * @description 사용자 프로필 정보를 API로부터 비동기적으로 가져옵니다.
     */
    const fetchUserProfile = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            // 🚀 목업 데이터를 실제 API 응답으로 교체하는 방법:
            // 아래 주석 처리된 코드를 활성화하시고, `/api/user/profile` 경로를
            // 실제 사용자 프로필 정보를 가져오는 API 엔드포인트로 변경해 주세요.
            const response = await axios.get('/api/member/userinfo', {
            withCredentials: true,
            });
            const fetchedProfile: UserProfile = response.data;
            
            setProfile(fetchedProfile);

            // 전화번호를 부분별로 분리
            if (fetchedProfile.phone) {
                const parts = fetchedProfile.phone.split('-');
                if (parts.length === 3) {
                    setPhonePart1(parts[0]);
                    setPhonePart2(parts[1]);
                    setPhonePart3(parts[2]);
                } else {
                    // 유효하지 않은 형식의 경우 초기화
                    setPhonePart1('');
                    setPhonePart2('');
                    setPhonePart3('');
                }
            } else {
                setPhonePart1('');
                setPhonePart2('');
                setPhonePart3('');
            }

        } catch (err) {
            console.error('Failed to fetch user profile:', err);
            setError('프로필 정보를 불러오는데 실패했습니다.');
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchUserProfile();
    }, [fetchUserProfile]);

    /**
     * @function handleEmailChange
     * @description 이메일 입력 필드의 변경을 처리합니다.
     * @param {React.ChangeEvent<HTMLInputElement>} e - 변경 이벤트 객체
     */
    const handleEmailChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        setProfile(prevProfile => ({ ...prevProfile, email: e.target.value }));
    }, []);

    /**
     * @function handlePhonePartChange
     * @description 전화번호 부분 입력 필드의 변경을 처리합니다.
     * @param {number} partNum - 변경된 전화번호 부분의 인덱스 (1, 2, 3)
     * @param {string} value - 입력된 값
     */
    const handlePhonePartChange = useCallback((partNum: number, value: string) => {
        const numericValue = value.replace(/\D/g, ''); // 숫자만 남기기
        if (partNum === 1) setPhonePart1(numericValue);
        else if (partNum === 2) setPhonePart2(numericValue);
        else if (partNum === 3) setPhonePart3(numericValue);
    }, []);

    /**
     * @function handleCompanyChange
     * @description 소속 입력 필드의 변경을 처리합니다.
     * @param {string} value - 입력된 값
     */
    const handleCompanyChange = useCallback((value: string) => {
        setProfile(prevProfile => ({ ...prevProfile, company: value }));
    }, []);

    /**
     * @function handleDepartmentChange
     * @description 부서 입력 필드의 변경을 처리합니다.
     * @param {string} value - 입력된 값
     */
    const handleDepartmentChange = useCallback((value: string) => {
        setProfile(prevProfile => ({ ...prevProfile, department: value }));
    }, []);


    /**
     * @function handleCurrentPasswordChange
     * @description 현재 비밀번호 입력 필드의 변경을 처리합니다.
     * @param {React.ChangeEvent<HTMLInputElement>} e - 변경 이벤트 객체
     */
    const handleCurrentPasswordChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        setCurrentPassword(e.target.value);
    }, []);

    /**
     * @function handleNewPasswordChange
     * @description 새 비밀번호 입력 필드의 변경을 처리합니다.
     * @param {React.ChangeEvent<HTMLInputElement>} e - 변경 이벤트 객체
     */
    const handleNewPasswordChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        setNewPassword(e.target.value);
    }, []);

    /**
     * @function handleConfirmNewPasswordChange
     * @description 새 비밀번호 확인 입력 필드의 변경을 처리합니다.
     * @param {React.ChangeEvent<HTMLInputElement>} e - 변경 이벤트 객체
     */
    const handleConfirmNewPasswordChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        setConfirmNewPassword(e.target.value);
    }, []);

    /**
     * @function handleNewPasswordFocus
     * @description 새 비밀번호 입력 필드에 포커스 되었을 때 상태를 업데이트합니다.
     */
    const handleNewPasswordFocus = useCallback(() => {
        setIsNewPasswordFocused(true);
    }, []);

    /**
     * @function handleNewPasswordBlur
     * @description 새 비밀번호 입력 필드에서 포커스가 해제되었을 때 상태를 업데이트합니다.
     */
    const handleNewPasswordBlur = useCallback(() => {
        setIsNewPasswordFocused(false);
    }, []);

    /**
     * @function handleConfirmNewPasswordFocus
     * @description 새 비밀번호 확인 입력 필드에 포커스 되었을 때 상태를 업데이트합니다.
     */
    const handleConfirmNewPasswordFocus = useCallback(() => {
        setIsConfirmNewPasswordFocused(true);
    }, []);

    /**
     * @function handleConfirmNewPasswordBlur
     * @description 새 비밀번호 확인 입력 필드에서 포커스가 해제되었을 때 상태를 업데이트합니다.
     */
    const handleConfirmNewPasswordBlur = useCallback(() => {
        setIsConfirmNewPasswordFocused(false);
    }, []);

    /**
     * @function toggleNewPasswordVisibility
     * @description 새 비밀번호 입력 필드의 가시성을 토글합니다.
     */
    const toggleNewPasswordVisibility = useCallback(() => {
        setShowNewPassword(prev => !prev);
    }, []);

    /**
     * @function toggleConfirmNewPasswordVisibility
     * @description 새 비밀번호 확인 입력 필드의 가시성을 토글합니다.
     */
    const toggleConfirmNewPasswordVisibility = useCallback(() => {
        setShowConfirmNewPassword(prev => !prev);
    }, []);

    /**
     * @function resetPasswordFields
     * @description 비밀번호 변경 관련 입력 필드를 초기화합니다.
     */
    const resetPasswordFields = useCallback(() => {
        setCurrentPassword('');
        setNewPassword('');
        setConfirmNewPassword('');
        setPasswordChangeMessage(null);
    }, []);

    /**
     * @function newPasswordValidation
     * @description 새 비밀번호의 유효성 조건을 검사합니다.
     * @returns {object} 길이, 2가지 이상 문자 조합, 경고 메시지 포함
     */
    const newPasswordValidation = useMemo(() => {
        const hasLength = newPassword.length >= 8;
        const hasLetters = /[a-zA-Z]/.test(newPassword);
        const hasNumbers = /[0-9]/.test(newPassword);
        const hasSpecialChars = /[!@#$%^&*(),.?":{}|<>]/.test(newPassword);

        let typesCount = 0;
        if (hasLetters) typesCount++;
        if (hasNumbers) typesCount++;
        if (hasSpecialChars) typesCount++;

        const minTwoTypes = typesCount >= 2;

        let warning = '';
        if (newPassword.length > 0 && !hasLength) {
            warning = '비밀번호는 8자 이상이어야 합니다.';
        } else if (newPassword.length > 0 && !minTwoTypes) {
            warning = '비밀번호는 영문/숫자/특수문자 중 2가지 이상을 조합해야 합니다.';
        }

        return {
            length: hasLength,
            minTwoTypes: minTwoTypes,
            warning: warning,
        };
    }, [newPassword]);

    /**
     * @function passwordMatch
     * @description 새 비밀번호와 새 비밀번호 확인 필드의 일치 여부를 검사합니다.
     * @returns {object} 일치 여부와 메시지 포함
     */
    const passwordMatch = useMemo(() => {
        if (confirmNewPassword.length === 0) {
            return { isMatch: false, message: '' };
        }
        if (newPassword === confirmNewPassword) {
            return { isMatch: true, message: '비밀번호가 일치합니다.' };
        }
        return { isMatch: false, message: '비밀번호가 일치하지 않습니다.' };
    }, [newPassword, confirmNewPassword]);

    /**
     * @function isPasswordValid
     * @description 비밀번호 변경 시 모든 유효성 검사를 통과했는지 확인합니다.
     * @returns {boolean} 유효성 통과 여부
     */
    const isPasswordValid = useMemo(() => {
        if (!newPassword && !confirmNewPassword) return true; // 비밀번호 변경 필드가 비어있으면 유효성 검사 통과로 간주
        return newPasswordValidation.length &&
               newPasswordValidation.minTwoTypes &&
               passwordMatch.isMatch &&
               newPasswordValidation.warning === '';
    }, [newPassword, confirmNewPassword, newPasswordValidation, passwordMatch]);


    /**
     * @function updateProfile
     * @description 사용자 프로필 정보를 업데이트합니다. (비동기 처리)
     */
    const updateProfile = useCallback(async () => {
        setError(null);
        setPasswordChangeMessage(null);

        const fullPhoneNumber = `${phonePart1}-${phonePart2}-${phonePart3}`;

        // 비밀번호 변경 시 유효성 검사 추가
        if (currentPassword || newPassword || confirmNewPassword) {
            if (!currentPassword) {
                setError('현재 비밀번호를 입력해주세요.');
                return;
            }
            if (!newPassword || !confirmNewPassword) {
                setError('새 비밀번호와 확인 비밀번호를 모두 입력해주세요.');
                return;
            }
            if (!isPasswordValid) {
                setError('새 비밀번호가 유효성 조건을 충족하지 않거나 일치하지 않습니다.');
                return;
            }
        }

        try {
            const updatedData = {
                memberId: profile.memberId, // memberId 추가
                email: profile.email,
                phone: fullPhoneNumber,
                company: profile.company, // 소속 추가
                department: profile.department, // 부서 추가
                // 비밀번호 변경 요청이 있을 경우에만 추가
                ...(newPassword && {
                    currentPassword: currentPassword,
                    newPassword: newPassword,
                }),
            };

            // 🚀 프로필 정보 업데이트 API 호출:
            // 아래 주석 처리된 코드를 활성화하시고, `/api/user/profile` 경로를
            // 실제 프로필 업데이트 API 엔드포인트로 변경해 주세요.
            // await axios.put('/api/user/profile', updatedData);

            console.log('Profile updated:', updatedData);
            setPasswordChangeMessage('프로필 정보가 성공적으로 업데이트되었습니다!');
            resetPasswordFields(); // 비밀번호 필드 초기화
            // 프로필 정보 다시 불러오기 (선택 사항)
            // fetchUserProfile();

        } catch (err) {
            console.error('Failed to update profile:', err);
            setError('프로필 업데이트에 실패했습니다. 다시 시도해주세요.');
            if (axios.isAxiosError(err) && err.response?.status === 401) {
                setError('현재 비밀번호가 올바르지 않습니다.');
            }
        }
    }, [profile, phonePart1, phonePart2, phonePart3, currentPassword, newPassword, confirmNewPassword, isPasswordValid, resetPasswordFields]);

    /**
     * @function handleKakaoConnect
     * @description 카카오 계정 연동을 처리합니다.
     */
const handleKakaoConnect = useCallback(() => {
    const clientId = '99b61a29a2963e3f58d79a6f2e9eccb6'; // 실제 REST API 키로 변경
    const redirectUri = 'http://localhost:5173/kakao/callback'; // 배포 시 변경 필요
    const kakaoAuthUrl = `https://kauth.kakao.com/oauth/authorize?client_id=${clientId}&redirect_uri=${redirectUri}&response_type=code&state=link`;

    // ✅ 카카오 로그인 페이지로 리다이렉트 (연동용 state=link 포함)
    window.location.href = kakaoAuthUrl;
}, []);

    /**
     * @function handleKakaoDisconnect
     * @description 카카오 계정 연동 해지를 처리합니다.
     */
    const handleKakaoDisconnect = useCallback(async () => {
        try {
            // 실제 카카오 연동 해지 로직
            // await axios.post('/api/auth/kakao/disconnect');
            console.log('카카오 연동 해지');
            alert('카카오 연동 해지 기능은 아직 구현되지 않았습니다.');
            setProfile(prev => ({ ...prev, kakaoId: null }));
        } catch (err) {
            console.error('카카오 연동 해지 실패:', err);
            setError('카카오 연동 해지에 실패했습니다.');
        }
    }, []);

    /**
     * @function handleNaverConnect
     * @description 네이버 계정 연동을 처리합니다.
     */
    const handleNaverConnect = useCallback(async () => {
        try {
            // 실제 네이버 연동 로직
            // const response = await axios.get('/api/auth/naver');
            console.log('네이버 연동 시도');
            alert('네이버 연동 기능은 아직 구현되지 않았습니다.');
            // setProfile(prev => ({ ...prev, naverId: 'naver_user_id_example' }));
        } catch (err) {
            console.error('네이버 연동 실패:', err);
            setError('네이버 연동에 실패했습니다.');
        }
    }, []);

    /**
     * @function handleNaverDisconnect
     * @description 네이버 계정 연동 해지를 처리합니다.
     */
    const handleNaverDisconnect = useCallback(async () => {
        try {
            // 실제 네이버 연동 해지 로직
            // await axios.post('/api/auth/naver/disconnect');
            console.log('네이버 연동 해지');
            alert('네이버 연동 해지 기능은 아직 구현되지 않았습니다.');
            setProfile(prev => ({ ...prev, naverId: null }));
        } catch (err) {
            console.error('네이버 연동 해지 실패:', err);
            setError('네이버 연동 해지에 실패했습니다.');
        }
    }, []);

    /**
     * @function handleGoogleConnect
     * @description 구글 계정 연동을 처리합니다.
     */
    const handleGoogleConnect = useCallback(async () => {
        try {
            // 실제 구글 연동 로직
            // const response = await axios.get('/api/auth/google');
            console.log('구글 연동 시도');
            alert('구글 연동 기능은 아직 구현되지 않았습니다.');
            // setProfile(prev => ({ ...prev, googleId: 'google_user_id_example' }));
        } catch (err) {
            console.error('구글 연동 실패:', err);
            setError('구글 연동에 실패했습니다.');
        }
    }, []);

    /**
     * @function handleGoogleDisconnect
     * @description 구글 계정 연동 해지를 처리합니다.
     */
    const handleGoogleDisconnect = useCallback(async () => {
        try {
            // 실제 구글 연동 해지 로직
            // await axios.post('/api/auth/google/disconnect');
            console.log('구글 연동 해지');
            alert('구글 연동 해지 기능은 아직 구현되지 않았습니다.');
            setProfile(prev => ({ ...prev, googleId: null }));
        } catch (err) {
            console.error('구글 연동 해지 실패:', err);
            setError('구글 연동 해지에 실패했습니다.');
        }
    }, []);


    return {
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
        handleCompanyChange,
        handleDepartmentChange,
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
        handleWithdrawal,
    };
};