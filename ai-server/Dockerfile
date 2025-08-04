# Dockerfile (app용)

# 1. 베이스 이미지로 PyTorch CPU 기반 경량 이미지 사용
FROM sychol/careeyes-aiserver-base:latest

# 2. 작업 디렉토리 생성
WORKDIR /app

# 3. 코드 복사
COPY . .

# 4. LFS 파일 복원
RUN git lfs pull || echo "⚠️ Git LFS 스킵"

# 5. 앱 전용 패키지 설치
RUN pip install -r requirements.txt

# 6. Flask 포트 오픈
EXPOSE 5000

# 7. 실행 명령
CMD ["python", "app.py"]