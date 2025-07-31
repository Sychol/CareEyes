// src/ts/Profile/user.ts

import axios, { AxiosError } from 'axios';

// API 기본 URL 정의 (실제 백엔드 URL로 변경 필요)
const API_BASE_URL = 'http://223.130.196.8090';

/**
 * @interface UserProfile
 * @description 사용자 프로필 정보의 타입을 정의합니다.
 */
export interface UserProfile {
    memberId: string;
    memberPw: string; // 비밀번호는 실제로는 해시되어 저장되지만, 여기서는 목업을 위해 포함
    memberName: string;
    email: string;
    phone: string;
    memberRole: 'ADMIN' | 'WORKER';
    company: string | null;
    department: string | null;
    kakaoId: string | null;
}

/**
 * @interface IDValidationResult
 * @description 아이디 유효성 검사 결과를 정의합니다.
 */
export interface IDValidationResult {
    isIDValid: boolean;
    message: string;
    isOnlyNumbers: boolean;
}

/**
 * @interface PWFeedback
 * @description 비밀번호 정책 피드백 상세 정보를 정의합니다.
 */
export interface PWFeedback {
    length: boolean;
    english: boolean;
    number: boolean;
    special: boolean;
    minTwoTypes: boolean;
}

/**
 * @interface PWValidationResult
 * @description 비밀번호 정책 유효성 검사 결과를 정의합니다.
 */
export interface PWValidationResult {
    isValiD: boolean;
    feedback: PWFeedback;
    message: string;
    warning: string;
    isOnlyNumbers: boolean;
}

/**
 * @interface PWMatchResult
 * @description 비밀번호 일치 여부 검사 결과를 정의합니다.
 */
export interface PWMatchResult {
    isMatch: boolean;
    message: string;
}

/**
 * @interface PhoneNumberValidationResult
 * @description 전화번호 유효성 검사 결과를 정의합니다.
 */
export interface PhoneNumberValidationResult {
    isValid: boolean;
    message: string;
}

/**
 * @interface UpdateProfilePayload
 * @description 프로필 업데이트 요청 데이터의 타입을 정의합니다.
 */
export interface UpdateProfilePayload {
    memberName: string;
    phone: string;
    currentPassword?: string;
    newPassword?: string;
}

/**
 * @constant DEFAULT_USER_PROFILE
 * @description 기본 사용자 프로필 데이터 (목업용).
 * 카카오 ID는 기본적으로 null (미연동)로 설정합니다.
 * 역할은 'ADMIN', 회사명은 'CareEyes'로 설정합니다.
 */
export const DEFAULT_USER_PROFILE: UserProfile = {
    memberId: 'testuser123',
    memberPw: 'current_password_mock', // 목업 비밀번호
    memberName: '홍길동',
    email: 'hong.gildong@example.com',
    phone: '010-1234-5678',
    memberRole: 'ADMIN', // 역할 예시: 관리자로 변경
    company: 'CareEyes', // 회사명 예시: CareEyes로 변경
    department: '개발팀',
    kakaoId: null // 기본값 미연동으로 설정
};

// 목업 사용자 프로필 데이터 (실제 업데이트를 시뮬레이션하기 위함)
// DEFAULT_USER_PROFILE과 동일하게 초기화하여 목업 데이터의 일관성을 유지합니다.
export let MOCK_USER_PROFILE: UserProfile = { ...DEFAULT_USER_PROFILE };

/**
 * @function updateMockUserProfile
 * @description 목 사용자 프로필 데이터를 업데이트하는 함수입니다. (테스트용)
 * @param {UserProfile} newProfile - 업데이트할 새로운 프로필 데이터
 */
export const updateMockUserProfile = (newProfile: UserProfile) => {
    MOCK_USER_PROFILE = newProfile;
};

/**
 * @function splitPhoneNumber
 * @description 전체 전화번호 문자열을 세 부분으로 나눕니다.
 * @param {string | null} fullPhone - 전체 전화번호 문자열 (예: "010-1234-5678") 또는 null
 * @returns {[string, string, string]} 세 부분으로 나뉜 전화번호 배열
 */
export const splitPhoneNumber = (fullPhone: string | null): [string, string, string] => {
    const phone = fullPhone || '';
    const parts = phone.split('-');
    return [parts[0] || '', parts[1] || '', parts[2] || ''];
};

/**
 * @function combinePhoneNumber
 * @description 세 부분으로 나뉜 전화번호를 하나의 문자열로 합칩니다.
 * @param {string} part1 - 전화번호 첫째 부분
 * @param {string} part2 - 전화번호 둘째 부분
 * @param {string} part3 - 전화번호 셋째 부분
 * @returns {string} 합쳐진 전화번호 문자열 (예: "010-1234-5678")
 */
export const combinePhoneNumber = (part1: string, part2: string, part3: string): string => {
    return `${part1}-${part2}-${part3}`;
};

/**
 * @function formatPhoneNumberPart
 * @description 전화번호 부분의 입력값을 숫자만 허용하고 길이를 제한합니다.
 * @param {string} value - 입력된 값
 * @param {number} maxLength - 허용되는 최대 길이
 * @returns {string} 포맷팅된 전화번호 부분
 */
export const formatPhoneNumberPart = (value: string, maxLength: number): string => {
    const numericValue = value.replace(/\D/g, '');
    return numericValue.substring(0, maxLength);
};

/**
 * @function getPasswordChangeMessage
 * @description 비밀번호 변경 메시지 상태를 업데이트하는 도우미 함수입니다.
 * @param {string} message - 표시할 메시지 내용
 * @param {boolean} isSuccess - 성공 메시지 여부
 * @returns {{message: string, isSuccess: boolean}} 메시지 객체
 */
export const getPasswordChangeMessage = (message: string, isSuccess: boolean) => {
    return { message, isSuccess };
};

/**
 * @function validateIDPolicy
 * @description 아이디 유효성 검사 함수입니다.
 * @param {string} id - 검사할 아이디
 * @returns {IDValidationResult} 아이디 유효성 검사 결과
 */
export const validateIDPolicy = (id: string): IDValidationResult => {
    let isIDValid = true;
    let message = '';
    let isOnlyNumbers = false;

    // 길이 검사 (6~20자)
    if (id.length < 6 || id.length > 20) {
        isIDValid = false;
        message = '아이디는 6자 이상 20자 이하여야 합니다.';
    }

    // 첫 글자가 영문자인지 검사
    if (!/^[a-zA-Z]/.test(id)) {
        isIDValid = false;
        message = '아이디는 영문자로 시작해야 합니다.';
    }

    // 영문자, 숫자만 허용
    if (!/^[a-zA-Z0-9]*$/.test(id)) {
        isIDValid = false;
        message = '아이디는 영문자, 숫자만 사용할 수 있습니다.';
    }

    // 숫자만으로 구성된 경우 경고
    if (/^\d+$/.test(id) && id.length > 0) {
        isOnlyNumbers = true;
        if (isIDValid) {
            message = '아이디는 영문자를 포함해야 합니다.';
        }
    }

    if (isIDValid && !isOnlyNumbers && id.length >= 6) {
        message = '사용 가능한 아이디입니다.';
    } else if (!isIDValid && message === '') {
        message = '올바르지 않은 아이디 형식입니다.';
    }

    return { isIDValid, message, isOnlyNumbers };
};

/**
 * @function validatePWPolicy
 * @description 비밀번호 정책 유효성 검사 함수입니다.
 * @param {string} password - 검사할 비밀번호
 * @returns {PWValidationResult} 비밀번호 유효성 검사 결과
 */
export const validatePWPolicy = (password: string): PWValidationResult => {
    let isValiD = true;
    let message = '';
    let warning = '';
    let isOnlyNumbers = false;

    const feedback: PWFeedback = {
        length: password.length >= 8,
        english: /[a-zA-Z]/.test(password),
        number: /[0-9]/.test(password),
        special: /[!@#$%^&*()]/.test(password),
        minTwoTypes: false,
    };

    let typeCount = 0;
    if (feedback.english) typeCount++;
    if (feedback.number) typeCount++;
    if (feedback.special) typeCount++;
    feedback.minTwoTypes = typeCount >= 2;

    if (!feedback.length) {
        isValiD = false;
        message = '비밀번호는 8자 이상이어야 합니다.';
    }
    // 길이는 만족하지만 2종류 미만일 경우
    if (feedback.length && !feedback.minTwoTypes) {
        isValiD = false;
        message = '비밀번호는 영문자, 숫자, 특수문자 중 2종류 이상을 조합해야 합니다.';
    }

    if (/^\d+$/.test(password) && password.length > 0) {
        isOnlyNumbers = true;
        warning = '⚠️ 비밀번호는 숫자만으로 구성하는 것을 권장하지 않습니다.';
    }

    // 최종 유효성 검사 (길이와 2종류 이상 모두 만족해야 유효)
    if (isValiD && feedback.length && feedback.minTwoTypes) {
        message = '사용 가능한 비밀번호입니다.';
    } else if (!isValiD && message === '') {
        message = '비밀번호 정책을 만족해주세요.';
    }

    return { isValiD, feedback, message, warning, isOnlyNumbers };
};

/**
 * @function validatePWMatch
 * @description 두 비밀번호가 일치하는지 검사합니다.
 * @param {string} password - 첫 번째 비밀번호
 * @param {string} confirmPassword - 확인할 비밀번호
 * @returns {PWMatchResult} 비밀번호 일치 여부 검사 결과
 */
export const validatePWMatch = (password: string, confirmPassword: string): PWMatchResult => {
    const isMatch = password === confirmPassword && password.length > 0;
    const message = isMatch ? '비밀번호가 일치합니다.' : '비밀번호가 일치하지 않습니다.';
    return { isMatch, message };
};

/**
 * @function validatePhoneNumber
 * @description 전화번호 유효성 검사 함수입니다.
 * @param {string} phone1 - 전화번호 첫 번째 부분
 * @param {string} phone2 - 전화번호 두 번째 부분
 * @param {string} phone3 - 전화번호 세 번째 부분
 * @returns {PhoneNumberValidationResult} 전화번호 유효성 검사 결과
 */
export const validatePhoneNumber = (phone1: string, phone2: string, phone3: string): PhoneNumberValidationResult => {
    let isValid = true;
    let message = '';

    const isNumeric = (value: string) => /^\d+$/.test(value);

    const isPhone1Valid = phone1.length === 3 && isNumeric(phone1);
    const isPhone2Valid = phone2.length === 4 && isNumeric(phone2);
    const isPhone3Valid = phone3.length === 4 && isNumeric(phone3);

    if (!phone1 || !phone2 || !phone3) {
        isValid = false;
        message = '전화번호를 모두 입력해주세요.';
    } else if (!isPhone1Valid || !isPhone2Valid || !isPhone3Valid) {
        isValid = false;
        message = '올바른 전화번호 형식이 아닙니다 (예: 010-1234-5678).';
    } else {
        message = '올바른 전화번호 형식입니다.';
    }

    return { isValid, message };
};

/**
 * @function fetchUserProfile
 * @description 사용자 프로필을 서버에서 불러오는 함수입니다.
 * @returns {Promise<UserProfile>} 사용자 프로필 데이터
 * @throws {Error} 인증 정보 부족 또는 API 호출 실패 시 에러 발생
 */
export const fetchUserProfile = async (): Promise<UserProfile> => {
    const token = localStorage.getItem('accessToken');
    if (!token) {
        throw new Error('인증 정보가 없습니다. 세션이 만료되었을 수 있습니다.');
    }

    try {
        const response = await axios.get<UserProfile>(`${API_BASE_URL}/users/profile`, {
            headers: {
                Authorization: `Bearer ${token}`
            },
            withCredentials: true,
        });
        return response.data;
    } catch (error) {
        if (axios.isAxiosError(error)) {
            throw new Error(`프로필 불러오기 실패: ${error.response?.data?.message || error.message}`);
        }
        throw new Error('프로필 불러오기 중 알 수 없는 오류가 발생했습니다.');
    }
};

/**
 * @function updateProfile
 * @description 사용자 프로필을 업데이트하는 함수입니다. (비밀번호 변경 포함)
 * @param {UpdateProfilePayload} payload - 닉네임, 전화번호, 비밀번호 등의 업데이트 데이터
 * @returns {Promise<void>} 업데이트 성공 시 반환
 * @throws {Error} 인증 정보 부족, 유효성 검사 실패 또는 API 호출 실패 시 에러 발생
 */
export const updateProfile = async (payload: UpdateProfilePayload): Promise<void> => {
    const token = localStorage.getItem('accessToken');
    if (!token) {
        throw new Error('인증 정보가 없습니다. 세션이 만료되었을 수 있습니다.');
    }

    try {
        await axios.put(`${API_BASE_URL}/users/profile`, payload, {
            headers: {
                Authorization: `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            withCredentials: true,
        });
    } catch (error) {
        if (axios.isAxiosError(error)) {
            throw new Error(`업데이트 실패: ${error.response?.data?.message || '알 수 없는 오류가 발생했습니다.'}`);
        }
        throw new Error('정보 업데이트 중 알 수 없는 오류가 발생했습니다.');
    }
};

/**
 * @function mockFetchUserProfile
 * @description 목업 사용자 프로필 정보를 비동기적으로 불러오는 함수입니다. (테스트용)
 * @returns {Promise<UserProfile>} 사용자 프로필 정보
 */
export const mockFetchUserProfile = async (): Promise<UserProfile> => {
    return new Promise((resolve) => {
        setTimeout(() => {
            resolve({ ...MOCK_USER_PROFILE });
        }, 500); // 0.5초 지연
    });
};

/**
 * @function mockUpdateProfileAndMaybePassword
 * @description 목업 프로필 정보를 업데이트하고, 비밀번호 변경을 시뮬레이션하는 함수입니다. (테스트용)
 * @param {UserProfile} currentProfile - 현재 프로필 데이터
 * @param {string} memberName - 변경할 이름
 * @param {string} email - 변경할 이메일
 * @param {string} phonePart1 - 전화번호 첫째 부분
 * @param {string} phonePart2 - 전화번호 둘째 부분
 * @param {string} phonePart3 - 전화번호 셋째 부분
 * @param {string} currentPassword - 현재 비밀번호 (비밀번호 변경 시 필요)
 * @param {string} newPassword - 새 비밀번호 (비밀번호 변경 시 필요)
 * @param {string} confirmNewPassword - 새 비밀번호 확인 (비밀번호 변경 시 필요)
 * @returns {Promise<{updatedProfile: UserProfile, passwordMessage: string | null}>} 업데이트된 프로필과 비밀번호 변경 메시지
 */
export const mockUpdateProfileAndMaybePassword = async (
    currentProfile: UserProfile,
    memberName: string,
    email: string,
    phonePart1: string,
    phonePart2: string,
    phonePart3: string,
    currentPassword?: string,
    newPassword?: string,
    confirmNewPassword?: string
): Promise<{ updatedProfile: UserProfile, passwordMessage: string | null }> => {
    return new Promise((resolve, reject) => {
        setTimeout(() => {
            let passwordMessage: string | null = null;
            const updatedProfile = { ...currentProfile, memberName, email, phone: combinePhoneNumber(phonePart1, phonePart2, phonePart3) };

            if (currentPassword || newPassword || confirmNewPassword) {
                if (currentPassword !== MOCK_USER_PROFILE.memberPw) {
                    return reject(new Error('현재 비밀번호가 올바르지 않습니다.'));
                }
                if (newPassword && newPassword === currentPassword) {
                    return reject(new Error('새 비밀번호는 현재 비밀번호와 달라야 합니다.'));
                }
                if (newPassword && newPassword === confirmNewPassword) {
                    updatedProfile.memberPw = newPassword; // 목업 비밀번호 업데이트
                    passwordMessage = '비밀번호가 성공적으로 변경되었습니다.';
                } else if (newPassword && !confirmNewPassword) {
                    return reject(new Error('새 비밀번호 확인을 입력해주세요.'));
                } else if (!newPassword && confirmNewPassword) {
                    return reject(new Error('새 비밀번호를 입력해주세요.'));
                } else if (newPassword !== confirmNewPassword) {
                    return reject(new Error('새 비밀번호와 확인 비밀번호가 일치하지 않습니다.'));
                }
            }

            MOCK_USER_PROFILE = updatedProfile;
            resolve({ updatedProfile: { ...MOCK_USER_PROFILE }, passwordMessage });
        }, 800); // 0.8초 지연
    });
};

/**
 * @function mockKakaoConnect
 * @description 목업 카카오 계정 연동을 시뮬레이션하는 함수입니다. (테스트용)
 * @param {UserProfile} currentProfile - 현재 프로필 데이터
 * @returns {Promise<UserProfile>} 업데이트된 프로필 정보
 */
export const mockKakaoConnect = async (currentProfile: UserProfile): Promise<UserProfile> => {
    return new Promise((resolve) => {
        setTimeout(() => {
            // 가상의 카카오 계정 이메일 형식으로 설정
            const updatedProfile = { ...currentProfile, kakaoId: 'testuser@kakao.com' }; 
            MOCK_USER_PROFILE = updatedProfile;
            resolve({ ...MOCK_USER_PROFILE });
        }, 500);
    });
};

/**
 * @function mockKakaoDisconnect
 * @description 목업 카카오 계정 연동 해지를 시뮬레이션하는 함수입니다. (테스트용)
 * @param {UserProfile} currentProfile - 현재 프로필 데이터
 * @returns {Promise<UserProfile>} 업데이트된 프로필 정보
 */
export const mockKakaoDisconnect = async (currentProfile: UserProfile): Promise<UserProfile> => {
    return new Promise((resolve) => {
        setTimeout(() => {
            const updatedProfile = { ...currentProfile, kakaoId: null }; // 카카오 ID null로 설정
            MOCK_USER_PROFILE = updatedProfile;
            resolve({ ...MOCK_USER_PROFILE });
        }, 500);
    });
};
