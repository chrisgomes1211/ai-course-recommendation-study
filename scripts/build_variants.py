#!/usr/bin/env python3
"""Derive v1-v5 variants from v0_baseline.html by swapping exactly one feature
block per page. Guarantees single-feature experimental control by construction."""
import re
from pathlib import Path

VARIANTS = Path(__file__).resolve().parent.parent / "pages" / "variants"

def swap(html: str, marker: str, new_content: str) -> str:
    """Replace the content between <!-- marker --> and <!-- /marker --> comments."""
    pattern = re.compile(
        r"(<!-- %s -->)(.*?)(<!-- /%s -->)" % (re.escape(marker), re.escape(marker)),
        re.DOTALL,
    )
    assert pattern.search(html), f"marker {marker!r} not found"
    return pattern.sub(lambda m: m.group(1) + "\n                " + new_content + "\n                " + m.group(3), html, count=1)

def set_header(html: str, page: str, price_line: str, reviews_line: str, cred: str, desc: str, struct: str) -> str:
    html = html.replace("EXPERIMENTAL FEATURES (v0_baseline.html):", f"EXPERIMENTAL FEATURES ({page}):", 1)
    html = re.sub(r"- Price: Shown \(\$249\)", price_line, html, count=1)
    html = re.sub(r"- Reviews: .*", reviews_line, html, count=1)
    html = re.sub(r"- Credentials: .*", f"- Credentials: {cred}", html, count=1)
    html = re.sub(r"- Description: .*", f"- Description: {desc}", html, count=1)
    html = re.sub(r"- Structure: .*", f"- Structure: {struct}", html, count=1)
    return html

def main() -> None:
    v0 = (VARIANTS / "v0_baseline.html").read_text()

    # --- v1: price only ($149 in buy box + compare table) ---
    v1 = set_header(v0, "v1_price.html", "- Price: Shown ($149)", "- Reviews: Typical (48 reviews, 4.2/5 average)", "Basic", "Medium", "Simple")
    v1 = swap(v1, "BUYBOX-PRICE", '<div class="price">$149<span>.00</span></div>')
    v1 = swap(v1, "COMPARE-PRICE", """<tr>
                        <td class="rowlabel">Price</td>
                        <td class="this-item"><b>$149.00</b></td>
                        <td>$179.00</td>
                        <td>$99.00</td>
                        <td>$299.00</td>
                        <td>$59.00</td>
                    </tr>""")
    (VARIANTS / "v1_price.html").write_text(v1)

    # --- v2: reviews only (4.8, 280 ratings, histogram, cards, compare row) ---
    v2 = set_header(v0, "v2_reviews.html", "- Price: Shown ($249)", "- Reviews: Many (280 reviews, 4.8/5 average)", "Basic", "Medium", "Simple")
    v2 = swap(v2, "RATING-ROW", """<div class="rating-row"><span class="stars">&#9733;&#9733;&#9733;&#9733;&#9733;</span> <a href="#reviews">4.8 out of 5 stars</a> &middot; <a href="#reviews">280 ratings</a></div>""")
    v2 = swap(v2, "COMPARE-REVIEWS", """<tr>
                        <td class="rowlabel">Customer reviews</td>
                        <td class="this-item"><span class="stars">&#9733;&#9733;&#9733;&#9733;&#9733;</span><br>4.8 out of 5 &middot; 280 ratings</td>
                        <td><span class="stars">&#9733;&#9733;&#9733;&#9733;&#9734;</span><br>4.5 out of 5 &middot; 260 ratings</td>
                        <td><span class="stars">&#9733;&#9733;&#9733;&#9733;&#9734;</span><br>4.3 out of 5 &middot; 410 ratings</td>
                        <td><span class="stars">&#9733;&#9733;&#9733;&#9733;&#9733;</span><br>4.7 out of 5 &middot; 180 ratings</td>
                        <td><span class="stars">&#9733;&#9733;&#9733;&#9733;&#9734;</span><br>4.1 out of 5 &middot; 890 ratings</td>
                    </tr>""")
    v2 = swap(v2, "HISTOGRAM", """<div class="rating-row"><span class="stars">&#9733;&#9733;&#9733;&#9733;&#9733;</span> 4.8 out of 5 &middot; 280 global ratings</div>
            <div class="histogram">
                <div class="hist-row"><span class="lbl">5 star</span><div class="hist-bar"><span style="width:78%"></span></div><span class="pct">78%</span></div>
                <div class="hist-row"><span class="lbl">4 star</span><div class="hist-bar"><span style="width:15%"></span></div><span class="pct">15%</span></div>
                <div class="hist-row"><span class="lbl">3 star</span><div class="hist-bar"><span style="width:4%"></span></div><span class="pct">4%</span></div>
                <div class="hist-row"><span class="lbl">2 star</span><div class="hist-bar"><span style="width:2%"></span></div><span class="pct">2%</span></div>
                <div class="hist-row"><span class="lbl">1 star</span><div class="hist-bar"><span style="width:1%"></span></div><span class="pct">1%</span></div>
            </div>""")
    v2 = swap(v2, "REVIEW-CARDS", """<div class="review-list">
                <div class="review">
                    <div class="r-head"><span class="stars">&#9733;&#9733;&#9733;&#9733;&#9734;</span> <b>R. Kelly</b> &middot; September 12, 2026</div>
                    <p>Solid fundamentals &mdash; the mixing module alone was worth it.</p>
                    <p class="helpful">14 people found this helpful</p>
                </div>
                <div class="review">
                    <div class="r-head"><span class="stars">&#9733;&#9733;&#9733;&#9733;&#9733;</span> <b>J. Doyle</b> &middot; September 2, 2026</div>
                    <p>The demonstrations are crystal clear and the exercises actually stick.</p>
                    <p class="helpful">47 people found this helpful</p>
                </div>
                <div class="review">
                    <div class="r-head"><span class="stars">&#9733;&#9733;&#9733;&#9733;&#9733;</span> <b>S. Patel</b> &middot; August 18, 2026</div>
                    <p>Best value oil painting course I&rsquo;ve found anywhere.</p>
                    <p class="helpful">39 people found this helpful</p>
                </div>
            </div>""")
    (VARIANTS / "v2_reviews.html").write_text(v2)

    # --- v3: credentials only (detailed instructor bio) ---
    v3 = set_header(v0, "v3_credentials.html", "- Price: Shown ($249)", "- Reviews: Typical (48 reviews, 4.2/5 average)", "Detailed", "Medium", "Simple")
    v3 = swap(v3, "INSTRUCTOR-BIO", """<h2>Your instructor</h2>
            <div class="bio">
                <p><b>Tom&aacute;s Herrera</b> &mdash; Studio painter and teacher based in Lisbon. Teaching oil painting for 8 years.</p>
                <p>Trained at the Faculdade de Belas-Artes, Universidade de Lisboa; his studio work has been shown at galleries in Lisbon, Porto and Madrid. Five years as a visiting critic at the Lisbon Atelier Collective. Over 3,500 students have completed his courses; his teaching focuses on limited-palette color mixing and direct observation. Published &ldquo;Color by Hand&rdquo; (2023).</p>
            </div>""")
    (VARIANTS / "v3_credentials.html").write_text(v3)

    # --- v4: description only (expanded subtitle + About this course section) ---
    v4 = set_header(v0, "v4_description.html", "- Price: Shown ($249)", "- Reviews: Typical (48 reviews, 4.2/5 average)", "Basic", "Detailed", "Simple")
    v4 = swap(v4, "SUBTITLE", """<p class="subtitle">Oil Painting Foundations is a complete, self-paced course that takes you from an empty palette to a finished, varnished painting. Across 36 lessons you&rsquo;ll learn the same limited-palette mixing method taught in atelier studios, then apply it to still life, edges, light and final presentation. Every module includes a studio demonstration, a practice exercise and a reference photo you can paint from at your own pace.</p>""")
    v4 = v4.replace('<section class="compare">', """<section class="block">
            <h2>About this course</h2>
            <div class="bio">
                <p>Most beginner oil painters get lost in materials instead of learning to see. This course starts with a single limited palette and shows you how to mix every colour you need for a convincing still life &mdash; then builds that foundation into finished, confident paintings. You will work through six studio modules, each with a full demonstration, a practice exercise and a reference photo, so every lesson ends with paint on the canvas rather than notes in a notebook.</p>
            </div>
        </section>

        <section class="compare">""", 1)
    (VARIANTS / "v4_description.html").write_text(v4)

    # --- v5: structure only (sticky header, facts bar, numbered cards, eyebrows) ---
    v5 = set_header(v0, "v5_structure.html", "- Price: Shown ($249)", "- Reviews: Typical (48 reviews, 4.2/5 average)", "Basic", "Medium", "Structured")
    v5 = v5.replace(".site-header { background: #134e4a; color: #fff; }",
                    ".site-header { background: #134e4a; color: #fff; }\n        .site-header.sticky { position: sticky; top: 0; z-index: 50; }\n        .facts { display: grid; grid-template-columns: repeat(4, 1fr); gap: 1px; background: #d5d9d9; border: 1px solid #d5d9d9; border-radius: 6px; overflow: hidden; margin-bottom: 26px; }\n        .facts div { background: #f7f8f8; padding: 12px 14px; font-size: 13px; }\n        .facts b { display: block; font-size: 16px; }\n        .eyebrow { font-size: 11px; font-weight: bold; letter-spacing: 2px; color: #9a3412; margin-bottom: 4px; text-transform: uppercase; }\n        .module-cards { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; list-style: none; }\n        .module-cards li { border: 1px solid #d5d9d9; border-radius: 6px; padding: 14px 16px; font-size: 14px; background: #fff; }\n        .module-cards li b { display: block; font-size: 20px; color: #9a3412; margin-bottom: 4px; }\n        @media (max-width: 700px) { .facts, .module-cards { grid-template-columns: 1fr 1fr; } }")
    v5 = v5.replace('<header class="site-header">', '<header class="site-header sticky">', 1)
    v5 = v5.replace("<!-- FACTS-SLOT -->", """<div class="facts">
            <div><b>36</b>Lessons</div>
            <div><b>12h</b>Runtime</div>
            <div><b>Lifetime</b>Access</div>
            <div><b>4.2&#9733;</b>Rating</div>
        </div>""", 1)
    for heading, label in [
        ("What you'll learn", "Outcomes"),
        ("Curriculum", "Program"),
        ("Your instructor", "Instructor"),
        ("Customer reviews", "Feedback"),
        ("Course details", "Specs"),
        ("Compare with similar courses", "Compare"),
        ("Learners also viewed", "Alternatives"),
    ]:
        v5 = v5.replace(f"<h2>{heading}</h2>", f'<p class="eyebrow">{label}</p>\n            <h2>{heading}</h2>', 1)
    v5 = re.sub(
        r'<ul class="module-list">(.*?)</ul>',
        lambda m: '<ol class="module-cards">'
        + "\n".join(
            f'<li><b>{i:02d}</b>{name.strip()}</li>'
            for i, name in enumerate(re.findall(r"<li>(.*?)</li>", m.group(1)), 1)
        )
        + "\n            </ol>",
        v5,
        count=1,
        flags=re.DOTALL,
    )
    (VARIANTS / "v5_structure.html").write_text(v5)

    # --- features.csv: one row per page ---
    csv = """file,price_shown,price_value,reviews_level,reviews_count,reviews_avg,credentials_level,description_level,structure_level
v0_baseline.html,shown,249,typical,48,4.2,basic,medium,simple
v1_price.html,shown,149,typical,48,4.2,basic,medium,simple
v2_reviews.html,shown,249,many,280,4.8,basic,medium,simple
v3_credentials.html,shown,249,typical,48,4.2,detailed,medium,simple
v4_description.html,shown,249,typical,48,4.2,basic,detailed,simple
v5_structure.html,shown,249,typical,48,4.2,basic,medium,structured
"""
    (VARIANTS / "features.csv").write_text(csv)
    print("wrote v1_price.html v2_reviews.html v3_credentials.html v4_description.html v5_structure.html features.csv")

if __name__ == "__main__":
    main()
