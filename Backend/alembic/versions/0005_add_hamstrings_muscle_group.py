"""add hamstrings to muscle_group_enum

Revision ID: 0005_add_hamstrings_muscle_group
Revises: 0004_nullable_set_reps_weight
"""
from typing import Sequence, Union

from alembic import op

revision: str = "0005_add_hamstrings_muscle_group"
down_revision: Union[str, None] = "0004_nullable_set_reps_weight"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # ADD VALUE can't run inside a transaction block on older Postgres versions.
    with op.get_context().autocommit_block():
        op.execute("ALTER TYPE muscle_group_enum ADD VALUE IF NOT EXISTS 'hamstrings'")


def downgrade() -> None:
    # Postgres can't drop an enum value; leaving it in place is harmless.
    pass
