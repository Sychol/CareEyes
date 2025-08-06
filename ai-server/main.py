from flask import Flask
from api.endpoints import register_routes
from detect.detect_loop import start_detection_threads
from config import FLASK_HOST, FLASK_PORT

app = Flask(__name__)
register_routes(app)

if __name__ == '__main__':
    # 감지 루프 스레드 시작 (유튜브 스트림별로 병렬 처리)
    start_detection_threads()

    # Flask 서버 실행
    app.run(host=FLASK_HOST, port=FLASK_PORT)
