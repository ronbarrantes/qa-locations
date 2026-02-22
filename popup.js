const DEFAULT_SETTINGS = {
  groups: [
    { title: 'pallets', values: 'a, b, c, lud, prm, slp' },
    { title: 'efg', values: 'e, f, g, gft, hvc, hwk, hvb' },
    { title: 'hjkl', values: 'h, j, k, l' },
    { title: 'mnst', values: 'm, n, s, t, mez' },
  ],
  maxRows: 20,
  columnGap: 1,
};

const formView = document.getElementById('form-view');
const resultView = document.getElementById('result-view');
const locationsInput = document.getElementById('locations');
const prioritiesInput = document.getElementById('priorities');
const tablesContainer = document.getElementById('tables-container');
const summary = document.getElementById('summary');
const priorityList = document.getElementById('priority-list');

const createBtn = document.getElementById('create');
const resetBtn = document.getElementById('reset');
const backBtn = document.getElementById('back');

const settingsModal = document.getElementById('settings-modal');
const settingsOpenBtn = document.getElementById('settings-open');
const settingsCloseBtn = document.getElementById('settings-close');
const addGroupBtn = document.getElementById('add-group');
const defaultsBtn = document.getElementById('defaults');
const saveSettingsBtn = document.getElementById('save-settings');
const groupsList = document.getElementById('groups-list');
const maxRowsInput = document.getElementById('max-rows');
const columnGapInput = document.getElementById('column-gap');
const groupTemplate = document.getElementById('group-row-template');

let dragItem = null;

function tokenize(value) {
  return value
    .toUpperCase()
    .match(/[A-Z]+|\d+|[^A-Z\d]+/g)
    ?.map((chunk) => (/^\d+$/.test(chunk) ? Number(chunk) : chunk)) ?? [value];
}

function compareLocationCodes(a, b) {
  const partsA = tokenize(a);
  const partsB = tokenize(b);
  const max = Math.max(partsA.length, partsB.length);
  for (let i = 0; i < max; i += 1) {
    const left = partsA[i];
    const right = partsB[i];
    if (left === undefined) return -1;
    if (right === undefined) return 1;
    if (typeof left === 'number' && typeof right === 'number') {
      if (left !== right) return left - right;
      continue;
    }
    const cmp = String(left).localeCompare(String(right));
    if (cmp !== 0) return cmp;
  }
  return 0;
}

function parseValues(raw) {
  return raw.split(/[\n,]/).map((item) => item.trim()).filter(Boolean);
}

function uniqueCaseInsensitive(values) {
  const seen = new Set();
  return values.filter((value) => {
    const key = value.toUpperCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function normalizeSettings(settings) {
  const groups = Array.isArray(settings?.groups) ? settings.groups : DEFAULT_SETTINGS.groups;
  return {
    groups: groups.map((g) => ({ title: (g.title || '').trim(), values: (g.values || '').trim() })).filter((g) => g.title),
    maxRows: Math.max(1, Number(settings?.maxRows) || DEFAULT_SETTINGS.maxRows),
    columnGap: Math.max(0, Number(settings?.columnGap) || 0),
  };
}

function loadSettings() {
  try {
    return normalizeSettings(JSON.parse(localStorage.getItem('qr-locations-settings')) || DEFAULT_SETTINGS);
  } catch {
    return normalizeSettings(DEFAULT_SETTINGS);
  }
}

function saveSettings(settings) {
  localStorage.setItem('qr-locations-settings', JSON.stringify(normalizeSettings(settings)));
}

function addGroupRow(group = { title: '', values: '' }) {
  const row = groupTemplate.content.firstElementChild.cloneNode(true);
  row.querySelector('.group-title-input').value = group.title;
  row.querySelector('.group-values-input').value = group.values;
  row.querySelector('.remove-group').addEventListener('click', () => row.remove());

  row.addEventListener('dragstart', () => { dragItem = row; row.classList.add('dragging'); });
  row.addEventListener('dragend', () => { dragItem = null; row.classList.remove('dragging'); });
  row.addEventListener('dragover', (e) => {
    e.preventDefault();
    if (!dragItem || dragItem === row) return;
    const rect = row.getBoundingClientRect();
    const before = e.clientY < rect.top + rect.height / 2;
    if (before) groupsList.insertBefore(dragItem, row);
    else groupsList.insertBefore(dragItem, row.nextSibling);
  });

  groupsList.appendChild(row);
}

function openSettingsModal() {
  const settings = loadSettings();
  groupsList.replaceChildren();
  settings.groups.forEach((group) => addGroupRow(group));
  maxRowsInput.value = settings.maxRows;
  columnGapInput.value = settings.columnGap;
  settingsModal.classList.remove('hidden');
}

function collectSettingsFromUI() {
  const groups = [...groupsList.querySelectorAll('.group-item')].map((item) => ({
    title: item.querySelector('.group-title-input').value.trim(),
    values: item.querySelector('.group-values-input').value.trim(),
  })).filter((group) => group.title);
  return normalizeSettings({ groups, maxRows: maxRowsInput.value, columnGap: columnGapInput.value });
}

function toGrid(values, columns) {
  if (!values.length) return [];
  const rows = Math.ceil(values.length / columns);
  return Array.from({ length: rows }, (_, r) => Array.from({ length: columns }, (_, c) => values[r * columns + c] || ''));
}

function extractPrefix(location) {
  const afterColon = location.split(':')[1] || '';
  const match = afterColon.match(/^[A-Za-z]+/);
  return match ? match[0].toLowerCase() : '';
}

function groupLocations(locations, settings) {
  const result = Object.fromEntries(settings.groups.map((g) => [g.title, []]));
  result.unassigned = [];

  const rules = settings.groups.map((g) => ({
    title: g.title,
    keys: uniqueCaseInsensitive(parseValues(g.values).map((v) => v.toLowerCase())),
  }));

  locations.forEach((loc) => {
    const prefix = extractPrefix(loc);
    let assigned = false;

    for (const group of rules) {
      if (group.keys.includes(prefix) || (prefix.length >= 2 && group.keys.includes(prefix[0]))) {
        result[group.title].push(loc);
        assigned = true;
        break;
      }
    }
    if (!assigned) result.unassigned.push(loc);
  });

  return result;
}

function renderGroupedTables(grouped, priorities, settings) {
  const prioritySet = new Set(priorities.map((v) => v.toUpperCase()));
  const titles = [...settings.groups.map((g) => g.title), 'unassigned'];
  const blocks = [];

  titles.forEach((title) => {
    const values = grouped[title] || [];
    if (!values.length) return;

    const block = document.createElement('section');
    block.className = 'table-block';
    const h4 = document.createElement('h4');
    h4.textContent = `${title} (${values.length})`;
    block.appendChild(h4);

    const columns = Math.max(1, Math.ceil(values.length / settings.maxRows));
    const grid = toGrid(values, columns);

    const table = document.createElement('table');
    const body = document.createElement('tbody');
    grid.forEach((row) => {
      const tr = document.createElement('tr');
      row.forEach((value, idx) => {
        const td = document.createElement('td');
        td.textContent = value;
        if (value && prioritySet.has(value.toUpperCase())) td.classList.add('priority');
        tr.appendChild(td);
        if (idx < row.length - 1) {
          for (let g = 0; g < settings.columnGap; g += 1) {
            const gap = document.createElement('td');
            gap.className = 'gap';
            gap.textContent = '';
            tr.appendChild(gap);
          }
        }
      });
      body.appendChild(tr);
    });
    table.appendChild(body);
    block.appendChild(table);
    blocks.push(block);
  });

  tablesContainer.replaceChildren(...blocks);
}

function createArrangement() {
  const settings = loadSettings();
  const locations = uniqueCaseInsensitive(parseValues(locationsInput.value));
  const priorities = uniqueCaseInsensitive(parseValues(prioritiesInput.value)).sort(compareLocationCodes);

  if (!locations.length) {
    summary.textContent = 'Add at least one location.';
    tablesContainer.replaceChildren();
    priorityList.replaceChildren();
    return;
  }

  const grouped = groupLocations(locations, settings);
  renderGroupedTables(grouped, priorities, settings);

  summary.textContent = `${locations.length} unique locations arranged with ${settings.groups.length} group(s).`;
  priorityList.replaceChildren(...priorities.map((value) => {
    const li = document.createElement('li');
    li.textContent = value;
    return li;
  }));

  formView.classList.add('hidden');
  resultView.classList.remove('hidden');
}

function resetForm() {
  locationsInput.value = '';
  prioritiesInput.value = '';
}

settingsOpenBtn.addEventListener('click', openSettingsModal);
settingsCloseBtn.addEventListener('click', () => settingsModal.classList.add('hidden'));
addGroupBtn.addEventListener('click', () => addGroupRow());
defaultsBtn.addEventListener('click', () => {
  groupsList.replaceChildren();
  DEFAULT_SETTINGS.groups.forEach((g) => addGroupRow(g));
  maxRowsInput.value = DEFAULT_SETTINGS.maxRows;
  columnGapInput.value = DEFAULT_SETTINGS.columnGap;
});
saveSettingsBtn.addEventListener('click', () => {
  const settings = collectSettingsFromUI();
  if (!settings.groups.length) return;
  saveSettings(settings);
  settingsModal.classList.add('hidden');
});

createBtn.addEventListener('click', createArrangement);
resetBtn.addEventListener('click', resetForm);
backBtn.addEventListener('click', () => {
  resultView.classList.add('hidden');
  formView.classList.remove('hidden');
});

if (!localStorage.getItem('qr-locations-settings')) saveSettings(DEFAULT_SETTINGS);
