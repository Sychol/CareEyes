# api/spring_client.py
import requests
from config import SPRING_PROXY


def send_to_spring(object_counts, save_path, date_str, time_str, cctv_id):
    """
    감지 결과를 Spring 서버로 전송합니다.
    /detect : 이벤트 저장
    /sendalert : 알림 전송
    """
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
    headers = {"Content-Type": "application/json"}

    try:
        event_url = f"{SPRING_PROXY}/detect"
        msg_url = f"{SPRING_PROXY}/sendalert"

        event_res = requests.post(event_url, json=event_payload, headers=headers)
        msg_res = requests.post(msg_url, json=msg_payload, headers=headers)

        print(f"📡 /detect 응답: {event_res.status_code} - {event_res.text}")
        print(f"📡 /sendalert 응답: {msg_res.status_code} - {msg_res.text}")
        return event_res.status_code, event_res.text, msg_res.status_code, msg_res.text

    except Exception as e:
        print(f"❌ Spring 서버 전송 실패: {e}")
        return 500, str(e), 500, str(e)
