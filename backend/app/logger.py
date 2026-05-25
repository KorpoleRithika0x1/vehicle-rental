import logging
import os
import sys
from pathlib import Path

from loguru import logger

from app.config import get_settings


LOG_DIR = Path(__file__).resolve().parents[1] / "logs"


class InterceptHandler(logging.Handler):
    def emit(self, record: logging.LogRecord) -> None:
        try:
            level = logger.level(record.levelname).name
        except ValueError:
            level = record.levelno
        logger.bind(logger_name=record.name).opt(depth=6, exception=record.exc_info).log(level, record.getMessage())


def setup_logger():
    settings = get_settings()
    os.makedirs(LOG_DIR, exist_ok=True)
    logger.remove()
    logger.add(
        sys.stdout,
        format="{time:YYYY-MM-DD HH:mm:ss} | {level} | {name}:{line} | {message}",
        level=settings.log_level.upper(),
    )
    logger.add(
        str(LOG_DIR / "app.log"),
        format="{time} | {level} | {name}:{line} | {message}",
        level="DEBUG",
        rotation="10 MB",
        retention="7 days",
        serialize=True,
    )

    intercept_handler = InterceptHandler()
    logging.basicConfig(handlers=[intercept_handler], level=0, force=True)
    for logger_name in ("uvicorn", "uvicorn.error", "uvicorn.access", "sqlalchemy.engine"):
        logging.getLogger(logger_name).handlers = [intercept_handler]
        logging.getLogger(logger_name).propagate = False

    return logger
