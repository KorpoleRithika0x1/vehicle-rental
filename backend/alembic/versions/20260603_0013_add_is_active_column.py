"""add_is_active_column

Revision ID: 20260603_0013_add_is_active_column
Revises: 294b33c5fff8
Create Date: 2026-06-03 10:00:00.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '20260603_0013_add_is_active_column'
down_revision = '294b33c5fff8'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Add is_active column to users table
    op.add_column('users', sa.Column('is_active', sa.Boolean(), nullable=False, server_default=sa.text('1')))


def downgrade() -> None:
    # Remove is_active column from users table
    op.drop_column('users', 'is_active')
