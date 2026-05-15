#!/usr/bin/env python
import argparse
import json
import os
import sys
from pathlib import Path

import fitz
import pypdfium2 as pdfium
import pytesseract
from PIL import Image


def clean_text(text):
    return "\n".join(line.strip() for line in str(text or "").splitlines() if line.strip())


def ocr_with_tesseract(image, lang):
    tess_cmd = os.environ.get("SNAP_TESSERACT_CMD", "").strip()
    if tess_cmd:
        pytesseract.pytesseract.tesseract_cmd = tess_cmd
    tess_lang = "chi_sim+eng" if str(lang).lower().startswith("zh") else "eng"
    return clean_text(pytesseract.image_to_string(image, lang=tess_lang))


def ocr_image(image, backend, lang):
    backend = str(backend or "auto").lower()
    return ocr_with_tesseract(image, lang), "tesseract"


def extract_pdf_text(path, max_pages):
    try:
        doc = fitz.open(path)
    except Exception:
        return ""
    chunks = []
    for i in range(min(max_pages, len(doc))):
        text = clean_text(doc.load_page(i).get_text("text"))
        if text:
            chunks.append(text)
    return clean_text("\n\n".join(chunks))


def render_pdf_pages(path, max_pages):
    doc = pdfium.PdfDocument(str(path))
    for i in range(min(max_pages, len(doc))):
        page = doc[i]
        yield page.render(scale=2.0).to_pil().convert("RGB")


_PPSTRUCTURE_ENGINE = None


def get_ppstructure_engine(lang):
    global _PPSTRUCTURE_ENGINE
    if _PPSTRUCTURE_ENGINE is not None:
        return _PPSTRUCTURE_ENGINE
    from paddleocr import PPStructure
    pp_lang = "ch" if str(lang).lower().startswith("zh") else "en"
    _PPSTRUCTURE_ENGINE = PPStructure(
        table=True,
        ocr=True,
        show_log=False,
        lang=pp_lang,
    )
    return _PPSTRUCTURE_ENGINE


def extract_tables_from_image(image, lang):
    import numpy as np
    engine = get_ppstructure_engine(lang)
    arr = np.array(image)
    layout = engine(arr)
    tables = []
    for item in layout or []:
        if str(item.get("type") or "").lower() != "table":
            continue
        res = item.get("res") or {}
        html = res.get("html") if isinstance(res, dict) else ""
        if not html:
            continue
        rows = _parse_html_table_rows(html)
        bbox = item.get("bbox") or []
        tables.append({
            "html": html,
            "rows": rows,
            "headers": rows[0] if rows else [],
            "row_count": max(0, len(rows) - 1),
            "bbox": [int(v) for v in bbox] if bbox else [],
        })
    return tables


def _parse_html_table_rows(html):
    import re
    rows = []
    for row_match in re.finditer(r"<tr[^>]*>(.*?)</tr>", html, flags=re.S | re.I):
        cells = []
        for cell_match in re.finditer(r"<t[dh][^>]*>(.*?)</t[dh]>", row_match.group(1), flags=re.S | re.I):
            text = re.sub(r"<[^>]+>", "", cell_match.group(1))
            text = re.sub(r"\s+", " ", text).strip()
            cells.append(text)
        if cells:
            rows.append(cells)
    return rows


def main():
    if hasattr(sys.stdout, "reconfigure"):
        sys.stdout.reconfigure(encoding="utf-8", errors="replace")
    if hasattr(sys.stderr, "reconfigure"):
        sys.stderr.reconfigure(encoding="utf-8", errors="replace")

    parser = argparse.ArgumentParser()
    parser.add_argument("--input", required=True)
    parser.add_argument("--backend", default="auto")
    parser.add_argument("--lang", default="zh")
    parser.add_argument("--max-pages", type=int, default=4)
    parser.add_argument("--tables", action="store_true", help="Also extract tables via PP-Structure")
    args = parser.parse_args()

    path = Path(args.input)
    suffix = path.suffix.lower()
    result = {"ok": False, "text": "", "backend": args.backend, "kind": "ocr", "pages_used": 0}
    if args.tables:
        result["tables"] = []

    try:
        if suffix == ".pdf":
            direct = extract_pdf_text(path, args.max_pages)
            if len(direct) >= 120:
                result.update({
                    "ok": True,
                    "text": direct[:20000],
                    "backend": "pdf-text",
                    "kind": "pdf_ocr",
                    "pages_used": min(args.max_pages, max(1, direct.count("\n\n") + 1)),
                })
            else:
                texts = []
                used_backend = args.backend
                for image in render_pdf_pages(path, args.max_pages):
                    try:
                        text, used_backend = ocr_image(image, args.backend, args.lang)
                    except Exception as exc:
                        result["error"] = f"page_ocr_failed: {exc}"
                        continue
                    result["pages_used"] += 1
                    if text:
                        texts.append(text)
                full = clean_text("\n\n".join(texts))
                result.update({
                    "ok": bool(full),
                    "text": full[:20000],
                    "backend": used_backend,
                    "kind": "pdf_ocr",
                })

            if args.tables:
                try:
                    for image in render_pdf_pages(path, args.max_pages):
                        result["tables"].extend(extract_tables_from_image(image, args.lang))
                except Exception as exc:
                    result["tables_error"] = f"table_extract_failed: {exc}"
        else:
            image = Image.open(path).convert("RGB")
            text, used_backend = ocr_image(image, args.backend, args.lang)
            result.update({
                "ok": bool(text),
                "text": text[:20000],
                "backend": used_backend,
                "kind": "image_ocr",
                "pages_used": 1,
            })
            if args.tables:
                try:
                    result["tables"].extend(extract_tables_from_image(image, args.lang))
                except Exception as exc:
                    result["tables_error"] = f"table_extract_failed: {exc}"
    except Exception as exc:
        result["error"] = f"ocr_exception: {exc}"

    if not result["ok"] and not result.get("error"):
        result["error"] = "ocr_no_text"

    print(json.dumps(result, ensure_ascii=False))


if __name__ == "__main__":
    main()
