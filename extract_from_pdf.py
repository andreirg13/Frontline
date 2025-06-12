import os
import csv
from PyPDF2 import PdfReader, PdfWriter

PDF_PATH = "Songsheets A-G (2).pdf"
CSV_PATH = "full_seed_songs.csv"
OUTPUT_FOLDER = "website/static/chords"

songs_data = [
    (0, 0), (1, 1), (2, 2), (3, 3), (4, 4), (5, 6), (7, 7), (8, 8), (9, 9),
    (10, 10), (11, 11), (12, 12), (13, 13), (14, 14), (15, 15), (16, 16),
    (17, 17), (18, 18), (19, 19), (20, 20), (21, 21), (22, 23), (24, 24),
    (25, 25), (26, 26), (27, 27), (28, 29), (30, 30), (31, 31), (32, 32),
    (33, 33), (34, 34), (35, 36), (37, 37), (38, 38), (39, 39), (40, 40)
]


os.makedirs(OUTPUT_FOLDER, exist_ok=True)

reader = PdfReader(PDF_PATH)

with open(CSV_PATH, newline='', encoding="utf-8") as csvfile:
    reader_csv = csv.DictReader(csvfile)
    for idx, row in enumerate(reader_csv):
        title = row['title'].strip()
        pdf_url = row['pdf_url'].strip()
        filename = os.path.basename(pdf_url)
        filepath = os.path.join(OUTPUT_FOLDER, filename)

        try:
            start_page, end_page = songs_data[idx]
        except IndexError:
            print(f"Skipping '{title}' — no page range in songs_data.")
            continue

        writer = PdfWriter()
        for i in range(start_page, end_page + 1):
            writer.add_page(reader.pages[i])

        with open(filepath, "wb") as out_file:
            writer.write(out_file)
        print(f"Saved: {filepath}")