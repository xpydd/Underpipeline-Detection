const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const html = fs.readFileSync(path.join(__dirname, '..', 'project-detail.html'), 'utf8');
const projectSubPages = [
    'project-exploration.html',
    'project-data.html',
    'project-model.html',
    'project-report.html'
];
const projectWorkbenchPages = [
    'project-detail.html',
    ...projectSubPages
];
const workbenchMenus = [
    ['project', '项目'],
    ['exploration', '勘探'],
    ['data', '数据'],
    ['model', '模型'],
    ['report', '报告']
];

test('project detail header uses compact single-row layout', () => {
    assert.match(html, /data-role="compact-project-header"/);
    assert.match(html, /min-h-\[56px\]/);
    assert.match(html, /<main class="[^"]*pt-3[^"]*"/);
    assert.match(html, /<h2 class="[^"]*text-lg[^"]*" id="project-title"/);
    assert.match(html, /<nav class="[^"]*gap-2[^"]*" aria-label="Tabs"/);
    assert.match(html, /h-\[calc\(100vh-8rem\)\]/);
    assert.doesNotMatch(html, /space-y-2">\s*<!-- 标题与操作 -->/);
    assert.doesNotMatch(html, /flex justify-between items-center h-10/);
});

test('project detail child pages use the same compact project header', () => {
    projectSubPages.forEach((fileName) => {
        const pageHtml = fs.readFileSync(path.join(__dirname, '..', fileName), 'utf8');

        assert.match(pageHtml, /data-role="compact-project-header"/, fileName);
        assert.match(pageHtml, /min-h-\[56px\]/, fileName);
        assert.match(pageHtml, /<main class="[^"]*pt-3[^"]*"/, fileName);
        assert.match(pageHtml, /<h2 class="[^"]*text-lg[^"]*" id="project-title"/, fileName);
        assert.match(pageHtml, /<nav class="[^"]*gap-2[^"]*" aria-label="Tabs"/, fileName);
        assert.match(pageHtml, /data-top-menu="console"/, fileName);
        assert.match(pageHtml, /developer_board[\s\S]*控制台/, fileName);
        assert.match(pageHtml, /h-\[calc\(100vh-8rem\)\]/, fileName);
        assert.doesNotMatch(pageHtml, /mb-4 space-y-2/, fileName);
        assert.doesNotMatch(pageHtml, /flex justify-between items-center h-10/, fileName);
    });
});

test('project workbench side menu shows Chinese labels without mixing top-level console entry', () => {
    projectWorkbenchPages.forEach((fileName) => {
        const pageHtml = fs.readFileSync(path.join(__dirname, '..', fileName), 'utf8');

        assert.match(pageHtml, /<nav class="[^"]*w-28[^"]*"[^>]*data-role="project-workbench-menu"/, fileName);
        assert.doesNotMatch(pageHtml, /w-16 shrink-0/, fileName);
        workbenchMenus.forEach(([key, label]) => {
            assert.match(pageHtml, new RegExp(`data-workbench-menu="${key}"`), `${fileName} ${label}`);
            assert.match(pageHtml, new RegExp(`<span>${label}</span>`), `${fileName} ${label}`);
        });
        assert.doesNotMatch(pageHtml, /data-workbench-menu="console"/, fileName);
        assert.doesNotMatch(pageHtml, /absolute left-full[\s\S]*group-hover:opacity-100/, fileName);
    });
});
