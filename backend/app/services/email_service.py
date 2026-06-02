"""Sends transactional emails via Gmail SMTP using aiosmtplib."""

import aiosmtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText

from app.config import get_settings


async def send_account_approved_email(to_email: str, customer_name: str) -> None:
    settings = get_settings()

    message = MIMEMultipart("alternative")
    message["Subject"] = "Your Account Has Been Approved — Vehicle Rental"
    message["From"] = settings.smtp_from_email
    message["To"] = to_email

    html_body = f"""
    <html>
      <body style="font-family: Arial, sans-serif; color: #333; padding: 24px;">
        <h2 style="color: #16a34a;">Your Account is Approved ✓</h2>
        <p>Hi {customer_name},</p>
        <p>Great news! Your driving license and photo have been verified. Your account is now active.</p>
        <p>You can now log in and start browsing vehicles.</p>
        <a href="{settings.frontend_url}/login"
           style="display:inline-block; margin-top:16px; padding:12px 24px;
                  background:#16a34a; color:white; text-decoration:none; border-radius:6px;">
          Log In Now
        </a>
        <p style="margin-top:32px; color:#888; font-size:12px;">
          If you did not create this account, please ignore this email.
        </p>
      </body>
    </html>
    """

    message.attach(MIMEText(html_body, "html"))

    await aiosmtplib.send(
        message,
        hostname="smtp.gmail.com",
        port=587,
        start_tls=True,
        username=settings.smtp_username,
        password=settings.smtp_password,
    )
