from flask import Flask, Response, request, jsonify
import cv2, torch, subprocess, shutil, time, requests, os, atexit, threading, boto3, io
from ultralytics import YOLO
from collections import Counter
from datetime import datetime
from botocore.client import Config
from dotenv import load_dotenv


app = Flask(__name__)

load_dotenv()  # .env 파일에서 환경 변수 로드

# 💡 설정
# 객체 감지 후 전송 지연 시간 (초 단위)
SUPPRESSION_SECONDS = 300  # 5분

# 저장할 클래스
SAVE_CLASSES = {
    #"airplane", 
    "person", 
    "vehicle", 
    "bird", 
    "mammal"
    } # 저장할 클래스
FPS = 30 # youtube_url의 FPS
DELAY = 1 # 프레임 간 딜레이 (초 단위)
CONF_THRESHOLD = 0.3 # 신뢰도 임계값
SPRING_PROXY = "http://10.0.20.6:8090/api/ai" # Spring 서버 프록시 URL

# Naver Cloud Object Storage 설정
BUCKET_NAME = "careeyes-bucket"
ENDPOINT = "https://kr.object.ncloudstorage.com"
NCLOUD_ACCESS_KEY = os.getenv("NCLOUD_ACCESS_KEY")
NCLOUD_SECRET_KEY = os.getenv("NCLOUD_SECRET_KEY")

# 마지막 전송 시간 기록: { (cctv_id, class_name): timestamp }
last_sent_time = {}
send_lock = threading.Lock()

# 동적 스트림 URL 관리: { youtube_url: VideoCapture 객체 }
stream_caps = {}
cap_lock = threading.Lock()

# 최신 YOLO 주석 프레임 캐시: { cctv_id: np.ndarray(프레임) }
latest_annotated_frame = {}
frame_lock = threading.Lock()


# 💡 YOLO 모델 로드
model = YOLO("./model/CEv11l_n4k_sz1280_e50_run/weights/best.pt")
model.to("cuda" if torch.cuda.is_available() else "cpu")

# 💡 전송 여부 판단(마지막 전송 시간 기준)
def should_send(class_name, cctv_id):
    """
    주어진 CCTV ID와 클래스 이름에 대해 마지막 전송 시간을 확인하고,
    지정된 시간(SUPPRESSION_SECONDS) 이후에만 True를 반환
    return : 전송 여부 (True/False)
    """
    key = (cctv_id, class_name)
    now = time.time()

    with send_lock: # 스레드 보호
        last_time = last_sent_time.get(key)
        if last_time is None or now - last_time >= SUPPRESSION_SECONDS:
            last_sent_time[key] = now
            return True
    return False

# 💡 동적 스트림 URL 관리
def get_or_open_capture(youtube_url):
    """
    YouTube URL에 대한 VideoCapture 객체를 가져오거나 새로 열기
    return : VideoCapture 객체
    """

    # 이미 열려있는 캡처 객체가 있으면 재사용
    if youtube_url in stream_caps:
        cap = stream_caps[youtube_url]
        if cap.isOpened():
            return cap  # 이미 열려있으면 기존 객체 반환
        else:
            cap.release() # 캡처 객체가 닫혀있으면 해제
            del stream_caps[youtube_url]  # 해제한 후 딕셔너리에서 제거
            print(f"🔁 {youtube_url} 스트림 재연결")

    # 새 캡처 객체 열기
    print(f"🔄 {youtube_url} 연결 시도")
    stream_url = get_stream_url(youtube_url) # YouTube URL을 ffmpeg 스트림 URL로 변환
    stream_caps[youtube_url] = open_video_capture(stream_url) # VideoCapture 객체 열기
    
    return stream_caps[youtube_url]

# 💡 YouTube → ffmpeg 스트림 URL 변환
def get_stream_url(youtube_url):
    """
    YouTube URL을 streamlink를 사용하여 ffmpeg 스트림 URL로 변환
    """
    # streamlink 경로 확인
    streamlink_path = shutil.which("streamlink")
    if streamlink_path is None:
        raise RuntimeError("❌ streamlink 명령어를 찾을 수 없습니다. 'pip install streamlink' 또는 시스템에 설치 필요!")
    
    # streamlink 명령어 실행
    command = [streamlink_path, 
               "--player-passthrough", "hls",
               "--hls-live-edge", "2",
               "--stream-url", youtube_url, 
               "720p" # 해상도 설정
               ]
    result = subprocess.run(command, capture_output=True, text=True)
    stream_url = result.stdout.strip()
    if not stream_url:
        raise RuntimeError("❌ streamlink 결과가 비어 있어요! URL 또는 인터넷 상태 확인해주세요.")
    return stream_url

# 💡 VideoCapture 열기
def open_video_capture(url):
    """
    주어진 URL로 VideoCapture 객체를 열기
    return : VideoCapture 객체
    """
    cap = cv2.VideoCapture(url, cv2.CAP_FFMPEG) # FFMPEG 사용
    cap.set(cv2.CAP_PROP_BUFFERSIZE, 1) # 버퍼 크기 설정
    if not cap.isOpened():
        raise RuntimeError("❌ 영상 열기 실패")
    return cap

# 💡 YOLO 모델 추론 및 필터링
def model_filter(frame):
    """
    YOLO 모델을 사용하여 프레임에서 객체를 감지하고 필터링
    return : YOLO 결과 객체, 감지된 객체 수, 저장 여부 (bool)
    """
    # 모델 추론
    results = model(frame)[0]
    
    # 박스가 없을 경우 빈 결과 반환
    if results.boxes is None or len(results.boxes) == 0:
        print("📦 감지된 박스 없음")
        return results, {}, False
    
    # 신뢰도 필터링
    conf_mask = results.boxes.conf >= CONF_THRESHOLD
    results.boxes = results.boxes[conf_mask]  # 필터링된 박스만 유지
    print(f"📦 신뢰도 {CONF_THRESHOLD} 통과 박스 수: {len(results.boxes)}")  # 박스 갯수 확인

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

    # 저장 여부 결정
    # SAVE_CLASSES에 있는 클래스가 하나라도 감지되면 저장
    should_save = any(count.get(cls, 0) >= 1 for cls in SAVE_CLASSES)

    return results, count, should_save

# 💡 유튜브 스트림에서 프레임 처리
def process_youtube_frame(youtube_url, save_result=False, cctv_id='unknown', delay=DELAY, save_type="ncloud"):
    """
    유튜브 스트림에서 프레임을 가져와 YOLO 감지 후,
    객체 수 및 주석 이미지 반환 (선택적 저장).
    return : annotated_img, object_counts, save_path, date_str, time_str, cctv_id
    """
    # 캡처 객체 가져오기 또는 열기
    if youtube_url and cctv_id:
        #print(f"🔄 {cctv_id} 스트림 캡처 열기: {youtube_url}")
        with cap_lock:
            cap = get_or_open_capture(youtube_url)
    else:
        raise ValueError("❌ 유효한 YouTube URL과 CCTV ID가 필요합니다.")

    # 프레임 간 딜레이 적용 및 마지막 프레임 가져오기
    success, frame = get_latest_frame(cap, delay=delay) # 마지막 프레임 가져오기

    if not success:
        raise RuntimeError(f"❌ 프레임 가져오기 실패 (cctv_id={cctv_id})")

    # 모델 추론 및 필터링
    results, object_counts, should_save = model_filter(frame)
    annotated_img = results.plot() # 결과 이미지에 박스 그리기

    # 현재 시간 및 날짜 문자열 생성
    now = datetime.now()
    date_str = now.strftime("%Y-%m-%d")
    time_str = now.strftime("%H-%M-%S")
    save_path = None
    
    # 저장 조건 확인 및 이미지 저장
    if save_result and should_save:
        save_path = save_detection_image(annotated_img, object_counts, cctv_id, date_str, time_str, save_type)

    return annotated_img, object_counts, save_path, date_str, time_str, cctv_id

def get_latest_frame(cap, delay=DELAY):
    """
    마지막 프레임을 가져오는 함수
    delay 초 동안 프레임을 스킵
    return : success (bool), frame (numpy.ndarray)
    """

    start = time.time() # 시작 시간 기록
    # delay 초 동안 프레임 스킵
    while time.time() - start < delay: 
        cap.grab()
        time.sleep(0.1)
    for _ in range(60 if int(FPS*delay) > 60 else int(FPS*delay)): # 최대 60 프레임 스킵
        cap.grab()

    # 마지막 프레임 가져오기
    success, frame = cap.retrieve()
    return success, frame

def save_detection_image(annotated_img, object_counts, cctv_id, date_str, time_str, save_type):
    """
    save_type에 따라 이미지와 감지 객체를 저장 또는 업로드하는 함수
    return : 이미지 저장 경로 or 업로드된 URL
    """
    # Ncloud에 업로드
    if save_type == "ncloud":
        success, buffer = cv2.imencode('.jpg', annotated_img)
        if not success:
            raise RuntimeError("❌ 이미지 인코딩 실패")
        image_stream = io.BytesIO(buffer)

        save_path = upload_to_ncloud(image_stream, f"{cctv_id}/{date_str}/{time_str}.jpg")

    # 로컬에 저장
    elif save_type == "local":
        # 저장 디렉토리 생성
        save_dir = f"./detect_images/{cctv_id}/{date_str}"
        if not os.path.exists(save_dir):
            os.makedirs(save_dir, exist_ok=True)

        # 저장 경로 설정
        save_path = f"{save_dir}/{time_str}.jpg"
        cv2.imwrite(save_path, annotated_img)
        print(f"🔍 탐지 완료! {object_counts} → 저장: {save_path}")

    # 저장하지 않음
    else:
        print(f"⚠️ 알 수 없는 저장 방식: {save_type} → 저장 생략")
        save_path = None

    return save_path

# 💡 Ncloud에 이미지 업로드
def upload_to_ncloud(image_stream, object_key):
    """
    Ncloud Object Storage에 이미지를 업로드하는 함수
    return : 업로드된 파일의 URL
    """
    try:
        print(f"🔄 Ncloud 오브젝트 키: {object_key}")
        print(f"🔄 Ncloud 엔드포인트: {ENDPOINT}")
        print(f"🔄 Ncloud 버킷: {BUCKET_NAME}")
        print(f"🔄 Ncloud 액세스 키: {NCLOUD_ACCESS_KEY}")
        print(f"🔄 Ncloud 비밀 키: {NCLOUD_SECRET_KEY}")
        s3 = boto3.client(
            service_name='s3',
            endpoint_url=ENDPOINT,
            aws_access_key_id=NCLOUD_ACCESS_KEY,
            aws_secret_access_key=NCLOUD_SECRET_KEY,
            # config=Config(signature_version='s3v4'),
            # region_name='kr-standard'
        )
        print("🔄 Ncloud S3 클라이언트 생성 완료")

        # 이미지 스트림을 S3에 업로드
        image_stream.seek(0)  # 🔄 커서 초기화
        s3.upload_fileobj(
            Fileobj=image_stream,
            Bucket=BUCKET_NAME,
            Key=object_key,
            ExtraArgs={'ACL': 'public-read'}  # 외부에서 접근 가능하도록 설정
        )

        file_url = f"{ENDPOINT}/{BUCKET_NAME}/{object_key}"
        print(f"🔄 업로드 완료! 파일 URL: {file_url}")
        return file_url
    
    except Exception as e:
        print(f"❌ Ncloud 업로드 실패: {e}")
        return None

# 💡 Spring 서버로 전송
def send_to_spring(object_counts, save_path, date_str, time_str, cctv_id='unknown'):
    """
    감지된 객체 유형과 수, 일시, cctv_id, 이미지 경로를 Spring 서버로 전송하는 함수
    return : 상태 코드, 응답 메시지
    """
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
        print(f"❌ Spring 전송 실패: {e}")
        return 500, str(e)

# 💡 비디오 피드 엔드포인트
@app.route('/video_feed')
def video_feed():
    youtube_url = request.args.get('url') # URL 파라미터에서 YouTube URL 가져오기(예: /video_feed?url=https://...)
    cctv_id = request.args.get('cctv_id')  # URL 파라미터에서 CCTV ID 가져오기

    if not cctv_id:
        return "❌ CCTV ID가 필요합니다. 예: /video_feed?url=https://...&cctv_id=east1", 400
    try:
        cctv_id = int(cctv_id)  # ✅ int로 변환
    except ValueError:
        return "❌ CCTV ID는 숫자여야 합니다.", 400
    if not youtube_url:
        return "❌ 스트림 URL이 필요합니다. 예: /video_feed?url=https://...", 400
    
    # 루프에서 탐지한 이미지 가져오기 또는 열기
    def generate():
        while True:
            try:
                with frame_lock: # 스레드 보호
                    frame = latest_annotated_frame.get(cctv_id)
                if frame is None:
                    print(f"⏳ {cctv_id}의 YOLO 감지 이미지 없음")
                    time.sleep(1)
                    continue

                _, buffer = cv2.imencode('.jpg', frame)
                frame_bytes = buffer.tobytes()

                yield (b'--frame\r\n'
                       b'Content-Type: image/jpeg\r\n\r\n' + frame_bytes + b'\r\n')
            except Exception as e:
                print(f"⚠️ 스트리밍 오류: {e}")
                time.sleep(1)

    return Response(generate(), # 비디오 스트림 생성기 호출
                    mimetype='multipart/x-mixed-replace; boundary=frame') # 멀티파트 스트림 반환

# 💡 홈 페이지
@app.route('/')
def index():
    return '''
        <html>
            <body>
                <h1>YOLOv11 실시간 감지 스트리밍</h1>
                <img src="/video_feed?url=https://www.youtube.com/watch?v=91PfFoqvuUk&cctv_id=101" width="1000" />
                <img src="/video_feed?url=https://www.youtube.com/watch?v=MjD3gnNFYUo&cctv_id=201" width="1000" />
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

def detect_loop(url, cctv_id='unknown', delay=DELAY, save_type="ncloud"):
    """ 
    감지 루프: 주어진 URL에서 프레임을 가져와 YOLO 모델로 객체 감지 후,
    Spring 서버로 전송하는 무한 루프
    """
    while True:
        try:
            #print(f"\n\n🔄 {cctv_id} 감지 루프 시작: delay={delay}, save_type={save_type}, url={url}")

            # 프레임 처리 및 감지
            annotated_img, object_counts, save_path, date_str, time_str, cctv_id = process_youtube_frame(url, save_result=True, cctv_id=cctv_id, delay=delay, save_type=save_type)

            # YOLO 감지 완료 후 주석 이미지 저장
            with frame_lock: # 스레드 보호
                latest_annotated_frame[cctv_id] = annotated_img.copy()

            # 유효 객체 필터링
            filtered_counts = {}
            if not object_counts:
                #print(f"❌ {cctv_id}에서 감지된 객체 없음")
                continue
            else:
                #print(f"✅ {cctv_id}에서 감지된 객체: {object_counts}")
                for cls, count in object_counts.items():
                    if should_send(cls, cctv_id):
                        filtered_counts[cls] = count
                    else:
                        print(f"⏱️ {cctv_id}의 '{cls}'는 {SUPPRESSION_SECONDS}초 이내에 전송됨 → 생략")

            # 유효 객체가 있다면 전송
            if filtered_counts and save_path:
                status, msg = send_to_spring(filtered_counts, save_path, date_str, time_str, cctv_id)
                print(f"📡 Spring 응답: {status}, {msg}")
            elif filtered_counts and not save_path:
                print(f"⚠️ 객체는 탐지됐지만 이미지 저장은 생략됨 → 전송 안 함")

        except Exception as e:
            print(f"❌ 감지 루프 오류: {e}")
            time.sleep(delay)

# 💡 서버 실행
if __name__ == '__main__':
    # 자동 감지 루프 시작
    threading.Thread(target=detect_loop, args=('https://www.youtube.com/watch?v=91PfFoqvuUk', 101, DELAY, 'ncloud'), daemon=True).start()
    threading.Thread(target=detect_loop, args=('https://www.youtube.com/watch?v=MjD3gnNFYUo', 201, DELAY, 'ncloud'), daemon=True).start()

    # Flask 서버 실행
    app.run(port=5000)
