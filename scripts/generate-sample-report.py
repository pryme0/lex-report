"""Generate the illustrative LexReport sample report used by the landing page."""

from pathlib import Path
from shutil import copyfile

import fitz
from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER, TA_JUSTIFY, TA_LEFT
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import mm
from reportlab.platypus import (
    BaseDocTemplate,
    Frame,
    KeepTogether,
    PageBreak,
    PageTemplate,
    Paragraph,
    Spacer,
    Table,
    TableStyle,
)
from pypdf import PdfReader


ROOT = Path(__file__).resolve().parents[1]
OUTPUT = ROOT / "output" / "pdf" / "lexreport-sample-report.pdf"
PUBLIC = ROOT / "public" / "sample" / "lexreport-sample-report.pdf"
RENDER_DIR = ROOT / "tmp" / "pdfs" / "lexreport-sample-report"

GREEN = colors.HexColor("#0B2116")
MID_GREEN = colors.HexColor("#226040")
BRASS = colors.HexColor("#9B6A24")
INK = colors.HexColor("#142119")
BODY = colors.HexColor("#48534C")
MUTED = colors.HexColor("#7B847E")
PAPER = colors.HexColor("#F7F4ED")
LINE = colors.HexColor("#DCD8CC")
PALE_GREEN = colors.HexColor("#E8F5EE")
PALE_BRASS = colors.HexColor("#FAF2E4")


class ReportDocTemplate(BaseDocTemplate):
    def __init__(self, filename: str):
        super().__init__(
            filename,
            pagesize=A4,
            leftMargin=23 * mm,
            rightMargin=23 * mm,
            topMargin=24 * mm,
            bottomMargin=21 * mm,
            title="LexReport Illustrative Sample Report",
            author="LexReport",
            subject="Demonstration of a structured verified law report",
        )
        frame = Frame(self.leftMargin, self.bottomMargin, self.width, self.height, id="body")
        self.addPageTemplates(PageTemplate(id="report", frames=frame, onPage=self._decorate_page))

    def _decorate_page(self, canvas, doc):
        width, height = A4
        canvas.saveState()
        canvas.setFillColor(GREEN)
        canvas.rect(0, height - 7 * mm, width, 7 * mm, fill=1, stroke=0)
        canvas.setFont("Helvetica-Bold", 7)
        canvas.setFillColor(MUTED)
        canvas.drawString(23 * mm, 11 * mm, "LEXREPORT - ILLUSTRATIVE SAMPLE")
        canvas.drawRightString(width - 23 * mm, 11 * mm, f"PAGE {doc.page}")
        canvas.setStrokeColor(LINE)
        canvas.line(23 * mm, 16 * mm, width - 23 * mm, 16 * mm)
        canvas.restoreState()


styles = getSampleStyleSheet()
styles.add(ParagraphStyle(name="Kicker", fontName="Helvetica-Bold", fontSize=7.5, leading=10, textColor=BRASS, spaceAfter=9, uppercase=True, letterSpacing=1.2))
styles.add(ParagraphStyle(name="Display", fontName="Times-Bold", fontSize=28, leading=29, textColor=INK, spaceAfter=13))
styles.add(ParagraphStyle(name="Deck", fontName="Helvetica", fontSize=10.5, leading=16, textColor=BODY, spaceAfter=16))
styles.add(ParagraphStyle(name="Section", fontName="Times-Bold", fontSize=17, leading=20, textColor=INK, spaceBefore=6, spaceAfter=11))
styles.add(ParagraphStyle(name="Subsection", fontName="Helvetica-Bold", fontSize=8, leading=11, textColor=MID_GREEN, spaceBefore=10, spaceAfter=5, uppercase=True, letterSpacing=0.8))
styles.add(ParagraphStyle(name="BodyLegal", fontName="Times-Roman", fontSize=9.6, leading=15, textColor=BODY, alignment=TA_JUSTIFY, spaceAfter=9))
styles.add(ParagraphStyle(name="Small", fontName="Helvetica", fontSize=7.3, leading=11, textColor=MUTED))
styles.add(ParagraphStyle(name="CoverBrand", fontName="Times-BoldItalic", fontSize=17, leading=20, textColor=colors.white, alignment=TA_CENTER))
styles.add(ParagraphStyle(name="CoverTitle", fontName="Times-Bold", fontSize=31, leading=33, textColor=INK, alignment=TA_CENTER, spaceAfter=12))
styles.add(ParagraphStyle(name="CoverMeta", fontName="Helvetica-Bold", fontSize=7.4, leading=11, textColor=BRASS, alignment=TA_CENTER, uppercase=True, letterSpacing=1.1))
styles.add(ParagraphStyle(name="Quote", fontName="Times-Italic", fontSize=11.5, leading=18, textColor=INK, leftIndent=14, rightIndent=14, borderColor=BRASS, borderWidth=0, borderPadding=10, backColor=PALE_BRASS, spaceAfter=12))


def pill(text: str, background, foreground=INK):
    table = Table([[Paragraph(text, ParagraphStyle(name=f"pill-{text}", fontName="Helvetica-Bold", fontSize=6.6, leading=9, textColor=foreground))]], hAlign="LEFT")
    table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, -1), background),
        ("BOX", (0, 0), (-1, -1), 0.5, LINE),
        ("LEFTPADDING", (0, 0), (-1, -1), 7),
        ("RIGHTPADDING", (0, 0), (-1, -1), 7),
        ("TOPPADDING", (0, 0), (-1, -1), 4),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
    ]))
    return table


def info_table(rows):
    data = [[Paragraph(label, styles["Subsection"]), Paragraph(value, styles["BodyLegal"])] for label, value in rows]
    table = Table(data, colWidths=[34 * mm, 108 * mm], hAlign="LEFT")
    table.setStyle(TableStyle([
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("LINEBELOW", (0, 0), (-1, -1), 0.45, LINE),
        ("LEFTPADDING", (0, 0), (-1, -1), 0),
        ("RIGHTPADDING", (0, 0), (-1, -1), 6),
        ("TOPPADDING", (0, 0), (-1, -1), 4),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
    ]))
    return table


def build_story():
    story = []

    brand = Table([[Paragraph("Lr", styles["CoverBrand"])]], colWidths=[34 * mm], rowHeights=[34 * mm], hAlign="CENTER")
    brand.setStyle(TableStyle([("BACKGROUND", (0, 0), (-1, -1), GREEN), ("BOX", (0, 0), (-1, -1), 0, GREEN), ("VALIGN", (0, 0), (-1, -1), "MIDDLE")]))
    story += [Spacer(1, 18 * mm), brand, Spacer(1, 13 * mm)]
    story += [Paragraph("LEXREPORT", styles["CoverMeta"]), Spacer(1, 7 * mm)]
    story += [Paragraph("A verified law report,<br/>structured for practice.", styles["CoverTitle"])]
    story += [Paragraph("Illustrative sample - not a reported decision", styles["CoverMeta"]), Spacer(1, 16 * mm)]
    cover_rule = Table([["", "", ""]], colWidths=[45 * mm, 20 * mm, 45 * mm], rowHeights=[1])
    cover_rule.setStyle(TableStyle([("BACKGROUND", (0, 0), (0, 0), LINE), ("BACKGROUND", (1, 0), (1, 0), BRASS), ("BACKGROUND", (2, 0), (2, 0), LINE)]))
    story += [cover_rule, Spacer(1, 13 * mm)]
    story += [Paragraph("Inside this sample", styles["Subsection"])]
    story += [Paragraph("Headnote and issues - holding and ratio - authorities considered - subsequent citation treatment - editorial verification record", ParagraphStyle(name="CoverList", parent=styles["Deck"], alignment=TA_CENTER, fontSize=9, leading=15))]
    story += [PageBreak()]

    story += [Paragraph("ILLUSTRATIVE SUPREME COURT REPORT", styles["Kicker"])]
    story += [Paragraph("Zenith Trustees Ltd v. Adebayo &amp; Sons Holdings", styles["Display"])]
    story += [Table([[pill("(2026) ELR-000001 (SC)", PALE_GREEN, MID_GREEN), pill("VERIFIED SAMPLE", PALE_BRASS, BRASS), pill("COMMERCIAL LAW", PAPER)]], colWidths=[52 * mm, 42 * mm, 42 * mm], hAlign="LEFT", style=[("VALIGN", (0, 0), (-1, -1), "TOP"), ("LEFTPADDING", (0, 0), (-1, -1), 0), ("RIGHTPADDING", (0, 0), (-1, -1), 5)]), Spacer(1, 7 * mm)]
    story += [info_table([
        ("COURT", "Supreme Court of Nigeria"),
        ("CORAM", "Okoro, Agim, Jauro, Abubakar and Idris JJSC"),
        ("DATE", "10 August 2026"),
        ("SUBJECT", "Company law - security - priority - floating charge - crystallisation"),
    ]), Spacer(1, 7 * mm)]
    story += [Paragraph("Headnote", styles["Section"])]
    story += [Paragraph("The appellant bank held a floating charge over the assets of a trading company. Before enforcement, the company disposed of identified inventory to the respondent purchaser. The bank contended that a default notice had crystallised the charge before the disposition and that the purchaser therefore acquired no priority. The trial court dismissed the claim. The Court of Appeal affirmed that decision. The bank appealed.", styles["BodyLegal"])]
    story += [Paragraph("Issues", styles["Subsection"])]
    story += [Paragraph("1. Whether the contractual events relied upon by the bank were sufficient to crystallise the floating charge before the disposition.<br/>2. Whether the purchaser took the assets free of the charge where it had no actual notice of crystallisation.<br/>3. Whether the reliefs sought could be granted without proof identifying the charged assets at the relevant date.", styles["BodyLegal"])]
    story += [Paragraph("Held", styles["Subsection"])]
    story += [Paragraph("Dismissing the appeal, the court held that the bank had not proved a crystallising event effective before the disposition. Until crystallisation, the company retained authority to deal with its circulating assets in the ordinary course of business. The purchaser therefore acquired title free of the floating charge.", styles["BodyLegal"])]
    story += [PageBreak()]

    story += [Paragraph("RATIO AND REASONS", styles["Kicker"])]
    story += [Paragraph("The rule extracted from the judgment", styles["Display"])]
    story += [Paragraph("A floating charge does not become a fixed security merely because the instrument identifies events of default. The creditor relying on crystallisation must prove that the relevant event occurred, that any contractual step required to make it effective was completed and that this happened before the challenged dealing.", styles["Quote"])]
    story += [Paragraph("Reasoning", styles["Section"])]
    story += [Paragraph("The commercial purpose of a floating charge is to permit the chargor to continue dealing with circulating assets until the security becomes fixed. A court should not infer crystallisation from commercial difficulty alone. The instrument, the alleged triggering event and the evidence of notice must be read together.", styles["BodyLegal"])]
    story += [Paragraph("The appellant proved that a payment default had occurred, but the instrument required written notice declaring the charge crystallised. The notice tendered in evidence post-dated the sale to the respondent. The sale was therefore completed while the charge remained floating.", styles["BodyLegal"])]
    story += [Paragraph("Selected authorities", styles["Section"])]
    authorities = [
        ["Authority", "Treatment", "Proposition"],
        ["Re Brightlife Ltd", "Applied", "Effect of an automatic crystallisation clause"],
        ["Agnew v. CIR", "Considered", "Distinction between fixed and floating security"],
        ["Owoniboys Technical Services Ltd v. UBN Ltd", "Distinguished", "Proof and enforcement of secured obligations"],
    ]
    auth_table = Table(authorities, colWidths=[50 * mm, 28 * mm, 64 * mm], repeatRows=1)
    auth_table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), GREEN),
        ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
        ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
        ("FONTNAME", (0, 1), (-1, -1), "Times-Roman"),
        ("FONTSIZE", (0, 0), (-1, -1), 7.2),
        ("LEADING", (0, 0), (-1, -1), 10),
        ("GRID", (0, 0), (-1, -1), 0.45, LINE),
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, PAPER]),
        ("LEFTPADDING", (0, 0), (-1, -1), 7),
        ("RIGHTPADDING", (0, 0), (-1, -1), 7),
        ("TOPPADDING", (0, 0), (-1, -1), 7),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 7),
    ]))
    story += [auth_table, Spacer(1, 7 * mm)]
    story += [Paragraph("Counsel", styles["Subsection"]), Paragraph("I. Okafor SAN with R. Yusuf for the appellant. T. Adebayo with L. Ekanem for the respondents.", styles["BodyLegal"])]
    story += [PageBreak()]

    story += [Paragraph("CITATION TREATMENT", styles["Kicker"])]
    story += [Paragraph("How later courts used the proposition", styles["Display"])]
    treatment_rows = [
        ["2026", "ORIGIN", "Zenith Trustees Ltd v. Adebayo & Sons Holdings", "Rule stated"],
        ["2027", "FOLLOWED", "First Atlantic Bank Ltd v. Mariner Foods Ltd", "Notice requirement applied"],
        ["2028", "DISTINGUISHED", "Unity Finance Plc v. Okocha", "Instrument contained automatic crystallisation"],
        ["2030", "FOLLOWED", "Nigerian Export Bank v. Kalu Industries", "Timing of notice treated as decisive"],
    ]
    treatment = Table(treatment_rows, colWidths=[18 * mm, 28 * mm, 66 * mm, 30 * mm])
    treatment.setStyle(TableStyle([
        ("LINEBELOW", (0, 0), (-1, -1), 0.5, LINE),
        ("FONTNAME", (0, 0), (1, -1), "Helvetica-Bold"),
        ("FONTNAME", (2, 0), (-1, -1), "Times-Roman"),
        ("FONTSIZE", (0, 0), (-1, -1), 7.5),
        ("TEXTCOLOR", (0, 0), (0, -1), MUTED),
        ("TEXTCOLOR", (1, 0), (1, -1), MID_GREEN),
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("TOPPADDING", (0, 0), (-1, -1), 10),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 10),
    ]))
    story += [treatment, Spacer(1, 10 * mm)]
    story += [Paragraph("Editorial verification record", styles["Section"])]
    verification = [
        ("SOURCE CHECKED", "Court, panel, date and judgment identity confirmed against the source record."),
        ("HEADNOTE REVIEWED", "Facts, issues and holding cross-checked against the reasons for judgment."),
        ("RATIO VERIFIED", "The extracted proposition reviewed for fidelity and level of generality."),
        ("TREATMENT LINKED", "Subsequent authorities classified by the way each court used the proposition."),
    ]
    for label, text in verification:
        story.append(KeepTogether([Paragraph(label, styles["Subsection"]), Paragraph(text, styles["BodyLegal"])]))
    story += [Spacer(1, 5 * mm), Paragraph("This document is a product demonstration. The case name, citation, facts and later treatments are fictional and must not be cited as legal authority.", ParagraphStyle(name="Disclaimer", parent=styles["Small"], backColor=PALE_BRASS, borderColor=BRASS, borderWidth=0.5, borderPadding=9, textColor=INK))]
    return story


def render_for_review(pdf_path: Path):
    RENDER_DIR.mkdir(parents=True, exist_ok=True)
    document = fitz.open(pdf_path)
    for index, page in enumerate(document):
        pixmap = page.get_pixmap(matrix=fitz.Matrix(1.5, 1.5), alpha=False)
        pixmap.save(RENDER_DIR / f"page-{index + 1}.png")
    return len(document)


def main():
    OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    PUBLIC.parent.mkdir(parents=True, exist_ok=True)
    document = ReportDocTemplate(str(OUTPUT))
    document.build(build_story())
    copyfile(OUTPUT, PUBLIC)

    reader = PdfReader(str(OUTPUT))
    if len(reader.pages) != 4:
        raise RuntimeError(f"Expected 4 pages, got {len(reader.pages)}")
    if reader.metadata.title != "LexReport Illustrative Sample Report":
        raise RuntimeError("PDF metadata title is missing")
    rendered_pages = render_for_review(OUTPUT)
    print(f"Created {OUTPUT} ({rendered_pages} pages)")
    print(f"Published copy {PUBLIC}")
    print(f"Rendered review pages {RENDER_DIR}")


if __name__ == "__main__":
    main()
