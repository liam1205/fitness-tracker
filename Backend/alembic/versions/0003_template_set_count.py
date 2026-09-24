"""replace template_sets with a set_count column on template_exercises

Revision ID: 0003_template_set_count
Revises: 0002_fitness_tracking_tables
Create Date: 2026-09-24

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = "0003_template_set_count"
down_revision: Union[str, None] = "0002_fitness_tracking_tables"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.drop_table("template_sets")
    op.add_column(
        "template_exercises",
        sa.Column("set_count", sa.Integer(), server_default="1", nullable=False),
    )
    op.alter_column("template_exercises", "set_count", server_default=None)


def downgrade() -> None:
    op.drop_column("template_exercises", "set_count")
    op.create_table(
        "template_sets",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("template_exercise_id", sa.Integer(), nullable=False),
        sa.Column("set_number", sa.Integer(), nullable=False),
        sa.Column("target_reps", sa.Integer(), nullable=False),
        sa.Column("target_weight", sa.Numeric(precision=6, scale=2), nullable=False),
        sa.ForeignKeyConstraint(
            ["template_exercise_id"], ["template_exercises.id"], ondelete="CASCADE"
        ),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint(
            "template_exercise_id",
            "set_number",
            name="uq_template_sets_template_exercise_id_set_number",
        ),
    )
