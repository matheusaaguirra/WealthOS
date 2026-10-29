# International discovery — 2026-10-29

## Published surface

The application now has a public learning area with six language-specific hubs and 13 articles, alongside the three existing landing pages. The sitemap contains 22 public URLs. French, German and Italian are content languages; the application interface still supports Portuguese, English and Spanish and records BRL only.

| Language | Hub | Articles |
| --- | --- | --- |
| Portuguese | `/guias` | Monthly expenses; separate balances |
| English | `/en/guides` | Monthly expenses; separate balances; PDF statement review |
| Spanish | `/es/guias` | Monthly expenses; separate balances |
| French | `/fr/guides` | Monthly expenses; separate balances |
| German | `/de/ratgeber` | Monthly expenses; separate balances |
| Italian | `/it/guide` | Monthly expenses; separate balances |

Articles have static HTML, a single H1, a self-referencing canonical, reciprocal hreflang links only to equivalent articles, article/breadcrumb structured data, visible publication dates, an organizational byline and related links. No invented author credentials, reviews or user counts are included. The main landing links to the hubs. Unknown slugs return 404.

The monthly guide includes a browser-local cash-flow calculator with integer-cent arithmetic and display options for USD, EUR and BRL. These options do not change the application's currency support. Changing the calculator currency changes formatting, without conversion. Blank inputs remain editable and no values are persisted or transmitted.

## Measurement

Vercel Analytics previously ran in the Angular application. The public Next.js layouts now include the SDK as well. The public tracker removes query strings and fragments and drops private/auth/API paths. Calculator values are not included in events. Web Analytics is receiving project data; deployment and browser checks are needed to confirm the public script on the new release. This is traffic measurement, not proof of Google ranking or indexation.

## Validation

- Next.js production build, including static generation of all resource routes.
- Full root suite: 118 tests passing, including guide metadata, alternate-link reciprocity, sitemap scope and cent arithmetic/error handling.
- Browser checks and production observations are reported with the release; do not interpret build success as a verified Google crawl.

## Remaining growth work

1. Verify the domain's ownership and actual index status in Google Search Console; submit the updated sitemap and inspect representative pages. This has not been completed by this change.
2. Compare organic search queries and country-level impressions with visits to the relevant guides. Vercel pageviews alone do not supply Google position or indexation data.
3. Share genuinely useful guides in relevant communities and existing profiles with context. No posts, backlinks, ads, paid plans or outreach are created by this release.
4. Improve and extend content based on questions and measured usage, rather than generating near-identical pages for every country or keyword.
5. Assess multi-currency product support separately before marketing the application as a USD/EUR finance tracker. A neutral international domain can be evaluated later; no domain was purchased or migrated.

The `.com.br` domain signals a Brazilian audience; multilingual pages help discovery but do not remove this signal or guarantee international rankings. Indexing, ranking and conversion remain outcomes to measure.

## Primary references

- [Google: managing multi-regional and multilingual sites](https://developers.google.com/search/docs/specialty/international/managing-multi-regional-sites)
- [Google: localized versions](https://developers.google.com/search/docs/specialty/international/localized-versions)
- [Google: people-first content](https://developers.google.com/search/docs/fundamentals/creating-helpful-content)
- [Vercel Web Analytics quickstart](https://vercel.com/docs/analytics/quickstart)
- [CFPB: Your Money, Your Goals tools](https://www.consumerfinance.gov/consumer-tools/educator-tool/your-money-your-goals/toolkit/)
