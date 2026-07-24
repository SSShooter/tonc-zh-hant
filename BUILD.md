# 构建与部署流程（BUILD.md）

Tonc 是一本用 **mdBook** 生成的静态站点（GBA 编程教程）。
本文件记录从零到部署到 Cloudflare Pages 的完整流程，避免遗忘。

部署方式：**本地构建，直接上传 `output/` 目录到 Cloudflare Pages（Direct Upload）**。
（不依赖 Cloudflare 的构建镜像，因为那里默认没有 Rust/Cargo，现场编译很慢。）

---

## 1. 一次性环境准备

需要：Rust (cargo)、mdBook、Python 3.11+、Node.js（用于 wrangler 上传）。

```bash
# 1) Rust 工具链（若未安装）
#    https://rustup.rs 或：
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y
source "$HOME/.cargo/env"

# 2) 安装 mdBook（本仓库的 workspace 不含 mdbook 本体，需单独装）
cargo install mdbook

# 3) Python（gen_sitemap.py 需要 3.11+，用到标准库 tomllib）
python3 --version

# 4) Node / wrangler（用于上传到 Cloudflare Pages）
#    无需全局安装，用 npx 即可，见下方部署步骤
```

> 说明：构建时 `mdbook build` 会自动通过 `cargo run -p ...` 调用本仓库的三个本地预处理器
> （`mdbook-external-links`、`mdbook-toc`、`preproc`/`pandocs`），无需额外安装。

---

## 2. 日常构建

在仓库根目录执行：

```bash
# 生成静态站点到 output/
mdbook build

# 生成 sitemap.xml（写入 output/sitemap.xml）
#   - 默认域名占位符为 https://example.com（路径前缀自动读 book.toml 的 site-url=/tonc/）
#   - 部署前务必用 SITEMAP_DOMAIN 指定正式域名
python3 gen_sitemap.py

# 或者一条命令带正式域名：
SITEMAP_DOMAIN="https://gbadev-org.github.io" python3 gen_sitemap.py
```

构建产物全部在 `output/` 目录：
- `output/index.html` 等 30+ 个 HTML 页面
- `output/sitemap.xml`（由 `gen_sitemap.py` 生成）

### sitemap 说明
- 路径前缀（如 `/tonc/`）自动取自 `book.toml` 的 `[output.html] site-url`，与构建配置同步，无需手改。
- 仅**域名**需要替换：`SITEMAP_DOMAIN` 环境变量覆盖（默认 `https://example.com`）。
- 脚本会跳过 `print.html` / `404.html`；`index.html` 映射为站点根目录 `https://<domain>/tonc/`。

---

## 3. 部署到 Cloudflare Pages（Direct Upload）

把已经构建好的 `output/` 直接上传，**Cloudflare 侧不需要 Rust**。

```bash
# 方式 A：wrangler 命令行（推荐，可脚本化）
npx wrangler pages deploy output --project-name <你的 Pages 项目名>
# 首次会提示登录 Cloudflare；之后每次推新版本即可。

# 方式 B：Cloudflare 控制台手动上传
#   Cloudflare Dashboard → Pages → 你的项目 → "Upload assets" → 选择 output/ 目录
```

> 自定义域名 / 子路径：站点本来就以 `/tonc/` 为前缀（见 `book.toml` 的 `site-url`）。
> 若挂在子路径下，确保 SITEMAP_DOMAIN 与最终访问地址一致，否则 sitemap 里的 URL 会不对。

---

## 4. 完整一键流程（复习用）

```bash
# 0) 进入仓库
cd /path/to/tonc

# 1) 构建
mdbook build

# 2) 生成 sitemap（替换成你的正式域名）
SITEMAP_DOMAIN="https://gbadev-org.github.io" python3 gen_sitemap.py

# 3) 上传到 Cloudflare Pages
npx wrangler pages deploy output --project-name <项目名>
```

---

## 5. 可选增强（暂未做）

- **robots.txt**：在 `output/` 放一个 `robots.txt`，内容 `Sitemap: https://<domain>/tonc/sitemap.xml`，
  让搜索引擎更易发现。可用脚本在 `gen_sitemap.py` 里一并生成。
- **CI 自动化**：若以后想改成 Git push 自动部署，可把上面的 1~3 步放进
  GitHub Actions（构建 + 生成 sitemap + `wrangler pages deploy`），见对话历史中的方案说明。

---

## 6. 排查备忘

| 现象 | 可能原因 | 处理 |
|------|----------|------|
| `mdbook: command not found` | 没装 mdBook 本体 | `cargo install mdbook` |
| `cargo run -p ...` 失败 | 预处理器编译错误 | `cargo build` 看具体报错 |
| sitemap 里是 `example.com` | 没传 `SITEMAP_DOMAIN` | 部署前务必设置该环境变量 |
| 上传后页面 404 | 上传了错误目录 | 确认上传的是 `output/`（含 index.html） |
| 改了 `site-url` 不生效 | 路径前缀没同步 | 改 `book.toml` 后重跑 `mdbook build` + `gen_sitemap.py` |
