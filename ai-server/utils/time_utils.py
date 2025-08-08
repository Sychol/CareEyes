# utils/time_utils.py
import time
from config import SUPPRESSION_SECONDS
from common.cache import cache

def should_send_event(class_name, cctv_id):
    """
    같은 객체(class_name)가 같은 CCTV에서 일정 시간 이내에 다시 감지되면 전송하지 않음
    return: True (전송 가능), False (전송 억제)
    """
    key = (cctv_id, class_name)
    now = time.time()

    with cache.send_lock:
        last_time = cache.last_sent_time.get(key)
        if last_time is None or now - last_time >= SUPPRESSION_SECONDS:
            cache.last_sent_time[key] = now
            return True
        print(f"⏱️ {cctv_id}의 '{class_name}'는 {SUPPRESSION_SECONDS}초 이내에 전송됨 → 생략")
    return False
