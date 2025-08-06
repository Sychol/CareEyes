# utils/time_utils.py
import time
import threading
from config import SUPPRESSION_SECONDS

# 마지막 전송 시간 저장용
_last_sent_time = {}
_send_lock = threading.Lock()


def should_send_event(class_name, cctv_id):
    """
    같은 객체(class_name)가 같은 CCTV에서 일정 시간 이내에 다시 감지되면 전송하지 않음.
    return: True (전송 가능), False (전송 억제)
    """
    key = (cctv_id, class_name)
    now = time.time()

    with _send_lock:
        last_time = _last_sent_time.get(key)
        if last_time is None or now - last_time >= SUPPRESSION_SECONDS:
            _last_sent_time[key] = now
            return True
    return False
