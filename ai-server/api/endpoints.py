# api/endpoints.py
from flask import Response, request, send_file, abort
from detect.detect_loop import get_cached_frame
from config import IMAGE_SAVE_DIR
import cv2
import os


def register_routes(app):
    @app.route('/ai/video_feed')
    def video_feed():
        cctv_id = request.args.get("cctv_id")
        if not cctv_id:
            return "❌ CCTV ID가 필요합니다.", 400

        try:
            cctv_id = int(cctv_id)
        except ValueError:
            return "❌ CCTV ID는 숫자여야 합니다.", 400

        def generate():
            while True:
                frame = get_cached_frame(cctv_id)
                if frame is None:
                    continue
                _, buffer = cv2.imencode(".jpg", frame)
                yield (b"--frame\r\n"
                       b"Content-Type: image/jpeg\r\n\r\n" + buffer.tobytes() + b"\r\n")

        return Response(generate(), mimetype="multipart/x-mixed-replace; boundary=frame")

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
