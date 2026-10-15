import os
import zipfile

def create_docx(filename, content_paragraphs):
    # XML structures for standard docx
    content_types = """<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>
  <Override PartName="/word/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.styles+xml"/>
</Types>"""

    rels = """<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>
</Relationships>"""

    doc_rels = """<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>
</Relationships>"""

    styles = """<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:styles xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:docDefaults>
    <w:rPrDefault>
      <w:rPr>
        <w:rFonts w:ascii="Segoe UI" w:hAnsi="Segoe UI" w:cs="Segoe UI"/>
        <w:sz w:val="22"/>
        <w:szCs w:val="22"/>
      </w:rPr>
    </w:rPrDefault>
  </w:docDefaults>
</w:styles>"""

    # Build document.xml
    body_xml = []
    for item in content_paragraphs:
        p_type = item.get("type", "p")
        text = item.get("text", "")
        # Escape XML entities
        safe_text = text.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")
        
        if p_type == "title":
            body_xml.append(f"""
    <w:p>
      <w:pPr>
        <w:jc w:val="center"/>
        <w:spacing w:before="240" w:after="240"/>
      </w:pPr>
      <w:r>
        <w:rPr>
          <w:b/>
          <w:sz w:val="32"/>
          <w:color w:val="0078D4"/>
        </w:rPr>
        <w:t>{safe_text}</w:t>
      </w:r>
    </w:p>""")
        elif p_type == "heading":
            body_xml.append(f"""
    <w:p>
      <w:pPr>
        <w:spacing w:before="200" w:after="100"/>
      </w:pPr>
      <w:r>
        <w:rPr>
          <w:b/>
          <w:sz w:val="26"/>
          <w:color w:val="2B2B2B"/>
        </w:rPr>
        <w:t>{safe_text}</w:t>
      </w:r>
    </w:p>""")
        elif p_type == "label_value":
            label = item.get("label", "").replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")
            val = item.get("value", "").replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")
            body_xml.append(f"""
    <w:p>
      <w:pPr>
        <w:spacing w:after="60"/>
      </w:pPr>
      <w:r>
        <w:rPr>
          <w:b/>
          <w:color w:val="333333"/>
        </w:rPr>
        <w:t>{label}: </w:t>
      </w:r>
      <w:r>
        <w:rPr>
          <w:color w:val="111111"/>
        </w:rPr>
        <w:t>{val}</w:t>
      </w:r>
    </w:p>""")
        elif p_type == "bullet":
            body_xml.append(f"""
    <w:p>
      <w:pPr>
        <w:ind w:left="360"/>
        <w:spacing w:after="80"/>
      </w:pPr>
      <w:r>
        <w:rPr><w:b/><w:color w:val="0078D4"/></w:rPr>
        <w:t>•  </w:t>
      </w:r>
      <w:r>
        <w:t>{safe_text}</w:t>
      </w:r>
    </w:p>""")
        elif p_type == "italic":
            body_xml.append(f"""
    <w:p>
      <w:pPr>
        <w:spacing w:after="120"/>
      </w:pPr>
      <w:r>
        <w:rPr><w:i/><w:color w:val="555555"/></w:rPr>
        <w:t>{safe_text}</w:t>
      </w:r>
    </w:p>""")
        else:
            body_xml.append(f"""
    <w:p>
      <w:pPr>
        <w:spacing w:after="120"/>
      </w:pPr>
      <w:r>
        <w:t>{safe_text}</w:t>
      </w:r>
    </w:p>""")

    doc_xml = f"""<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:body>
    {"".join(body_xml)}
    <w:sectPr>
      <w:pgSz w:w="12240" w:h="15840"/>
      <w:pgMar w:top="1440" w:right="1440" w:bottom="1440" w:left="1440"/>
    </w:sectPr>
  </w:body>
</w:document>"""

    with zipfile.ZipFile(filename, "w", zipfile.ZIP_DEFLATED) as zf:
        zf.writestr("[Content_Types].xml", content_types)
        zf.writestr("_rels/.rels", rels)
        zf.writestr("word/_rels/document.xml.rels", doc_rels)
        zf.writestr("word/styles.xml", styles)
        zf.writestr("word/document.xml", doc_xml)

    print(f"Successfully generated DOCX at: {filename}")

if __name__ == "__main__":
    content = [
        {"type": "title", "text": "Microsoft Store – Developer Response & Modification Form"},
        {"type": "italic", "text": "I have modified the product to remove the content alleged to be infringing in the infringement complaint provided to me."},
        {"type": "p", "text": "This form is submitted to respond to Content Infringement Complaint (App ID: 9p8lkhftrkks) by electing Option 1: Product Modifications pursuant to Microsoft Store Developer Guidelines."},
        
        {"type": "heading", "text": "Developer Information"},
        {"type": "label_value", "label": "Full Name", "value": "Imamshaffy Bello"},
        {"type": "label_value", "label": "Company Name", "value": "Bimex"},
        {"type": "label_value", "label": "Address", "value": "No 7, lakisan olodo ibadan"},
        {"type": "label_value", "label": "City", "value": "Ibadan"},
        {"type": "label_value", "label": "State/Province", "value": "OYO"},
        {"type": "label_value", "label": "Postal Code", "value": "200111"},
        {"type": "label_value", "label": "Country", "value": "Nigeria"},
        {"type": "label_value", "label": "Phone Number", "value": "08128064110"},
        {"type": "label_value", "label": "E-mail Address", "value": "BELLOIMAM431@GMAIL.COM"},
        {"type": "label_value", "label": "Full Name of Product Removed", "value": "NetSentry (App ID: 9p8lkhftrkks)"},

        {"type": "heading", "text": "Modifications & Response Statement"},
        {"type": "p", "text": "I have disabled access to the product and I have modified the above product to respond to the complaint. I agree that a copy of this notice may be sent to the person who submitted the content infringement complaint. The following describes the changes I have made to respond to and address the claims made in the content infringement complaint:"},

        {"type": "bullet", "text": "1. Immediate Removal of Product Access: Within one business day of receipt, public access to the product was completely disabled and acquisition stopped via the Windows Partner Center Dashboard, as required by Microsoft Store policy."},
        {"type": "bullet", "text": "2. Evidence of Independent Development & Architectural Distinction: Our software was created and authored completely from scratch using an unrelated modern architecture: Tauri 2.0 (Rust) and Next.js / TypeScript / SQLite. In contrast, the complainant's software is built on .NET 8 / WPF and uses an ETW / WFP driver model. Our codebase contains zero shared source code, zero binary assets, and zero intellectual property belonging to the complainant."},
        {"type": "bullet", "text": "3. Permanent Discontinuation of Name & Full Brand Retirement: To prevent any possibility of consumer confusion or trademark disputes, the name 'NetSentry' has been completely and permanently retired. The product has been rebranded to 'NetHelm'. All internal package configurations (tauri.conf.json, Cargo.toml, package.json), window headers, icons, and UI logos have been thoroughly refactored to reflect the new NetHelm brand identity."},
        {"type": "bullet", "text": "4. Complete Overhaul of Store Listing Copy: All marketing text, feature bullets, and product descriptions have been rewritten from scratch with 100% original language focusing on NetHelm's distinctive features (metered hotspot detection, custom daily bandwidth quotas, and per-app firewall toggling). All phrases cited in the complaint have been removed."},
        {"type": "bullet", "text": "5. Firewall Rules & Technical Identifiers: All Windows Firewall rules generated by the software on the local client have been converted from legacy identifiers to the 'NetHelm' namespace (e.g. NetHelm - Block - Out - [App]), with automated cleanup routines for any legacy rules."},

        {"type": "p", "text": "I understand that the product may be permanently removed by Microsoft if the content subject to the content infringement complaint remains visible in the Microsoft Store at any time before I'm notified that the content may be republished."},

        {"type": "heading", "text": "Signature"},
        {"type": "label_value", "label": "Print Name", "value": "Imamshaffy Bello"},
        {"type": "label_value", "label": "Electronic Signature", "value": "Imamshaffy Bello"},
        {"type": "label_value", "label": "Date", "value": "October 14, 2026"}
    ]

    out_dir = r"c:\Users\Bello Imam\Documents\NetSentry\docs"
    os.makedirs(out_dir, exist_ok=True)
    out_file = os.path.join(out_dir, "Modification_Form_Microsoft_Store_NetHelm.docx")
    create_docx(out_file, content)
