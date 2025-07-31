// src/hooks/usePasswordValidation.ts

import { useState, useCallback, FocusEvent } from 'react';
import {
    validatePWPolicy, // user.ts에서 유효성 검사 함수 임포트
    validatePWMatch,  // user.ts에서 유효성 검사 함수 임포트
    PWValidationResult,
    PWMatchResult,
} from '../ts/Profile/user';

/**
 * @function usePasswordValidation
 * @description 비밀번호 유효성 검사 및 확인 로직과 상태를 관리하는 커스텀 훅입니다.
 * @returns {object} 비밀번호 상태, 유효성 결과, 변경 핸들러, 포커스 상태, 그리고 최종 유효성 검사 함수를 반환합니다.
 */
export const usePasswordValidation = () => {
    const [newPassword, setNewPassword] = useState<string>('');
    const [confirmNewPassword, setConfirmNewPassword] = useState<string>('');
    const [newPasswordValidation, setNewPasswordValidation] = useState<PWValidationResult | null>(null);
    const [passwordMatch, setPasswordMatch] = useState<PWMatchResult | null>(null);

    // 비밀번호 필드 포커스 상태
    const [isNewPasswordFocused, setIsNewPasswordFocused] = useState<boolean>(false);
    const [isConfirmNewPasswordFocused, setIsConfirmNewPasswordFocused] = useState<boolean>(false);

    /**
     * @function handleNewPasswordChange
     * @description 새 비밀번호 입력 필드의 변경을 처리하고, 비밀번호 정책 유효성을 검사합니다.
     * @param {React.ChangeEvent<HTMLInputElement>} e - 입력 필드 변경 이벤트 객체
     */
    const handleNewPasswordChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setNewPassword(value);
        const validation = validatePWPolicy(value); // user.ts의 함수 호출
        setNewPasswordValidation(validation);

        if (confirmNewPassword.length > 0) {
            setPasswordMatch(validatePWMatch(value, confirmNewPassword)); // user.ts의 함수 호출
        } else {
            setPasswordMatch(null);
        }
    }, [confirmNewPassword]);

    /**
     * @function handleConfirmNewPasswordChange
     * @description 새 비밀번호 확인 입력 필드의 변경을 처리하고, 비밀번호 일치 여부를 검사합니다.
     * @param {React.ChangeEvent<HTMLInputElement>} e - 입력 필드 변경 이벤트 객체
     */
    const handleConfirmNewPasswordChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setConfirmNewPassword(value);
        setPasswordMatch(validatePWMatch(newPassword, value)); // user.ts의 함수 호출
    }, [newPassword]);

    /**
     * @function handleNewPasswordFocus
     * @description 새 비밀번호 입력 필드에 포커스될 때의 핸들러
     * @param {FocusEvent<HTMLInputElement>} e - 포커스 이벤트 객체
     */
    const handleNewPasswordFocus = useCallback((e: FocusEvent<HTMLInputElement>) => {
        setIsNewPasswordFocused(true);
    }, []);

    /**
     * @function handleNewPasswordBlur
     * @description 새 비밀번호 입력 필드에서 포커스가 벗어날 때의 핸들러
     * @param {FocusEvent<HTMLInputElement>} e - 포커스 이벤트 객체
     */
    const handleNewPasswordBlur = useCallback((e: FocusEvent<HTMLInputElement>) => {
        setIsNewPasswordFocused(false);
    }, []);

    /**
     * @function handleConfirmNewPasswordFocus
     * @description 새 비밀번호 확인 입력 필드에 포커스될 때의 핸들러
     * @param {FocusEvent<HTMLInputElement>} e - 포커스 이벤트 객체
     */
    const handleConfirmNewPasswordFocus = useCallback((e: FocusEvent<HTMLInputElement>) => {
        setIsConfirmNewPasswordFocused(true);
    }, []);

    /**
     * @function handleConfirmNewPasswordBlur
     * @description 새 비밀번호 확인 입력 필드에서 포커스가 벗어날 때의 핸들러
     * @param {FocusEvent<HTMLInputElement>} e - 포커스 이벤트 객체
     */
    const handleConfirmNewPasswordBlur = useCallback((e: FocusEvent<HTMLInputElement>) => {
        setIsConfirmNewPasswordFocused(false);
    }, []);

    /**
     * @function validateAllPasswordFields
     * @description 현재 입력된 비밀번호 필드들의 최종 유효성을 검사합니다.
     * @returns {{isValid: boolean, message: string | null}} 전체 비밀번호 필드의 유효성 결과와 메시지
     */
    const validateAllPasswordFields = useCallback(() => {
        const passwordFieldsFilled = newPassword || confirmNewPassword;

        if (passwordFieldsFilled) {
            // 새 비밀번호 정책 유효성 검사
            const newPwValidation = validatePWPolicy(newPassword); // user.ts의 함수 호출
            setNewPasswordValidation(newPwValidation);

            if (!newPwValidation.isValiD) {
                return { isValid: false, message: newPwValidation.message };
            }

            // 새 비밀번호 일치 여부 검사
            const pwMatch = validatePWMatch(newPassword, confirmNewPassword); // user.ts의 함수 호출
            setPasswordMatch(pwMatch);

            if (!pwMatch.isMatch) {
                return { isValid: false, message: pwMatch.message };
            }
        }
        
        return { isValid: true, message: null };

    }, [newPassword, confirmNewPassword]);

    /**
     * @function resetPasswordFields
     * @description 비밀번호 관련 입력 필드와 유효성 상태를 초기화합니다.
     */
    const resetPasswordFields = useCallback(() => {
        setNewPassword('');
        setConfirmNewPassword('');
        setNewPasswordValidation(null);
        setPasswordMatch(null);
        setIsNewPasswordFocused(false); // 포커스 상태 초기화
        setIsConfirmNewPasswordFocused(false); // 포커스 상태 초기화
    }, []);

    return {
        newPassword,
        setNewPassword,
        confirmNewPassword,
        setConfirmNewPassword,
        newPasswordValidation,
        passwordMatch,
        isNewPasswordFocused,
        isConfirmNewPasswordFocused,
        handleNewPasswordChange,
        handleConfirmNewPasswordChange,
        handleNewPasswordFocus,
        handleNewPasswordBlur,
        handleConfirmNewPasswordFocus,
        handleConfirmNewPasswordBlur,
        validateAllPasswordFields,
        resetPasswordFields,
    };
};
