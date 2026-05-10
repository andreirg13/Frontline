console.log("PLAYER SCRIPT HAS LOADED");

document.addEventListener("DOMContentLoaded", () => {
  const display = document.getElementById("chordSheetDisplay");
  const transposeSelect = document.getElementById("transposeSelect");
  const keyDisplay = document.getElementById("keyDisplay");
  const currKey = document.getElementById("currentKey");
  const lyricsOnlyToggle = document.getElementById("lyricsOnlyToggle");

  let steps = 0;

  const SHARP_NOTES = [
    "C",
    "C#",
    "D",
    "D#",
    "E",
    "F",
    "F#",
    "G",
    "G#",
    "A",
    "A#",
    "B",
  ];
  const FLAT_NOTES = [
    "C",
    "Db",
    "D",
    "Eb",
    "E",
    "F",
    "Gb",
    "G",
    "Ab",
    "A",
    "Bb",
    "B",
  ];
  const SHARP_KEYS = new Set([
    "C",
    "G",
    "D",
    "A",
    "E",
    "B",
    "F#",
    "C#",
    "Am",
    "Em",
    "Bm",
    "F#m",
    "C#m",
    "G#m",
    "D#m",
    "A#m",
  ]);
  const FLAT_KEYS = new Set([
    "C",
    "F",
    "Bb",
    "Eb",
    "Ab",
    "Db",
    "Gb",
    "Cb",
    "Am",
    "Dm",
    "Gm",
    "Cm",
    "Fm",
    "Bbm",
    "Ebm",
    "Abm",
  ]);

  function useFlatsForKey(k) {
    const K = (k || "C").trim();
    if (FLAT_KEYS.has(K)) return true;
    if (SHARP_KEYS.has(K)) return false;
    return /b/.test(K);
  }

  function noteIndex(note) {
    let i = SHARP_NOTES.indexOf(note);
    if (i !== -1) return i;
    return FLAT_NOTES.indexOf(note);
  }

  function transposeNote(note, steps, preferFlats) {
    const idx = noteIndex(note);
    if (idx < 0) return note;
    const scale = preferFlats ? FLAT_NOTES : SHARP_NOTES;
    const newIdx = (idx + (steps % 12) + 12) % 12;
    return scale[newIdx];
  }

  function transposeKeyName(key, steps) {
    const preferFlats = useFlatsForKey(key);
    const minor = /m$/.test(key);
    const root = key.replace(/m$/, "");
    const newRoot = transposeNote(root, steps, preferFlats);
    return minor ? `${newRoot}m` : newRoot;
  }

  function stripChordsFromChordPro(text) {
    // remove [C], [G/B], etc; drop barlines; squeeze spaces
    return text
      .replace(/\[[^\]]+\]/g, "") // chords in [ ]
      .replace(/[|]/g, "") // barlines
      .replace(/[ \t]+/g, " ") // collapse spaces
      .replace(/ *\n/g, "\n"); // trim line ends
  }

  function renderChordSheet(steps, lyricsOnly = false) {
    console.log(
      "sheetData value:",
      SONG_DATA.sheetData,
      typeof SONG_DATA.sheetData,
    );
    const CS = window.ChordSheetJS;
    if (!SONG_DATA.sheetData || SONG_DATA.sheetData.trim() === "") {
      display.innerHTML =
        '<p style="color: #999; padding: 20px;">No chord sheet for this song yet.</p>';
      return;
    }
    if (!CS?.ChordProParser) {
      display.innerHTML =
        '<p style="color: #999;">ChordSheetPro JS Not Loaded.</p>';
      return;
    }

    try {
      const parser = new CS.ChordProParser();
      let source = SONG_DATA.sheetData;

      if (lyricsOnly) source = stripChordsFromChordPro(source);

      let song = parser.parse(source);

      if (steps !== 0 && !lyricsOnly) {
        song = song.transpose(steps);
      }

      const formatter = lyricsOnly
        ? new CS.TextFormatter()
        : new CS.HtmlDivFormatter({ showChords: "top" });

      const out = formatter.format(song);
      if (lyricsOnly) {
        display.textContent = out; // TextFormatter returns plain text
      } else {
        display.innerHTML = out;
      }

      const newKey = transposeKeyName(SONG_DATA.originalKey, steps);
      currKey.textContent = newKey;
      if (keyDisplay) {
        keyDisplay.textContent = newKey;
      }
    } catch (e) {
      console.error("Render error: ", e);
      display.innerHTML =
        '<p style="color: #999;">Error rendering chord sheet</p>';
    }
  }

  // Transpose change handler
  transposeSelect?.addEventListener("change", (e) => {
    steps = parseInt(e.target.value, 10) || 0;
    renderChordSheet(steps, !!lyricsOnlyToggle?.checked);
  });

  lyricsOnlyToggle?.addEventListener("change", () => {
    renderChordSheet(steps, !!lyricsOnlyToggle.checked);
  });

  const el = document.getElementById("chordSheetDisplay");
  document.getElementById("toggleCompact")?.addEventListener("change", (e) => {
    el.classList.toggle("compact", e.target.checked);
  });

  renderChordSheet(0); // initial render
});
