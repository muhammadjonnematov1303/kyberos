import sqlite3
import os

DB_PATH = os.getenv("DB_PATH", "contest.db")

def get_conn():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    conn = get_conn()
    conn.execute("""
        CREATE TABLE IF NOT EXISTS participants (
            user_id INTEGER PRIMARY KEY,
            username TEXT,
            first_name TEXT,
            joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """)
    conn.execute("""
        CREATE TABLE IF NOT EXISTS contests (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            channel_username TEXT,
            channel_id INTEGER,
            winner_id INTEGER,
            winner_username TEXT,
            winner_first_name TEXT,
            message_id INTEGER,
            status TEXT DEFAULT 'pending',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """)
    conn.commit()
    conn.close()

def add_participant(user_id, username, first_name):
    conn = get_conn()
    try:
        conn.execute(
            "INSERT OR IGNORE INTO participants (user_id, username, first_name) VALUES (?, ?, ?)",
            (user_id, username, first_name)
        )
        conn.commit()
        return True
    finally:
        conn.close()

def get_participants():
    conn = get_conn()
    try:
        return conn.execute("SELECT * FROM participants").fetchall()
    finally:
        conn.close()

def clear_participants():
    conn = get_conn()
    try:
        conn.execute("DELETE FROM participants")
        conn.commit()
    finally:
        conn.close()

def participant_count():
    conn = get_conn()
    try:
        return conn.execute("SELECT COUNT(*) FROM participants").fetchone()[0]
    finally:
        conn.close()

def save_contest(channel_username, channel_id, winner_id, winner_username, winner_first_name, message_id):
    conn = get_conn()
    try:
        conn.execute(
            "INSERT INTO contests (channel_username, channel_id, winner_id, winner_username, winner_first_name, message_id, status) VALUES (?, ?, ?, ?, ?, ?, 'completed')",
            (channel_username, channel_id, winner_id, winner_username, winner_first_name, message_id)
        )
        conn.commit()
    finally:
        conn.close()
