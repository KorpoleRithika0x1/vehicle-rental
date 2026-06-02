"""bridge rollback gap

Revision ID: 20260601_0012
Revises: 20260529_0008
Create Date: 2026-06-01 00:12:00
"""

from alembic import op


revision = "20260601_0012"
down_revision = "20260529_0008"
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Bridge migration added to restore the missing revision chain after a rollback.
    pass


def downgrade() -> None:
    pass
