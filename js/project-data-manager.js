class PipelineDataManager {
    constructor() {
        this.storageKey = 'project-data-ledger-v2';
        this.pageSize = 10;
        this.currentPage = 1;
        this.currentType = 'all';
        this.viewMode = 'detail';
        this.searchKeyword = '';
        this.tableMode = 'normal';
        this.selectedRecordId = null;
        this.selectedDeleteIds = new Set();
        this.importModalMode = 'import';
        this.importRows = { update: [], new: [] };
        this.pendingDeleteIds = [];
        this.typeMeta = {
            electricity: {
                label: '电力',
                prefix: 'E',
                owner: '电力公司',
                features: ['一般管线点', '转折点', '分支点', '三分支', '四分支', '五分支', '多分支', '预留口', '非普查', '入户', '井边点', '井内点', '上杆', '拐点', '弯头', '出地', '终止点'],
                attachments: ['', '电缆井', '电缆沟', '工作井', '箱变', '标识桩']
            },
            drainage: {
                label: '排水',
                prefix: 'D',
                owner: '市政公司',
                features: ['一般管线点', '三通', '四通', '五通', '六通', '七通', '八通', '九通', '多通', '户出', '入户', '起始点', '终止点', '进水口', '出水口', '预留口', '非普查', '出地', '变径', '拐点', '井边点', '井内点', '沟边点', '连接暗井', '转折点'],
                attachments: ['', '检查井', '雨水井', '污水井', '跌水井', '井盖']
            },
            gas: {
                label: '燃气',
                prefix: 'G',
                owner: '燃气公司',
                features: ['一般管线点', '变径', '出地', '盖堵', '弯头', '拐点', '三通', '四通', '五通', '多通', '预留口', '非普查', '入户', '井边点', '井内点', '起始点', '终止点', '变深'],
                attachments: ['', '阀门井', '阀门', '凝水井', '调压箱', '标识桩']
            },
            industrial: {
                label: '工业',
                prefix: 'I',
                owner: '工业园区',
                features: ['一般管线点', '变径', '出地', '盖堵', '弯头', '拐点', '三通', '四通', '五通', '多通', '预留口', '非普查', '入户', '井边点', '井内点', '起始点', '终止点', '变深'],
                attachments: ['', '检查井', '阀门井', '仪表井', '支架', '标识桩']
            },
            telecom: {
                label: '通信',
                prefix: 'T',
                owner: '通信公司',
                features: ['一般管线点', '转折点', '分支点', '三分支', '四分支', '五分支', '多分支', '预留口', '非普查', '入户', '井边点', '井内点', '上杆', '拐点', '弯头', '出地', '终止点'],
                attachments: ['', '人孔井', '手孔井', '交接箱', '分纤箱', '标识桩']
            },
            water: {
                label: '给水',
                prefix: 'W',
                owner: '自来水公司',
                features: ['一般管线点', '变径', '出地', '盖堵', '弯头', '拐点', '三通', '四通', '五通', '多通', '预留口', '非普查', '入户', '井边点', '井内点', '起始点', '终止点', '变深'],
                attachments: ['', '阀门井', '阀门', '水表井', '消防栓', '检查井']
            },
            heat: {
                label: '热力',
                prefix: 'H',
                owner: '热力公司',
                features: ['一般管线点', '变径', '出地', '盖堵', '弯头', '拐点', '三通', '四通', '五通', '多通', '预留口', '非普查', '入户', '井边点', '井内点', '起始点', '终止点', '变深'],
                attachments: ['', '阀门井', '补偿器井', '放气井', '检查井', '固定支架']
            },
            other: {
                label: '其他',
                prefix: 'O',
                owner: '综合管养单位',
                features: ['一般管线点', '变径', '出地', '盖堵', '弯头', '拐点', '三通', '四通', '五通', '多通', '预留口', '非普查', '入户', '井边点', '井内点', '起始点', '终止点', '变深'],
                attachments: ['', '检查井', '阀门井', '标识桩', '接线箱', '其他']
            }
        };
        this.typeOptions = ['water', 'gas', 'drainage', 'electricity', 'heat', 'telecom', 'industrial', 'other'];
        this.pointCategoryOrder = ['electricity', 'drainage', 'gas', 'industrial', 'telecom', 'water', 'heat', 'other'];
        this.staticSelectOptions = {
            material: ['PE', 'PVC', '钢', '铸铁', '混凝土'],
            casingMaterial: ['', '钢', 'PE', 'PVC', '混凝土'],
            method: ['直埋', '管沟', '架空']
        };
        this.featureAliases = {
            管点: '一般管线点',
            折点: '转折点'
        };
        this.attachmentAliases = {
            井盖: '检查井',
            阀门: '阀门井'
        };
        this.columnDefs = [
            { key: 'pointNo', bg: '' },
            { key: 'connectNo', bg: '' },
            { key: 'length', bg: '' },
            { key: 'pointCategory', bg: '', type: 'select' },
            { key: 'feature', bg: '', type: 'select' },
            { key: 'attachment', bg: '', type: 'select' },
            { key: 'material', bg: '', type: 'select', options: this.staticSelectOptions.material },
            { key: 'diameter', bg: '' },
            { key: 'casing', bg: '' },
            { key: 'casingMaterial', bg: '', type: 'select', options: this.staticSelectOptions.casingMaterial },
            { key: 'pressure', bg: '' },
            { key: 'flow', bg: '' },
            { key: 'holes', bg: '' },
            { key: 'x', bg: 'bg-slate-50 dark:bg-slate-800' },
            { key: 'y', bg: 'bg-slate-50 dark:bg-slate-800' },
            { key: 'groundElev', bg: 'bg-slate-50 dark:bg-slate-800' },
            { key: 'topElev', bg: 'bg-slate-50 dark:bg-slate-800' },
            { key: 'bottomElev', bg: 'bg-slate-50 dark:bg-slate-800' },
            { key: 'startDepth', bg: 'bg-slate-50 dark:bg-slate-800' },
            { key: 'endDepth', bg: 'bg-slate-50 dark:bg-slate-800' },
            { key: 'method', bg: '', type: 'select', options: this.staticSelectOptions.method },
            { key: 'year', bg: '' },
            { key: 'owner', bg: '' },
            { key: 'note', bg: '' }
        ];
        this.importColumnDefs = [
            { key: 'pointNo', type: 'text', classKey: 'pointNoClass' },
            { key: 'connectNo', type: 'text', classKey: 'connectNoClass' },
            { key: 'length', type: 'text' },
            { key: 'pointCategory', type: 'select' },
            { key: 'feature', type: 'select' },
            { key: 'attachment', type: 'select' },
            { key: 'material', type: 'select', options: this.staticSelectOptions.material },
            { key: 'diameter', type: 'text' },
            { key: 'casing', type: 'text' },
            { key: 'casingMaterial', type: 'select', options: this.staticSelectOptions.casingMaterial },
            { key: 'pressure', type: 'text' },
            { key: 'flow', type: 'text' },
            { key: 'holes', type: 'text', classKey: 'holesClass' },
            { key: 'x', type: 'text', classKey: 'xClass' },
            { key: 'y', type: 'text', classKey: 'yClass' },
            { key: 'groundElev', type: 'text', classKey: 'groundClass' },
            { key: 'topElev', type: 'text' },
            { key: 'bottomElev', type: 'text' },
            { key: 'startDepth', type: 'text' },
            { key: 'endDepth', type: 'text' },
            { key: 'method', type: 'select', options: this.staticSelectOptions.method },
            { key: 'year', type: 'text' },
            { key: 'owner', type: 'text' }
        ];
        this.data = this.loadData();
        this.init();
    }

    init() {
        this.bindStaticEvents();
        this.renderActionBar();
        this.renderTable();
        this.updateTypeButtons();
    }

    getCurrentDefaultType() {
        return this.currentType === 'all' ? 'drainage' : this.currentType;
    }

    getTypeLabel(typeKey) {
        return this.typeMeta[typeKey]?.label || this.typeMeta[this.getCurrentDefaultType()].label;
    }

    getPointCategoryOptions() {
        return this.pointCategoryOrder.map(typeKey => this.typeMeta[typeKey].label);
    }

    inferTypeFromPointNo(pointNo, fallback = null) {
        const normalizedPointNo = String(pointNo || '').trim().toUpperCase();
        if (!normalizedPointNo) return this.resolveTypeKey(fallback);

        const matchedType = Object.entries(this.typeMeta).find(([, meta]) => normalizedPointNo.startsWith(meta.prefix.toUpperCase()));
        if (matchedType) return matchedType[0];
        return this.resolveTypeKey(fallback);
    }

    resolveTypeKey(pointCategoryOrType, fallback = null) {
        if (pointCategoryOrType && this.typeMeta[pointCategoryOrType]) return pointCategoryOrType;
        const byLabel = Object.entries(this.typeMeta).find(([, meta]) => meta.label === pointCategoryOrType);
        if (byLabel) return byLabel[0];
        return this.typeMeta[fallback] ? fallback : this.getCurrentDefaultType();
    }

    getFeatureOptions(typeKey) {
        return this.typeMeta[this.resolveTypeKey(typeKey)].features;
    }

    getAttachmentOptions(typeKey) {
        return this.typeMeta[this.resolveTypeKey(typeKey)].attachments;
    }

    getFieldOptions(fieldKey, rowOrType = null) {
        const typeKey = typeof rowOrType === 'string'
            ? this.resolveTypeKey(rowOrType)
            : this.resolveTypeKey(rowOrType?.pointCategory || rowOrType?.type, rowOrType?.type);
        if (fieldKey === 'pointCategory') return this.getPointCategoryOptions();
        if (fieldKey === 'feature') return this.getFeatureOptions(typeKey);
        if (fieldKey === 'attachment') return this.getAttachmentOptions(typeKey);
        return this.staticSelectOptions[fieldKey] || [];
    }

    pickRandom(options) {
        return options[Math.floor(Math.random() * options.length)];
    }

    normalizeChoice(value, options, aliases = {}, fallback = '') {
        if (!options.length) return value || fallback;
        if (options.includes(value)) return value;
        const aliasValue = aliases[value];
        if (aliasValue && options.includes(aliasValue)) return aliasValue;
        return fallback;
    }

    applyPointCategoryToRow(row, typeKey, { preserveFeature = true, preserveAttachment = true } = {}) {
        const inferredType = this.inferTypeFromPointNo(row.pointNo, typeKey || row.type);
        const resolvedType = this.resolveTypeKey(inferredType, row.type);
        const featureOptions = this.getFeatureOptions(resolvedType);
        const attachmentOptions = this.getAttachmentOptions(resolvedType);
        row.type = resolvedType;
        row.pointCategory = this.getTypeLabel(resolvedType);
        row.feature = preserveFeature
            ? this.normalizeChoice(row.feature, featureOptions, this.featureAliases, featureOptions[0] || '')
            : (featureOptions[0] || '');
        row.attachment = preserveAttachment
            ? this.normalizeChoice(row.attachment, attachmentOptions, this.attachmentAliases, attachmentOptions[0] || '')
            : (attachmentOptions[0] || '');
        if (!row.owner?.trim()) row.owner = this.typeMeta[resolvedType].owner;
        return row;
    }

    normalizeLedgerRow(row) {
        const normalized = { ...row };
        return this.applyPointCategoryToRow(normalized, this.inferTypeFromPointNo(normalized.pointNo, normalized.pointCategory || normalized.type));
    }

    loadData() {
        try {
            const raw = localStorage.getItem(this.storageKey);
            if (raw) {
                const parsed = JSON.parse(raw);
                if (Array.isArray(parsed) && parsed.length) return parsed.map(row => this.normalizeLedgerRow(row));
            }
        } catch (error) {
            console.warn('load data failed', error);
        }
        const data = this.generateMockData();
        localStorage.setItem(this.storageKey, JSON.stringify(data));
        return data;
    }

    persistData() {
        localStorage.setItem(this.storageKey, JSON.stringify(this.data));
    }

    generateMockData() {
        const data = [];

        for (let i = 1; i <= 300; i++) {
            const type = this.typeOptions[(i - 1) % this.typeOptions.length];
            const meta = this.typeMeta[type];
            const prefix = meta.prefix;
            const pointNum = i.toString().padStart(4, '0');
            const connectNum = (i + 1).toString().padStart(4, '0');
            const casing = Math.random() > 0.7 ? `DN${[200, 300, 400, 500][Math.floor(Math.random() * 4)]}` : '';
            data.push(this.applyPointCategoryToRow({
                id: `LEDGER-${pointNum}`,
                type,
                pointCategory: meta.label,
                pointNo: `${prefix}${pointNum}`,
                connectNo: `${prefix}${connectNum}`,
                length: (Math.random() * 50 + 10).toFixed(2),
                feature: this.pickRandom(this.getFeatureOptions(type)),
                attachment: this.pickRandom(this.getAttachmentOptions(type)),
                material: this.pickRandom(this.staticSelectOptions.material),
                diameter: `DN${[100, 150, 200, 300, 400][Math.floor(Math.random() * 5)]}`,
                casing,
                casingMaterial: casing ? this.pickRandom(this.staticSelectOptions.casingMaterial.slice(1)) : '',
                pressure: Math.random() > 0.5 ? `${(Math.random() * 1.2 + 0.2).toFixed(2)}MPa` : `${[220, 380, 10][Math.floor(Math.random() * 3)]}V`,
                flow: Math.random() > 0.5 ? '双向' : '单向',
                holes: Math.random() > 0.75 ? `${4 + Math.floor(Math.random() * 8)}/${2 + Math.floor(Math.random() * 6)}` : '',
                x: (2347000 + Math.random() * 1200).toFixed(3),
                y: (5067000 + Math.random() * 1200).toFixed(3),
                groundElev: (52 + Math.random() * 3).toFixed(2),
                topElev: (51 + Math.random() * 3).toFixed(2),
                bottomElev: (50 + Math.random() * 3).toFixed(2),
                startDepth: (0.6 + Math.random() * 1.2).toFixed(2),
                endDepth: (0.6 + Math.random() * 1.2).toFixed(2),
                method: this.pickRandom(this.staticSelectOptions.method),
                year: `${2014 + Math.floor(Math.random() * 12)}`,
                owner: meta.owner,
                note: ['雷达校核', '人工补录', '综合修测', '历史成果'][Math.floor(Math.random() * 4)]
            }, type));
        }

        return data;
    }

    getFilteredData() {
        return this.data.filter(row => {
            const matchType = this.currentType === 'all' || row.type === this.currentType;
            const matchKeyword = !this.searchKeyword || row.pointNo.toLowerCase().includes(this.searchKeyword.toLowerCase());
            return matchType && matchKeyword;
        });
    }

    getCurrentPageData() {
        const filtered = this.getFilteredData();
        const totalPages = Math.max(1, Math.ceil(filtered.length / this.pageSize));
        if (this.currentPage > totalPages) this.currentPage = totalPages;
        const start = (this.currentPage - 1) * this.pageSize;
        return filtered.slice(start, start + this.pageSize);
    }

    renderTable() {
        if (this.viewMode === 'summary') {
            this.renderSummaryTable();
            this.toggleTableContainers();
            return;
        }
        this.renderDetailTable();
        this.toggleTableContainers();
        this.updatePagination();
    }

    renderDetailTable() {
        const tbody = document.getElementById('data-table-body');
        const rows = this.getCurrentPageData();
        this.renderSelectionHeader();

        tbody.innerHTML = rows.map(row => {
            const isEditingRow = this.tableMode === 'edit' && this.selectedRecordId === row.id;
            const selectionCell = this.renderSelectionCell(row);
            const cells = this.columnDefs.map(column => {
                const value = row[column.key] ?? '';
                const className = column.bg ? ` class="${column.bg}"` : '';
                if (isEditingRow) return `<td${className}>${this.renderInlineEditor(column, value, row)}</td>`;
                return `<td${className}>${this.escapeHtml(value)}</td>`;
            }).join('');

            return `<tr data-record-id="${row.id}" class="${isEditingRow ? 'table-row-editing' : ''}">${selectionCell}${cells}</tr>`;
        }).join('');

        document.getElementById('total-records').textContent = String(this.getFilteredData().length);
        this.syncDeleteAllCheckbox();
    }

    renderSummaryTable() {
        const tbody = document.getElementById('summary-table-body');
        const summaryData = this.generateSummaryData();

        let html = '';
        html += '<tr><td colspan="2" class="font-semibold">管线长度 (km)</td>';
        html += `<td>${summaryData.electricity.length}</td>`;
        html += `<td>${summaryData.telecom.length}</td>`;
        html += `<td>${summaryData.drainage.length}</td>`;
        html += `<td>${summaryData.water.length}</td>`;
        html += `<td>${summaryData.gas.length}</td>`;
        html += `<td>${summaryData.heat.length}</td>`;
        html += `<td>${summaryData.industrial.length}</td>`;
        html += `<td>${summaryData.other.length}</td>`;
        html += `<td class="font-semibold">${summaryData.totalLength}</td></tr>`;

        html += '<tr><td colspan="2" class="font-semibold">管点数量 (个)</td>';
        html += `<td>${summaryData.electricity.points}</td>`;
        html += `<td>${summaryData.telecom.points}</td>`;
        html += `<td>${summaryData.drainage.points}</td>`;
        html += `<td>${summaryData.water.points}</td>`;
        html += `<td>${summaryData.gas.points}</td>`;
        html += `<td>${summaryData.heat.points}</td>`;
        html += `<td>${summaryData.industrial.points}</td>`;
        html += `<td>${summaryData.other.points}</td>`;
        html += `<td class="font-semibold">${summaryData.totalPoints}</td></tr>`;

        html += '<tr><td rowspan="2" class="font-semibold w-[48px] break-all leading-tight">类型汇总</td>';
        html += '<td class="font-semibold">类型</td>';
        html += '<td colspan="2" class="bg-slate-50 dark:bg-slate-800">电缆(电力、通信)</td>';
        html += '<td colspan="2" class="bg-slate-50 dark:bg-slate-800">给排水</td>';
        html += '<td colspan="2" class="bg-slate-50 dark:bg-slate-800">金属管线</td>';
        html += '<td class="bg-slate-50 dark:bg-slate-800">工业</td>';
        html += '<td class="bg-slate-50 dark:bg-slate-800">其他</td>';
        html += '<td class="font-semibold">地下管线探测复杂程度</td></tr>';

        html += '<tr><td class="font-semibold">管线长度 (km)</td>';
        html += `<td colspan="2" class="bg-slate-50 dark:bg-slate-800">${summaryData.category.cable}</td>`;
        html += `<td colspan="2" class="bg-slate-50 dark:bg-slate-800">${summaryData.category.drainage}</td>`;
        html += `<td colspan="2" class="bg-slate-50 dark:bg-slate-800">${summaryData.category.metal}</td>`;
        html += `<td class="bg-slate-50 dark:bg-slate-800">${summaryData.category.industrial}</td>`;
        html += `<td class="bg-slate-50 dark:bg-slate-800">${summaryData.category.other}</td>`;
        html += '<td class="font-semibold">简单 / 中等 / 复杂</td></tr>';

        tbody.innerHTML = html;
    }

    generateSummaryData() {
        const filtered = this.getFilteredData();
        const buildItem = type => {
            const rows = filtered.filter(row => row.type === type);
            return {
                length: (rows.reduce((sum, row) => sum + Number(row.length || 0), 0) / 1000).toFixed(1),
                points: String(rows.length)
            };
        };

        const electricity = buildItem('electricity');
        const telecom = buildItem('telecom');
        const drainage = buildItem('drainage');
        const water = buildItem('water');
        const gas = buildItem('gas');
        const heat = buildItem('heat');
        const industrial = buildItem('industrial');
        const other = buildItem('other');
        const totalLength = filtered.reduce((sum, row) => sum + Number(row.length || 0), 0) / 1000;

        return {
            electricity,
            telecom,
            drainage,
            water,
            gas,
            heat,
            industrial,
            other,
            totalLength: totalLength.toFixed(1),
            totalPoints: String(filtered.length),
            category: {
                cable: (Number(electricity.length) + Number(telecom.length)).toFixed(1),
                drainage: (Number(drainage.length) + Number(water.length)).toFixed(1),
                metal: (Number(gas.length) + Number(heat.length)).toFixed(1),
                industrial: industrial.length,
                other: other.length
            }
        };
    }

    toggleTableContainers() {
        const detailContainer = document.getElementById('detail-table-container');
        const summaryContainer = document.getElementById('summary-table-container');
        const paginationBar = document.getElementById('pagination-bar');
        const backBtn = document.getElementById('back-to-detail-btn');
        const recordCount = document.getElementById('record-count');
        const tableTitle = document.getElementById('table-title');

        if (this.viewMode === 'summary') {
            detailContainer.classList.add('hidden');
            summaryContainer.classList.remove('hidden');
            paginationBar.classList.add('hidden');
            backBtn.classList.remove('hidden');
            recordCount.classList.add('hidden');
            tableTitle.textContent = '综合地下管线汇总表';
        } else {
            detailContainer.classList.remove('hidden');
            summaryContainer.classList.add('hidden');
            paginationBar.classList.remove('hidden');
            backBtn.classList.add('hidden');
            recordCount.classList.remove('hidden');
            tableTitle.textContent = '综合地下管线成果表';
        }

        this.renderActionBar();
    }

    renderSelectionHeader() {
        const topRow = document.getElementById('data-table-head-top');
        topRow.querySelector('.table-selector-head')?.remove();
        if (!['edit', 'delete'].includes(this.tableMode)) return;

        const th = document.createElement('th');
        th.className = 'table-selector-head';
        th.rowSpan = 2;
        th.innerHTML = this.tableMode === 'delete'
            ? '<input id="delete-select-all" type="checkbox" class="h-4 w-4 accent-primary" aria-label="全选">'
            : '<span class="text-[11px]">选择</span>';
        topRow.insertBefore(th, topRow.firstElementChild);
    }

    renderSelectionCell(row) {
        if (this.tableMode === 'edit') {
            return `<td class="table-selector-cell"><input type="radio" name="edit-record" class="h-4 w-4 accent-primary" value="${row.id}" ${this.selectedRecordId === row.id ? 'checked' : ''}></td>`;
        }
        if (this.tableMode === 'delete') {
            return `<td class="table-selector-cell"><input type="checkbox" class="h-4 w-4 accent-primary row-delete-checkbox" value="${row.id}" ${this.selectedDeleteIds.has(row.id) ? 'checked' : ''}></td>`;
        }
        return '';
    }

    renderInlineEditor(column, value, row) {
        if (column.type === 'select') {
            const options = column.options || this.getFieldOptions(column.key, row);
            return `<select class="table-inline-select" data-field="${column.key}">${options.map(option => `<option value="${this.escapeHtml(option)}" ${option === value ? 'selected' : ''}>${this.escapeHtml(option || '请选择')}</option>`).join('')}</select>`;
        }
        return `<input class="table-inline-input" data-field="${column.key}" value="${this.escapeHtml(value)}">`;
    }

    updatePagination() {
        const totalPages = Math.max(1, Math.ceil(this.getFilteredData().length / this.pageSize));
        this.totalPages = totalPages;
        document.getElementById('total-pages').textContent = String(totalPages);
        const jumpInput = document.getElementById('jump-to-page');
        jumpInput.value = String(this.currentPage);
        jumpInput.max = String(totalPages);
        this.renderPaginationButtons();
    }

    renderPaginationButtons() {
        const container = document.getElementById('pagination-container');
        let html = `<button class="px-2.5 py-1 text-xs border border-slate-200 dark:border-slate-700 rounded hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors ${this.currentPage === 1 ? 'opacity-50 cursor-not-allowed' : ''}" data-page="prev">&lt;</button>`;
        if (this.totalPages <= 7) {
            for (let i = 1; i <= this.totalPages; i++) html += this.createPageButton(i);
        } else {
            html += this.createPageButton(1);
            if (this.currentPage <= 3) {
                for (let i = 2; i <= 4; i++) html += this.createPageButton(i);
                html += '<span class="px-1 text-slate-400">...</span>';
                html += this.createPageButton(this.totalPages);
            } else if (this.currentPage >= this.totalPages - 2) {
                html += '<span class="px-1 text-slate-400">...</span>';
                for (let i = this.totalPages - 3; i <= this.totalPages; i++) html += this.createPageButton(i);
            } else {
                html += '<span class="px-1 text-slate-400">...</span>';
                for (let i = this.currentPage - 1; i <= this.currentPage + 1; i++) html += this.createPageButton(i);
                html += '<span class="px-1 text-slate-400">...</span>';
                html += this.createPageButton(this.totalPages);
            }
        }
        html += `<button class="px-2.5 py-1 text-xs border border-slate-200 dark:border-slate-700 rounded hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors ${this.currentPage === this.totalPages ? 'opacity-50 cursor-not-allowed' : ''}" data-page="next">&gt;</button>`;
        container.innerHTML = html;
    }

    createPageButton(pageNum) {
        const activeClass = pageNum === this.currentPage ? 'border-primary bg-primary text-white font-semibold' : 'border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800';
        return `<button class="px-2.5 py-1 text-xs border rounded transition-colors ${activeClass}" data-page="${pageNum}">${pageNum}</button>`;
    }

    renderActionBar() {
        const tableActions = document.getElementById('table-actions');
        if (this.viewMode === 'summary') {
            tableActions.innerHTML = `<button id="export-records-btn" class="px-3 py-1.5 text-primary hover:bg-primary/10 rounded text-xs font-medium transition-colors flex items-center gap-1"><span class="material-symbols-outlined text-sm">download</span>导出数据</button>`;
            return;
        }
        if (this.tableMode === 'edit') {
            tableActions.innerHTML = `<span class="px-2 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium">请选择一条记录进行编辑</span><button id="save-edit-btn" class="px-3 py-1.5 text-white bg-primary hover:bg-primary/90 rounded text-xs font-medium transition-colors flex items-center gap-1"><span class="material-symbols-outlined text-sm">save</span>保存编辑</button><button id="cancel-mode-btn" class="px-3 py-1.5 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded text-xs font-medium transition-colors">取消</button>`;
            return;
        }
        if (this.tableMode === 'delete') {
            tableActions.innerHTML = `<span class="px-2 py-1 rounded-full bg-red-50 text-red-600 text-xs font-medium dark:bg-red-950/40 dark:text-red-300">已选 ${this.selectedDeleteIds.size} 条</span><button id="confirm-delete-btn" class="px-3 py-1.5 text-white bg-red-500 hover:bg-red-600 rounded text-xs font-medium transition-colors flex items-center gap-1"><span class="material-symbols-outlined text-sm">delete</span>删除选中</button><button id="cancel-mode-btn" class="px-3 py-1.5 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded text-xs font-medium transition-colors">取消</button>`;
            return;
        }
        tableActions.innerHTML = `<button id="add-record-btn" class="px-3 py-1.5 text-slate-600 dark:text-slate-400 hover:bg-orange-50 dark:hover:bg-slate-800 hover:text-orange-600 rounded text-xs font-medium transition-colors flex items-center gap-1"><span class="material-symbols-outlined text-sm">add_circle</span>新增记录</button><button id="edit-record-btn" class="px-3 py-1.5 text-slate-600 dark:text-slate-400 hover:bg-orange-50 dark:hover:bg-slate-800 hover:text-orange-600 rounded text-xs font-medium transition-colors flex items-center gap-1"><span class="material-symbols-outlined text-sm">edit</span>编辑记录</button><button id="delete-record-btn" class="px-3 py-1.5 text-slate-600 dark:text-slate-400 hover:bg-orange-50 dark:hover:bg-slate-800 hover:text-orange-600 rounded text-xs font-medium transition-colors flex items-center gap-1"><span class="material-symbols-outlined text-sm">delete</span>删除记录</button><button id="search-record-btn" class="px-3 py-1.5 text-slate-600 dark:text-slate-400 hover:bg-blue-50 dark:hover:bg-slate-800 hover:text-blue-600 rounded text-xs font-medium transition-colors flex items-center gap-1"><span class="material-symbols-outlined text-sm">search</span>搜索记录</button><div class="w-px h-4 bg-slate-300 dark:bg-slate-600"></div><button id="export-records-btn" class="px-3 py-1.5 text-primary hover:bg-primary/10 rounded text-xs font-medium transition-colors flex items-center gap-1"><span class="material-symbols-outlined text-sm">download</span>导出数据</button>`;
    }

    bindStaticEvents() {
        document.querySelectorAll('[data-type]').forEach(btn => {
            btn.addEventListener('click', event => {
                this.currentType = event.currentTarget.dataset.type;
                this.currentPage = 1;
                this.updateTypeButtons();
                this.exitTableMode();
                this.renderTable();
            });
        });

        document.getElementById('summary-btn')?.addEventListener('click', () => {
            this.viewMode = 'summary';
            this.renderTable();
        });
        document.getElementById('back-to-detail-btn')?.addEventListener('click', () => {
            this.viewMode = 'detail';
            this.renderTable();
        });
        document.getElementById('jump-to-page')?.addEventListener('change', event => {
            const page = Number(event.target.value || 1);
            if (page >= 1 && page <= this.totalPages) {
                this.currentPage = page;
                this.renderTable();
            }
        });

        document.addEventListener('click', event => this.handleDocumentClick(event));
        document.addEventListener('change', event => this.handleDocumentChange(event));
        document.getElementById('table-search-submit')?.addEventListener('click', () => this.applySearch());
        document.getElementById('table-search-reset')?.addEventListener('click', () => this.resetSearch());
        document.getElementById('table-search-close')?.addEventListener('click', () => this.closeSearchBar(false));
        document.addEventListener('focusin', event => {
            if (event.target.matches('.point-picker-input')) {
                const card = event.target.closest('.add-record-card');
                const field = event.target.dataset.field;
                const dropdown = card?.querySelector(`.point-picker-dropdown[data-field="${field}"]`);
                if (dropdown) {
                    dropdown.innerHTML = this.renderPointOptions(event.target.value || '', event.target.dataset.selectedValue || '');
                    dropdown.classList.remove('hidden');
                }
            }
        });
        document.getElementById('table-search-input')?.addEventListener('keydown', event => {
            if (event.key === 'Enter') this.applySearch();
        });

        const importModal = document.getElementById('import-data-modal');
        importModal?.addEventListener('click', event => {
            if (event.target === importModal) this.closeImportModal();
        });
        importModal?.addEventListener('dblclick', event => this.handleCellEdit(event));
        document.getElementById('import-data-btn')?.addEventListener('click', () => this.openImportModal('import'));
        document.getElementById('import-modal-close')?.addEventListener('click', () => this.closeImportModal());
        document.getElementById('import-modal-cancel')?.addEventListener('click', () => this.closeImportModal());
        document.getElementById('import-modal-confirm')?.addEventListener('click', () => this.confirmImportModal());
        document.getElementById('add-record-card-btn')?.addEventListener('click', () => this.appendAddRecordCard());
        document.addEventListener('input', event => this.handleAddRecordCardInput(event));

        const deleteDialog = document.getElementById('delete-confirm-dialog');
        deleteDialog?.addEventListener('click', event => {
            if (event.target === deleteDialog) deleteDialog.close();
        });
        document.getElementById('delete-confirm-cancel')?.addEventListener('click', () => deleteDialog?.close());
        document.getElementById('delete-confirm-submit')?.addEventListener('click', () => this.executeDelete());
    }

    handleDocumentClick(event) {
        if (!event.target.closest('.point-picker')) {
            document.querySelectorAll('.point-picker-dropdown').forEach(dropdown => dropdown.classList.add('hidden'));
        }
        const button = event.target.closest('button');
        if (button?.id === 'add-record-btn') this.openImportModal('add');
        if (button?.id === 'edit-record-btn') this.enterEditMode();
        if (button?.id === 'delete-record-btn') this.enterDeleteMode();
        if (button?.id === 'save-edit-btn') this.saveEditedRecord();
        if (button?.id === 'cancel-mode-btn') this.cancelCurrentMode();
        if (button?.id === 'confirm-delete-btn') this.openDeleteConfirm();
        if (button?.id === 'search-record-btn') this.toggleSearchBar();
        if (button?.id === 'export-records-btn') this.exportCurrentTable();
        if (button?.dataset.pointOptionValue) this.selectPointOption(button);
        if (button?.dataset.removeAddCard) this.removeAddRecordCard(Number(button.dataset.removeAddCard));

        const pager = event.target.closest('[data-page]');
        if (pager) {
            const page = pager.dataset.page;
            if (page === 'prev' && this.currentPage > 1) this.currentPage -= 1;
            else if (page === 'next' && this.currentPage < this.totalPages) this.currentPage += 1;
            else if (!Number.isNaN(Number(page))) this.currentPage = Number(page);
            this.renderTable();
        }
    }

    handleDocumentChange(event) {
        if (event.target.matches('input[name="edit-record"]')) {
            this.selectedRecordId = event.target.value;
            this.renderActionBar();
            this.renderTable();
            return;
        }
        if (event.target.matches('.table-inline-select[data-field="pointCategory"]')) {
            this.syncEditRowCascade(event.target.closest('tr'), this.resolveTypeKey(event.target.value));
            return;
        }
        if (event.target.matches('.add-record-select[data-add-field="pointCategory"]')) {
            const card = event.target.closest('.add-record-card');
            const cardIndex = Number(card?.dataset.cardIndex);
            this.syncAddRecordDrafts();
            const row = this.importRows.new[cardIndex];
            if (row) this.applyPointCategoryToRow(row, this.resolveTypeKey(event.target.value, row.type));
            this.renderAddRecordCards();
            return;
        }
        if (event.target.matches('.row-delete-checkbox')) {
            const id = event.target.value;
            if (event.target.checked) this.selectedDeleteIds.add(id);
            else this.selectedDeleteIds.delete(id);
            this.renderActionBar();
            this.syncDeleteAllCheckbox();
            return;
        }
        if (event.target.id === 'delete-select-all') {
            const currentIds = this.getCurrentPageData().map(row => row.id);
            if (event.target.checked) currentIds.forEach(id => this.selectedDeleteIds.add(id));
            else currentIds.forEach(id => this.selectedDeleteIds.delete(id));
            this.renderActionBar();
            this.renderTable();
        }
    }

    syncEditRowCascade(rowElement, typeKey) {
        if (!rowElement) return;
        const featureSelect = rowElement.querySelector('.table-inline-select[data-field="feature"]');
        const attachmentSelect = rowElement.querySelector('.table-inline-select[data-field="attachment"]');
        const updateSelectOptions = (select, options) => {
            if (!select) return;
            const currentValue = select.value;
            const nextValue = options.includes(currentValue) ? currentValue : (options[0] || '');
            select.innerHTML = options.map(option => `<option value="${this.escapeHtml(option)}" ${option === nextValue ? 'selected' : ''}>${this.escapeHtml(option || '请选择')}</option>`).join('');
        };
        updateSelectOptions(featureSelect, this.getFeatureOptions(typeKey));
        updateSelectOptions(attachmentSelect, this.getAttachmentOptions(typeKey));
    }

    handleAddRecordCardInput(event) {
        if (event.target.matches('.point-picker-input')) {
            const card = event.target.closest('.add-record-card');
            const field = event.target.dataset.field;
            const query = event.target.value.trim();
            const dropdown = card?.querySelector(`.point-picker-dropdown[data-field="${field}"]`);
            if (!dropdown) return;
            dropdown.innerHTML = this.renderPointOptions(query, event.target.dataset.selectedValue || '');
            dropdown.classList.remove('hidden');
        }
    }

    syncAddRecordPointCategory(card, pointNo) {
        const cardIndex = Number(card?.dataset.cardIndex);
        if (Number.isNaN(cardIndex)) return;
        this.syncAddRecordDrafts();
        const row = this.importRows.new[cardIndex];
        if (!row) return;
        row.pointNo = pointNo;
        this.applyPointCategoryToRow(row, this.inferTypeFromPointNo(pointNo, row.type));
        this.renderAddRecordCards();
    }

    updateTypeButtons() {
        const colorMap = {
            all: ['bg-primary/10', 'text-primary', 'border-primary/30'],
            water: ['bg-blue-50', 'text-blue-600', 'border-blue-200'],
            gas: ['bg-orange-50', 'text-orange-600', 'border-orange-200'],
            drainage: ['bg-green-50', 'text-green-600', 'border-green-200'],
            electricity: ['bg-yellow-50', 'text-yellow-600', 'border-yellow-200'],
            heat: ['bg-red-50', 'text-red-600', 'border-red-200'],
            telecom: ['bg-indigo-50', 'text-indigo-600', 'border-indigo-200'],
            industrial: ['bg-gray-50', 'text-gray-600', 'border-gray-200'],
            other: ['bg-slate-100', 'text-slate-600', 'border-slate-300']
        };

        document.querySelectorAll('[data-type]').forEach(button => {
            button.classList.remove('bg-primary/10', 'text-primary', 'border-primary/30', 'bg-blue-50', 'text-blue-600', 'border-blue-200', 'bg-orange-50', 'text-orange-600', 'border-orange-200', 'bg-green-50', 'text-green-600', 'border-green-200', 'bg-yellow-50', 'text-yellow-600', 'border-yellow-200', 'bg-red-50', 'text-red-600', 'border-red-200', 'bg-indigo-50', 'text-indigo-600', 'border-indigo-200', 'bg-gray-50', 'text-gray-600', 'border-gray-200', 'bg-slate-100', 'text-slate-600', 'border-slate-300');
            button.classList.add('bg-slate-50', 'border-slate-200');
            if (button.dataset.type === this.currentType) {
                button.classList.remove('bg-slate-50', 'border-slate-200');
                button.classList.add(...(colorMap[this.currentType] || colorMap.all));
            }
        });
    }

    enterEditMode() {
        this.tableMode = 'edit';
        this.selectedRecordId = null;
        this.selectedDeleteIds.clear();
        this.closeSearchBar(false);
        this.renderActionBar();
        this.renderTable();
    }

    enterDeleteMode() {
        this.tableMode = 'delete';
        this.selectedRecordId = null;
        this.selectedDeleteIds.clear();
        this.closeSearchBar(false);
        this.renderActionBar();
        this.renderTable();
    }

    cancelCurrentMode() {
        this.exitTableMode();
        this.renderActionBar();
        this.renderTable();
    }

    exitTableMode() {
        this.tableMode = 'normal';
        this.selectedRecordId = null;
        this.selectedDeleteIds.clear();
    }

    saveEditedRecord() {
        if (!this.selectedRecordId) {
            this.showToast('请先选择一条数据再进行编辑', 'warning');
            return;
        }

        const rowElement = document.querySelector(`tr[data-record-id="${this.selectedRecordId}"]`);
        const current = this.data.find(item => item.id === this.selectedRecordId);
        if (!rowElement || !current) return;

        const updated = { ...current };
        rowElement.querySelectorAll('[data-field]').forEach(input => {
            updated[input.dataset.field] = input.value.trim();
        });
        this.applyPointCategoryToRow(updated, this.resolveTypeKey(updated.pointCategory, current.type));

        const duplicate = this.data.find(item => item.id !== updated.id && item.pointNo.toLowerCase() === updated.pointNo.toLowerCase());
        if (!updated.pointNo) {
            this.showToast('管点编号不能为空', 'warning');
            return;
        }
        if (duplicate) {
            this.showToast('当前管点编号与台账数据重复，请修改后再保存', 'warning');
            return;
        }

        const index = this.data.findIndex(item => item.id === updated.id);
        this.data.splice(index, 1, updated);
        this.persistData();
        this.exitTableMode();
        this.renderActionBar();
        this.renderTable();
        this.showToast('已保存并同步到数据库', 'success');
    }

    openDeleteConfirm() {
        if (!this.selectedDeleteIds.size) {
            this.showToast('请至少勾选一条记录', 'warning');
            return;
        }
        this.pendingDeleteIds = Array.from(this.selectedDeleteIds);
        document.getElementById('delete-confirm-message').textContent = `本次将删除 ${this.pendingDeleteIds.length} 条记录，确认后立即生效。`;
        document.getElementById('delete-confirm-dialog')?.showModal();
    }

    executeDelete() {
        const ids = new Set(this.pendingDeleteIds);
        this.data = this.data.filter(row => !ids.has(row.id));
        this.persistData();
        this.pendingDeleteIds = [];
        document.getElementById('delete-confirm-dialog')?.close();
        this.exitTableMode();
        this.renderActionBar();
        this.renderTable();
        this.showToast('删除完成，台账数据已刷新', 'success');
    }

    syncDeleteAllCheckbox() {
        const selectAll = document.getElementById('delete-select-all');
        if (!selectAll) return;
        const currentIds = this.getCurrentPageData().map(row => row.id);
        const checkedCount = currentIds.filter(id => this.selectedDeleteIds.has(id)).length;
        selectAll.checked = !!currentIds.length && checkedCount === currentIds.length;
    }

    toggleSearchBar() {
        document.getElementById('table-search-bar').classList.add('active');
        document.getElementById('table-search-input')?.focus();
    }

    closeSearchBar(clearKeyword = false) {
        document.getElementById('table-search-bar').classList.remove('active');
        if (clearKeyword) {
            this.searchKeyword = '';
            document.getElementById('table-search-input').value = '';
            this.currentPage = 1;
            this.renderTable();
        }
    }

    applySearch() {
        this.searchKeyword = document.getElementById('table-search-input')?.value.trim() || '';
        this.currentPage = 1;
        this.renderTable();
        this.showToast(this.searchKeyword ? '已完成模糊搜索并刷新台账' : '已清空搜索条件', 'success');
    }

    resetSearch() {
        document.getElementById('table-search-input').value = '';
        this.searchKeyword = '';
        this.currentPage = 1;
        this.renderTable();
    }

    openImportModal(mode = 'import') {
        this.importModalMode = mode;
        this.importRows = this.getImportModalPreset(mode);
        this.renderImportModalTables();
        document.getElementById('import-data-modal')?.showModal();
    }

    closeImportModal() {
        document.getElementById('import-data-modal')?.close();
    }

    getImportModalPreset(mode) {
        if (mode === 'add') {
            return { update: [], new: Array.from({ length: 3 }, (_, index) => this.createBlankImportRow(index + 1)) };
        }

        return {
            update: [
                this.createImportRow({ seq: 1, pointNo: 'D0001', connectNo: 'D0002', length: '18.4', feature: '管点', attachment: '井盖', material: '钢', diameter: 'DN200', casing: 'DN300', casingMaterial: '钢', pressure: '10kV', flow: '双向', holes: '5/4', x: '2347184.253', y: '5067274.246', groundElev: '53.62', topElev: '52.84', bottomElev: '51.93', startDepth: '1.20', endDepth: '1.35', method: '直埋', year: '2018', owner: '市政公司', checked: true }, 'drainage'),
                this.createImportRow({ seq: 2, pointNo: 'T0002', connectNo: 'T0003', length: '26.1', feature: '折点', attachment: '标识桩', material: 'PE', diameter: 'DN150', pressure: '0.40MPa', flow: '单向', holes: '5/3', x: '2347184.245', y: '5067273.999', groundElev: '54.10', topElev: '53.08', bottomElev: '52.42', startDepth: '1.02', endDepth: '1.16', method: '管沟', year: '2020', owner: '通信公司', checked: true }, 'telecom')
            ],
            new: [
                this.createImportRow({ seq: 1, pointNo: 'N5001', connectNo: 'N5002', length: '15.7', feature: '管点', attachment: '井盖', material: 'PE', diameter: 'DN200', x: '2347901.112', y: '5067708.441', groundElev: '52.31', topElev: '51.44', bottomElev: '50.98', startDepth: '0.87', endDepth: '1.02', method: '直埋', year: '2024', owner: '市政公司', checked: true }, 'drainage'),
                this.createImportRow({ seq: 2, pointNo: 'N5003', connectNo: 'N5004', length: '22.9', feature: '折点', material: '钢', diameter: 'DN400', casing: 'DN500', casingMaterial: '钢', pressure: '0.60MPa', x: '2347920.507', y: '5067722.008', groundElev: '53.06', topElev: '51.68', bottomElev: '50.71', startDepth: '1.38', endDepth: '1.42', method: '管沟', year: '2023', owner: '热力公司', checked: true }, 'heat'),
                this.createImportRow({ seq: 3, pointNo: 'N5005', connectNo: 'N5006', length: '9.6', feature: '三通', attachment: '阀门', material: '铸铁', diameter: 'DN150', x: '2347936.221', y: '5067734.014', groundElev: '52.78', topElev: '51.83', bottomElev: '51.12', startDepth: '0.95', endDepth: '1.08', method: '直埋', year: '2022', owner: '自来水公司', checked: true }, 'water')
            ]
        };
    }

    createBlankImportRow(seq) {
        return this.createImportRow({ seq, pointNo: '', connectNo: '', length: '', material: 'PE', diameter: '', casing: '', casingMaterial: '', pressure: '', flow: '', holes: '', x: '', y: '', groundElev: '', topElev: '', bottomElev: '', startDepth: '', endDepth: '', method: '直埋', year: `${new Date().getFullYear()}`, owner: '', note: '', checked: true }, this.getCurrentDefaultType());
    }

    createImportRow(values, type) {
        const typeKey = this.resolveTypeKey(values.pointCategory || type, type);
        return this.applyPointCategoryToRow({
            seq: values.seq,
            type: typeKey,
            pointCategory: values.pointCategory || this.getTypeLabel(typeKey),
            pointNo: values.pointNo || '',
            connectNo: values.connectNo || '',
            length: values.length || '',
            feature: values.feature || '',
            attachment: values.attachment || '',
            material: values.material || 'PE',
            diameter: values.diameter || '',
            casing: values.casing || '',
            casingMaterial: values.casingMaterial || '',
            pressure: values.pressure || '',
            flow: values.flow || '',
            holes: values.holes || '',
            x: values.x || '',
            y: values.y || '',
            groundElev: values.groundElev || '',
            topElev: values.topElev || '',
            bottomElev: values.bottomElev || '',
            startDepth: values.startDepth || '',
            endDepth: values.endDepth || '',
            method: values.method || '直埋',
            year: values.year || '',
            owner: values.owner || '',
            note: values.note || '',
            checked: values.checked !== false,
            pointNoClass: values.pointNoClass || '',
            connectNoClass: values.connectNoClass || '',
            holesClass: values.holesClass || '',
            xClass: values.xClass || '',
            yClass: values.yClass || '',
            groundClass: values.groundClass || ''
        }, typeKey);
    }

    renderImportModalTables() {
        const title = document.querySelector('#import-data-modal h3');
        const updateSection = document.getElementById('import-update-section');
        const newSection = document.getElementById('import-new-section');
        const addSection = document.getElementById('add-record-form-section');
        const confirmBtn = document.getElementById('import-modal-confirm');
        const messageEl = document.getElementById('import-modal-message');
        messageEl.classList.add('hidden');
        messageEl.textContent = '';

        if (this.importModalMode === 'add') {
            title.textContent = '新增记录';
            updateSection.classList.add('hidden');
            newSection.classList.add('hidden');
            addSection.classList.remove('hidden');
            confirmBtn.textContent = '保存并导入';
            this.renderAddRecordCards();
        } else {
            title.textContent = '新数据处理';
            updateSection.classList.remove('hidden');
            newSection.classList.remove('hidden');
            addSection.classList.add('hidden');
            confirmBtn.textContent = '确定导入';
            this.renderImportRows('import-update-tbody', this.importRows.update);
            this.renderImportRows('import-new-tbody', this.importRows.new);
        }
    }

    renderImportRows(tbodyId, rows) {
        const tbody = document.getElementById(tbodyId);
        if (!tbody) return;
        tbody.innerHTML = rows.map((row, index) => `<tr data-row-index="${index}"><td>${this.escapeHtml(row.seq)}</td>${this.importColumnDefs.map(column => `<td>${this.renderEditableCell(column.key, row[column.key], row[column.classKey] || '', column.type, column.options || this.getFieldOptions(column.key, row))}</td>`).join('')}<td class="import-sticky-use"><input type="checkbox" class="h-4 w-4 accent-primary import-row-check" ${row.checked ? 'checked' : ''}></td></tr>`).join('');
    }

    renderAddRecordCards() {
        const container = document.getElementById('add-record-card-list');
        if (!container) return;
        const pointOptions = this.getPointOptions();

        container.innerHTML = this.importRows.new.map((row, index) => `
            <div class="add-record-card" data-card-index="${index}">
                <div class="add-record-card-head">
                    <div>
                        <div class="text-sm font-semibold text-slate-800 dark:text-white">新增记录 ${index + 1}</div>
                        <div class="text-[11px] text-slate-500 dark:text-slate-400">点号与连接点号需从现有点位中选择，字段填写方式与新增导入保持一致。</div>
                    </div>
                    <button type="button" data-remove-add-card="${index}" class="px-2.5 py-1.5 text-xs font-medium text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors ${this.importRows.new.length === 1 ? 'hidden' : ''}">删除此条</button>
                </div>
                <div class="add-record-card-body">
                    <section class="add-record-section">
                        <div class="add-record-section-head">
                            <div class="add-record-section-title">点位信息</div>
                            <div class="add-record-section-note">先定管点分类，再对特征点和附属物做级联选择</div>
                        </div>
                        <div class="add-record-grid">
                            ${this.renderAddCardPointPicker('pointNo', '管线点号', row.pointNo, pointOptions, row.pointNoClass)}
                            ${this.renderAddCardPointPicker('connectNo', '连接点号', row.connectNo, pointOptions, row.connectNoClass)}
                            ${this.renderAddCardField('length', '连接点长度(m)', row.length)}
                            ${this.renderAddCardSelect('pointCategory', '管点分类', row.pointCategory, this.getPointCategoryOptions())}
                            ${this.renderAddCardSelect('feature', '特征点', row.feature, this.getFeatureOptions(row.type))}
                            ${this.renderAddCardSelect('attachment', '附属物', row.attachment, this.getAttachmentOptions(row.type))}
                            ${this.renderAddCardSelect('material', '材质', row.material, ['PE', 'PVC', '钢', '铸铁', '混凝土'])}
                        </div>
                    </section>

                    <section class="add-record-section">
                        <div class="add-record-section-head">
                            <div class="add-record-section-title">规格与载体</div>
                            <div class="add-record-section-note">对应新增导入中的规格、压力和孔数字段</div>
                        </div>
                        <div class="add-record-grid">
                            ${this.renderAddCardField('diameter', '管径或断面', row.diameter)}
                            ${this.renderAddCardField('casing', '套管尺寸', row.casing)}
                            ${this.renderAddCardSelect('casingMaterial', '套管材质', row.casingMaterial, ['', '钢', 'PE', 'PVC', '混凝土'])}
                            ${this.renderAddCardField('pressure', '压力/电压', row.pressure)}
                            ${this.renderAddCardField('flow', '流向/根数', row.flow)}
                            ${this.renderAddCardField('holes', '总孔数/已用孔数', row.holes)}
                        </div>
                    </section>

                    <section class="add-record-section">
                        <div class="add-record-section-head">
                            <div class="add-record-section-title">空间与埋深</div>
                            <div class="add-record-section-note">坐标、高程与埋深信息可连续录入</div>
                        </div>
                        <div class="add-record-grid">
                            ${this.renderAddCardField('x', 'X 坐标', row.x)}
                            ${this.renderAddCardField('y', 'Y 坐标', row.y)}
                            ${this.renderAddCardField('groundElev', '地面高程', row.groundElev)}
                            ${this.renderAddCardField('topElev', '管顶高程', row.topElev)}
                            ${this.renderAddCardField('bottomElev', '管底高程', row.bottomElev)}
                            ${this.renderAddCardField('startDepth', '起点埋深', row.startDepth)}
                            ${this.renderAddCardField('endDepth', '终点埋深', row.endDepth)}
                            ${this.renderAddCardSelect('method', '埋设方式', row.method, ['直埋', '管沟', '架空'])}
                        </div>
                    </section>

                    <section class="add-record-section">
                        <div class="add-record-section-head">
                            <div class="add-record-section-title">管理信息</div>
                            <div class="add-record-section-note">用于导入后的台账归属与备注说明</div>
                        </div>
                        <div class="add-record-grid">
                            ${this.renderAddCardField('year', '年代', row.year)}
                            ${this.renderAddCardField('owner', '权属单位', row.owner)}
                            ${this.renderAddCardField('note', '备注', row.note || '', true, '', 'textarea')}
                        </div>
                    </section>
                </div>
            </div>
        `).join('');
    }

    renderAddCardField(key, label, value, wide = false, extraClass = '', control = 'input') {
        const className = this.escapeHtml(extraClass || '');
        const valueText = this.escapeHtml(value || '');
        const fieldClass = wide ? 'add-record-field add-record-field--wide' : 'add-record-field';
        const controlHtml = control === 'textarea'
            ? `<textarea class="add-record-textarea ${className}" data-add-field="${key}">${valueText}</textarea>`
            : `<input class="add-record-input ${className}" data-add-field="${key}" value="${valueText}">`;
        return `
            <label class="${fieldClass}">
                <span class="add-record-label">${label}</span>
                ${controlHtml}
            </label>
        `;
    }

    renderAddCardSelect(key, label, value, options, extraClass = '') {
        return `
            <label class="add-record-field">
                <span class="add-record-label">${label}</span>
                <select class="add-record-select ${this.escapeHtml(extraClass || '')}" data-add-field="${key}">
                    ${options.map(option => `<option value="${this.escapeHtml(option)}" ${option === value ? 'selected' : ''}>${this.escapeHtml(option || '请选择')}</option>`).join('')}
                </select>
            </label>
        `;
    }

    renderAddCardPointPicker(key, label, value, pointOptions, extraClass = '') {
        return `
            <div class="add-record-field">
                <span class="add-record-label">${label}</span>
                <div class="point-picker">
                    <input class="point-picker-input ${this.escapeHtml(extraClass || '')}" data-add-field="${key}" data-field="${key}" data-selected-value="${this.escapeHtml(value || '')}" value="${this.escapeHtml(value || '')}" placeholder="搜索并选择点号" autocomplete="off">
                    <div class="point-picker-dropdown hidden" data-field="${key}">
                        ${this.renderPointOptions('', value || '', pointOptions)}
                    </div>
                </div>
            </div>
        `;
    }

    renderPointOptions(query = '', selectedValue = '', sourceOptions = null) {
        const options = sourceOptions || this.getPointOptions();
        const keyword = query.trim().toLowerCase();
        const filtered = options.filter(option => !keyword || option.toLowerCase().includes(keyword)).slice(0, 20);
        if (!filtered.length) {
            return '<div class="px-3 py-2 text-xs text-slate-400">未找到匹配点号</div>';
        }
        return filtered.map(option => `<button type="button" class="point-picker-option" data-point-option-value="${this.escapeHtml(option)}" data-selected-target="${this.escapeHtml(selectedValue)}">${this.escapeHtml(option)}</button>`).join('');
    }

    getPointOptions() {
        const rows = this.currentType === 'all' ? this.data : this.data.filter(row => row.type === this.currentType);
        return Array.from(new Set(rows.map(row => row.pointNo))).sort();
    }

    renderEditableCell(fieldKey, value = '', extraClass = '', type = 'text', options = []) {
        const cls = extraClass ? ` ${extraClass}` : '';
        return `<span class="editable-cell${cls}" data-field="${fieldKey}" data-value="${this.escapeHtml(value)}" data-type="${type}" data-options="${this.escapeHtml(JSON.stringify(options))}">${this.escapeHtml(value)}</span>`;
    }

    handleCellEdit(event) {
        const cell = event.target.closest('.editable-cell');
        if (!cell || cell.classList.contains('editing')) return;
        const value = cell.dataset.value || '';
        const type = cell.dataset.type || 'text';
        const options = JSON.parse(cell.dataset.options || '[]');
        cell.classList.add('editing');

        if (type === 'select') {
            const select = document.createElement('select');
            select.className = 'import-modal-select';
            options.forEach(optionValue => {
                const option = document.createElement('option');
                option.value = optionValue;
                option.textContent = optionValue;
                option.selected = optionValue === value;
                select.appendChild(option);
            });
            cell.textContent = '';
            cell.appendChild(select);
            select.focus();
            select.addEventListener('blur', () => this.finishEdit(cell, select.value));
            select.addEventListener('change', () => this.finishEdit(cell, select.value));
            return;
        }

        const input = document.createElement(type === 'textarea' ? 'textarea' : 'input');
        input.className = type === 'textarea' ? 'import-modal-textarea' : 'import-modal-input';
        input.value = value;
        cell.textContent = '';
        cell.appendChild(input);
        input.focus();
        input.addEventListener('blur', () => this.finishEdit(cell, input.value));
        input.addEventListener('keydown', keyEvent => {
            if (keyEvent.key === 'Enter' && type !== 'textarea') this.finishEdit(cell, input.value);
            if (keyEvent.key === 'Escape') this.finishEdit(cell, value);
        });
    }

    finishEdit(cell, value) {
        cell.classList.remove('editing');
        cell.dataset.value = value;
        cell.textContent = value;
        if (['pointCategory', 'pointNo'].includes(cell.dataset.field)) {
            this.syncImportRowCategory(cell.closest('tr'));
        }
    }

    collectImportRows(tbodyId, defaultType) {
        return Array.from(document.querySelectorAll(`#${tbodyId} tr`)).map((row, index) => {
            const cells = row.querySelectorAll('.editable-cell');
            const values = {};
            this.importColumnDefs.forEach((column, columnIndex) => {
                values[column.key] = cells[columnIndex]?.dataset.value?.trim?.() ?? '';
                if (column.classKey) values[column.classKey] = cells[columnIndex]?.className.replace('editable-cell', '').replace('editing', '').trim() || '';
            });
            return this.createImportRow({ seq: index + 1, checked: row.querySelector('.import-row-check')?.checked ?? false, ...values }, this.resolveTypeKey(values.pointCategory, defaultType));
        });
    }

    collectAddRecordCards(defaultType) {
        return Array.from(document.querySelectorAll('#add-record-card-list .add-record-card')).map((card, index) => {
            const row = { seq: index + 1, type: defaultType, checked: true };
            card.querySelectorAll('[data-add-field]').forEach(field => {
                row[field.dataset.addField] = field.value.trim();
            });
            return this.createImportRow(row, this.resolveTypeKey(row.pointCategory, defaultType));
        });
    }

    syncImportRowCategory(rowElement) {
        const tbody = rowElement?.closest('tbody');
        if (!tbody) return;
        const rows = this.collectImportRows(tbody.id, this.getCurrentDefaultType());
        if (tbody.id === 'import-update-tbody') this.importRows.update = rows;
        if (tbody.id === 'import-new-tbody') this.importRows.new = rows;
        this.renderImportRows(tbody.id, rows);
    }

    syncAddRecordDrafts() {
        if (this.importModalMode !== 'add') return;
        const defaultType = this.getCurrentDefaultType();
        const cards = document.querySelectorAll('#add-record-card-list .add-record-card');
        if (!cards.length) return;
        this.importRows.new = this.collectAddRecordCards(defaultType);
    }

    appendAddRecordCard() {
        this.syncAddRecordDrafts();
        this.importRows.new.push(this.createBlankImportRow(this.importRows.new.length + 1));
        this.renderAddRecordCards();
    }

    removeAddRecordCard(index) {
        this.syncAddRecordDrafts();
        this.importRows.new.splice(index, 1);
        if (!this.importRows.new.length) {
            this.importRows.new.push(this.createBlankImportRow(1));
        }
        this.importRows.new.forEach((row, rowIndex) => {
            row.seq = rowIndex + 1;
        });
        this.renderAddRecordCards();
    }

    selectPointOption(button) {
        const value = button.dataset.pointOptionValue || '';
        const picker = button.closest('.point-picker');
        const input = picker?.querySelector('.point-picker-input');
        const dropdown = picker?.querySelector('.point-picker-dropdown');
        if (!input || !dropdown) return;
        input.value = value;
        input.dataset.selectedValue = value;
        dropdown.classList.add('hidden');
        if (input.dataset.field === 'pointNo') {
            this.syncAddRecordPointCategory(button.closest('.add-record-card'), value);
        }
    }

    confirmImportModal() {
        const defaultType = this.getCurrentDefaultType();
        const updateRows = this.collectImportRows('import-update-tbody', defaultType);
        const newRows = this.importModalMode === 'add'
            ? this.collectAddRecordCards(defaultType)
            : this.collectImportRows('import-new-tbody', defaultType);

        if (this.importModalMode === 'add') {
            const validation = this.validateImportRows(newRows, true, true);
            if (!validation.valid) {
                this.importRows = { update: [], new: validation.rows };
                this.renderImportModalTables();
                this.showImportMessage(validation.message);
                return;
            }
            const selectedRows = validation.rows.filter(row => row.checked);
            selectedRows.forEach(row => this.data.unshift(this.importRowToLedgerRow(row)));
            this.persistData();
            this.closeImportModal();
            this.currentPage = 1;
            this.renderTable();
            this.showToast(`已批量导入 ${selectedRows.length} 条新增记录`, 'success');
            return;
        }

        const validation = this.validateImportRows(newRows, true, false);
        if (!validation.valid) {
            this.importRows = { update: updateRows, new: validation.rows };
            this.renderImportModalTables();
            this.showImportMessage(validation.message);
            return;
        }

        updateRows.filter(row => row.checked).forEach(row => {
            const existing = this.data.find(item => item.pointNo.toLowerCase() === row.pointNo.toLowerCase());
            if (existing) Object.assign(existing, this.importRowToLedgerRow(row, existing.id, existing.type));
        });

        validation.rows.filter(row => row.checked).forEach(row => this.data.unshift(this.importRowToLedgerRow(row)));
        this.persistData();
        this.closeImportModal();
        this.currentPage = 1;
        this.renderTable();
        this.showToast('导入数据已同步保存', 'success');
    }

    validateImportRows(rows, checkExisting, requirePointPickerSelection = false) {
        const nextRows = rows.map(row => ({ ...row, pointNoClass: '' }));
        const seen = new Set();
        const existingKeys = checkExisting ? new Set(this.data.map(item => item.pointNo.toLowerCase())) : new Set();
        const pointOptions = new Set(this.getPointOptions().map(item => item.toLowerCase()));
        const issues = [];

        nextRows.forEach(row => {
            if (!row.checked) return;
            const pointNo = row.pointNo.trim().toLowerCase();
            const connectNo = row.connectNo.trim().toLowerCase();
            if (!pointNo) {
                row.pointNoClass = 'import-modal-highlight';
                issues.push(`第 ${row.seq} 行缺少管点编号`);
                return;
            }
            if (requirePointPickerSelection && !pointOptions.has(pointNo)) {
                row.pointNoClass = 'import-modal-highlight';
                issues.push(`第 ${row.seq} 行管线点号需从下拉结果中选择`);
            }
            if (requirePointPickerSelection && (!connectNo || !pointOptions.has(connectNo))) {
                row.connectNoClass = 'import-modal-highlight';
                issues.push(`第 ${row.seq} 行连接点号需从下拉结果中选择`);
            }
            if (seen.has(pointNo) || existingKeys.has(pointNo)) {
                row.pointNoClass = 'import-modal-highlight';
                issues.push(`第 ${row.seq} 行编号 ${row.pointNo} 重复`);
            }
            seen.add(pointNo);
        });

        return { valid: issues.length === 0, rows: nextRows, message: issues.length ? `检测到重复数据，请修改高亮管点编号后重新确认：${issues.slice(0, 3).join('；')}` : '' };
    }

    importRowToLedgerRow(row, forceId = null, forceType = null) {
        const normalizedRow = this.applyPointCategoryToRow({
            id: forceId || `LEDGER-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`,
            type: forceType || row.type || this.getCurrentDefaultType(),
            pointCategory: row.pointCategory?.trim() || '',
            pointNo: row.pointNo.trim(),
            connectNo: row.connectNo.trim(),
            length: row.length.trim(),
            feature: row.feature.trim(),
            attachment: row.attachment.trim(),
            material: row.material.trim(),
            diameter: row.diameter.trim(),
            casing: row.casing.trim(),
            casingMaterial: row.casingMaterial.trim(),
            pressure: row.pressure.trim(),
            flow: row.flow.trim(),
            holes: row.holes.trim(),
            x: row.x.trim(),
            y: row.y.trim(),
            groundElev: row.groundElev.trim(),
            topElev: row.topElev.trim(),
            bottomElev: row.bottomElev.trim(),
            startDepth: row.startDepth.trim(),
            endDepth: row.endDepth.trim(),
            method: row.method.trim(),
            year: row.year.trim(),
            owner: row.owner.trim(),
            note: row.note?.trim() || '手动维护'
        }, this.inferTypeFromPointNo(row.pointNo, forceType || row.type || row.pointCategory));
        return normalizedRow;
    }

    showImportMessage(message) {
        const messageEl = document.getElementById('import-modal-message');
        messageEl.textContent = message;
        messageEl.classList.remove('hidden');
    }

    exportCurrentTable() {
        const overlay = document.getElementById('export-loading-overlay');
        overlay.classList.remove('hidden');
        overlay.classList.add('flex');

        window.setTimeout(() => {
            const rows = this.getFilteredData();
            const html = `<table border="1"><thead><tr><th>管点编号</th><th>连接点编号</th><th>连接点长度(m)</th><th>管点分类</th><th>特征点</th><th>附属物</th><th>材质</th><th>管径或断面</th><th>套管尺寸</th><th>套管材质</th><th>压力(电压)</th><th>流向(根数)</th><th>总孔数/已用孔数</th><th>X</th><th>Y</th><th>地面高程</th><th>管顶</th><th>管底</th><th>起点埋深</th><th>终点埋深</th><th>埋设方式</th><th>年代</th><th>权属单位</th><th>备注</th></tr></thead><tbody>${rows.map(row => `<tr><td>${this.escapeHtml(row.pointNo)}</td><td>${this.escapeHtml(row.connectNo)}</td><td>${this.escapeHtml(row.length)}</td><td>${this.escapeHtml(row.pointCategory)}</td><td>${this.escapeHtml(row.feature)}</td><td>${this.escapeHtml(row.attachment)}</td><td>${this.escapeHtml(row.material)}</td><td>${this.escapeHtml(row.diameter)}</td><td>${this.escapeHtml(row.casing)}</td><td>${this.escapeHtml(row.casingMaterial)}</td><td>${this.escapeHtml(row.pressure)}</td><td>${this.escapeHtml(row.flow)}</td><td>${this.escapeHtml(row.holes)}</td><td>${this.escapeHtml(row.x)}</td><td>${this.escapeHtml(row.y)}</td><td>${this.escapeHtml(row.groundElev)}</td><td>${this.escapeHtml(row.topElev)}</td><td>${this.escapeHtml(row.bottomElev)}</td><td>${this.escapeHtml(row.startDepth)}</td><td>${this.escapeHtml(row.endDepth)}</td><td>${this.escapeHtml(row.method)}</td><td>${this.escapeHtml(row.year)}</td><td>${this.escapeHtml(row.owner)}</td><td>${this.escapeHtml(row.note)}</td></tr>`).join('')}</tbody></table>`;
            const blob = new Blob([`\ufeff${html}`], { type: 'application/vnd.ms-excel;charset=utf-8;' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = '综合地下管线成果表.xls';
            document.body.appendChild(link);
            link.click();
            link.remove();
            URL.revokeObjectURL(url);
            overlay.classList.add('hidden');
            overlay.classList.remove('flex');
            this.showToast('导出完成，Excel 已保存到本地', 'success');
        }, 1400);
    }

    showToast(message, type = 'success') {
        const toast = document.getElementById('page-toast');
        const colorMap = {
            success: 'border-emerald-200 text-emerald-700 dark:border-emerald-800 dark:text-emerald-300',
            warning: 'border-amber-200 text-amber-700 dark:border-amber-800 dark:text-amber-300'
        };
        toast.className = `fixed right-6 top-24 z-[130] max-w-sm rounded-lg border bg-white px-4 py-3 text-sm shadow-xl dark:bg-slate-900 toast-enter ${colorMap[type] || colorMap.success}`;
        toast.textContent = message;
        toast.classList.remove('hidden');
        window.clearTimeout(this.toastTimer);
        this.toastTimer = window.setTimeout(() => toast.classList.add('hidden'), 2200);
    }

    escapeHtml(value) {
        return String(value ?? '')
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new PipelineDataManager();
});
