import aiosqlite
from datetime import date
from fastapi import HTTPException
from app.config import DATABASE_PATH, DAILY_FREE_CREDITS

class CreditManager:
    @staticmethod
    async def reserve_credit(user_id: int) -> str:
        """
        Reserves 1 credit (preferring free_credits, then paid_credits).
        Returns credit type used ('free' or 'paid').
        Raises 402 HTTPException if no credits available.
        """
        async with aiosqlite.connect(DATABASE_PATH) as db:
            db.row_factory = aiosqlite.Row
            cursor = await db.execute(
                "SELECT free_credits, paid_credits FROM credits WHERE user_id = ?",
                (user_id,)
            )
            row = await cursor.fetchone()
            if not row or (row["free_credits"] <= 0 and row["paid_credits"] <= 0):
                raise HTTPException(
                    status_code=402,
                    detail="Insufficient video credits. You have 0 credits remaining."
                )

            free = row["free_credits"]
            paid = row["paid_credits"]

            if free > 0:
                credit_type = "free"
                await db.execute(
                    "UPDATE credits SET free_credits = free_credits - 1 WHERE user_id = ?",
                    (user_id,)
                )
            else:
                credit_type = "paid"
                await db.execute(
                    "UPDATE credits SET paid_credits = paid_credits - 1 WHERE user_id = ?",
                    (user_id,)
                )

            await db.commit()
            return credit_type

    @staticmethod
    async def refund_credit(user_id: int, credit_type: str):
        """Refunds the reserved credit upon generation failure."""
        async with aiosqlite.connect(DATABASE_PATH) as db:
            if credit_type == "free":
                await db.execute(
                    "UPDATE credits SET free_credits = free_credits + 1 WHERE user_id = ?",
                    (user_id,)
                )
            else:
                await db.execute(
                    "UPDATE credits SET paid_credits = paid_credits + 1 WHERE user_id = ?",
                    (user_id,)
                )
            await db.commit()

    @staticmethod
    async def finalize_credit_deduction(user_id: int, credit_type: str):
        """Records usage when generation succeeds."""
        if credit_type == "free":
            today = date.today().isoformat()
            async with aiosqlite.connect(DATABASE_PATH) as db:
                await db.execute("""
                    INSERT INTO daily_usage (user_id, date, free_generations)
                    VALUES (?, ?, 1)
                    ON CONFLICT(user_id, date) DO UPDATE SET
                    free_generations = free_generations + 1
                """, (user_id, today))
                await db.commit()

    @staticmethod
    async def add_credits(user_id: int, amount: int, is_paid: bool = False):
        async with aiosqlite.connect(DATABASE_PATH) as db:
            column = "paid_credits" if is_paid else "free_credits"
            await db.execute(
                f"UPDATE credits SET {column} = {column} + ? WHERE user_id = ?",
                (amount, user_id)
            )
            await db.commit()
