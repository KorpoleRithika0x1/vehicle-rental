"""fix vehicle_type enum: align MySQL column with current VehicleType model

The DB column was created as enum('sedan','suv','van','scooty','bike') but the
current VehicleType model uses ('car','suv','van','truck','bike').

Steps:
  1. Widen the ENUM to include all old + new values so the UPDATE is accepted.
  2. Migrate data: sedan -> car, scooty -> truck.
  3. Narrow the ENUM back to only the current valid values.

Revision ID: 20260529_0005
Revises: 20260528_0004
Create Date: 2026-05-29 00:05:00
"""

from alembic import op


revision = "20260529_0005"
down_revision = "20260530_0005"
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Step 1: widen ENUM to accept both old and new values during the data migration
    op.execute(
        "ALTER TABLE vehicles MODIFY COLUMN vehicle_type "
        "ENUM('sedan','suv','van','scooty','bike','car','truck') NOT NULL"
    )
    # Step 2: migrate stale values to their current equivalents
    op.execute("UPDATE vehicles SET vehicle_type = 'car'   WHERE vehicle_type = 'sedan'")
    op.execute("UPDATE vehicles SET vehicle_type = 'truck' WHERE vehicle_type = 'scooty'")
    # Step 3: lock the column down to only the current valid values
    op.execute(
        "ALTER TABLE vehicles MODIFY COLUMN vehicle_type "
        "ENUM('car','suv','van','truck','bike') NOT NULL"
    )


def downgrade() -> None:
    # Step 1: widen to allow both sets during rollback
    op.execute(
        "ALTER TABLE vehicles MODIFY COLUMN vehicle_type "
        "ENUM('sedan','suv','van','scooty','bike','car','truck') NOT NULL"
    )
    # Step 2: revert data
    op.execute("UPDATE vehicles SET vehicle_type = 'sedan'  WHERE vehicle_type = 'car'")
    op.execute("UPDATE vehicles SET vehicle_type = 'scooty' WHERE vehicle_type = 'truck'")
    # Step 3: restore original column definition
    op.execute(
        "ALTER TABLE vehicles MODIFY COLUMN vehicle_type "
        "ENUM('sedan','suv','van','scooty','bike') NOT NULL"
    )
