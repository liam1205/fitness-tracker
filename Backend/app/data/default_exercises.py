"""Built-in exercise catalog seeded for every new user at signup.

Edit this list to add, remove, or rename the exercises new users start with;
each entry becomes one row the user owns (``Exercise.created_by``). This is
the single source of truth for the default catalog — no CSV or other file is
read at runtime.

Each entry is ``(name, primary muscle group, secondary muscle groups)``. The
primary one always gets a factor of 1; secondary ones map to their factor,
i.e. how much one completed set counts towards that muscle group's weekly
volume.
"""

from app.models.enums import MuscleGroup

DEFAULT_EXERCISES: list[tuple[str, MuscleGroup, dict[MuscleGroup, float]]] = [
    ("Benchpress, Barbell", MuscleGroup.CHEST, {MuscleGroup.TRICEPS: 0.5, MuscleGroup.SHOULDERS: 0.25}),
    ("Benchpress, Dumbbell", MuscleGroup.CHEST, {MuscleGroup.TRICEPS: 0.5, MuscleGroup.SHOULDERS: 0.25}),
    ("Incline Benchpress, Barbell", MuscleGroup.CHEST, {MuscleGroup.TRICEPS: 0.5, MuscleGroup.SHOULDERS: 0.5}),
    ("Incline Benchpress, Dumbbell", MuscleGroup.CHEST, {MuscleGroup.TRICEPS: 0.5, MuscleGroup.SHOULDERS: 0.5}),
    ("Butterfly", MuscleGroup.CHEST, {}),
    ("Flys, Cable", MuscleGroup.CHEST, {}),
    ("Flys, Dumbbell", MuscleGroup.CHEST, {}),
    ("Push-Ups", MuscleGroup.CHEST, {MuscleGroup.TRICEPS: 0.5, MuscleGroup.SHOULDERS: 0.25}),
    ("Pull-Ups, wide", MuscleGroup.BACK, {MuscleGroup.BICEPS: 0.5}),
    ("Lat-Pulldown, wide", MuscleGroup.BACK, {MuscleGroup.BICEPS: 0.5}),
    ("Pull-Ups, narrow", MuscleGroup.BACK, {MuscleGroup.BICEPS: 0.5}),
    ("Lat-Pulldown, narrow", MuscleGroup.BACK, {MuscleGroup.BICEPS: 0.5}),
    ("Machine Row, wide", MuscleGroup.BACK, {MuscleGroup.BICEPS: 0.5, MuscleGroup.SHOULDERS: 0.25}),
    ("Machine Row, narrow", MuscleGroup.BACK, {MuscleGroup.BICEPS: 0.5}),
    ("Cable Row, wide", MuscleGroup.BACK, {MuscleGroup.BICEPS: 0.5, MuscleGroup.SHOULDERS: 0.25}),
    ("Cable Row, narrow", MuscleGroup.BACK, {MuscleGroup.BICEPS: 0.5}),
    ("Barbell Row, overgrip", MuscleGroup.BACK, {MuscleGroup.BICEPS: 0.5, MuscleGroup.SHOULDERS: 0.25}),
    ("Barbell Row, undergrip", MuscleGroup.BACK, {MuscleGroup.BICEPS: 0.5}),
    ("Dumbbell Row, overgrip", MuscleGroup.BACK, {MuscleGroup.BICEPS: 0.5, MuscleGroup.SHOULDERS: 0.25}),
    ("Dumbbell Row, undergrip", MuscleGroup.BACK, {MuscleGroup.BICEPS: 0.5}),
    ("Lateral Raises, Dumbbell", MuscleGroup.SHOULDERS, {}),
    ("Lateral Raises, Cable", MuscleGroup.SHOULDERS, {}),
    ("Lateral Raises, Machine", MuscleGroup.SHOULDERS, {}),
    ("Shoulder Press, Barbell", MuscleGroup.SHOULDERS, {MuscleGroup.TRICEPS: 0.5}),
    ("Shoulder Press, Dumbbell", MuscleGroup.SHOULDERS, {MuscleGroup.TRICEPS: 0.5}),
    ("Shoulder Press, Machine", MuscleGroup.SHOULDERS, {MuscleGroup.TRICEPS: 0.5}),
    ("Butterfly-Reverse", MuscleGroup.SHOULDERS, {MuscleGroup.BACK: 0.25}),
    ("Flys-Reverse, Dumbbell", MuscleGroup.SHOULDERS, {MuscleGroup.BACK: 0.25}),
    ("Flys-Reverse, Cable", MuscleGroup.SHOULDERS, {MuscleGroup.BACK: 0.25}),
    ("Seated Curls", MuscleGroup.BICEPS, {}),
    ("Curls, Dumbbell", MuscleGroup.BICEPS, {}),
    ("Curls, Barbell", MuscleGroup.BICEPS, {}),
    ("Preacher Curls", MuscleGroup.BICEPS, {}),
    ("Scott Curls, Dumbbell", MuscleGroup.BICEPS, {}),
    ("Scott Curls, Barbell", MuscleGroup.BICEPS, {}),
    ("Triceps-Pushdown, V", MuscleGroup.TRICEPS, {}),
    ("Triceps-Pushdown, Rope", MuscleGroup.TRICEPS, {}),
    ("Triceps-Pushdown, Straight Bar", MuscleGroup.TRICEPS, {}),
    ("Triceps Machine", MuscleGroup.TRICEPS, {}),
    ("Overhead Triceps Extensions, V", MuscleGroup.TRICEPS, {}),
    ("Overhead Triceps Extensions, Rope", MuscleGroup.TRICEPS, {}),
    ("Overhead Triceps Extensions, Straight Bar", MuscleGroup.TRICEPS, {}),
    ("Crunches", MuscleGroup.ABS, {}),
    ("Crunches, Cable", MuscleGroup.ABS, {}),
    ("Sit-ups", MuscleGroup.ABS, {}),
    ("Leg Raises", MuscleGroup.ABS, {}),
    ("Calf Raises, Leg Press", MuscleGroup.CALVES, {}),
    ("Calf Raises, Machine", MuscleGroup.CALVES, {}),
    ("Calf Raises, Seated", MuscleGroup.CALVES, {}),
    ("Leg Press, 45 Degrees", MuscleGroup.QUADS, {}),
    ("Leg Press, Flat", MuscleGroup.QUADS, {}),
    ("Leg Extensions", MuscleGroup.QUADS, {}),
    ("Leg Curls, Seated", MuscleGroup.HAMS, {}),
    ("Leg Curls, Standing", MuscleGroup.HAMS, {}),
    ("Leg Curls, Lying", MuscleGroup.HAMS, {}),
    ("Squats", MuscleGroup.QUADS, {MuscleGroup.HAMS: 0.25}),
    ("Lunges", MuscleGroup.QUADS, {MuscleGroup.HAMS: 0.25}),
    ("Bulgarian Split Squats", MuscleGroup.QUADS, {MuscleGroup.HAMS: 0.25}),
    ("Romanian Deadlifts, Barbell", MuscleGroup.HAMS, {MuscleGroup.BACK: 0.25}),
    ("Romanian Deadlifts, Dumbbell", MuscleGroup.HAMS, {MuscleGroup.BACK: 0.25}),
    ("Romanian Deadlifts, Smith", MuscleGroup.HAMS, {MuscleGroup.BACK: 0.25}),
]
