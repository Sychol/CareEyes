# app.py
from flask import Flask, Response
import cv2
import torch
from ultralytics import YOLO
import subprocess
import shutil
import time

app = Flask(__name__)

# 모델 로드 함수
def load_model():
    model = YOLO("model/YOLOv11_base/yolo11l.pt")
    model.to("cuda" if torch.cuda.is_available() else "cpu")
    # model.names = {
    #     0: "airplane", 1: "bird", 2: "mammal", 3: "person", 4: "vehicle"
    # }
    return model

# 유튜브 URL 스트림 열기 함수
def get_stream_url(youtube_url):
    streamlink_path = shutil.which("streamlink")
    if streamlink_path is None:
        raise RuntimeError("❌ streamlink 명령어를 찾을 수 없습니다. PATH를 확인하세요.")
    command = [streamlink_path, "--stream-url", youtube_url, "720p"]
    result = subprocess.run(command, capture_output=True, text=True)
    return result.stdout.strip()

# 비디오 캡처 열기 함수
def open_video_capture(url):
    cap = cv2.VideoCapture(url)
    cap.set(cv2.CAP_PROP_BUFFERSIZE, 1) # 버퍼 설정(프레임 누적 방지)
    if not cap.isOpened():
        raise RuntimeError("❌ 비디오 캡처를 열 수 없습니다. URL을 확인하세요.")
    return cap

# 모델 및 비디오 초기화
model = load_model()
youtube_url = "https://www.youtube.com/watch?v=91PfFoqvuUk"
ffmpeg_url = get_stream_url(youtube_url)
cap = open_video_capture(ffmpeg_url)

# 프레임 생성기
def generate_frames():
    while True:
        fps = 30 # youtube_url의 FPS
        delay = 0.2 # 프레임 간 딜레이 (초 단위)

        for _ in range(int(fps*delay)):  # 프레임을 건너뛰어 버퍼링 방지
            cap.grab()
        success, frame = cap.retrieve() # 프레임 가져오기

        if not success:
            continue

        # frame = cv2.resize(frame, (960, 540)) # 프레임 크기 조정 (선택 사항)
        results = model(frame)[0]
        filtered = results.boxes[results.boxes.conf >= 0.5]
        results.boxes = filtered
        annotated = results.plot()

        _, buffer = cv2.imencode('.jpg', annotated)
        frame_bytes = buffer.tobytes()

        yield (b'--frame\r\n'
               b'Content-Type: image/jpeg\r\n\r\n' + frame_bytes + b'\r\n')
        
        time.sleep(delay) # 프레임 간 딜레이 (선택 사항)

@app.route('/video_feed')
def video_feed():
    return Response(generate_frames(),
                    mimetype='multipart/x-mixed-replace; boundary=frame')

@app.route('/')
def index():
    return '''
        <html>
            <body>
                <h1>YOLOv11 실시간 감지 스트리밍</h1>
                <img src="/video_feed" width="1280" />
            </body>
        </html>
    '''

if __name__ == '__main__':
    app.run(debug=True, port=5000)
