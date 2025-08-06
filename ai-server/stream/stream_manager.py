# stream/stream_manager.py
import cv2
import subprocess
import shutil

# VideoCapture 객체를 재사용하기 위한 캐시
stream_caps = {}

def get_or_open_capture(youtube_url):
    """
    YouTube URL에 대한 VideoCapture 객체를 가져오거나 새로 열기
    """
    if youtube_url in stream_caps:
        cap = stream_caps[youtube_url]
        if cap.isOpened():
            return cap
        else:
            cap.release()
            del stream_caps[youtube_url]
            print(f"🔁 {youtube_url} 스트림 재연결")

    stream_url = get_stream_url(youtube_url)
    stream_caps[youtube_url] = open_video_capture(stream_url)
    return stream_caps[youtube_url]


def get_stream_url(youtube_url):
    """
    YouTube URL을 streamlink를 사용하여 HLS 스트림 URL로 변환
    """
    streamlink_path = shutil.which("streamlink")
    if streamlink_path is None:
        raise RuntimeError("❌ 'streamlink' 명령어를 찾을 수 없습니다. 설치가 필요합니다.")

    command = [
        streamlink_path,
        "--player-passthrough", "hls",
        "--hls-live-edge", "2",
        "--stream-url", youtube_url,
        "720p"
    ]
    result = subprocess.run(command, capture_output=True, text=True)
    stream_url = result.stdout.strip()

    if not stream_url:
        raise RuntimeError("❌ streamlink 결과가 비어 있습니다. URL이나 네트워크 상태를 확인하세요.")
    return stream_url


def open_video_capture(url):
    """
    HLS URL로 VideoCapture 객체 열기 (FFMPEG 사용)
    """
    cap = cv2.VideoCapture(url, cv2.CAP_FFMPEG)
    cap.set(cv2.CAP_PROP_BUFFERSIZE, 1)
    if not cap.isOpened():
        raise RuntimeError("❌ 영상 열기 실패")
    return cap
