"""add session_pauses table

Revision ID: 0006_session_pauses
Revises: 0005_add_hamstrings_muscle_group
Create Date: 2026-10-02

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = "0006_session_pauses"
down_revision: Union[str, None] = "0005_add_hamstrings_muscle_group"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "session_pauses",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("session_id", sa.Uuid(), nullable=False),
        sa.Column("paused_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("resumed_at", sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(["session_id"], ["workout_sessions.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_session_pauses_session_id"), "session_pauses", ["session_id"])
    op.create_index(
        "uq_session_pauses_open_per_session",
        "session_pauses",
        ["session_id"],
        unique=True,
        postgresql_where=sa.text("resumed_at IS NULL"),
    )


def downgrade() -> None:
    op.drop_index("uq_session_pauses_open_per_session", table_name="session_pauses")
    op.drop_index(op.f("ix_session_pauses_session_id"), table_name="session_pauses")
    op.drop_table("session_pauses")
