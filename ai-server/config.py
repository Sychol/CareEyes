# config.py
"""
환경설정 변수 저장
"""
import os

# YOLO 모델 경로 설정
YOLO_MODEL_PATH = "./model/best.pt"

# Flask 설정
FLASK_HOST = "0.0.0.0"
FLASK_PORT = 5000

# YOLO 감지 설정
SUPPRESSION_SECONDS = 600
FPS = 30
DELAY = 0.5
CONF_THRESHOLD = 0.3

# 저장 설정
IMAGE_SAVE_DIR = "/app/images"
SAVE_CLASSES = {"person", "vehicle", "bird", "mammal"}

# Spring 서버 프록시
SPRING_PROXY = "http://10.0.20.6:8090/api"

# Ncloud Object Storage
BUCKET_NAME = "careeyes-bucket-my"
ENDPOINT = "https://kr.object.ncloudstorage.com"
NCLOUD_ACCESS_KEY = os.environ.get("NCLOUD_ACCESS_KEY")
NCLOUD_SECRET_KEY = os.environ.get("NCLOUD_SECRET_KEY")

TARGET_CCTV = [
        ("https://www.youtube.com/watch?v=91PfFoqvuUk", 101),
        ("https://www.youtube.com/watch?v=yrx0fvj-4QI", 102),
        ("https://www.youtube.com/watch?v=0jUGiYZKAMg", 201),
        ("https://www.youtube.com/watch?v=A6R81wOlQqs", 202),
    ]