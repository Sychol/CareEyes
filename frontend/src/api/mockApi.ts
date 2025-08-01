// src/api/mockApi.ts

import { UserProfile } from '../types/src/types/user';

/**
 * @function mockFetchUserProfile
 * @description 사용자 프로필 데이터를 가져오는 목업(Mock) 함수입니다.
 * 실제 백엔드 연동 시 이 함수를 실제 API 호출로 교체해야 합니다.
 * @returns {Promise<UserProfile>} 사용자 프로필 데이터를 반환하는 프로미스
 */
export const mockFetchUserProfile = async (): Promise<UserProfile> => {
    return new Promise((resolve) => {
        setTimeout(() => {
            console.log('Mock: Fetching user profile...');
            // 발라가 올려준 DB 이미지 정보로 업데이트했어!
            resolve({
                memberId: 'admin',
                memberName: '나안전',
                email: 'admin@gmail.com',
                phone: '01012341234',
                memberRole: 'ADMIN',
                company: '한국공항',
                department: '관제실',
                kakaoId: 'kakao123',
                naverId: null,
                googleId: 'google123',
            });
        }, 1000); // 1초 지연 시뮬레이션
    });
};

/**
 * @function mockUpdateProfileAndMaybePassword
 * @description 프로필 정보와 비밀번호를 업데이트하는 목업(Mock) 함수입니다.
 * @param {UserProfile} profile - 업데이트할 프로필 정보
 * @returns {Promise<{ profile: UserProfile, message: string }>} 업데이트된 프로필과 메시지를 반환하는 프로미스
 */
export const mockUpdateProfileAndMaybePassword = async (profile: UserProfile, newPassword?: string): Promise<{ profile: UserProfile, message: string }> => {
    return new Promise((resolve) => {
        setTimeout(() => {
            console.log('Mock: Updating profile and password...');
            if (newPassword) {
                console.log('Mock: Password changed!');
                resolve({ profile, message: '프로필 정보와 비밀번호가 성공적으로 변경되었습니다.' });
            } else {
                resolve({ profile, message: '프로필 정보가 성공적으로 변경되었습니다.' });
            }
        }, 1000);
    });
};

/**
 * @function mockKakaoConnect
 * @description 카카오 계정 연동을 시뮬레이션합니다.
 * @param {UserProfile} currentProfile - 현재 사용자 프로필
 * @returns {Promise<UserProfile>} 업데이트된 사용자 프로필을 반환하는 프로미스
 */
export const mockKakaoConnect = async (currentProfile: UserProfile): Promise<UserProfile> => {
    return new Promise((resolve) => {
        setTimeout(() => {
            const newKakaoId = `kakao_${Math.random().toString(36).substring(2, 8)}`;
            resolve({ ...currentProfile, kakaoId: newKakaoId });
        }, 1000);
    });
};

/**
 * @function mockKakaoDisconnect
 * @description 카카오 계정 연동 해제를 시뮬레이션합니다.
 * @param {UserProfile} currentProfile - 현재 사용자 프로필
 * @returns {Promise<UserProfile>} 업데이트된 사용자 프로필을 반환하는 프로미스
 */
export const mockKakaoDisconnect = async (currentProfile: UserProfile): Promise<UserProfile> => {
    return new Promise((resolve) => {
        setTimeout(() => {
            resolve({ ...currentProfile, kakaoId: null });
        }, 1000);
    });
};

/**
 * @function mockNaverConnect
 * @description 네이버 계정 연동을 시뮬레이션합니다.
 * @param {UserProfile} currentProfile - 현재 사용자 프로필
 * @returns {Promise<UserProfile>} 업데이트된 사용자 프로필을 반환하는 프로미스
 */
export const mockNaverConnect = async (currentProfile: UserProfile): Promise<UserProfile> => {
    return new Promise((resolve) => {
        setTimeout(() => {
            const newNaverId = `naver_${Math.random().toString(36).substring(2, 8)}`;
            resolve({ ...currentProfile, naverId: newNaverId });
        }, 1000);
    });
};

/**
 * @function mockNaverDisconnect
 * @description 네이버 계정 연동 해제를 시뮬레이션합니다.
 * @param {UserProfile} currentProfile - 현재 사용자 프로필
 * @returns {Promise<UserProfile>} 업데이트된 사용자 프로필을 반환하는 프로미스
 */
export const mockNaverDisconnect = async (currentProfile: UserProfile): Promise<UserProfile> => {
    return new Promise((resolve) => {
        setTimeout(() => {
            resolve({ ...currentProfile, naverId: null });
        }, 1000);
    });
};

/**
 * @function mockGoogleConnect
 * @description 구글 계정 연동을 시뮬레이션합니다.
 * @param {UserProfile} currentProfile - 현재 사용자 프로필
 * @returns {Promise<UserProfile>} 업데이트된 사용자 프로필을 반환하는 프로미스
 */
export const mockGoogleConnect = async (currentProfile: UserProfile): Promise<UserProfile> => {
    return new Promise((resolve) => {
        setTimeout(() => {
            const newGoogleId = `google_${Math.random().toString(36).substring(2, 8)}`;
            resolve({ ...currentProfile, googleId: newGoogleId });
        }, 1000);
    });
};

/**
 * @function mockGoogleDisconnect
 * @description 구글 계정 연동 해제를 시뮬레이션합니다.
 * @param {UserProfile} currentProfile - 현재 사용자 프로필
 * @returns {Promise<UserProfile>} 업데이트된 사용자 프로필을 반환하는 프로미스
 */
export const mockGoogleDisconnect = async (currentProfile: UserProfile): Promise<UserProfile> => {
    return new Promise((resolve) => {
        setTimeout(() => {
            resolve({ ...currentProfile, googleId: null });
        }, 1000);
    });
};