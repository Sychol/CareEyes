
/**
 * @function validateLoginForm
 * @description 로그인 폼 입력값의 유효성을 검사하는 함수. (로그인 시)
 * @param {string} MEMBER_ID - 회원 아이디.
 * @param {string} PW - 회원 비밀번호.
 * @returns {{MEMBER_IDError: string, PWError: string, isValid: boolean}} 유효성 검사 결과 객체.
 * - MEMBER_IDError: 아이디 관련 에러 메시지 (없으면 빈 문자열)
 * - PWError: 비밀번호 관련 에러 메시지 (없으면 빈 문자열)
 * - isValid: 모든 입력값이 유효하면 true, 아니면 false.
 */
export const validateLoginForm = (MEMBER_ID: string, PW: string): { MEMBER_IDError: string, PWError: string, isValid: boolean } => {
  // 아이디 또는 비밀번호 관련 에러 메시지 초기화
  let MEMBER_IDError: string = '';
  let PWError: string = '';
  // 폼의 유효성 상태 초기화
  let isValid: boolean = true;

  // 아이디 유효성 검사: 아이디가 비어있는지 확인
  if (MEMBER_ID.trim().length === 0) {
    MEMBER_IDError = '아이디를 입력하세요.';
    isValid = false;
  }

  // 비밀번호 유효성 검사: 비밀번호가 비어있는지 확인
  if (PW.trim().length === 0) {
    PWError = '비밀번호를 입력하세요.';
    isValid = false;
  }

  // 유효성 검사 결과를 담은 객체 반환
  return { MEMBER_IDError, PWError, isValid };
};