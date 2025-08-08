# storage/save_image.py
import os
import cv2
import io

from config import IMAGE_SAVE_DIR
from storage.upload_ncloud import upload_to_ncloud


def save_detection_image(annotated_img, object_counts, cctv_id, date_str, time_str, save_route="ncloud"):
    """
    감지 결과 이미지를 저장하거나 Ncloud에 업로드
    return: 저장 경로 (로컬 상대경로 또는 Ncloud URL)
    """
    # Ncloud에 업로드
    if save_route == "ncloud":
        success, buffer = cv2.imencode('.jpg', annotated_img)
        if not success:
            raise RuntimeError("❌ 이미지 인코딩 실패")
        image_stream = io.BytesIO(buffer)
        return upload_to_ncloud(image_stream, f"{cctv_id}/{date_str}/{time_str}.jpg")

    # 로컬에 저장
    elif save_route == "local":
        # 저장 디렉토리 생성
        save_dir = f"{IMAGE_SAVE_DIR}/{cctv_id}/{date_str}"
        os.makedirs(save_dir, exist_ok=True)

        # 저장 경로 설정
        save_path = f"{save_dir}/{time_str}.jpg"
        cv2.imwrite(save_path, annotated_img) # 이미지 저장
        # 디버깅용 : 탐지 객체 및 저장 경로 출력
        print(f"🔍 탐지 완료! {object_counts} → 저장: {save_path}")

        # return : DB에 저장할 경로
        return f"{cctv_id}/{date_str}/{time_str}.jpg"

    else:
        print(f"⚠️ 알 수 없는 저장 방식: {save_route} → 저장 생략")
        return None
