import os
BASE_DIR = os.path.abspath(os.path.dirname(__file__))
INSTANCE_DIR = os.path.join(BASE_DIR, "instance")
SQLITE_PATH = os.path.join(INSTANCE_DIR, "database.db")

class Base:
    SECRET_KEY = os.getenv("SECRET_KEY", "dev-insecure")
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    MAX_CONTENT_LENGTH = 16 * 1024 * 1024 # 16MB limit

class Dev(Base):
    SQLALCHEMY_DATABASE_URI = os.getenv("DATABASE_URL", f"sqlite:///{SQLITE_PATH}")

class Prod(Base):
    SQLALCHEMY_DATABASE_URI = os.getenv("DATABASE_URL")
    SESSION_COOKIE_SECURE = True
    SESSION_COOKIE_HTTPONLY = True
    SESSION_COOKIE_SAMESITE = "Lax"
    REMEMBER_COOKIE_SECURE = True
    REMEMBER_COOKIE_HTTPONLY = True
    REMEMBER_COOKIE_SAMESITE = "Lax"

def pick():
    return Dev if os.getenv("FLASK_ENV", "production") == "development" else Prod