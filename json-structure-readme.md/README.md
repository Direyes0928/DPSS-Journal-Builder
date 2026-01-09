# SSD Journal Builder (Static Application)

The SSD Journal Builder is a static, browser-based application designed to render structured journal templates from JSON files.  
It allows templates to be updated, added, or corrected without modifying application code.

The application focuses on accuracy, consistency, and maintainability while mirroring official journal language and structure as closely as possible.

---

## Purpose

This application was created to:
- Standardize journal documentation
- Reduce manual entry errors
- Improve consistency across programs
- Allow non-code updates through JSON templates

The app does not store data, submit data, or connect to external systems.  
All rendering is performed client-side.

---

## Application Type

- Static web application
- No backend or server dependency
- No database
- No authentication
- No external APIs

The application can be hosted on any static hosting platform (e.g., internal hosting, GitHub Pages).

---

## Project Structure

/
├── index.html # Application entry point
├── app.js # Core rendering and behavior logic
├── templates/ # Individual journal template JSON files
├── templatesIndex.json # Template registry
├── README.md # Project overview
└── docs/ # JSON structure documentation



---

## Templates

Templates are defined using JSON and stored in the `templates/` directory.

Each template:
- Represents a single journal
- Mirrors official journal language and order
- Defines sections, fields, and repeatable groups
- Is rendered dynamically at runtime

Templates are registered in `templatesIndex.json`.

---

## JSON Documentation

Detailed documentation for the JSON structure is available in the `docs/` folder:

- `JSON_TEMPLATE_OVERVIEW.md`
- `JSON_TEMPLATE_INDEX.md`
- `JSON_TEMPLATE_SECTIONS.md`
- `JSON_BASIC_FIELDS.md`
- `JSON_REPEATABLE_FIELDS.md`
- `JSON_CONDITIONAL_FIELDS.md`
- `JSON_ACKNOWLEDGEMENTS.md`
- `JSON_RULES_AND_CONVENTIONS.md`

These documents explain how templates are structured and how each JSON component behaves.

---

## Design Principles

- Match official journal language exactly
- Avoid interpretation or paraphrasing
- Keep logic simple and explicit
- Prefer clarity over abstraction
- Separate structure (JSON) from behavior (JavaScript)

---

## Icons & UI Assets

The application uses simple, generic SVG icons consistent with common open-source UI iconography.  
No third-party application logic or libraries are embedded.

---

## Maintenance & Updates

- Templates can be updated independently of application code
- New templates can be added without rebuilding the app
- JSON files should follow documented rules and conventions
- Version fields are informational and used for tracking only

---

## Intended Audience

This project is intended for:
- Program analysts
- IT reviewers
- Developers maintaining templates
- Stakeholders reviewing journal accuracy

---

## Notes

This repository intentionally excludes:
- Build tools
- One-off scripts
- Conversion utilities
- Experimental features

Only runtime and documentation files required for review and use are included.
