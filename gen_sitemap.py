#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
gen_sitemap.py - 为 mdBook 构建产物生成 sitemap.xml（后处理脚本）

用法:
    # 部署前用占位域名先生成（默认 https://example.com，路径前缀读 book.toml 的 site-url）
    python3 gen_sitemap.py

    # 部署时指定正式域名（推荐用环境变量，避免硬编码）
    SITEMAP_DOMAIN="https://gbadev-org.github.io" python3 gen_sitemap.py

说明:
    - 扫描 output/ 下所有 .html，拼成绝对 URL 写入 output/sitemap.xml
    - 路径前缀自动取自 book.toml 的 [output.html] site-url（本例为 /）
    - 仅域名需要占位/替换；路径前缀随 book.toml 自动同步
    - 跳过 print.html 与 404.html（非公开页面）
    - index.html 映射为站点根目录（/ 而非 /index.html）
    - 每个 <url> 附带 lastmod（取文件修改时间）

依赖: 仅 Python 标准库（3.11+ 用 tomllib；低版本回退到正则解析）
"""

import os
import re
import sys
import datetime
from pathlib import Path
from xml.sax.saxutils import escape

# ---- 配置 ----------------------------------------------------------------

ROOT = Path(__file__).resolve().parent
OUTPUT_DIR = ROOT / "output"
BOOK_TOML = ROOT / "book.toml"

# 占位域名：部署时通过环境变量 SITEMAP_DOMAIN 覆盖
DOMAIN = os.environ.get("SITEMAP_DOMAIN", "https://example.com").rstrip("/")

# 跳过这些页面（非公开/打印版）
SKIP_FILES = {"print.html", "404.html"}

# ---- 读取 book.toml 的 site-url -----------------------------------------

def get_site_url() -> str:
    """读取 [output.html] 下的 site-url，默认 /"""
    default = "/"
    if not BOOK_TOML.exists():
        return default
    try:
        import tomllib
        with open(BOOK_TOML, "rb") as f:
            cfg = tomllib.load(f)
        url = cfg.get("output", {}).get("html", {}).get("site-url", default)
        return url
    except Exception:
        # 回退：正则提取 site-url
        text = BOOK_TOML.read_text(encoding="utf-8")
        m = re.search(r'site-url\s*=\s*"([^"]+)"', text)
        return m.group(1) if m else default


def build_base_url() -> str:
    site_url = get_site_url().strip()
    if not site_url.startswith("/"):
        site_url = "/" + site_url
    if not site_url.endswith("/"):
        site_url += "/"
    # 避免 domain 与 site_url 拼接出双斜杠：DOMAIN 已 rstrip("/")
    return DOMAIN + site_url


# ---- 生成 sitemap --------------------------------------------------------

def collect_html() -> list[Path]:
    if not OUTPUT_DIR.exists():
        sys.exit(f"[error] 找不到输出目录: {OUTPUT_DIR}，请先运行 mdbook build")
    files = []
    for p in sorted(OUTPUT_DIR.rglob("*.html")):
        if p.name in SKIP_FILES:
            continue
        files.append(p)
    return files


def url_for(rel: str) -> str:
    rel = rel.replace(os.sep, "/")
    if rel == "index.html":
        return ""  # 根目录
    if rel.endswith("/index.html"):
        return rel[: -len("index.html")]  # 保留末尾斜杠
    return rel


def lastmod_for(p: Path) -> str:
    ts = p.stat().st_mtime
    return datetime.datetime.fromtimestamp(ts).strftime("%Y-%m-%d")


def main() -> None:
    base = build_base_url()
    html_files = collect_html()

    urls = []
    for p in html_files:
        rel = str(p.relative_to(OUTPUT_DIR))
        url = base + url_for(rel)
        urls.append((url, lastmod_for(p)))

    lines = [
        '<?xml version="1.0" encoding="UTF-8"?>',
        '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    ]
    for url, lastmod in urls:
        lines.append("  <url>")
        lines.append(f"    <loc>{escape(url)}</loc>")
        lines.append(f"    <lastmod>{lastmod}</lastmod>")
        lines.append("  </url>")
    lines.append("</urlset>")

    out = OUTPUT_DIR / "sitemap.xml"
    out.write_text("\n".join(lines) + "\n", encoding="utf-8")
    print(f"[ok] 已生成 {out} （共 {len(urls)} 个 URL，base={base}）")


if __name__ == "__main__":
    main()
