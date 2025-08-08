# stream/stream_manager.py
import cv2
import subprocess
import shutil
from common.cache import cache

def get_or_open_capture(youtube_url):
    """
    YouTube URL에 대한 VideoCapture 객체를 가져오거나 새로 열기
    return : VideoCapture 객체
    """
    # 이미 열려있는 캡처 객체가 있으면 재사용
    if youtube_url in cache.stream_caps:
        cap = cache.stream_caps[youtube_url]
        if cap.isOpened():
            return cap # 이미 열려있으면 기존 객체 반환
        else:
            cap.release() # 캡처 객체가 닫혀있으면 해제
            del cache.stream_caps[youtube_url] # 해제한 후 딕셔너리에서 제거
            print(f"🔁 {youtube_url} 스트림 재연결")

    # 새 캡처 객체 열기
    print(f"🔄 {youtube_url} 연결 시도")
    stream_url = get_stream_url(youtube_url) # YouTube URL을 ffmpeg 스트림 URL로 변환
    cache.stream_caps[youtube_url] = open_video_capture(stream_url) # VideoCapture 객체 열기

    return cache.stream_caps[youtube_url]


def get_stream_url(youtube_url):
    """
    YouTube URL을 streamlink를 사용하여 HLS 스트림 URL로 변환
    return : HLS 스트림 URL
    """
    # streamlink 경로 확인
    streamlink_path = shutil.which("streamlink")
    if streamlink_path is None:
        raise RuntimeError("❌ 'streamlink' 명령어를 찾을 수 없습니다. 설치가 필요합니다.")

    # streamlink 명령어 실행
    command = [
        streamlink_path,
        "--player-passthrough", "hls",
        "--hls-live-edge", "2",
        "--stream-url", youtube_url,
        "720p" # 해상도 설정
    ]
    result = subprocess.run(command, capture_output=True, text=True)
    stream_url = result.stdout.strip()
    # 디버깅용 출력
    #print(f"🔄 변환된 스트림 URL: {stream_url}") 

    if not stream_url:
        raise RuntimeError("❌ streamlink 결과가 비어 있습니다. URL이나 네트워크 상태를 확인하세요.")
    return stream_url


def open_video_capture(url):
    """
    HLS URL로 VideoCapture 객체 열기 (FFMPEG 사용)
    return : VideoCapture 객체
    """
    cap = cv2.VideoCapture(url, cv2.CAP_FFMPEG)# FFMPEG 사용
    cap.set(cv2.CAP_PROP_BUFFERSIZE, 1) # 버퍼 크기 설정
    
    if not cap.isOpened():
        raise RuntimeError("❌ 영상 열기 실패")
    return cap
