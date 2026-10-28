# Application languages

The application supports Portuguese, English and Spanish. `main.ts` awaits language initialization before Angular creates any components. Portuguese uses source copy; the other dictionaries load as a separate chunk.

Preference order: a valid `lang=pt|en|es|auto` query choice, `wealthos:language` in local storage, the `wealthos_language` cookie, then the first supported entry in `navigator.languages` / `navigator.language`. Unsupported languages fall back to English. Regional tags such as `en-GB` and `es-MX` select a translation and retain their date and numeric conventions.

The login and account settings offer a language picker. Choosing a language saves only this device's preference and reloads the application. Automatic mode uses the browser again. Authentication cookies, financial state and stored names/descriptions are not translated or rewritten.

Use `TranslatePipe` for owned copy and `translate()` for owned code messages. `translations.ts` uses Portuguese source strings as keys, with English and Spanish values. Pass changing values as `{0}`, `{1}` parameters. Keep user content out of the translation pipe. Select options with user-entered labels must set `localize: false`. Financial categories and enum values remain stable in the model; only their presentation changes.

Amounts remain BRL (or USD where explicitly indicated). The numeric directive formats the visible separators but emits the existing comma-decimal model, preserving integer cents and validation. Statement parsing continues to accept supported bank statement formats independently of the interface language.

`test/language.test.ts` covers language negotiation, overrides, blocked storage, complete placeholders, template coverage, real controls, empty values and cent-preserving numeric round trips. Existing financial and PDF regression tests remain required.

Public SEO URLs `/sobre`, `/en` and `/es` retain their explicit languages and reciprocal hreflang links. The app's “learn more” link follows the selected interface language.
