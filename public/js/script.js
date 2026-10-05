(() => {
    'use strict'
    const forms = document.querySelectorAll('.needs-validation')
    Array.from(forms).forEach(form => {
      form.addEventListener('submit', event => {
        if (!form.checkValidity()) {
          event.preventDefault()
          event.stopPropagation()
        }
        form.classList.add('was-validated')
      }, false)
    })
  })()

  const favoriteButtons = Array.from(document.querySelectorAll("[data-favorite-id]"));
  const favoritesKey = "tripnest:saved-stays";
  const favoriteStatus = document.querySelector("[data-favorite-status]");
  const favoriteCount = document.querySelector("[data-favorite-count]");
  const savedFilter = document.querySelector("[data-saved-filter]");
  const savedFilterStatus = document.querySelector("[data-saved-filter-status]");
  const listingCards = Array.from(document.querySelectorAll("[data-listing-card]"));
  let savedIds = [];
  let showingSavedOnly = false;
  try {
    const storedIds = JSON.parse(window.localStorage.getItem(favoritesKey) || "[]");
    if (Array.isArray(storedIds)) savedIds = [...new Set(storedIds.filter((id) => typeof id === "string"))];
  } catch {
    savedIds = [];
  }

  const saveFavoriteIds = () => {
    try {
      window.localStorage.setItem(favoritesKey, JSON.stringify(savedIds));
      return true;
    } catch {
      if (favoriteStatus) favoriteStatus.textContent = "Your browser could not save this stay.";
      return false;
    }
  };

  const updateSavedFilter = () => {
    const matchingSavedCount = listingCards.filter((card) => savedIds.includes(card.dataset.listingId)).length;
    listingCards.forEach((card) => {
      card.hidden = showingSavedOnly && !savedIds.includes(card.dataset.listingId);
    });
    if (favoriteCount) favoriteCount.textContent = String(savedIds.length);
    if (savedFilter) savedFilter.setAttribute("aria-pressed", String(showingSavedOnly));
    if (savedFilterStatus) {
      savedFilterStatus.hidden = !showingSavedOnly;
      savedFilterStatus.textContent = matchingSavedCount
        ? `Showing ${matchingSavedCount} saved ${matchingSavedCount === 1 ? "stay" : "stays"} from this result set.`
        : "No saved stays in these results yet. Save a stay with the heart button to find it here.";
    }
  };

  const updateFavoriteButton = (button) => {
    const saved = savedIds.includes(button.dataset.favoriteId);
    button.setAttribute("aria-pressed", String(saved));
    button.setAttribute("aria-label", `${saved ? "Remove" : "Save"} ${button.dataset.favoriteTitle} ${saved ? "from" : "to"} saved stays`);
    button.title = saved ? "Remove from saved stays" : "Save this stay";
    button.classList.toggle("is-saved", saved);
    button.querySelector("i")?.classList.toggle("fa-solid", saved);
    button.querySelector("i")?.classList.toggle("fa-regular", !saved);
  };

  favoriteButtons.forEach((button) => {
    updateFavoriteButton(button);
    button.addEventListener("click", () => {
      const id = button.dataset.favoriteId;
      const wasSaved = savedIds.includes(id);
      savedIds = wasSaved ? savedIds.filter((savedId) => savedId !== id) : [...savedIds, id];
      const wasPersisted = saveFavoriteIds();
      favoriteButtons.forEach(updateFavoriteButton);
      updateSavedFilter();
      if (favoriteStatus && wasPersisted) favoriteStatus.textContent = `${button.dataset.favoriteTitle} ${wasSaved ? "removed from" : "added to"} saved stays in this browser.`;
    });
  });

  savedFilter?.addEventListener("click", () => {
    showingSavedOnly = !showingSavedOnly;
    updateSavedFilter();
  });
  updateSavedFilter();

  document.querySelectorAll("[data-toast]").forEach((toast) => {
    const dismiss = () => toast.remove();
    toast.querySelector(".site-toast-close")?.addEventListener("click", dismiss);
    window.setTimeout(dismiss, 6000);
  });

  const compareForm = document.querySelector("[data-compare-form]");
  if (compareForm) {
    const checkboxes = Array.from(document.querySelectorAll("[data-compare-checkbox]"));
    const countLabel = compareForm.querySelector("[data-compare-count]");
    const submitButton = compareForm.querySelector("[data-compare-submit]");
    const updateSelection = () => {
      const selected = checkboxes.filter((checkbox) => checkbox.checked);
      countLabel.textContent = `${selected.length} selected`;
      submitButton.disabled = selected.length < 2 || selected.length > 4;
      checkboxes.forEach((checkbox) => {
        checkbox.disabled = !checkbox.checked && selected.length >= 4;
      });
    };

    checkboxes.forEach((checkbox) => checkbox.addEventListener("change", updateSelection));
    compareForm.addEventListener("submit", (event) => {
      const selectedCount = checkboxes.filter((checkbox) => checkbox.checked).length;
      if (selectedCount < 2 || selectedCount > 4) event.preventDefault();
    });
    updateSelection();
  }
