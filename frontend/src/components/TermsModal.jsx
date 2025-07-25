
import React from 'react';
import '../styles/TermsModal.css'; // 모달 스타일 파일

/**
 * @function TermsModal
 * @description 약관 내용을 표시하고 동의 여부를 선택할 수 있는 모달 컴포넌트
 * @param {object} props - 컴포넌트 속성
 * @param {boolean} props.isOpen - 모달 열림/닫힘 상태
 * @param {string} props.title - 모달 제목
 * @param {string} props.content - 모달 내용 (약관 텍스트)
 * @param {string} props.termType - 'agreeToTerms' 또는 'agreeToPrivacy'
 * @param {function(string, boolean): void} props.onAgree - 약관 동의/비동의 처리 콜백 함수
 * @param {function(): void} props.onClose - 모달 닫기 콜백 함수
 */
function TermsModal({ isOpen, title, content, termType, onAgree, onClose }) {
  // 모달이 열려있지 않으면 아무것도 렌더링하지 않음
  if (!isOpen) return null;

  /**
   * @function handleAgree
   * @description 약관 동의 버튼 클릭 시 호출
   */
  const handleAgree = () => {
    onAgree(termType, true); // 해당 약관에 동의함을 부모 컴포넌트에 알림
    onClose(); // 모달 닫기
  };

  /**
   * @function handleDisagree
   * @description 약관 거부 버튼 클릭 시 호출
   */
  const handleDisagree = () => {
    onAgree(termType, false); // 해당 약관에 비동의함을 부모 컴포넌트에 알림
    onClose(); // 모달 닫기
  };

  return (
    <div className="modal-overlay" onClick={onClose}> {/* 오버레이 클릭 시 닫기 */}
      <div className="modal-content" onClick={(e) => e.stopPropagation()}> {/* 모달 내용 클릭 시 닫힘 방지 */}
        <div className="modal-header">
          <h2>{title}</h2>
          <button className="close-button" onClick={onClose}>&times;</button> {/* 닫기 버튼 */}
        </div>
        <div className="modal-body">
          <p>{content}</p>
        </div>
        <div className="modal-footer">
          <button className="modal-button agree" onClick={handleAgree}>동의</button>
          <button className="modal-button disagree" onClick={handleDisagree}>거부</button>
        </div>
      </div>
    </div>
  );
}

export default TermsModal;