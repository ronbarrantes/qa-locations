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


const themeToggleBtn = document.getElementById('theme-toggle');
const THEME_STORAGE_KEY = 'qa-locations-theme';

function getPreferredTheme() {
  const savedTheme = window.localStorage.getItem(THEME_STORAGE_KEY);
  if (savedTheme === 'dark' || savedTheme === 'light') return savedTheme;
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

function applyTheme(theme) {
  const isDark = theme === 'dark';
  document.body.classList.toggle('dark-theme', isDark);
  if (themeToggleBtn) {
    themeToggleBtn.textContent = isDark ? '☀️' : '🌙';
    themeToggleBtn.title = isDark ? 'Switch to light mode' : 'Switch to dark mode';
  }
}

function toggleTheme() {
  const nextTheme = document.body.classList.contains('dark-theme') ? 'light' : 'dark';
  window.localStorage.setItem(THEME_STORAGE_KEY, nextTheme);
  applyTheme(nextTheme);
}


let settingsState = loadSettings();
let groupsSortable = null;

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

function renderTable(matrix, prioritySet) {
  tableContainer.replaceChildren();

  if (!matrix.headers.length) {
    tableContainer.textContent = 'No data to display.';
    return;
  }

  const table = document.createElement('table');
  const thead = document.createElement('thead');
  const headerRow = document.createElement('tr');

  matrix.headers.forEach((title) => {
    const th = document.createElement('th');
    th.textContent = title;
    if (!title) th.classList.add('gap');
    headerRow.appendChild(th);
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
}

function openSettings() {
  populateSettingsUI(settingsState);
  initGroupsListDragDrop();
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

  const dragHandle = document.createElement('div');
  dragHandle.className = 'drag-handle';
  dragHandle.title = 'Drag to reorder';
  dragHandle.textContent = '⋮⋮';

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

  const removeBtn = document.createElement('button');
  removeBtn.type = 'button';
  removeBtn.className = 'icon-btn remove-group';
  removeBtn.title = 'Remove column';
  removeBtn.textContent = '✕';
  removeBtn.addEventListener('click', () => {
    groupItem.remove();
  });

  groupItem.appendChild(dragHandle);
  groupItem.appendChild(fields);
  groupItem.appendChild(removeBtn);

  groupsList.appendChild(groupItem);
}

function initGroupsListDragDrop() {
  if (groupsSortable || typeof Sortable === 'undefined') return;
  groupsSortable = Sortable.create(groupsList, {
    animation: 150,
    handle: '.drag-handle',
    draggable: '.group-item',
  });
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
applyTheme(getPreferredTheme());
themeToggleBtn?.addEventListener('click', toggleTheme);

openSettingsBtn.addEventListener('click', openSettings);
closeSettingsBtn.addEventListener('click', closeSettings);
settingsBackBtn.addEventListener('click', closeSettings);
settingsSaveBtn.addEventListener('click', saveSettingsFromUI);
settingsResetBtn.addEventListener('click', resetSettings);
settingsDefaultsBtn.addEventListener('click', resetToDefaults);
addGroupBtn.addEventListener('click', () => addGroupToUI());
resultBackBtn.addEventListener('click', () => showView('main'));
