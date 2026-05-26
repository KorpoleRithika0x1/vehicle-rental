from fastapi import HTTPException, UploadFile, status

import cloudinary
import cloudinary.uploader

from app.config import get_settings


settings = get_settings()


def _ensure_cloudinary_config() -> None:
    if not (settings.cloudinary_cloud_name and settings.cloudinary_api_key and settings.cloudinary_api_secret):
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Cloudinary is not configured on the server.",
        )
    cloudinary.config(
        cloud_name=settings.cloudinary_cloud_name,
        api_key=settings.cloudinary_api_key,
        api_secret=settings.cloudinary_api_secret,
        secure=True,
    )


async def upload_image_to_cloudinary(file: UploadFile, *, folder: str) -> str:
    if not file.content_type or not file.content_type.startswith("image/"):
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="Only image files are allowed.")

    _ensure_cloudinary_config()
    file_bytes = await file.read()
    if not file_bytes:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="Uploaded file is empty.")

    response = cloudinary.uploader.upload(
        file_bytes,
        folder=folder,
        resource_type="image",
        overwrite=False,
    )
    image_url = response.get("secure_url")
    if not image_url:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Image upload failed.")
    return image_url
