import pytest
from unittest.mock import AsyncMock, patch
from app.services.email_service import send_account_approved_email
from app.config import Settings


@pytest.mark.asyncio
@patch("aiosmtplib.send", new_callable=AsyncMock)
@patch("app.services.email_service.get_settings")
async def test_send_account_approved_email(mock_get_settings, mock_send):
    # Mock settings
    mock_settings = Settings(
        DATABASE_URL="mysql+aiomysql://root:password@localhost:3306/db",
        REDIS_URL="redis://localhost:6379/0",
        SECRET_KEY="test_secret_key_long_enough_for_jwt_32_chars",
        SMTP_USERNAME="test_user@gmail.com",
        SMTP_PASSWORD="test_password",
        SMTP_FROM_EMAIL="test_from@gmail.com",
        FRONTEND_URL="http://test-frontend.com"
    )
    mock_get_settings.return_value = mock_settings

    await send_account_approved_email("customer@example.com", "John Doe")

    # Verify aiosmtplib.send is called with the correct parameters
    mock_send.assert_called_once()
    
    # Extract the email message object passed as the first argument
    called_msg = mock_send.call_args[0][0]
    
    assert called_msg["Subject"] == "Your Account Has Been Approved — Vehicle Rental"
    assert called_msg["From"] == "test_from@gmail.com"
    assert called_msg["To"] == "customer@example.com"
    
    # Verify content structure
    body = called_msg.get_payload(0).get_payload(decode=True).decode("utf-8")
    assert "Hi John Doe" in body
    assert "http://test-frontend.com/login" in body

    # Verify keyword args passed to aiosmtplib.send
    kwargs = mock_send.call_args[1]
    assert kwargs["hostname"] == "smtp.gmail.com"
    assert kwargs["port"] == 587
    assert kwargs["start_tls"] is True
    assert kwargs["username"] == "test_user@gmail.com"
    assert kwargs["password"] == "test_password"
