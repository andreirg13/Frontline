from flask import Blueprint, render_template, request, flash, jsonify, redirect, url_for
from sqlalchemy import func
from flask_login import  login_required, current_user
from .models import Song, User, Setlist
from . import db
import json
from datetime import date, timedelta, datetime

views = Blueprint('views', __name__)
music_keys = [
    # Major keys (with sharps and flats)
    "C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B", "Bb", "Eb", "Ab", "Db", "Gb", "Cb", 
    
    # Minor keys (with sharps and flats)
    "Am", "A#m", "Bm", "Cm", "C#m", "Dm", "D#m", "Em", "F#m", "Gm", "G#m", "Abm", "Bbm", "Ebm"
]

@views.route('/', methods = ['GET', 'POST'])
@login_required
def home():
    if request.method == 'POST':
        if request.is_json:
            data = request.get_json()
            title = data.get('title')
            artist = data.get('artist')
            og_key = data.get('og_key')
        else:
            title = request.form.get('title')
            artist = request.form.get('artist')
            og_key = request.form.get('og_key')

        if not title or len(title) < 1:
            return jsonify({'success': False, 'message': 'Song title is too short!'}) 
        if og_key not in music_keys:
            return jsonify({'success': False, 'message': 'Not a possible key.'}) 
        # Check if song is already added by the SAME artist
        existing_song = Song.query.filter(
            func.lower(Song.title) == title.lower(),
            func.lower(Song.artist) == artist.lower(),
            Song.user_id == current_user.id
        ).first()
        if existing_song:
            return jsonify({'success': False, 'message': 'Song is already in the library.'})
        else:
            new_song = Song(title=title, artist=artist, og_key=og_key, user_id = current_user.id)
            db.session.add(new_song)
            db.session.commit()
            return jsonify({'success': True, 'message': 'Song Added!'})

    

    
    # RENDER SORTING
    #

    sort_by = request.args.get('sort', 'title')

    song_query = Song.query.filter_by(user_id=current_user.id)

    if sort_by == 'artist':
        song_query = song_query.order_by(Song.artist.asc())
    if sort_by == 'title':
        song_query = song_query.order_by(Song.title.asc())

    songs = song_query.all()




    today = date.today()
    this_sunday = today + timedelta(days=(6 - today.weekday()))
    setlist = Setlist.query.filter_by(user_id=current_user.id, date_created=this_sunday).first()
    setlist_songs = setlist.songs_link if setlist else []

    sundays = get_sundays()
    return render_template(
        "home.html",
        user = current_user,
        layout_class = "home-container",
        sundays=sundays,
        setlist_songs=setlist_songs,
        songs=songs,
        current_sort=sort_by
        )

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

@views.route('/viewSetlist', methods = ['GET', 'POST'])
@login_required
def viewSetlist():
    setlist_songs = Setlist.query.filter_by(user_id=current_user.id).all()

    today = date.today()
    this_sunday = today + timedelta(days=(6 - today.weekday()))

    two_months_ago = date.today() - timedelta(days=60)

    all_setlists = Setlist.query.filter(
        Setlist.user_id == current_user.id,
        Setlist.date_created >= two_months_ago
        ).order_by(Setlist.date_created.desc()).all()
    this_weeks_setlist = Setlist.query.filter_by(user_id=current_user.id, date_created=this_sunday).all()

    sundays = get_sundays()

    return render_template("setlist.html", setlists = all_setlists, this_week = this_weeks_setlist, user=current_user,layout_class = "auth-container", sundays=sundays)
    

@views.route('/add_to_setlist/<int:song_id>/<string:setlist_date>', methods = ['POST'])
@login_required
def add_to_setlist(song_id, setlist_date):

    # Convert string to date
    try:
        date_obj = datetime.strptime(setlist_date, '%Y-%m-%d').date()
    except ValueError:
        return jsonify({'success': False, 'message': 'Invalid date format'}), 400
    
    setlist =Setlist.query.filter_by(user_id=current_user.id, date_created=date_obj).first()

    # Check if this setlist has been created yet
    if not setlist:
        setlist = Setlist(user_id = current_user.id, date_created=date_obj, name=date_obj.strftime("%B %d, %Y") + "'s Setlist")
        db.session.add(setlist)
        db.session.commit()

    if len(setlist.songs) >= 4:
        return jsonify({'success': False, 'message': 'Setlist is full!'}), 400

    # Get the song object
    song = Song.query.get_or_404(song_id)

    # Create the setlist if not created yet

    if song not in setlist.songs:
        setlist.songs.append(song)
        db.session.commit()
        return jsonify({'success': True,
                        'message': 'Song added to the setlist!',
                        'song': {
                            'id': song.id,
                            'title': song.title,
                            'artist': song.artist,
                            'og_key': song.og_key
                        } 
                        })
    else:
        return jsonify({'success': False, 'message': 'Song is already in the setlist.'})

@views.route('/delete-from-setlist/<int:song_id>/<string:setlist_date>', methods=['POST'])
@login_required
def delete_from_setlist(song_id,setlist_date):
    # Convert string to date
    try:
        date_obj = datetime.strptime(setlist_date, '%Y-%m-%d').date()
    except ValueError:
        return jsonify({'success': False, 'message': 'Invalid date format'}), 400


    setlist = Setlist.query.filter_by(user_id=current_user.id, date_created=date_obj).first()
    song = Song.query.get(song_id)

    if not setlist:
        return jsonify({'message': "No setlist found"}), 404

    song = Song.query.get(song_id)

    if song in setlist.songs:
        setlist.songs.remove(song)
        db.session.commit()
        return jsonify({'message': 'Song removed from setlist'})
    return jsonify({'message': 'Song not in setlist'}), 404


def get_sundays(num_weeks_before=6, num_weeks_after=10):
    today = date.today()

    recent_sunday = today - timedelta(days=today.weekday() + 1) if today.weekday() != 6 else today

    sundays = []
    for i in range(-num_weeks_before, num_weeks_after + 1):
        sundays.append(recent_sunday + timedelta(weeks=i))
    return sundays

@views.route('/edit-song/<int:song_id>', methods = ['POST'])
@login_required
def edit_song (song_id):
    # Get the song id
    song = Song.query.get(song_id)
    if not song:
        return jsonify({'success': False, 'message': 'Song not found'}), 404

    if song.user_id != current_user.id:
        return jsonify({'success': False, 'message': 'Unauthorized'}), 403
    
    # Get updated data from request form
    data = request.get_json()
    if not data:
        return jsonify({'success': False, 'message': 'No data provided'}), 400
    
    title = data.get('title')
    artist = data.get('artist')
    og_key = data.get('og_key')

    if not title or not artist or og_key not in music_keys:
        return jsonify({'success': False, 'message': 'Invalid Data'})
    
    song.title = title
    song.artist = artist
    song.og_key = og_key

    db.session.commit()

    return jsonify({'success': True, 'message': 'Changes saved!', 'song': {
        'id': song.id,
        'title': song.title,
        'artist': song.artist,
        'og_key': song.og_key
    }})