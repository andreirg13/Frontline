from flask import Flask
from flask_migrate import Migrate
from flask_sqlalchemy import SQLAlchemy
from os import path
from flask_login import LoginManager
from config import pick
import os

db = SQLAlchemy()
DB_NAME = "database.db"

def create_app():
    app = Flask(__name__, instance_relative_config=True)

    # Ensure instance/ exists for SQLite file creation
    os.makedirs(app.instance_path, exist_ok=True)

    app.config.from_object(pick())

    # If we're on SQLite, force an absolute path under instance/
    if (app.config.get("SQLALCHEMY_DATABASE_URI", "") or "").startswith("sqlite:///"):
        db_file = os.path.join(app.instance_path, "database.db")
        db_uri = "sqlite:///" + db_file.replace("\\", "/")  # <<< normalize for Windows
        app.config["SQLALCHEMY_DATABASE_URI"] = db_uri
        print("Using SQLite at:", app.config["SQLALCHEMY_DATABASE_URI"])

    # uploads (unchanged)
    upload_folder = os.path.join(app.root_path, 'static', 'chords')
    os.makedirs(upload_folder, exist_ok=True)
    app.config['UPLOAD_FOLDER'] = upload_folder

    db.init_app(app)

    from .views import views
    from .auth import auth
    app.register_blueprint(views, url_prefix='/')
    app.register_blueprint(auth, url_prefix='/')

    from .models import User, Song
    Migrate(app, db)

    # Create tables once for SQLite dev
    if app.config['SQLALCHEMY_DATABASE_URI'].startswith("sqlite:///"):
        create_sqlite(app)

    login_manager = LoginManager()
    login_manager.login_view = 'auth.login'
    login_manager.init_app(app)

    @login_manager.user_loader
    def load_user(id):
        return User.query.get(int(id))


    return app

def create_sqlite(app):
    db_path = os.path.join(app.instance_path, "database.db")
    os.makedirs(app.instance_path, exist_ok=True)
    if not os.path.exists(db_path):
        with app.app_context():
            db.create_all()
        print('Created Database at: ', db_path)