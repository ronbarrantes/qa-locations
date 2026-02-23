const logic = window.QALogic;

if (!logic) {
  throw new Error('QALogic not loaded');
}

const {
  parseLines,
  compareLocationCodes,
  uniqueCaseInsensitive,
  parseGroupValues,
  normalizeConfig,
  groupLocations,
  groupByTitle,
  buildOutputMatrix,
  buildPrioritySet,
} = logic;

const STORAGE_KEY = 'qa-locations-settings-v1';
const INPUTS_STORAGE_KEY = 'qa-locations-inputs-v1';
const DEFAULT_SETTINGS = {
  groups: [
    { title: 'pallets', values: ['a', 'b', 'c', 'lud', 'prm', 'slp'] },
    { title: 'efg', values: ['e', 'f', 'g', 'gft', 'hvc', 'hwk', 'hvb'] },
    { title: 'hjkl', values: ['h', 'j', 'k', 'l'] },
    { title: 'mnst', values: ['m', 'n', 's', 't', 'mez'] },
  ],
  maxRows: 20,
  columnGap: 1,
};

const views = {
  main: document.getElementById('main-view'),
  settings: document.getElementById('settings-view'),
  result: document.getElementById('result-view'),
};

const locationsInput = document.getElementById('locations');
const prioritiesInput = document.getElementById('priorities');
const tableContainer = document.getElementById('table-container');
const summary = document.getElementById('summary');

const createBtn = document.getElementById('create');
const resetBtn = document.getElementById('reset');
const openSettingsBtn = document.getElementById('open-settings');
const closeSettingsBtn = document.getElementById('close-settings');
const settingsBackBtn = document.getElementById('settings-back');
const settingsSaveBtn = document.getElementById('settings-save');
const settingsResetBtn = document.getElementById('settings-reset');
const settingsDefaultsBtn = document.getElementById('settings-defaults');
const addGroupBtn = document.getElementById('add-group');
const resultBackBtn = document.getElementById('result-back');

const groupsList = document.getElementById('groups-list');
const maxRowsInput = document.getElementById('max-rows');
const columnGapInput = document.getElementById('column-gap');

let settingsState = loadSettings();

function getStorage() {
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
        console.warn('Failed to parse stored value.', err);
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

const storage = getStorage();

function showView(viewKey) {
  Object.values(views).forEach((view) => view.classList.add('hidden'));
  views[viewKey].classList.remove('hidden');
}

function loadSettings() {
  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw) return normalizeConfig(DEFAULT_SETTINGS);
  try {
    return normalizeConfig(JSON.parse(raw));
  } catch (err) {
    console.warn('Failed to load settings, falling back to defaults.', err);
    return normalizeConfig(DEFAULT_SETTINGS);
  }
}

function saveSettings(config) {
  const normalized = normalizeConfig(config);
  settingsState = normalized;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(normalized));
}

async function loadInputs() {
  const saved = await storage.get(INPUTS_STORAGE_KEY);
  if (!saved || typeof saved !== 'object') return;
  if (typeof saved.locations === 'string') locationsInput.value = saved.locations;
  if (typeof saved.priorities === 'string') prioritiesInput.value = saved.priorities;
}

function saveInputs() {
  storage.set(INPUTS_STORAGE_KEY, {
    locations: locationsInput.value,
    priorities: prioritiesInput.value,
  });
}

function clearInputsStorage() {
  storage.remove(INPUTS_STORAGE_KEY);
}

function renderTable(matrix, prioritySet) {
  tableContainer.replaceChildren();

  if (!matrix.headers.length) {
    tableContainer.textContent = 'No data to display.';
    return;
  }

  const table = document.createElement('table');
  const thead = document.createElement('thead');
  const headerRow = document.createElement('tr');

  matrix.groupTitles.forEach((title, index) => {
    const th = document.createElement('th');
    const colSpan = matrix.groupColumns[index] || 1;
    th.textContent = title;
    th.colSpan = colSpan;
    headerRow.appendChild(th);

    if (index < matrix.groupTitles.length - 1 && matrix.groupColumns[index] !== undefined) {
      for (let g = 0; g < settingsState.columnGap; g += 1) {
        const gap = document.createElement('th');
        gap.classList.add('gap');
        headerRow.appendChild(gap);
      }
    }
  });

  thead.appendChild(headerRow);
  table.appendChild(thead);

  const tbody = document.createElement('tbody');
  matrix.rows.forEach((row) => {
    const tr = document.createElement('tr');
    row.forEach((value, idx) => {
      const td = document.createElement('td');
      td.textContent = value;
      if (!matrix.headers[idx]) {
        td.classList.add('gap');
      }
      if (value && prioritySet.has(value.toUpperCase())) {
        td.classList.add('priority');
      }
      tr.appendChild(td);
    });
    tbody.appendChild(tr);
  });

  table.appendChild(tbody);
  tableContainer.appendChild(table);
}

function createArrangement() {
  const locations = uniqueCaseInsensitive(parseLines(locationsInput.value)).sort(compareLocationCodes);
  const priorities = uniqueCaseInsensitive(parseLines(prioritiesInput.value)).sort(compareLocationCodes);

  if (locations.length === 0) {
    summary.textContent = 'Add at least one location.';
    tableContainer.replaceChildren();
    showView('result');
    return;
  }

  const config = settingsState;
  const grouped = groupLocations(locations, config);
  const titleGrouped = groupByTitle(grouped, config);
  const titleOrder = config.groups.map((group) => group.title);
  const matrix = buildOutputMatrix(titleOrder, titleGrouped, config.maxRows, config.columnGap);
  const prioritySet = buildPrioritySet(locations, priorities);

  renderTable(matrix, prioritySet);

  const maxRowsLabel = config.maxRows > 0 ? config.maxRows : 'no limit';
  summary.textContent = `${locations.length} locations, ${matrix.headers.length} columns, max rows ${maxRowsLabel}, gap ${config.columnGap}.`;
  showView('result');
}

function resetForm() {
  locationsInput.value = '';
  prioritiesInput.value = '';
  clearInputsStorage();
}

function openSettings() {
  populateSettingsUI(settingsState);
  showView('settings');
}

function closeSettings() {
  showView('main');
}

function populateSettingsUI(config) {
  groupsList.replaceChildren();
  config.groups.forEach((group) => {
    addGroupToUI(group.title, group.values);
  });
  maxRowsInput.value = config.maxRows;
  columnGapInput.value = config.columnGap;
}

function addGroupToUI(title = '', values = []) {
  const groupItem = document.createElement('div');
  groupItem.className = 'group-item';

  const fields = document.createElement('div');
  fields.className = 'group-fields';

  const titleInput = document.createElement('input');
  titleInput.type = 'text';
  titleInput.className = 'group-title-input';
  titleInput.placeholder = 'Column title';
  titleInput.value = title;

  const valuesInput = document.createElement('input');
  valuesInput.type = 'text';
  valuesInput.className = 'group-values-input';
  valuesInput.placeholder = 'Values (A B C or MEZ PRM HVC)';
  valuesInput.value = Array.isArray(values) ? values.join(', ') : String(values || '');

  fields.appendChild(titleInput);
  fields.appendChild(valuesInput);

  const moveControls = document.createElement('div');
  moveControls.className = 'group-move-controls';

  const moveUpBtn = document.createElement('button');
  moveUpBtn.type = 'button';
  moveUpBtn.className = 'icon-btn move-group';
  moveUpBtn.title = 'Move up';
  moveUpBtn.textContent = '↑';
  moveUpBtn.addEventListener('click', () => {
    const prev = groupItem.previousElementSibling;
    if (prev) groupsList.insertBefore(groupItem, prev);
  });

  const moveDownBtn = document.createElement('button');
  moveDownBtn.type = 'button';
  moveDownBtn.className = 'icon-btn move-group';
  moveDownBtn.title = 'Move down';
  moveDownBtn.textContent = '↓';
  moveDownBtn.addEventListener('click', () => {
    const next = groupItem.nextElementSibling;
    if (next) groupsList.insertBefore(next, groupItem);
  });

  const removeBtn = document.createElement('button');
  removeBtn.type = 'button';
  removeBtn.className = 'icon-btn remove-group';
  removeBtn.title = 'Remove column';
  removeBtn.textContent = '✕';
  removeBtn.addEventListener('click', () => {
    groupItem.remove();
  });

  moveControls.appendChild(moveUpBtn);
  moveControls.appendChild(moveDownBtn);

  groupItem.appendChild(moveControls);
  groupItem.appendChild(fields);
  groupItem.appendChild(removeBtn);

  groupsList.appendChild(groupItem);
}

function getSettingsFromUI() {
  const groupItems = groupsList.querySelectorAll('.group-item');
  const groups = [];

  groupItems.forEach((item) => {
    const title = item.querySelector('.group-title-input')?.value.trim();
    const values = parseGroupValues(item.querySelector('.group-values-input')?.value);

    if (title) {
      groups.push({ title, values });
    }
  });

  return {
    groups,
    maxRows: Number(maxRowsInput.value) || 20,
    columnGap: Number(columnGapInput.value) || 0,
  };
}

function saveSettingsFromUI() {
  const config = getSettingsFromUI();

  if (config.groups.length === 0) {
    alert('Add at least one column group.');
    return;
  }

  if (config.maxRows < 0) {
    alert('Max rows must be 0 or higher.');
    return;
  }

  saveSettings(config);
  showView('main');
}

function resetSettings() {
  populateSettingsUI(settingsState);
}

function resetToDefaults() {
  populateSettingsUI(normalizeConfig(DEFAULT_SETTINGS));
}

createBtn.addEventListener('click', createArrangement);
resetBtn.addEventListener('click', resetForm);
locationsInput.addEventListener('input', saveInputs);
prioritiesInput.addEventListener('input', saveInputs);
openSettingsBtn.addEventListener('click', openSettings);
closeSettingsBtn.addEventListener('click', closeSettings);
settingsBackBtn.addEventListener('click', closeSettings);
settingsSaveBtn.addEventListener('click', saveSettingsFromUI);
settingsResetBtn.addEventListener('click', resetSettings);
settingsDefaultsBtn.addEventListener('click', resetToDefaults);
addGroupBtn.addEventListener('click', () => addGroupToUI());
resultBackBtn.addEventListener('click', () => showView('main'));

loadInputs();
