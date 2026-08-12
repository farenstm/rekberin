from pathlib import Path
from shutil import copy2

from docx import Document
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.oxml import OxmlElement
from docx.oxml.ns import qn
from docx.text.paragraph import Paragraph
from docx.table import Table


SOURCE = Path(r"C:\eescrow\SKRIPSI_REVISI_SUBSTANSI.docx")
OUTPUT = Path(r"C:\eescrow\SKRIPSI_REVISI_CAPTION.docx")

MISSING_CAPTIONS = {
    "Aspek | ERC-20 | ERC-721": "Tabel 2.2 Perbandingan ERC-20 dan ERC-721",
    "Komponen | Implementasi | Keterangan": "Tabel 4.1 Komponen Implementasi Sistem",
    "ID | Skenario | Hasil Aktual | Status": "Tabel 4.2 Hasil Pengujian Smart Contract",
    "Komponen | Metode | Hasil Aktual | Status": "Tabel 4.3 Hasil Pengujian Integrasi",
}


def paragraph_text(element, document):
    return Paragraph(element, document._body).text.strip()


def is_drawing(element):
    return element.tag == qn("w:p") and bool(element.xpath(".//w:drawing|.//w:pict"))


def nearby_caption(elements, index, prefix, direction):
    offsets = (-1, -2, -3) if direction == "before" else (1, 2, 3)
    for offset in offsets:
        target = index + offset
        if target < 0 or target >= len(elements):
            continue
        element = elements[target]
        if element.tag != qn("w:p"):
            continue
        text = paragraph_text(element, document)
        if text.startswith(prefix):
            return element
        if text and not text.startswith(prefix):
            break
    return None


def sibling_caption(element, prefix, direction, allow_blank=False):
    current = element.getprevious() if direction == "before" else element.getnext()
    for _ in range(3):
        if current is None:
            return None
        if current.tag == qn("w:p"):
            text = paragraph_text(current, document)
            if text.startswith(prefix):
                return current
            if text or not allow_blank:
                return None
        elif current.tag == qn("w:tbl"):
            return None
        current = current.getprevious() if direction == "before" else current.getnext()
    return None


def add_caption_before(table_element, text):
    paragraph_element = OxmlElement("w:p")
    table_element.addprevious(paragraph_element)
    paragraph = Paragraph(paragraph_element, document._body)
    paragraph.style = document.styles["Caption"]
    paragraph.alignment = WD_ALIGN_PARAGRAPH.CENTER
    paragraph.add_run(text)


copy2(SOURCE, OUTPUT)
document = Document(OUTPUT)
body = document._body._body

moved_tables = 0
added_tables = 0

for element in list(body):
    if element.tag != qn("w:tbl"):
        continue
    before = sibling_caption(element, "Tabel ", "before")
    after = sibling_caption(element, "Tabel ", "after")

    if before is not None:
        caption = Paragraph(before, document._body)
        caption.style = document.styles["Caption"]
        caption.alignment = WD_ALIGN_PARAGRAPH.CENTER
        continue

    if after is not None:
        element.addprevious(after)
        caption = Paragraph(after, document._body)
        caption.style = document.styles["Caption"]
        caption.alignment = WD_ALIGN_PARAGRAPH.CENTER
        moved_tables += 1
        continue

    table = Table(element, document._body)
    first_row = " | ".join(cell.text.strip() for cell in table.rows[0].cells)
    caption_text = MISSING_CAPTIONS.get(first_row)
    if caption_text:
        add_caption_before(element, caption_text)
        added_tables += 1

moved_images = 0
for element in list(body):
    if not is_drawing(element):
        continue
    before = sibling_caption(element, "Gambar ", "before", allow_blank=True)
    after = sibling_caption(element, "Gambar ", "after", allow_blank=True)

    if before is not None and after is None:
        element.addnext(before)
        caption = Paragraph(before, document._body)
        caption.style = document.styles["Caption"]
        caption.alignment = WD_ALIGN_PARAGRAPH.CENTER
        moved_images += 1
    elif after is not None:
        caption = Paragraph(after, document._body)
        caption.style = document.styles["Caption"]
        caption.alignment = WD_ALIGN_PARAGRAPH.CENTER

document.save(OUTPUT)
print(f"output={OUTPUT}")
print(f"table_captions_moved={moved_tables}")
print(f"table_captions_added={added_tables}")
print(f"image_captions_moved={moved_images}")
