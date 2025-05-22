from flask import Blueprint, render_template, request, flash, jsonify, redirect, url_for
from sqlalchemy import func
from flask_login import  login_required, current_user
from .models import Song
from . import db
import json

views = Blueprint('views', __name__)
music_keys = [
    "C", "G", "D", "A", "E", "B", "F#", "C#",  # sharp major keys
    "F", "Bb", "Eb", "Ab", "Db", "Gb", "Cb",  # flat major keys
    "Am", "Em", "Bm", "F#m", "C#m", "G#m", "D#m", "A#m",  # sharp minor keys
    "Dm", "Gm", "Cm", "Fm", "Bbm", "Ebm", "Abm"  # flat minor keys
]

@views.route('/', methods = ['GET', 'POST'])
@login_required
def home():
    if request.method == 'POST':
        title = request.form.get('title')
        artist = request.form.get('artist')
        og_key = request.form.get('og_key')

        if not title or len(title) < 1:
            flash('Song title is too short!', category ='error')
            return redirect(url_for('views.home')) 
        if og_key not in music_keys:
            flash('Not a possible key!', category="error")
            return redirect(url_for('views.home')) 
        #Check if song is already added by the SAME artist
        existing_song = Song.query.filter(
            func.lower(Song.title) == title.lower(),
            func.lower(Song.artist) == artist.lower(),
            Song.user_id == current_user.id
        ).first()
        if existing_song:
            flash("This song by this artist has already been added!", category="error")
        else:
            new_song = Song(title=title, artist=artist, og_key=og_key, user_id = current_user.id)
            db.session.add(new_song)
            db.session.commit()
            flash("Song added!", category='success')

    return render_template("home.html", user = current_user)

@views.route('/delete-song', methods=['POST'])
@login_required
def delete_song():
    song = json.loads(request.data)
    songId = song['songId']
    song = Song.query.get(songId)
    if song:
        if song.user_id == current_user.id:
            db.session.delete(song)
            db.session.commit()
    return jsonify({})