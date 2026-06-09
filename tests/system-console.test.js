const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.join(__dirname, '..');
const shellPages = [
    'project-management.html',
    'owner-management.html',
    'owner-detail.html',
    'console.html',
    'knowledge-center.html',
    'dictionary-management.html',
    'user-management.html',
    'organization-management.html',
    'role-management.html',
    'project-detail.html',
    'project-exploration.html',
    'project-data.html',
    'project-model.html',
    'project-report.html'
];

function readPage(fileName) {
    return fs.readFileSync(path.join(root, fileName), 'utf8');
}

test('top navigation exposes system console between owner management and knowledge center', () => {
    shellPages.forEach((fileName) => {
        const html = readPage(fileName);
        const navStart = html.indexOf('<nav');
        const navEnd = html.indexOf('</nav>', navStart);
        const navHtml = html.slice(navStart, navEnd);
        const ownerIndex = navHtml.indexOf('data-menu="owner"');
        const consoleIndex = navHtml.indexOf('data-menu="console"');
        const knowledgeIndex = navHtml.indexOf('data-menu="knowledge"');

        assert.ok(ownerIndex > -1, `${fileName} owner menu exists`);
        assert.ok(consoleIndex > ownerIndex, `${fileName} console menu follows owner menu`);
        assert.ok(knowledgeIndex > consoleIndex, `${fileName} knowledge menu follows console menu`);
        assert.match(navHtml, /href="console\.html"[\s\S]*data-menu="console"/, `${fileName} links to console page`);
        assert.match(navHtml, /developer_board[\s\S]*控制台/, `${fileName} shows Chinese console label with icon`);
    });
});

test('system console page renders device connection, binding and return-ledger areas', () => {
    const html = readPage('console.html');

    assert.match(html, /<body[^>]*data-menu="console"/);
    assert.match(html, /data-role="system-device-console"/);
    assert.match(html, /系统级设备控制台/);
    assert.match(html, /id="deviceTableBody"/);
    assert.doesNotMatch(html, /id="bindingRecordBody"/);
    assert.doesNotMatch(html, /id="returnRecordBody"/);
    assert.doesNotMatch(html, /操作边界/);
    assert.match(html, /id="recordViewModal"/);
    assert.match(html, /id="recordViewSummary"/);
    assert.match(html, /id="recordStartDate"/);
    assert.match(html, /id="recordEndDate"/);
    assert.match(html, /id="recordProjectFilter"/);
    assert.match(html, /id="recordFilterReset"/);
    assert.match(html, /id="recordPrevPage"/);
    assert.match(html, /id="recordNextPage"/);
    assert.match(html, /id="recordViewHead"/);
    assert.match(html, /id="recordViewBody"/);
    assert.match(html, /id="deviceBindModal"/);
    assert.match(html, /id="openDeviceAccess"/);
    assert.match(html, /id="deviceAccessModal"/);
    assert.match(html, /id="deviceAccessCode"/);
    assert.match(html, /id="deviceAccessEnv"[\s\S]*data-value="prod"/);
    assert.doesNotMatch(html, /<input id="deviceAccessEnv"/);
    assert.doesNotMatch(html, /<input id="deviceAccessDownTopic"/);
    assert.doesNotMatch(html, /<input id="deviceAccessUpTopic"/);
    assert.doesNotMatch(html, /<option value="test">test<\/option>/);
    assert.doesNotMatch(html, /<option value="dev">dev<\/option>/);
    assert.match(html, /id="deviceAccessDownTopic"/);
    assert.match(html, /id="deviceAccessUpTopic"/);
    assert.match(html, /id="deviceRemoveModal"/);
    assert.match(html, /id="deviceRemoveSubmit"/);
    assert.match(html, /新增设备接入/);
    assert.match(html, /移除设备/);
    assert.match(html, /data-device-action="connect"/);
    assert.match(html, /data-device-action="bind"/);
    assert.match(html, /data-device-action="rebind"/);
    assert.match(html, /data-device-action="unbind"/);
    assert.match(html, /data-device-action="remove"/);
    assert.match(html, /data-device-action="binding-history"/);
    assert.match(html, /data-device-action="return-records"/);
    assert.match(html, /当前有效绑定项目/);
});

test('system console opens binding history and return records from device action column', () => {
    const script = readPage('js/system-console.js');

    assert.match(script, /data-device-action="binding-history"/);
    assert.match(script, /data-device-action="return-records"/);
    assert.match(script, /openRecordModal\(type, deviceId\)/);
    assert.match(script, /renderSummaryMetric/);
    assert.match(script, /getFilteredRecordRows/);
    assert.match(script, /recordMatchesProject/);
    assert.match(script, /renderRecordPager/);
    assert.match(script, /pageSize: 10/);
    assert.match(script, /每页 10 条/);
    assert.match(script, /全部绑定项目/);
    assert.match(script, /绑定变更/);
    assert.match(script, /操作信息/);
    assert.match(script, /<th class="w-\[120px\] px-3 py-2">类型<\/th>/);
    assert.match(script, /<th class="w-\[96px\] px-3 py-2">状态<\/th>/);
    assert.match(script, /<th class="w-\[160px\] px-3 py-2">消息编号<\/th>/);
    assert.match(script, /<th class="w-\[140px\] px-3 py-2">响应指令<\/th>/);
    assert.match(script, /<th class="w-\[280px\] px-3 py-2">返回结果<\/th>/);
    assert.doesNotMatch(script, />消息详情</);
    assert.match(script, /回传记录/);
    assert.match(script, /绑定\/换绑历史/);
    assert.match(script, /设备回传记录/);
    assert.doesNotMatch(script, />Message ID</);
    assert.doesNotMatch(script, /Response To:/);
    assert.doesNotMatch(script, />Topic</);
    assert.match(script, /getBindingRecords\(device\.id\)\.length/);
    assert.match(script, /getReturnRecords\(device\.id\)\.length/);
});

test('system console binding flow enforces single active project per device', () => {
    const script = readPage('js/system-console.js');

    assert.match(script, /action === 'rebind' && currentProjectId/);
    assert.match(script, /当前绑定/);
    assert.match(script, /action === 'rebind' && projectId === device\.projectId/);
    assert.match(script, /请选择不同于当前绑定的目标项目/);
    assert.match(script, /换绑会关闭当前有效绑定，并将设备切换到新的目标项目/);
});

test('system console blocks rebind for offline devices', () => {
    const script = readPage('js/system-console.js');

    assert.match(script, /function isDeviceOffline\(device\)/);
    assert.match(script, /离线设备不可换绑/);
    assert.match(script, /action === 'rebind' && isDeviceOffline\(device\)/);
    assert.match(script, /disabled:cursor-not-allowed/);
});

test('system console supports registering a new access device before binding', () => {
    const script = readPage('js/system-console.js');

    assert.match(script, /function buildDeviceTopicTemplates\(env, deviceCode\)/);
    assert.match(script, /\/ypd\/\$\{envValue\}\/device\/\$\{code\}/);
    assert.match(script, /\/ypd\/\$\{envValue\}\/platform\/\$\{code\}/);
    assert.match(script, /function submitDeviceAccess\(\)/);
    assert.doesNotMatch(script, /deviceAccessEnv'\)\?\.addEventListener\('change'/);
    assert.match(script, /devices\.some\(device => device\.id === deviceId\)/);
    assert.match(script, /设备编号已存在/);
    assert.match(script, /projectId: ''/);
    assert.match(script, /taskState: '未开始'/);
    assert.match(script, /新增设备接入成功，当前为未绑定待连接状态/);
});

test('system console supports removing only unbound access devices', () => {
    const script = readPage('js/system-console.js');

    assert.match(script, /const removeBlocked = Boolean\(device\.projectId\)/);
    assert.match(script, /请先解绑项目后再移除设备/);
    assert.match(script, /function openDeviceRemoveModal\(deviceId\)/);
    assert.match(script, /function submitDeviceRemoval\(\)/);
    assert.match(script, /devices\.splice\(index, 1\)/);
    assert.match(script, /已移除设备接入登记/);
    assert.match(script, /data-device-action="remove"/);
});

test('navigation manager recognizes console page and hash', () => {
    const { NavigationManager } = require('../js/navigation.js');

    assert.equal(NavigationManager.getMenuFromPath('/console.html'), 'console');
    assert.equal(NavigationManager.getMenuFromHash('#console'), 'console');
});
