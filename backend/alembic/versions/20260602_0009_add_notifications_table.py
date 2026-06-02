"""add_notifications_table

Revision ID: 20260602_0009
Revises: 20260601_0012
Create Date: 2026-06-02 00:00:00
"""

from alembic import op
import sqlalchemy as sa


revision = "20260602_0009"
down_revision = "20260601_0012"
branch_labels = None
depends_on = None


def _notification_columns(bind: sa.engine.Connection) -> dict[str, dict] | None:
    inspector = sa.inspect(bind)
    if not inspector.has_table("notifications"):
        return None
    return {column["name"]: column for column in inspector.get_columns("notifications")}


def upgrade() -> None:
    bind = op.get_bind()
    columns = _notification_columns(bind)

    if columns is None:
        op.create_table(
            "notifications",
            sa.Column("id", sa.Integer(), primary_key=True, autoincrement=True),
            sa.Column(
                "user_id",
                sa.Integer(),
                sa.ForeignKey("users.id", ondelete="CASCADE"),
                nullable=False,
                index=True,
            ),
            sa.Column("title", sa.String(length=255), nullable=False),
            sa.Column("message", sa.Text(), nullable=False),
            sa.Column("is_read", sa.Boolean(), nullable=False, server_default=sa.text("0")),
            sa.Column("notification_type", sa.String(length=50), nullable=False),
            sa.Column("reference_id", sa.String(length=36), nullable=True),
            sa.Column(
                "created_at",
                sa.DateTime(),
                nullable=False,
                server_default=sa.text("CURRENT_TIMESTAMP"),
            ),
        )
        return

    with op.batch_alter_table("notifications") as batch_op:
        if "recipient_id" in columns and "user_id" not in columns:
            batch_op.alter_column(
                "recipient_id",
                new_column_name="user_id",
                existing_type=sa.Integer(),
                existing_nullable=False,
            )

        if "event_type" in columns and "notification_type" not in columns:
            batch_op.alter_column(
                "event_type",
                new_column_name="notification_type",
                existing_type=sa.String(length=80),
                existing_nullable=False,
            )

        title_length = getattr(columns.get("title", {}).get("type"), "length", None)
        if title_length != 255:
            batch_op.alter_column(
                "title",
                existing_type=sa.String(length=title_length or 150),
                type_=sa.String(length=255),
                existing_nullable=False,
            )

        message_type = columns.get("message", {}).get("type")
        message_length = getattr(message_type, "length", None)
        if not isinstance(message_type, sa.Text) or message_length not in (None, 0):
            batch_op.alter_column(
                "message",
                existing_type=sa.String(length=message_length or 500),
                type_=sa.Text(),
                existing_nullable=False,
            )

        if "reference_id" not in columns:
            batch_op.add_column(sa.Column("reference_id", sa.String(length=36), nullable=True))

        batch_op.alter_column(
            "created_at",
            existing_type=sa.DateTime(),
            server_default=sa.text("CURRENT_TIMESTAMP"),
            existing_nullable=False,
        )


def downgrade() -> None:
    bind = op.get_bind()
    columns = _notification_columns(bind)

    if not columns:
        return

    with op.batch_alter_table("notifications") as batch_op:
        if "notification_type" in columns and "event_type" not in columns:
            batch_op.alter_column(
                "notification_type",
                new_column_name="event_type",
                existing_type=sa.String(length=50),
                existing_nullable=False,
            )

        if "user_id" in columns and "recipient_id" not in columns:
            batch_op.alter_column(
                "user_id",
                new_column_name="recipient_id",
                existing_type=sa.Integer(),
                existing_nullable=False,
            )

        title_length = getattr(columns.get("title", {}).get("type"), "length", None)
        if title_length != 150:
            batch_op.alter_column(
                "title",
                existing_type=sa.String(length=title_length or 255),
                type_=sa.String(length=150),
                existing_nullable=False,
            )

        message_type = columns.get("message", {}).get("type")
        message_length = getattr(message_type, "length", None)
        if not isinstance(message_type, sa.String) or message_length != 500:
            batch_op.alter_column(
                "message",
                existing_type=sa.Text(),
                type_=sa.String(length=500),
                existing_nullable=False,
            )

        if "reference_id" in columns:
            batch_op.drop_column("reference_id")

        batch_op.alter_column(
            "created_at",
            existing_type=sa.DateTime(),
            server_default=None,
            existing_nullable=False,
        )
