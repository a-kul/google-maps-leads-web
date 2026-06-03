import time

from sqlalchemy import create_engine
from sqlalchemy.exc import OperationalError
from sqlalchemy.orm import sessionmaker

from .config import settings

engine = create_engine(settings.database_url, pool_pre_ping=True)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def init_db() -> None:
    from .models import Base

    for attempt in range(10):
        try:
            Base.metadata.create_all(bind=engine)
            return
        except OperationalError:
            if attempt == 9:
                raise
            time.sleep(2**attempt)
