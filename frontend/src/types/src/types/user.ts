// src/types/user.ts

/**
 * @interface UserProfile
 * @description 사용자 프로필 정보를 정의하는 인터페이스입니다.
 */
export interface UserProfile {
    memberId: string;
    memberName: string;
    email: string;
    phone: string; 
    memberRole: 'ADMIN' | 'WORKER';
    company: string;
    department: string; 
    kakaoId?: string | null; 
    naverId?: string | null; 
    googleId?: string | null; 
}

/**
 * @constant DEFAULT_USER_PROFILE
 * @description 새로운 사용자 프로필 또는 초기 상태를 위한 기본값을 제공합니다.
 */
export const DEFAULT_USER_PROFILE: UserProfile = {
    memberId: 'admin',
    memberName: '나안전',
    email: 'admin@gmail.com',
    phone: '010-1234-1234',
    memberRole: 'WORKER', 
    company: '한국공항',
    department: '관제실',
    kakaoId: null,
    naverId: null,
    googleId: null,
};