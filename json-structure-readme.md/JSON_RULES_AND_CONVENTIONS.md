# JSON Rules & Conventions

This document outlines naming rules, formatting standards, and consistency requirements for JSON journal templates.

# JSON Rules & Conventions

To ensure consistency and maintainability, all JSON templates follow the same rules and conventions.

## General Rules
- IDs must be unique within their scope
- Labels must match journal language exactly
- Field order should mirror the source document
- Repeatable and non-repeatable behavior must match the journal
- No interpretation or paraphrasing of content is allowed

These conventions ensure templates remain accurate, predictable, and easy to update over time.

{
  "id": "household_members",
  "label": "Household Members",
  "type": "repeatable",
  "fields": [
    {
      "id": "member_name",
      "label": "Name",
      "type": "text"
    },
    {
      "id": "date_of_birth",
      "label": "Date of Birth",
      "type": "date"
    }
  ]
}
