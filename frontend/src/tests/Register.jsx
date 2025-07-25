// src/features/Auth/pages/Register.jsx

import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';

// 유효성 검사 로직 임포트
import {
  validateIdPolicy,
  validatePasswordPolicy,
  validatePasswordMatch
} from '../js/register/registerValidation.js';

// 약관 데이터 임포트
import {
  initialTermsOfService,
  initialPrivacyPolicy
} from '../js/register/registerTerms.js';

import CareEyesLogo from '../assets/logo/CareEyes_Logo.png'; // 로고 이미지 임포트

import '../styles/Register.css'; // 회원가입 페이지 스타일 파일
import TermsModal from '../components/TermsModal.jsx';


/**
 * @function Register
 * @description 회원가입 페이지 컴포넌트
 */
function Register() {
  const navigate = useNavigate();

  // 폼 데이터 상태 관리
  const [formData, setFormData] = useState({
    id: '',
    password: '',
    confirmPassword: '',
    name: '',
    email: '',
    phone: '',
    company: '',
    department: '',
    role: '',
    // receiveNotifications 상태 삭제
    agreeToTerms: false,
    agreeToPrivacy: false,
  });

  // ID 유효성 검사 상태
  const [idValidation, setIdValidation] = useState({
    isIdValid: false,
    message: '',
    isOnlyNumbers: false,
  });

  // ID 입력 필드의 포커스 상태
  const [isIdFocused, setIsIdFocused] = useState(false);

  // 비밀번호 유효성 검사 상태
  const [passwordValidation, setPasswordValidation] = useState({
    isValid: false,
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

  // 비밀번호 입력 필드의 포커스 상태
  const [isPasswordFocused, setIsPasswordFocused] = useState(false);

  // 비밀번호 확인 입력 필드의 포커스 상태
  const [isConfirmPasswordFocused, setIsConfirmPasswordFocused] = useState(false);

  // 비밀번호 보이기/숨기기 상태
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // passwordMatch 상태
  const [passwordMatch, setPasswordMatch] = useState({
    isMatch: false,
    message: '',
  });

  // 에러 및 성공 메시지 상태
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // 전체 동의 상태
  const [agreeToAll, setAgreeToAll] = useState(false);

  // 모달 관련 상태
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalContent, setModalContent] = useState({
    title: '',
    content: '',
    termType: '',
  });

  /**
   * @function handleChange
   * @description 폼 입력 필드의 변경 이벤트를 처리하고, formData 상태를 업데이트
   * @param {object} e - 이벤트 객체
   */
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    // 약관 관련 체크박스는 개별적으로 처리
    if (name === 'agreeToTerms' || name === 'agreeToPrivacy') {
      setFormData(prev => ({ ...prev, [name]: checked }));
    }
    // 'agreeToAll' (전체 동의)는 handleAgreeToAllChange 함수에서 별도 처리
    else if (name !== 'agreeToAll') {
        setFormData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
    }
    setError('');
    setSuccessMessage('');
  };

  /**
   * @function handleIdFocus
   * @description 아이디 input 필드에 포커스될 때 호출
   */
  const handleIdFocus = () => {
    setIsIdFocused(true);
  };

  /**
   * @function handleIdBlur
   * @description 아이디 input 필드에서 포커스를 잃을 때 호출
   */
  const handleIdBlur = () => {
    setIsIdFocused(false);
  };

  /**
   * @function handlePasswordFocus
   * @description 비밀번호 input 필드에 포커스될 때 호출
   */
  const handlePasswordFocus = () => {
    setIsPasswordFocused(true);
  };

  /**
   * @function handlePasswordBlur
   * @description 비밀번호 input 필드에서 포커스를 잃을 때 호출
   */
  const handlePasswordBlur = () => {
    setIsPasswordFocused(false);
  };

  /**
   * @function handleConfirmPasswordFocus
   * @description 비밀번호 확인 input 필드에 포커스될 때 호출
   */
  const handleConfirmPasswordFocus = () => {
    setIsConfirmPasswordFocused(true);
  };

  /**
   * @function handleConfirmPasswordBlur
   * @description 비밀번호 확인 input 필드에서 포커스를 잃을 때 호출
   */
  const handleConfirmPasswordBlur = () => {
    setIsConfirmPasswordFocused(false);
  };

  /**
   * @function togglePasswordVisibility
   * @description 비밀번호 보이기/숨기기 토글
   */
  const togglePasswordVisibility = useCallback(() => {
    setShowPassword(prev => !prev);
  }, []);

  /**
   * @function toggleConfirmPasswordVisibility
   * @description 비밀번호 확인 보이기/숨기기 토글
   */
  const toggleConfirmPasswordVisibility = useCallback(() => {
    setShowConfirmPassword(prev => !prev);
  }, []);


  /**
   * @function handleAgreeToAllChange
   * @description 전체 동의 체크박스 변경 시 호출
   * @param {object} e - 이벤트 객체
   */
  const handleAgreeToAllChange = (e) => {
    const checked = e.target.checked;
    setAgreeToAll(checked);
    setFormData(prev => ({
      ...prev,
      agreeToTerms: checked,
      agreeToPrivacy: checked,
    }));
    setError('');
  };

  /**
   * @effect
   * @description 개별 약관 동의 상태가 변경될 때 전체 동의 체크박스 상태 업데이트
   */
  useEffect(() => {
    setAgreeToAll(formData.agreeToTerms && formData.agreeToPrivacy);
  }, [formData.agreeToTerms, formData.agreeToPrivacy]);

  /**
   * @function handleOpenTermsModal
   * @description 약관 모달을 열고 내용을 설정
   * @param {string} type - 'agreeToTerms' 또는 'agreeToPrivacy'
   * @param {string} content - 모달에 표시할 약관 내용
   * @param {string} title - 모달 제목
   */
  const handleOpenTermsModal = useCallback((type, content, title) => {
    setModalContent({ type, content, title });
    setIsModalOpen(true);
  }, []);

  /**
   * @function handleCloseTermsModal
   * @description 약관 모달을 닫음
   */
  const handleCloseTermsModal = useCallback(() => {
    setIsModalOpen(false);
    setModalContent({ title: '', content: '', termType: '' });
  }, []);

  /**
   * @function handleTermsAgreement
   * @description 모달에서 약관 동의 여부 결과를 받아와 formData 업데이트
   * @param {string} termType - 'agreeToTerms' 또는 'agreeToPrivacy'
   * @param {boolean} agreed - 동의 여부 (true: 동의, false: 비동의)
   */
  const handleTermsAgreement = useCallback((termType, agreed) => {
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

  // ID 유효성 검사
  useEffect(() => {
    const { isIdValid, message, isOnlyNumbers } = validateIdPolicy(formData.id);
    setIdValidation(prev => ({
      ...prev,
      isIdValid: isIdValid,
      message: message,
      isOnlyNumbers: isOnlyNumbers,
    }));
  }, [formData.id]);

  // 비밀번호 유효성 검사
  useEffect(() => {
    const { isValid, feedback, message, warning, isOnlyNumbers } = validatePasswordPolicy(formData.password);
    setPasswordValidation({ isValid, feedback, message, warning, isOnlyNumbers });
  }, [formData.password]);

  // 비밀번호 일치 여부 검사
  useEffect(() => {
    const { isMatch, message } = validatePasswordMatch(formData.password, formData.confirmPassword);
    setPasswordMatch({ isMatch, message });
  }, [formData.password, formData.confirmPassword]);

  /**
   * @function handleSubmit
   * @description 회원가입 폼 제출 이벤트 처리
   * @param {object} e - 이벤트 객체
   */
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');

    // 최종 유효성 검사
    if (!idValidation.isIdValid) {
      setError(idValidation.message || '아이디 정책을 만족해주세요.');
      return;
    }
    if (!passwordValidation.isValid) {
      setError(passwordValidation.message || '비밀번호 정책을 만족해주세요.');
      return;
    }
    if (!passwordMatch.isMatch) {
      setError(passwordMatch.message || '비밀번호 확인이 일치하지 않습니다.');
      return;
    }
    // receiveNotifications 필드 제거
    if (!formData.name || !formData.email || !formData.phone || !formData.role) {
      setError('모든 필수 입력 필드를 채워주세요.');
      return;
    }
    if (!formData.agreeToTerms || !formData.agreeToPrivacy) {
      setError('서비스 이용 약관 및 개인정보 처리 방침에 동의해야 합니다.');
      return;
    }

    try {
      const response = await axios.post('/api/signup', formData);

      if (response.data.success) {
        setSuccessMessage('회원가입이 성공적으로 완료되었습니다!');
        navigate('/');
      } else {
        setError(response.data.message || '회원가입에 실패했습니다. 다시 시도해주세요.');
      }
    } catch (err) {
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
              name="id"
              placeholder="아이디 (6~20자, 영문자로 시작)"
              className={`input-field ${isIdFocused && !idValidation.isIdValid ? 'invalid-field' : isIdFocused ? 'focused-field' : ''}`}
              value={formData.id}
              onChange={handleChange}
              onFocus={handleIdFocus}
              onBlur={handleIdBlur}
              maxLength={20}
            />
          </div>
          {isIdFocused && formData.id.length > 0 && !idValidation.isIdValid && (
            <div className="feedback-message-container">
              <p className="invalid">
                <i className="fas fa-times"></i>
                {idValidation.message}
              </p>
            </div>
          )}
          {isIdFocused && formData.id.length > 0 && idValidation.isOnlyNumbers && (
            <div className="feedback-message-container">
              <p className="warning-text">
                ⚠️ 아이디는 영문자를 포함해야 합니다.
              </p>
            </div>
          )}
          {isIdFocused && formData.id.length > 0 && idValidation.isIdValid && !idValidation.isOnlyNumbers && (
            <div className="feedback-message-container">
              <p className="valid">
                <i className="fas fa-check"></i>
                {idValidation.message}
              </p>
            </div>
          )}


          <div className="input-group password-input-group">
            <input
              type={showPassword ? 'text' : 'password'}
              name="password"
              placeholder="비밀번호"
              className={`input-field ${isPasswordFocused && !passwordValidation.isValid ? 'invalid-field' : isPasswordFocused ? 'focused-field' : ''}`}
              value={formData.password}
              onChange={handleChange}
              onFocus={handlePasswordFocus}
              onBlur={handlePasswordBlur}
            />
            <span className="icon eye-icon" onClick={togglePasswordVisibility}>
              <i className={showPassword ? "fas fa-eye" : "fas fa-eye-slash"}></i>
            </span>
          </div>
          {isPasswordFocused && formData.password.length > 0 && (
            <div className="password-feedback-container">
              <p className={passwordValidation.feedback.length ? 'valid' : 'invalid'}>
                <i className={passwordValidation.feedback.length ? "fas fa-check" : "fas fa-times"}></i>
                비밀번호는 8자 이상이어야 합니다.
              </p>
              <p className={passwordValidation.feedback.minTwoTypes ? 'valid' : 'invalid'}>
                <i className={passwordValidation.feedback.minTwoTypes ? "fas fa-check" : "fas fa-times"}></i>
                비밀번호는 2종류 이상 문자 조합이어야 합니다.
              </p>
              {passwordValidation.warning && (
                <p className="warning-text">⚠️ {passwordValidation.warning}</p>
              )}
            </div>
          )}


          <div className="input-group password-input-group">
            <input
              type={showConfirmPassword ? 'text' : 'password'}
              name="confirmPassword"
              placeholder="비밀번호 확인"
              className={`input-field ${isConfirmPasswordFocused && !passwordMatch.isMatch ? 'invalid-field' : isConfirmPasswordFocused ? 'focused-field' : ''}`}
              value={formData.confirmPassword}
              onChange={handleChange}
              onFocus={handleConfirmPasswordFocus}
              onBlur={handleConfirmPasswordBlur}
            />
            <span className="icon eye-icon" onClick={toggleConfirmPasswordVisibility}>
              <i className={showConfirmPassword ? "fas fa-eye" : "fas fa-eye-slash"}></i>
            </span>
          </div>
          {isConfirmPasswordFocused && (formData.confirmPassword.length > 0 || formData.password.length > 0) && (
            <div className="feedback-message-container">
              <p className={passwordMatch.isMatch ? 'valid' : 'invalid'}>
                <i className={passwordMatch.isMatch ? "fas fa-check" : "fas fa-times"}></i>
                {passwordMatch.message}
              </p>
            </div>
          )}

          <div className="input-group">
            <input
              type="text"
              name="name"
              placeholder="이름"
              className="input-field"
              value={formData.name}
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

          <div className="input-group">
            <input
              type="tel"
              name="phone"
              placeholder="전화번호 (예: 010-1234-5678)"
              className="input-field"
              value={formData.phone}
              onChange={handleChange}
            />
          </div>
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
                  name="role"
                  value="worker"
                  checked={formData.role === 'worker'}
                  onChange={handleChange}
                />{' '}
                작업자
              </label>
              <label>
                <input
                  type="radio"
                  name="role"
                  value="admin"
                  checked={formData.role === 'admin'}
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
              !idValidation.isIdValid ||
              !passwordValidation.isValid ||
              !passwordMatch.isMatch ||
              !formData.name ||
              !formData.email ||
              !formData.phone ||
              !formData.role ||
              // receiveNotifications 필드 제거
              !formData.agreeToTerms ||
              !formData.agreeToPrivacy
            }
          >
            회원가입
          </button>

          <div className="join-section">
            <p className="join-text">
              이미 계정이 있으신가요?{' '}
              <Link to="/Test_login" className="join-link">
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
        termType={modalContent.type}
        onAgree={handleTermsAgreement}
        onClose={handleCloseTermsModal}
      />
    </div>
  );
}

export default Register;