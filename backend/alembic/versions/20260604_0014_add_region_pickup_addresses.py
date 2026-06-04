"""add_region_pickup_addresses

Revision ID: 20260604_0014
Revises: 20260603_0013
Create Date: 2026-06-04 00:00:00
"""

from alembic import op
import sqlalchemy as sa


revision = "20260604_0014"
down_revision = "20260603_0013"
branch_labels = None
depends_on = None


def _table_exists(table_name: str) -> bool:
    bind = op.get_bind()
    return sa.inspect(bind).has_table(table_name)


def _column_exists(table_name: str, column_name: str) -> bool:
    bind = op.get_bind()
    columns = {col["name"] for col in sa.inspect(bind).get_columns(table_name)}
    return column_name in columns


def upgrade() -> None:
    if not _table_exists("region_pickup_addresses"):
        op.create_table(
            "region_pickup_addresses",
            sa.Column("id", sa.Integer(), nullable=False),
            sa.Column("city", sa.String(length=100), nullable=False),
            sa.Column("label", sa.String(length=120), nullable=False),
            sa.Column("address", sa.String(length=500), nullable=False),
            sa.PrimaryKeyConstraint("id"),
            sa.UniqueConstraint("city", "address", name="uq_city_pickup_address"),
        )
        op.create_index(
            op.f("ix_region_pickup_addresses_id"),
            "region_pickup_addresses",
            ["id"],
            unique=False,
        )
        op.create_index(
            op.f("ix_region_pickup_addresses_city"),
            "region_pickup_addresses",
            ["city"],
            unique=False,
        )

    if not _column_exists("bookings", "pickup_address"):
        op.add_column("bookings", sa.Column("pickup_address", sa.String(length=500), nullable=True))


def downgrade() -> None:
    if _column_exists("bookings", "pickup_address"):
        op.drop_column("bookings", "pickup_address")
    if _table_exists("region_pickup_addresses"):
        op.drop_index(op.f("ix_region_pickup_addresses_city"), table_name="region_pickup_addresses")
        op.drop_index(op.f("ix_region_pickup_addresses_id"), table_name="region_pickup_addresses")
        op.drop_table("region_pickup_addresses")
