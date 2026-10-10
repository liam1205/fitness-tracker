"""Seed the default workout templates for any user that has none.

New users get this automatically on signup (see ``app.crud.user.create_user``).
This is a one-off backfill for accounts that existed before that wiring. Safe
to run repeatedly: a user with at least one template is skipped. Run
``backfill_default_exercises`` first, since template slots are linked to the
user's exercises by name; slots whose exercise is missing are skipped.

Run from the Backend directory:

    python -m scripts.backfill_default_templates
"""

import asyncio

from sqlalchemy import select

from app.crud.workout_template import create_default_templates_for_user
from app.db import AsyncSessionLocal
from app.models.user import User
from app.models.workout_template import WorkoutTemplate


async def main() -> None:
    async with AsyncSessionLocal() as db:
        result = await db.execute(
            select(User.id)
            .outerjoin(WorkoutTemplate, WorkoutTemplate.user_id == User.id)
            .where(WorkoutTemplate.id.is_(None))
        )
        user_ids = [row[0] for row in result.all()]

        if not user_ids:
            print("No users are missing templates.")
            return

        for user_id in user_ids:
            await create_default_templates_for_user(db, user_id)
        await db.commit()

        print(f"Seeded default templates for {len(user_ids)} user(s): {user_ids}")


if __name__ == "__main__":
    asyncio.run(main())
