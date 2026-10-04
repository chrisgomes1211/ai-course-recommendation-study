# Real Page Fetching Guidelines

## Legal Compliance

### Before You Scrape
- **Check `robots.txt`**: Visit `https://example.com/robots.txt` and respect `Disallow` rules
- **Read Terms of Service**: Look for "scraping", "automated access", "data mining" clauses
- **Check for APIs**: Many platforms (Udemy, Coursera, Teachable) offer official APIs — prefer those

### Common Platform Policies
| Platform | Policy | Notes |
|----------|--------|-------|
| Udemy | No scraping without permission | Official API available |
| Coursera | No scraping | Official API for partners |
| edX | Check robots.txt | Limited public data |
| Skillshare | No scraping | No public API |
| Teachable | No scraping | API for school owners |
| Independent sites | Often OK if polite | Check individually |

## Ethical Scraping Practices

### Rate Limiting
- **Minimum**: 1 request/second per domain
- **Recommended**: 2-5 seconds between requests
- Respect `Retry-After` headers (HTTP 429)
- Respect `Crawl-delay` in robots.txt

### Identification
```python
headers = {
    "User-Agent": "Mozilla/5.0 (compatible; ResearchBot/1.0; +https://github.com/yourrepo)"
}
```
- Include contact info in User-Agent
- Identify as research bot
- Link to project repo

### Caching
- Cache responses locally (this repo saves to `pages/`)
- Don't re-fetch unchanged pages
- Use conditional requests (`If-Modified-Since`, `ETag`)

## Legal Risks

### Computer Fraud and Abuse Act (CFAA) - US
- Unauthorized access to "protected computers" can be criminal
- Courts split on whether violating ToS = "unauthorized access"
- *hiQ Labs v. LinkedIn*: Public data scraping may be protected

### GDPR - EU
- Personal data in reviews/ratings requires lawful basis
- Anonymize or exclude personal data
- Document lawful basis (legitimate interest for research)

### Copyright
- HTML content is copyrighted
- Fair use may apply for research (transformative, non-commercial)
- Don't redistribute raw HTML publicly

## Experiment Validity vs. Real Data

### For Controlled Experiments (Recommended)
- **Use fictional pages** (current approach)
- Perfect feature control
- Reproducible, no legal risk
- Clean causal inference

### For Validation Studies
- Freeze real pages at experiment start
- Commit HTML snapshots to git
- Document snapshot date in results metadata
- Note: Real pages change, breaking feature control

## Recommended Workflow

### For Your Thesis/Experiment
1. **Default**: Use fictional pages (`pages/*.html`)
2. **Optional validation**: Run subset with real pages
3. **Document**: "Primary results from controlled fictional pages; validation with real pages showed similar patterns"

### For Demos/Stakeholders
- Use `scripts/refresh_pages.py` to update
- Weekly auto-refresh via GitHub Action
- Clearly label: "Demo data from live sources (refreshed weekly)"

## Quick Checklist Before Enabling Live Fetch

- [ ] Verified robots.txt allows scraping target pages
- [ ] Terms of Service don't explicitly prohibit
- [ ] No login required (or have permission)
- [ ] No personal data in scraped content
- [ ] Rate limiting implemented (1+ sec delays)
- [ ] User-Agent identifies as research bot
- [ ] Caching implemented (this repo saves to `pages/`)
- [ ] Error handling for blocked/changed pages
- [ ] Documentation of snapshot dates in results

## When in Doubt
**Default to fictional pages.** They're designed for your experiment's specific feature comparisons and eliminate all legal/ethical ambiguity.