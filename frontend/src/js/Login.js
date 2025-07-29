/**
 * @function validateLogin
 * @description 로그인 폼 입력값의 유효성을 검사하는 함수.
 * @param {string} id - 사용자 아이디.
 * @param {string} password - 사용자 비밀번호.
 * @returns {{idError: string, passwordError: string, isValid: boolean}} 유효성 검사 결과 객체.
 * - idError: 아이디 관련 에러 메시지 (없으면 빈 문자열)
 * - passwordError: 비밀번호 관련 에러 메시지 (없으면 빈 문자열)
 * - isValid: 모든 입력값이 유효하면 true, 아니면 false.
 */
export const validateLoginForm = (id, password) => {
  let idError = '';
  let passwordError = '';
  let isValid = true;

  // 아이디 유효성 검사
  if (!id.trim()) {
    idError = '아이디를 입력하세요.';
    isValid = false;
  }

  // 비밀번호 유효성 검사
  if (!password.trim()) {
    passwordError = '비밀번호를 입력하세요.';
    isValid = false;
  } else if (password.length < 8) {
    passwordError = '영문, 숫자, 특수문자를 포함한 8자리 이상의 비밀번호를 입력하세요.';
    isValid = false;
  }

  return { idError, passwordError, isValid };
};