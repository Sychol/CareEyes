// src/hooks/usePasswordValidation.ts

import React, { useState, useCallback, useMemo } from 'react';

// 비밀번호 유효성 검사를 위한 정규 표현식
const passwordRegex = {
    length: /.{8,}/, // 8자 이상
    minTwoTypes: /(?=.*[a-zA-Z])(?=.*\d)|(?=.*[a-zA-Z])(?=.*[!@#$%^&*])|(?=.*\d)(?=.*[!@#$%^&*])/, // 영문, 숫자, 특수문자 중 2가지 이상 - 백슬래시(\) 이스케이프 수정
};

/**
 * @interface PasswordValidationFeedback
 * @description 비밀번호 유효성 검사 결과에 대한 상세 피드백 인터페이스
 */
export interface PasswordValidationFeedback {
    length?: boolean; // 8자 이상
    minTwoTypes?: boolean; // 2종류 이상 문자 조합
    warning?: string; // 추가 경고 메시지 (예: 연속된 숫자/문자)
}

/**
 * @interface PasswordMatchFeedback
 * @description 새 비밀번호와 확인 비밀번호 일치 여부 피드백 인터페이스
 */
export interface PasswordMatchFeedback {
    isMatch: boolean;
    message: string;
}

/**
 * @function usePasswordValidation
 * @description 비밀번호 유효성 검사 및 일치 여부 상태를 관리하는 커스텀 훅입니다.
 * @returns {object} 비밀번호 관련 상태와 핸들러 함수들을 반환합니다.
 */
export const usePasswordValidation = () => {
    const [newPassword, setNewPassword] = useState<string>('');
    const [confirmNewPassword, setConfirmNewPassword] = useState<string>('');
    const [isNewPasswordFocused, setIsNewPasswordFocused] = useState<boolean>(false);
    const [isConfirmNewPasswordFocused, setIsConfirmNewPasswordFocused] = useState<boolean>(false);

    /**
     * @function handleNewPasswordChange
     * @description 새 비밀번호 입력 필드의 변경을 처리합니다.
     */
    const handleNewPasswordChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        setNewPassword(e.target.value);
    }, []);

    /**
     * @function handleConfirmNewPasswordChange
     * @description 새 비밀번호 확인 입력 필드의 변경을 처리합니다.
     */
    const handleConfirmNewPasswordChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        setConfirmNewPassword(e.target.value);
    }, []);

    /**
     * @function handleNewPasswordFocus
     * @description 새 비밀번호 필드 포커스 시 상태를 업데이트합니다.
     */
    const handleNewPasswordFocus = useCallback(() => setIsNewPasswordFocused(true), []);

    /**
     * @function handleNewPasswordBlur
     * @description 새 비밀번호 필드 블러 시 상태를 업데이트합니다.
     */
    const handleNewPasswordBlur = useCallback(() => setIsNewPasswordFocused(false), []);

    /**
     * @function handleConfirmNewPasswordFocus
     * @description 새 비밀번호 확인 필드 포커스 시 상태를 업데이트합니다.
     */
    const handleConfirmNewPasswordFocus = useCallback(() => setIsConfirmNewPasswordFocused(true), []);

    /**
     * @function handleConfirmNewPasswordBlur
     * @description 새 비밀번호 확인 필드 블러 시 상태를 업데이트합니다.
     */
    const handleConfirmNewPasswordBlur = useCallback(() => setIsConfirmNewPasswordFocused(false), []);

    // 새 비밀번호 유효성 검사 결과
    const newPasswordValidation = useMemo<PasswordValidationFeedback>(() => {
        const length = passwordRegex.length.test(newPassword);
        const minTwoTypes = passwordRegex.minTwoTypes.test(newPassword);

        // 연속된 숫자/문자 경고 (간단한 예시)
        let warning = '';
        if (/(.)\1\1/.test(newPassword)) { // 백슬래시(\) 이스케이프 수정
            warning = "3자 이상 연속된 동일 문자/숫자는 사용하실 수 없습니다.";
        }
        if (/(123)|(234)|(abc)|(bcd)/.test(newPassword)) { // 백슬래시(\) 이스케이프 수정
            warning = "3자 이상 연속된 숫자/문자는 사용하실 수 없습니다.";
        }

        return {
            length,
            minTwoTypes,
            warning,
        };
    }, [newPassword]);

    // 비밀번호 일치 여부
    const passwordMatch = useMemo<PasswordMatchFeedback>(() => {
        const isMatch = newPassword === confirmNewPassword && newPassword.length > 0;
        const message = isMatch ? "새 비밀번호와 일치합니다." : "새 비밀번호와 일치하지 않습니다.";
        return { isMatch, message };
    }, [newPassword, confirmNewPassword]);

    // 비밀번호 변경 전체 유효성 검사
    const isPasswordValid = useMemo(() => {
        // 비밀번호가 비어있으면 유효하지 않다고 판단
        if (!newPassword && !confirmNewPassword) {
            return { isValid: true, message: "" }; // 비밀번호 변경을 하지 않는 경우
        }

        // 새 비밀번호가 비어있지 않은 경우
        if (newPassword || confirmNewPassword) {
            if (!newPasswordValidation.length) {
                return { isValid: false, message: "새 비밀번호는 8자 이상이어야 합니다." };
            }
            if (!newPasswordValidation.minTwoTypes) {
                return { isValid: false, message: "새 비밀번호는 2종류 이상 문자 조합이어야 합니다." };
            }
            if (newPasswordValidation.warning) {
                return { isValid: false, message: newPasswordValidation.warning };
            }
        }

        // 비밀번호 일치 여부 검사
        if (!passwordMatch.isMatch) {
            return { isValid: false, message: passwordMatch.message || "새 비밀번호와 확인 비밀번호가 일치하지 않습니다." };
        }

        return { isValid: true, message: "비밀번호 변경이 가능합니다." };
    }, [newPassword, confirmNewPassword, newPasswordValidation, passwordMatch]);

    /**
     * @function resetPasswordFields
     * @description 비밀번호 관련 필드들을 초기화합니다.
     */
    const resetPasswordFields = useCallback(() => {
        setNewPassword('');
        setConfirmNewPassword('');
        setIsNewPasswordFocused(false);
        setIsConfirmNewPasswordFocused(false);
    }, []);

    return {
        newPassword,
        confirmNewPassword,
        newPasswordValidation,
        passwordMatch,
        isNewPasswordFocused,
        isConfirmNewPasswordFocused,
        isPasswordValid,
        handleNewPasswordChange,
        handleConfirmNewPasswordChange,
        handleNewPasswordFocus,
        handleNewPasswordBlur,
        handleConfirmNewPasswordFocus,
        handleConfirmNewPasswordBlur,
        resetPasswordFields,
    };
};