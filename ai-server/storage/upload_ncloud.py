# stream/upload_ncloud.py
import boto3
from config import ENDPOINT, BUCKET_NAME, NCLOUD_ACCESS_KEY, NCLOUD_SECRET_KEY


def upload_to_ncloud(image_stream, object_key):
    """
    Ncloud Object Storage에 이미지를 업로드하고 URL 반환
    """
    try:
        s3 = boto3.client(
            service_name='s3',
            endpoint_url=ENDPOINT,
            aws_access_key_id=NCLOUD_ACCESS_KEY,
            aws_secret_access_key=NCLOUD_SECRET_KEY
        )

        image_stream.seek(0)
        s3.upload_fileobj(
            Fileobj=image_stream,
            Bucket=BUCKET_NAME,
            Key=object_key,
            ExtraArgs={'ACL': 'public-read'}
        )

        return f"{ENDPOINT}/{BUCKET_NAME}/{object_key}"

    except Exception as e:
        print(f"❌ Ncloud 업로드 실패: {e}")
        return None
