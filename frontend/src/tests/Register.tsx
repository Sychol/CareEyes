// src/features/Auth/pages/Register.tsx

import React, { useState, useEffect, useCallback, ChangeEvent, FormEvent, FocusEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios, { AxiosError } from 'axios'; // AxiosError 임포트

import type { JSX } from 'react';

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

/**
 * @interface FormData
 * @description 회원가입 폼 데이터의 타입을 정의합니다.
 */
interface FormData {
  memberId: string;
  memberPw: string;
  confirmPw: string;
  memberName: string;
  email: string;
  phone: string; // phone 필드 추가
  company: string;
  department: string;
  memberRole: string;
  
  agreeToTerms: boolean; // 서비스 이용 약관 동의 여부
  agreeToPrivacy: boolean; // 개인정보 처리 방침 동의 여부
}

/**
 * @interface ModalContent
 * @description 약관 모달 내용의 타입을 정의합니다.
 */
interface ModalContent {
  title: string;
  content: string;
  termType: string;
}

/**
 * @function Register
 * @description 회원가입 페이지 컴포넌트
 * @returns {JSX.Element} Register 컴포넌트
 */
function Register() {
  const navigate = useNavigate();

  // 폼 데이터 상태 관리
  const [formData, setFormData] = useState<FormData>({
    memberId: '',
    memberPw: '',
    confirmPw: '',
    memberName: '',
    email: '',
    phone: '', // 초기화
    company: '',
    department: '',
    memberRole: '',
    agreeToTerms: false,
    agreeToPrivacy: false,
  });

  const [phone1, setPhone1] = useState<string>('010');
  const [phone2, setPhone2] = useState<string>('');
  const [phone3, setPhone3] = useState<string>('');

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

  // 비밀번호 유효성 검사 상태
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

  // passwordMatch 상태
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

  /**
   * @function handleChange
   * @description 폼 입력 필드의 변경 이벤트를 처리합니다.
   * @param {ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>} e - 변경 이벤트 객체
   */
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

  /**
   * @function handlePhonePartChange
   * @description 전화번호 각 부분 입력 필드의 변경 이벤트를 처리합니다.
   * @param {string} partName - 'phone1', 'phone2', 'phone3' 중 하나
   * @param {string} value - 입력된 값
   */
  const handlePhonePartChange = useCallback((partName: string, value: string) => {
    const filteredValue = value.replace(/\D/g, '').substring(0, 4); // 숫자만 허용하고 최대 4자리
    if (partName === 'phone1') setPhone1(filteredValue);
    else if (partName === 'phone2') setPhone2(filteredValue);
    else if (partName === 'phone3') setPhone3(filteredValue);
  }, []);

  /**
   * @function handleIdFocus
   * @description 아이디 입력 필드에 포커스될 때의 핸들러
   * @param {FocusEvent<HTMLInputElement>} e - 포커스 이벤트 객체
   */
  const handleIdFocus = (e: FocusEvent<HTMLInputElement>) => {
    setIsIDFocused(true);
  };

  /**
   * @function handleIdBlur
   * @description 아이디 입력 필드에서 포커스가 벗어날 때의 핸들러
   * @param {FocusEvent<HTMLInputElement>} e - 포커스 이벤트 객체
   */
  const handleIdBlur = (e: FocusEvent<HTMLInputElement>) => {
    setIsIDFocused(false);
  };

  /**
   * @function handlePasswordFocus
   * @description 비밀번호 입력 필드에 포커스될 때의 핸들러
   * @param {FocusEvent<HTMLInputElement>} e - 포커스 이벤트 객체
   */
  const handlePasswordFocus = (e: FocusEvent<HTMLInputElement>) => {
    setIsPWFocused(true);
  };

  /**
   * @function handlePasswordBlur
   * @description 비밀번호 입력 필드에서 포커스가 벗어날 때의 핸들러
   * @param {FocusEvent<HTMLInputElement>} e - 포커스 이벤트 객체
   */
  const handlePasswordBlur = (e: FocusEvent<HTMLInputElement>) => {
    setIsPWFocused(false);
  };

  /**
   * @function handleConfirmPasswordFocus
   * @description 비밀번호 확인 입력 필드에 포커스될 때의 핸들러
   * @param {FocusEvent<HTMLInputElement>} e - 포커스 이벤트 객체
   */
  const handleConfirmPasswordFocus = (e: FocusEvent<HTMLInputElement>) => {
    setIsConfirmPWFocused(true);
  };

  /**
   * @function handleConfirmPasswordBlur
   * @description 비밀번호 확인 입력 필드에서 포커스가 벗어날 때의 핸들러
   * @param {FocusEvent<HTMLInputElement>} e - 포커스 이벤트 객체
   */
  const handleConfirmPasswordBlur = (e: FocusEvent<HTMLInputElement>) => {
    setIsConfirmPWFocused(false);
  };

  /**
   * @function togglePasswordVisibility
   * @description 비밀번호 입력 필드의 텍스트 보이기/숨기기를 전환합니다.
   */
  const togglePasswordVisibility = useCallback((): void => {
    setShowPW(prev => !prev);
  }, []);

  /**
   * @function toggleConfirmPasswordVisibility
   * @description 비밀번호 확인 입력 필드의 텍스트 보이기/숨기기를 전환합니다.
   */
  const toggleConfirmPasswordVisibility = useCallback((): void => {
    setShowConfirmPW(prev => !prev);
  }, []);

  /**
   * @function handleAgreeToAllChange
   * @description '모든 약관에 전체 동의합니다' 체크박스 변경 이벤트를 처리합니다.
   * @param {ChangeEvent<HTMLInputElement>} e - 변경 이벤트 객체
   */
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

  // '모든 약관 동의' 체크박스 상태를 개별 약관 동의 상태에 따라 업데이트
  useEffect(() => {
    setAgreeToAll(formData.agreeToTerms && formData.agreeToPrivacy);
  }, [formData.agreeToTerms, formData.agreeToPrivacy]);

  /**
   * @function handleOpenTermsModal
   * @description 약관 모달을 엽니다.
   * @param {string} type - 약관 타입 ('agreeToTerms' 또는 'agreeToPrivacy')
   * @param {string} content - 모달에 표시할 약관 내용
   * @param {string} title - 모달 제목
   */
  const handleOpenTermsModal = useCallback((type: string, content: string, title: string): void => {
    setModalContent({ termType: type, content, title });
    setIsModalOpen(true);
  }, []);

  /**
   * @function handleCloseTermsModal
   * @description 약관 모달을 닫습니다.
   */
  const handleCloseTermsModal = useCallback((): void => {
    setIsModalOpen(false);
    setModalContent({ title: '', content: '', termType: '' });
  }, []);

  /**
   * @function handleTermsAgreement
   * @description 약관 동의 여부를 업데이트하고, 동의하지 않았을 경우 에러 메시지를 설정합니다.
   * @param {string} termType - 약관 타입 ('agreeToTerms' 또는 'agreeToPrivacy')
   * @param {boolean} agreed - 동의 여부
   */
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

  // 아이디 유효성 검사
  useEffect(() => {
    const validationResult = validateIDPolicy(formData.memberId);
    setIDValidation(validationResult);
  }, [formData.memberId]);

  // ID 중복검사
useEffect(() => {
  const checkDuplicateId = async () => {
    try {
      const res = await axios.post('/api/member/duplicate', {
        memberId: formData.memberId,
        email: '',
        phone: ''
      });
      if (res.data > 0) {
        setIDValidation(prev => ({
          ...prev,
          isIDValid: false,
          message: '이미 사용 중인 아이디입니다.',
        }));
      }
    } catch (err) {
      console.error('중복 검사 실패:', err);
    }
  };

  if (formData.memberId.length >= 6) checkDuplicateId();
}, [formData.memberId]);

  // 비밀번호 유효성 검사
  useEffect(() => {
    const validationResult = validatePWPolicy(formData.memberPw);
    setPWValidation(validationResult);
  }, [formData.memberPw]);

  // 비밀번호 일치 여부 검사
  useEffect(() => {
    const validationResult = validatePWMatch(formData.memberPw, formData.confirmPw);
    setPWMatch(validationResult);
  }, [formData.memberPw, formData.confirmPw]);

  // 전화번호 유효성 검사 및 합치기 (phone1, phone2, phone3 변경될 때마다 실행)
  useEffect(() => {
    const validationResult = validatePhoneNumber(phone1, phone2, phone3);
    setPhoneValidation(validationResult); // 유효성 검사 결과 업데이트

    // 유효할 때만 전화번호 합쳐서 formData에 저장
    if (validationResult.isValid) {
      setFormData(prev => ({ ...prev, phone: `${phone1}-${phone2}-${phone3}` }));
    } else {
      setFormData(prev => ({ ...prev, phone: '' })); // 유효하지 않으면 비워두기
    }
  }, [phone1, phone2, phone3]); // formData.phone을 의존성 배열에 넣지 않도록 주의 (무한 루프 방지)

  /**
   * @function handlePhoneFocus
   * @description 전화번호 입력 필드에 포커스될 때의 핸들러
   */
  const handlePhoneFocus = () => setIsPhoneFocused(true);

  /**
   * @function handlePhoneBlur
   * @description 전화번호 입력 필드에서 포커스가 벗어날 때의 핸들러
   */
  const handlePhoneBlur = () => setIsPhoneFocused(false);

  /**
   * @function handleSubmit
   * @description 폼 제출 이벤트를 처리하고 회원가입 요청을 보냅니다.
   * @param {FormEvent<HTMLFormElement>} e - 폼 이벤트 객체
   */
  const handleSubmit = async (e: FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');

    // 최종 유효성 검사
    if (!IDValidation.isIDValid) {
      setError(IDValidation.message || '아이디 정책을 만족해주세요.');
      return;
    }

    if (!PWValidation.isValiD) {
      setError(PWValidation.message || '비밀번호 정책을 만족해주세요.');
      return;
    }

    if (!PWMatch.isMatch) {
      setError(PWMatch.message || '비밀번호 확인이 일치하지 않습니다.');
      return;
    }
    // 전화번호 유효성 최종 검사
    if (!phoneValidation.isValid) {
      setError(phoneValidation.message || '전화번호를 올바르게 입력해주세요.');
      return;
    }

    if (!formData.memberName) {
      setError('이름은 필수 입력 필드입니다.');
      return;
    }
    if (!formData.email) {
      setError('이메일은 필수 입력 필드입니다.');
      return;
    }

    if (!formData.memberRole) {
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
        memberId: formData.memberId,
        memberPw: formData.memberPw,
        memberName: formData.memberName,
        email: formData.email,
        phone: formData.phone, // formData.phone 사용
        memberRole: formData.memberRole,
        company: formData.company === '' ? null : formData.company,
        department: formData.department === '' ? null : formData.department,
      };

      const response = await axios.post<{ success: boolean; message?: string }>('/api/signup', requestPayload);

      if (response.data.success) {
        setSuccessMessage('회원가입이 성공적으로 완료되었습니다!');
        navigate('/');
      } else {
        setError(response.data.message || '회원가입에 실패했습니다. 다시 시도해주세요.');
      }
    } catch (err) { // err: any 대신 err로 변경
      if (axios.isAxiosError(err)) {
        setError(err.response?.data?.message || '회원가입 요청 중 오류가 발생했습니다.');
      } else {
        setError('알 수 없는 오류가 발생했습니다.');
      }
      console.error('Signup Error:', err);
    }
  };

  // 제출 버튼 disabled 상태를 위한 변수
  const isSubmitDisabled = !IDValidation.isIDValid ||
    !PWValidation.isValiD ||
    !PWMatch.isMatch ||
    !phoneValidation.isValid ||
    !formData.memberName ||
    !formData.email ||
    !formData.memberRole ||
    !formData.agreeToTerms ||
    !formData.agreeToPrivacy;

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
              name="memberId"
              placeholder="아이디 (6~20자, 영문자로 시작)"
              className={`input-field ${isIDFocused && !IDValidation.isIDValid ? 'invalid-field' : isIDFocused ? 'focused-field' : ''}`}
              value={formData.memberId}
              onChange={handleChange}
              onFocus={handleIdFocus}
              onBlur={handleIdBlur}
              maxLength={20}
            />
          </div>
          {isIDFocused && formData.memberId.length > 0 && !IDValidation.isIDValid && (
            <div className="feedback-message-container">
              <p className="invalid">
                <i className="fas fa-times"></i>
                {IDValidation.message}
              </p>
            </div>
          )}
          {isIDFocused && formData.memberId.length > 0 && IDValidation.isOnlyNumbers && (
            <div className="feedback-message-container">
              <p className="warning-text">
                ⚠️ 아이디는 영문자를 포함해야 합니다.
              </p>
            </div>
          )}
          {isIDFocused && formData.memberId.length > 0 && IDValidation.isIDValid && !IDValidation.isOnlyNumbers && (
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
              name="memberPw"
              placeholder="비밀번호"
              className={`input-field ${isPWFocused && !PWValidation.isValiD ? 'invalid-field' : isPWFocused ? 'focused-field' : ''}`}
              value={formData.memberPw}
              onChange={handleChange}
              onFocus={handlePasswordFocus}
              onBlur={handlePasswordBlur}
            />
            <span className="icon eye-icon" onClick={togglePasswordVisibility}>
              <i className={showPW ? "fas fa-eye" : "fas fa-eye-slash"}></i>
            </span>
          </div>
          {isPWFocused && formData.memberPw.length > 0 && (
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
              name="confirmPw"
              placeholder="비밀번호 확인"
              className={`input-field ${isConfirmPWFocused && !PWMatch.isMatch ? 'invalid-field' : isConfirmPWFocused ? 'focused-field' : ''}`}
              value={formData.confirmPw}
              onChange={handleChange}
              onFocus={handleConfirmPasswordFocus}
              onBlur={handleConfirmPasswordBlur}
            />
            <span className="icon eye-icon" onClick={toggleConfirmPasswordVisibility}>
              <i className={showConfirmPW ? "fas fa-eye" : "fas fa-eye-slash"}></i>
            </span>
          </div>
          {isConfirmPWFocused && (formData.confirmPw.length > 0 || formData.memberPw.length > 0) && (
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
              name="memberName"
              placeholder="이름"
              className="input-field"
              value={formData.memberName}
              onChange={handleChange}
            />
          </div>

          <div className="input-group">
            <input
              type="email"
              name="email"
              placeholder="이메일"
              className="input-field"
              value={formData.email}
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
                onChange={(e: ChangeEvent<HTMLSelectElement>) => handlePhonePartChange('phone1', e.target.value)}
                onFocus={handlePhoneFocus}
                onBlur={handlePhoneBlur}
                className="phone-part-select"
                title="전화번호 앞자리"
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
                onChange={(e: ChangeEvent<HTMLInputElement>) => handlePhonePartChange('phone2', e.target.value)}
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
                onChange={(e: ChangeEvent<HTMLInputElement>) => handlePhonePartChange('phone3', e.target.value)}
                onFocus={handlePhoneFocus}
                onBlur={handlePhoneBlur}
                maxLength={4}
                className="phone-part-input"
                placeholder="5678"
                aria-label="전화번호 끝자리"
              />
            </div>
          </div>
          {/* 전화번호 유효성 피드백 메시지 표시 */}
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
              name="company"
              placeholder="회사명"
              className="input-field"
              value={formData.company}
              onChange={handleChange}
            />
          </div>
          <div className="input-group">
            <input
              type="text"
              name="department"
              placeholder="부서명"
              className="input-field"
              value={formData.department}
              onChange={handleChange}
            />
          </div>

          <div className="form-group-radio">
            <span className="radio-label">역할:</span>
            <div className="radio-options">
              <label>
                <input
                  type="radio"
                  name="memberRole"
                  value="worker"
                  checked={formData.memberRole === 'worker'}
                  onChange={handleChange}
                />{' '}
                작업자
              </label>
              <label>
                <input
                  type="radio"
                  name="memberRole"
                  value="admin"
                  checked={formData.memberRole === 'admin'}
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
            disabled={isSubmitDisabled}
          >
            회원가입
          </button>

          <div className="login-section">
            <p className="login-text">
              이미 계정이 있으신가요?{' '}
              <Link to="/Login" className="login-link">
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
