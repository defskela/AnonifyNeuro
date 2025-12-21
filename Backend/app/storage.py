import os
import io
from minio import Minio
from minio.error import S3Error

MINIO_ENDPOINT = os.getenv("MINIO_ENDPOINT", "minio:9000")
MINIO_ACCESS_KEY = os.getenv("MINIO_ACCESS_KEY", "minioadmin")
MINIO_SECRET_KEY = os.getenv("MINIO_SECRET_KEY", "minioadmin")
MINIO_BUCKET = os.getenv("MINIO_BUCKET", "anonify-images")
MINIO_SECURE = os.getenv("MINIO_SECURE", "False").lower() == "true"
MINIO_PUBLIC_ENDPOINT = os.getenv("MINIO_PUBLIC_ENDPOINT", "localhost:9000")

class StorageClient:
    def __init__(self):
        self.internal_client = Minio(
            MINIO_ENDPOINT,
            access_key=MINIO_ACCESS_KEY,
            secret_key=MINIO_SECRET_KEY,
            secure=MINIO_SECURE
        )
        self.bucket_name = MINIO_BUCKET
        self._ensure_bucket()

    def _ensure_bucket(self):
        try:
            if not self.internal_client.bucket_exists(self.bucket_name):
                self.internal_client.make_bucket(self.bucket_name)
        except S3Error as err:
            print(f"MinIO Error: {err}")

    def upload_file(self, file_data: bytes, object_name: str, content_type: str = "application/octet-stream") -> str:
        try:
            self.internal_client.put_object(
                self.bucket_name,
                object_name,
                io.BytesIO(file_data),
                len(file_data),
                content_type=content_type
            )
            return object_name
        except S3Error as err:
            print(f"MinIO Upload Error: {err}")
            raise

    def get_presigned_url(self, object_name: str) -> str:
        try:
            # Generate presigned URL using the internal client for calculation
            # We use a temporary public client configuration to ensure the signature matches public access
            
            signer_client = Minio(
                MINIO_PUBLIC_ENDPOINT,
                access_key=MINIO_ACCESS_KEY,
                secret_key=MINIO_SECRET_KEY,
                secure=MINIO_SECURE,
                region="us-east-1"
            )
            
            return signer_client.get_presigned_url("GET", self.bucket_name, object_name)
        except S3Error as err:
            print(f"MinIO Get URL Error: {err}")
            raise
        except S3Error as err:
            print(f"MinIO Get URL Error: {err}")
            raise

storage = StorageClient()
