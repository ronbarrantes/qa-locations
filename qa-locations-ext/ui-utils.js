(function (global, factory) {
  if (typeof module === "object" && module.exports) {
    module.exports = factory();
  } else {
    global.QAUiUtils = factory();
  }
})(typeof window !== "undefined" ? window : globalThis, function () {
  function createStorage() {
    if (window.chrome?.storage?.local) {
      return {
        async get(key) {
          const result = await window.chrome.storage.local.get(key);
          return result?.[key];
        },
        async set(key, value) {
          await window.chrome.storage.local.set({ [key]: value });
        },
        async remove(key) {
          await window.chrome.storage.local.remove(key);
        },
      };
    }

    return {
      async get(key) {
        const raw = window.localStorage.getItem(key);
        if (!raw) return undefined;
        try {
          return JSON.parse(raw);
        } catch (err) {
          console.warn("Failed to parse stored value.", err);
          return undefined;
        }
      },
      async set(key, value) {
        window.localStorage.setItem(key, JSON.stringify(value));
      },
      async remove(key) {
        window.localStorage.removeItem(key);
      },
    };
  }

  function openPicker(inputEl) {
    if (!inputEl) return;
    try {
      if (typeof inputEl.showPicker === "function") {
        inputEl.showPicker();
        return;
      }
    } catch (err) {
      console.warn("showPicker failed, using click().", err);
    }
    inputEl.click();
  }

  function formatPriorityEntries(entries) {
    return (entries || [])
      .filter(
        (entry) =>
          entry &&
          typeof entry === "object" &&
          typeof entry.location === "string" &&
          entry.location.trim() !== "",
      )
      .map((entry) =>
        `${entry.location.trim()}${entry.cutTime ? ` | ${entry.cutTime}` : ""}`,
      )
      .join("\n");
  }

  function resolveTheme(themeMode) {
    if (themeMode === "light" || themeMode === "dark") {
      return themeMode;
    }
    return window.matchMedia?.("(prefers-color-scheme: dark)").matches
      ? "dark"
      : "light";
  }

  function getThemePreference(storageKey) {
    const savedTheme = window.localStorage.getItem(storageKey);
    if (
      savedTheme === "light" ||
      savedTheme === "dark" ||
      savedTheme === "system"
    ) {
      return savedTheme;
    }
    return "system";
  }

  function createThemeController(storageKey, onThemeModeChange) {
    let themeMediaQuery = null;
    let currentThemeMode = "system";

    function applySystemTheme() {
      if (currentThemeMode !== "system") return;
      document.documentElement.setAttribute("data-theme", resolveTheme("system"));
    }

    function removeThemeListener() {
      if (!themeMediaQuery) return;
      if (typeof themeMediaQuery.removeEventListener === "function") {
        themeMediaQuery.removeEventListener("change", applySystemTheme);
      } else if (typeof themeMediaQuery.removeListener === "function") {
        themeMediaQuery.removeListener(applySystemTheme);
      }
      themeMediaQuery = null;
    }

    function setupThemeListener(themeMode) {
      removeThemeListener();
      if (themeMode !== "system" || typeof window.matchMedia !== "function") {
        return;
      }
      themeMediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
      if (typeof themeMediaQuery.addEventListener === "function") {
        themeMediaQuery.addEventListener("change", applySystemTheme);
      } else if (typeof themeMediaQuery.addListener === "function") {
        themeMediaQuery.addListener(applySystemTheme);
      }
    }

    return {
      applyTheme(themeMode) {
        const nextThemeMode =
          themeMode === "light" || themeMode === "dark" ? themeMode : "system";
        currentThemeMode = nextThemeMode;
        window.localStorage.setItem(storageKey, nextThemeMode);
        document.documentElement.setAttribute(
          "data-theme",
          resolveTheme(nextThemeMode),
        );
        setupThemeListener(nextThemeMode);
        if (typeof onThemeModeChange === "function") {
          onThemeModeChange(nextThemeMode);
        }
      },
      cleanup() {
        removeThemeListener();
      },
    };
  }

  return {
    createStorage,
    openPicker,
    formatPriorityEntries,
    getThemePreference,
    createThemeController,
  };
});
