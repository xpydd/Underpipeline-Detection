#!/usr/bin/env python3
from __future__ import annotations

import argparse
import datetime as dt
import re
from pathlib import Path


METADATA_START = "<!-- 需求变更日志元数据：开始 -->"
METADATA_END = "<!-- 需求变更日志元数据：结束 -->"
DEFAULT_TITLE = "需求变更日志"
DEFAULT_VERSION = "v0.1.0"
DEFAULT_MAINTAIN_STATUS = "持续维护"
DEFAULT_PATH = "spec-log.md"


def today_str() -> str:
    return dt.date.today().isoformat()


def normalize_version(version: str | None) -> str:
    if not version:
        return DEFAULT_VERSION
    version = version.strip()
    if not version:
        return DEFAULT_VERSION
    return version if version.lower().startswith("v") else f"v{version}"


def sanitize_cell(value: str) -> str:
    cleaned = " ".join(value.replace("|", "/").split())
    return cleaned if cleaned else "-"


def metadata_block(project_name: str, version: str, date: str, maintain_status: str) -> str:
    return "\n".join(
        [
            METADATA_START,
            f"- 项目名称：{project_name}",
            f"- 当前版本：{version}",
            f"- 最近更新日期：{date}",
            f"- 维护状态：{maintain_status}",
            METADATA_END,
        ]
    )


def initial_content(title: str, project_name: str, version: str, date: str, maintain_status: str) -> str:
    return f"""# {title}

{metadata_block(project_name, version, date, maintain_status)}

## 变更记录

| 日期 | 版本 | 变更类型 | 变更摘要 | 影响范围 | 关联迭代 | 状态 |
| --- | --- | --- | --- | --- | --- | --- |
| {date} | {version} | 初始化 | 创建需求变更日志文件 | 全局 | 需求建立 | 已记录 |

## 使用说明

- 新记录按时间倒序追加在表头下方。
- 每次需求文档版本变化时同步记录原因、影响范围与结果。
"""


def update_header_title(text: str, title: str) -> str:
    if re.search(r"^\s*#\s+.+$", text, re.MULTILINE):
        return re.sub(r"^\s*#\s+.+$", f"# {title}", text, count=1, flags=re.MULTILINE)
    return f"# {title}\n\n{text.lstrip()}"


def replace_or_insert_metadata(text: str, block: str, title: str) -> str:
    pattern = re.compile(re.escape(METADATA_START) + r".*?" + re.escape(METADATA_END), re.DOTALL)
    if pattern.search(text):
        return pattern.sub(block, text, count=1)

    if re.search(r"^\s*#\s+.+$", text, re.MULTILINE):
        return re.sub(r"(^\s*#\s+.+$\n?)", r"\1\n" + block + "\n\n", text, count=1, flags=re.MULTILINE)

    stripped = text.lstrip()
    prefix = "" if text == stripped else text[: len(text) - len(stripped)]
    return f"{prefix}# {title}\n\n{block}\n\n{stripped}"


def insert_row(text: str, row: str) -> str:
    if row in text:
        return text

    pattern = re.compile(
        r"(\| 日期 \| 版本 \| 变更类型 \| 变更摘要 \| 影响范围 \| 关联迭代 \| 状态 \|\n\| --- \| --- \| --- \| --- \| --- \| --- \| --- \|(?:\n)?)"
    )
    if pattern.search(text):
        return pattern.sub(r"\1" + row + "\n", text, count=1)

    fallback_table = (
        "## 变更记录\n\n"
        "| 日期 | 版本 | 变更类型 | 变更摘要 | 影响范围 | 关联迭代 | 状态 |\n"
        "| --- | --- | --- | --- | --- | --- | --- |\n"
        f"{row}\n"
    )
    if "## 变更记录" in text:
        return text.replace("## 变更记录", fallback_table.rstrip(), 1)
    return text.rstrip() + "\n\n" + fallback_table


def build_row(date: str, version: str, change_type: str, summary: str, impact: str, iteration: str, entry_status: str) -> str:
    return (
        f"| {sanitize_cell(date)} | {sanitize_cell(version)} | {sanitize_cell(change_type)} | "
        f"{sanitize_cell(summary)} | {sanitize_cell(impact)} | {sanitize_cell(iteration)} | {sanitize_cell(entry_status)} |"
    )


def main() -> None:
    parser = argparse.ArgumentParser(description="创建或更新中文需求变更日志。")
    parser.add_argument("--path", default=DEFAULT_PATH, help="需求变更日志 Markdown 文件路径，默认写入项目根目录 spec-log.md")
    parser.add_argument("--project-name", default="未命名项目", help="项目名称")
    parser.add_argument("--version", help="当前版本号，例如 v0.2.0")
    parser.add_argument("--date", default=today_str(), help="更新日期，格式 YYYY-MM-DD")
    parser.add_argument("--title", default=DEFAULT_TITLE, help="日志标题")
    parser.add_argument("--maintain-status", default=DEFAULT_MAINTAIN_STATUS, help="维护状态")
    parser.add_argument("--append-entry", action="store_true", help="是否追加一条新的变更记录")
    parser.add_argument("--change-type", default="修改", help="变更类型")
    parser.add_argument("--summary", default="待补充变更摘要", help="变更摘要")
    parser.add_argument("--impact", default="待补充影响范围", help="影响范围")
    parser.add_argument("--iteration", default="待补充", help="关联迭代")
    parser.add_argument("--entry-status", default="已记录", help="记录状态")
    args = parser.parse_args()

    path = Path(args.path)
    path.parent.mkdir(parents=True, exist_ok=True)

    version = normalize_version(args.version)
    date = args.date.strip() or today_str()
    block = metadata_block(
        project_name=args.project_name.strip() or "未命名项目",
        version=version,
        date=date,
        maintain_status=args.maintain_status.strip() or DEFAULT_MAINTAIN_STATUS,
    )

    if path.exists():
        text = path.read_text(encoding="utf-8")
        text = update_header_title(text, args.title.strip() or DEFAULT_TITLE)
        updated = replace_or_insert_metadata(text, block, args.title.strip() or DEFAULT_TITLE)
    else:
        updated = initial_content(
            title=args.title.strip() or DEFAULT_TITLE,
            project_name=args.project_name.strip() or "未命名项目",
            version=version,
            date=date,
            maintain_status=args.maintain_status.strip() or DEFAULT_MAINTAIN_STATUS,
        )

    if args.append_entry:
        row = build_row(
            date=date,
            version=version,
            change_type=args.change_type,
            summary=args.summary,
            impact=args.impact,
            iteration=args.iteration,
            entry_status=args.entry_status,
        )
        updated = insert_row(updated, row)

    path.write_text(updated.rstrip() + "\n", encoding="utf-8")
    print(f"[OK] 已写入需求变更日志：{path}")


if __name__ == "__main__":
    main()
