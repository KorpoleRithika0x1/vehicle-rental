"""add_city_to_vehicles

Revision ID: 20260529_0008
Revises: 20260529_0007
Create Date: 2026-05-29 00:08:00
"""

from alembic import op
import sqlalchemy as sa


revision = "20260529_0008"
down_revision = "20260529_0007"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column(
        "vehicles",
        sa.Column("city", sa.String(100), nullable=False, server_default="Mumbai"),
    )


def downgrade() -> None:
    op.drop_column("vehicles", "city")
