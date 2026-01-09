# JSON Basic Fields

This document defines standard, non-repeatable field types used within journal templates and how they are rendered.

# JSON Sections

Sections divide a template into logical groups of related fields.

Each section typically corresponds to a labeled area in the original journal, helping maintain clarity and alignment with official documentation.

## Purpose
- Group related fields together
- Control display order
- Improve readability for users

## Behavior
- Sections are rendered in the order they appear in the JSON
- Section titles are displayed as headers in the UI
- Each section contains one or more fields

Sections do not contain logic themselves; they act as containers for fields.

{
  "id": "application_date",
  "label": "Application Date",
  "type": "date"
}

Another example:

{
  "id": "short_description",
  "label": "Short Description",
  "type": "note",
  "content": "CF: Application Submitted"
}
