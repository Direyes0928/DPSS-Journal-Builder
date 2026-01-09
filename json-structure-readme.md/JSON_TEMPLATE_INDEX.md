# JSON Template Index & Metadata

This document describes the top-level JSON properties used to identify, version, and organize journal templates.

# JSON Template Index & Metadata

Each journal template begins with top-level metadata that identifies the template and provides contextual information used by the application.

## Purpose
- Identify the template uniquely
- Associate the template with a program
- Track version history
- Support template loading and management

## Common Properties

- `id`  
  A unique identifier for the template.

- `name`  
  The display name shown in the application.

- `file`  
  The filename where the template is stored.

- `program`  
  The program the template belongs to (e.g., CalFresh).

- `version`  
  An informational timestamp indicating the template version.

- `imported`  
  Indicates whether the template was system-generated or manually created.

These properties are used only for identification and organization and do not affect how sections or fields are rendered.


{
  "id": "cf_changes",
  "name": "CalFresh – Changes",
  "file": "CF_Changes.json",
  "program": "CalFresh",
  "version": "2026-01-10T00:00:00Z",
  "imported": false
}
