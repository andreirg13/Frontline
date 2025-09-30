// static/sheetPicker.js
document.addEventListener("DOMContentLoaded", () => {
  
  const items = document.querySelectorAll("#songPickerList .picker-item");
  if (items.length === 0) return;

  let tooltipEl = null;

  items.forEach(item => {
    const text = item.querySelector('.picker-item-text').innerText.trim();
    item.dataset.fulltext = text;
  })

  function showTooltip(evt) {
    const txt = evt.currentTarget.dataset.fulltext;
    // create tooltip element
    tooltipEl = document.createElement("div");
    tooltipEl.className = "custom-tooltip";
    tooltipEl.innerText = txt;
    document.body.appendChild(tooltipEl);

    const rect = evt.currentTarget.getBoundingClientRect();
    // horizontally center on the item, and 8px above its top
    const x = rect.left + rect.width / 2 + window.scrollX;
    const y = rect.top + window.scrollY - 8;
    tooltipEl.style.left = x + "px";
    tooltipEl.style.top  = y + "px";
  }

  function hideTooltip() {
    if (tooltipEl) {
      tooltipEl.remove();
      tooltipEl = null;
    }
  }

  items.forEach(item => {
    
    item.addEventListener("mouseenter", showTooltip);
    item.addEventListener("mouseleave", hideTooltip);
    item.addEventListener("scroll", hideTooltip, true);
  });

  const input = document.getElementById("searchPickerInput");
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
