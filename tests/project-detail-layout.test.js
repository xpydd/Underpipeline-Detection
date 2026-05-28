const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const html = fs.readFileSync(path.join(__dirname, '..', 'project-detail.html'), 'utf8');
const explorationHtml = fs.readFileSync(path.join(__dirname, '..', 'project-exploration.html'), 'utf8');
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

test('project detail static console fallback omits current direction card', () => {
    assert.doesNotMatch(html, /id="deviceDirection"/);
    assert.doesNotMatch(html, />\s*当前方向\s*</);
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

test('radar scan modal is based on device returned result rows and imports to exploration map', () => {
    [
        ['project-detail.html', html],
        ['project-exploration.html', explorationHtml]
    ].forEach(([fileName, pageHtml]) => {
        assert.match(pageHtml, /onclick="openRadarScanModal\(\)"/, fileName);
        assert.match(pageHtml, /id="radarScanResultBody"/, fileName);
        assert.match(pageHtml, /data-role="radar-result-table"/, fileName);
        assert.match(pageHtml, /class="radar-scan-table w-full min-w-\[2360px\] text-\[11px\]"/, fileName);
        assert.match(pageHtml, /\.radar-scan-table th,[\s\S]*white-space: nowrap;/, fileName);
        assert.match(pageHtml, /<colgroup>[\s\S]*width: 176px[\s\S]*width: 128px[\s\S]*<\/colgroup>/, fileName);
        assert.match(pageHtml, /id="radarScanSelectAll"/, fileName);
        assert.match(pageHtml, /id="radarImportSelectedBtn"/, fileName);
        assert.match(pageHtml, /返回结果数据列表/, fileName);
        assert.match(pageHtml, /data-role="radar-field-mapping"/, fileName);
        assert.match(pageHtml, /设备字段/, fileName);
        assert.match(pageHtml, /勘探字段/, fileName);
        assert.match(pageHtml, /测线文件/, fileName);
        assert.match(pageHtml, /导入状态/, fileName);
        assert.match(pageHtml, /管线ID/, fileName);
        assert.match(pageHtml, /峰值振幅/, fileName);
        assert.match(pageHtml, /反射时间/, fileName);
        assert.match(pageHtml, /经度/, fileName);
        assert.match(pageHtml, /纬度/, fileName);
        assert.match(pageHtml, /openRadarScanModal/, fileName);
        assert.match(pageHtml, /loadRadarScanResults/, fileName);
        assert.match(pageHtml, /renderRadarScanRows/, fileName);
        assert.match(pageHtml, /updateRadarScanField/, fileName);
        assert.match(pageHtml, /renderRadarReadOnlyCell/, fileName);
        assert.match(pageHtml, /getRadarRowImportStatus/, fileName);
        assert.match(pageHtml, /importSelectedRadarScanRows/, fileName);
        assert.match(pageHtml, /appendRadarScanRecordsToExploration/, fileName);
        assert.match(pageHtml, /RadarPrototype\.parseDetectionMessage/, fileName);
        assert.match(pageHtml, /RadarPrototype\.buildExplorationRecordsFromCandidates/, fileName);
        assert.doesNotMatch(pageHtml, /<th[^>]*>回传时间<\/th>/, fileName);
        assert.doesNotMatch(pageHtml, /min-w-\[1840px\]/, fileName);
        assert.doesNotMatch(pageHtml, /renderRadarInput\(row, index, 'receivedAt'/, fileName);
        assert.doesNotMatch(pageHtml, /renderRadarInput\(row, index, 'surveyLineFileName'/, fileName);
        assert.doesNotMatch(pageHtml, /雷达设备接入控制台/, fileName);
        assert.doesNotMatch(pageHtml, /检测结果接收/, fileName);
        assert.doesNotMatch(pageHtml, /接入日志/, fileName);
        assert.doesNotMatch(pageHtml, /id="projectNumberContainer"/, fileName);
        assert.doesNotMatch(pageHtml, /id="projectDataContainer"/, fileName);
        assert.doesNotMatch(pageHtml, /id="startTransferBtn"/, fileName);
        assert.doesNotMatch(pageHtml, /function startTransfer\(/, fileName);
        assert.doesNotMatch(pageHtml, /数据传输/, fileName);
    });
});
