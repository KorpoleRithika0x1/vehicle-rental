"""bridge old revision id (20260530_0005)

The revision was renamed to 20260529_0005. This no-op bridge keeps databases
that still reference the old id compatible with the migration chain.

Revision ID: 20260530_0005
Revises: 20260528_0004
Create Date: 2026-05-30 00:05:00
"""

from alembic import op
import sqlalchemy as sa


revision = "20260530_0005"
down_revision = "20260528_0004"
branch_labels = None
depends_on = None


def _vehicles_columns(bind: sa.engine.Connection) -> set[str]:
    inspector = sa.inspect(bind)
    return {column["name"] for column in inspector.get_columns("vehicles")}


def upgrade() -> None:
    bind = op.get_bind()
    columns = _vehicles_columns(bind)

    if "vehicle_count" not in columns:
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
    pass
