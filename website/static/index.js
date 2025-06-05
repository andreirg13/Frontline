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

function addToSetlist(songId, setlistDate) {
    fetch (`/add_to_setlist/${songId}/${setlistDate}`, {
        method: 'POST',
    }).then(res => res.json())
        .then(data => {
        showToast(data.message);  // e.g., "Song added to setlist"

        if(data.success) {
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
    })
    .catch(error => {
        console.error('Error adding to setlist', error);
    })
};

function openEditForm(songId, title, artist, og_key) {
    document.getElementById('formTitle').textContent = 'Edit Song';
    document.getElementById('submitBtn').textContent = 'Save Changes';

    document.getElementById('song_id').value = songId;
    document.getElementById('title').value = title;
    document.getElementById('artist').value = artist;
    document.getElementById('og_key').value = og_key;

    document.getElementById('addSongView').classList.remove('hidden');
    document.getElementById('addSongSection').classList.remove('hidden');
    document.getElementById('mainView').classList.add('hidden');
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



document.addEventListener("DOMContentLoaded", () => {
    const searchInput = document.getElementById("searchInput");
    const songListItems = document.querySelectorAll("#songList li");
    const addSongSection = document.getElementById("addSongSection");
    const mainView = document.getElementById("mainView");
    const addSongView = document.getElementById("addSongView");
    const addBtn = document.getElementById("toggleAddBtn");
    const backBtn = document.getElementById("toggleBackBtn");
    


    const addSongForm = document.getElementById('addSongForm');
    if (addSongForm) {
    addSongForm.addEventListener('submit', (e) => {
        e.preventDefault();

        const songId = document.getElementById('song_id').value;
        const title = document.getElementById('title').value.trim();
        const artist = document.getElementById('artist').value.trim();
        const og_key = document.getElementById('og_key').value.trim();

        const url = songId ? `/edit-song/${songId}` : '/';
        fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, artist, og_key }),
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
            setTimeout(() => {
                container.classList.add("focused");
            }, 10);
        });

        searchInput.addEventListener("blur", () => {
            if (searchInput.value === "") {
                addSongSection.style.display = "block";
            }
            setTimeout(() => container.classList.remove("focused"), 200);
        });

        searchInput.addEventListener("input", () => {
            const query = searchInput.value.toLowerCase();

            const currentSongItems = document.querySelectorAll("#songList li");

            currentSongItems.forEach(item => {
                const text = item.textContent.toLowerCase().replace(/\s+/g, ' ').trim();


                const match = text.includes(query);
                item.style.setProperty("display", match ? "" : "none", "important");
            });
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

    document.querySelectorAll('.dropdown-toggle-btn').forEach(button => {
        const menu = button.nextElementSibling;

        button.addEventListener("click", (e) => {
            e.stopPropagation();
            document.querySelectorAll(".dropdown-menu").forEach(m => {
                if (m !== menu) m.classList.remove("show");
            });
            menu.classList.toggle("show");
        });

        // Close on outside click
        document.addEventListener("click", () => {
            document.querySelectorAll(".dropdown-menu").forEach(menu => {
                menu.classList.remove("show");
            });
        });

        // Prevent closing when clicking inside the menu
        menu.addEventListener("click", (e) => {
            e.stopPropagation();
        });
    });


    function getThisSundayDate() {
        const today = new Date();
        const dayOfWeek = today.getDay();
        const diffToSunday = (7-dayOfWeek) % 7; //days until Sunday
        const sunday = new Date();
        sunday.setDate(today.getDate() + diffToSunday);

        return sunday.toISOString().split('T')[0];
    };
    


    songListItems.forEach(item => {
    item.addEventListener('dragstart', (e) => {
        e.dataTransfer.setData('text/plain', item.dataset.id);
    });
    });

    const setlistDate = getThisSundayDate();
    const sidebar_drop = document.querySelector('.sidebar'); // ← FULL sidebar as drop zone
    const setlist = document.getElementById('sb-setlist');

    if (sidebar_drop && setlist) {
    sidebar_drop.addEventListener('dragover', (e) => {
        e.preventDefault();
    });

    sidebar_drop.addEventListener('drop', (e) => {
        e.preventDefault();
        const songId = e.dataTransfer.getData('text/plain');
        addToSetlist(songId, setlistDate); // Will still append to #sb-setlist
    });
    }




    let isDragging = false;
    let currentItem = null;
    let container = document.getElementById("sb-setlist");
    let sidebar = document.querySelector(".sidebar");
    let initY = 0;
    let containerOffsetY = 0;

    document.addEventListener("mousedown", (e) => {
        const item = e.target.closest(".setlist-item");
        if (item && container.contains(item)) {
        isDragging = true;
        currentItem = item;
        containerOffsetY = currentItem.offsetTop;
        currentItem.classList.add("dragging");
        document.body.style.userSelect = "none";
        currentItem.classList.add("insert-animation");
        currentItem.style.top = containerOffsetY + "px";
        initY = e.clientY;
        }
    });

    document.addEventListener("mousemove", (e) => {
        if (isDragging && currentItem) {
        currentItem.classList.remove("insert-animation");

        const sidebarRect = sidebar.getBoundingClientRect();
        const cursorY = e.clientY;
        const newTop = containerOffsetY - (initY - cursorY);

        currentItem.style.top = `${newTop}px`;

        // Auto-scroll the sidebar when dragging near top/bottom
        const scrollThreshold = 40;
        if (cursorY < sidebarRect.top + scrollThreshold) {
            sidebar.scrollTop -= 10;
        } else if (cursorY > sidebarRect.bottom - scrollThreshold) {
            sidebar.scrollTop += 10;
        }

        const siblings = [...container.querySelectorAll(".setlist-item:not(.dragging)")];
        const nextItem = siblings.find((sibling) => {
            return (
            cursorY - sidebarRect.top <=
            sibling.offsetTop + sibling.offsetHeight / 2
            );
        });

        siblings.forEach((sibling) => sibling.style.marginTop = "10px");

        if (nextItem) {
            nextItem.style.marginTop = `${currentItem.offsetHeight + 20}px`;
        }

        container.insertBefore(currentItem, nextItem);
        }
    });

    document.addEventListener("mouseup", () => {
        if (currentItem) {
        currentItem.classList.remove("dragging");
        currentItem.style.top = "auto";
        currentItem = null;
        isDragging = false;
        document.body.style.userSelect = "auto";
        }

        const siblings = [...container.querySelectorAll(".setlist-item:not(.dragging)")];
        siblings.forEach((sibling) => sibling.style.marginTop = "10px");
    });





    
});
