let currentPdfUrl = '';
function showToast(message) {
    const toast = document.getElementById('toast');
    toast.textContent = message;
    console.log("TOAST", message);
    toast.classList.remove('hidden');
    toast.classList.add('toast-show');

    setTimeout(() => {
        toast.classList.remove('toast-show');
        toast.classList.add('hidden');
    }, 2500);
}

function deleteSong(songId) {
    fetch('/delete-song', {
        method: 'POST',
        body: JSON.stringify({ songId: songId }),
    }).then((_res) => {
        window.location.href="/";
    });
}


function getSelectedDate() {
    const select = document.querySelector('#setlist-date-dropdown');
    return select ? select.value : null;
}


function addToSetlist(songId, setlistDate) {
    console.log("setlist date is: ", setlistDate)
    const date = getSelectedDate();
    const upcomingSunday = getThisSundayDate();

    fetch (`/add_to_setlist/${songId}/${setlistDate}`, {
        method: 'POST',
    }).then(res => res.json())
        .then(data => {
        showToast(data.message);  // e.g., "Song added to setlist"

        if(data.success) {
            if (setlistDate === upcomingSunday) {
            const setlistSidebar = document.getElementById('sb-setlist');
            if (setlistSidebar) {
                const newItem = document.createElement('div');
                newItem.classList.add("setlist-item");
                newItem.innerHTML = `
                <div class="sb-song-title">${data.song.title}</div>
                <div class="sb-song-artist">${data.song.artist}</div>
                `;
                setlistSidebar.appendChild(newItem);
    }
}
}
    })
    .catch(error => {
        console.error('Error adding to setlist', error);
    })
};





function openEditForm(songId, title, artist, og_key, tempo, singer_type, holiday, pdf_url) {
    document.getElementById("songModal")?.classList.add("hidden");


    document.getElementById('formTitle').textContent = 'Edit Song';
    document.getElementById('submitBtn').textContent = 'Save Changes';

    document.getElementById('song_id').value = songId;
    document.getElementById('title').value = title;
    document.getElementById('artist').value = artist;
    document.getElementById('og_key').value = og_key;

    const previewContainer = document.getElementById('pdfPreview');
    if (previewContainer) {
    if (pdf_url) {
        previewContainer.innerHTML = `<p style="color:white;">Current PDF: <a href="${pdf_url}" target="_blank">View</a></p>`;
    } else {
        previewContainer.innerHTML = "";
    }
    }

    document.getElementById('tempo').value = tempo || '';
    document.getElementById('singer_type').value = singer_type || '';
    document.getElementById('holiday').value = holiday || '';

    // ✅ Make sure both class and style are removed
    const addSongView = document.getElementById('addSongView');
    const addSongSection = document.getElementById('addSongSection');
    const mainView = document.getElementById('mainView');

    addSongView.classList.remove('hidden');
    addSongSection.classList.remove('hidden');
    addSongSection.style.display = ''; // ✅ Removes inline display: none
    mainView.classList.add('hidden');
}


function addSongForm() {
    document.getElementById('formTitle').textContent = 'Add Song';
    document.getElementById('submitBtn').textContent = 'Add to Library';

    document.getElementById('addSongView').classList.remove('hidden');
    document.getElementById('addSongSection').classList.remove('hidden');
    document.getElementById('mainView').classList.add('hidden');
}





// Handle nested submenu toggle
document.querySelectorAll('.dropdown-submenu > .dropdown-toggle').forEach(toggle => {
  toggle.addEventListener('click', function(e) {
    e.preventDefault();  // Prevent default link action
    e.stopPropagation(); // Stop event bubbling

    // Find the submenu ul
    const submenu = this.nextElementSibling;

    // Toggle visibility
    if (submenu) {
      submenu.classList.toggle('show');
    }
  });
});

function getThisSundayDate() {
        const today = new Date();
        const dayOfWeek = today.getDay();
        const diffToSunday = dayOfWeek === 0 ? 7 : (7-dayOfWeek)
        console.log("difftoSunday is: ", diffToSunday)
        const sunday = new Date();
        sunday.setDate(today.getDate() + diffToSunday);
        console.log(sunday.getDate())
        console.log(sunday.toISOString().split('T')[0])
        return sunday.toLocaleDateString('en-CA');
    };


function deleteFromSetlist(songId, setlistDate) {
    fetch (`/delete-from-setlist/${songId}/${setlistDate}`, {
        method: 'POST',
    })
    .then(res => res.json())
    .then(data => {
        showToast(data.message);  // e.g., "Song added to setlist"
        console.log(data.message)
        location.reload();
    })
    .catch(error => {
        console.error('Error deleting to setlist', error);
    })
};

function initDropdownMenus() {
    // Rebind dropdowns cleanly
    const buttons = document.querySelectorAll('.dropdown-toggle-btn');
    buttons.forEach((btn, index) => {
        const menu = btn.nextElementSibling;
        if (!menu) return;

        // Remove old listeners by replacing the node
        const clone = btn.cloneNode(true);
        btn.replaceWith(clone);

        console.log(`🔄 Rebinding dropdown [${index}]`);

        clone.addEventListener("click", (e) => {
            e.stopPropagation();

            document.querySelectorAll(".dropdown-menu").forEach((m, i) => {
                if (m !== menu) {
                    m.classList.remove("show");
                    console.log(`🔻 Closing menu [${i}]`);
                }
            });

            const willShow = !menu.classList.contains("show");
            menu.classList.toggle("show", willShow);
        });

        // Prevent clicks inside from closing the dropdown
        menu.addEventListener("click", (e) => e.stopPropagation());
    });
}

function openSongModal(song) {
  document.getElementById("modalSongTitle").textContent = song.title;
  document.getElementById("modalArtist").textContent = song.artist || "—";
  document.getElementById("modalKey").textContent = song.og_key || "—";
  document.getElementById("modalTempo").textContent = song.tempo || "—";
  document.getElementById("modalSinger").textContent = song.singer_type || "—";
  document.getElementById("modalTheme").textContent = song.holiday || "—";

  currentPdfUrl = song.pdf_url || '';
  document.getElementById("songPdfViewer").src = currentPdfUrl;

  // Show modal (your custom modal)
  document.getElementById("songModal").classList.remove("hidden");
}

function closeSongModal() {
  document.getElementById("songModal").classList.add("hidden");
}

function openFakeFullscreen(pdfUrl) {
  document.getElementById('fullscreenPdf').src = pdfUrl;
  document.getElementById('pdfFullscreenOverlay').style.display = 'block';

}

function closeFakeFullscreen() {
  document.getElementById('pdfFullscreenOverlay').style.display = 'none';
  document.getElementById('fullscreenPdf').src = '';
}

document.addEventListener("keydown", function (e) {
  if (e.key === "Escape") {
    const overlay = document.getElementById("pdfFullscreenOverlay");
    if (overlay && overlay.style.display === "block") {
      closeFakeFullscreen();
    }
  }
});


document.addEventListener("DOMContentLoaded", () => {
    const searchInput = document.getElementById("searchInput");
    const songListItems = document.querySelectorAll("#songList li");
    const addSongSection = document.getElementById("addSongSection");
    const mainView = document.getElementById("mainView");
    const addSongView = document.getElementById("addSongView");
    const addBtn = document.getElementById("toggleAddBtn");
    const backBtn = document.getElementById("toggleBackBtn");
    initDropdownMenus();
    


    

    const addSongForm = document.getElementById('addSongForm');
    if (addSongForm) {
    addSongForm.addEventListener('submit', (e) => {
        e.preventDefault();

        const songId = document.getElementById('song_id').value;
        const title = document.getElementById('title').value.trim();
        const artist = document.getElementById('artist').value.trim();
        const og_key = document.getElementById('og_key').value.trim();
        const tempo = document.getElementById('tempo').value;
        const singer_type = document.getElementById('singer_type').value;
        const holiday = document.getElementById('holiday').value;

        const url = songId ? `/edit-song/${songId}` : '/';
        const formData = new FormData();
        formData.append('title', title);
        formData.append('artist', artist);
        formData.append('og_key', og_key);
        formData.append('tempo', tempo);
        formData.append('singer_type', singer_type);
        formData.append('holiday', holiday);

        const deleteCheckbox = document.getElementById('delete_pdf');
        if (deleteCheckbox && deleteCheckbox.checked) {
            formData.append('delete_pdf', 'true');
        }

        const fileInput = document.getElementById('pdf_file');
        if (fileInput && fileInput.files.length > 0) {
        formData.append('pdf_file', fileInput.files[0]);
        }

        fetch(url, {
        method: 'POST',
        body: formData
        })
        .then(res => res.json())
        .then(data => {
        showToast(data.message);
        if (data.success) {
            // Update song info in the list (optional)

            const songLi = document.querySelector(`#songList li[data-id="${songId}"]`);
            if (songLi) {
                songLi.querySelector('.title-col strong').textContent = title;
                songLi.querySelector('.artist-col').textContent = artist;
                songLi.querySelector('.key-col').textContent = og_key;
            }
            window.location.reload();
            }
        })
        .catch(error => {
        console.error('Error submitting form', url);
        showToast('An error occurred. Please try again.');
        });
    });
    }



    // Guard before using home-page-specific functionality
        if (searchInput && addSongSection) {
        searchInput.addEventListener("focus", () => {
            addSongSection.style.display = "none";
        });

        searchInput.addEventListener("blur", () => {
            if (searchInput.value === "") {
                addSongSection.style.display = "block";
            }
        });

        searchInput.addEventListener("input", () => {
            const query = searchInput.value.toLowerCase();

            const currentSongItems = document.querySelectorAll("#songList > li");

            currentSongItems.forEach(item => {
                const text = item.textContent.toLowerCase().replace(/\s+/g, ' ').trim();

                const match = text.includes(query);
                item.style.setProperty("display", match ? "" : "none", "important");
            });
            document.getElementById('addSongView').classList.add('hidden');
            document.getElementById('mainView').classList.remove('hidden');
            initDropdownMenus();
            
        });
    }
    

    // Only attach Add/Back logic if they exist
    if (addBtn && backBtn && mainView && addSongView && addSongSection) {
        addBtn.addEventListener("click", () => {
            const addSongForm = document.querySelector('#addSongSection form');
            if (addSongForm) addSongForm.reset();

            mainView.classList.add("hidden");
            addSongView.classList.remove("hidden");
            addSongSection.classList.remove("hidden");
        });

        backBtn.addEventListener("click", () => {
            addSongView.classList.remove("visible");
            setTimeout(() => {
                addSongView.classList.add("hidden");
                mainView.classList.remove("hidden");
            }, 10);
        });
    }

    /*document.querySelectorAll('.dropdown-toggle-btn').forEach(button => {
    const menu = button.nextElementSibling;

    button.addEventListener("click", (e) => {
        e.stopPropagation();
        document.querySelectorAll(".dropdown-menu").forEach(m => {
            if (m !== menu) m.classList.remove("show");
        });
        menu.classList.toggle("show");
    });

    menu.addEventListener("click", (e) => {
        e.stopPropagation();
    });
});*/


    document.addEventListener("click", () => {
    document.querySelectorAll(".dropdown-menu").forEach(menu => {
        menu.classList.remove("show");
    });
});


    

    

    if (songListItems.length > 0) {
    songListItems.forEach(item => {
    item.addEventListener('dragstart', (e) => {
        e.dataTransfer.setData('text/plain', item.dataset.id);
    });
    });
    }

    const setlistDate = getThisSundayDate();
    console.log(setlistDate)
    const sidebar_drop = document.querySelector('.sidebar'); // ← FULL sidebar as drop zone
    const setlist = document.getElementById('sb-setlist');

    if (sidebar_drop && setlist) {
    sidebar_drop.addEventListener('dragover', (e) => {
        e.preventDefault();
    });

    sidebar_drop.addEventListener('drop', (e) => {
        e.preventDefault();
        const songId = e.dataTransfer.getData('text/plain');
        console.log("dropped the date: ", setlistDate)
        addToSetlist(songId, setlistDate); // Will still append to #sb-setlist
    });
    }


    new Sortable(document.getElementById('sb-setlist'), {
        animation: 150,
        onEnd: function () {
            const newOrder = [...document.querySelectorAll('.setlist-item')]
                .map(el => el.dataset.id);
            const setlistDate = getThisSundayDate();
            fetch('/update_setlist_order', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    song_ids: newOrder,
                    setlist_date: setlistDate
                })
            })
            .then(res=>res.json())
            .then(data => console.log(data.message))
            .catch(err => console.error('Failed to update order:', err));
        }
    });



function getSelectedFilters() {
    const filters = { tempo: '', singer: '', holiday: '' };

    document.querySelectorAll('.filter-btn.active').forEach(btn => {
        const group = btn.dataset.group;
        const value = btn.dataset.value;
        filters[group] = value;
    });

    return filters;
}

function filterVisibleSongs() {
    const filters = getSelectedFilters();
    const items = document.querySelectorAll('#songList > li');

    items.forEach(item => {
        const tempo = item.dataset.tempo || '';
        const singer = item.dataset.singer || '';
        const holiday = item.dataset.holiday || '';

        const matchesTempo = !filters.tempo || filters.tempo === tempo;
        const matchesSinger = !filters.singer || filters.singer === singer;
        const matchesHoliday = !filters.holiday || filters.holiday === holiday;

        const visible = matchesTempo && matchesSinger && matchesHoliday;
        item.style.display = visible ? '' : 'none';

        // Fix for dropdown children too:
        if (visible) {
            const menuItems = item.querySelectorAll('.dropdown-menu li');
            menuItems.forEach(li => li.style.display = '');
        }
    });

    console.log("[Filtered songs]");
    items.forEach((item, idx) => {
        if (item.style.display !== 'none') {
            console.log(`Visible item [${idx}]: ${item.textContent.trim()}`);
        }
    });

    initDropdownMenus();
}

document.addEventListener('click', (e) => {
    document.querySelectorAll('.dropdown-menu').forEach(menu => {
        // Close only if the click is outside the menu and its toggle button
        if (!menu.contains(e.target) && !menu.previousElementSibling.contains(e.target)) {
            menu.classList.remove('show');
        }
    });
});

    



   document.querySelectorAll('.filter-btn').forEach(button => {
    button.addEventListener('click', function () {
        const group = this.dataset.group;

        // Check if this button is already active
        const isActive = this.classList.contains('active');

        // Deselect all buttons in the same group
        document.querySelectorAll(`.filter-btn[data-group="${group}"]`).forEach(btn => {
            btn.classList.remove('active');
        });

        // If it wasn't active before, activate it now
        if (!isActive) {
            this.classList.add('active');
        }

        // Call your filtering function again
        filterVisibleSongs();  // Or whatever your filtering function is called
        
    });
    initDropdownMenus();
});


document.querySelectorAll('.song-row').forEach(songEl => {
  songEl.addEventListener('click', () => {
    const songData = JSON.parse(songEl.dataset.song);
    openSongModal(songData);
  });
});


});