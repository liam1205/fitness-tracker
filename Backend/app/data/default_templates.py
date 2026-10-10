"""Built-in workout templates seeded for every new user at signup.

Edit this list to add, remove, or rename the templates new users start with;
each entry becomes one ``WorkoutTemplate`` the user owns. Like
``default_exercises.py``, this is the single source of truth — no other file
is read at runtime.

Each entry is ``(template name, [(exercise name, set count), ...])``, with the
slots in display order. Exercise names must match an entry in
``DEFAULT_EXERCISES`` exactly, since slots are linked to the user's seeded
exercises by name; this is checked on import.
"""

from app.data.default_exercises import DEFAULT_EXERCISES

DEFAULT_TEMPLATES: list[tuple[str, list[tuple[str, int]]]] = [
    (
        "Push (FB)",
        [
            ("Benchpress, Barbell", 3),
            ("Butterfly", 3),
            ("Shoulder Press, Dumbbell", 2),
            ("Lateral Raises, Dumbbell", 3),
            ("Triceps-Pushdown, Straight Bar", 3),
            ("Lunges", 3),
        ],
    ),
    (
        "Pull (FB)",
        [
            ("Pull-Ups, wide", 3),
            ("Machine Row, wide", 3),
            ("Cable Row, narrow", 3),
            ("Lateral Raises, Dumbbell", 3),
            ("Butterfly-Reverse", 3),
            ("Preacher Curls", 3),
            ("Calf Raises, Machine", 3),
        ],
    ),
    (
        "Full Body",
        [
            ("Pull-Ups, wide", 4),
            ("Benchpress, Barbell", 4),
            ("Lateral Raises, Dumbbell", 3),
            ("Lunges", 3),
            ("Preacher Curls", 3),
            ("Overhead Triceps Extensions, Straight Bar", 3),
            ("Calf Raises, Machine", 3),
        ],
    ),
    (
        "Push",
        [
            ("Benchpress, Barbell", 3),
            ("Incline Benchpress, Dumbbell", 2),
            ("Butterfly", 2),
            ("Shoulder Press, Dumbbell", 2),
            ("Lateral Raises, Dumbbell", 3),
            ("Triceps-Pushdown, Straight Bar", 3),
        ],
    ),
    (
        "Pull",
        [
            ("Pull-Ups, wide", 3),
            ("Machine Row, wide", 3),
            ("Cable Row, narrow", 3),
            ("Lateral Raises, Dumbbell", 3),
            ("Butterfly-Reverse", 3),
            ("Preacher Curls", 3),
        ],
    ),
    (
        "Legs",
        [
            ("Squats", 3),
            ("Romanian Deadlifts, Barbell", 3),
            ("Leg Press, 45 Degrees", 3),
            ("Leg Curls, Seated", 3),
            ("Leg Extensions", 3),
            ("Calf Raises, Machine", 3),
        ],
    ),
    (
        "Upper",
        [
            ("Benchpress, Dumbbell", 3),
            ("Barbell Row, overgrip", 3),
            ("Shoulder Press, Machine", 2),
            ("Lat-Pulldown, wide", 3),
            ("Lateral Raises, Dumbbell", 3),
            ("Curls, Barbell", 2),
            ("Triceps-Pushdown, V", 2),
        ],
    ),
    (
        "Lower",
        [
            ("Bulgarian Split Squats", 3),
            ("Romanian Deadlifts, Dumbbell", 3),
            ("Leg Extensions", 3),
            ("Leg Curls, Lying", 3),
            ("Calf Raises, Seated", 3),
            ("Crunches, Cable", 3),
        ],
    ),
]

_unknown = {
    exercise
    for _, slots in DEFAULT_TEMPLATES
    for exercise, _ in slots
} - {name for name, _, _ in DEFAULT_EXERCISES}
if _unknown:
    raise ValueError(f"DEFAULT_TEMPLATES references unknown exercises: {sorted(_unknown)}")
