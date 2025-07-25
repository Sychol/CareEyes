// src/features/Auth/utils/registerValidation.js

/**
 * @function validateIdPolicy
 * @description 아이디 정책 유효성 검사 함수
 * @param {string} id - 검사할 아이디 문자열
 * @returns {{isIdValid: boolean, message: string, isOnlyNumbers: boolean}} - 유효성 검사 결과
 */
export const validateIdPolicy = (id) => {
  let message = '';
  let isIdValid = false;
  let isOnlyNumbers = false;

  if (id.length < 6 || id.length > 20) {
    message = '아이디는 6자 이상 20자 이하로 입력해주세요.';
  } else if (!/^[a-zA-Z]/.test(id)) { // 영문자로 시작하는지 확인
    message = '아이디는 영문자로 시작해야 합니다.';
  } else if (!/^[a-zA-Z0-9]*$/.test(id)) { // 영문자, 숫자 외의 문자 포함 여부 확인
    message = '아이디는 영문자, 숫자만 포함할 수 있습니다.';
  } else {
    isIdValid = true;
    message = '올바른 아이디 형식입니다.';
  }

  // 숫자만으로 구성되었는지 확인 (중복 확인 시 필요)
  isOnlyNumbers = /^\d+$/.test(id);

  return { isIdValid, message, isOnlyNumbers };
};

/**
 * @function validatePasswordPolicy
 * @description 비밀번호 정책 유효성 검사 함수
 * @param {string} password - 검사할 비밀번호 문자열
 * @returns {{isValid: boolean, feedback: object, message: string, warning: string, isOnlyNumbers: boolean}} - 유효성 검사 결과
 */
export const validatePasswordPolicy = (password) => {
  const feedback = {
    length: password.length >= 8,
    english: /[a-zA-Z]/.test(password),
    number: /[0-9]/.test(password),
    special: /[!@#$%^&*(),.?":{}|<>]/.test(password),
  };

  let typeCount = 0;
  if (feedback.english) typeCount++;
  if (feedback.number) typeCount++;
  if (feedback.special) typeCount++;

  feedback.minTwoTypes = typeCount >= 2;

  let isValid = feedback.length && feedback.minTwoTypes;
  let message = '';
  let warning = '';
  let isOnlyNumbers = /^\d+$/.test(password);

  if (!feedback.length) {
    message = '비밀번호는 8자 이상이어야 합니다.';
  } else if (!feedback.minTwoTypes) {
    message = '비밀번호는 영문, 숫자, 특수문자 중 2가지 이상을 조합해야 합니다.';
  } else {
    message = '비밀번호 정책을 만족합니다.';
  }

  if (isOnlyNumbers && password.length >= 8) {
    warning = '경고: 비밀번호가 숫자만으로 구성되어 있습니다. 보안 강화를 위해 영문, 특수문자를 포함해주세요.';
  }

  return { isValid, feedback, message, warning, isOnlyNumbers };
};

/**
 * @function validatePasswordMatch
 * @description 비밀번호 일치 여부 검사 함수
 * @param {string} password - 첫 번째 비밀번호
 * @param {string} confirmPassword - 확인 비밀번호
 * @returns {{isMatch: boolean, message: string}} - 일치 여부 결과
 */
export const validatePasswordMatch = (password, confirmPassword) => {
  let isMatch = false;
  let message = '';

  if (confirmPassword.length === 0) {
    message = '비밀번호를 다시 한번 입력해주세요.';
  } else if (password === confirmPassword) {
    isMatch = true;
    message = '비밀번호가 일치합니다.';
  } else {
    message = '비밀번호가 일치하지 않습니다.';
  }

  return { isMatch, message };
};