#!/usr/bin/env python3
from __future__ import annotations

import argparse
import datetime as dt
import re
from pathlib import Path


METADATA_START = "<!-- 需求文档元数据：开始 -->"
METADATA_END = "<!-- 需求文档元数据：结束 -->"
DEFAULT_TITLE = "需求文档"
DEFAULT_VERSION = "v0.1.0"
DEFAULT_STATUS = "草稿"
DEFAULT_ITERATION = "待补充"
DEFAULT_PATH = "product-spec.md"


def today_str() -> str:
    return dt.date.today().isoformat()


def normalize_version(version: str | None) -> str:
    if not version:
        return DEFAULT_VERSION
    version = version.strip()
    if not version:
        return DEFAULT_VERSION
    return version if version.lower().startswith("v") else f"v{version}"


def metadata_block(project_name: str, version: str, date: str, iteration: str, status: str) -> str:
    return "\n".join(
        [
            METADATA_START,
            f"- 项目名称：{project_name}",
            f"- 文档版本：{version}",
            f"- 更新日期：{date}",
            f"- 所属迭代：{iteration}",
            f"- 文档状态：{status}",
            METADATA_END,
        ]
    )


def initial_content(title: str, project_name: str, version: str, date: str, iteration: str, status: str) -> str:
    return f"""# {title}

{metadata_block(project_name, version, date, iteration, status)}

## 1. 需求背景

- 说明业务背景、问题来源和建设动机。

## 2. 目标与范围

### 2.1 目标

- 说明本次需求希望达成的业务目标。

### 2.2 范围

- 说明本次纳入范围的页面、角色、流程、数据或接口。

### 2.3 非范围

- 说明本次明确不处理的内容，避免边界模糊。

## 3. 用户角色与业务场景

- 说明涉及角色、使用前提、核心场景和触发条件。

## 4. 功能需求

### 4.1 功能清单

- 列出本次需求涉及的功能点。

### 4.2 详细需求

- 按模块或页面展开输入、输出、交互、限制和异常场景。

## 5. 业务规则

- 写清判断条件、状态流转、权限规则、数据约束和边界处理。

## 6. 非功能需求

- 包括性能、可用性、安全性、兼容性、审计或监控要求。

## 7. 风险与依赖

- 说明外部依赖、实施风险、前置条件和潜在影响。

## 8. 验收标准

- 使用可验证语句描述交付结果。

## 9. 本次迭代更新摘要

- 概括本轮相较上一版本的新增、调整、删除和待确认内容。

## 10. 待确认事项

- 列出尚未确认的信息、影响范围和后续确认动作。
"""


def replace_or_insert_metadata(text: str, block: str, title: str) -> str:
    pattern = re.compile(re.escape(METADATA_START) + r".*?" + re.escape(METADATA_END), re.DOTALL)
    if pattern.search(text):
        return pattern.sub(block, text, count=1)

    if re.search(r"^\s*#\s+.+$", text, re.MULTILINE):
        return re.sub(r"(^\s*#\s+.+$\n?)", r"\1\n" + block + "\n\n", text, count=1, flags=re.MULTILINE)

    stripped = text.lstrip()
    prefix = "" if text == stripped else text[: len(text) - len(stripped)]
    return f"{prefix}# {title}\n\n{block}\n\n{stripped}"


def update_header_title(text: str, title: str) -> str:
    if re.search(r"^\s*#\s+.+$", text, re.MULTILINE):
        return re.sub(r"^\s*#\s+.+$", f"# {title}", text, count=1, flags=re.MULTILINE)
    return f"# {title}\n\n{text.lstrip()}"


def main() -> None:
    parser = argparse.ArgumentParser(description="创建或更新中文需求文档头部元数据。")
    parser.add_argument("--path", default=DEFAULT_PATH, help="需求文档 Markdown 文件路径，默认写入项目根目录 product-spec.md")
    parser.add_argument("--project-name", default="未命名项目", help="项目名称")
    parser.add_argument("--version", help="文档版本号，例如 v0.2.0")
    parser.add_argument("--date", default=today_str(), help="更新日期，格式 YYYY-MM-DD")
    parser.add_argument("--title", default=DEFAULT_TITLE, help="文档标题")
    parser.add_argument("--status", default=DEFAULT_STATUS, help="文档状态")
    parser.add_argument("--iteration", default=DEFAULT_ITERATION, help="所属迭代")
    args = parser.parse_args()

    path = Path(args.path)
    path.parent.mkdir(parents=True, exist_ok=True)

    version = normalize_version(args.version)
    date = args.date.strip() or today_str()
    block = metadata_block(
        project_name=args.project_name.strip() or "未命名项目",
        version=version,
        date=date,
        iteration=args.iteration.strip() or DEFAULT_ITERATION,
        status=args.status.strip() or DEFAULT_STATUS,
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
            iteration=args.iteration.strip() or DEFAULT_ITERATION,
            status=args.status.strip() or DEFAULT_STATUS,
        )

    path.write_text(updated.rstrip() + "\n", encoding="utf-8")
    print(f"[OK] 已写入需求文档：{path}")


if __name__ == "__main__":
    main()
