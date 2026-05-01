import os
from dataclasses import dataclass

@dataclass
class Config:
    BOT_TOKEN: str = os.getenv("BOT_TOKEN", "")
    ADMIN_IDS: list[int] = None

    def __post_init__(self):
        if self.ADMIN_IDS is None:
            raw = os.getenv("ADMIN_IDS", "")
            self.ADMIN_IDS = [int(x) for x in raw.split(",") if x.strip()]

config = Config()
