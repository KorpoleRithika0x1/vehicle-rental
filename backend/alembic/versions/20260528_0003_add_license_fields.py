"""add license fields to users

Revision ID: 20260528_0003
Revises: 20260526_0002
Create Date: 2026-05-28 12:30:00.000000
"""

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = "20260528_0003"
down_revision = "20260526_0002"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("users", sa.Column("driving_license_number", sa.String(length=50), nullable=True))
    op.add_column("users", sa.Column("license_verified", sa.Boolean(), nullable=False, server_default=sa.text("0")))
    op.add_column("users", sa.Column("license_document_url", sa.String(length=500), nullable=True))


def downgrade() -> None:
    op.drop_column("users", "driving_license_number")
    op.drop_column("users", "license_verified")
    op.drop_column("users", "license_document_url")
