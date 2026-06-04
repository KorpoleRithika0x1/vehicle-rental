"""add_is_active_column

Revision ID: 20260603_0013
Revises: 294b33c5fff8
Create Date: 2026-06-03 10:00:00.000000

"""
from alembic import op
import sqlalchemy as sa


revision = "20260603_0013"
down_revision = "294b33c5fff8"
branch_labels = None
depends_on = None


def _users_has_column(column_name: str) -> bool:
    bind = op.get_bind()
    inspector = sa.inspect(bind)
    return column_name in {col["name"] for col in inspector.get_columns("users")}


def upgrade() -> None:
    if not _users_has_column("is_active"):
        op.add_column(
            "users",
            sa.Column("is_active", sa.Boolean(), nullable=False, server_default=sa.text("1")),
        )


def downgrade() -> None:
    if _users_has_column("is_active"):
        op.drop_column("users", "is_active")
