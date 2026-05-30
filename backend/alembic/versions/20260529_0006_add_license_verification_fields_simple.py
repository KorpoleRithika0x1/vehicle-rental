"""add_license_verification_fields_simple

Revision ID: 20260529_0006
Revises: 20260529_0005
Create Date: 2026-05-29 00:06:00
"""

from alembic import op
import sqlalchemy as sa


revision = "20260529_0006"
down_revision = "20260529_0005"
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Add new columns
    op.add_column(
        "users",
        sa.Column(
            "account_status",
            sa.Enum("pending_verification", "active", "rejected", "suspended", name="account_status_enum"),
            server_default="pending_verification",
            nullable=False,
        ),
    )
    op.add_column("users", sa.Column("license_image_url", sa.String(length=500), nullable=True))
    op.add_column("users", sa.Column("live_photo_url", sa.String(length=500), nullable=True))
    op.add_column("users", sa.Column("verification_reviewed_by", sa.String(length=36), nullable=True))
    op.add_column("users", sa.Column("verification_reviewed_at", sa.DateTime(), nullable=True))
    op.add_column("users", sa.Column("rejection_reason", sa.Text(), nullable=True))
    
    # Update existing users to have account_status = 'active' (since they were already active)
    op.execute("UPDATE users SET account_status = 'active' WHERE is_active = 1")
    op.execute("UPDATE users SET account_status = 'pending_verification' WHERE is_active = 0")
    
    # Drop the old is_active column
    op.drop_column("users", "is_active")


def downgrade() -> None:
    # Add back is_active column
    op.add_column(
        "users",
        sa.Column("is_active", sa.Boolean(), server_default=sa.text("1"), nullable=False),
    )
    
    # Update is_active based on account_status
    op.execute("UPDATE users SET is_active = 1 WHERE account_status = 'active'")
    op.execute("UPDATE users SET is_active = 0 WHERE account_status != 'active'")
    
    # Drop new columns
    op.drop_column("users", "rejection_reason")
    op.drop_column("users", "verification_reviewed_at")
    op.drop_column("users", "verification_reviewed_by")
    op.drop_column("users", "live_photo_url")
    op.drop_column("users", "license_image_url")
    op.drop_column("users", "account_status")
    
    # Drop the enum type
    op.execute("DROP TYPE IF EXISTS account_status_enum")