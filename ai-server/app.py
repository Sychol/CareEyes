# flask_yolo_stream.py
from flask import Flask, Response
import cv2
import torch
from ultralytics import YOLO
import subprocess
import shutil
import time

app = Flask(__name__)

# 모델 로드
model = YOLO("model/YOLOv11_base/yolo11l.pt")
model.to("cuda" if torch.cuda.is_available() else "cpu")

# 유튜브 URL 스트림 열기
def get_stream_url(youtube_url):
    
    streamlink_path = shutil.which("streamlink")
    if streamlink_path is None:
        raise RuntimeError("❌ streamlink 명령어를 찾을 수 없습니다. PATH를 확인하세요.")

    command = [streamlink_path, "--stream-url", youtube_url, "best"]
    result = subprocess.run(command, capture_output=True, text=True)
    return result.stdout.strip()

youtube_url = "https://www.youtube.com/watch?v=91PfFoqvuUk"
ffmpeg_url = get_stream_url(youtube_url)

# OpenCV로 비디오 캡처 열기
cap = cv2.VideoCapture(ffmpeg_url)
# obs 가상 카메라 가져오기
#cap = cv2.VideoCapture(0)  # 보통 0번이 OBS 가상캠 (윈도우 기준)

# 비디오 캡처가 열렸는지 확인
if not cap.isOpened():
    raise RuntimeError("❌ 비디오 캡처를 열 수 없습니다. URL을 확인하세요.")

# 프레임 생성기
def generate_frames():
    while True:
        
        # 프레임 읽기
        success, frame = cap.read()
        if not success:
            raise RuntimeError("❌ 프레임을 읽을 수 없습니다. 비디오 스트림이 종료되었거나 문제가 발생했습니다.")

        results = model(frame)[0]
        
        # ✨ confidence 필터링
        filtered = results.boxes[results.boxes.conf >= 0.6]

        # ✨ 필터된 박스로 시각화
        results.boxes = filtered
        annotated = results.plot()

        # 프레임 인코딩
        _, buffer = cv2.imencode('.jpg', annotated)
        frame_bytes = buffer.tobytes()

        # yield MJPEG 형식으로 응답
        yield (b'--frame\r\n'
               b'Content-Type: image/jpeg\r\n\r\n' + frame_bytes + b'\r\n')
        
        # ✨ 오래된 프레임 버리기 (최신 프레임까지 read 반복)
        for _ in range(60):  # 반복하여 버퍼 소모
            cap.grab()  # decode 없이 next frame 건너뜀

        time.sleep(0.5)


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
                <img src="/video_feed" width="800" />
            </body>
        </html>
    '''

if __name__ == '__main__':
    app.run(debug=True, port=5000)
