# BE

Reliable product counts:

- Current frontend cannot know a reliable total product count from GraphQL responses.
- Current workaround is response-length inference: 50 results means another page may exist; fewer than 50 means last page.
- This is enough for next/previous navigation but not enough for accurate `333 productos`, `pagina 2 de 7`, filtered result totals, analytics result counts, or SEO summaries.
- Recommended BE improvement is a count-capable product query or metadata field that returns total count for the same filters used by the product list.
- Count behavior should work for unfiltered catalog, name search, category search, brand search, and combined filters if BE supports them.
- A reliable count should come from the backend/source of truth, not from the frontend fetching all pages and counting locally.

Suggested BE contract shape:

- Product list response includes `items` and `pageInfo`/`meta` with `total`, `page`, `pageSize`, `pageCount`, `hasNextPage`, and `hasPreviousPage`.
- If changing the product list response is too large, expose a lightweight count query that accepts the same `ProductFiltersInput`.
- Keep count semantics clear around published/draft state so frontend counts match visible products.

# FE

- Investigate graphql on the server using api from next js
- Change the title and meta description of SEO of the page as the current we have is for the landing.
- Analytics, other than GA4, we can do our own analytics or search analytics tools

## Catalog API follow-up

- Story 1a (`ai-research/plp-catalog-api.story.md`) ships the initial catalog API routes with fixed page sizes (50 for products, 100 for variants) to keep the spike thin and match current server-action behavior.
- Caller-controlled page size with sane bounds is a deliberate follow-up, not part of Story 1a.
- This should be addressed by a later story once the API is in use and we know the realistic upper bounds callers need.
