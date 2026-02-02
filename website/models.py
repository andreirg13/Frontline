from . import db
from flask_login import UserMixin
from sqlalchemy.sql import func
from datetime import date

class Song(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(150))
    artist = db.Column(db.String(150))
    og_key = db.Column(db.String(10))
    date = db.Column(db.DateTime(timezone=True), default=func.now())
    user_id = db.Column(db.Integer,db.ForeignKey('user.id'))

    # filterables

    tempo = db.Column(db.String(20)) # e.g. 'Fast', 'Slow'
    singer_type = db.Column(db.String(10)) # 'Male' or 'Female'
    holiday = db.Column(db.String(20))  # 'Christmas', 'Easter', 'Palm Sunday' etc.
    sheet_data = db.Column(db.Text, nullable=True)
    





class User(db.Model, UserMixin):
    id = db.Column(db.Integer, primary_key=True)
    email = db.Column(db.String(150), unique=True, nullable = False)
    password = db.Column(db.String(150), nullable = False)
    first_name = db.Column(db.String(150))
    song = db.relationship('Song')

# Association Table
class SetlistSong(db.Model):
    __tablename__ = 'setlist_song'
    id = db.Column(db.Integer, primary_key=True)
    setlist_id = db.Column(db.Integer, db.ForeignKey('setlist.id'))
    song_id = db.Column(db.Integer, db.ForeignKey('song.id'))
    position = db.Column(db.Integer)  # ✅ new field to store order

    song = db.relationship('Song')

class Setlist(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'))
    date_created = db.Column(db.Date, default=date.today)       # The sunday that the setlist is intended for 
    name = db.Column(db.String(150))

    songs_link = db.relationship('SetlistSong', backref='setlist', cascade="all, delete-orphan", order_by='SetlistSong.position')