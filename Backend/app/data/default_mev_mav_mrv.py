from app.models.enums import MuscleGroup

# MEV is the minimum of sets that must be fulfilled per 7 days to achieve muscle growth
DEFAULT_MEV: list[tuple[int, MuscleGroup]] = [
    (6, MuscleGroup.CHEST),
    (8, MuscleGroup.BACK),
    (6, MuscleGroup.SHOULDERS),
    (6, MuscleGroup.QUADS),
    (4, MuscleGroup.HAMS),
    (4, MuscleGroup.BICEPS),
    (4, MuscleGroup.TRICEPS),
    (4, MuscleGroup.ABS),
    (6, MuscleGroup.CALVES),
]

# MAV is the minimum of sets that must be fulfilled per 7 days to achieve optimal muscle growth
DEFAULT_MAV: list[tuple[int, MuscleGroup]] = [
    (12, MuscleGroup.CHEST),
    (14, MuscleGroup.BACK),
    (12, MuscleGroup.SHOULDERS),
    (12, MuscleGroup.QUADS),
    (10, MuscleGroup.HAMS),
    (10, MuscleGroup.BICEPS),
    (10, MuscleGroup.TRICEPS),
    (6, MuscleGroup.ABS),
    (12, MuscleGroup.CALVES),
]

# MEV is the maximum of sets that must be fulfilled per 7 days to achieve optimal muscle growth
# Beyond this threshold is difficult to recover
DEFAULT_MRV: list[tuple[int, MuscleGroup]] = [
    (20, MuscleGroup.CHEST),
    (22, MuscleGroup.BACK),
    (20, MuscleGroup.SHOULDERS),
    (20, MuscleGroup.QUADS),
    (16, MuscleGroup.HAMS),
    (16, MuscleGroup.BICEPS),
    (14, MuscleGroup.TRICEPS),
    (8, MuscleGroup.ABS),
    (20, MuscleGroup.CALVES),
]