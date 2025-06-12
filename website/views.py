from flask import Blueprint, render_template, request, flash, jsonify, redirect, url_for, current_app
from sqlalchemy import func
from flask_login import  login_required, current_user
from .models import Song, User, Setlist, SetlistSong
from . import db
import json
from datetime import date, timedelta, datetime
from werkzeug.utils import secure_filename
import os


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
            tempo = data.get('tempo')
            singer_type = data.get('singer_type')
            holiday = data.get('holiday')
            file = request.files.get('pdf_file')
            pdf_url = ''

            if file and file.filename.endswith('.pdf'):
                filename = secure_filename(f"{title}_{artist}.pdf").replace(" ", "_")
                save_path = os.path.join(current_app.config['UPLOAD_FOLDER'], filename)
                file.save(save_path)
                pdf_url = f"/static/chords/{filename}"
        else:
            title = request.form.get('title')
            artist = request.form.get('artist')
            og_key = request.form.get('og_key')
            tempo = request.form.get('tempo')
            singer_type = request.form.get('singer_type')
            holiday = request.form.get('holiday')

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
            new_song = Song(
                title=title,
                artist=artist,
                og_key=og_key,
                tempo=tempo, 
                singer_type=singer_type,
                holiday=holiday,
                user_id = current_user.id,
                pdf_url=pdf_url
                )
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
    serialized_songs = [serialize_song(song) for song in songs]



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
        songs_json=serialized_songs,
        current_sort=sort_by,
        zip=zip
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
    this_weeks_setlist = [s for s in all_setlists if s.date_created == this_sunday]


    sundays = get_sundays()

    return render_template("setlist.html", setlists = all_setlists, this_week = this_weeks_setlist, user=current_user,layout_class = "auth-container", sundays=sundays)
    

@views.route('/add_to_setlist/<int:song_id>/<string:setlist_date>', methods = ['POST'])
@login_required
def add_to_setlist(song_id, setlist_date):
    print("Hit /add_to_setlist route")

    # Convert string to a date object
    try:
        date_obj = datetime.strptime(setlist_date, '%Y-%m-%d').date()
    except ValueError:
        return jsonify({'success': False, 'message': 'Invalid date format'}), 400
    
    setlist = Setlist.query.filter_by(user_id=current_user.id, date_created=date_obj).first()

    # Check if this setlist has been created yet
    if not setlist:
        setlist = Setlist(user_id = current_user.id, date_created=date_obj, name=date_obj.strftime("%B %d, %Y") + "'s Setlist")
        db.session.add(setlist)
        db.session.commit()


    if len(setlist.songs_link) >= 4:
        return jsonify({'success': False, 'message': 'Setlist is full!'}), 400

    # Check if song is already in the setlist

    existing_link = SetlistSong.query.filter_by(setlist_id=setlist.id, song_id=song_id).first()
    if existing_link:
         return jsonify({'success': False, 'message': 'Song is already in the setlist.'})



    # Create SetlistSong link with the correct position

    # Get the song object
    song = Song.query.get_or_404(song_id)
    last_position = db.session.query(func.max(SetlistSong.position))\
        .filter_by(setlist_id=setlist.id).scalar()
    new_position = (last_position or 0) + 1

    link = SetlistSong(setlist_id=setlist.id, song_id=song.id, position=new_position)
    db.session.add(link)
    db.session.commit()
    print("Current songs in setlist:", [link.song.title for link in setlist.songs_link])

    return jsonify({'success': True,
                    'message': 'Song added to the setlist!',
                    'song': {
                        'id': song.id,
                        'title': song.title,
                        'artist': song.artist,
                        'og_key': song.og_key,
                        'tempo' : song.tempo,
                        'holiday' : song.holiday,
                        'singer_type' : song.singer_type
                    } 
                    })

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


    song_to_delete = SetlistSong.query.filter_by(setlist_id=setlist.id, song_id=song_id).first()
    if song_to_delete:
        db.session.delete(song_to_delete)
        db.session.commit()
        return jsonify({'message': 'Song removed from setlist'})
    return jsonify({'success': True, 'message': 'Song removed from setlist'}), 200



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
    title = request.form.get('title')
    artist = request.form.get('artist')
    og_key = request.form.get('og_key')
    tempo = request.form.get('tempo')
    singer_type = request.form.get('singer_type')
    holiday = request.form.get('holiday')
    file = request.files.get('pdf_file')

    if request.form.get('delete_pdf') == 'true' and song.pdf_url:
        try:
            full_path = os.path.join(current_app.root_path, song.pdf_url.lstrip('/'))
            if os.path.exists(full_path):
                os.remove(full_path)
        except:
            pass
        song.pdf_url = None


    if file and file.filename.endswith('.pdf'):
        raw_name = f"{title}_{artist}".replace(" ", "_")
        filename = secure_filename(raw_name)[:50] + ".pdf"  # truncate + sanitize
        save_path = os.path.join(current_app.config['UPLOAD_FOLDER'], filename)
        file.save(save_path)
        song.pdf_url = f"/static/chords/{filename}"
    
    if not title or not artist or og_key not in music_keys:
        return jsonify({'success': False, 'message': 'Invalid Data'})
    
    song.title = title
    song.artist = artist
    song.og_key = og_key
    song.tempo = tempo
    song.singer_type = singer_type
    song.holiday = holiday

    

    db.session.commit()

    return jsonify({'success': True, 'message': 'Changes saved!', 'song': {
        'id': song.id,
        'title': song.title,
        'artist': song.artist,
        'og_key': song.og_key
    }})

@views.route('/update_setlist_order', methods = ['POST'])
@login_required
def update_setlist_order():
    data = request.get_json()
    song_ids = data.get('song_ids')
    setlist_date = data.get('setlist_date')

    setlist = Setlist.query.filter_by(user_id=current_user.id, date_created=setlist_date).first()
    if not setlist:
        return jsonify({'success': False, 'message': 'Setlist not found'}), 404

    for position, song_id in enumerate(song_ids, start=1):
        link = SetlistSong.query.filter_by(setlist_id=setlist.id, song_id=song_id).first()
        if link:
            link.position = position



    db.session.commit()
    return jsonify({'success': True, 'message': 'Order updated successfully'})

# Helper function to serialize each song

def serialize_song(song):
    return {
        'id': song.id,
        'title': song.title,
        'artist': song.artist,
        'og_key': song.og_key,
        'tempo': song.tempo,
        'singer_type': song.singer_type,
        'holiday': song.holiday,
        'pdf_url': song.pdf_url if hasattr(song, 'pdf_url') else ''
    }