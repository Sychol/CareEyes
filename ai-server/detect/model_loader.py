# yolo/model_loader.py
import torch
from ultralytics import YOLO
from config import CONF_THRESHOLD, SAVE_CLASSES, YOLO_MODEL_PATH
from collections import Counter
import logging

# 디바이스 설정 및 로깅
DEVICE = "cuda" if torch.cuda.is_available() else "cpu"
logging.info(f"YOLO 모델 로드: {YOLO_MODEL_PATH}, 디바이스: {DEVICE}")

model = YOLO(YOLO_MODEL_PATH)
model.to(DEVICE)

def model_filter(frame):
    """
    YOLO 모델을 사용하여 프레임에서 객체를 감지하고 필터링
    return: results, count(dict), should_save(bool)
    """
    results = model(frame)[0]

    if results.boxes is None or len(results.boxes) == 0:
        return results, {}, False

    conf_mask = results.boxes.conf >= CONF_THRESHOLD
    results.boxes = results.boxes[conf_mask]

    filtered_classes = [results.names[int(cls)]
                        for cls in results.boxes.cls
                        if results.names[int(cls)] in SAVE_CLASSES]

    count = dict(Counter(filtered_classes))
    should_save = any(count.get(cls, 0) >= 1 for cls in SAVE_CLASSES)

    return results, count, should_save
