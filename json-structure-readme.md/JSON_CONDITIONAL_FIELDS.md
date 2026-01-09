# JSON Conditional Fields (“Please Specify”)

This document describes conditional logic used in templates, including fields that appear only when additional clarification is required.

# JSON Conditional Fields (“Please Specify”)

Conditional fields are used when additional information is required only under certain conditions.

A common example is a “Please Specify” field that appears when a user selects a particular option.

## Purpose
- Capture required clarification only when applicable
- Reduce unnecessary input fields
- Maintain accuracy in documentation

## Behavior
- Conditional fields remain hidden until triggered
- Trigger conditions are evaluated at runtime
- Once triggered, the additional field becomes required

This approach keeps the journal clean while ensuring necessary details are captured.

{
  "id": "income_type",
  "label": "Income Type",
  "type": "select",
  "options": [
    "Wages",
    "Self-Employment",
    "Other"
  ],
  "requiresDetail": {
    "when": "Other",
    "label": "Please Specify"
  }
}
