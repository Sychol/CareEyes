// src/hooks/useProfileManagement.ts

import { useState, useEffect, useCallback } from 'react';
import {
    UserProfile,
    DEFAULT_USER_PROFILE,
    splitPhoneNumber,
    formatPhoneNumberPart,
    mockFetchUserProfile, // 백엔드 연동 시 fetchUserProfile로 교체
    mockUpdateProfileAndMaybePassword, // 백엔드 연동 시 updateProfile로 교체
    mockKakaoConnect, // 백엔드 연동 시 실제 카카오 연동 API로 교체
    mockKakaoDisconnect, // 백엔드 연동 시 실제 카카오 해제 API로 교체
} from '../ts/Profile/user';

import { usePasswordValidation } from './usePasswordValidation'; // 비밀번호 유효성 훅 임포트

/**
 * @function useProfileManagement
 * @description 사용자 프로필 정보의 조회, 업데이트, 전화번호 및 카카오 연동 관련 로직과 상태를 관리하는 커스텀 훅입니다.
 * @returns {object} 프로필 관련 상태와 핸들러 함수들을 반환합니다.
 */
export const useProfileManagement = () => {
    const [profile, setProfile] = useState<UserProfile>(DEFAULT_USER_PROFILE);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [passwordChangeMessage, setPasswordChangeMessage] = useState<string | null>(null);
    const [currentPassword, setCurrentPassword] = useState<string>('');

    const [phonePart1, setPhonePart1] = useState<string>('');
    const [phonePart2, setPhonePart2] = useState<string>('');
    const [phonePart3, setPhonePart3] = useState<string>('');

    // 비밀번호 보이기/숨기기 상태
    const [showNewPassword, setShowNewPassword] = useState<boolean>(false);
    const [showConfirmNewPassword, setShowConfirmNewPassword] = useState<boolean>(false);

    // 비밀번호 유효성 검사 훅 사용
    const {
        newPassword,
        confirmNewPassword,
        newPasswordValidation,
        passwordMatch,
        isNewPasswordFocused, // usePasswordValidation 훅에서 가져온 포커스 상태
        isConfirmNewPasswordFocused, // usePasswordValidation 훅에서 가져온 포커스 상태
        handleNewPasswordChange,
        handleConfirmNewPasswordChange,
        handleNewPasswordFocus, // usePasswordValidation 훅에서 가져온 포커스 핸들러
        handleNewPasswordBlur, // usePasswordValidation 훅에서 가져온 블러 핸들러
        handleConfirmNewPasswordFocus, // usePasswordValidation 훅에서 가져온 포커스 핸들러
        handleConfirmNewPasswordBlur, // usePasswordValidation 훅에서 가져온 블러 핸들러
        validateAllPasswordFields,
        resetPasswordFields,
    } = usePasswordValidation();

    /**
     * @function fetchUserProfileData
     * @description 사용자 프로필 정보를 불러옵니다.
     */
    const fetchUserProfileData = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            const data = await mockFetchUserProfile(); // 실제 API (fetchUserProfile)로 교체 필요
            setProfile(data);
            const [p1, p2, p3] = splitPhoneNumber(data.phone);
            setPhonePart1(p1);
            setPhonePart2(p2);
            setPhonePart3(p3);
        } catch (error: unknown) {
            let errorMessage = "프로필 정보를 불러오는 데 실패했습니다. 다시 시도해주십시오.";
            if (error instanceof Error) {
                // Error 인스턴스일 경우 message 속성 접근
                console.error("Failed to fetch user profile:", error.message);
                errorMessage = `프로필 정보를 불러오는 데 실패했습니다: ${error.message}`;
            } else {
                // 그 외의 경우 일반 에러 메시지
                console.error("Failed to fetch user profile:", error);
            }
            setError(errorMessage);
            setProfile(DEFAULT_USER_PROFILE);
        } finally {
            setIsLoading(false);
        }
    }, []);

    /**
     * @function handleEmailChange
     * @description 이메일 입력 필드의 변경을 처리합니다.
     * @param {React.ChangeEvent<HTMLInputElement>} e - 입력 필드 변경 이벤트 객체
     */
    const handleEmailChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setProfile(prevProfile => ({
            ...prevProfile,
            [name]: value,
        }));
    }, []);

    /**
     * @function handlePhonePartChange
     * @description 전화번호 각 부분 입력 필드의 변경을 처리하고, 숫자만 허용하며 길이를 제한합니다.
     * @param {number} part - 전화번호 부분 (1, 2, 3)
     * @param {string} value - 입력된 값
     */
    const handlePhonePartChange = useCallback((part: number, value: string) => {
        if (part === 1) {
            setPhonePart1(formatPhoneNumberPart(value, 3));
        } else if (part === 2) {
            setPhonePart2(formatPhoneNumberPart(value, 4));
        } else if (part === 3) {
            setPhonePart3(formatPhoneNumberPart(value, 4));
        }
    }, []);

    /**
     * @function handleCurrentPasswordChange
     * @description 현재 비밀번호 입력 필드의 변경을 처리합니다.
     * @param {React.ChangeEvent<HTMLInputElement>} e - 입력 필드 변경 이벤트 객체
     */
    const handleCurrentPasswordChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        setCurrentPassword(e.target.value);
        setPasswordChangeMessage(null); // 메시지 초기화
    }, []);

    /**
     * @function toggleNewPasswordVisibility
     * @description 새 비밀번호 필드 보이기/숨기기 토글 함수
     */
    const toggleNewPasswordVisibility = useCallback(() => {
        setShowNewPassword(prev => !prev);
    }, []);

    /**
     * @function toggleConfirmNewPasswordVisibility
     * @description 새 비밀번호 확인 필드 보이기/숨기기 토글 함수
     */
    const toggleConfirmNewPasswordVisibility = useCallback(() => {
        setShowConfirmNewPassword(prev => !prev);
    }, []);

    /**
     * @function handleUpdateProfile
     * @description 사용자 프로필 정보와 비밀번호를 업데이트합니다.
     */
    const handleUpdateProfile = useCallback(async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault(); // 폼 기본 제출 동작 방지
        setIsLoading(true);
        setError(null);
        setPasswordChangeMessage(null);

        const passwordFieldsFilled = currentPassword || newPassword || confirmNewPassword;

        if (passwordFieldsFilled) {
            // 모든 비밀번호 필드가 채워졌는지 확인 (currentPassword는 여기서만 확인)
            if (!currentPassword) {
                setPasswordChangeMessage("비밀번호 변경 시 현재 비밀번호를 입력하셔야 합니다.");
                setIsLoading(false);
                return;
            }

            // 비밀번호 유효성 검사 훅을 통한 최종 유효성 검사
            const { isValid, message } = validateAllPasswordFields();

            if (!isValid) {
                setPasswordChangeMessage(message);
                setIsLoading(false);
                return;
            }
        }

        try {
            // 실제 API (updateProfile)로 교체 필요
            const { updatedProfile, passwordMessage } = await mockUpdateProfileAndMaybePassword(
                profile,
                profile.memberName,
                profile.email,
                phonePart1,
                phonePart2,
                phonePart3,
                currentPassword,
                newPassword,
                confirmNewPassword
            );
            
            setProfile(updatedProfile);
            setPasswordChangeMessage(passwordMessage);
            alert('프로필 정보가 성공적으로 업데이트되었습니다! (목 데이터 반영)');
            
            // 비밀번호 변경 성공 시 필드 초기화 및 유효성 메시지 초기화
            setCurrentPassword('');
            resetPasswordFields(); // 커스텀 훅의 초기화 함수 사용
            setShowNewPassword(false); // 비밀번호 필드 가리기
            setShowConfirmNewPassword(false); // 비밀번호 확인 필드 가리기

        } catch (error: unknown) {
            let errorMessage = "프로필 정보 업데이트에 실패했습니다. 다시 시도해주십시오.";
            if (error instanceof Error) {
                // Error 인스턴스일 경우 message 속성 접근
                console.error("Failed to update user profile:", error.message);
                errorMessage = `프로필 정보 업데이트에 실패했습니다: ${error.message}`;
                setPasswordChangeMessage(error.message); // 에러 메시지를 passwordChangeMessage로도 표시
            } else {
                // 그 외의 경우 일반 에러 메시지
                console.error("Failed to update user profile:", error);
            }
            setError(errorMessage); // 일반 에러 메시지
        } finally {
            setIsLoading(false);
        }
    }, [
        profile, 
        phonePart1, phonePart2, phonePart3, 
        currentPassword, newPassword, confirmNewPassword,
        validateAllPasswordFields, resetPasswordFields,
    ]);

    /**
     * @function handleKakaoConnect
     * @description 카카오 계정 연동을 시작합니다.
     */
    const handleKakaoConnect = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            const updatedProfile = await mockKakaoConnect(profile); // 실제 API로 교체 필요
            setProfile(updatedProfile);
            alert('카카오 계정 연동 절차를 시작합니다! (프론트엔드 테스트용)');
        } catch (error: unknown) {
            let errorMessage = "카카오 계정 연동에 실패했습니다.";
            if (error instanceof Error) {
                // Error 인스턴스일 경우 message 속성 접근
                console.error("Failed to connect Kakao account:", error.message);
                errorMessage = `카카오 계정 연동에 실패했습니다: ${error.message}`;
            } else {
                // 그 외의 경우 일반 에러 메시지
                console.error("Failed to connect Kakao account:", error);
            }
            setError(errorMessage);
        } finally {
            setIsLoading(false);
        }
    }, [profile]);

    /**
     * @function handleKakaoDisconnect
     * @description 카카오 계정 연동을 해지합니다.
     */
    const handleKakaoDisconnect = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            const updatedProfile = await mockKakaoDisconnect(profile); // 실제 API로 교체 필요
            setProfile(updatedProfile);
            alert('카카오 계정 연동이 성공적으로 해지되었습니다. (목 데이터 반영)');
        } catch (error: unknown) {
            let errorMessage = "카카오 계정 연동 해지에 실패했습니다. 다시 시도해주십시오.";
            if (error instanceof Error) {
                // Error 인스턴스일 경우 message 속성 접근
                console.error("Failed to disconnect Kakao account:", error.message);
                errorMessage = `카카오 계정 연동 해지에 실패했습니다: ${error.message}`;
            } else {
                // 그 외의 경우 일반 에러 메시지
                console.error("Failed to disconnect Kakao account:", error);
            }
            setError(errorMessage);
        } finally {
            setIsLoading(false);
        }
    }, [profile]);

    // 컴포넌트 마운트 시 프로필 정보 불러오기
    useEffect(() => {
        fetchUserProfileData();
    }, [fetchUserProfileData]);

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
        phonePart1,
        phonePart2,
        phonePart3,
        showNewPassword, // 새 비밀번호 필드 보이기 여부
        showConfirmNewPassword, // 새 비밀번호 확인 필드 보이기 여부
        isNewPasswordFocused, // 새 비밀번호 필드 포커스 상태
        isConfirmNewPasswordFocused, // 새 비밀번호 확인 필드 포커스 상태
        handleEmailChange,
        handlePhonePartChange,
        handleCurrentPasswordChange,
        handleNewPasswordChange,
        handleConfirmNewPasswordChange,
        handleNewPasswordFocus, // 새 비밀번호 필드 포커스 핸들러
        handleNewPasswordBlur, // 새 비밀번호 필드 블러 핸들러
        handleConfirmNewPasswordFocus, // 새 비밀번호 확인 필드 포커스 핸들러
        handleConfirmNewPasswordBlur, // 새 비밀번호 확인 필드 블러 핸들러
        toggleNewPasswordVisibility, // 새 비밀번호 필드 보이기/숨기기 토글 함수
        toggleConfirmNewPasswordVisibility, // 새 비밀번호 확인 필드 보이기/숨기기 토글 함수
        handleUpdateProfile,
        handleKakaoConnect,
        handleKakaoDisconnect,
    };
};
