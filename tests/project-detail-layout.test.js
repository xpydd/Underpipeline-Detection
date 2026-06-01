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
const radarSupplementLabels = [
    '管点二级分类',
    '特征点',
    '附属物',
    '建设日期',
    '权属单位',
    '井盖材质',
    '井盖类型',
    '井盖形状',
    '井盖尺寸',
    '井室规格',
    '井室尺寸',
    '井脖尺寸',
    '井脖深',
    '埋设方式',
    '管径/截面',
    '套管尺寸',
    '套管材质',
    '埋设年代'
];
const radarSupplementKeys = [
    'pointSecondaryCategory',
    'feature',
    'attachment',
    'buildDate',
    'owner',
    'coverMaterial',
    'coverType',
    'coverShape',
    'coverSize',
    'chamberSpec',
    'chamberSize',
    'neckSize',
    'neckDepth',
    'layingMethod',
    'diameterText',
    'casingSize',
    'casingMaterial',
    'burialYear'
];
const radarRequiredSupplementKeys = [
    'pointSecondaryCategory',
    'feature',
    'attachment',
    'buildDate',
    'owner',
    'coverMaterial',
    'coverType',
    'coverShape',
    'coverSize',
    'chamberSpec',
    'chamberSize',
    'neckSize',
    'neckDepth',
    'layingMethod',
    'diameterText',
    'burialYear'
];
const radarOptionalSupplementKeys = [
    'casingSize',
    'casingMaterial'
];
const radarDictionarySupplementKeys = [
    'pointSecondaryCategory',
    'feature',
    'attachment',
    'coverMaterial',
    'coverType',
    'coverShape',
    'layingMethod',
    'casingMaterial'
];
const radarReturnHeaderMappings = [
    'file_name -> 所属测线',
    '导入状态',
    '管点编号 -> 管点编号',
    'pipe_id -> 管线归并ID',
    '同一测线同 pipe_id 合并为一条管线',
    'type -> 管点种类/二级分类',
    'depth_m -> 埋深',
    'diameter_m -> 管径/截面默认值',
    'material -> 管线材质',
    '经纬高 -> 空间坐标'
];

function extractFunctionBlock(pageHtml, name) {
    const start = pageHtml.indexOf(`function ${name}(`);
    assert.notEqual(start, -1, `${name} should exist`);
    const nextFunction = pageHtml.indexOf('\n    function ', start + 1);
    return pageHtml.slice(start, nextFunction === -1 ? undefined : nextFunction);
}

function extractDialogBlock(pageHtml, dialogId) {
    const start = pageHtml.indexOf(`<dialog id="${dialogId}"`);
    assert.notEqual(start, -1, `${dialogId} should exist`);
    const end = pageHtml.indexOf('</dialog>', start);
    assert.notEqual(end, -1, `${dialogId} should close`);
    return pageHtml.slice(start, end + '</dialog>'.length);
}

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
        const radarDialog = extractDialogBlock(pageHtml, 'radarScanModal');
        const rowMapper = extractFunctionBlock(pageHtml, 'radarScanRowToExplorationRecord');
        const appender = extractFunctionBlock(pageHtml, 'appendRadarScanRecordsToExploration');
        const importer = extractFunctionBlock(pageHtml, 'importSelectedRadarScanRows');
        const defaults = extractFunctionBlock(pageHtml, 'getRadarSupplementDefaults');

        assert.match(pageHtml, /onclick="openRadarScanModal\(\)"/, fileName);
        assert.match(pageHtml, /id="radarScanResultBody"/, fileName);
        assert.match(pageHtml, /data-role="radar-result-table"/, fileName);
        assert.match(pageHtml, /class="radar-scan-table w-full min-w-\[4440px\] text-\[11px\]"/, fileName);
        assert.match(pageHtml, /\.radar-scan-table th,[\s\S]*white-space: nowrap;/, fileName);
        assert.match(pageHtml, /\.radar-scan-table th > span \+ span[\s\S]*overflow-wrap: anywhere;/, `${fileName} header helper text wraps inside its own header cell`);
        assert.match(pageHtml, /<colgroup>[\s\S]*width: 176px[\s\S]*width: 128px[\s\S]*<\/colgroup>/, fileName);
        assert.match(pageHtml, /colspan="38"/, fileName);
        assert.match(pageHtml, /id="radarScanSelectAll"/, fileName);
        assert.match(pageHtml, /id="radarImportSelectedBtn"/, fileName);
        assert.match(pageHtml, /id="radarScanPagination"/, `${fileName} pagination control exists`);
        assert.match(pageHtml, /const RADAR_SCAN_PAGE_SIZE = 10/, `${fileName} page size is ten rows`);
        assert.match(pageHtml, /let radarScanPage = 1/, `${fileName} tracks current scan page`);
        assert.match(pageHtml, /返回结果数据列表/, fileName);
        assert.match(pageHtml, /data-role="radar-field-mapping"/, fileName);
        assert.match(pageHtml, /data-role="radar-supplement-fields"/, fileName);
        assert.match(pageHtml, /设备字段/, fileName);
        assert.match(pageHtml, /勘探字段/, fileName);
        assert.match(pageHtml, /设备回传字段/, fileName);
        assert.match(pageHtml, /设备未回传 -&gt; 勘探补录字段|设备未回传 -> 勘探补录字段/, fileName);
        assert.match(pageHtml, /勘探补录字段/, fileName);
        radarReturnHeaderMappings.forEach((mapping) => {
            assert.match(pageHtml, new RegExp(mapping.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')), `${fileName} ${mapping}`);
        });
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
        assert.match(pageHtml, /function getSortedRadarScanRows/, `${fileName} sorts scan rows by import status`);
        assert.match(pageHtml, /function getCurrentRadarScanPageRows/, `${fileName} slices current page rows`);
        assert.match(pageHtml, /function renderRadarScanPagination/, `${fileName} renders scan pagination`);
        assert.match(pageHtml, /function goRadarScanPage/, `${fileName} supports page switching`);
        assert.match(pageHtml, /updateRadarScanField/, fileName);
        assert.match(pageHtml, /renderRadarReadOnlyCell/, fileName);
        assert.match(pageHtml, /renderRadarSupplementCells/, fileName);
        assert.match(pageHtml, /renderRadarSupplementControl/, `${fileName} supplement fields choose input or dictionary select`);
        assert.match(pageHtml, /function renderRadarSelect/, `${fileName} dictionary supplement fields render selects`);
        assert.match(pageHtml, /function getRadarSupplementFieldOptions/, `${fileName} dictionary supplement fields use shared options`);
        assert.match(pageHtml, /radarPointAttachmentOptions/, `${fileName} supplement attachment dictionary exists`);
        assert.match(pageHtml, /radarCoverMaterialOptions/, `${fileName} cover material dictionary exists`);
        assert.match(pageHtml, /radarLayingMethodOptions/, `${fileName} laying method dictionary exists`);
        assert.match(pageHtml, /getRadarSupplementDefaults/, fileName);
        assert.match(pageHtml, /getRadarRowImportStatus/, fileName);
        assert.match(pageHtml, /importSelectedRadarScanRows/, fileName);
        assert.match(pageHtml, /appendRadarScanRecordsToExploration/, fileName);
        assert.match(pageHtml, /RadarPrototype\.parseDetectionMessage/, fileName);
        assert.match(pageHtml, /RadarPrototype\.buildExplorationRecordsFromCandidates/, fileName);
        radarSupplementLabels.forEach((label) => {
            assert.match(pageHtml, new RegExp(label), `${fileName} ${label}`);
        });
        radarSupplementKeys.forEach((key) => {
            assert.match(pageHtml, new RegExp(key), `${fileName} ${key}`);
        });
        radarRequiredSupplementKeys.forEach((key) => {
            assert.match(pageHtml, new RegExp(`data-radar-column="${key}"\\s+data-required="true"`), `${fileName} ${key} required header`);
        });
        radarOptionalSupplementKeys.forEach((key) => {
            assert.match(pageHtml, new RegExp(`data-radar-column="${key}"\\s+data-required="false"`), `${fileName} ${key} optional header`);
        });
        radarDictionarySupplementKeys.forEach((key) => {
            assert.match(pageHtml, new RegExp(`key: '${key}'[\\s\\S]*?type: 'select'`), `${fileName} ${key} dictionary select`);
        });
        assert.match(pageHtml, /text-red-500">\*<\/span>/, `${fileName} red required asterisk`);
        assert.match(pageHtml, /function validateRadarRequiredFields/, `${fileName} required validation function`);
        assert.match(pageHtml, /required aria-required="true"/, `${fileName} required input marker`);
        assert.match(pageHtml, /validationMissingKeys/, `${fileName} missing field highlighting`);
        assert.match(importer, /validateRadarRequiredFields\(selectedRows\)/, `${fileName} import validates required fields`);
        assert.match(importer, /radarScanRows\.filter\(row => row\.checked && !getRadarRowImportStatus\(row\)\.imported\)/, `${fileName} imports selected rows across pages`);
        assert.match(pageHtml, /getCurrentRadarScanPageRows\(\)\.forEach/, `${fileName} select all only affects current page`);
        assert.match(pageHtml, /row\.checked = !getRadarRowImportStatus\(row\)\.imported && Boolean\(value\)/, `${fileName} imported rows cannot be selected`);
        assert.match(pageHtml, /function getRadarPipelineGroupKey/, `${fileName} pipeline grouping helper`);
        assert.match(pageHtml, /function getRadarPipelineId/, `${fileName} pipeline id helper`);
        assert.match(rowMapper, /supplementValues/, `${fileName} row mapper supplement values`);
        assert.match(rowMapper, /\.\.\.supplementValues/, `${fileName} row mapper spreads supplement fields`);
        assert.match(rowMapper, /feature:\s*supplementValues\.feature/, `${fileName} feature mapping`);
        assert.match(rowMapper, /accessory:\s*supplementValues\.attachment/, `${fileName} accessory mapping`);
        assert.match(rowMapper, /owner:\s*supplementValues\.owner/, `${fileName} owner mapping`);
        assert.match(rowMapper, /diameter:\s*supplementValues\.diameterText/, `${fileName} diameter mapping`);
        assert.match(rowMapper, /method:\s*supplementValues\.layingMethod/, `${fileName} laying method mapping`);
        assert.match(rowMapper, /year:\s*supplementValues\.burialYear/, `${fileName} burial year mapping`);
        assert.match(appender, /accessory:\s*record\.accessory/, `${fileName} imported point accessory`);
        assert.match(appender, /pointSecondaryCategory:\s*record\.pointSecondaryCategory/, `${fileName} imported point secondary category`);
        assert.match(appender, /coverMaterial:\s*record\.coverMaterial/, `${fileName} imported cover material`);
        assert.match(appender, /casingMaterial:\s*record\.casingMaterial/, `${fileName} imported casing material`);
        assert.match(appender, /burialYear:\s*record\.burialYear/, `${fileName} imported burial year`);
        assert.match(appender, /getRadarPipelineGroupKey\(item\.record\)/, `${fileName} groups pipelines by survey line and pipe id`);
        assert.match(pageHtml, /segmentPointIds/, `${fileName} tracks grouped pipeline points`);
        assert.match(pageHtml, /sourceCandidateIds/, `${fileName} tracks grouped result rows`);
        assert.match(pageHtml, /detectionCount/, `${fileName} tracks detection count`);
        assert.doesNotMatch(defaults, /雷达识别点|雷达回传|typeMeta\.owner|baseRecord\.feature|baseRecord\.owner|'直埋'/, `${fileName} supplement defaults stay empty unless returned`);
        assert.doesNotMatch(appender, /const key = item\.record\.sourceSurveyLine \|\| 'radar'/, `${fileName} no longer groups only by survey line`);
        assert.doesNotMatch(pageHtml, /<th[^>]*>回传时间<\/th>/, fileName);
        assert.doesNotMatch(pageHtml, /min-w-\[1840px\]/, fileName);
        assert.doesNotMatch(pageHtml, /min-w-\[2360px\]/, fileName);
        assert.doesNotMatch(pageHtml, /renderRadarInput\(row, index, 'receivedAt'/, fileName);
        assert.doesNotMatch(pageHtml, /renderRadarInput\(row, index, 'surveyLineFileName'/, fileName);
        assert.doesNotMatch(radarDialog, /data-radar-column="antennaConfig"/, `${fileName} hides antenna column`);
        assert.doesNotMatch(radarDialog, /data-radar-column="validMapPoint"/, `${fileName} hides validity status column`);
        assert.doesNotMatch(pageHtml, /renderRadarInput\(row, index, 'antennaConfig'/, `${fileName} antenna is not editable`);
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
