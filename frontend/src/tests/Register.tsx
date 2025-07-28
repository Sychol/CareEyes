// src/features/Auth/pages/Register.tsx

import React, { useState, useEffect, useCallback, ChangeEvent, FormEvent, FocusEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import type { JSX } from 'react'; // 'JSX' 네임스페이스 오류 해결을 위해 명시적 임포트

// 유효성 검사 로직 임포트
import {
  validateIDPolicy,
  validatePWPolicy,
  validatePWMatch,
  validatePhoneNumber,
  IDValidationResult,
  PWValidationResult,
  PWMatchResult,
  PhoneNumberValidationResult 
} from '../ts/Register/registerValidation';

// 약관 데이터 임포트
import {
  initialTermsOfService,
  initialPrivacyPolicy
} from '../ts/Register/registerTerms';

import CareEyesLogo from '../assets/logo/CareEyes_Logo.png';

import '../styles/Register.css';
import TermsModal from '../components/TermsModal';

// --- 인터페이스 정의 시작 ---

/**
 * @interface FormData
 * @description 회원가입 폼 데이터의 타입을 정의합니다.
 * @description 테이블 정의서의 컬럼명과 일치하도록 변수명을 수정했습니다.
 * @description PHONE 필드는 최종적으로 합쳐진 문자열이 들어갑니다.
 */
interface FormData {
  MEMBER_ID: string; // 테이블: MEMBER_ID (VARCHAR)
  MEMBER_PW: string; // 테이블: PW -> MEMBER_PW로 컬럼명 일치 (VARCHAR)
  confirmPW: string; // DB 컬럼은 아니지만 클라이언트 유효성 검사를 위해 유지
  MEMBER_NAME: string; // 테이블: MEMBER_NAME (VARCHAR)
  EMAIL: string; // 테이블: EMAIL (VARCHAR)
  PHONE: string; // 테이블: PHONE (VARCHAR)
  COMPANY: string; // 테이블: COMPANY (VARCHAR) - NN이 아니므로 필수 아님
  DEPARTMENT: string; // 테이블: DEPARTMENT (VARCHAR) - NN이 아니므로 필수 아님
  MEMBER_ROLE: string; // 테이블: MEMBER_ROLE (ENUM)
  agreeToTerms: boolean; // 서비스 이용 약관 동의 여부
  agreeToPrivacy: boolean; // 개인정보 처리 방침 동의 여부
}

/**
 * @interface ModalContent
 * @description 약관 모달 내용의 타입을 정의합니다.
 * 이 인터페이스는 TermsModal copy.tsx 또는 별도의 타입 파일에서 export되고
 * 여기서 import 되어야 합니다. 임시로 여기에 정의합니다.
 */
interface ModalContent {
  title: string;
  content: string;
  termType: string;
}

// --- 인터페이스 정의 끝 ---


/**
 * @function Register
 * @description 회원가입 페이지 컴포넌트
 * @returns {JSX.Element} Register 컴포넌트
 */
function Register() {
  const navigate = useNavigate();

  // 폼 데이터 상태 관리
  // MEMBER_PW로 변경
  const [formData, setFormData] = useState<Omit<FormData, 'PHONE'>>({
    MEMBER_ID: '',
    MEMBER_PW: '', // MEMBER_PW로 변경
    confirmPW: '',
    MEMBER_NAME: '',
    EMAIL: '',
    COMPANY: '',
    DEPARTMENT: '',
    MEMBER_ROLE: '',
    agreeToTerms: false,
    agreeToPrivacy: false,
  });

  const [phone1, setPhone1] = useState<string>('010');
  const [phone2, setPhone2] = useState<string>('');
  const [phone3, setPhone3] = useState<string>('');
  const [phoneNumber, setPhoneNumber] = useState<string>(''); // 합쳐진 전화번호 상태

  // 전화번호 유효성 검사 결과 상태
  const [phoneValidation, setPhoneValidation] = useState<PhoneNumberValidationResult>({
    isValid: false,
    message: '',
  });
  // 전화번호 필드 포커스 상태
  const [isPhoneFocused, setIsPhoneFocused] = useState<boolean>(false);


  // ID 유효성 검사 상태
  const [IDValidation, setIDValidation] = useState<IDValidationResult>({
    isIDValid: false,
    message: '',
    isOnlyNumbers: false,
  });
  const [isIDFocused, setIsIDFocused] = useState<boolean>(false);

  // 비밀번호 유효성 검사 상태 (MEMBER_PW로 변경)
  const [PWValidation, setPWValidation] = useState<PWValidationResult>({
    isValiD: false,
    feedback: {
      length: false,
      english: false,
      number: false,
      special: false,
      minTwoTypes: false,
    },
    message: '',
    warning: '',
    isOnlyNumbers: false,
  });
  const [isPWFocused, setIsPWFocused] = useState<boolean>(false);
  const [isConfirmPWFocused, setIsConfirmPWFocused] = useState<boolean>(false);

  // 비밀번호 보이기/숨기기 상태
  const [showPW, setShowPW] = useState<boolean>(false);
  const [showConfirmPW, setShowConfirmPW] = useState<boolean>(false);

  // passwordMatch 상태 (MEMBER_PW로 변경)
  const [PWMatch, setPWMatch] = useState<PWMatchResult>({
    isMatch: false,
    message: '',
  });

  // 에러 및 성공 메시지 상태
  const [error, setError] = useState<string>('');
  const [successMessage, setSuccessMessage] = useState<string>('');

  // 전체 동의 상태
  const [agreeToAll, setAgreeToAll] = useState<boolean>(false);

  // 모달 관련 상태
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [modalContent, setModalContent] = useState<ModalContent>({
    title: '',
    content: '',
    termType: '',
  });

  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;

    if (type === 'checkbox') {
      setFormData(prev => ({ ...prev, [name]: (e.target as HTMLInputElement).checked }));
    }
    else if (name !== 'agreeToAll') {
        setFormData(prev => ({ ...prev, [name]: value }));
    }
    setError('');
    setSuccessMessage('');
  };


  const handleIdFocus = (e: FocusEvent<HTMLInputElement>) => {
    setIsIDFocused(true);
  };

  const handleIdBlur = (e: FocusEvent<HTMLInputElement>) => {
    setIsIDFocused(false);
  };

  const handlePasswordFocus = (e: FocusEvent<HTMLInputElement>) => {
    setIsPWFocused(true);
  };

  const handlePasswordBlur = (e: FocusEvent<HTMLInputElement>) => {
    setIsPWFocused(false);
  };

  const handleConfirmPasswordFocus = (e: FocusEvent<HTMLInputElement>) => {
    setIsConfirmPWFocused(true);
  };

  const handleConfirmPasswordBlur = (e: FocusEvent<HTMLInputElement>) => {
    setIsConfirmPWFocused(false);
  };

  const togglePasswordVisibility = useCallback((): void => {
    setShowPW(prev => !prev);
  }, []);

  const toggleConfirmPasswordVisibility = useCallback((): void => {
    setShowConfirmPW(prev => !prev);
  }, []);


  const handleAgreeToAllChange = (e: ChangeEvent<HTMLInputElement>) => {
    const checked: boolean = e.target.checked;
    setAgreeToAll(checked);
    setFormData(prev => ({
      ...prev,
      agreeToTerms: checked,
      agreeToPrivacy: checked,
    }));
    setError('');
  };

  useEffect(() => {
    setAgreeToAll(formData.agreeToTerms && formData.agreeToPrivacy);
  }, [formData.agreeToTerms, formData.agreeToPrivacy]);

  const handleOpenTermsModal = useCallback((type: string, content: string, title: string): void => {
    setModalContent({ termType: type, content, title });
    setIsModalOpen(true);
  }, []);

  const handleCloseTermsModal = useCallback((): void => {
    setIsModalOpen(false);
    setModalContent({ title: '', content: '', termType: '' });
  }, []);

  const handleTermsAgreement = useCallback((termType: string, agreed: boolean): void => {
    setFormData(prev => ({
      ...prev,
      [termType]: agreed
    }));
    if (!agreed) {
      setError(`${termType === 'agreeToTerms' ? '서비스 이용 약관' : '개인정보 처리 방침'}에 동의해야 회원가입이 가능합니다.`);
    } else {
      setError('');
    }
  }, []);

  useEffect(() => {
    const validationResult = validateIDPolicy(formData.MEMBER_ID);
    setIDValidation(validationResult);
  }, [formData.MEMBER_ID]);

  // MEMBER_PW로 변경
  useEffect(() => {
    const validationResult = validatePWPolicy(formData.MEMBER_PW);
    setPWValidation(validationResult);
  }, [formData.MEMBER_PW]);

  // MEMBER_PW로 변경
  useEffect(() => {
    const validationResult = validatePWMatch(formData.MEMBER_PW, formData.confirmPW);
    setPWMatch(validationResult);
  }, [formData.MEMBER_PW, formData.confirmPW]);

  // 전화번호 유효성 검사 및 합치기 (phone1, phone2, phone3 변경될 때마다 실행)
  useEffect(() => {
    const validationResult = validatePhoneNumber(phone1, phone2, phone3);
    setPhoneValidation(validationResult); // 유효성 검사 결과 업데이트

    if (validationResult.isValid) {
      setPhoneNumber(`${phone1}-${phone2}-${phone3}`); // 유효할 때만 전화번호 합치기
    } else {
      setPhoneNumber(''); // 유효하지 않으면 합쳐진 전화번호 비워두기
    }
  }, [phone1, phone2, phone3]);

  // 전화번호 입력 필드 포커스/블러 핸들러
  const handlePhoneFocus = () => setIsPhoneFocused(true);
  const handlePhoneBlur = () => setIsPhoneFocused(false);


  const handleSubmit = async (e: FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');

    // 최종 유효성 검사 (테이블의 NN (Not Null) 제약 조건 반영)
    if (!IDValidation.isIDValid) {
      setError(IDValidation.message || '아이디 정책을 만족해주세요.');
      return;
    }
    // MEMBER_PW로 변경
    if (!PWValidation.isValiD) {
      setError(PWValidation.message || '비밀번호 정책을 만족해주세요.');
      return;
    }
    // MEMBER_PW로 변경
    if (!PWMatch.isMatch) {
      setError(PWMatch.message || '비밀번호 확인이 일치하지 않습니다.');
      return;
    }
    // 전화번호 유효성 최종 검사
    if (!phoneValidation.isValid) {
      setError(phoneValidation.message || '전화번호를 올바르게 입력해주세요.');
      return;
    }

    if (!formData.MEMBER_NAME) {
      setError('이름은 필수 입력 필드입니다.');
      return;
    }
    if (!formData.EMAIL) {
      setError('이메일은 필수 입력 필드입니다.');
      return;
    }
    
    if (!formData.MEMBER_ROLE) {
      setError('역할을 선택해주세요.');
      return;
    }
    if (!formData.agreeToTerms || !formData.agreeToPrivacy) {
      setError('서비스 이용 약관 및 개인정보 처리 방침에 동의해야 합니다.');
      return;
    }

    try {
      // 서버로 보낼 데이터는 테이블 컬럼명과 정확히 일치하도록 매핑
      const requestPayload = {
        MEMBER_ID: formData.MEMBER_ID,
        MEMBER_PW: formData.MEMBER_PW, // ★ MEMBER_PW로 변경
        MEMBER_NAME: formData.MEMBER_NAME,
        EMAIL: formData.EMAIL,
        PHONE: phoneNumber, // ★ 합쳐진 전화번호를 PHONE 필드에 할당
        MEMBER_ROLE: formData.MEMBER_ROLE,
        COMPANY: formData.COMPANY === '' ? null : formData.COMPANY,
        DEPARTMENT: formData.DEPARTMENT === '' ? null : formData.DEPARTMENT,
      };

      const response = await axios.post<{ success: boolean; message?: string }>('/api/signup', requestPayload);

      if (response.data.success) {
        setSuccessMessage('회원가입이 성공적으로 완료되었습니다!');
        navigate('/');
      } else {
        setError(response.data.message || '회원가입에 실패했습니다. 다시 시도해주세요.');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || '회원가입 요청 중 오류가 발생했습니다.');
      console.error('Signup Error:', err);
    }
  };

  return (
    <div className="auth-page-container">
      <div className="register-container">
        <form className="register-form" onSubmit={handleSubmit}>
          <div className="logo-section">
            <img src={CareEyesLogo} alt="CareEyes Logo" className="logo" />
          </div>

          <h2 className="form-title">회원가입</h2>

          <div className="input-group">
            <input
              type="text"
              name="MEMBER_ID"
              placeholder="아이디 (6~20자, 영문자로 시작)"
              className={`input-field ${isIDFocused && !IDValidation.isIDValid ? 'invalid-field' : isIDFocused ? 'focused-field' : ''}`}
              value={formData.MEMBER_ID}
              onChange={handleChange}
              onFocus={handleIdFocus}
              onBlur={handleIdBlur}
              maxLength={20}
            />
          </div>
          {isIDFocused && formData.MEMBER_ID.length > 0 && !IDValidation.isIDValid && (
            <div className="feedback-message-container">
              <p className="invalid">
                <i className="fas fa-times"></i>
                {IDValidation.message}
              </p>
            </div>
          )}
          {isIDFocused && formData.MEMBER_ID.length > 0 && IDValidation.isOnlyNumbers && (
            <div className="feedback-message-container">
              <p className="warning-text">
                ⚠️ 아이디는 영문자를 포함해야 합니다.
              </p>
            </div>
          )}
          {isIDFocused && formData.MEMBER_ID.length > 0 && IDValidation.isIDValid && !IDValidation.isOnlyNumbers && (
            <div className="feedback-message-container">
              <p className="valid">
                <i className="fas fa-check"></i>
                {IDValidation.message}
              </p>
            </div>
          )}


          <div className="input-group password-input-group">
            <input
              type={showPW ? 'text' : 'password'}
              name="MEMBER_PW" // ★ MEMBER_PW로 변경
              placeholder="비밀번호"
              className={`input-field ${isPWFocused && !PWValidation.isValiD ? 'invalid-field' : isPWFocused ? 'focused-field' : ''}`}
              value={formData.MEMBER_PW} // ★ MEMBER_PW로 변경
              onChange={handleChange}
              onFocus={handlePasswordFocus}
              onBlur={handlePasswordBlur}
            />
            <span className="icon eye-icon" onClick={togglePasswordVisibility}>
              <i className={showPW ? "fas fa-eye" : "fas fa-eye-slash"}></i>
            </span>
          </div>
          {isPWFocused && formData.MEMBER_PW.length > 0 && ( // ★ MEMBER_PW로 변경
            <div className="password-feedback-container">
              <p className={PWValidation.feedback.length ? 'valid' : 'invalid'}>
                <i className={PWValidation.feedback.length ? "fas fa-check" : "fas fa-times"}></i>
                비밀번호는 8자 이상이어야 합니다.
              </p>
              <p className={PWValidation.feedback.minTwoTypes ? 'valid' : 'invalid'}>
                <i className={PWValidation.feedback.minTwoTypes ? "fas fa-check" : "fas fa-times"}></i>
                비밀번호는 2종류 이상 문자 조합이어야 합니다.
              </p>
              {PWValidation.warning && (
                <p className="warning-text">⚠️ {PWValidation.warning}</p>
              )}
            </div>
          )}


          <div className="input-group password-input-group">
            <input
              type={showConfirmPW ? 'text' : 'password'}
              name="confirmPW"
              placeholder="비밀번호 확인"
              className={`input-field ${isConfirmPWFocused && !PWMatch.isMatch ? 'invalid-field' : isConfirmPWFocused ? 'focused-field' : ''}`}
              value={formData.confirmPW}
              onChange={handleChange}
              onFocus={handleConfirmPasswordFocus}
              onBlur={handleConfirmPasswordBlur}
            />
            <span className="icon eye-icon" onClick={toggleConfirmPasswordVisibility}>
              <i className={showConfirmPW ? "fas fa-eye" : "fas fa-eye-slash"}></i>
            </span>
          </div>
          {isConfirmPWFocused && (formData.confirmPW.length > 0 || formData.MEMBER_PW.length > 0) && ( // ★ MEMBER_PW로 변경
            <div className="feedback-message-container">
              <p className={PWMatch.isMatch ? 'valid' : 'invalid'}>
                <i className={PWMatch.isMatch ? "fas fa-check" : "fas fa-times"}></i>
                {PWMatch.message}
              </p>
            </div>
          )}

          <div className="input-group">
            <input
              type="text"
              name="MEMBER_NAME" // ★ MEMBER_NAME으로 변경
              placeholder="이름"
              className="input-field"
              value={formData.MEMBER_NAME}
              onChange={handleChange}
            />
          </div>

          <div className="input-group">
            <input
              type="email"
              name="EMAIL" // ★ EMAIL로 변경
              placeholder="이메일"
              className="input-field"
              value={formData.EMAIL}
              onChange={handleChange}
            />
          </div>

          {/* 전화번호 필드: 세 부분으로 나눔 (피드백 기능 추가) */}
          <div className="phone-input-group">
            <label htmlFor="phone1" className="phone-label">전화번호</label>
            <div className="phone-input-wrapper">
              <select
                id="phone1" 
                name="phone1"
                value={phone1}
                onChange={(e: ChangeEvent<HTMLSelectElement>) => setPhone1(e.target.value)}
                onFocus={handlePhoneFocus}
                onBlur={handlePhoneBlur}
                className="phone-part-select"
                title="전화번호 앞자리" // ★ 접근성을 위해 title 속성 추가
              >
                <option value="010">010</option>
                <option value="011">011</option>
                <option value="016">016</option>
                <option value="017">017</option>
                <option value="018">018</option>
                <option value="019">019</option>
              </select>
              <span className="phone-divider">-</span>
              <input
                type="text"
                id="phone2"
                name="phone2"
                value={phone2}
                onChange={(e: ChangeEvent<HTMLInputElement>) => {
                  const filteredValue = e.target.value.replace(/\D/g, '').substring(0, 4);
                  setPhone2(filteredValue);
                }}
                onFocus={handlePhoneFocus}
                onBlur={handlePhoneBlur}
                maxLength={4}
                className="phone-part-input"
                placeholder="1234"
                aria-label="전화번호 중간자리"
              />
              <span className="phone-divider">-</span>
              <input
                type="text"
                id="phone3"
                name="phone3"
                value={phone3}
                onChange={(e: ChangeEvent<HTMLInputElement>) => {
                  const filteredValue = e.target.value.replace(/\D/g, '').substring(0, 4);
                  setPhone3(filteredValue);
                }}
                onFocus={handlePhoneFocus}
                onBlur={handlePhoneBlur}
                maxLength={4}
                className="phone-part-input"
                placeholder="5678"
                aria-label="전화번호 끝자리"
              />
            </div>
          </div>
          {/* 전화번호 유효성 피드백 메시지 표시 (isPhoneFocused 추가) */}
          {isPhoneFocused && (phone1.length > 0 || phone2.length > 0 || phone3.length > 0) && (
            <div className="feedback-message-container">
              <p className={phoneValidation.isValid ? 'valid' : 'invalid'}>
                <i className={phoneValidation.isValid ? "fas fa-check" : "fas fa-times"}></i>
                {phoneValidation.message}
              </p>
            </div>
          )}


          <div className="input-group">
            <input
              type="text"
              name="COMPANY"
              placeholder="회사명"
              className="input-field"
              value={formData.COMPANY}
              onChange={handleChange}
            />
          </div>
          <div className="input-group">
            <input
              type="text"
              name="DEPARTMENT" 
              placeholder="부서명"
              className="input-field"
              value={formData.DEPARTMENT}
              onChange={handleChange}
            />
          </div>

          <div className="form-group-radio">
            <span className="radio-label">역할:</span>
            <div className="radio-options">
              <label>
                <input
                  type="radio"
                  name="MEMBER_ROLE" 
                  value="worker"
                  checked={formData.MEMBER_ROLE === 'worker'}
                  onChange={handleChange}
                />{' '}
                작업자
              </label>
              <label>
                <input
                  type="radio"
                  name="MEMBER_ROLE" 
                  value="admin"
                  checked={formData.MEMBER_ROLE === 'admin'}
                  onChange={handleChange}
                />{' '}
                관리자
              </label>
            </div>
          </div>

          {/* 약관 동의 섹션 */}
          <div className="terms-agreement-section">
            <label className="checkbox-label all-agree-checkbox">
              <input
                type="checkbox"
                name="agreeToAll"
                checked={agreeToAll}
                onChange={handleAgreeToAllChange}
                className="checkbox"
              />
              <span className="terms-text">모든 약관에 전체 동의합니다 (필수)</span>
            </label>
            <hr className="terms-divider" />

            {/* 서비스 이용 약관 */}
            <label className="checkbox-label">
              <input
                type="checkbox"
                name="agreeToTerms"
                checked={formData.agreeToTerms}
                onChange={handleChange}
                className="checkbox"
              />
              <span className="terms-text">서비스 이용 약관 동의 (필수)</span>
              <button
                type="button"
                className="view-terms-button"
                onClick={() => handleOpenTermsModal('agreeToTerms', initialTermsOfService, '서비스 이용 약관')}
              >
                보기
              </button>
            </label>

            {/* 개인정보 처리 방침 약관 */}
            <label className="checkbox-label">
              <input
                type="checkbox"
                name="agreeToPrivacy"
                checked={formData.agreeToPrivacy}
                onChange={handleChange}
                className="checkbox"
              />
              <span className="terms-text">개인정보 처리 방침 동의 (필수)</span>
              <button
                type="button"
                className="view-terms-button"
                onClick={() => handleOpenTermsModal('agreeToPrivacy', initialPrivacyPolicy, '개인정보 처리 방침')}
              >
                보기
              </button>
            </label>
          </div>

          {/* 에러 및 성공 메시지 */}
          {error && <p className="error-message">{error}</p>}
          {successMessage && <p className="success-message">{successMessage}</p>}

          <button
            type="submit"
            className="register-button"
            disabled={
              !IDValidation.isIDValid ||
              !PWValidation.isValiD ||
              !PWMatch.isMatch ||
              !phoneValidation.isValid ||
              !formData.MEMBER_NAME ||
              !formData.EMAIL ||
              !formData.MEMBER_ROLE || 
              !formData.agreeToTerms ||
              !formData.agreeToPrivacy
            }
          >
            회원가입
          </button>

          <div className="login-section">
            <p className="login-text">
              이미 계정이 있으신가요?{' '}
              <Link to="/Test_login" className="login-link">
                로그인
              </Link>
            </p>
          </div>
        </form>
      </div>

      <TermsModal
        isOpen={isModalOpen}
        title={modalContent.title}
        content={modalContent.content}
        termType={modalContent.termType}
        onAgree={handleTermsAgreement}
        onClose={handleCloseTermsModal}
      />
    </div>
  );
}

export default Register;