// static/js/songsheet_editor.js
console.log('[editor] script loaded');
document.addEventListener('DOMContentLoaded', () => {
  const cp       = document.getElementById('chordpro');
  if (!cp) return; // only run on the editor page

  const prev     = document.getElementById('preview');
  const selT     = document.getElementById('transpose');
  const rootsEl  = document.getElementById('roots');
  const saveBtn  = document.getElementById('saveBtn');
  const keyInput = document.querySelector('.key-input');

  const SHARP_NOTES = ['C','C#','D','D#','E','F','F#','G','G#','A','A#','B'];
  const FLAT_NOTES  = ['C','Db','D','Eb','E','F','Gb','G','Ab','A','Bb','B'];

  const SHARP_KEYS = new Set(['G','D','A','E','B','F#','C#','Em','Bm','F#m','C#m','G#m','D#m','A#m']);
  const FLAT_KEYS  = new Set(['F','Bb','Eb','Ab','Db','Gb','Cb','Dm','Gm','Cm','Fm','Bbm','Ebm','Abm']);

  const MAJ_STEPS = [0,2,4,5,7,9,11]; 
  const MIN_STEPS = [0,2,3,5,7,8,10]; 

  function useFlatsForKey(k) {
    const K = normalizeKey(k);
    if (FLAT_KEYS.has(K)) return true;
    if (SHARP_KEYS.has(K)) return false;
    return /b/.test(K);
  }
  function normalizeKey(k){ return (k || 'C').trim(); }
  function isMinor(k){ return /m$/.test(normalizeKey(k)); }

  function noteIndex(note) {
    let i = SHARP_NOTES.indexOf(note);
    if (i !== -1) return i;
    return FLAT_NOTES.indexOf(note);
  }

  function transposeNote(note, steps, preferFlats) {
    const idx = noteIndex(note);
    if (idx < 0) return note; // unknown -> pass through
    const scale = preferFlats ? FLAT_NOTES : SHARP_NOTES;
    const newIdx = (idx + (steps % 12) + 12) % 12;
    return scale[newIdx];
  }

  function transposeKeyName(key, steps) {
    const preferFlats = useFlatsForKey(key);
    const minor = isMinor(key);
    const root = key.replace(/m$/,'');
    const newRoot = transposeNote(root, steps, preferFlats);
    return minor ? `${newRoot}m` : newRoot;
  }

  function diatonicChordsForKey(keyName) {
    const K = normalizeKey(keyName);
    const minor = isMinor(K);
    const preferFlats = useFlatsForKey(K);
    const tonic = K.replace(/m$/,'');
    const tonicIdx = noteIndex(tonic);
    if (tonicIdx < 0) return [];

    const steps = minor ? MIN_STEPS : MAJ_STEPS;
    const roots = steps.map(s => (preferFlats ? FLAT_NOTES : SHARP_NOTES)[(tonicIdx + s) % 12]);

    // Qualities by scale degree
    let qualities;
    if (!minor) {

      qualities = ['', 'm', 'm', '', '', 'm', 'dim'];
    } else {

      qualities = ['m','dim','','m','','','dim'];

      qualities[4] = '';
    }

    // Combine root + quality
    return roots.map((r,i) => ({
      label: r + qualities[i],
      insert: r + qualities[i]
    }));
  }

  /* ----------------- UI builders ----------------- */
  function buildChordPaletteForKey(keyName){
  if (!rootsEl) return;
  rootsEl.innerHTML = '';

  const items = diatonicChordsForKey(keyName);
  if (!items || !items.length) return;

  items.forEach(item => {
    // Support both shapes: "F", "Gm"  OR  {label:"F", insert:"F"}
    const label  = (typeof item === 'string') ? item : (item.label || item.insert);
    const value  = (typeof item === 'string') ? item : (item.insert || item.label);

    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'btn-root';
    btn.textContent = label;

    btn.onclick = () => {
      const finalChord = applyTogglesToChord(value);
      insertAtCursor('[' + finalChord + ']');
      renderPreview();
    };

    rootsEl.appendChild(btn);
  });
}
const buildPaletteForKey = (k) => buildChordPaletteForKey(k);

  /* ----------------- Preview & editing ----------------- */
  function getChordLib() {
  // handle different globals across builds
  return window.ChordSheetJS || window.chordsheetjs || null;
}


function injectChordSheetCss(){
  const CS = window.ChordSheetJS;
  if (!CS?.HtmlDivFormatter?.cssString) return;
  if (document.getElementById('csjs-style')) return;
  const style = document.createElement('style');
  style.id = 'csjs-style';
  style.textContent = CS.HtmlDivFormatter.cssString('.chordSheetViewer');
  document.head.appendChild(style);
}

function renderPreview(){
  if (!prev) return;
  const text  = cp.value || '';
  const steps = selT ? (parseInt(selT.value, 10) || 0) : 0;

  const CS = window.ChordSheetJS;
  if (!CS?.ChordProParser) {
    prev.innerHTML = '<em>Preview not available (ChordSheetJS not loaded)</em>';
    return;
  }

  try {
    const parser = new CS.ChordProParser();
    let song     = parser.parse(text);
    if (steps)   song = song.transpose(steps);           // v12: transpose on the Song
    injectChordSheetCss();
    const fmt    = new CS.HtmlDivFormatter({ showChords: 'top' });
    prev.innerHTML = fmt.format(song);                    // chords above lyrics
  } catch (e) {
    prev.innerHTML = '<em>Enter valid ChordPro…</em>';
  }
}


  document.getElementById('applyTranspose')?.addEventListener('click', () => {
  const steps = parseInt(selT?.value || '0', 10) || 0;
  if (!steps) { alert('Pick a transpose step first'); return; }

  // decide spelling (# vs b) from the target key
  const targetKey = transposeKeyName(BASE_KEY, steps);
  const preferFlats = useFlatsForKey(targetKey);

  // rewrite the textarea chords
  cp.value = transposeChordText(cp.value || '', steps, preferFlats);

  // commit: update key field, base key, palette, reset transpose, rerender
  if (keyInput) {
    keyInput.value = targetKey;
    BASE_KEY = targetKey;
  }
  if (selT) selT.value = '0';
  buildPaletteForKey(BASE_KEY);
  renderPreview();
});

  function insertAtCursor(text){
    const start = cp.selectionStart, end = cp.selectionEnd;
    cp.setRangeText(text, start, end, 'end');
    cp.focus();
  }

  function wrapSelection(){
    const start = cp.selectionStart, end = cp.selectionEnd;
    if (start===end) return;
    const sel = cp.value.slice(start, end);
    cp.setRangeText('['+sel+']', start, end, 'end');
    cp.focus();
    renderPreview();
  }

  function parseKey(k) {
  if (!k) return null;
  const m = /^([A-G])([#b]?)(m?)$/i.exec(k.trim());
  if (!m) return null;
  const root = (m[1] + (m[2] || '')).toUpperCase();
  const minor = !!m[3];
  return { root, minor };
}

// Smallest signed step difference from fromKey -> toKey (-6..+6)
function stepsBetweenKeys(fromKey, toKey) {
  const a = parseKey(fromKey), b = parseKey(toKey);
  if (!a || !b) return null;
  const ai = noteIndex(a.root), bi = noteIndex(b.root);
  if (ai < 0 || bi < 0) return null;
  let d = (bi - ai) % 12;
  if (d > 6) d -= 12;
  if (d < -6) d += 12;
  return d;
}

  function transposeChordText(chordproText, steps, preferFlats) {
  // [A][F#m][Bbmaj7][G/B][C#m7b5/G]
  const CHORD_RE = /\[([A-G])([#b]?)([^/\]\s]*)?(?:\/([A-G])([#b]?))?\]/g;
  return chordproText.replace(CHORD_RE, (_m, r, acc, rest = '', bassR, bassAcc) => {
    const newRoot = transposeNote(r + (acc || ''), steps, preferFlats);
    let bass = '';
    if (bassR) {
      const newBass = transposeNote(bassR + (bassAcc || ''), steps, preferFlats);
      bass = '/' + newBass;
    }
    return `[${newRoot}${rest}${bass}]`;
  });
}

function getToggleState() {
  return {
    m:    document.getElementById('q-m')?.checked || false,
    _7:   document.getElementById('q-7')?.checked || false,
    maj7: document.getElementById('q-maj7')?.checked || false,
    sus4: document.getElementById('q-sus4')?.checked || false,
    dim:  document.getElementById('q-dim')?.checked || false,
  };
}

// baseChord like "A", "Am", "Bb", "Edim"
function applyTogglesToChord(baseChord) {
  const m = /^([A-G][#b]?)(.*)$/.exec(baseChord);
  if (!m) return baseChord;
  const root = m[1];
  let qual = (m[2] || ''); // current quality from diatonic set

  const t = getToggleState();

  // Triad quality override (choose ONE): dim > m > (leave as-is)
  if (t.dim) qual = 'dim';
  else if (t.m) qual = 'm';

  // 7 vs maj7 (choose ONE, maj7 wins if both checked)
  if (t.maj7)      qual += 'maj7';
  else if (t._7)   qual += '7';

  // sus4 can coexist
  if (t.sus4) qual += 'sus4';

  return root + qual;
}


  // Qualities (optional) – you can keep using them for 7/maj7/sus4/dim overlays
  document.getElementById('q-clear')?.addEventListener('click', () => {
    ['q-m','q-7','q-maj7','q-sus4','q-dim'].forEach(id => { const el = document.getElementById(id); if (el) el.checked = false; });
  });
  document.getElementById('wrapSel')?.addEventListener('click', wrapSelection);

  // Shortcuts ;g ;f#m ;bbmaj7
  // Shortcuts ;g ;f#m ;bbmaj7 ;1-;7 (roman numeral shortcuts for current key)
const shortcutRegex = /;([a-gA-G])([#b]?)(m|maj7|sus4|dim|7)?$/;
const numeralRegex = /;([1-7])$/;

function expandShortcut(){
  const pos = cp.selectionStart;
  const left = cp.value.slice(0, pos);

  // Check for numeral shortcut first ;1-;7
  const nm = left.match(numeralRegex);
  if (nm) {
    const degree = parseInt(nm[1]) - 1; // 0-indexed
    const chords = diatonicChordsForKey(BASE_KEY);
    if (chords && chords[degree]) {
      const chord = chords[degree].insert || chords[degree];
      const newLeft = left.slice(0, left.length - nm[0].length) + `[${chord}]`;
      cp.value = newLeft + cp.value.slice(pos);
      cp.selectionStart = cp.selectionEnd = newLeft.length;
    }
    return;
  }

  // Existing letter shortcut ;g ;f#m etc
  const m = left.match(shortcutRegex);
  if (!m) return;
  let [all, root, accidental, qual] = m;
  root = root.toUpperCase();
  qual = qual || '';
  const newLeft = left.slice(0, left.length - all.length) + `[${root}${accidental}${qual}]`;
  cp.value = newLeft + cp.value.slice(pos);
  const newPos = newLeft.length;
  cp.selectionStart = cp.selectionEnd = newPos;
}

  // Live events
  cp.addEventListener('input', () => { expandShortcut(); renderPreview(); });

  // Keep a BASE key so transpose is relative to original, not cumulative
  let BASE_KEY = keyInput?.value?.trim() || 'C';

  selT?.addEventListener('change', () => {
    const steps = parseInt(selT.value,10) || 0;
    if (keyInput) {
      keyInput.value = transposeKeyName(BASE_KEY, steps);
      buildChordPaletteForKey(keyInput.value);
    }
    renderPreview();
  });

function applyTypedKey() {
  const newKey = (keyInput?.value || '').trim();
  const steps = stepsBetweenKeys(BASE_KEY, newKey);
  if (steps === null) {
    // invalid key typed
    if (keyInput) keyInput.value = BASE_KEY;
    return;
  }
  const preferFlats = useFlatsForKey(newKey);
  cp.value = transposeChordText(cp.value || '', steps, preferFlats);

  BASE_KEY = newKey;
  if (selT) selT.value = '0';
  buildChordPaletteForKey(BASE_KEY);   // <-- use the actual function name
  renderPreview();
}

// Apply on change, on blur, and when pressing Enter inside the field
keyInput?.addEventListener('change', applyTypedKey);
keyInput?.addEventListener('blur', applyTypedKey);
keyInput?.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') { e.preventDefault(); applyTypedKey(); }
});

cp.addEventListener('paste', (e) => {
  setTimeout(() => {
    const text = cp.value;
    const detectedKey = detectKeyFromChords(text);
    if (detectedKey && keyInput) {
      keyInput.value = detectedKey;
      BASE_KEY = detectedKey;
      buildPaletteForKey(BASE_KEY);
    }
    renderPreview();
  }, 10);
});

function detectKeyFromChords(text) {
  // Extract all chords from brackets
  const chords = [...text.matchAll(/\[([A-G][#b]?)(m|maj7|7|sus4|sus|dim)?\]/g)].map(m=>m[1] + (m[2] === 'm' ? 'm' : ''));

  if (chords.length === 0) return null;

  return chords[0];
};

  // Initial
  buildChordPaletteForKey(BASE_KEY);
  renderPreview();

  // Save
  saveBtn?.addEventListener('click', async () => {
    const saveUrl = saveBtn.dataset.saveUrl;
    if (!saveUrl) return alert('Missing save URL');
    const payload = {
      title:  document.querySelector('.song-title')?.value || '',
      artist: document.querySelector('.artist-input')?.value || '',
      key:    keyInput?.value || '',
      chordpro: cp.value || ''
    };
    try{
      const res = await fetch(saveUrl, { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(payload) });
      alert(res.ok ? 'Saved' : 'Save failed');
    }catch{ alert('Save failed'); }
  });


  document.getElementById("chordpro").addEventListener("keydown", function(e) {
    if (e.key == "Tab") {
        e.preventDefault();
        const start = this.selectionStart;
        const end = this.selectionEnd;
        this.value = this.value.substring(0, start) + "\t" + this.value.substring(end);
        this.selectionStart = this.selectionEnd + 1;
    }
});
});
