"""make session_sets.reps and .weight nullable

Sets are now created up front from a template's set_count, before any reps
or weight have been performed, so these columns can no longer be required.

Revision ID: 0004_nullable_set_reps_weight
Revises: 0003_template_set_count
Create Date: 2026-09-27

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = "0004_nullable_set_reps_weight"
down_revision: Union[str, None] = "0003_template_set_count"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.alter_column("session_sets", "reps", existing_type=sa.Integer(), nullable=True)
    op.alter_column(
        "session_sets", "weight", existing_type=sa.Numeric(precision=6, scale=2), nullable=True
    )


def downgrade() -> None:
    op.alter_column(
        "session_sets", "weight", existing_type=sa.Numeric(precision=6, scale=2), nullable=False
    )
    op.alter_column("session_sets", "reps", existing_type=sa.Integer(), nullable=False)
