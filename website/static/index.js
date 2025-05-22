function deleteSong(songId) {
    fetch('/delete-song', {
        method: 'POST',
        body: JSON.stringify({ songId: songId }),
    }).then((_res) => {
        window.location.href="/";
    });
}

const container = document.getElementById("container")

document.addEventListener("DOMContentLoaded", () => {
    const searchInput = document.getElementById("searchInput");
    const songListItems = document.querySelectorAll("#songList li");
    const addSongSection = document.getElementById("addSongSection");

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
        setTimeout(() => container.classList.remove("focused"), 200)
    });


    searchInput.addEventListener("input", () => {
        const query = searchInput.value.toLowerCase();

        songListItems.forEach((item) => {
            const text = item.textContent.toLowerCase().replace(/\s+/g,' ').trim();
            const match = text.includes(query);
            item.style.setProperty("display", match ? "" : "none", "important");
        });
    });


    const mainView = document.getElementById("mainView");
    const addSongView = document.getElementById("addSongView");
    const addBtn = document.getElementById("toggleAddBtn");
    const backBtn = document.getElementById("toggleBackBtn");

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
});
