// static/sheetPicker.js
document.addEventListener("DOMContentLoaded", () => {
  
  const items = document.querySelectorAll("#songPickerList .picker-item");
  if (items.length === 0) return;

  

  const input = document.getElementById("searchInput");
  if (!input || items.length === 0) return;

  // live filter
  input.addEventListener("input", () => {
    const q = input.value.toLowerCase().trim();
    items.forEach(item => {
      const txt = item.textContent.toLowerCase();
      item.style.display = txt.includes(q) ? "" : "none";
    });
  });

  // navigate
  items.forEach(item =>
    item.addEventListener("click", () =>
      window.location.href = item.dataset.url
    )
  );

  

});
