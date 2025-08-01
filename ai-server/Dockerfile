# 1. PyTorch + CUDA 기반 이미지
FROM pytorch/pytorch:2.2.0-cuda11.8-cudnn8-runtime

# 2. 작업 디렉토리 생성
WORKDIR /app

# 3 한국 미러로 변경 (속도 향상) 및 시스템 패키지 설치 (git-lfs 포함)
RUN sed -i 's|http://archive.ubuntu.com|http://mirror.kakao.com|g' /etc/apt/sources.list && \
    apt-get update && \
    apt-get install -y \
        ffmpeg \
        python3-opencv \
        streamlink \
        git \
        curl \
        git-lfs \
    && apt-get clean && \
    rm -rf /var/lib/apt/lists/*

# 4. Git LFS 초기화 (중요!)
RUN git lfs install

# 5. 코드 복사
COPY . .  
COPY .env .env

# 6. Git LFS 파일 다운로드 (해당 디렉토리가 Git 저장소일 경우만 필요)
# 보통 .pt 같은 파일이 LFS로 추적된 경우
RUN git lfs pull || echo "⚠️ LFS 파일 없거나 Git clone 환경이 아님"

# 7. Python 패키지 설치
RUN pip install --upgrade pip && \
    pip install -r requirements.txt

# 8. Flask 포트 오픈
EXPOSE 5000

# 9. 실행 명령
CMD ["python", "app.py"]