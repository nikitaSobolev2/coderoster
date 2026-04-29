/** `/courses` filter URL for catalog categories — shared header + drawer links. */
export function courseCategoryHref(slug: string): string {
  return `/courses?category=${encodeURIComponent(slug)}`
}
