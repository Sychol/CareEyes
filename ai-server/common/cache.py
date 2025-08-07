# common/cache.py
import threading

class GlobalCache:
    def __init__(self):
        self.last_sent_time = {}            # {(cctv_id, class_name): timestamp}
        self.stream_caps = {}               # {url: cv2.VideoCapture 객체}
        self.latest_annotated_frame = {}    # {cctv_id: np.ndarray}

        # 각각에 대한 락
        self.send_lock = threading.Lock()
        self.cap_lock = threading.Lock()
        self.frame_lock = threading.Lock()


# 전역 인스턴스
cache = GlobalCache()
