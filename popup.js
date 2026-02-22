const formView = document.getElementById('form-view');
const resultView = document.getElementById('result-view');
const locationsInput = document.getElementById('locations');
const prioritiesInput = document.getElementById('priorities');
const columnsInput = document.getElementById('columns');
const fillModeInput = document.getElementById('fill-mode');
const tableContainer = document.getElementById('table-container');
const summary = document.getElementById('summary');
const priorityList = document.getElementById('priority-list');

const createBtn = document.getElementById('create');
const resetBtn = document.getElementById('reset');
const backBtn = document.getElementById('back');

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

    const leftStr = String(left);
    const rightStr = String(right);
    const cmp = leftStr.localeCompare(rightStr);
    if (cmp !== 0) return cmp;
  }

  return 0;
}

function parseValues(raw) {
  return raw
    .split(/[\n,]/)
    .map((item) => item.trim())
    .filter(Boolean);
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

function toGrid(values, columns, fillMode) {
  if (values.length === 0) return [];
  const totalRows = Math.ceil(values.length / columns);
  const grid = Array.from({ length: totalRows }, () => Array.from({ length: columns }, () => ''));

  values.forEach((value, index) => {
    if (fillMode === 'column') {
      const row = index % totalRows;
      const col = Math.floor(index / totalRows);
      if (col < columns) grid[row][col] = value;
      return;
    }

    const row = Math.floor(index / columns);
    const col = index % columns;
    grid[row][col] = value;
  });

  return grid;
}

function renderTable(grid, prioritySet) {
  const table = document.createElement('table');
  const body = document.createElement('tbody');

  grid.forEach((row) => {
    const tr = document.createElement('tr');
    row.forEach((value) => {
      const td = document.createElement('td');
      td.textContent = value;
      if (value && prioritySet.has(value.toUpperCase())) {
        td.classList.add('priority');
      }
      tr.appendChild(td);
    });
    body.appendChild(tr);
  });

  table.appendChild(body);
  tableContainer.replaceChildren(table);
}

function createArrangement() {
  const locations = uniqueCaseInsensitive(parseValues(locationsInput.value));
  const priorities = uniqueCaseInsensitive(parseValues(prioritiesInput.value)).sort(compareLocationCodes);

  if (locations.length === 0) {
    summary.textContent = 'Add at least one location.';
    tableContainer.replaceChildren();
    priorityList.replaceChildren();
    return;
  }

  const columns = Math.max(1, Number(columnsInput.value) || 1);
  const fillMode = fillModeInput.value === 'column' ? 'column' : 'row';
  const grid = toGrid(locations, columns, fillMode);
  const prioritySet = new Set(priorities.map((value) => value.toUpperCase()));

  renderTable(grid, prioritySet);
  summary.textContent = `${locations.length} locations arranged in ${columns} column(s), ${fillMode}-first.`;

  priorityList.replaceChildren(
    ...priorities.map((value) => {
      const li = document.createElement('li');
      li.textContent = value;
      return li;
    }),
  );

  formView.classList.add('hidden');
  resultView.classList.remove('hidden');
}

function resetForm() {
  locationsInput.value = '';
  prioritiesInput.value = '';
  columnsInput.value = '4';
  fillModeInput.value = 'row';
}

createBtn.addEventListener('click', createArrangement);
resetBtn.addEventListener('click', resetForm);
backBtn.addEventListener('click', () => {
  resultView.classList.add('hidden');
  formView.classList.remove('hidden');
});
