# api/endpoints.py
from flask import Response, request, send_file, abort, jsonify
from detect.detect_loop import get_cached_frame
from config import IMAGE_SAVE_DIR, DELAY
import cv2
import os
import time
from common.config_state import config_state

def register_routes(app):
    @app.route('/ai/video_feed')
    def video_feed():
        # URL 파라미터에서 CCTV ID 가져오기
        cctv_id = request.args.get("cctv_id")

        if not cctv_id:
            return "❌ CCTV ID가 필요합니다.", 400
        try:
            cctv_id = int(cctv_id) # int로 변환
        except ValueError:
            return "❌ CCTV ID는 숫자여야 합니다.", 400

        # 루프에서 탐지한 이미지 가져오기
        def generate():
            while True:
                try:
                    frame = get_cached_frame(cctv_id)
                    if frame is None:
                        # 디버깅용 출력
                        #print(f"⏳ {cctv_id}의 YOLO 감지 이미지 없음")
                        continue

                    _, buffer = cv2.imencode(".jpg", frame)

                    yield (b"--frame\r\n"
                        b"Content-Type: image/jpeg\r\n\r\n" + buffer.tobytes() + b"\r\n")
                    
                    time.sleep(DELAY) # 불필요한 요청주기 제어
                    
                except Exception as e:
                    print(f"⚠️ 스트리밍 오류: {e}")
                    time.sleep(DELAY)

        return Response(generate(), # 비디오 스트림 생성기 호출
                        mimetype="multipart/x-mixed-replace; boundary=frame") # 멀티파트 스트림 반환

    @app.route("/ai/get_image")
    def get_image():
        db_path = request.args.get("path")
        if not db_path:
            return abort(400, "path 파라미터가 필요합니다.")

        safe_path = os.path.join(IMAGE_SAVE_DIR, db_path)
        if not safe_path.startswith(IMAGE_SAVE_DIR):
            return abort(403, "허용되지 않은 경로입니다.")

        if not os.path.isfile(safe_path):
            return abort(404, "이미지를 찾을 수 없습니다.")

        return send_file(safe_path, mimetype="image/jpeg")

    @app.route("/ai/test")
    def index():
        return '''
        <html>
            <body>
                <h1>YOLOv11 실시간 감지 스트리밍</h1>
                <img src="/ai/video_feed?cctv_id=101" width="1000" />
                <img src="/ai/video_feed?cctv_id=102" width="1000" />
                <img src="/ai/video_feed?cctv_id=201" width="1000" />
                <img src="/ai/video_feed?cctv_id=202" width="1000" />
            </body>
        </html>
        '''

    @app.route("/ai/config", methods=["GET", "POST"])
    def config():
        if request.method == "GET":
            print(f"""설정값 전송 >>
                  suppression_seconds: {config_state.suppression_seconds},
                  delay: {config_state.delay},
                  conf_threshold: {config_state.conf_threshold},
                  save_route: {config_state.save_route},
                  save_classes: {list(config_state.save_classes)}
            """)
            return jsonify({
                "suppression_seconds": config_state.suppression_seconds,
                "delay": config_state.delay,
                "conf_threshold": config_state.conf_threshold,
                "save_route": config_state.save_route,
                "save_classes": list(config_state.save_classes),
            })

        elif request.method == "POST":
            data = request.get_json()

            print(f"""설정값 송신 >>
                  suppression_seconds: {float(data["suppression_seconds"])},
                  delay: {float(data["delay"])},
                  conf_threshold: {float(data["conf_threshold"])},
                  save_route: {data["save_route"]},
                  save_classes: {data["save_classes"]}
            """)

            if "suppression_seconds" in data:
                config_state.suppression_seconds = float(data["suppression_seconds"])
            if "delay" in data:
                config_state.delay = float(data["delay"])
            if "conf_threshold" in data:
                config_state.conf_threshold = float(data["conf_threshold"])
            if "save_route" in data:
                if data["save_route"] in {"None", "ncloud", "local"}:
                    config_state.save_route = data["save_route"]
            if "save_classes" in data and isinstance(data["save_classes"], list):
                valid_classes = {"person", "vehicle", "bird", "mammal"}
                config_state.save_classes = set(filter(lambda x: x in valid_classes, data["save_classes"]))

            return jsonify({"status": "✅ 설정이 업데이트되었습니다."})

