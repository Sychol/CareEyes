# stream/frame_utils.py
import time
import cv2
from config import FPS


def get_latest_frame(cap, delay):
    """
    VideoCapture 객체에서 delay 시간만큼 프레임을 스킵한 후 마지막 프레임을 가져옵니다.
    return: (success, frame)
    """
    start = time.time()
    while time.time() - start < delay:
        cap.grab()
        time.sleep(0.1)

    for _ in range(min(int(FPS * delay), 60)):
        cap.grab()

    return cap.retrieve()
