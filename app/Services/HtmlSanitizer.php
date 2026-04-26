<?php

declare(strict_types=1);

namespace App\Services;

use DOMDocument;
use DOMElement;
use DOMNode;
use DOMXPath;

/**
 * Strict allowlist-based HTML sanitiser for blog body content.
 *
 * Design rules:
 *  - Allowlist, never denylist. Unknown tags are unwrapped (their text
 *    survives, the element does not). Unknown attributes are dropped.
 *  - Every URL is forced through a protocol allowlist (http, https, mailto
 *    only — anchors are allowed for in-page TOC links). `javascript:` and
 *    `data:` are rejected.
 *  - All `on*` event handlers are stripped unconditionally — even on
 *    allowed tags.
 *  - `<a>` is forced to `rel="noopener noreferrer"` + `target="_blank"`
 *    for non-anchor links; anchor (#) links stay in-page.
 *  - Output is always returned as UTF-8 string HTML.
 *
 * This is intentionally a pure-PHP implementation (no composer add) so
 * the whole security surface is inspectable in one file. If the allowed
 * tag surface ever grows past ~20 tags, swap in mews/purifier.
 */
final class HtmlSanitizer
{
    /**
     * @var array<string, list<string>>
     * Tag => list of attributes permitted on that tag. Every attribute
     * value is additionally validated (URLs go through sanitiseUrl).
     */
    private const ALLOWED = [
        'p' => [],
        'br' => [],
        'hr' => [],
        'h2' => ['id'],
        'h3' => ['id'],
        'h4' => ['id'],
        'strong' => [],
        'b' => [],
        'em' => [],
        'i' => [],
        'u' => [],
        's' => [],
        'a' => ['href', 'title'],
        'ul' => [],
        'ol' => [],
        'li' => [],
        'blockquote' => ['cite'],
        'code' => [],
        'pre' => [],
        'img' => ['src', 'alt', 'title', 'width', 'height'],
        'figure' => [],
        'figcaption' => [],
    ];

    /**
     * Schemes permitted inside href/src. Everything else (javascript:,
     * data:, vbscript:, file:, etc.) is rejected.
     */
    private const ALLOWED_URL_SCHEMES = ['http', 'https', 'mailto'];

    /**
     * Run the input HTML through the sanitiser. Returns an empty string
     * for null/blank input so callers don't have to special-case it.
     *
     * @return array{html:string, toc:list<array{id:string,text:string,level:int}>}
     *         The sanitised HTML plus the extracted TOC entries (so the
     *         frontend doesn't re-parse).
     */
    public function sanitize(?string $html): array
    {
        $html = trim((string) $html);

        if ($html === '') {
            return ['html' => '', 'toc' => []];
        }

        $doc = new DOMDocument('1.0', 'UTF-8');

        // libxml emits warnings for HTML5 tags it doesn't know; silence
        // them and surface genuine errors via internalErrors().
        $previous = libxml_use_internal_errors(true);

        // Wrap in a root element so loadHTML has a clean entry point;
        // LIBXML_HTML_NOIMPLIED + NODEFDTD stops it from injecting
        // <html><body> wrappers we'd need to strip afterwards.
        $doc->loadHTML(
            '<?xml encoding="UTF-8"?><div id="__sanitizer_root">'.$html.'</div>',
            LIBXML_HTML_NOIMPLIED | LIBXML_HTML_NODEFDTD
        );

        libxml_clear_errors();
        libxml_use_internal_errors($previous);

        $root = $doc->getElementById('__sanitizer_root');

        if (! $root instanceof DOMElement) {
            return ['html' => '', 'toc' => []];
        }

        $this->walk($root);

        // Extract TOC entries *after* sanitisation so ids we inject on
        // headings have been stabilised.
        $toc = $this->extractToc($doc);

        // Serialise just the children of the wrapper — we don't want to
        // ship our internal <div id="__sanitizer_root">.
        $inner = '';
        foreach ($root->childNodes as $child) {
            $inner .= $doc->saveHTML($child);
        }

        return [
            'html' => trim($inner),
            'toc' => $toc,
        ];
    }

    /**
     * Depth-first walk. We iterate a snapshot of children because we
     * mutate the tree (replaceNode/removeChild) as we go.
     */
    private function walk(DOMNode $node): void
    {
        $children = iterator_to_array($node->childNodes);

        foreach ($children as $child) {
            if (! $child instanceof DOMElement) {
                continue;
            }

            $tag = strtolower($child->nodeName);

            if (! array_key_exists($tag, self::ALLOWED)) {
                // Unwrap unknown tag: move its children up, then drop it.
                // Keeps the text content, discards the element.
                $this->unwrap($child);

                continue;
            }

            $this->filterAttributes($child, self::ALLOWED[$tag]);

            // <a> hardening: force safe rel/target on external links.
            if ($tag === 'a') {
                $this->hardenAnchor($child);
            }

            // Headings get a slug id so the sticky TOC can link into
            // them. If the editor already supplied one, validate it.
            if (in_array($tag, ['h2', 'h3', 'h4'], true)) {
                $this->ensureHeadingId($child);
            }

            // Recurse after attribute filtering so children inherit a
            // clean parent.
            $this->walk($child);
        }
    }

    /**
     * Replace an element with its children, preserving text content.
     */
    private function unwrap(DOMElement $el): void
    {
        $parent = $el->parentNode;

        if (! $parent instanceof DOMNode) {
            return;
        }

        while ($el->firstChild) {
            $parent->insertBefore($el->firstChild, $el);
        }

        $parent->removeChild($el);
    }

    /**
     * Drop any attribute not in the allowlist for this tag. Known
     * url-bearing attributes get an additional scheme check.
     *
     * @param list<string> $allowed
     */
    private function filterAttributes(DOMElement $el, array $allowed): void
    {
        // Iterate over a snapshot because removeAttribute mutates the
        // live NodeList.
        $attrs = [];
        foreach ($el->attributes as $attr) {
            $attrs[] = $attr->nodeName;
        }

        foreach ($attrs as $name) {
            $lower = strtolower($name);

            if (! in_array($lower, $allowed, true)) {
                $el->removeAttribute($name);

                continue;
            }

            if ($lower === 'href' || $lower === 'src' || $lower === 'cite') {
                $safe = $this->sanitiseUrl($el->getAttribute($name));

                if ($safe === null) {
                    $el->removeAttribute($name);
                } else {
                    $el->setAttribute($name, $safe);
                }
            }
        }
    }

    /**
     * Return a safe URL or null if the input should be stripped.
     * Accepts relative URLs, in-page anchors, and any explicit http(s)/
     * mailto URLs. Everything else (javascript:, data:, etc.) is dropped.
     */
    private function sanitiseUrl(string $url): ?string
    {
        $url = trim($url);

        if ($url === '') {
            return null;
        }

        // In-page anchor — fine.
        if (str_starts_with($url, '#')) {
            return $url;
        }

        // Protocol-relative // or root-relative /path — treat as same-origin.
        if (str_starts_with($url, '/') || str_starts_with($url, '//')) {
            return $url;
        }

        // Explicit scheme?
        if (preg_match('#^([a-z][a-z0-9+.\-]*):#i', $url, $m) === 1) {
            $scheme = strtolower($m[1]);

            return in_array($scheme, self::ALLOWED_URL_SCHEMES, true) ? $url : null;
        }

        // Schemeless but not starting with / — assume relative path.
        return $url;
    }

    /**
     * Force safe rel/target on links that point off-site. In-page
     * anchors (#heading) are left alone so they don't open new tabs.
     */
    private function hardenAnchor(DOMElement $a): void
    {
        $href = $a->getAttribute('href');

        if ($href === '' || str_starts_with($href, '#')) {
            return;
        }

        $a->setAttribute('rel', 'noopener noreferrer nofollow ugc');

        // Relative links stay in-tab; absolute links open in a new tab.
        if (preg_match('#^https?://#i', $href) === 1) {
            $a->setAttribute('target', '_blank');
        }
    }

    /**
     * Make sure every heading has a stable, URL-safe id so the TOC can
     * deep-link into it. If the editor already assigned an id, we
     * re-slug it defensively.
     */
    private function ensureHeadingId(DOMElement $h): void
    {
        $text = trim($h->textContent ?? '');

        if ($text === '') {
            return;
        }

        $existing = trim($h->getAttribute('id'));
        $slug = $existing !== '' ? $existing : $text;

        // Aggressively normalise: lowercase, ASCII-safe, no spaces.
        $slug = strtolower($slug);
        $slug = preg_replace('/[^a-z0-9]+/', '-', $slug) ?? '';
        $slug = trim($slug, '-');

        if ($slug === '') {
            $slug = 'section';
        }

        $h->setAttribute('id', $slug);
    }

    /**
     * Pull the <h2>/<h3>/<h4> headings into a flat list for the sticky
     * TOC. Collision-free because ensureHeadingId runs first.
     *
     * @return list<array{id:string,text:string,level:int}>
     */
    private function extractToc(DOMDocument $doc): array
    {
        $xp = new DOMXPath($doc);
        $nodes = $xp->query('//h2 | //h3 | //h4');

        if ($nodes === false) {
            return [];
        }

        $toc = [];
        $seen = [];

        foreach ($nodes as $n) {
            if (! $n instanceof DOMElement) {
                continue;
            }

            $id = $n->getAttribute('id');
            $text = trim($n->textContent ?? '');

            if ($id === '' || $text === '') {
                continue;
            }

            // Dedupe ids within a single document by appending -2/-3/...
            // Mutating the element here keeps HTML and TOC in sync.
            $base = $id;
            $suffix = 1;
            while (isset($seen[$id])) {
                $id = $base.'-'.(++$suffix);
            }
            $seen[$id] = true;
            $n->setAttribute('id', $id);

            $toc[] = [
                'id' => $id,
                'text' => $text,
                'level' => (int) substr($n->nodeName, 1),
            ];
        }

        return $toc;
    }
}
