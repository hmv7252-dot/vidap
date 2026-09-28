import aiosqlite
from datetime import datetime, date
from typing import Optional, Dict, Any, List
from app.config import DATABASE_PATH, INITIAL_FREE_CREDITS, DAILY_FREE_CREDITS

async def init_db():
    async with aiosqlite.connect(DATABASE_PATH) as db:
        await db.execute("""
            CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                device_id TEXT UNIQUE NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                last_active_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        """)

        await db.execute("""
            CREATE TABLE IF NOT EXISTS credits (
                user_id INTEGER PRIMARY KEY,
                free_credits INTEGER NOT NULL DEFAULT 3,
                paid_credits INTEGER NOT NULL DEFAULT 0,
                FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
            );
        """)

        await db.execute("""
            CREATE TABLE IF NOT EXISTS daily_usage (
                user_id INTEGER NOT NULL,
                date TEXT NOT NULL,
                free_generations INTEGER NOT NULL DEFAULT 0,
                PRIMARY KEY (user_id, date),
                FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
            );
        """)

        await db.execute("""
            CREATE TABLE IF NOT EXISTS generations (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER NOT NULL,
                job_id TEXT UNIQUE NOT NULL,
                prompt TEXT NOT NULL,
                negative_prompt TEXT,
                aspect_ratio TEXT,
                duration INTEGER,
                status TEXT NOT NULL DEFAULT 'queued',
                video_path TEXT,
                thumbnail_path TEXT,
                credit_used INTEGER DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                completed_at TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
            );
        """)
        await db.commit()

async def get_or_create_user(device_id: str) -> Dict[str, Any]:
    today = date.today().isoformat()
    async with aiosqlite.connect(DATABASE_PATH) as db:
        db.row_factory = aiosqlite.Row
        cursor = await db.execute("SELECT * FROM users WHERE device_id = ?", (device_id,))
        user = await cursor.fetchone()
        
        if not user:
            # Create new user with INITIAL_FREE_CREDITS
            cursor = await db.execute(
                "INSERT INTO users (device_id, last_active_at) VALUES (?, CURRENT_TIMESTAMP)",
                (device_id,)
            )
            user_id = cursor.lastrowid
            await db.execute(
                "INSERT INTO credits (user_id, free_credits, paid_credits) VALUES (?, ?, ?)",
                (user_id, INITIAL_FREE_CREDITS, 0)
            )
            await db.commit()
            free_credits = INITIAL_FREE_CREDITS
            paid_credits = 0
            created_at = datetime.utcnow().isoformat()
        else:
            user_id = user["id"]
            created_at = user["created_at"]
            await db.execute("UPDATE users SET last_active_at = CURRENT_TIMESTAMP WHERE id = ?", (user_id,))
            
            # Fetch credits
            c_cur = await db.execute("SELECT free_credits, paid_credits FROM credits WHERE user_id = ?", (user_id,))
            c_row = await c_cur.fetchone()
            free_credits = c_row["free_credits"] if c_row else 0
            paid_credits = c_row["paid_credits"] if c_row else 0

            # Check daily free replenishment if free_credits == 0
            d_cur = await db.execute(
                "SELECT free_generations FROM daily_usage WHERE user_id = ? AND date = ?",
                (user_id, today)
            )
            d_row = await d_cur.fetchone()
            daily_used = d_row["free_generations"] if d_row else 0

            if free_credits == 0 and daily_used < DAILY_FREE_CREDITS:
                # Add daily free credit
                free_credits += DAILY_FREE_CREDITS
                await db.execute("UPDATE credits SET free_credits = ? WHERE user_id = ?", (free_credits, user_id))
                await db.commit()

        # Check daily status
        d_cur = await db.execute(
            "SELECT free_generations FROM daily_usage WHERE user_id = ? AND date = ?",
            (user_id, today)
        )
        d_row = await d_cur.fetchone()
        daily_used = d_row["free_generations"] if d_row else 0
        daily_free_available = daily_used < DAILY_FREE_CREDITS

        return {
            "user_id": user_id,
            "device_id": device_id,
            "free_credits": free_credits,
            "paid_credits": paid_credits,
            "total_credits": free_credits + paid_credits,
            "daily_free_available": daily_free_available,
            "created_at": str(created_at)
        }
