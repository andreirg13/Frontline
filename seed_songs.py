import csv
from website import db, create_app
from website.models import Song
from flask_login import current_user

app = create_app()

with app.app_context():
    with open('full_seed_songs.csv', newline='', encoding='utf-8') as csvfile:
        reader = csv.DictReader(csvfile)
        for row in reader:
            song = Song(
            title=row['title'].strip(),
            artist=row['artist'].strip(),
            og_key=row['og_key'].strip(),
            user_id=1
            )
            db.session.add(song)
        db.session.commit()
        print("Songs seeded successfully")