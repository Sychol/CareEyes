# yolo/model_loader.py
import torch
from ultralytics import YOLO
from config import CONF_THRESHOLD, SAVE_CLASSES, YOLO_MODEL_PATH
from collections import Counter
import logging

# 디바이스 설정 및 로깅
DEVICE = "cuda" if torch.cuda.is_available() else "cpu"
#logging.info(f"YOLO 모델 로드: {YOLO_MODEL_PATH}, 디바이스: {DEVICE}")
print("🧠 CUDA 사용 가능:", torch.cuda.is_available())
print("🔋 사용 중인 디바이스:", torch.cuda.get_device_name(0) if torch.cuda.is_available() else "CPU")

model = YOLO(YOLO_MODEL_PATH)
model.to(DEVICE)

def model_filter(frame):
    """
    YOLO 모델을 사용하여 프레임에서 객체를 감지하고 필터링
    return: YOLO 결과 객체(results), 감지된 객체 수(dict), 저장 여부 (bool)
    """
    # 모델 추론
    results = model(frame)[0]

    # 박스가 없을 경우
    if results.boxes is None or len(results.boxes) == 0:
        #print("📦 감지된 박스 없음")
        return results, {}, False

    # 신뢰도 필터링
    conf_mask = results.boxes.conf >= CONF_THRESHOLD
    results.boxes = results.boxes[conf_mask] # 필터링된 박스만 유지
    #print(f"📦 신뢰도 {CONF_THRESHOLD} 통과 박스 수: {len(results.boxes)}")  # 박스 갯수 확인

    # 클래스 카운팅
    filtered_classes = [results.names[int(cls)]
                        for cls in results.boxes.cls
                        if results.names[int(cls)] in SAVE_CLASSES]
    # 디버깅용: 감지객체 및 신뢰도 출력
    for i in range(len(results.boxes.cls)):
        cls = int(results.boxes.cls[i])
        conf = float(results.boxes.conf[i])
        class_name = results.names[int(cls)]
        print(f"→ 감지: {class_name} (신뢰도: {conf:.2f})")

    count = dict(Counter(filtered_classes))
    print(f"✅ 유효 객체 수: {count}")

    # 저장 여부 결정
    # SAVE_CLASSES에 있는 클래스가 하나라도 감지되면 저장
    should_save = any(count.get(cls, 0) >= 1 for cls in SAVE_CLASSES)

    return results, count, should_save
