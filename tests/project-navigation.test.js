const test = require('node:test');
const assert = require('node:assert/strict');

const { buildProjectUrl } = require('../js/project-navigation.js');

test('buildProjectUrl preserves hash when adding project id', () => {
    assert.equal(
        buildProjectUrl('project-detail.html#console', 'PROJ-2024-001'),
        'project-detail.html?id=PROJ-2024-001#console'
    );
    assert.equal(
        buildProjectUrl('project-detail.html?tab=work#console', 'PROJ-2024-001'),
        'project-detail.html?tab=work&id=PROJ-2024-001#console'
    );
});
