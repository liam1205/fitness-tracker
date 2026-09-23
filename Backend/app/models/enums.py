from collections.abc import Callable
from enum import Enum

from sqlalchemy import Enum as SAEnum


class Language(str, Enum):
    ENGLISH = "english"
    GERMAN = "german"


class Theme(str, Enum):
    DARK = "dark"
    LIGHT = "light"
    SYSTEM = "system"


class MuscleGroup(str, Enum):
    CHEST = "chest"
    BACK = "back"
    SHOULDERS = "shoulders"
    BICEPS = "biceps"
    TRICEPS = "triceps"
    ABS = "abs"
    CALVES = "calves"
    QUADS = "quads"


def pg_enum(enum_cls: type[Enum], name: str) -> SAEnum:
    """Build a native Postgres enum column type backed by a Python str-enum.

    Stores the enum's *value* (e.g. "english") rather than its member name
    (e.g. "ENGLISH"), matching the ``CREATE TYPE`` labels the DB migration
    defines under ``name``.
    """
    values_callable: Callable[[type[Enum]], list[str]] = lambda obj: [e.value for e in obj]
    return SAEnum(enum_cls, name=name, values_callable=values_callable)
