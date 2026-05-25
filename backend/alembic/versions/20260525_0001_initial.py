"""initial schema

Revision ID: 20260525_0001
Revises: None
Create Date: 2026-05-25 00:00:00
"""

from alembic import op
import sqlalchemy as sa


revision = "20260525_0001"
down_revision = None
branch_labels = None
depends_on = None


user_role = sa.Enum("customer", "vehicle_manager", "admin", name="user_role")
vehicle_type = sa.Enum("car", "suv", "van", "truck", "bike", name="vehicle_type")
fuel_type = sa.Enum("petrol", "diesel", "electric", "hybrid", name="fuel_type")
booking_status = sa.Enum("pending", "approved", "active", "completed", "cancelled", name="booking_status")


def upgrade() -> None:
    op.create_table(
        "users",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("name", sa.String(length=100), nullable=False),
        sa.Column("email", sa.String(length=150), nullable=False),
        sa.Column("password_hash", sa.String(length=255), nullable=False),
        sa.Column("role", user_role, nullable=False, server_default="customer"),
        sa.Column("phone_number", sa.String(length=20), nullable=True),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default=sa.text("1")),
        sa.Column("created_at", sa.DateTime(), nullable=False, server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(), nullable=False, server_default=sa.func.now()),
        sa.UniqueConstraint("email"),
    )
    op.create_index("ix_users_id", "users", ["id"], unique=False)
    op.create_index("ix_users_email", "users", ["email"], unique=False)

    op.create_table(
        "vehicles",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("manager_id", sa.Integer(), nullable=False),
        sa.Column("vehicle_name", sa.String(length=150), nullable=False),
        sa.Column("brand", sa.String(length=100), nullable=False),
        sa.Column("vehicle_type", vehicle_type, nullable=False),
        sa.Column("registration_number", sa.String(length=50), nullable=False),
        sa.Column("rental_price_per_day", sa.Numeric(10, 2), nullable=False),
        sa.Column("fuel_type", fuel_type, nullable=False),
        sa.Column("seating_capacity", sa.Integer(), nullable=False),
        sa.Column("availability_status", sa.Boolean(), nullable=False, server_default=sa.text("1")),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(), nullable=False, server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(), nullable=False, server_default=sa.func.now()),
        sa.ForeignKeyConstraint(["manager_id"], ["users.id"], ondelete="RESTRICT"),
        sa.UniqueConstraint("registration_number"),
    )
    op.create_index("ix_vehicles_id", "vehicles", ["id"], unique=False)
    op.create_index("ix_vehicles_brand", "vehicles", ["brand"], unique=False)
    op.create_index("ix_vehicles_manager_id", "vehicles", ["manager_id"], unique=False)
    op.create_index("ix_vehicles_vehicle_type", "vehicles", ["vehicle_type"], unique=False)
    op.create_index(
        "idx_vehicles_availability_type_brand",
        "vehicles",
        ["availability_status", "vehicle_type", "brand"],
        unique=False,
    )

    op.create_table(
        "vehicle_images",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("vehicle_id", sa.Integer(), nullable=False),
        sa.Column("image_url", sa.String(length=500), nullable=False),
        sa.Column("is_primary", sa.Boolean(), nullable=False, server_default=sa.text("0")),
        sa.ForeignKeyConstraint(["vehicle_id"], ["vehicles.id"], ondelete="CASCADE"),
    )
    op.create_index("ix_vehicle_images_vehicle_id", "vehicle_images", ["vehicle_id"], unique=False)

    op.create_table(
        "bookings",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("customer_id", sa.Integer(), nullable=False),
        sa.Column("vehicle_id", sa.Integer(), nullable=False),
        sa.Column("pickup_date", sa.DateTime(), nullable=False),
        sa.Column("return_date", sa.DateTime(), nullable=False),
        sa.Column("total_amount", sa.Numeric(10, 2), nullable=False),
        sa.Column("status", booking_status, nullable=False, server_default="pending"),
        sa.Column("created_at", sa.DateTime(), nullable=False, server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(), nullable=False, server_default=sa.func.now()),
        sa.ForeignKeyConstraint(["customer_id"], ["users.id"], ondelete="RESTRICT"),
        sa.ForeignKeyConstraint(["vehicle_id"], ["vehicles.id"], ondelete="RESTRICT"),
    )
    op.create_index("ix_bookings_id", "bookings", ["id"], unique=False)
    op.create_index("ix_bookings_customer_id", "bookings", ["customer_id"], unique=False)
    op.create_index("ix_bookings_vehicle_id", "bookings", ["vehicle_id"], unique=False)
    op.create_index("idx_vehicle_dates", "bookings", ["vehicle_id", "pickup_date", "return_date"], unique=False)
    op.create_index("idx_customer", "bookings", ["customer_id"], unique=False)
    op.create_index("idx_status", "bookings", ["status"], unique=False)
    op.create_index("idx_customer_status", "bookings", ["customer_id", "status"], unique=False)


def downgrade() -> None:
    op.drop_index("idx_customer_status", table_name="bookings")
    op.drop_index("idx_status", table_name="bookings")
    op.drop_index("idx_customer", table_name="bookings")
    op.drop_index("idx_vehicle_dates", table_name="bookings")
    op.drop_index("ix_bookings_vehicle_id", table_name="bookings")
    op.drop_index("ix_bookings_customer_id", table_name="bookings")
    op.drop_index("ix_bookings_id", table_name="bookings")
    op.drop_table("bookings")

    op.drop_index("ix_vehicle_images_vehicle_id", table_name="vehicle_images")
    op.drop_table("vehicle_images")

    op.drop_index("idx_vehicles_availability_type_brand", table_name="vehicles")
    op.drop_index("ix_vehicles_vehicle_type", table_name="vehicles")
    op.drop_index("ix_vehicles_manager_id", table_name="vehicles")
    op.drop_index("ix_vehicles_brand", table_name="vehicles")
    op.drop_index("ix_vehicles_id", table_name="vehicles")
    op.drop_table("vehicles")

    op.drop_index("ix_users_email", table_name="users")
    op.drop_index("ix_users_id", table_name="users")
    op.drop_table("users")

    booking_status.drop(op.get_bind(), checkfirst=False)
    fuel_type.drop(op.get_bind(), checkfirst=False)
    vehicle_type.drop(op.get_bind(), checkfirst=False)
    user_role.drop(op.get_bind(), checkfirst=False)
