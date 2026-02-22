const {
  parseLines,
  parseGroupValues,
  normalizeConfig,
  groupLocations,
  groupByTitle,
  buildOutputMatrix,
  buildPrioritySet,
} = require('../logic');

describe('logic helpers', () => {
  test('parseLines trims and removes blanks', () => {
    expect(parseLines('A\n\n  B  \n')).toEqual(['A', 'B']);
  });

  test('parseGroupValues supports commas and spaces', () => {
    expect(parseGroupValues('A, B C')).toEqual(['A', 'B', 'C']);
  });
});

describe('grouping rules', () => {
  const config = normalizeConfig({
    groups: [
      { title: 'pallets', values: ['a', 'b', 'c'] },
      { title: 'mnst', values: ['m', 'n', 's', 't', 'mez'] },
    ],
    maxRows: 2,
    columnGap: 1,
  });

  test('groupLocations matches exact 3+ letter prefixes or first letter', () => {
    const locations = ['SS4:MEZ111.A', 'SS4:TR333.A', 'SS4:AB123.A'];
    const grouped = groupLocations(locations, config);

    expect(grouped.mez).toEqual(['SS4:MEZ111.A']);
    expect(grouped.t).toEqual(['SS4:TR333.A']);
    expect(grouped.unassigned).toEqual(['SS4:AB123.A']);
  });

  test('groupByTitle maps grouped values to titles', () => {
    const locations = ['SS4:MEZ111.A', 'SS4:TR333.A'];
    const grouped = groupLocations(locations, config);
    const titleGrouped = groupByTitle(grouped, config);

    expect(titleGrouped.mnst).toEqual(['SS4:MEZ111.A', 'SS4:TR333.A']);
  });
});

describe('output layout', () => {
  test('buildOutputMatrix handles spillover columns', () => {
    const matrix = buildOutputMatrix(
      ['pallets'],
      { pallets: ['L1', 'L2', 'L3', 'L4', 'L5'], unassigned: [] },
      2,
      0,
    );

    expect(matrix.headers).toEqual(['pallets', 'pallets', 'pallets']);
    expect(matrix.rows).toEqual([
      ['L1', 'L3', 'L5'],
      ['L2', 'L4', ''],
    ]);
  });

  test('buildPrioritySet only keeps matches', () => {
    const set = buildPrioritySet(['A', 'B'], ['B', 'C']);
    expect(Array.from(set)).toEqual(['B']);
  });
});
