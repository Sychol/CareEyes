# yolo/detect_loop.py
import threading
import time
from config import DELAY, SUPPRESSION_SECONDS, TARGET_CCTV
from utils import should_send_event
from stream import get_latest_frame, get_or_open_capture
from detect import model_filter
from storage import save_detection_image
from api import send_to_spring

from collections import defaultdict

# 실시간 프레임 캐시
latest_annotated_frame = {}
frame_lock = threading.Lock()


def detect_loop(url, cctv_id, delay=DELAY, save_type="ncloud"):
    """ 
    감지 루프: 주어진 URL에서 프레임을 가져와 YOLO 모델로 객체 감지 후,
    Spring 서버로 전송하는 무한 루프
    """
    while True:
        try:
            cap = get_or_open_capture(url)
            success, frame = get_latest_frame(cap, delay)
            if not success:
                continue

            results, object_counts, should_save = model_filter(frame)
            annotated_img = results.plot()

            from datetime import datetime
            from zoneinfo import ZoneInfo
            now = datetime.now(ZoneInfo("Asia/Seoul"))
            date_str = now.strftime("%Y-%m-%d")
            time_str = now.strftime("%H-%M-%S")

            save_path = None
            if should_save:
                save_path = save_detection_image(annotated_img, object_counts, cctv_id, date_str, time_str, save_type)

            # YOLO 감지 완료 후 주석 이미지 저장
            with frame_lock:
                latest_annotated_frame[cctv_id] = annotated_img.copy()

            # 유효 객체 필터링
            filtered_counts = {cls: count for cls, count in object_counts.items() if should_send_event(cls, cctv_id)}

            if filtered_counts and save_path:
                send_to_spring(filtered_counts, save_path, date_str, time_str, cctv_id)

        except Exception as e:
            print(f"❌ 감지 루프 오류: {e}")
            time.sleep(delay)


def start_detection_threads():
    """
    
    """
    targets = TARGET_CCTV
    for url, cctv_id in targets:
        threading.Thread(target=detect_loop, args=(url, cctv_id, DELAY, "None"), daemon=True).start()


def get_cached_frame(cctv_id):
    with frame_lock:
        return latest_annotated_frame.get(cctv_id)
