import os
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
from docx import Document
import os

template = os.path.join(ROOT, 'SAMPLE FINAL', 'FINAL TEMPLATE.docx')
out = os.path.join(ROOT, 'tmp_local.docx')
if not os.path.exists(template):
    print('template missing')
    raise SystemExit(1)

doc = Document(template)
print('Sections before:', len(doc.sections))
# Append vetting
try:
    doc.add_page_break()
except Exception:
    pass
p = doc.add_paragraph('VETTING TEST: This is a test')
# Append output
try:
    doc.add_page_break()
except Exception:
    pass
p2 = doc.add_paragraph('OUTPUT TEST: This is a test')

doc.save(out)
print('Saved', out)
