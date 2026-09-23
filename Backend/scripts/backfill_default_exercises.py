"""Seed the default exercise catalog for any user that has none.

New users get this automatically on signup (see ``app.crud.user.create_user``).
This is a one-off backfill for accounts that existed before that wiring, or
were created before ``app/data/default_exercises.py`` last changed. Safe to
run repeatedly: a user with at least one exercise they created is skipped.

Run from the Backend directory:

    python -m scripts.backfill_default_exercises
"""

import asyncio

from sqlalchemy import select

from app.crud.exercise import create_default_exercises_for_user
from app.db import AsyncSessionLocal
from app.models.exercise import Exercise
from app.models.user import User


async def main() -> None:
    async with AsyncSessionLocal() as db:
        result = await db.execute(
            select(User.id)
            .outerjoin(Exercise, Exercise.created_by == User.id)
            .where(Exercise.id.is_(None))
        )
        user_ids = [row[0] for row in result.all()]

        if not user_ids:
            print("No users are missing exercises.")
            return

        for user_id in user_ids:
            await create_default_exercises_for_user(db, user_id)
        await db.commit()

        print(f"Seeded default exercises for {len(user_ids)} user(s): {user_ids}")


if __name__ == "__main__":
    asyncio.run(main())
