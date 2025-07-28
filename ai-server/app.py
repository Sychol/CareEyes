from flask import Flask, Response, request, jsonify
import cv2, torch, subprocess, shutil, time, requests
from ultralytics import YOLO
from collections import Counter
import os
import atexit
import threading
from datetime import datetime
import boto3
from botocore.client import Config
import os


app = Flask(__name__)

CONF_THRESHOLD = 0.5 # 신뢰도 임계값
SPRING_PROXY = "http://localhost:8090/ai" # Spring 서버 프록시 URL
FPS = 30 # youtube_url의 FPS
DELAY = 1 # 프레임 간 딜레이 (초 단위)
SAVE_CLASSES = {"airplane","person", "car", "truck", "bus", "bird", "mammal"} # 저장할 클래스
# 설정값
NCLOUD_ACCESS_KEY = '발급받은 Access Key'
NCLOUD_SECRET_KEY = '발급받은 Secret Key'
BUCKET_NAME = 'careeyes-bucket'
ENDPOINT = 'https://kr.object.ncloudstorage.com'

stream_caps = {}  # key: youtube_url, value: VideoCapture 객체

# 💡 YOLO 모델 로드
model = YOLO("./model/YOLOv11_base/yolo11l.pt")
model.to("cuda" if torch.cuda.is_available() else "cpu")

# 💡 동적 스트림 URL 관리
def get_or_open_capture(youtube_url):
    if youtube_url not in stream_caps or not stream_caps[youtube_url].isOpened():
        stream_url = get_stream_url(youtube_url)
        stream_caps[youtube_url] = open_video_capture(stream_url)
    return stream_caps[youtube_url]


# 💡 YouTube → ffmpeg 스트림 URL 변환
def get_stream_url(youtube_url):
    streamlink_path = shutil.which("streamlink") # streamlink 경로 확인
    if streamlink_path is None:
        raise RuntimeError("❌ streamlink 명령어를 찾을 수 없습니다. 'pip install streamlink' 또는 시스템에 설치 필요!")
    command = [streamlink_path, "--player-passthrough", "hls", "--stream-url", youtube_url, "720p"] # 해상도 설정
    result = subprocess.run(command, capture_output=True, text=True)
    stream_url = result.stdout.strip()
    if not stream_url:
        raise RuntimeError("❌ streamlink 결과가 비어 있어요! URL 또는 인터넷 상태 확인해주세요.")
    return stream_url

# 💡 VideoCapture 열기
def open_video_capture(url):
    cap = cv2.VideoCapture(url, cv2.CAP_FFMPEG) # FFMPEG 사용
    cap.set(cv2.CAP_PROP_BUFFERSIZE, 1) # 버퍼 크기 설정
    if not cap.isOpened():
        raise RuntimeError("❌ 영상 열기 실패")
    return cap

# 💡 실시간 스트리밍 프레임 생성기 (동적 URL)
def generate_frames(youtube_url, cctv_id='unknown'):
    while True:
        try:
            annotated_img, _, _ = process_youtube_frame(youtube_url, save_result=False, cctv_id=cctv_id)

            _, buffer = cv2.imencode('.jpg', annotated_img)
            frame_bytes = buffer.tobytes()

            yield (b'--frame\r\n'
                   b'Content-Type: image/jpeg\r\n\r\n' + frame_bytes + b'\r\n')

            time.sleep(DELAY) # 프레임 간 딜레이
        except Exception as e:
            print(f"⚠️ 프레임 생성 에러: {e}")
            time.sleep(DELAY)  # 에러 발생 시 딜레이 후 재시도
            continue

# 💡 YOLO 모델 추론 및 필터링
def model_filter(frame):
    results = model(frame)[0]  # 모델 추론
    
    # 박스가 없을 경우 빈 결과 반환
    if results.boxes is None or len(results.boxes) == 0:
        print("📦 감지된 박스 없음")
        return results, {}, False
    
    print(f"📦 결과 박스 수: {len(results.boxes)}")  # 박스 갯수 확인

    # 신뢰도 필터링
    conf_mask = results.boxes.conf >= CONF_THRESHOLD
    results.boxes = results.boxes[conf_mask]  # 필터링된 박스만 유지

    # 클래스 카운팅
    filtered_classes = []
    for i in range(len(results.boxes.cls)):
        cls = int(results.boxes.cls[i])
        conf = float(results.boxes.conf[i])
        class_name = results.names[int(cls)]
        print(f"→ 감지: {class_name} (신뢰도: {conf:.2f})")
        if class_name in SAVE_CLASSES:
            filtered_classes.append(class_name)

    count = dict(Counter(filtered_classes))
    print(f"✅ 유효 객체 수: {count}")

    should_save = any(count.get(cls, 0) >= 1 for cls in SAVE_CLASSES)  # 저장 조건 확인

    return results, count, should_save

# 💡 유튜브 스트림에서 프레임 처리
def process_youtube_frame(youtube_url, save_result=False, cctv_id='unknown', delay=DELAY):
    """
    유튜브 스트림에서 프레임을 가져와 YOLO 감지 후,
    객체 수 및 주석 이미지 반환 (선택적 저장).
    """
    cap = get_or_open_capture(youtube_url)

    for _ in range(int(FPS*delay)): # 프레임을 건너뛰어 버퍼링 방지
        cap.grab()
    success, frame = cap.retrieve() # 마지막 프레임 가져오기

    time.sleep(delay) # 프레임 간 딜레이 (선택 사항)

    if not success:
        raise RuntimeError(f"❌ 프레임 가져오기 실패 (cctv_id={cctv_id})")

    results, object_counts, should_save = model_filter(frame)  # 모델 추론 및 필터링

    annotated_img = results.plot() # 결과 이미지에 박스 그리기

    # 저장 조건 확인 및 이미지 저장
    date_str = None
    time_str = None
    save_path = None
    if save_result and should_save:
        now = datetime.now()
        date_str = now.strftime("%Y-%m-%d")
        time_str = now.strftime("%H-%M-%S")

        # 저장 디렉토리 생성
        save_dir = f"./detect_images/{cctv_id}/{date_str}"
        if not os.path.exists(save_dir):
            os.makedirs(save_dir, exist_ok=True)

        # 저장 경로 설정
        save_path = f"{save_dir}/{time_str}.jpg"
        cv2.imwrite(save_path, annotated_img)
        print(f"🔍 탐지 완료! {object_counts} → 저장: {save_path}")

    return object_counts, save_path, date_str, time_str, cctv_id

def upload_to_ncloud(local_path, object_key):
    s3 = boto3.client(
        's3',
        aws_access_key_id=NCLOUD_ACCESS_KEY,
        aws_secret_access_key=NCLOUD_SECRET_KEY,
        endpoint_url=ENDPOINT,
        config=Config(signature_version='s3v4'),
        region_name='kr-standard'
    )

    s3.upload_file(
        Filename=local_path,
        Bucket=BUCKET_NAME,
        Key=object_key,
        ExtraArgs={'ACL': 'public-read'}  # 외부에서 접근 가능하도록 설정
    )

    file_url = f"{ENDPOINT}/{BUCKET_NAME}/{object_key}"
    return file_url


# 💡 Spring 서버로 전송
def send_to_spring(object_counts, save_path, date_str, time_str, cctv_id='unknown'):
    time_str = time_str.replace("-", ":")  # 시간 형식 변경 (예: 12-30-45 → 12:30:45)
    payload = {
        "eventDate": date_str,
        "eventTime": time_str,
        "cctvId": cctv_id,
        "imgPath": save_path,
        "objects": object_counts
    }
    headers = {"Content-Type": "application/json"} # JSON 헤더 설정
    url = f"{SPRING_PROXY}/detect"  # Spring 서버 URL
    print(f"📤 Spring 서버로 전송: {payload}") # 전송 내용 출력
    print(f"📤 요청 URL: {url}") # 요청 URL 출력

    # POST 요청으로 Spring 서버에 전송
    try:
        res = requests.post(url, json=payload, headers=headers) # Spring 서버로 POST 요청
        return res.status_code, res.text # 상태 코드와 응답 텍스트 반환
    except Exception as e:
        return 500, str(e)

# 💡 비디오 피드 엔드포인트
@app.route('/video_feed')
def video_feed():
    youtube_url = request.args.get('url') # URL 파라미터에서 YouTube URL 가져오기(예: /video_feed?url=https://...)
    cctv_id = request.args.get('cctv_id')  # URL 파라미터에서 CCTV ID 가져오기
    if not youtube_url:
        return "❌ 스트림 URL이 필요합니다. 예: /video_feed?url=https://...", 400
    return Response(generate_frames(youtube_url, cctv_id), # 비디오 스트림 생성기 호출
                    mimetype='multipart/x-mixed-replace; boundary=frame') # 멀티파트 스트림 반환

# 💡 감지 결과 저장 및 반환 엔드포인트
@app.route('/detect', methods=['POST'])
def detect_from_stream():
    try:
        youtube_url = request.args.get('url') # URL 파라미터에서 YouTube URL 가져오기(예: /video_feed?url=https://...)
        if not youtube_url:
            return "❌ 스트림 URL이 필요합니다. 예: /detect?url=https://...", 400
        annotated_img, object_counts, save_path = process_youtube_frame(youtube_url, save_result=True)

        return jsonify({
            "imagePath": save_path,
            "objects": object_counts
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# 💡 홈 페이지
@app.route('/')
def index():
    return '''
        <html>
            <body>
                <h1>YOLOv11 실시간 감지 스트리밍</h1>
                <img src="/video_feed?url=https://www.youtube.com/watch?v=91PfFoqvuUk&cctv_id=east1" width="1000" />
                <img src="/video_feed?url=https://www.youtube.com/watch?v=MjD3gnNFYUo&cctv_id=west1" width="1000" />
            </body>
        </html>
    '''

# 💡 서버 종료 시 비디오 캡처 해제
@atexit.register
def cleanup_video_captures():
    for url, cap in stream_caps.items():
        if cap.isOpened():
            cap.release()
            print(f"🔌 스트림 해제됨: {url}")

def detect_loop(url, cctv_id='unknown', delay=DELAY):
    while True:
        try:
            object_counts, save_path, date_str, time_str, cctv_id = process_youtube_frame(url, save_result=True, cctv_id=cctv_id, delay=delay)

            # image가 저장되었다면 Spring 서버로 전송
            if save_path and object_counts:
                status, msg = send_to_spring(object_counts, save_path, date_str, time_str, cctv_id)
                print(f"📡 Spring 응답: {status}, {msg}")

        except Exception as e:
            print(f"❌ 감지 루프 오류: {e}")
            time.sleep(delay)

# 💡 서버 실행
if __name__ == '__main__':
    # 자동 감지 루프 시작
    threading.Thread(target=detect_loop, args=('https://www.youtube.com/watch?v=91PfFoqvuUk', 101, 2), daemon=True).start()
    threading.Thread(target=detect_loop, args=('https://www.youtube.com/watch?v=MjD3gnNFYUo', 201, 2), daemon=True).start()

    # Flask 서버 실행
    app.run(debug=True, port=5000)
