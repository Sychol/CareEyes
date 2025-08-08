# stream/upload_ncloud.py
import boto3
from config import ENDPOINT, BUCKET_NAME, NCLOUD_ACCESS_KEY, NCLOUD_SECRET_KEY, REGION_NAME


def upload_to_ncloud(image_stream, object_key):
    """
    Ncloud Object Storage에 이미지를 업로드하는 함수
    return : 업로드된 파일의 URL
    """
    try:

        # 디버깅용
        # print(f"🔄 Ncloud 오브젝트 키: {object_key}")
        # print(f"🔄 Ncloud 엔드포인트: {ENDPOINT}")
        # print(f"🔄 Ncloud 버킷: {BUCKET_NAME}")
        # print(f"🔄 Ncloud 액세스 키: {NCLOUD_ACCESS_KEY}")
        # print(f"🔄 Ncloud 비밀 키: {NCLOUD_SECRET_KEY}")

        s3 = boto3.client(
            service_name='s3',
            endpoint_url=ENDPOINT,
            region_name=REGION_NAME,
            aws_access_key_id=NCLOUD_ACCESS_KEY,
            aws_secret_access_key=NCLOUD_SECRET_KEY
        )

        # 이미지 스트림을 S3에 업로드
        image_stream.seek(0) # 커서 초기화
        s3.upload_fileobj(
            Fileobj=image_stream,
            Bucket=BUCKET_NAME,
            Key=object_key,
            ExtraArgs={'ACL': 'public-read'} # 외부에서 접근 가능하도록 설정
        )

        return f"{ENDPOINT}/{BUCKET_NAME}/{object_key}"

    except Exception as e:
        print(f"❌ Ncloud 업로드 실패: {e}")
        return None
