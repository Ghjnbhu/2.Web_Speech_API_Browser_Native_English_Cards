#!/usr/bin/env python3
r"""
tree_to_json.py — построить чистое JSON-дерево содержимого папки.

Пропускает служебные папки/файлы:
  • виртуальные окружения   (venv, .venv, env, .env, virtualenv, …)
  • VCS                     (.git, .svn, .hg, .bzr)
  • кэш / сборка            (__pycache__, .mypy_cache, .pytest_cache,
                             build, dist, *.egg-info, .cache, …)
  • node / js               (node_modules, .next, .nuxt, .vite, .turbo, …)
  • IDE                     (.idea, .vscode, .history)
  • OS-мусор                (.DS_Store, Thumbs.db, desktop.ini)
  • мусор в файлах          (*.pyc, *.pyo, *.swp, *~, *.log)

Поле "size" по умолчанию НЕ создаётся. Чтобы его добавить — флаг --sizes.

Использование:
  python tree_to_json.py                          # ./  → tree.json
  python tree_to_json.py src                      # src → tree.json
  python tree_to_json.py . out.json               # ./  → out.json
  python tree_to_json.py . out.json --flat        # плоский список путей
  python tree_to_json.py . out.json --ext .py,.jsx,.css
  python tree_to_json.py . out.json --sizes       # добавить size
  python tree_to_json.py . out.json --no-ignore   # ничего не пропускать
  python tree_to_json.py . -                      # вывод в stdout

Примеры путей:
  C:/Users/bogat/.vscode/React/2.Web_Speech_API_Browser_Native_English_Cards
  ./src
  ../another-project
"""

from __future__ import annotations

import argparse
import fnmatch
import json
import os
import stat
import sys
from pathlib import Path
from typing import Iterable

# ─────────────────────────────────────────────────────────────
# 1. Что пропускать
# ─────────────────────────────────────────────────────────────

DEFAULT_IGNORE_DIRS: set[str] = {
    "venv", ".venv", "env", ".env", "virtualenv", ".virtualenv",
    "conda-meta", "__pypackages__", ".eggs", "*.egg-info",
    "__pycache__", ".mypy_cache", ".pytest_cache", ".ruff_cache",
    ".tox", ".nox", ".hypothesis",
    "build", "dist", "wheels", "site-packages",
    "node_modules", "bower_components", ".next", ".nuxt",
    ".svelte-kit", ".vite", ".turbo", ".parcel-cache", ".cache",
    "coverage", ".nyc_output",
    ".git", ".svn", ".hg", ".bzr",
    ".idea", ".vscode", ".history",
    ".Trash", "$RECYCLE.BIN", "System Volume Information",
}

DEFAULT_IGNORE_FILES: set[str] = {
    ".DS_Store", "Thumbs.db", "desktop.ini",
    "*.pyc", "*.pyo", "*.pyd",
    "*.swp", "*.swo", "*~",
    "*.log",
}

# ─────────────────────────────────────────────────────────────
# 2. Утилиты
# ─────────────────────────────────────────────────────────────

def matches_any(name: str, patterns: Iterable[str]) -> bool:
    return any(fnmatch.fnmatch(name, pat) for pat in patterns)


def human_size(n: int) -> str:
    size = float(n)
    for unit in ("B", "KB", "MB", "GB", "TB"):
        if size < 1024:
            return f"{int(size)} {unit}" if unit == "B" else f"{size:.1f} {unit}"
        size /= 1024
    return f"{size:.1f} PB"


def walk_tree(
    root: Path,
    *,
    ignore_dirs: set[str],
    ignore_files: set[str],
    only_exts: set[str] | None,
    include_sizes: bool,
) -> dict:
    """Рекурсивно строит словарь дерева."""
    def _walk(dir_abs: Path, rel: str) -> dict:
        node: dict = {
            "type": "directory",
            "name": dir_abs.name if rel else (root.name or "."),
            "path": rel or ".",
            "contents": [],
        }
        try:
            entries = sorted(
                dir_abs.iterdir(),
                key=lambda p: (not p.is_dir(), p.name.lower()),
            )
        except PermissionError:
            node["error"] = "permission denied"
            return node

        for entry in entries:
            name = entry.name

            if entry.is_dir():
                if matches_any(name, ignore_dirs):
                    continue
                node["contents"].append(_walk(entry, f"{rel}/{name}" if rel else name))
                continue

            if matches_any(name, ignore_files):
                continue

            if only_exts is not None and entry.suffix.lower() not in only_exts:
                continue

            try:
                st = entry.lstat()
            except OSError:
                continue

            if stat.S_ISLNK(st.st_mode):
                try:
                    target = os.readlink(entry)
                except OSError:
                    target = ""
                item: dict = {
                    "type": "symlink",
                    "name": name,
                    "path": f"{rel}/{name}" if rel else name,
                    "target": target,
                }
                if include_sizes:
                    item["size"] = st.st_size
                node["contents"].append(item)
                continue

            item = {
                "type": "file",
                "name": name,
                "path": f"{rel}/{name}" if rel else name,
            }
            if include_sizes:
                item["size"] = st.st_size
            node["contents"].append(item)

        return node

    return _walk(root, "")


def flatten_tree(tree: dict) -> list[str]:
    out: list[str] = []

    def _rec(node: dict) -> None:
        for child in node.get("contents", []):
            t = child.get("type")
            if t == "file":
                out.append(child["path"])
            elif t == "directory":
                _rec(child)

    _rec(tree)
    return sorted(out)


def _counts(tree: dict) -> tuple[int, int]:
    """Возвращает (число файлов, число папок). Размеры не считает."""
    files = dirs = 0

    def _rec(node: dict) -> None:
        nonlocal files, dirs
        for child in node.get("contents", []):
            t = child.get("type")
            if t == "file":
                files += 1
            elif t == "directory":
                dirs += 1
                _rec(child)

    _rec(tree)
    return files, dirs


# ─────────────────────────────────────────────────────────────
# 3. CLI
# ─────────────────────────────────────────────────────────────

def parse_exts(value: str | None) -> set[str] | None:
    if not value:
        return None
    exts: set[str] = set()
    for raw in value.split(","):
        token = raw.strip().lower()
        if not token:
            continue
        if not token.startswith("."):
            token = "." + token
        exts.add(token)
    return exts or None


def main(argv: list[str] | None = None) -> int:
    p = argparse.ArgumentParser(
        description="Построить JSON-дерево папки, пропуская служебные элементы."
    )
    p.add_argument("root", nargs="?", default=".", help="корневая папка (по умолчанию '.')")
    p.add_argument("out", nargs="?", default="tree.json", help="выходной файл или '-' для stdout")
    p.add_argument("--ext", default=None,
                   help="оставить только указанные расширения: .py,.js,.css")
    p.add_argument("--flat", action="store_true",
                   help="плоский массив путей вместо дерева")
    p.add_argument("--sizes", action="store_true",
                   help="добавить поле size (по умолчанию size не создаётся)")
    p.add_argument("--no-ignore", action="store_true",
                   help="ничего не пропускать (осторожно: может быть огромным)")
    p.add_argument("--indent", type=int, default=2,
                   help="отступ JSON (2 по умолчанию, 0 — компактно)")
    args = p.parse_args(argv)

    root = Path(args.root).resolve()
    if not root.is_dir():
        print(f"[tree] not a directory: {root}", file=sys.stderr)
        return 2

    ignore_dirs = set() if args.no_ignore else DEFAULT_IGNORE_DIRS
    ignore_files = set() if args.no_ignore else DEFAULT_IGNORE_FILES
    only_exts = parse_exts(args.ext)

    tree = walk_tree(
        root,
        ignore_dirs=ignore_dirs,
        ignore_files=ignore_files,
        only_exts=only_exts,
        include_sizes=args.sizes,
    )

    payload = flatten_tree(tree) if args.flat else tree
    indent = None if args.indent == 0 else args.indent
    text = json.dumps(payload, ensure_ascii=False, indent=indent)

    files, dirs = _counts(tree)
    if args.flat:
        print(f"[tree] {files} file(s), flat", file=sys.stderr)
    else:
        print(f"[tree] {files} file(s), {dirs} dir(s)", file=sys.stderr)

    if args.out == "-":
        sys.stdout.write(text + "\n")
    else:
        out_path = Path(args.out)
        out_path.write_text(text, encoding="utf-8")
        print(f"[tree] wrote {out_path}", file=sys.stderr)

    return 0


if __name__ == "__main__":
    raise SystemExit(main())