# yolo/detect_loop.py
import threading
import time
from config import DELAY, TARGET_CCTV
from utils import should_send_event
from stream import get_latest_frame, get_or_open_capture
from detect import model_filter
from storage import save_detection_image
from api import send_to_spring
from datetime import datetime
from zoneinfo import ZoneInfo
from common.cache import cache

def detect_loop(cctv_id, url, delay=DELAY, save_type="ncloud"):
    """ 
    감지 루프: 주어진 URL에서 프레임을 가져와 YOLO 모델로 객체 감지 후,
    Spring 서버로 전송하는 무한 루프
    """
    while True:
        try:
            # 캡처 객체 가져오기 또는 열기
            if url and cctv_id:
                #print(f"🔄 {cctv_id} 스트림 캡처 열기: {url}")
                with cache.cap_lock:
                    cap = get_or_open_capture(url)
            else:
                raise ValueError("❌ 유효한 YouTube URL과 CCTV ID가 필요합니다.")
            
            # 프레임 간 딜레이 적용 및 마지막 프레임 가져오기
            success, frame = get_latest_frame(cap, delay)
            if not success: # 실패 시
                raise RuntimeError(f"❌ 프레임 가져오기 실패 (cctv_id={cctv_id})")
                continue

            # 모델 추론 및 필터링
            results, object_counts, should_save = model_filter(frame)
            annotated_img = results.plot()

            # 현재 시간 및 날짜 문자열 생성
            now = datetime.now(ZoneInfo("Asia/Seoul")) # 한국 시간으로 Zone 고정
            date_str = now.strftime("%Y-%m-%d")
            time_str = now.strftime("%H-%M-%S")

            # 유효 객체 필터링
            filtered_counts = {cls: count for cls, count in object_counts.items() if should_send_event(cls, cctv_id)}

            # 저장 조건 확인 및 이미지 저장
            save_path = None
            if filtered_counts and should_save:
                # save_path : DB에 저장되는 경로
                save_path = save_detection_image(annotated_img, object_counts, cctv_id, date_str, time_str, save_type)

            # YOLO 감지 완료 후 주석 이미지 저장
            with cache.frame_lock:
                cache.latest_annotated_frame[cctv_id] = annotated_img.copy()

            # 유효 객체가 있다면 전송
            if filtered_counts and save_path:
                event_status, event_msg, msg_status, msg_msg = send_to_spring(filtered_counts, save_path, date_str, time_str, cctv_id)
                print(f"📡 Spring /detect 응답: {event_status}, {event_msg}")
                print(f"📡 Spring /sendalert 응답: {msg_status}, {msg_msg}")
            elif filtered_counts and not save_path:
                print(f"⚠️ 객체는 탐지됐지만 이미지 저장은 생략됨 → 전송 안 함")

        except Exception as e:
            print(f"❌ 감지 루프 오류: {e}")
            time.sleep(delay)


def start_detection_threads():
    for cctv_id, url in TARGET_CCTV:
        threading.Thread(
            target=detect_loop,
            args=(cctv_id, url, DELAY, "ncloud"),
            daemon=True
        ).start()


def get_cached_frame(cctv_id):
    with cache.frame_lock:
        return cache.latest_annotated_frame.get(cctv_id)
