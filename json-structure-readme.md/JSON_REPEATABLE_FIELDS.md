# JSON Repeatable Fields

This document explains repeatable field groups, including structure, behavior, and common use cases such as income and household members.

# JSON Repeatable Fields

Repeatable fields allow users to enter multiple instances of the same information.

They are used when a journal requires capturing a variable number of entries.

## Common Use Cases
- Employment history
- Income sources
- Household members
- Other recurring data

## Behavior
- Users can add or remove entries as needed
- Each entry contains the same set of sub-fields
- Entries are displayed in the order added

Repeatable fields ensure flexibility while maintaining a consistent structure.

{
  "id": "employment_history",
  "label": "Employment History",
  "type": "repeatable",
  "fields": [
    {
      "id": "employer_name",
      "label": "Employer",
      "type": "text"
    },
    {
      "id": "last_date_worked",
      "label": "Last Date Worked",
      "type": "date"
    }
  ]
}
