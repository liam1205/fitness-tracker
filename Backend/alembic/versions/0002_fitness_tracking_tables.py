"""fitness tracking tables: settings, exercises, templates, sessions

Revision ID: 0002_fitness_tracking_tables
Revises: 0001_initial
Create Date: 2026-09-23

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = "0002_fitness_tracking_tables"
down_revision: Union[str, None] = "0001_initial"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

# Native Postgres enum types. Each backs exactly one column below; SQLAlchemy
# creates the type automatically when the table that first uses it is
# created, but drops must be done explicitly in downgrade() since
# op.drop_table() only knows the table name, not its columns.
language_enum = sa.Enum("english", "german", name="language_enum")
theme_enum = sa.Enum("dark", "light", "system", name="theme_enum")
muscle_group_enum = sa.Enum(
    "chest", "back", "shoulders", "biceps", "triceps", "abs", "calves", "quads",
    name="muscle_group_enum",
)


def upgrade() -> None:
    op.create_table(
        "exercises",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("created_by", sa.Integer(), nullable=True),
        sa.Column("name", sa.String(length=200), nullable=False),
        sa.Column("muscle_group", muscle_group_enum, nullable=False),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=False,
        ),
        sa.ForeignKeyConstraint(["created_by"], ["user.id"], ondelete="SET NULL"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_exercises_created_by"), "exercises", ["created_by"])

    op.create_table(
        "user_settings",
        sa.Column("user_id", sa.Integer(), nullable=False),
        sa.Column("language", language_enum, nullable=False),
        sa.Column("theme", theme_enum, nullable=False),
        sa.ForeignKeyConstraint(["user_id"], ["user.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("user_id"),
    )

    op.create_table(
        "workout_templates",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("user_id", sa.Integer(), nullable=False),
        sa.Column("name", sa.String(length=200), nullable=False),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=False,
        ),
        sa.ForeignKeyConstraint(["user_id"], ["user.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_workout_templates_user_id"), "workout_templates", ["user_id"])

    op.create_table(
        "template_exercises",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("template_id", sa.Integer(), nullable=False),
        sa.Column("exercise_id", sa.Integer(), nullable=False),
        sa.Column("position", sa.Integer(), nullable=False),
        sa.ForeignKeyConstraint(["exercise_id"], ["exercises.id"]),
        sa.ForeignKeyConstraint(["template_id"], ["workout_templates.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint(
            "template_id", "position", name="uq_template_exercises_template_id_position"
        ),
    )
    op.create_index(
        op.f("ix_template_exercises_exercise_id"), "template_exercises", ["exercise_id"]
    )

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

    op.create_table(
        "workout_sessions",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("template_id", sa.Integer(), nullable=True),
        sa.Column("user_id", sa.Integer(), nullable=False),
        sa.Column(
            "started_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=False,
        ),
        sa.Column("completed_at", sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(["template_id"], ["workout_templates.id"], ondelete="SET NULL"),
        sa.ForeignKeyConstraint(["user_id"], ["user.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_workout_sessions_template_id"), "workout_sessions", ["template_id"])
    op.create_index(op.f("ix_workout_sessions_user_id"), "workout_sessions", ["user_id"])

    op.create_table(
        "session_exercises",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("session_id", sa.Integer(), nullable=False),
        sa.Column("exercise_id", sa.Integer(), nullable=False),
        sa.Column("position", sa.Integer(), nullable=False),
        sa.ForeignKeyConstraint(["exercise_id"], ["exercises.id"]),
        sa.ForeignKeyConstraint(["session_id"], ["workout_sessions.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint(
            "session_id", "position", name="uq_session_exercises_session_id_position"
        ),
    )
    op.create_index(
        op.f("ix_session_exercises_exercise_id"), "session_exercises", ["exercise_id"]
    )

    op.create_table(
        "session_sets",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("session_exercise_id", sa.Integer(), nullable=False),
        sa.Column("set_number", sa.Integer(), nullable=False),
        sa.Column("reps", sa.Integer(), nullable=False),
        sa.Column("weight", sa.Numeric(precision=6, scale=2), nullable=False),
        sa.Column("completed", sa.Boolean(), server_default=sa.false(), nullable=False),
        sa.ForeignKeyConstraint(
            ["session_exercise_id"], ["session_exercises.id"], ondelete="CASCADE"
        ),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint(
            "session_exercise_id",
            "set_number",
            name="uq_session_sets_session_exercise_id_set_number",
        ),
    )


def downgrade() -> None:
    op.drop_table("session_sets")

    op.drop_index(op.f("ix_session_exercises_exercise_id"), table_name="session_exercises")
    op.drop_table("session_exercises")

    op.drop_index(op.f("ix_workout_sessions_user_id"), table_name="workout_sessions")
    op.drop_index(op.f("ix_workout_sessions_template_id"), table_name="workout_sessions")
    op.drop_table("workout_sessions")

    op.drop_table("template_sets")

    op.drop_index(op.f("ix_template_exercises_exercise_id"), table_name="template_exercises")
    op.drop_table("template_exercises")

    op.drop_index(op.f("ix_workout_templates_user_id"), table_name="workout_templates")
    op.drop_table("workout_templates")

    op.drop_table("user_settings")

    op.drop_index(op.f("ix_exercises_created_by"), table_name="exercises")
    op.drop_table("exercises")

    bind = op.get_bind()
    muscle_group_enum.drop(bind, checkfirst=False)
    theme_enum.drop(bind, checkfirst=False)
    language_enum.drop(bind, checkfirst=False)
