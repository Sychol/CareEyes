# api/spring_client.py
import requests
from config import SPRING_PROXY


def send_to_spring(object_counts, save_path, date_str, time_str, cctv_id):
    """
    감지 결과를 Spring 서버로 전송
    /detect : 이벤트 저장
        전송 객체 : {날짜(YY-MM-DD), 시간(hh:mm:ss), cctv_id, 이미지 경로, 탐지객체{클래스 : 수}}
    /sendalert : 알림 전송
        전송 객체 : {cctv_id, 날짜(YY-MM-DD), 시간(hh:mm:ss), 탐지객체{클래스 : 수}}
    """

    # 시간 형식 변경 (예: 12-30-45 → 12:30:45)
    time_str = time_str.replace("-", ":")

    event_payload = {
        "eventDate": date_str,
        "eventTime": time_str,
        "cctvId": cctv_id,
        "imgPath": save_path,
        "objects": object_counts
    }
    msg_payload = {
        "cctvId": cctv_id,
        "eventDate": date_str,
        "eventTime": time_str,
        "objects": object_counts
    }
    headers = {"Content-Type": "application/json"} # JSON 헤더 설정

    try:
        # Spring 서버로 전송할 URL
        event_url = f"{SPRING_PROXY}/detect"
        msg_url = f"{SPRING_PROXY}/sendalert"

        # POST 요청으로 Spring 서버에 전송
        event_res = requests.post(event_url, json=event_payload, headers=headers)
        msg_res = requests.post(msg_url, json=msg_payload, headers=headers)

        # 디버깅 : 전송 내용 출력
        print(f"📤 Spring 서버 /detect로 전송: {event_payload}")
        print(f"📤 Spring 서버 /sendalert로 전송: {msg_payload}")

        # 디버깅 : 상태 코드와 응답 텍스트 출력
        print(f"📡 /detect 응답: {event_res.status_code} - {event_res.text}")
        print(f"📡 /sendalert 응답: {msg_res.status_code} - {msg_res.text}")
        
        return event_res.status_code, event_res.text, msg_res.status_code, msg_res.text

    except Exception as e:
        print(f"❌ Spring 서버 전송 실패: {e}")
        return 500, str(e), 500, str(e)
