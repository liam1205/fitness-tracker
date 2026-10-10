"""weighted primary/secondary muscle groups per exercise

Replaces the single ``exercises.muscle_group`` column with an
``exercise_muscle_groups`` table. Every existing exercise keeps its muscle
group as its primary one with a factor of 1.

Revision ID: 0007_exercise_muscle_groups
Revises: 0006_session_pauses
Create Date: 2026-10-10

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = "0007_exercise_muscle_groups"
down_revision: Union[str, None] = "0006_session_pauses"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

# The type already exists (0002, extended in 0005); reference it without
# letting create_table() try to create it again.
muscle_group_enum = postgresql.ENUM(name="muscle_group_enum", create_type=False)


def upgrade() -> None:
    op.create_table(
        "exercise_muscle_groups",
        sa.Column("exercise_id", sa.Uuid(), nullable=False),
        sa.Column("muscle_group", muscle_group_enum, nullable=False),
        sa.Column("factor", sa.Numeric(precision=3, scale=2), nullable=False),
        sa.Column("is_primary", sa.Boolean(), server_default=sa.false(), nullable=False),
        sa.CheckConstraint(
            "factor > 0 AND factor <= 1", name="ck_exercise_muscle_groups_factor_range"
        ),
        sa.ForeignKeyConstraint(["exercise_id"], ["exercises.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("exercise_id", "muscle_group"),
    )
    op.create_index(
        "uq_exercise_muscle_groups_one_primary",
        "exercise_muscle_groups",
        ["exercise_id"],
        unique=True,
        postgresql_where=sa.text("is_primary"),
    )

    op.execute(
        "INSERT INTO exercise_muscle_groups (exercise_id, muscle_group, factor, is_primary) "
        "SELECT id, muscle_group, 1, true FROM exercises"
    )
    op.drop_column("exercises", "muscle_group")


def downgrade() -> None:
    # Only the primary muscle group survives; secondary ones are lost.
    op.add_column("exercises", sa.Column("muscle_group", muscle_group_enum, nullable=True))
    op.execute(
        "UPDATE exercises SET muscle_group = emg.muscle_group "
        "FROM exercise_muscle_groups AS emg "
        "WHERE emg.exercise_id = exercises.id AND emg.is_primary"
    )
    op.alter_column("exercises", "muscle_group", nullable=False)

    op.drop_index("uq_exercise_muscle_groups_one_primary", table_name="exercise_muscle_groups")
    op.drop_table("exercise_muscle_groups")
