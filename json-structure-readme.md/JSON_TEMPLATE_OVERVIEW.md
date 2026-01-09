# JSON Template Overview

The SSD Journal Builder uses JSON files to define journal templates in a structured, consistent, and repeatable way.

Each template mirrors the original journal format as closely as possible, including section order, field labels, and repeatable behavior. The JSON does not interpret or shorten content; it represents the journal exactly as written.

Templates are rendered dynamically by the application based on this structure, allowing updates to be made without changing application code.

This document provides a high-level overview of how templates are organized and how the supporting JSON files work together.

{
  "id": "cf_application",
  "name": "CalFresh – Application",
  "file": "CF_Application.json",
  "program": "CalFresh",
  "version": "2026-01-01T00:00:00Z",
  "imported": false,
  "sections": []
}
