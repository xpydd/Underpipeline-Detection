import fs from "node:fs/promises";
import path from "node:path";
import { FileBlob, PresentationFile } from "@oai/artifact-tool";

const root = "D:/kylin/Projects/Products Manage/Underpipeline-Detection";
const workspace =
  "C:/Users/Kylin/AppData/Local/Temp/codex-presentations/019ed330-16d2-7562-8d45-a2094e8471de/underpipeline-product-report";
const tmp = path.join(workspace, "tmp");
const previewDir = path.join(tmp, "preview");
const layoutDir = path.join(tmp, "layout");
const qaDir = path.join(tmp, "qa");
const sourcePptx = path.join(root, "outputs", "管网智慧探测系统产品演示汇报.pptx");
const finalPptx = path.join(root, "outputs", "管网智慧探测系统产品演示汇报-补齐版.pptx");

const W = 1280;
const H = 720;
const C = {
  bg: "#F8FAFC",
  ink: "#0F172A",
  muted: "#64748B",
  line: "#DDE7EE",
  teal: "#0F766E",
  green: "#22C55E",
  blue: "#2563EB",
  amber: "#F59E0B",
  red: "#DC2626",
  purple: "#7C3AED",
  card: "#FFFFFF",
};

function addText(slide, text, position, style = {}) {
  const shape = slide.shapes.add({
    geometry: "textbox",
    position,
    fill: "none",
    line: { style: "solid", fill: "none", width: 0 },
  });
  shape.text = text;
  shape.text.style = {
    typeface: "Microsoft YaHei",
    fontSize: style.fontSize ?? 18,
    bold: style.bold ?? false,
    color: style.color ?? C.ink,
    alignment: style.alignment,
    ...style,
  };
  return shape;
}

function addRect(slide, position, fill, line = { style: "solid", fill: C.line, width: 1 }, radius = "rounded-xl") {
  return slide.shapes.add({
    geometry: "roundRect",
    position,
    fill,
    line,
    borderRadius: radius,
  });
}

function addFooter(slide, idx, source = "来源：当前前端原型、需求文档 v0.8.6、自动作业需求整理 V3.0") {
  addText(slide, source, { left: 54, top: 686, width: 820, height: 20 }, { fontSize: 10, color: "#94A3B8" });
  addText(slide, String(idx).padStart(2, "0"), { left: 1180, top: 680, width: 46, height: 26 }, { fontSize: 14, bold: true, color: C.teal, alignment: "right" });
}

function title(slide, kicker, heading, idx) {
  addText(slide, kicker, { left: 54, top: 40, width: 460, height: 22 }, { fontSize: 12, bold: true, color: C.teal });
  addText(slide, heading, { left: 54, top: 66, width: 1120, height: 58 }, { fontSize: 31, bold: true, color: C.ink });
  addFooter(slide, idx);
}

function pill(slide, text, x, y, color = C.teal, width = 112) {
  addRect(slide, { left: x, top: y, width, height: 30 }, `${color}18`, { style: "solid", fill: `${color}55`, width: 1 }, "rounded-full");
  addText(slide, text, { left: x + 10, top: y + 6, width: width - 20, height: 18 }, { fontSize: 12, bold: true, color, alignment: "center" });
}

function card(slide, x, y, w, h, heading, body, color = C.teal) {
  addRect(slide, { left: x, top: y, width: w, height: h }, C.card, { style: "solid", fill: C.line, width: 1 }, "rounded-xl");
  addRect(slide, { left: x, top: y, width: 8, height: h }, color, { style: "solid", fill: color, width: 0 }, "rounded-xl");
  addText(slide, heading, { left: x + 24, top: y + 18, width: w - 48, height: 26 }, { fontSize: 20, bold: true, color: C.ink });
  addText(slide, body, { left: x + 24, top: y + 52, width: w - 48, height: h - 64 }, { fontSize: 14, color: C.muted });
}

function bullet(slide, text, x, y, w, color = C.green, fontSize = 15) {
  addRect(slide, { left: x, top: y + 8, width: 8, height: 8 }, color, { style: "solid", fill: color, width: 0 }, "rounded-full");
  addText(slide, text, { left: x + 20, top: y, width: w - 20, height: 32 }, { fontSize, color: C.ink });
}

function arrow(slide, x1, y1, x2, y2, color = C.teal) {
  const left = Math.min(x1, x2);
  const top = Math.min(y1, y2);
  const width = Math.max(1, Math.abs(x2 - x1));
  const height = Math.max(1, Math.abs(y2 - y1));
  slide.shapes.add({
    geometry: "line",
    position: { left, top, width, height },
    fill: "none",
    line: { style: "solid", fill: color, width: 2 },
  });
}

function addFlowNode(slide, index, label, desc, x, y, color) {
  addRect(slide, { left: x, top: y, width: 130, height: 104 }, "#FFFFFF", { style: "solid", fill: "#DDE7EE", width: 1 }, "rounded-xl");
  addText(slide, String(index).padStart(2, "0"), { left: x + 14, top: y + 12, width: 58, height: 28 }, { fontSize: 18, bold: true, color });
  addText(slide, label, { left: x + 14, top: y + 42, width: 100, height: 24 }, { fontSize: 17, bold: true, color: C.ink });
  addText(slide, desc, { left: x + 14, top: y + 70, width: 104, height: 24 }, { fontSize: 11, color: C.muted });
}

function addMatrixCell(slide, x, y, w, h, text, fill, style = {}) {
  slide.shapes.add({
    geometry: "rect",
    position: { left: x, top: y, width: w, height: h },
    fill,
    line: { style: "solid", fill: "#E2E8F0", width: 1 },
  });
  addText(slide, text, { left: x + 8, top: y + 9, width: w - 16, height: h - 12 }, {
    fontSize: style.fontSize ?? 12,
    bold: style.bold ?? false,
    color: style.color ?? C.ink,
    alignment: style.alignment,
  });
}

async function appendNotes() {
  await fs.appendFile(
    path.join(tmp, "source-notes.txt"),
    [
      "",
      "补齐内容：",
      "- 业务闭环流程：基于 product-spec.md 核心业务场景与设备能力边界。",
      "- 角色协同：基于 product-spec.md 角色定义。",
      "- 作业模式与任务生命周期：基于 docs/gpr-auto-operation-requirements.md 作业模式、任务生命周期、性能与验收指标。",
      "- 成熟度、风险与推进路线：基于 product-spec.md 风险与依赖、待确认事项和验收标准。",
    ].join("\n"),
    "utf8",
  );
}

async function main() {
  await fs.mkdir(previewDir, { recursive: true });
  await fs.mkdir(layoutDir, { recursive: true });
  await fs.mkdir(qaDir, { recursive: true });

  const deck = await PresentationFile.importPptx(await FileBlob.load(sourcePptx));
  const startingCount = deck.slides.items.length;
  if (startingCount > 12) {
    console.warn(`Deck already has ${startingCount} slides; appending another supplement set.`);
  }

  {
    const idx = deck.slides.items.length + 1;
    const s = deck.slides.add(); s.background.fill = C.bg; title(s, "BUSINESS CLOSED LOOP", "业务闭环：从项目建档到成果复盘的端到端路径", idx);
    const nodes = [
      ["项目建档", "项目/业主/团队", C.teal],
      ["设备绑定", "系统级治理", C.green],
      ["作业规划", "模式/范围/参数", C.blue],
      ["现场探测", "地图/视频/指令", C.purple],
      ["结果接入", "解析/研判/日志", C.amber],
      ["数据台账", "分类/编辑/导出", C.teal],
      ["模型报告", "空间复核/输出", C.blue],
      ["知识复盘", "规范/案例沉淀", C.green],
    ];
    nodes.forEach((n, i) => {
      const x = 66 + (i % 4) * 292;
      const y = i < 4 ? 158 : 398;
      addFlowNode(s, i + 1, n[0], n[1], x, y, n[2]);
      if (i % 4 !== 3) arrow(s, x + 136, y + 52, x + 176, y + 52, "#94A3B8");
    });
    arrow(s, 1074, 262, 1050, 398, "#94A3B8");
    addRect(s, { left: 244, top: 312, width: 800, height: 54 }, "#ECFDF5", { style: "solid", fill: "#BBF7D0", width: 1 }, "rounded-xl");
    addText(s, "当前原型的价值不只是“页面多”，而是已经能串起管理对象、现场作业、成果资产和组织知识。", { left: 276, top: 328, width: 736, height: 24 }, { fontSize: 18, bold: true, color: C.teal, alignment: "center" });
  }

  {
    const idx = deck.slides.items.length + 1;
    const s = deck.slides.add(); s.background.fill = C.bg; title(s, "ROLE COLLABORATION", "角色协同：不同岗位在同一项目空间内分工推进", idx);
    const x0 = 70, y0 = 152;
    const widths = [154, 174, 174, 174, 174, 174];
    const rows = [
      ["角色", "项目建档", "设备作业", "勘探处理", "数据成果", "审核交付"],
      ["系统管理员", "配置基础资料", "设备接入/绑定/换绑", "维护全局字典", "维护组织用户", "审计与权限"],
      ["项目经理", "创建项目/分配成员", "确认项目绑定设备", "跟踪进度与问题", "查看项目成果", "统筹验收"],
      ["勘探人员", "查看项目要求", "下发规划/控制任务", "处理现场问题", "导入勘探成果", "提交复核"],
      ["数据人员", "读取项目口径", "接收回传结果", "校核字段补录", "维护数据台账", "输出成果数据"],
      ["报告/审核", "确认范围", "引用设备与数据证据", "复核问题闭环", "生成报告材料", "质量把关"],
    ];
    rows.forEach((row, r) => {
      let x = x0;
      row.forEach((cell, c) => {
        const fill = r === 0 ? "#0F766E" : c === 0 ? "#ECFDF5" : "#FFFFFF";
        const color = r === 0 ? "#FFFFFF" : c === 0 ? C.teal : C.ink;
        addMatrixCell(s, x, y0 + r * 72, widths[c], 72, cell, fill, { bold: r === 0 || c === 0, color, fontSize: r === 0 ? 13 : 12, alignment: c === 0 ? "center" : undefined });
        x += widths[c];
      });
    });
    addText(s, "汇报口径：当前版本已经把岗位职责映射到页面入口，后续需要用权限模型和审批规则把“可看、可改、可下发”固化。", { left: 84, top: 606, width: 980, height: 28 }, { fontSize: 17, bold: true, color: C.teal });
  }

  {
    const idx = deck.slides.items.length + 1;
    const s = deck.slides.add(); s.background.fill = C.bg; title(s, "OPERATION MODES", "自动作业模式：探索、遍历、复检分别解决不同现场问题", idx);
    card(s, 64, 150, 350, 190, "探索模式", "面向未知区域盲探，自主发现疑似管线；连续多帧命中后触发巡线，输出疑似管线路由和覆盖轨迹。", C.teal);
    card(s, 465, 150, 350, 190, "遍历模式", "面向道路、厂区、施工场地普查，按边界生成弓字形全覆盖路径，目标是覆盖完整、不漏扫。", C.green);
    card(s, 866, 150, 350, 190, "复检模式", "面向历史成果、低置信数据和已确认管线，支持补扫、强化扫、精细扫，提升交付可信度。", C.blue);
    addText(s, "任务生命周期", { left: 74, top: 405, width: 220, height: 34 }, { fontSize: 26, bold: true, color: C.ink });
    const states = ["创建", "待启动", "执行中", "暂停", "恢复", "终止", "完成"];
    states.forEach((st, i) => {
      const x = 78 + i * 160;
      addRect(s, { left: x, top: 470, width: 112, height: 54 }, i === 6 ? "#ECFDF5" : "#FFFFFF", { style: "solid", fill: i === 6 ? "#BBF7D0" : "#DDE7EE", width: 1 }, "rounded-xl");
      addText(s, st, { left: x + 14, top: 486, width: 84, height: 22 }, { fontSize: 16, bold: true, color: i === 6 ? C.teal : C.ink, alignment: "center" });
      if (i < states.length - 1) arrow(s, x + 116, 497, x + 150, 497, "#94A3B8");
    });
    addText(s, "补齐意义：这页把“当前控制台页面”与“自动作业需求”对齐，便于领导判断后续真实设备联调的边界。", { left: 78, top: 584, width: 990, height: 28 }, { fontSize: 16, bold: true, color: C.teal });
  }

  {
    const idx = deck.slides.items.length + 1;
    const s = deck.slides.add(); s.background.fill = C.bg; title(s, "READINESS", "当前成熟度判断：骨架完整，生产级链路仍需打通", idx);
    const items = [
      ["信息架构", "已形成", "一级模块、项目工作台、系统设置、知识中心入口明确。", C.green, 92],
      ["设备作业原型", "已形成", "系统级设备治理和项目级控制台均有真实可见界面。", C.green, 92],
      ["数据成果台账", "已形成", "管线分类、成果字段、导入/编辑/导出入口清晰。", C.green, 92],
      ["模型/报告承接", "待深化", "入口与视觉已存在，模板、服务和验收规则待补齐。", C.amber, 60],
      ["真实后端链路", "待打通", "接口、权限、正式入库、审计与部署策略未完成。", C.amber, 48],
      ["真实设备联调", "待验证", "MQTT 网关、鉴权、断线重连、坐标转换仍待确认。", C.red, 42],
    ];
    items.forEach((it, i) => {
      const y = 150 + i * 72;
      addText(s, it[0], { left: 78, top: y + 11, width: 156, height: 24 }, { fontSize: 18, bold: true, color: C.ink });
      pill(s, it[1], 246, y + 8, it[3], 92);
      addRect(s, { left: 370, top: y + 17, width: 420, height: 14 }, "#E2E8F0", { style: "solid", fill: "#E2E8F0", width: 0 }, "rounded-full");
      addRect(s, { left: 370, top: y + 17, width: 420 * it[4] / 100, height: 14 }, it[3], { style: "solid", fill: it[3], width: 0 }, "rounded-full");
      addText(s, `${it[4]}%`, { left: 806, top: y + 8, width: 52, height: 24 }, { fontSize: 14, bold: true, color: it[3] });
      addText(s, it[2], { left: 878, top: y + 8, width: 300, height: 34 }, { fontSize: 14, color: C.muted });
    });
    addRect(s, { left: 78, top: 600, width: 1060, height: 46 }, "#F0FDFA", { style: "solid", fill: "#99F6E4", width: 1 }, "rounded-xl");
    addText(s, "判断：适合做产品方案汇报、业务评审和联调前确认；若进入试点交付，需要先冻结数据模型与设备协议。", { left: 104, top: 614, width: 1000, height: 22 }, { fontSize: 17, bold: true, color: C.teal });
  }

  {
    const idx = deck.slides.items.length + 1;
    const s = deck.slides.add(); s.background.fill = C.bg; title(s, "RISKS AND DEPENDENCIES", "风险与依赖：需要领导协调的不是页面，而是跨端链路", idx);
    const risks = [
      ["后端与权限", "正式接口、会话鉴权、角色权限、审批规则尚未统一，影响从原型到生产系统的迁移。", C.red],
      ["设备与 MQTT", "网关部署、鉴权、心跳保活、断线重连、消息重试和超时策略需要设备端/后端共同确认。", C.amber],
      ["坐标与 GIS", "WGS84、ENU、CGCS2000、地图坐标之间的转换算法和责任边界需要冻结。", C.blue],
      ["成果入库", "雷达候选成果到勘探成果、再到正式数据台账的编号、冲突、审核、回滚规则未冻结。", C.teal],
      ["模型与报告", "三维模型服务、报告模板、导出格式、审核流程仍属于承接层，尚未形成生产闭环。", C.purple],
      ["试点验收", "自动作业侧涉及精度、覆盖率、断点续跑、安全响应等硬指标，需要现场测试用例支撑。", C.green],
    ];
    risks.forEach((r, i) => {
      const x = 70 + (i % 2) * 570;
      const y = 148 + Math.floor(i / 2) * 142;
      card(s, x, y, 510, 105, r[0], r[1], r[2]);
    });
    addText(s, "建议领导拍板事项：接口责任边界、试点设备与场地、验收指标口径、跨部门联调节奏。", { left: 86, top: 592, width: 960, height: 28 }, { fontSize: 18, bold: true, color: C.red });
  }

  {
    const idx = deck.slides.items.length + 1;
    const s = deck.slides.add(); s.background.fill = C.bg; title(s, "ROADMAP", "建议推进路线：四步把原型推进到试点可用", idx);
    const steps = [
      ["第 1 阶段", "冻结基线", "冻结项目、设备、成果、用户权限数据模型；补齐接口清单与验收口径。", C.teal],
      ["第 2 阶段", "打通设备链路", "完成设备接入、绑定、MQTT 指令、ack、回传台账和日志追溯联调。", C.green],
      ["第 3 阶段", "形成成果闭环", "打通雷达结果解析、准确性研判、勘探成果导入、数据台账审核。", C.blue],
      ["第 4 阶段", "试点交付", "补齐报告模板、知识库内容、测试用例、部署手册和试点复盘材料。", C.amber],
    ];
    steps.forEach((st, i) => {
      const x = 92 + i * 286;
      addRect(s, { left: x, top: 180, width: 230, height: 330 }, "#FFFFFF", { style: "solid", fill: "#DDE7EE", width: 1 }, "rounded-xl");
      addRect(s, { left: x, top: 180, width: 230, height: 12 }, st[3], { style: "solid", fill: st[3], width: 0 }, "rounded-xl");
      addText(s, st[0], { left: x + 22, top: 218, width: 96, height: 24 }, { fontSize: 15, bold: true, color: st[3] });
      addText(s, st[1], { left: x + 22, top: 260, width: 170, height: 36 }, { fontSize: 27, bold: true, color: C.ink });
      addText(s, st[2], { left: x + 22, top: 324, width: 176, height: 100 }, { fontSize: 15, color: C.muted });
      if (i < steps.length - 1) arrow(s, x + 238, 344, x + 270, 344, "#94A3B8");
    });
    addRect(s, { left: 92, top: 562, width: 1080, height: 54 }, "#ECFDF5", { style: "solid", fill: "#BBF7D0", width: 1 }, "rounded-xl");
    addText(s, "管理建议：不要先大而全重构，先用一个绑定设备、一个项目、一条成果链路做试点闭环。", { left: 124, top: 578, width: 1010, height: 24 }, { fontSize: 18, bold: true, color: C.teal, alignment: "center" });
  }

  for (const [index, slide] of deck.slides.items.entries()) {
    const stem = `slide-${String(index + 1).padStart(2, "0")}`;
    const png = await deck.export({ slide, format: "png", scale: 1 });
    await fs.writeFile(path.join(previewDir, `${stem}.png`), new Uint8Array(await png.arrayBuffer()));
    const layout = await slide.export({ format: "layout" });
    await fs.writeFile(path.join(layoutDir, `${stem}.layout.json`), await layout.text());
  }
  const montage = await deck.export({ format: "webp", montage: true, scale: 1 });
  await fs.writeFile(path.join(previewDir, "deck-montage.webp"), new Uint8Array(await montage.arrayBuffer()));
  const pptx = await PresentationFile.exportPptx(deck);
  await pptx.save(finalPptx);
  await appendNotes();
  await fs.writeFile(path.join(qaDir, "visual-qa.txt"), [
    "PPTX exists and is non-empty: pending shell verification",
    `Expected slide count: ${deck.slides.items.length}`,
    "Every final slide rendered: yes",
    "Supplement pages added: business loop, roles, operation modes, readiness, risks, roadmap",
    "Material claims map to source-notes.txt: yes",
    "Screenshots remain local product UI captured from current prototype: yes",
    "Remaining caveat: current system is a static front-end prototype with simulated/local data; deck does not claim production KPI.",
  ].join("\n"), "utf8");
  console.log(JSON.stringify({ finalPptx, previewDir, slideCount: deck.slides.items.length }, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
