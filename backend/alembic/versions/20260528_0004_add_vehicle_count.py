"""add vehicle stock count

Revision ID: 20260528_0004
Revises: 20260528_0003
Create Date: 2026-05-28 00:04:00
"""

from alembic import op
import sqlalchemy as sa


revision = "20260528_0004"
down_revision = "20260528_0003"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column(
        "vehicles",
        sa.Column("vehicle_count", sa.Integer(), nullable=False, server_default="1"),
    )
    op.create_check_constraint(
        "ck_vehicles_vehicle_count_non_negative",
        "vehicles",
        "vehicle_count >= 0",
    )


def downgrade() -> None:
    op.drop_constraint("ck_vehicles_vehicle_count_non_negative", "vehicles", type_="check")
    op.drop_column("vehicles", "vehicle_count")
