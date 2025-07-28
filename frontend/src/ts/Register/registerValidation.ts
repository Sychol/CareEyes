
// --- 인터페이스 정의 시작 ---

// ★ IDValidationResult 인터페이스 export 추가
export interface IDValidationResult {
  isIDValid: boolean;
  message: string;
  isOnlyNumbers: boolean;
}

export interface PWFeedback {
  length: boolean;
  english: boolean;
  number: boolean;
  special: boolean;
  minTwoTypes: boolean;
}

export interface PWValidationResult {
  isValiD: boolean;
  feedback: PWFeedback;
  message: string;
  warning: string;
  isOnlyNumbers: boolean;
}

export interface PWMatchResult {
  isMatch: boolean;
  message: string;
}

export interface PhoneNumberValidationResult {
  isValid: boolean;
  message: string;
}

// --- 인터페이스 정의 끝 ---


export const validateIDPolicy = (id: string): IDValidationResult => {
  let isIDValid = true;
  let message = '';
  let isOnlyNumbers = false;

  // 1. 길이 검사 (6~20자)
  if (id.length < 6 || id.length > 20) {
    isIDValid = false;
    message = '아이디는 6자 이상 20자 이하여야 합니다.';
  }

  // 2. 첫 글자가 영문자인지 검사
  if (!/^[a-zA-Z]/.test(id)) {
    isIDValid = false;
    message = '아이디는 영문자로 시작해야 합니다.';
  }

  // 3. 영문자, 숫자만 허용
  if (!/^[a-zA-Z0-9]*$/.test(id)) {
    isIDValid = false;
    message = '아이디는 영문자, 숫자만 사용할 수 있습니다.';
  }

  // 4. 숫자만으로 구성된 경우 경고 (새로운 요구사항)
  if (/^\d+$/.test(id) && id.length > 0) {
    isOnlyNumbers = true;
    if (isIDValid) { // 다른 조건은 만족했지만 숫자만인 경우
      message = '아이디는 영문자를 포함해야 합니다.'; // 이 메시지는 경고로 사용될 수 있음
    }
  }


  if (isIDValid && !isOnlyNumbers && id.length >=6) { // 모든 유효성 조건을 만족하고 숫자만으로 구성되지 않은 경우
    message = '사용 가능한 아이디입니다.';
  } else if (!isIDValid && message === '') {
    message = '올바르지 않은 아이디 형식입니다.';
  }

  return { isIDValid, message, isOnlyNumbers };
};

export const validatePWPolicy = (password: string): PWValidationResult => {
  let isValiD = true;
  let message = '';
  let warning = '';
  let isOnlyNumbers = false;

  const feedback: PWFeedback = {
    length: password.length >= 8, // 8자 이상
    english: /[a-zA-Z]/.test(password), // 영문자 포함
    number: /[0-9]/.test(password), // 숫자 포함
    special: /[!@#$%^&*()]/.test(password), // 특수문자 포함
    minTwoTypes: false, // 2종류 이상 문자 조합
  };

  // 2종류 이상 문자 조합 검사
  let typeCount = 0;
  if (feedback.english) typeCount++;
  if (feedback.number) typeCount++;
  if (feedback.special) typeCount++;
  feedback.minTwoTypes = typeCount >= 2;

  // 길이 검사
  if (!feedback.length) {
    isValiD = false;
    message = '비밀번호는 8자 이상이어야 합니다.';
  }
  // 2종류 이상 문자 조합 검사
  if (!feedback.minTwoTypes) {
    isValiD = false;
    message = '비밀번호는 영문자, 숫자, 특수문자 중 2종류 이상을 조합해야 합니다.';
  }

  // 숫자만으로 구성된 경우 경고 
  if (/^\d+$/.test(password) && password.length > 0) {
    isOnlyNumbers = true;
    warning = '⚠️ 비밀번호는 숫자만으로 구성하는 것을 권장하지 않습니다.';
  }

  if (isValiD && !feedback.minTwoTypes) {
    isValiD = false;
  }
  
  if (isValiD) {
    message = '사용 가능한 비밀번호입니다.';
  } else if (message === '') { // 유효하지 않지만 특정 메시지가 없는 경우
    message = '비밀번호 정책을 만족해주세요.';
  }

  return { isValiD, feedback, message, warning, isOnlyNumbers };
};

export const validatePWMatch = (password: string, confirmPassword: string): PWMatchResult => {
  const isMatch = password === confirmPassword && password.length > 0;
  const message = isMatch ? '비밀번호가 일치합니다.' : '비밀번호가 일치하지 않습니다.';
  return { isMatch, message };
};

export const validatePhoneNumber = (phone1: string, phone2: string, phone3: string): PhoneNumberValidationResult => {
  let isValid = true;
  let message = '';

  const isNumeric = (value: string) => /^\d+$/.test(value);

  // 각 부분의 길이와 숫자 여부 검사
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