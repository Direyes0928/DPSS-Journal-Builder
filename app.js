// ==================================================
// SECTION LIBRARY (authoritative source of sections)
// 2025-12-17 // new
// ==================================================

const SECTION_LIBRARY = {
  interview_details: {
    id: "interview_details",
    title: "Interview Details",
    fields: [
      { id: "method", type: "choice", label: "Interview Method" },
      { id: "date", type: "date", label: "Scheduled Interview Date" },
      { id: "time", type: "time", label: "Scheduled Interview Time" },
      { id: "contact_name", type: "text", label: "Interview Contact Name" },
      { id: "contact_phone", type: "phone", label: "Interview Contact Phone" }
    ]
  }
};

// ==================================================
// TEMPLATE SECTION NORMALIZER
// Supports legacy + section-library formats
// 2025-12-17 // new
// ==================================================

function normalizeTemplateSections(sections) {
  if (!Array.isArray(sections)) return [];

  // New format: already references sectionId
  if (sections.length && sections[0].sectionId) {
    return sections;
  }

  // Legacy format: wrap existing section objects
  return sections.map((sec, idx) => ({
    sectionId: sec.id || `legacy_section_${idx}`,
    legacySection: sec,
    required: !!sec.required
  }));
}

// Animated startup overlay logic
document.addEventListener('DOMContentLoaded', function() {
    var overlay = document.getElementById('startupOverlay');
    var mainApp = document.querySelector('main');
    if (overlay && mainApp) {
        mainApp.style.opacity = '0';
        // Wait for templates and app logic to finish loading before hiding overlay
        window._dpssAppReady = false;
        function finishStartup() {
            overlay.style.opacity = '0';
            setTimeout(function() {
                overlay.style.display = 'none';
                mainApp.style.opacity = '1';
            }, 700);
        }
        // Patch: Wait for allTemplates to be loaded and initial render
        let tries = 0;
        function checkReady() {
            tries++;
            // App is ready when allTemplates is loaded and sidebar/main rendered
            if (window._dpssAppReady || tries > 40) {
                finishStartup();
            } else {
                setTimeout(checkReady, 100);
            }
        }
        checkReady();
    }

    // Inject custom styles for repeatable containers and clarification pill buttons
    if (!document.getElementById('repeatable-css')) {
        const style = document.createElement('style');
        style.id = 'repeatable-css';
        style.textContent = `
        .repeatable-container {
            margin-top: 18px;
            background: #f7fafc;
            border: 1.5px solid #d1e3f8;
            border-radius: 14px;
            box-shadow: 0 2px 8px rgba(60, 120, 180, 0.07);
            padding: 18px 16px 38px 16px;
            position: relative;
            transition: box-shadow 0.2s;
        }
        .repeatable-container:hover {
            box-shadow: 0 4px 16px rgba(60, 120, 180, 0.13);
        }
        .repeatable-list { display: flex; flex-direction: column; gap: 10px; }
        .repeatable-row { display: flex; align-items: center; gap: 10px; }
        .repeatable-number { width: 24px; font-weight: bold; color: #4f8cff; }
        .repeatable-inner { flex: 1; display: flex; flex-direction: column; gap: 6px; }
        .repeatable-del { background: transparent; border: none; color: #900; font-size: 20px; cursor: pointer; }
        .repeatable-add {
            position: absolute;
            right: 18px;
            bottom: 12px;
            background: linear-gradient(90deg, #4f8cff 0%, #6ad1e3 100%);
            color: #fff;
            border: none;
            border-radius: 999px;
            padding: 7px 22px;
            font-size: 1rem;
            font-weight: 600;
            box-shadow: 0 2px 8px rgba(60, 120, 180, 0.10);
            cursor: pointer;
            transition: background 0.2s, box-shadow 0.2s;
            z-index: 2;
        }
        .repeatable-add:hover {
            background: linear-gradient(90deg, #6ad1e3 0%, #4f8cff 100%);
            box-shadow: 0 4px 16px rgba(60, 120, 180, 0.18);
        }
        /* Clarification pill button distinct style */
        .pill-btn-green {
            background: linear-gradient(90deg, #ffb347 0%, #ffcc80 100%);
            color: #333;
            border: none;
            border-radius: 999px;
            padding: 8px 24px;
            font-size: 1rem;
            font-weight: 600;
            box-shadow: 0 2px 8px rgba(255, 180, 71, 0.10);
            cursor: pointer;
            transition: background 0.2s, box-shadow 0.2s;
            z-index: 3;
        }
        .pill-btn-green:hover {
            background: linear-gradient(90deg, #ffcc80 0%, #ffb347 100%);
            box-shadow: 0 4px 16px rgba(255, 180, 71, 0.18);
        }
        `;
        document.head.appendChild(style);
    }
});
// DEBUG: Force popup button logic
document.addEventListener('DOMContentLoaded', function() {
    var debugBtn = document.getElementById('debugShowPopupBtn');
    if (debugBtn) {
        debugBtn.onclick = function() {
            document.getElementById('create_template_guide_backdrop').classList.remove('hidden');
            document.getElementById('create_template_guide').classList.remove('hidden');
            console.log('DEBUG: Guidance popup forced');
        };
    }
});
// --- Universal label resolver (safe patch) ---
// Finds a label for any field: repeatable, nested, inline, cloned, etc.
function resolveFieldLabel(fieldEl) {
    // 1. Explicit <label> associated with the field
    let lbl = fieldEl.closest('.mb-3')?.querySelector('label');
    if (lbl && lbl.textContent.trim() !== "") return lbl.textContent.trim();

    // 2. Look upward for header-like elements
    let header = fieldEl.closest('.mb-3, .repeatable-item, .repeatable-block')
        ?.querySelector('.fw-bold, h1, h2, h3, h4');
    if (header && header.textContent.trim() !== "") return header.textContent.trim();

    // 3. Fallback to data-label attribute if present
    if (fieldEl.dataset?.label) return fieldEl.dataset.label;

    // 4. Last resort — use the field’s name or id
    return fieldEl.name || fieldEl.id || "Field";
}
// ============================================================================
// Build Journal Output (2025-12-10 — FIXED LABELS VERSION)
// - All repeatable subfields now print correct labels (Relationship, Status, etc.)
// - No more "Field:" entries
// - Supports notes, selects, text, specify, none-reported
// ============================================================================
// Section helper: detects if section repeatables are empty
// ============================================================================
function sectionHasEmptyRepeatables(sectionEl) {
    const repeatables = sectionEl.querySelectorAll('.repeatable-container');
    if (repeatables.length === 0) return false;

    for (const rep of repeatables) {
        if (rep.querySelector('.repeatable-row')) return false;
    }
    return true;
}

// ============================================================================
// Build Journal Output — WITH NOTE SUPPORT + FURTHER CLARIFICATION
// ============================================================================
// ============================================================================
// Build Journal Output (2025-12 FINAL) 
// - Repeatables correct
// - Notes correct
// - "Specify" logic correct
// - Clarification textareas INCLUDED
// - No "Field:" labels inside repeatables
// ============================================================================
// BUILD JOURNAL OUTPUT — SIMPLE, DOM-MIRROR VERSION
// Purpose: Show EXACTLY what the user sees on screen
// No validation, no guessing, no placeholder logic
// ============================================================================

function buildJournalOutput() {
    const sections = document.querySelectorAll('#dynamicCoreSections .section-card');
    let output = '';

    sections.forEach(section => {

        const sectionTitle =
            section.querySelector('.section-title')?.textContent.trim() || '';

        if (sectionTitle) {
            output += `\n=== ${sectionTitle.toUpperCase()} ===\n\n`;
        }

        const groups = section.querySelectorAll('.clone-group');
        let printedAnyField = false;

        groups.forEach((group, gIdx) => {

            if (groups.length > 1) {
                output += `  [${gIdx + 1}]\n`;
            }

            const fields = group.querySelectorAll(
                '.journal-input, .repeatable-container'
            );

            fields.forEach(field => {

                // =======================================================
                // REPEATABLE CONTAINER
                // =======================================================
                if (field.classList.contains('repeatable-container')) {

                    const label =
                        field.querySelector('label')?.textContent.trim() || '';
                    if (!label) return;

                    const rows = field.querySelectorAll('.repeatable-row');

                    if (rows.length === 0) {
                        output += `  ${label}: \n`;
                        printedAnyField = true;
                        return;
                    }

                    rows.forEach((row, rIdx) => {
                        printedAnyField = true;
                        output += `  ${label} [${rIdx + 1}]:\n`;

                        const subfields = row.querySelectorAll(
                            '.repeatable-inner input, ' +
                            '.repeatable-inner textarea, ' +
                            '.repeatable-inner select, ' +
                            '.repeatable-inner .journal-input[data-type="note"]'
                        );

                        subfields.forEach(sf => {

                            const sublabel =
                                sf.closest('.mb-3')
                                    ?.querySelector('label')
                                    ?.textContent.trim() ||
                                sf.getAttribute('placeholder') ||
                                sf.dataset?.label ||
                                sf.id ||
                                '';

                            if (!sublabel) return;

                            const val = readVisibleValue(sf);
                            if (!val) return;

                            output += `    ${sublabel}: ${val}\n`;
                        });
                    });

                    return;
                }

                // =======================================================
                // NON-REPEATABLE FIELD
                // =======================================================
                if (field.closest('.repeatable-inner')) return;

                const label = resolveFieldLabel(field);
                if (!label) return;

                const val = readVisibleValue(field);
                if (!val) return;

                printedAnyField = true;
                output += `  ${label}: ${val}\n`;
            });

            output += `\n`;
        });

        // ===========================================================
        // CLARIFICATION TEXTAREAS
        // ===========================================================
        const clarifications = section.querySelectorAll(
            "[id^='clarification-container'] textarea.journal-input"
        );

        clarifications.forEach(t => {
            const v = t.value.trim();
            if (!v) return;

            printedAnyField = true;
            output += `  Further Clarification: ${v}\n`;
        });

        // ===========================================================
        // NONE REPORTED
        // ===========================================================
        if (!printedAnyField) {
            output += `  \n`;
        }
    });

    return output.trim();
}

// ============================================================================
// Helper — read exactly what is VISIBLE in the UI
// ============================================================================
function readVisibleValue(el) {
    if (!el) return '';

    // Dropdown → visible option text
    if (el.tagName === 'SELECT') {
        return el.options[el.selectedIndex]?.text?.trim() || '';
    }

    // Notes / static text
    if (el.dataset?.type === 'note') {
        return el.dataset?.content?.trim() || '';
    }

    // Inputs / textareas
    return el.value?.trim() || '';
}



// ============================================================================
// SSD JOURNAL BUILDER — FULLY FIXED VERSION (2025-11-24)
// Works with templatesIndex.json + templates/*/*.json exactly as your repo has it
// ============================================================================
console.log("🔥 NEW APP.JS LOADED");

// GLOBALS
let allTemplates = [];
let activeTemplate = null;
let templatesIndex = {};
let programMetadata = {}; // Store emoji and display info for each program
let undoStack = [];
let collapsedSections = new Set(); // track collapsed section indices
let changeLog = []; // track all changes made
let originalTemplateState = null; // snapshot before admin edits
const PERSIST_PREFIX = 'dpss_template_';
// Placeholder removal configuration for DOCX → JSON cleaning (case-insensitive)
const PLACEHOLDER_BLOCKLIST = [
    'click or tap',
    'choose ',
    'click here',
    'enter text'
];
const EXACT_PLACEHOLDER_PHRASES = [
    'click or tap to enter a date.',
    'click or tap to enter text.',
    'choose application action',
    'choose county'
];
const PLACEHOLDER_START_PATTERNS = [
    'click or tap',
    'choose '
];

// Unified placeholder detector (case-insensitive) used in DOCX cleanup and HTML→template conversion
function isPlaceholderText(raw) {
    if (!raw) return false;
    const t = raw.toLowerCase().trim();
    if (!t) return false;
    if (EXACT_PLACEHOLDER_PHRASES.some(p => t.includes(p))) return true; // phrase anywhere
    if (PLACEHOLDER_START_PATTERNS.some(p => t.startsWith(p))) return true; // starts with pattern
    return false;
}

// Detect potential dropdown choices from a line of text (comma, slash, semicolon separated)
function detectChoices(text) {
    if (!text) return null;
    // Exclude sentences with periods (likely prose) unless very short
    const cleaned = text.trim();
    const hasPeriod = cleaned.includes('.') && cleaned.length > 40;
    if (hasPeriod) return null;
    // Use consistent separator detection
    const separators = [',', '/', ';', ' | '];
    let chosenSep = null;
    for (const sep of separators) {
        if (cleaned.includes(sep)) { chosenSep = sep; break; }
    }
    if (!chosenSep) return null;
    const parts = cleaned.split(chosenSep).map(p => p.trim()).filter(p => p.length > 0);
    if (parts.length < 2) return null;
    // Guard against overly long choices or single giant sentence
    if (parts.some(p => p.length > 60)) return null;
    // Avoid if any part still contains placeholder text
    if (parts.some(p => isPlaceholderText(p))) return null;
    // Remove duplicates
    const unique = [...new Set(parts)];
    if (unique.length < 2) return null;
    // Cap choices to prevent accidental huge splits
    if (unique.length > 25) return null;
    return unique;
}

function deepClone(obj) { return JSON.parse(JSON.stringify(obj)); }

function persistActiveTemplateChanges() {
    if (!activeTemplate) return;
    try {
        const snapshot = deepClone(activeTemplate);
        localStorage.setItem(PERSIST_PREFIX + snapshot.file, JSON.stringify(snapshot));
        console.log('💾 Persisted template changes to localStorage for', snapshot.file);
    } catch (e) {
        console.warn('Persist failed:', e);
    }
}

function loadPersistedTemplate(templateObj) {
    try {
        const raw = localStorage.getItem(PERSIST_PREFIX + templateObj.file);
        if (!raw) return templateObj;
        const stored = JSON.parse(raw);
        // Replace mutable parts (sections) entirely with stored version
        if (stored.sections && Array.isArray(stored.sections)) {
            templateObj.sections = stored.sections;
        }
        // carry over any flags like required/content already in stored
        return templateObj;
    } catch (e) {
        console.warn('Load persisted failed for', templateObj.file, e);
        return templateObj;
    }
}

// ============================================================================
// LOAD ALL TEMPLATES
// ============================================================================
async function loadAllTemplates() {
    try {
        // Load templatesIndex from localStorage if exists, otherwise from JSON file
        const storedIndex = localStorage.getItem('dpss_templatesIndex');
        if (storedIndex) {
            templatesIndex = JSON.parse(storedIndex);
            console.log('📦 Loaded templatesIndex from localStorage');
        } else {
            const res = await fetch("templatesIndex.json");
            templatesIndex = await res.json();
            console.log('📦 Loaded templatesIndex from file');
        }
        
        // Load program metadata (emojis and display info)
        const storedMetadata = localStorage.getItem('dpss_programMetadata');
        if (storedMetadata) {
            programMetadata = JSON.parse(storedMetadata);
        } else {
            // Initialize with default emojis for existing programs
            programMetadata = {
                'CalFresh': { emoji: '🍎', name: 'CalFresh' },
                'CalWORKs': { emoji: '👨‍👩‍👧‍👦', name: 'CalWORKs' },
                'Medi-Cal': { emoji: '🏥', name: 'Medi-Cal' },
                'ChildCare': { emoji: '👶', name: 'ChildCare' },
                'General': { emoji: '📋', name: 'General' }
            };
        }

        const loaded = [];

        for (const programName of Object.keys(templatesIndex)) {
            const list = templatesIndex[programName] || [];

            for (const entry of list) {
                // Check if this is an imported template (no file on server)
                if (entry.imported) {
                    // Load from localStorage only
                    const stored = localStorage.getItem(PERSIST_PREFIX + entry.file);
                    if (stored) {
                        const template = JSON.parse(stored);
                        template.program = programName;
                        template.imported = true;
                        loaded.push(template);
                        console.log('📥 Loaded imported template:', template.name);
                    }
                    continue;
                }
                
                // Regular template from file
                const filePath = `templates/${programName}/${entry.file}`;

                try {
                    const json = await fetch(filePath).then(r => r.json());
                    json.program = programName;
                    json.file = entry.file;
                    json.id = entry.id;
                    // Load persisted modifications if exist
                    const merged = loadPersistedTemplate(json);
                    loaded.push(merged);
                } catch (err) {
                    console.warn("Missing template:", filePath);
                }
            }
        }

        allTemplates = loaded;
        console.log("✔ LOADED ALL TEMPLATES:", allTemplates);

        populateHeaderDropdowns();
        applyHeaderFilters();
        // Mark app as ready for startup overlay removal
        window._dpssAppReady = true;

    } catch (err) {
        console.error("templatesIndex failed:", err);
    }
}

// ============================================================================
// POPULATE PROGRAM DROPDOWN
// ============================================================================
function populateHeaderDropdowns() {
    const ddProgram = document.getElementById("headerProgramFilter");

    ddProgram.innerHTML = `<option value="">All Programs</option>`;

    const programs = [...new Set(allTemplates.map(t => t.program))];
    programs.forEach(p => {
        ddProgram.innerHTML += `<option value="${p}">${p}</option>`;
    });
}

// ============================================================================
// APPLY FILTERS
// ============================================================================
function applyHeaderFilters() {
    const ddProgram = document.getElementById("headerProgramFilter");
    const ddTemplate = document.getElementById("headerTemplateSelector");
    const txtSearch = document.getElementById("headerTemplateSearch");
    const reset = document.getElementById("headerTemplateReset");

    const p = ddProgram.value;
    const q = txtSearch.value.toLowerCase().trim();
    const tokens = q.length ? q.split(/\s+/).filter(Boolean) : [];

    ddTemplate.innerHTML = `<option value="">Select Template</option>`;

    allTemplates.forEach(tpl => {
        if (tpl.hidden) return; // Skip hidden

        const matchP = !p || tpl.program === p;

        let haystack = '';
        if (tokens.length) {
            // Build a comprehensive lowercase haystack of template content (section titles, labels, field labels & admin notes)
            const sectionParts = (tpl.sections || []).map(sec => {
                const base = [sec.title, sec.label, sec.sectionLabel].filter(Boolean).join(' ');
                const fieldText = (sec.fields || []).map(f => [f.label, f.content].filter(Boolean).join(' ')).join(' ');
                return base + ' ' + fieldText;
            }).join(' ');
            haystack = [tpl.name, tpl.program, sectionParts].join(' ').toLowerCase();
        }

        const matchQ = !tokens.length || tokens.every(t => haystack.includes(t));

        if (matchP && matchQ) {
            const importedBadge = tpl.imported ? ' 📥' : '';
            ddTemplate.innerHTML += `<option value="${tpl.file}">${tpl.name}${importedBadge}</option>`;
        }
    });

    // Always show reset button
    reset.classList.remove("hidden");
}

function initHeaderFilters() {
    const ddProgram = document.getElementById("headerProgramFilter");
    const ddTemplate = document.getElementById("headerTemplateSelector");
    const txtSearch = document.getElementById("headerTemplateSearch");
    const reset = document.getElementById("headerTemplateReset");

    ddProgram.addEventListener("change", applyHeaderFilters);
    txtSearch.addEventListener("input", applyHeaderFilters);

    // Live suggestions dropdown for header search (search by template title across all programs)
    const resultsContainer = getOrCreateHeaderSearchContainer();

    txtSearch.addEventListener('input', function(e) {
        const q = (e.target.value || '').trim();
        if (!q) {
            hideHeaderSearchResults(resultsContainer);
            return;
        }
        const matches = findTemplateTitleMatches(q, 8);
        if (matches.length === 0) {
            hideHeaderSearchResults(resultsContainer);
            return;
        }
        renderHeaderSearchResults(resultsContainer, matches);
    });

    // Hide results when clicking outside
    document.addEventListener('click', (ev) => {
        const target = ev.target;
        if (!resultsContainer.contains(target) && target !== txtSearch) hideHeaderSearchResults(resultsContainer);
    });

    reset.addEventListener("click", () => {
        ddProgram.value = "";
        txtSearch.value = "";
        ddTemplate.value = "";
        
        // Clear the active template and reset UI
        activeTemplate = null;
        document.getElementById("currentTemplateTag").textContent = "Default Template";
        
        // Show placeholders
        showPlaceholders();
        // Hide sidebar controls when no template is selected
        try { if (typeof updateSidebarControlsVisibility === 'function') updateSidebarControlsVisibility(); } catch (e) {}
        
        applyHeaderFilters();
    });

    ddTemplate.addEventListener("change", () => {
        const file = ddTemplate.value;
        console.log("🎯 Template selected:", file);
        
        if (!file) return;

        const tpl = allTemplates.find(x => x.file === file);
        console.log("🎯 Found template:", tpl);
        
        if (!tpl) return;

        activeTemplate = tpl;
        document.getElementById("currentTemplateTag").textContent = tpl.name;

        console.log("🎯 Rendering sections:", tpl.sections);
        renderTemplateSections(tpl);
        renderSidebarFromTemplate(tpl);
        // Show/hide sidebar controls based on whether a template is active
        try { if (typeof updateSidebarControlsVisibility === 'function') updateSidebarControlsVisibility(); } catch (e) {}
        
        // Initialize follow-up inputs after render
        setTimeout(() => initializeFollowupInputs(), 100);
    });
}

// Lazy populate selects that were rendered with `data-lazy="true"` and `data-choices`.
function lazyPopulateSelect(selectEl) {
    if (!selectEl || selectEl.dataset._populated) return;
    const raw = selectEl.getAttribute('data-choices');
    if (!raw) { selectEl.dataset._populated = '1'; return; }
    let choices = [];
    try { choices = JSON.parse(raw); } catch (e) { choices = []; }
    // Remove the placeholder option if present (value === "")
    const first = selectEl.querySelector('option');
    if (first && first.value === '') selectEl.innerHTML = '';
    // Append options
    choices.forEach(c => {
        const opt = document.createElement('option');
        opt.value = c;
        opt.textContent = c;
        selectEl.appendChild(opt);
    });
    selectEl.dataset._populated = '1';
}

function setupLazySelects(root=document) {
    const selects = (root || document).querySelectorAll('select[data-lazy="true"]');
    selects.forEach(sel => {
        if (sel._lazyAttached) return;
        // Populate on focus, mousedown (for click-open), and keyboard
        const onFirst = () => lazyPopulateSelect(sel);
        sel.addEventListener('focus', onFirst, { once: true, passive: true });
        sel.addEventListener('mousedown', onFirst, { once: true, passive: true });
        sel.addEventListener('keydown', (e) => {
            if (e.key === 'ArrowDown' || e.key === 'Enter' || e.key === ' ') onFirst();
        }, { once: true, passive: true });
        sel._lazyAttached = true;
    });
}

// Ensure lazy selects are initialized after rendering
const originalRenderTemplateSections = renderTemplateSections;
renderTemplateSections = function(tpl) {
    originalRenderTemplateSections(tpl);
    // Small timeout to allow DOM inserts
    setTimeout(() => {
        setupLazySelects(document.getElementById('dynamicCoreSections') || document);
        try { if (typeof enableSpellcheck === 'function') enableSpellcheck(document.getElementById('dynamicCoreSections') || document); } catch (e) {}
    }, 50);
};

// Enable browser spellcheck on journal input fields and observe dynamically added fields
function enableSpellcheck(root=document) {
    try {
        const scope = root || document;
        const applyTo = (el) => {
            if (!el) return;
            if (el.setAttribute) {
                el.setAttribute('spellcheck', 'true');
                el.setAttribute('autocorrect', 'on');
                el.setAttribute('autocapitalize', 'sentences');
            }
        };

        const els = scope.querySelectorAll('textarea.journal-input, input.journal-input[type="text"]');
        els.forEach(e => applyTo(e));

        // Install a MutationObserver once to catch dynamically injected fields
        if (!window._ssdSpellcheckObserver) {
            const mo = new MutationObserver(muts => {
                muts.forEach(m => {
                    m.addedNodes && m.addedNodes.forEach(node => {
                        if (!node) return;
                        if (node.nodeType !== 1) return;
                        if (node.matches && (node.matches('textarea.journal-input') || node.matches('input.journal-input[type="text"]'))) {
                            applyTo(node);
                        }
                        const nested = node.querySelectorAll && node.querySelectorAll('textarea.journal-input, input.journal-input[type="text"]');
                        if (nested && nested.length) nested.forEach(n => applyTo(n));
                    });
                });
            });
            mo.observe(document.body, { childList: true, subtree: true });
            window._ssdSpellcheckObserver = mo;
        }
    } catch (e) {
        console.warn('enableSpellcheck failed:', e);
    }
}

// --- Header search suggestion helpers ---
function getOrCreateHeaderSearchContainer() {
    let el = document.getElementById('headerSearchResults');
    if (!el) {
        el = document.createElement('div');
        el.id = 'headerSearchResults';
        el.className = 'hidden';
        document.body.appendChild(el);
    }
    return el;
}

function positionHeaderSearchContainer(container) {
    const input = document.getElementById('headerTemplateSearch');
    if (!input) return;
    const rect = input.getBoundingClientRect();
    const top = rect.bottom + window.scrollY + 6;
    const left = rect.left + window.scrollX;
    container.style.top = top + 'px';
    container.style.left = left + 'px';
}

function hideHeaderSearchResults(container) {
    container.classList.add('hidden');
    container.setAttribute('aria-hidden', 'true');
    container.innerHTML = '';
}

function renderHeaderSearchResults(container, matches) {
    container.innerHTML = '';
    matches.forEach(m => {
        const div = document.createElement('div');
        div.className = 'result-item';
        div.innerHTML = `<div class="result-title">${escapeHtml(m.name)}</div><div class="result-program">${escapeHtml(m.program)}</div>`;
        div.onclick = function() {
            // Select template and trigger load
            const dd = document.getElementById('headerTemplateSelector');
            if (dd) dd.value = m.file || '';
            // program filter set
            const prog = document.getElementById('headerProgramFilter');
            if (prog) prog.value = m.program || '';
            // Apply filters so template selector matches and then trigger change
            applyHeaderFilters();
            // small timeout to allow ddTemplate to populate
            setTimeout(() => {
                const tpl = allTemplates.find(t => t.file === m.file && t.program === m.program) || allTemplates.find(t => t.file === m.file);
                if (tpl) {
    activeTemplate = {
        ...tpl,
        sections: normalizeTemplateSections(tpl.sections)
    };

    document.getElementById('currentTemplateTag').textContent = activeTemplate.name;
    renderTemplateSections(activeTemplate);
    renderSidebarFromTemplate(activeTemplate);
    setTimeout(() => initializeFollowupInputs(), 100);
}

            }, 80);
            hideHeaderSearchResults(container);
            // Clear search input after selection
            const input = document.getElementById('headerTemplateSearch'); if (input) input.value = '';
        };
        container.appendChild(div);
    });
    positionHeaderSearchContainer(container);
    container.classList.remove('hidden');
    container.setAttribute('aria-hidden', 'false');
}

function findTemplateTitleMatches(query, limit=8) {
    const q = query.toLowerCase().trim();
    const tokens = q.split(/\s+/).filter(Boolean);
    if (!tokens.length) return [];
    const results = [];
    for (const tpl of allTemplates) {
        const name = (tpl.name || '').toLowerCase();
        if (!name) continue;
        // Simple title match or token inclusion
        const match = tokens.every(tok => name.includes(tok));
        if (match) results.push(tpl);
        if (results.length >= limit) break;
    }
    return results;
}

function escapeHtml(s) { return (s+'').replace(/[&<>"]+/g, function(c){ return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]; }); }

// Initialize follow-up inputs for all dropdowns on page load
function initializeFollowupInputs() {
    document.querySelectorAll('select[id^="select_"]').forEach(selectEl => {
        const fieldId = selectEl.id;
        // Trigger handler for initially selected values
        handleFollowupInput(selectEl, fieldId);
    });
}

// ============================================================================
// RENDER TEMPLATE => MAIN BODY
// ============================================================================
function renderTemplateSections(tpl) {
    console.log("🎨 renderTemplateSections called with:", tpl);
    const root = document.getElementById("dynamicCoreSections");
    console.log("🎨 Root element:", root);
    
    root.innerHTML = "";
    // Add section button for admins
    if (window.isAdminMode) {
        const addSectionBtn = document.createElement('button');
        addSectionBtn.className = 'admin-only px-3 py-2 mb-4 bg-green-600 text-white text-sm rounded hover:bg-green-700';
        addSectionBtn.textContent = '+ Add Section';
        addSectionBtn.onclick = function() {
            const newSection = {
                id: `section_${Date.now()}`,
                label: '',
                title: '',
                fields: [],
                _clones: [[]],
                required: false
            };
            tpl.sections.push(newSection);
            renderTemplateSections(tpl);
            persistActiveTemplateChanges && persistActiveTemplateChanges();
        };
        root.appendChild(addSectionBtn);

        // Add section picker button
        const sectionPickerBtn = document.createElement('button');
        sectionPickerBtn.id = 'btnSectionPickerDynamic';
        sectionPickerBtn.className = 'admin-only px-3 py-2 mb-4 ml-2 bg-purple-600 text-white text-sm rounded hover:bg-purple-700';
        sectionPickerBtn.textContent = '+ Add Section from Other Template';
        sectionPickerBtn.onclick = function() {
            openSectionPickerModal();
        };
        root.appendChild(sectionPickerBtn);
    // Make '+ Create New Template' open section picker modal
    function showCreateTemplateGuide() {
        // Create a new blank template
        const newTemplate = {
            id: `created_${Date.now()}`,
            name: 'Untitled Template',
            file: `created_${Date.now()}.json`,
            program: 'General',
            imported: true,
            sections: []
        };
        allTemplates.push(newTemplate);
        activeTemplate = {
  ...newTemplate,
  sections: normalizeTemplateSections(newTemplate.sections || [])
};
        renderTemplateSections(activeTemplate);
        renderSidebarFromTemplate(activeTemplate);
        // Show guidance popup first
        document.getElementById('create_template_guide_backdrop').classList.remove('hidden');
        document.getElementById('create_template_guide').classList.remove('hidden');
    }

    function attachCreateTemplateListener() {
        const btnCreate = document.getElementById('btnCreateTemplate');
        if (btnCreate && !btnCreate._listenerAttached) {
            btnCreate.removeEventListener('click', showCreateTemplateGuide);
            btnCreate.addEventListener('click', function() {
                console.log('Clicked: + Create New Template');
                showCreateTemplateGuide();
            });
            btnCreate._listenerAttached = true;
        }
    }

    document.addEventListener('DOMContentLoaded', function() {
        attachCreateTemplateListener();
        window.closeCreateTemplateGuide = function() {
            console.log('Got it! button clicked - closing popup');
            document.getElementById('create_template_guide_backdrop').classList.add('hidden');
            document.getElementById('create_template_guide').classList.add('hidden');
            // Force section picker modal to show for testing
            document.getElementById('section_picker_modal_backdrop').classList.remove('hidden');
            document.getElementById('section_picker_modal').classList.remove('hidden');
            if (typeof openSectionPickerModal === 'function') {
                openSectionPickerModal();
            } else {
                console.warn('openSectionPickerModal is not defined');
            }
        };

        // MutationObserver to re-attach listener if button is re-rendered
        const observer = new MutationObserver(() => {
            attachCreateTemplateListener();
        });
        observer.observe(document.body, { childList: true, subtree: true });

        // Fallback: try every 500ms until attached
        let attachTries = 0;
        const intervalId = setInterval(() => {
            attachTries++;
            attachCreateTemplateListener();
            const btnCreate = document.getElementById('btnCreateTemplate');
            if (btnCreate && btnCreate._listenerAttached) {
                console.log('Listener attached after', attachTries, 'tries');
                clearInterval(intervalId);
            }
        }, 500);
    });
    }
// Section Picker Modal Logic
window.openSectionPickerModal = function() {
    document.getElementById('section_picker_modal_backdrop').classList.remove('hidden');
    document.getElementById('section_picker_modal').classList.remove('hidden');
    renderSectionPickerTemplates();
    document.getElementById('section_picker_confirm_msg').textContent = '';
};

window.closeSectionPickerModal = function() {
    document.getElementById('section_picker_modal_backdrop').classList.add('hidden');
    document.getElementById('section_picker_modal').classList.add('hidden');
};

function renderSectionPickerTemplates() {
    const dd = document.getElementById('section_picker_template_dd');
    dd.innerHTML = '<option value="">Select a template…</option>';
    allTemplates.forEach(tpl => {
        if (tpl === activeTemplate) return;
        dd.innerHTML += `<option value="${tpl.file}">${tpl.name} (${tpl.program})</option>`;
    });
    dd.onchange = function() {
        renderSectionPickerBrowser(dd.value);
    };
    // Blank section button
    document.getElementById('section_picker_blank_btn').onclick = function() {
        if (!activeTemplate) return;
        const newSection = {
            id: `section_${Date.now()}`,
            label: '',
            title: '',
            fields: [],
            _clones: [[]],
            required: false
        };
        activeTemplate.sections.push(newSection);
        renderTemplateSections(activeTemplate);
        persistActiveTemplateChanges && persistActiveTemplateChanges();
        document.getElementById('section_picker_confirm_msg').textContent = 'Blank section added.';
    };
    renderSectionPickerBrowser('');
}

function renderSectionPickerBrowser(templateFile) {
    const browser = document.getElementById('section_picker_browser');
    browser.innerHTML = '';
    if (!templateFile) return;
    const tpl = allTemplates.find(t => t.file === templateFile);
    if (!tpl || !tpl.sections) return;
    tpl.sections.forEach((sec, idx) => {
        const secTitle = sec.label || sec.title || `Section ${idx+1}`;
        const secPreview = (sec.fields || []).map(f => f.label || f.content || f.type).join(', ');
        const div = document.createElement('div');
        div.className = 'p-4 bg-white rounded shadow border border-slate-200';
        div.innerHTML = `<div class=\"font-bold text-slate-800 mb-1\">${secTitle}</div><div class=\"text-xs text-slate-500 mb-2\">Fields: ${secPreview}</div><button class=\"px-3 py-1 mr-2 rounded bg-blue-600 text-white text-xs\" onclick=\"previewSectionFromPicker('${tpl.file}',${idx})\">Preview</button><button class=\"px-3 py-1 rounded bg-green-600 text-white text-xs\" onclick=\"importSectionFromPicker('${tpl.file}',${idx})\">Import</button>`;
        browser.appendChild(div);
    });
}

window.previewSectionFromPicker = function(templateFile, sectionIdx) {
    const tpl = allTemplates.find(t => t.file === templateFile);
    if (!tpl || !tpl.sections || !tpl.sections[sectionIdx]) return;
    const sec = tpl.sections[sectionIdx];
    document.getElementById('section_preview_modal_backdrop').classList.remove('hidden');
    document.getElementById('section_preview_modal').classList.remove('hidden');
    const content = document.getElementById('section_preview_content');
    content.innerHTML = `<div class=\"font-bold text-lg mb-2\">${sec.label || sec.title || 'Untitled Section'}</div>`;
    (sec.fields || []).forEach(f => {
        content.innerHTML += `<div class=\"mb-2\"><span class=\"font-semibold\">${f.label || f.content || f.type}</span> <span class=\"text-xs text-slate-500\">(${f.type})</span></div>`;
    });
};

window.closeSectionPreviewModal = function() {
    document.getElementById('section_preview_modal_backdrop').classList.add('hidden');
    document.getElementById('section_preview_modal').classList.add('hidden');
};

window.importSectionFromPicker = function(templateFile, sectionIdx) {
    const tpl = allTemplates.find(t => t.file === templateFile);
    if (!tpl || !tpl.sections || !tpl.sections[sectionIdx]) return;
    const sectionToImport = JSON.parse(JSON.stringify(tpl.sections[sectionIdx]));
    if (activeTemplate && activeTemplate.sections) {
        activeTemplate.sections.push(sectionToImport);
        renderTemplateSections(activeTemplate);
        persistActiveTemplateChanges && persistActiveTemplateChanges();
        document.getElementById('section_picker_confirm_msg').textContent = 'Section imported. Undo available.';
        // Add to undo stack
        undoStack.push({
            action: 'importSection',
            sectionIndex: activeTemplate.sections.length - 1,
            section: sectionToImport
        });
    }
};

    console.log("🎨 Rendering", tpl.sections.length, "sections");
    
    tpl.sections.forEach((sec, index) => {
        const sectionTitle = sec.label || sec.title || "Untitled Section";
        const isCollapsed = collapsedSections.has(index);
        const arrow = isCollapsed ? '▸' : '▾';
        const requiredBadge = sec.required ? `<span class=\"ml-2 badge bg-red-50 text-red-600 border border-red-200 text-[10px]\">Required</span>` : '';

        const row = document.createElement('div');
        row.className = 'flex items-start gap-3';

        const card = document.createElement('section');
        card.id = `dynamic_${sec.id}`;
        card.className = 'section-card mb-4 flex-1';
        const sectionLabel = sec.sectionLabel || '';
        const adminLabelPillHTML = `<div class="section-label-pill admin-only" title="Admin: Section label"><input type="text" placeholder="Add label..." value="${sectionLabel}" onchange="updateSectionLabel(${index}, this.value)" onclick="event.stopPropagation()" /></div>`;
        const viewerLabelPillHTML = sectionLabel ? `<div class="section-label-pill non-admin-only" title="Section label">${sectionLabel}</div>` : '';

        // --- CLONEABLE GROUPS LOGIC ---
        if (!sec._clones) sec._clones = [JSON.parse(JSON.stringify(sec.fields))];
        function renderCloneGroup(fields, groupIdx) {
            // Alternating backgrounds
            const altBg = groupIdx % 2 === 0 ? 'clone-bg-a' : 'clone-bg-b';
            // Only show remove button for groups beyond the first
            const removeBtn = groupIdx > 0 ? `<button type=\"button\" class=\"clone-remove pill-btn pill-btn-red\" onclick=\"removeCloneGroup(${index},${groupIdx})\" title=\"Remove this group\">×</button>` : '';
            // Render all fields in the group as a single section
            return `<div class=\"clone-group ${altBg} animate-popin\" data-group=\"${groupIdx}\">${renderField({fields: fields}, index)}${removeBtn}</div>`;
        }
        let groupsHTML = sec._clones.map((fields, i) => renderCloneGroup(fields, i)).join('');

        // Hide clarification button for Short Description / Long Description sections
        const _secTitleRaw = sec.label || sec.title || '';
        const _hideClarBtn = /short descriptions?|long descriptions?/i.test(_secTitleRaw);
        const addClarBtnHTML = _hideClarBtn ? '' : `<div style="position:relative;"><button type=\"button\" class=\"pill-btn pill-btn-green\" style=\"position:absolute;right:0;bottom:-44px;z-index:2;\" onclick=\"addClarification(${index})\">+ Add Further Clarification</button></div>`;

        card.innerHTML = `
            ${adminLabelPillHTML}${viewerLabelPillHTML}
            <div class=\"flex items-center gap-2 mb-2\">
                <button class=\"collapse-toggle text-xs text-slate-600 hover:text-slate-800\" onclick=\"toggleSectionCollapse(${index})\" title=\"Collapse / Expand\"><span>${arrow}</span></button>
                <div>
                    <div class=\"section-label\">SECTION ${String(index+1).padStart(2,'0')}</div>
                    <h2 class=\"section-title flex items-center\">${sectionTitle} ${requiredBadge}</h2>
                </div>
            </div>
            <div class=\"section-body ${isCollapsed ? 'collapsed' : ''}\" id=\"section-body-${index}\">${groupsHTML}
                <!-- Removed '＋ Add Another' button: handled by 'repeatable' type -->
                <div id="clarification-container-${index}"></div>
                ${addClarBtnHTML}
            </div>
        `;
    // Add clarification logic
    window.addClarification = function(sectionIdx) {
        const container = document.getElementById(`clarification-container-${sectionIdx}`);
        if (container && !container.querySelector('textarea')) {
            const wrapper = document.createElement('div');
            wrapper.style.position = 'relative';
            wrapper.style.marginTop = '8px';
            const textarea = document.createElement('textarea');
            textarea.className = 'journal-input w-full mb-2';
            textarea.rows = 3;
            textarea.placeholder = 'Further Clarification...';
            const undoBtn = document.createElement('button');
            undoBtn.textContent = 'Undo';
            undoBtn.type = 'button';
            undoBtn.className = 'pill-btn pill-btn-red';
            undoBtn.style.position = 'absolute';
            undoBtn.style.right = '0';
            undoBtn.style.top = '-36px';
            undoBtn.onclick = async function() {
                const confirmed = await showConfirm('Remove Clarification', 'Are you sure you want to remove this clarification?');
                if (!confirmed) return;

                // Capture current value so we can restore on undo
                const prevText = textarea.value;

                // Animate out then remove
                try { wrapper.classList.add('animate-popout'); } catch (e) {}
                setTimeout(() => { try { wrapper.remove(); } catch (e) {} }, 260);

                // Offer undo via toast
                showUndoToast('Clarification removed', () => {
                    try {
                        // Only re-add if there's not already a clarification
                        const containerEl = document.getElementById(`clarification-container-${sectionIdx}`);
                        if (containerEl && !containerEl.querySelector('textarea')) {
                            // Re-create the clarification using the same helper
                            if (typeof window.addClarification === 'function') {
                                window.addClarification(sectionIdx);
                                // Set restored text and animate/focus for nicer UX
                                const newTa = containerEl.querySelector('textarea');
                                if (newTa) {
                                    newTa.value = prevText || '';
                                    // Small pop-in & focus
                                    try {
                                        const wrapper = newTa.parentElement;
                                        if (wrapper) wrapper.classList.add('animate-popin');
                                    } catch (e) {}
                                    try { newTa.focus(); } catch (e) {}
                                    // Brief highlight to draw attention
                                    try {
                                        const prevBg = newTa.style.background;
                                        newTa.style.transition = 'background 650ms ease';
                                        newTa.style.background = 'rgba(79,140,255,0.08)';
                                        setTimeout(() => { try { newTa.style.background = prevBg || ''; } catch (e) {} }, 700);
                                    } catch (e) {}
                                    showAnimatedMessage('Clarification restored');
                                }
                            }
                        }
                    } catch (e) { console.warn('Undo restore failed', e); }
                });
            };
            wrapper.appendChild(textarea);
            wrapper.appendChild(undoBtn);
            container.appendChild(wrapper);
        }
    };
// Admin controls column admincol'

        const adminCol = document.createElement('div');
        adminCol.className = 'admin-only section-admin-box';
        adminCol.innerHTML = `
            <div class=\"section-admin-controls\">
                <button class=\"section-admin-btn edit\" onclick=\"editSection(${index})\" title=\"Edit section title\">✏️ Edit Title</button>
                <button class=\"section-admin-btn move\" onclick=\"moveSection(${index}, -1)\" ${index===0?'disabled':''} title=\"Move up\">↑</button>
                <button class=\"section-admin-btn move\" onclick=\"moveSection(${index}, 1)\" ${index===tpl.sections.length-1?'disabled':''} title=\"Move down\">↓</button>
                <button class=\"section-admin-btn delete\" onclick=\"deleteSection(${index})\" title=\"Delete section\">🗑️ Delete</button>
                <button class=\"section-admin-btn json\" onclick=\"showSectionJSON(${index})\" title=\"Show section JSON\">🗂️ Show JSON</button>
            </div>
            <div class=\"section-admin-fieldbox\">
                <button class=\"section-admin-btn field\" onclick=\"toggleToolbox(${index})\" title=\"Add field\">🧰 Field</button>
                <div id=\"toolbox-${index}\" class=\"hidden section-admin-toolbox\">\n                    <button class=\"toolbox-btn\" onclick=\"addField(${index}, 'text')\">📝 Text Box</button>
                    <button class=\"toolbox-btn\" onclick=\"addField(${index}, 'textarea')\">📄 Text Area</button>
                    <button class=\"toolbox-btn\" onclick=\"addField(${index}, 'date')\">📅 Date Picker</button>
                    <button class=\"toolbox-btn\" onclick=\"addField(${index}, 'choice')\">☑️ Dropdown</button>
                    <button class=\"toolbox-btn\" onclick=\"addField(${index}, 'static-text')\">🗒️ Static Text</button>
                </div>
            </div>
        `;
    // Add global modal for JSON display if not present
    if (!document.getElementById('section-json-modal')) {
        const modal = document.createElement('div');
        modal.id = 'section-json-modal';
        modal.style.cssText = 'display:none;position:fixed;top:0;left:0;width:100vw;height:100vh;z-index:9999;background:rgba(0,0,0,0.25);';
        modal.innerHTML = `<div style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);background:#fff;padding:32px 24px 24px 24px;border-radius:16px;max-width:700px;width:90vw;box-shadow:0 8px 32px rgba(60,80,120,0.18);">
            <h2 style="font-size:1.3em;margin-bottom:12px;">Section JSON</h2>
            <div id="section-json-viewer">
                <pre id="section-json-content" style="background:#f6f7fa;padding:18px;border-radius:8px;max-height:400px;overflow:auto;font-size:14px;line-height:1.5;"></pre>
                <button id="section-json-edit-btn" style="margin-top:18px;padding:8px 22px;border-radius:8px;background:#f59e42;color:#fff;font-weight:600;font-size:15px;border:none;">Edit JSON</button>
            </div>
            <div id="section-json-editor" style="display:none;flex-direction:column;align-items:stretch;">
                <div style="display:flex;gap:8px;margin-bottom:6px;">
                    <button id="section-json-format-btn" style="padding:6px 16px;border-radius:8px;background:#3b82f6;color:#fff;font-weight:600;font-size:14px;border:none;">Format JSON</button>
                </div>
                <textarea id="section-json-textarea" style="width:100%;min-height:220px;background:#f6f7fa;padding:14px;border-radius:8px;font-size:14px;line-height:1.5;margin-bottom:10px;"></textarea>
                <div id="section-json-error" style="color:#b91c1c;font-size:13px;margin-bottom:8px;display:none;"></div>
                <div style="display:flex;gap:12px;align-items:center;">
                    <button id="section-json-save-btn" style="padding:8px 22px;border-radius:8px;background:#22c55e;color:#fff;font-weight:600;font-size:15px;border:none;">Save</button>
                    <button id="section-json-download-btn" style="padding:8px 18px;border-radius:8px;background:#0ea5a4;color:#fff;font-weight:600;font-size:14px;border:none;">Download JSON</button>
                    <button id="section-json-cancel-btn" style="padding:8px 22px;border-radius:8px;background:#64748b;color:#fff;font-weight:600;font-size:15px;border:none;">Cancel</button>
                </div>
            </div>
            <button onclick="document.getElementById('section-json-modal').style.display='none'" style="margin-top:18px;padding:8px 22px;border-radius:8px;background:#3b82f6;color:#fff;font-weight:600;font-size:15px;border:none;">Close</button>
        </div>`;
        document.body.appendChild(modal);
    }
    // Expose showSectionJSON globally
    window.showSectionJSON = function(sectionIndex) {
        const sec = activeTemplate.sections[sectionIndex];
        const jsonStr = JSON.stringify(sec, null, 2);
        const modal = document.getElementById('section-json-modal');
        const viewer = document.getElementById('section-json-viewer');
        const editor = document.getElementById('section-json-editor');
        const pre = document.getElementById('section-json-content');
        const textarea = document.getElementById('section-json-textarea');
        const errorDiv = document.getElementById('section-json-error');
        pre.textContent = jsonStr;
        viewer.style.display = '';
        editor.style.display = 'none';
        modal.style.display = 'block';
        // Edit button
        document.getElementById('section-json-edit-btn').onclick = function() {
            textarea.value = jsonStr;
            errorDiv.style.display = 'none';
            errorDiv.textContent = '';
            viewer.style.display = 'none';
            editor.style.display = 'flex';
        };
        // Cancel button
        document.getElementById('section-json-cancel-btn').onclick = function() {
            editor.style.display = 'none';
            viewer.style.display = '';
        };
        // Format JSON button
        document.getElementById('section-json-format-btn').onclick = function() {
            try {
                const val = textarea.value;
                const obj = JSON.parse(val);
                textarea.value = JSON.stringify(obj, null, 2);
                errorDiv.style.display = 'none';
                errorDiv.textContent = '';
            } catch (err) {
                errorDiv.textContent = 'Invalid JSON: ' + err.message;
                errorDiv.style.display = 'block';
            }
        };
        // Download button (export JSON to file)
        const downloadBtn = document.getElementById('section-json-download-btn');
        downloadBtn.onclick = function() {
            const content = editor.style.display === 'flex' ? textarea.value : pre.textContent;
            const blob = new Blob([content], {type: 'application/json'});
            const safeTemplateName = (activeTemplate && activeTemplate.file) ? activeTemplate.file.replace(/[^a-zA-Z0-9._-]/g,'_') : 'template';
            const filename = `${safeTemplateName}-section-${sectionIndex}.json`;
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = filename;
            document.body.appendChild(a);
            a.click();
            a.remove();
            URL.revokeObjectURL(url);
        };

        // Save button
        document.getElementById('section-json-save-btn').onclick = function() {
            let newVal = textarea.value;
            try {
                let newObj = JSON.parse(newVal);
                // Validate minimal structure
                if (!newObj || typeof newObj !== 'object' || !newObj.fields) throw new Error('Section JSON must have a fields array.');
                // Replace section in activeTemplate
                activeTemplate.sections[sectionIndex] = newObj;
                // Save to disk (if supported by your app logic)
                if (typeof persistActiveTemplateChanges === 'function') {
                    persistActiveTemplateChanges();
                }
                // Reload template from disk and update UI instantly
                const filePath = `templates/${activeTemplate.program}/${activeTemplate.file}`;
                fetch(filePath)
                    .then(r => {
                        if (!r.ok) throw new Error(`HTTP ${r.status} ${r.statusText}`);
                        return r.json();
                    })
                    .then(freshTemplate => {
                        // Replace entire activeTemplate object for full sync
                        Object.keys(freshTemplate).forEach(k => {
                            activeTemplate[k] = freshTemplate[k];
                        });
                        renderTemplateSections(activeTemplate);
                        renderSidebarFromTemplate(activeTemplate);
                        modal.style.display = 'none';
                        showSaveConfirmation();
                    })
                    .catch(err => {
                        console.warn('Could not reload template from disk after save:', err);
                        // Fallback: UI already updated in-memory; render from activeTemplate
                        renderTemplateSections(activeTemplate);
                        renderSidebarFromTemplate(activeTemplate);
                        // Keep modal open and show error so admin can download JSON to save manually
                        errorDiv.textContent = 'Saved in-memory, but could not reload from disk: ' + err.message + '. Use "Download JSON" to export and place it in the templates folder.';
                        errorDiv.style.display = 'block';
                        showSaveConfirmation();
                    });
            } catch (err) {
                errorDiv.textContent = 'Invalid JSON: ' + err.message;
                errorDiv.style.display = 'block';
            }
        };

        // Save confirmation animation/notification
        function showSaveConfirmation() {
            let notif = document.createElement('div');
            notif.className = 'save-confirmation-toast';
            notif.innerHTML = '<span>✔️ Changes saved</span>';
            notif.style.position = 'fixed';
            notif.style.top = '24px';
            notif.style.right = '24px';
            notif.style.background = '#4caf50';
            notif.style.color = 'white';
            notif.style.padding = '12px 24px';
            notif.style.borderRadius = '8px';
            notif.style.fontSize = '1.1em';
            notif.style.boxShadow = '0 2px 8px rgba(0,0,0,0.15)';
            notif.style.zIndex = '9999';
            notif.style.opacity = '0';
            notif.style.transition = 'opacity 0.3s';
            document.body.appendChild(notif);
            setTimeout(() => { notif.style.opacity = '1'; }, 10);
            setTimeout(() => {
                notif.style.opacity = '0';
                setTimeout(() => notif.remove(), 350);
            }, 1200);
        }
    };

        row.appendChild(card);
        row.appendChild(adminCol);
        root.appendChild(row);
    });

    // Add handlers for clone add/remove
    window.addCloneGroup = function(sectionIdx) {
        const sec = tpl.sections[sectionIdx];
        if (!sec._clones) sec._clones = [JSON.parse(JSON.stringify(sec.fields))];
        sec._clones.push(JSON.parse(JSON.stringify(sec.fields)));
        renderTemplateSections(tpl);
        // Animate the last group
        setTimeout(() => {
            const last = document.querySelector(`#section-body-${sectionIdx} .clone-group:last-child`);
            if (last) {
                last.classList.remove('animate-popout');
                last.classList.add('animate-popin');
            }
        }, 10);
    };
    window.removeCloneGroup = function(sectionIdx, groupIdx) {
        const sec = tpl.sections[sectionIdx];
        if (!sec._clones) return;
        if (sec._clones.length <= 1) return; // Always keep at least one group
        // Animate out, then remove
        const groupEl = document.querySelector(`#section-body-${sectionIdx} .clone-group[data-group='${groupIdx}']`);
        if (groupEl) {
            groupEl.classList.remove('animate-popin');
            groupEl.classList.add('animate-popout');
            setTimeout(() => {
                sec._clones.splice(groupIdx, 1);
                renderTemplateSections(tpl);
            }, 350);
        } else {
            sec._clones.splice(groupIdx, 1);
            renderTemplateSections(tpl);
        }
    };
    // --- CLONE GROUP STYLES & ANIMATION ---
    if (!document.getElementById('clone-group-css')) {
        const style = document.createElement('style');
        style.id = 'clone-group-css';
        style.textContent = `
        .clone-group { position: relative; margin-bottom: 18px; border-radius: 12px; border: 1.5px solid #e0e7ef; box-shadow: 0 2px 8px 0 rgba(60,80,120,0.04); padding: 18px 18px 18px 38px; transition: background 0.3s, box-shadow 0.3s, border 0.3s; }
        .clone-bg-a { background: #f8fafc; border-left: 5px solid #60a5fa; }
        .clone-bg-b { background: #f1f5f9; border-left: 5px solid #818cf8; }
        .clone-add, .clone-remove { margin-top: 10px; }
        .pill-btn { border-radius: 999px; padding: 6px 18px; font-size: 14px; font-weight: 600; border: none; cursor: pointer; transition: background 0.18s, color 0.18s, box-shadow 0.18s; box-shadow: 0 1px 4px rgba(60,80,120,0.07); }
        .pill-btn-blue { background: #3b82f6; color: #fff; }
        .pill-btn-blue:hover { background: #2563eb; }
        .pill-btn-red { background: #ef4444; color: #fff; }
        .pill-btn-red:hover { background: #b91c1c; }
        .clone-remove { position: absolute; top: 12px; right: 12px; font-size: 20px; line-height: 1; }
        .animate-popin { animation: popin 0.35s cubic-bezier(.5,1.8,.5,1) both; }
        .animate-popout { animation: popout 0.35s cubic-bezier(.5,1.8,.5,1) both; }
        @keyframes popin { 0% { opacity: 0; transform: scale(.92); } 80% { opacity: 1; transform: scale(1.04); } 100% { opacity: 1; transform: scale(1); } }
        @keyframes popout { 0% { opacity: 1; transform: scale(1); } 100% { opacity: 0; transform: scale(.85); } }
        /* Section admin box styles */
        .section-admin-box { min-width: 180px; max-width: 220px; background: #f6f7fa; border-radius: 12px; box-shadow: 0 2px 8px 0 rgba(60,80,120,0.04); padding: 18px 12px; margin-left: 12px; display: flex; flex-direction: column; align-items: flex-end; }
        .section-admin-controls { display: flex; flex-direction: column; gap: 10px; margin-bottom: 12px; }
        .section-admin-btn { display: block; width: 100%; padding: 8px 0; font-size: 15px; font-weight: 600; border-radius: 8px; border: none; margin-bottom: 4px; cursor: pointer; transition: background 0.18s, color 0.18s; }
        .section-admin-btn.edit { background: #ffe29e; color: #7c4d00; }
        .section-admin-btn.edit:hover { background: #ffd166; }
        .section-admin-btn.req { background: #e0d6ff; color: #5f3dc4; }
        .section-admin-btn.req:hover { background: #c7bfff; }
        .section-admin-btn.move { background: #e2e8f0; color: #334155; }
        .section-admin-btn.move:disabled { opacity: 0.5; cursor: not-allowed; }
        .section-admin-btn.delete { background: #ffb4b4; color: #b91c1c; }
        .section-admin-btn.delete:hover { background: #ff6b6b; }
        .section-admin-fieldbox { margin-top: 8px; width: 100%; }
        .section-admin-btn.field { background: #bde0fe; color: #1e3a8a; margin-bottom: 6px; }
        .section-admin-btn.field:hover { background: #90cdf4; }
        .section-admin-toolbox { background: #fff; border: 1px solid #e0e7ef; border-radius: 8px; box-shadow: 0 2px 8px 0 rgba(60,80,120,0.04); padding: 8px; margin-top: 6px; }
        .toolbox-btn { display: block; width: 100%; text-align: left; padding: 6px 0; font-size: 14px; border: none; background: none; color: #334155; border-radius: 6px; margin-bottom: 2px; cursor: pointer; transition: background 0.18s; }
        .toolbox-btn:hover { background: #e2e8f0; }
        `;
        document.head.appendChild(style);
    }
    
    console.log("🎨 Done rendering sections");
}

// FIELD RENDERER
// Handle follow-up text input when dropdown choice ends with colon
window.handleFollowupInput = function(selectEl, fieldId) {
    const selectedValue = selectEl.value;
    const followupContainer = document.getElementById(`${fieldId}_followup`);
    
    if (!followupContainer) return;
    
    // Check if selected option ends with colon
    if (selectedValue.trim().endsWith(':')) {
        // Show follow-up text input if not already present
        if (!followupContainer.querySelector('textarea')) {
            followupContainer.innerHTML = `
                <label class="text-xs text-slate-500 block mb-1">Please specify:</label>
                <textarea class="journal-input" rows="2" placeholder="Enter details..."></textarea>
            `;
        }
    } else {
        // Clear follow-up input
        followupContainer.innerHTML = '';
    }
};

function renderField(sec, sectionIndex) {
    // If section has fields array (like CF_SAR structure)
    if (sec.fields && Array.isArray(sec.fields)) {
        return sec.fields.map((f, fieldIndex) => {
            // Static text block for 'note' type only
            if (f.type === 'note') {
                // 2025-12-10 new (note support)
                const safeLabel = escapeHtml(f.label || '');
                const safeContent = escapeHtml(f.content || f.label || '');
                return `
                    <div class="mb-3">
                        <div class="journal-input p-3 rounded bg-slate-50 text-slate-700 text-base" data-type="note" data-label="${safeLabel}" data-content="${safeContent}">
                            ${safeContent}
                        </div>
                    </div>
                `;
            }
            const label = f.label || f.id || "";
            const adminToolbar = `
                <div class="admin-only flex gap-1 mb-1">
                    <button class="px-2 py-1 text-xs bg-amber-50 text-amber-700 border border-amber-200 rounded-full hover:bg-amber-100" onclick="editField(${sectionIndex}, ${fieldIndex})" title="Edit field">✏️ Edit</button>
                    <button class="px-2 py-1 text-xs bg-blue-50 text-blue-700 border border-blue-200 rounded-full hover:bg-blue-100" onclick="convertFieldType(${sectionIndex}, ${fieldIndex})" title="Convert type">🔄 Type</button>
                    <button class="px-2 py-1 text-xs bg-red-50 text-red-600 border border-red-200 rounded-full hover:bg-red-100" onclick="deleteField(${sectionIndex}, ${fieldIndex})" title="Delete">🗑️ Delete</button>
                </div>
            `;
            
            // Admin Note - visible to end users but highlighted
            if (f.type === "admin-note") {
                const noteContent = f.content || f.label || "";
                const color = f.color || 'blue';
                return `
                    <div class="mb-3">
                        ${adminToolbar}
                        <div class="p-3 bg-${color}-50 border-l-4 border-${color}-500 rounded">
                            <div class="text-xs font-semibold text-${color}-700 mb-1">📌 Admin Note</div>
                            <p class="text-sm text-${color}-900">${noteContent}</p>
                        </div>
                    </div>
                `;
            }
            
            if (f.type === "textarea" || f.type === "notes") {
                return `<div class="mb-3">${adminToolbar}<label class="text-xs text-slate-600 block mb-1">${label}</label><textarea class="journal-input" rows="3"></textarea></div>`;
            }
            if (f.type === "text") {
                return `<div class="mb-3">${adminToolbar}<label class="text-xs text-slate-600 block mb-1">${label}</label><input class="journal-input" type="text"></div>`;
            }
            if (f.type === "date") {
                return `<div class="mb-3">${adminToolbar}<label class="text-xs text-slate-600 block mb-1">${label}</label><input class="journal-input" type="date"></div>`;
            }
            if (f.type === "choice" && f.choices) {
                const selectId = `select_${sectionIndex}_${fieldIndex}`;
                // Render lazily: include a disabled placeholder and store choices in data-choices
                const safeChoices = JSON.stringify(f.choices || []).replace(/</g, '\\u003c');
                return `
                    <div class="mb-3">
                        ${adminToolbar}
                        <label class="text-xs text-slate-600 block mb-1">${label}</label>
                        <select id="${selectId}" class="journal-input" data-lazy="true" data-choices='${safeChoices}' onchange="handleFollowupInput(this, '${selectId}')">
                            <option value="" disabled selected>Choose an Option</option>
                        </select>
                        <div id="${selectId}_followup" class="followup-container mt-2"></div>
                    </div>
                `;
            }
            // Repeatable field renderer
            // PATCH — support both formats
            const subfields = Array.isArray(f.subfields) ? f.subfields :
                              Array.isArray(f.fields) ? f.fields : [];
            if (f.type === "repeatable") {
                const containerId = `repeatable_${sectionIndex}_${fieldIndex}`;
                const listId = `${containerId}_list`;

                function renderSubfields() {
                    return subfields.map(sf => {
                        // Ensure safe label/id values for embedding
                        const lbl = (sf.label || '').toString();
                        const fid = (sf.id || '').toString();

                        if (sf.type === "text") {
                            return `<input class=\"journal-input\" type=\"text\" placeholder=\"${escapeHtml(lbl)}\" data-label=\"${escapeHtml(lbl)}\" data-field-id=\"${escapeHtml(fid)}\">`;
                        }
                        if (sf.type === "choice" && sf.choices) {
                            // Lazy select for repeatable subfield
                            const safe = JSON.stringify(sf.choices || []).replace(/</g, '\\u003c');
                            return `<select class=\"journal-input\" data-lazy=\"true\" data-choices='${safe}' data-label=\"${escapeHtml(lbl)}\" data-field-id=\"${escapeHtml(fid)}\"><option value=\"\" disabled selected>Choose an Option</option></select>`;
                        }
                        return '';
                    }).join('');
                }

                setTimeout(() => {
                    if (!window._repeatableHandlers) window._repeatableHandlers = {};
                    if (!window._repeatableHandlers[containerId]) {
                        window._repeatableHandlers[containerId] = true;

                        const container = document.getElementById(containerId);
                        const list = document.getElementById(listId);

                        function renumber() {
                            Array.from(list.children).forEach((row, idx) => {
                                const num = row.querySelector('.repeatable-number');
                                if (num) num.textContent = (idx + 1) + '.';
                            });
                        }

                        function addRow() {
                            const row = document.createElement('div');
                            row.className = 'repeatable-row';
                            row.innerHTML = `
                                <span class=\"repeatable-number\">1.</span>
                                <div class=\"repeatable-inner\">${renderSubfields()}</div>
                                <button class=\"repeatable-del\" title=\"Remove\">×</button>
                            `;
                            row.querySelector('.repeatable-del').onclick = () => {
                                row.remove();
                                renumber();
                            };
                            list.appendChild(row);
                            renumber();
                            // Ensure any lazy-selects inside the newly added row are wired and populated
                            try {
                                setupLazySelects(row);
                                const lazySelects = row.querySelectorAll('select[data-lazy="true"]');
                                lazySelects.forEach(s => lazyPopulateSelect(s));
                            } catch (e) {
                                console.warn('Lazy-init for repeatable row failed', e);
                            }
                        }

                        if (list.children.length === 0) addRow();

                        const addBtn = container.querySelector('.repeatable-add');
                        addBtn.onclick = addRow;
                    }
                }, 0);

                return `
                    <div class=\"repeatable-container\" id=\"${containerId}\">\n${adminToolbar}
                        <label class=\"text-xs text-slate-600 block mb-1\">${label}</label>
                        <div class=\"repeatable-list\" id=\"${listId}\"></div>
                        <button type=\"button\" class=\"repeatable-add\">+ Add ${label}</button>
                    </div>
                `;
            }
            return "";
        // Inject minimal CSS for repeatable layout if not present
        if (!document.getElementById('repeatable-css')) {
            const style = document.createElement('style');
            style.id = 'repeatable-css';
            style.textContent = `
            .repeatable-container {
                margin-top: 18px;
                background: #f7fafc;
                border: 1.5px solid #d1e3f8;
                border-radius: 14px;
                box-shadow: 0 2px 8px rgba(60, 120, 180, 0.07);
                padding: 18px 16px 38px 16px;
                position: relative;
                transition: box-shadow 0.2s;
            }
            .repeatable-container:hover {
                box-shadow: 0 4px 16px rgba(60, 120, 180, 0.13);
            }
            .repeatable-list { display: flex; flex-direction: column; gap: 10px; }
            .repeatable-row { display: flex; align-items: center; gap: 10px; }
            .repeatable-number { width: 24px; font-weight: bold; color: #4f8cff; }
            .repeatable-inner { flex: 1; display: flex; flex-direction: column; gap: 6px; }
            .repeatable-del { background: transparent; border: none; color: #900; font-size: 20px; cursor: pointer; }
            .repeatable-add {
                position: absolute;
                right: 18px;
                bottom: 12px;
                background: linear-gradient(90deg, #4f8cff 0%, #6ad1e3 100%);
                color: #fff;
                border: none;
                border-radius: 999px;
                padding: 7px 22px;
                font-size: 1rem;
                font-weight: 600;
                box-shadow: 0 2px 8px rgba(60, 120, 180, 0.10);
                cursor: pointer;
                transition: background 0.2s, box-shadow 0.2s;
                z-index: 2;
            }
            .repeatable-add:hover {
                background: linear-gradient(90deg, #6ad1e3 0%, #4f8cff 100%);
                box-shadow: 0 4px 16px rgba(60, 120, 180, 0.18);
            }
            /* Clarification pill button distinct style */
            .pill-btn-green {
                background: linear-gradient(90deg, #ffb347 0%, #ffcc80 100%);
                color: #333;
                border: none;
                border-radius: 999px;
                padding: 8px 24px;
                font-size: 1rem;
                font-weight: 600;
                box-shadow: 0 2px 8px rgba(255, 180, 71, 0.10);
                cursor: pointer;
                transition: background 0.2s, box-shadow 0.2s;
                z-index: 3;
            }
            .pill-btn-green:hover {
                background: linear-gradient(90deg, #ffcc80 0%, #ffb347 100%);
                box-shadow: 0 4px 16px rgba(255, 180, 71, 0.18);
            }
            `;
            document.head.appendChild(style);
        }
        }).join("");
    }
    
    // Original single-field rendering (like CF_Application structure)
    if (sec.type === "notes") {
        return `<textarea class="journal-input" rows="4" placeholder="${sec.label || sec.title}"></textarea>`;
    }

    if (sec.type === "text") {
        return `<input class="journal-input" type="text" placeholder="${sec.label || sec.title}">`;
    }

    if (sec.type === "date") {
        return `<input class="journal-input" type="date">`;
    }

    if (sec.type === "choice") {
        return `
        <select class="journal-input">
            ${sec.choices.map(c => `<option>${c}</option>`).join("")}
        </select>`;
    }

    if (sec.type === "group") {
        return sec.fields
            .map(f => `<div class="mb-2">${renderField(f)}</div>`)
            .join("");
    }

    if (sec.type === "repeat") {
        return `
            <div class="text-xs text-slate-500 mb-1">(Repeatable section)</div>
            ${sec.fields.map(f => renderField(f)).join("")}
        `;
    }

    return "";
}

// ============================================================================
// SIDEBAR SYNC
// ============================================================================
function renderSidebarFromTemplate(tpl) {
    const nav = document.querySelector("aside nav");
    nav.innerHTML = "";

    // Limit visible sidebar items to avoid overwhelming the user
    // Configurable maximum (10-15 recommended). Update value as needed.
    const SIDEBAR_MAX_ITEMS = 12;

    tpl.sections.forEach((sec, index) => {
        const btn = document.createElement("button");
        btn.className = "sidebar-item";
        btn.setAttribute("data-target", `dynamic_${sec.id}`);

        const sectionTitle = sec.label || sec.title || "Untitled";

        const number = String(index+1).padStart(2,"0");
        btn.setAttribute('title', sectionTitle);
        btn.innerHTML = `
            <span class="sidebar-number">${number}</span>
            <span class="sidebar-title">${sectionTitle}</span>
        `;
        btn.addEventListener('click', () => {
            const target = document.getElementById(`dynamic_${sec.id}`);
            if (target) {
                target.scrollIntoView({behavior:'smooth', block:'start'});
                // highlight
                document.querySelectorAll('.section-card').forEach(c => c.classList.remove('active'));
                target.classList.add('active');
            }
            document.querySelectorAll('.sidebar-item').forEach(x => x.classList.remove('sidebar-item-active'));
            btn.classList.add('sidebar-item-active');
        });
        nav.appendChild(btn);
    });

    // After items are rendered, compute reasonable maxHeight so only ~SIDEBAR_MAX_ITEMS
    // are visible while keeping scroll enabled.
    try {
        const first = nav.querySelector('.sidebar-item');
        const itemHeight = first ? Math.ceil(first.getBoundingClientRect().height) : 40;
        const computedMax = (itemHeight * SIDEBAR_MAX_ITEMS) + 'px';
        nav.style.maxHeight = computedMax;
        nav.style.overflowY = 'auto';
        // Ensure sidebar keeps a consistent visual width across browser zoom levels
        if (typeof ensureKeepSidebarSizeInitialized === 'function') ensureKeepSidebarSizeInitialized();
    } catch (e) {
        // Fallback: keep existing behavior
        nav.style.maxHeight = '';
    }
}

// Keep the left sidebar visually the same size even when the browser zoom level changes.
// Note: this uses an inverse CSS scale + width compensation technique. It cannot
// override OS/browser-level accessibility zoom, but it maintains a consistent
// visual width for the sidebar within the page.
let _sidebarKeepInit = false;
let _sidebarBaseWidth = null;
function ensureKeepSidebarSizeInitialized() {
    const nav = document.querySelector('aside nav');
    if (!nav) return;
    if (_sidebarKeepInit) return;
    _sidebarKeepInit = true;

    // Record the base (unscaled) width once when first initialized.
    _sidebarBaseWidth = Math.max(1, Math.round(nav.getBoundingClientRect().width || 240));
    nav.style.willChange = 'transform';

    function adjustSidebarForZoom() {
        try {
            const vv = window.visualViewport;
            // Prefer visualViewport.scale when available, otherwise devicePixelRatio
            const scale = (vv && typeof vv.scale === 'number') ? vv.scale : (window.devicePixelRatio || 1);
            const inv = 1 / (scale || 1);

            nav.style.transformOrigin = '0 0';
            nav.style.transform = `scale(${inv})`;
            // Compensate width so visual width stays equal to the original base width
            nav.style.width = Math.ceil(_sidebarBaseWidth * (scale || 1)) + 'px';
        } catch (err) {
            // swallow
        }
    }

    // Initial adjust
    adjustSidebarForZoom();

    // Listen for viewport/resize changes and adjust
    window.addEventListener('resize', adjustSidebarForZoom, { passive: true });
    if (window.visualViewport) window.visualViewport.addEventListener('resize', adjustSidebarForZoom, { passive: true });
    window.addEventListener('orientationchange', adjustSidebarForZoom, { passive: true });

    // Fallback poll for devicePixelRatio changes on browsers that don't fire other events
    let lastDPR = window.devicePixelRatio;
    const dprPoll = setInterval(() => {
        if (window.devicePixelRatio !== lastDPR) {
            lastDPR = window.devicePixelRatio;
            adjustSidebarForZoom();
        }
    }, 500);

    // If the app wants to clean up later, it can clear this interval.
}

// Show placeholders when no template selected
function showPlaceholders() {
    const nav = document.querySelector("aside nav");
    nav.innerHTML = `
        <div class="text-center py-8 text-slate-400">
            <svg class="w-12 h-12 mx-auto mb-3 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <p class="text-sm font-medium">Select a template</p>
            <p class="text-xs mt-1">Choose from the filters above</p>
        </div>
    `;
    
    const root = document.getElementById("dynamicCoreSections");
    root.innerHTML = `
        <div class="section-card text-center py-16">
            <svg class="w-16 h-16 mx-auto mb-4 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <h3 class="text-lg font-semibold text-slate-700 mb-2">No Template Selected</h3>
            <p class="text-sm text-slate-500 mb-4">Use the filters above to select a template</p>
            <div class="text-xs text-slate-400">
                <p>💡 Tip: Filter by Program → Scenario → Template Name</p>
            </div>
        </div>
    `;
    
    // Hide static sections
    document.querySelectorAll("#section-income, #section-property, #section-notes, #section-tasks, #section-files").forEach(sec => {
        sec.classList.add("hidden");
    });
    // Hide journal controls when no template is selected
    try { const jc = document.getElementById('journalControls'); if (jc) jc.style.display = 'none'; } catch (e) {}
}

// Toggle visibility of sidebar journal controls based on whether a template is selected.
function updateSidebarControlsVisibility() {
    try {
        const visible = !!activeTemplate;
        const jc = document.getElementById('journalControls');
        if (jc) jc.style.display = visible ? 'flex' : 'none';
    } catch (e) {
        console.warn('updateSidebarControlsVisibility failed', e);
    }
}

// ============================================================================
// SIDEBAR NAVIGATION
// ============================================================================
function initSidebarNavigation() { /* replaced by inline listeners in renderSidebarFromTemplate */ }

// ============================================================================
// DARK MODE / ADMIN
// ============================================================================
function initDarkMode() {
    document.getElementById("btnThemeToggle").addEventListener("click", () => {
        document.body.classList.toggle("dark-mode");
    });
}

function initAdminMode() {
    document.getElementById("btnAdminToggle").addEventListener("click", async () => {
        const wasOn = document.body.classList.contains('admin-mode');
        const on = document.body.classList.toggle("admin-mode");
        document.getElementById("btnAdminToggle").textContent = on ? "Admin: ON" : "Admin: OFF";
        
        if (on && !wasOn) {
            // Entering admin mode - capture original state
            if (activeTemplate) {
                originalTemplateState = deepClone(activeTemplate);
                console.log('💾 Captured original template state');
            }
        } else if (!on && wasOn) {
            // Exiting admin mode - offer to undo changes
            if (activeTemplate && originalTemplateState && changeLog.length > 0) {
                const confirmed = await showConfirm(
                    'Revert Changes?',
                    `You made ${changeLog.length} change(s) in admin mode. Do you want to revert all changes back to the original state?`
                );
                
                if (confirmed) {
                    // Restore original template state
                    activeTemplate.sections = deepClone(originalTemplateState.sections);
                    if (originalTemplateState.label) activeTemplate.label = originalTemplateState.label;
                    if (originalTemplateState.title) activeTemplate.title = originalTemplateState.title;
                    
                    // Save the reverted state
                    persistActiveTemplateChanges();
                    
                    // Re-render
                    renderTemplateSections(activeTemplate);
                    renderSidebarFromTemplate(activeTemplate);
                    
                    // Clear change log and hide indicators
                    changeLog = [];
                    updateChangeTracker();
                    hideChangeTracker();
                    
                    const publishBtn = document.getElementById('publishBtn');
                    if (publishBtn) publishBtn.classList.remove('visible', 'pulsing');
                    
                    console.log('↩️ Reverted to original template state');
                }
            }
            // Clear original state when exiting admin mode
            originalTemplateState = null;
        }
        
        applyAdminVisibility();
    });
}

function applyAdminVisibility() {
    const isOn = document.body.classList.contains('admin-mode');
    document.querySelectorAll('.admin-only').forEach(el => {
        if (isOn) el.classList.remove('hidden'); else el.classList.add('hidden');
    });
}

// ============================================================================
// JOURNAL POPUP
// ============================================================================
function initGenerateJournal() {
    const btn = document.getElementById("generate_journal_btn");
    const modal = document.getElementById("journal_output_container");
    const backdrop = document.getElementById("journal_modal_backdrop");

    btn.onclick = () => {
        // Build and inject output
        const output = buildJournalOutput();
        const ta = document.getElementById('journal_output');
        if (ta) ta.value = output;
        // Enable copy/download buttons
        const copyBtn = document.getElementById('copy_journal_btn');
        const dlBtn = document.getElementById('download_journal_btn');
        if (copyBtn) copyBtn.disabled = false;
        if (dlBtn) dlBtn.disabled = false;
        modal.classList.remove("hidden");
        backdrop.classList.remove("hidden");
    };

    // Copy to clipboard
    document.getElementById('copy_journal_btn').onclick = () => {
        const ta = document.getElementById('journal_output');
        if (ta) {
            ta.select();
            document.execCommand('copy');
        }
    };
    // Download as text file
    document.getElementById('download_journal_btn').onclick = () => {
        const ta = document.getElementById('journal_output');
        if (ta) {
            const blob = new Blob([ta.value || ''], {type: 'text/plain'});
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'journal.txt';
            document.body.appendChild(a);
            a.click();
            setTimeout(() => { document.body.removeChild(a); URL.revokeObjectURL(url); }, 100);
        }
    };

    function close() {
        modal.classList.add("hidden");
        backdrop.classList.add("hidden");
    }

    document.getElementById("journal_modal_close").onclick = close;
    document.getElementById("journal_modal_close_footer").onclick = close;
    backdrop.onclick = close;
}

// ============================================================================
// TEMPLATE EXPORT
// ============================================================================
function initTemplateExport() {
    const btn = document.getElementById('btnExportTemplate');
    if (!btn) return;
    btn.addEventListener('click', () => {
        if (!activeTemplate) {
            alert('No active template to export.');
            return;
        }
        persistActiveTemplateChanges(); // ensure latest state saved
        const data = deepClone(activeTemplate);
        const blob = new Blob([JSON.stringify(data, null, 2)], {type: 'application/json'});
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        const ts = new Date().toISOString().replace(/[:.]/g,'-');
        a.download = `${data.file.replace(/\.json$/,'')}-modified-${ts}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        console.log('📤 Exported template JSON:', a.download);
    });
}

// ============================================================================
// CLEAR VALUES (UI-only reset of form inputs)
// ============================================================================
async function clearAllFieldValues() {
    const root = document.getElementById('dynamicCoreSections');
    if (!root) return;
    const ok = await showConfirm('Reset All Values', 'Reset all entered field values to blank/default? This cannot be undone.');
    if (!ok) return;

    // Clear inputs and textareas
    const inputs = root.querySelectorAll('input.journal-input, textarea.journal-input');
    inputs.forEach(inp => {
        try {
            if (inp.type === 'checkbox' || inp.type === 'radio') {
                inp.checked = false;
            } else {
                inp.value = '';
            }
        } catch (e) { /* ignore */ }
    });

    // Reset selects — restore lazy placeholder state when possible
    const selects = root.querySelectorAll('select.journal-input');
    selects.forEach(sel => {
        try {
            const hasLazy = sel.getAttribute('data-lazy') === 'true' || sel.hasAttribute('data-choices');
            if (hasLazy) {
                // Restore to single placeholder option and mark as not populated
                sel.innerHTML = '<option value="" disabled selected>Choose an Option</option>';
                // Remove runtime-populated marker so lazyPopulateSelect can run again
                if (sel.dataset) delete sel.dataset._populated;
                // Also remove any attached flag so setupLazySelects can reattach listeners
                try { sel._lazyAttached = false; } catch (e) {}
            } else if (sel.options && sel.options.length) {
                // Non-lazy selects: prefer empty-valued option or reset to first
                let foundEmpty = false;
                for (let i = 0; i < sel.options.length; i++) {
                    if (sel.options[i].value === '' || sel.options[i].text.trim() === 'Choose an Option') {
                        sel.selectedIndex = i;
                        foundEmpty = true;
                        break;
                    }
                }
                if (!foundEmpty) sel.selectedIndex = 0;
            }
        } catch (e) { /* ignore */ }
    });

    // Re-setup lazy-select handlers for the template area so selects will populate on first interaction
    try { setupLazySelects(root); } catch (e) { /* ignore */ }

    // Reset repeatable lists to a single initial row
    const repeatables = root.querySelectorAll('.repeatable-container');
    repeatables.forEach(container => {
        try {
            const list = container.querySelector('.repeatable-list');
            const addBtn = container.querySelector('.repeatable-add');
            if (list) {
                // Remove all rows
                list.innerHTML = '';
                // Add one row using existing add handler (if present)
                if (addBtn) {
                    addBtn.click();
                } else {
                    // If addBtn not wired yet, attempt to create a single empty row
                    const placeholderRow = document.createElement('div');
                    placeholderRow.className = 'repeatable-row';
                    placeholderRow.innerHTML = '<span class="repeatable-number">1.</span><div class="repeatable-inner"></div><button class="repeatable-del" title="Remove">×</button>';
                    list.appendChild(placeholderRow);
                }
            }
        } catch (e) { console.warn('Failed to reset repeatable container', e); }
    });

    // Collapse extra clone groups, keep the first group only
    const sections = root.querySelectorAll('.section-card');
    sections.forEach(sec => {
        try {
            const groups = sec.querySelectorAll('.clone-group');
            groups.forEach((g, idx) => { if (idx > 0) g.remove(); });
        } catch (e) { /* ignore */ }
    });

    showAnimatedMessage('All field values have been cleared.');
}

function initClearValuesButton() {
    const btn = document.getElementById('btnClearValues');
    if (!btn) return;
    btn.addEventListener('click', clearAllFieldValues);
}

// ============================================================================
// TEMPLATE UPLOAD - COMPREHENSIVE IMPLEMENTATION
// ============================================================================
function initUploadTemplate() {
    const btn = document.getElementById('btnUploadTemplate');
    const input = document.getElementById('uploadTemplateInput');
    if (!btn || !input) return;
    
    btn.addEventListener('click', () => {
        const isAdminMode = document.body.classList.contains('admin-mode');
        if (!isAdminMode) {
            alert('Enable Admin Mode to upload templates.');
            return;
        }
        input.click();
    });
    
    input.addEventListener('change', async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        
        const ext = file.name.split('.').pop().toLowerCase();
        
        try {
            if (ext === 'json') {
                await handleJSONTemplateUpload(file);
            } else if (ext === 'docx') {
                await handleDocxTemplateUpload(file);
            } else if (ext === 'doc') {
                await handleDocTemplateUpload(file);
            } else if (ext === 'rtf') {
                await handleRTFTemplateUpload(file);
            } else if (ext === 'txt') {
                await handleTXTTemplateUpload(file);
            } else {
                alert('Unsupported file type. Please upload .json, .docx, .doc, .rtf, or .txt files.');
            }
        } catch (err) {
            console.error('Upload failed:', err);
            alert('Upload failed: ' + err.message);
        }
        
        // Reset input
        input.value = '';
    });
}

async function handleJSONTemplateUpload(file) {
    const text = await file.text();
    const template = JSON.parse(text);
    
    // Validate template structure
    if (!template.name || !template.sections || !Array.isArray(template.sections)) {
        throw new Error('Invalid template structure. Must have "name" and "sections" array.');
    }
    
    // Generate unique ID and file name
    const id = template.id || `uploaded_${Date.now()}`;
    const fileName = template.file || `${id}.json`;
    
    template.id = id;
    template.file = fileName;
    template.program = template.program || 'General';
    template.imported = true;
    
    // Add to runtime
    addTemplateToRuntime(template);
    
    console.log('✅ JSON template uploaded:', template.name);
}

// Extract dropdown/combobox content controls from DOCX XML
async function extractDocxDropdowns(arrayBuffer) {
    try {
        if (typeof JSZip === 'undefined') {
            console.warn('JSZip not loaded, skipping dropdown extraction');
            return [];
        }
        
        const zip = await JSZip.loadAsync(arrayBuffer);
        const docXml = await zip.file('word/document.xml')?.async('text');
        if (!docXml) return [];

        const parser = new DOMParser();
        const xmlDoc = parser.parseFromString(docXml, 'application/xml');
        const dropdowns = [];

        // Find all structured document tags (w:sdt)
        const sdtNodes = xmlDoc.getElementsByTagName('w:sdt');
        
        for (let i = 0; i < sdtNodes.length; i++) {
            const sdt = sdtNodes[i];
            const sdtPr = sdt.getElementsByTagName('w:sdtPr')[0];
            if (!sdtPr) continue;

            // Check for dropdown or combobox
            const dropDownList = sdtPr.getElementsByTagName('w:dropDownList')[0];
            const comboBox = sdtPr.getElementsByTagName('w:comboBox')[0];
            const controlNode = dropDownList || comboBox;
            
            if (!controlNode) continue;

            // Extract label from alias or placeholder text
            let label = 'Select:';
            const aliasNode = sdtPr.getElementsByTagName('w:alias')[0];
            if (aliasNode) {
                label = aliasNode.getAttribute('w:val') || label;
            } else {
                const placeholderNode = sdtPr.getElementsByTagName('w:placeholder')[0];
                if (placeholderNode) {
                    const docPartNode = placeholderNode.getElementsByTagName('w:docPart')[0];
                    if (docPartNode) {
                        label = docPartNode.getAttribute('w:val') || label;
                    }
                }
            }

            // Extract choices from listItem nodes
            const listItems = controlNode.getElementsByTagName('w:listItem');
            const choices = [];
            for (let j = 0; j < listItems.length; j++) {
                const displayText = listItems[j].getAttribute('w:displayText');
                if (displayText && !isPlaceholderText(displayText)) {
                    choices.push(displayText);
                }
            }

            if (choices.length >= 2) {
                dropdowns.push({ label, choices });
            }
        }

        return dropdowns;
    } catch (err) {
        console.error('Dropdown extraction failed:', err);
        return [];
    }
}
// ============================================================================
// DOCX HTML CLEANER (RESTORED)
// ============================================================================
// original-style sanitizer to remove junk markup before conversion
function cleanDocxHTML(html) {
    if (!html || typeof html !== 'string') return '';

    return html
        // remove empty paragraphs
        .replace(/<p>\s*<\/p>/gi, '')
        // remove Word-specific spans
        .replace(/<span[^>]*>\s*<\/span>/gi, '')
        // normalize whitespace
        .replace(/\s+/g, ' ')
        .trim();
}

async function handleDocxTemplateUpload(file) {
    const arrayBuffer = await file.arrayBuffer();
    
    if (typeof mammoth === 'undefined') {
        throw new Error('DOCX parsing library not loaded. Please refresh the page.');
    }
    
    // Extract dropdown controls from DOCX XML
    const dropdowns = await extractDocxDropdowns(arrayBuffer);
    
    // Parse DOCX using mammoth with HTML output for better structure detection
    const result = await mammoth.convertToHtml({arrayBuffer: arrayBuffer});
    const html = result.value;
    
    if (!html || html.trim().length === 0) {
        throw new Error('DOCX file is empty or could not be parsed.');
    }

    // Clean placeholder / boilerplate text before converting to template structure
    const cleanedHTML = cleanDocxHTML(html);
    const template = convertHTMLToTemplate(cleanedHTML, file.name.replace(/\.docx$/i, ''), dropdowns);
    
    addTemplateToRuntime(template);
    
    console.log('✅ DOCX template uploaded and converted:', template.name);
    console.log('📋 Extracted', dropdowns.length, 'dropdown controls');
}

async function handleDocTemplateUpload(file) {
    // DOC files are binary and complex - attempt text extraction
    const text = await file.text();
    
    // Try to extract readable text (DOC files contain lots of binary)
    // Filter out non-printable characters
    const cleanText = text.replace(/[\x00-\x08\x0B-\x0C\x0E-\x1F\x7F-\x9F]/g, ' ')
                          .replace(/\s+/g, ' ')
                          .trim();
    
    if (!cleanText || cleanText.length < 10) {
        throw new Error('DOC file could not be parsed. Please save as .docx or .txt instead.');
    }
    
    // Convert to template using text parser
    const template = convertTextToTemplate(cleanText, file.name.replace(/\.doc$/i, ''));
    
    addTemplateToRuntime(template);
    
    console.log('✅ DOC template uploaded and converted:', template.name);
}

async function handleRTFTemplateUpload(file) {
    const arrayBuffer = await file.arrayBuffer();
    
    if (typeof RTFJS === 'undefined') {
        // Fallback to text extraction
        const text = await file.text();
        const cleanText = text.replace(/\\[a-z]+\d* ?/g, '') // Remove RTF commands
                              .replace(/[{}]/g, '')
                              .replace(/\s+/g, ' ')
                              .trim();
        
        const template = convertTextToTemplate(cleanText, file.name.replace(/\.rtf$/i, ''));
        addTemplateToRuntime(template);
        console.log('✅ RTF template uploaded (text mode):', template.name);
        return;
    }
    
    // Use RTF.js to parse
    const doc = new RTFJS.Document(arrayBuffer);
    const html = await doc.render();
    
    const template = convertHTMLToTemplate(html.outerHTML, file.name.replace(/\.rtf$/i, ''));
    
    addTemplateToRuntime(template);
    
    console.log('✅ RTF template uploaded and converted:', template.name);
}

async function handleTXTTemplateUpload(file) {
    const text = await file.text();
    
    if (!text || text.trim().length === 0) {
        throw new Error('TXT file is empty.');
    }
    
    const template = convertTextToTemplate(text, file.name.replace(/\.txt$/i, ''));
    
    addTemplateToRuntime(template);
    
    console.log('✅ TXT template uploaded and converted:', template.name);
}

// ============================================================================
// CONVERSION UTILITIES
// ============================================================================
function convertHTMLToTemplate(html, name, dropdowns = []) {
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = html;
    
    const sections = [];
    let currentSection = null;
    let dropdownIndex = 0; // Track which dropdown to insert next
    
    // Process all elements
    const elements = tempDiv.querySelectorAll('h1, h2, h3, h4, h5, h6, p, strong, ul, ol');
    
    elements.forEach((el, idx) => {
        let text = el.textContent.trim();
        if (!text) return;
        if (isPlaceholderText(text)) return; // skip placeholder lines entirely

        // Strip embedded placeholder segments from longer lines
        [...EXACT_PLACEHOLDER_PHRASES, ...PLACEHOLDER_BLOCKLIST].forEach(term => {
            const re = new RegExp(term.replace(/[-/\\^$*+?.()|[\]{}]/g,'\\$&'), 'ig');
            text = text.replace(re, ' ').trim();
        });
        if (!text) return;

        // Handle list blocks (ul/ol) as a single choice field
        if (el.tagName === 'UL' || el.tagName === 'OL') {
            const items = Array.from(el.querySelectorAll('li'))
                .map(li => li.textContent.trim())
                .filter(liText => liText && !isPlaceholderText(liText));
            const filtered = items.map(it => {
                let t = it;
                [...EXACT_PLACEHOLDER_PHRASES, ...PLACEHOLDER_BLOCKLIST].forEach(term => {
                    const re = new RegExp(term.replace(/[-/\\^$*+?.()|[\]{}]/g,'\\$&'), 'ig');
                    t = t.replace(re, ' ').trim();
                });
                return t;
            }).filter(t => t);
            if (filtered.length >= 2 && currentSection) {
                currentSection.fields.push({
                    id: `field_${currentSection.fields.length + 1}`,
                    label: 'Select an option',
                    type: 'choice',
                    choices: filtered
                });
            }
            return; // done with list element
        }

        const isHeading = /^H[1-6]$/.test(el.tagName);
        const isStrong = el.tagName === 'STRONG';
        const isShort = text.length < 60;

        if (isHeading || (isStrong && isShort) || idx === 0) {
            if (currentSection && currentSection.fields.length > 0) {
                sections.push(currentSection);
            }
            currentSection = {
                id: `section_${sections.length + 1}`,
                title: text,
                fields: []
            };
        } else if (currentSection) {
            // Check if we have a pending dropdown to insert
            if (dropdownIndex < dropdowns.length) {
                const dropdown = dropdowns[dropdownIndex];
                currentSection.fields.push({
                    id: `field_${currentSection.fields.length + 1}`,
                    label: dropdown.label,
                    type: 'choice',
                    choices: dropdown.choices
                });
                dropdownIndex++;
            }
            
            const maybeChoices = detectChoices(text);
            if (maybeChoices) {
                currentSection.fields.push({
                    id: `field_${currentSection.fields.length + 1}`,
                    label: 'Select:',
                    type: 'choice',
                    choices: maybeChoices
                });
            } else {
                currentSection.fields.push({
                    id: `field_${currentSection.fields.length + 1}`,
                    label: text,
                    type: text.length > 100 ? 'textarea' : 'text'
                });
            }
        }
    });
    
    // Insert any remaining dropdowns into last section
    while (dropdownIndex < dropdowns.length && currentSection) {
        const dropdown = dropdowns[dropdownIndex];
        currentSection.fields.push({
            id: `field_${currentSection.fields.length + 1}`,
            label: dropdown.label,
            type: 'choice',
            choices: dropdown.choices
        });
        dropdownIndex++;
    }
    
    if (currentSection && currentSection.fields.length > 0) {
        sections.push(currentSection);
    }
    
    // Ensure at least one section
    // Virtualization: Only render sections in/near viewport
    const rootRect = root.getBoundingClientRect();
    const windowHeight = window.innerHeight;
    const buffer = 2; // Number of sections above/below viewport to render
    // Track scroll position
    let scrollTop = window.scrollY;
    let visibleSections = [];
    // Calculate which sections to render
    function getVisibleSectionIndices() {
        const indices = [];
        let totalHeight = 0;
        for (let i = 0; i < tpl.sections.length; i++) {
            // Estimate section height (could be improved)
            const estHeight = 400; // px per section (tweak as needed)
            const sectionTop = totalHeight;
            const sectionBottom = totalHeight + estHeight;
            if (
                sectionBottom > scrollTop - buffer * estHeight &&
                sectionTop < scrollTop + windowHeight + buffer * estHeight
            ) {
                indices.push(i);
            }
            totalHeight += estHeight;
        }
        return indices;
    }
    function renderVirtualSections() {
        root.innerHTML = "";
        visibleSections = getVisibleSectionIndices();
        visibleSections.forEach(index => {
            const sec = tpl.sections[index];
            const sectionTitle = sec.label || sec.title || "Untitled Section";
            const isCollapsed = collapsedSections.has(index);
            const arrow = isCollapsed ? '▸' : '▾';
            const requiredBadge = sec.required ? `<span class=\"ml-2 badge bg-red-50 text-red-600 border border-red-200 text-[10px]\">Required</span>` : '';
            const row = document.createElement('div');
            row.className = 'flex items-start gap-3';
            const card = document.createElement('section');
            card.id = `dynamic_${sec.id}`;
            card.className = 'section-card mb-4 flex-1';
            const sectionLabel = sec.sectionLabel || '';
            const adminLabelPillHTML = `<div class=\"section-label-pill admin-only\" title=\"Admin: Section label\"><input type=\"text\" placeholder=\"Add label...\" value=\"${sectionLabel}\" onchange=\"updateSectionLabel(${index}, this.value)\" onclick=\"event.stopPropagation()\" /></div>`;
            const viewerLabelPillHTML = sectionLabel ? `<div class=\"section-label-pill non-admin-only\" title=\"Section label\">${sectionLabel}</div>` : '';
            if (!sec._clones) sec._clones = [JSON.parse(JSON.stringify(sec.fields))];
            function renderCloneGroup(fields, groupIdx) {
                const altBg = groupIdx % 2 === 0 ? 'clone-bg-a' : 'clone-bg-b';
                const removeBtn = groupIdx > 0 ? `<button type=\"button\" class=\"clone-remove pill-btn pill-btn-red\" onclick=\"removeCloneGroup(${index},${groupIdx})\" title=\"Remove this group\">×</button>` : '';
                return `<div class=\"clone-group ${altBg} animate-popin\" data-group=\"${groupIdx}\">${renderField({fields: fields}, index)}${removeBtn}</div>`;
            }
            let groupsHTML = sec._clones.map((fields, i) => renderCloneGroup(fields, i)).join('');

            // Hide clarification button for Short Description / Long Description sections
            const _secTitleRaw = sec.label || sec.title || '';
            const _hideClarBtn = /short descriptions?|long descriptions?/i.test(_secTitleRaw);
            const addClarBtnHTML = _hideClarBtn ? '' : `<div style="position:relative;"><button type=\"button\" class=\"pill-btn pill-btn-green\" style=\"position:absolute;right:0;bottom:-44px;z-index:2;\" onclick=\"addClarification(${index})\">+ Add Further Clarification</button></div>`;
            card.innerHTML = `
                ${adminLabelPillHTML}${viewerLabelPillHTML}
                <div class=\"flex items-center gap-2 mb-2\">
                    <button class=\"collapse-toggle text-xs text-slate-600 hover:text-slate-800\" onclick=\"toggleSectionCollapse(${index})\" title=\"Collapse / Expand\"><span>${arrow}</span></button>
                    <div>
                        <div class=\"section-label\">SECTION ${String(index+1).padStart(2,'0')}</div>
                        <h2 class=\"section-title flex items-center\">${sectionTitle} ${requiredBadge}</h2>
                    </div>
                </div>
                <div class=\"section-body ${isCollapsed ? 'collapsed' : ''}\" id=\"section-body-${index}\">${groupsHTML}
                    <!-- Removed '＋ Add Another' button: handled by 'repeatable' type -->
                    <div id=\"clarification-container-${index}\"></div>
                    ${addClarBtnHTML}
                </div>
            `;
            window.addClarification = function(sectionIdx) {
                const container = document.getElementById(`clarification-container-${sectionIdx}`);
                if (container && !container.querySelector('textarea')) {/* Lines 699-721 omitted */}
            };
            const adminCol = document.createElement('div');
            adminCol.className = 'admin-only flex flex-col gap-2 mt-1 pr-1';
            adminCol.innerHTML = `
                <button class=\"px-2 py-1 bg-amber-500 text-white text-xs rounded hover:bg-amber-600\" onclick=\"editSection(${index})\" title=\"Edit section title\">✏️ Edit</button>
                <button class=\"px-2 py-1 bg-slate-500 text-white text-xs rounded hover:bg-slate-600 disabled:opacity-40\" onclick=\"moveSection(${index}, -1)\" ${index===0?'disabled':''} title=\"Move up\">↑</button>
                <button class=\"px-2 py-1 bg-slate-500 text-white text-xs rounded hover:bg-slate-600 disabled:opacity-40\" onclick=\"moveSection(${index}, 1)\" ${index===tpl.sections.length-1?'disabled':''} title=\"Move down\">↓</button>
                <button class=\"px-2 py-1 bg-red-600 text-white text-xs rounded hover:bg-red-700\" onclick=\"deleteSection(${index})\" title=\"Delete section\">🗑️ Delete</button>
                <div class=\"relative\">
                    <button class=\"px-2 py-1 bg-blue-500 text-white text-xs rounded hover:bg-blue-600\" onclick=\"toggleToolbox(${index})\" title=\"Add field\">🧰 Field</button>
                    <div id=\"toolbox-${index}\" class=\"hidden absolute left-0 top-full mt-1 bg-white border border-slate-300 rounded shadow-lg p-2 w-40 z-10\">\n                        <button class=\"block w-full text-left px-2 py-1 text-xs hover:bg-slate-100 rounded\" onclick=\"addField(${index}, 'text')\">📝 Text Box</button>
                        <button class=\"block w-full text-left px-2 py-1 text-xs hover:bg-slate-100 rounded\" onclick=\"addField(${index}, 'textarea')\">📄 Text Area</button>
                        <button class=\"block w-full text-left px-2 py-1 text-xs hover:bg-slate-100 rounded\" onclick=\"addField(${index}, 'date')\">📅 Date Picker</button>
                        <button class=\"block w-full text-left px-2 py-1 text-xs hover:bg-slate-100 rounded\" onclick=\"addField(${index}, 'choice')\">☑️ Dropdown</button>
                                <button class=\"block w-full text-left px-2 py-1 text-xs hover:bg-slate-100 rounded\" onclick=\"addField(${index}, 'static-text')\">🗒️ Static Text</button>
                    </div>
                </div>
            `;
            row.appendChild(card);
            row.appendChild(adminCol);
            root.appendChild(row);
        });
    }
    // Initial render
    renderVirtualSections();
    // Re-render on scroll
    window.addEventListener('scroll', () => {
        scrollTop = window.scrollY;
        renderVirtualSections();
    });
    // Re-render on resize
    window.addEventListener('resize', () => {
        renderVirtualSections();
    });
}

// Global for program selection modal
let pendingTemplate = null;

function addTemplateToRuntime(template) {
    // Mark as imported
    template.imported = true;
    
    // Store pending template and show program selector modal
    pendingTemplate = template;
    showProgramModal(template);
}

// Show program selector modal
window.showProgramModal = function(template) {
    const modal = document.getElementById('program_modal');
    const backdrop = document.getElementById('program_modal_backdrop');
    const nameEl = document.getElementById('program_template_name');
    const container = document.getElementById('program_buttons_container');
    
    nameEl.textContent = `Template: "${template.name}"`;
    
    // Get programs and create buttons
    const programs = Object.keys(templatesIndex).sort();
    container.innerHTML = '';
    
    programs.forEach(program => {
        const wrapper = document.createElement('div');
        wrapper.className = 'relative';
        
        const btn = document.createElement('button');
        btn.className = 'w-full text-left px-4 py-3 border-2 border-slate-200 rounded-lg hover:border-blue-400 hover:bg-blue-50 transition-all';
        btn.onclick = () => selectProgram(program);
        
        // Get icon from metadata or fallback
        const metadata = programMetadata[program] || { emoji: '📁', name: program };
        const icon = metadata.emoji || '📁';
        
        btn.innerHTML = `
            <div class="flex items-center gap-3">
                <span class="text-2xl">${icon}</span>
                <div class="flex-1">
                    <div class="font-semibold text-sm">${program}</div>
                </div>
            </div>
        `;
        
        // Add edit button
        const editBtn = document.createElement('button');
        editBtn.className = 'absolute top-2 right-2 px-2 py-1 bg-slate-100 hover:bg-slate-200 rounded text-xs transition-colors';
        editBtn.innerHTML = '✏️';
        editBtn.title = 'Edit program';
        editBtn.onclick = (e) => {
            e.stopPropagation();
            editProgram(program);
        };
        
        wrapper.appendChild(btn);
        wrapper.appendChild(editBtn);
        container.appendChild(wrapper);
    });
    
    // Show modal
    modal.classList.remove('hidden');
    backdrop.classList.remove('hidden');
};

// Select program and finalize template import
window.selectProgram = function(selectedProgram) {
    if (!pendingTemplate) return;
    
    const template = pendingTemplate;
    
    // Update template program
    template.program = selectedProgram;
    
    // Save to localStorage
    localStorage.setItem(PERSIST_PREFIX + template.file, JSON.stringify(template));
    
    // Add to templatesIndex under selected program
    if (!templatesIndex[selectedProgram]) {
        templatesIndex[selectedProgram] = [];
    }
    
    const indexEntry = {
        id: template.id,
        name: template.name,
        file: template.file,
        program: selectedProgram,
        imported: true,
        updated: new Date().toISOString()
    };
    
    // Remove existing if present (in any program folder)
    Object.keys(templatesIndex).forEach(prog => {
        templatesIndex[prog] = templatesIndex[prog].filter(t => t.file !== template.file);
    });
    
    // Add to selected program
    templatesIndex[selectedProgram].push(indexEntry);
    
    // Save templatesIndex to localStorage
    localStorage.setItem('dpss_templatesIndex', JSON.stringify(templatesIndex));
    
    // Add to allTemplates if not already present
    const existing = allTemplates.find(t => t.file === template.file);
    if (!existing) {
        allTemplates.push(template);
    } else {
        // Replace existing
        const idx = allTemplates.indexOf(existing);
        allTemplates[idx] = template;
    }
    
    // Refresh UI
    refreshTemplateDropdown();
    renderTemplateManager(); // Update template manager list
    
    // Auto-select the new template
    activeTemplate = template;
    document.getElementById('currentTemplateTag').textContent = template.name;
    renderTemplateSections(template);
    renderSidebarFromTemplate(template);
    
    // Close modal
    closeProgramModal();
    
    // Show success message
    alert(`Template "${template.name}" uploaded to ${selectedProgram} successfully!`);
    
    // Clear pending template
    pendingTemplate = null;
};

// Create new program folder
window.createAndSelectNewProgram = function() {
    const input = document.getElementById('new_program_input');
    const newProgramName = input.value.trim();
    const selectedEmoji = document.getElementById('selected_emoji').textContent;
    
    if (!newProgramName) {
        alert('Please enter a program name');
        return;
    }
    
    // Check if program already exists
    if (templatesIndex[newProgramName]) {
        alert(`Program folder "${newProgramName}" already exists. Please choose it from the list or enter a different name.`);
        return;
    }
    
    // Create new program folder
    templatesIndex[newProgramName] = [];
    
    // Save program metadata
    programMetadata[newProgramName] = {
        emoji: selectedEmoji,
        name: newProgramName
    };
    localStorage.setItem('dpss_programMetadata', JSON.stringify(programMetadata));
    
    // Select it
    selectProgram(newProgramName);
    
    // Clear input and reset emoji
    input.value = '';
    document.getElementById('selected_emoji').textContent = '📁';
    
    // Hide emoji picker if open
    document.getElementById('emoji_picker').classList.add('hidden');
};

// Toggle emoji picker
window.toggleEmojiPicker = function() {
    const picker = document.getElementById('emoji_picker');
    picker.classList.toggle('hidden');
};

// Select emoji
window.selectEmoji = function(emoji) {
    document.getElementById('selected_emoji').textContent = emoji;
    document.getElementById('emoji_picker').classList.add('hidden');
};

// Edit program (name and emoji)
window.editProgram = function(oldProgramName) {
    const metadata = programMetadata[oldProgramName] || { emoji: '📁', name: oldProgramName };
    
    // Prompt for new name
    const newName = prompt(`Edit program name:`, oldProgramName);
    if (!newName || newName === oldProgramName) {
        // Just edit emoji
        const newEmoji = prompt(`Edit emoji for "${oldProgramName}":`, metadata.emoji);
        if (newEmoji && newEmoji !== metadata.emoji) {
            programMetadata[oldProgramName] = {
                emoji: newEmoji,
                name: oldProgramName
            };
            localStorage.setItem('dpss_programMetadata', JSON.stringify(programMetadata));
            showProgramModal(pendingTemplate); // Refresh modal
        }
        return;
    }
    
    // Check if new name already exists
    if (templatesIndex[newName]) {
        alert(`Program folder "${newName}" already exists.`);
        return;
    }
    
    // Prompt for emoji
    const newEmoji = prompt(`Choose emoji for "${newName}":`, metadata.emoji);
    
    // Update templatesIndex
    templatesIndex[newName] = templatesIndex[oldProgramName];
    delete templatesIndex[oldProgramName];
    
    // Update all templates in this program
    templatesIndex[newName].forEach(entry => {
        entry.program = newName;
        const template = allTemplates.find(t => t.file === entry.file);
        if (template) {
            template.program = newName;
            localStorage.setItem(PERSIST_PREFIX + template.file, JSON.stringify(template));
        }
    });
    
    // Update metadata
    programMetadata[newName] = {
        emoji: newEmoji || metadata.emoji,
        name: newName
    };
    delete programMetadata[oldProgramName];
    
    // Save changes
    localStorage.setItem('dpss_templatesIndex', JSON.stringify(templatesIndex));
    localStorage.setItem('dpss_programMetadata', JSON.stringify(programMetadata));
    
    // Refresh modal
    showProgramModal(pendingTemplate);
};

// Close program modal
window.closeProgramModal = function() {
    const modal = document.getElementById('program_modal');
    const backdrop = document.getElementById('program_modal_backdrop');
    const input = document.getElementById('new_program_input');
    const emojiPicker = document.getElementById('emoji_picker');
    
    modal.classList.add('hidden');
    backdrop.classList.add('hidden');
    input.value = '';
    emojiPicker.classList.add('hidden');
    document.getElementById('selected_emoji').textContent = '📁';
    
    // If user cancelled, clear pending template
    if (pendingTemplate) {
        pendingTemplate = null;
    }
};

function refreshTemplateDropdown() {
    populateHeaderDropdowns();
    applyHeaderFilters();
}

// ============================================================================
// ADMIN EDIT FUNCTIONS
// ============================================================================
// Replace prompt-based edit with modal-driven workflow
window.editSection = function(sectionIndex) {
    if (!activeTemplate) return;
    const sec = activeTemplate.sections[sectionIndex];
    if (!sec) return;

    // Store index for save handler
    window._editingSectionIndex = sectionIndex;

    // Prefill modal fields
    const titleInput = document.getElementById('section_edit_title');
    const requiredCb = document.getElementById('section_edit_required');
    titleInput.value = sec.label || sec.title || '';
    requiredCb.checked = !!sec.required;

    // Show modal
    document.getElementById('section_edit_modal_backdrop').classList.remove('hidden');
    document.getElementById('section_edit_modal').classList.remove('hidden');
};

// Modal handlers
window.closeSectionEditModal = function() {
    document.getElementById('section_edit_modal_backdrop').classList.add('hidden');
    document.getElementById('section_edit_modal').classList.add('hidden');
    window._editingSectionIndex = null;
};

window.saveSectionEditModal = function() {
    const idx = window._editingSectionIndex;
    if (idx === null || idx === undefined) { closeSectionEditModal(); return; }
    const sec = activeTemplate.sections[idx];
    if (!sec) { closeSectionEditModal(); return; }

    const titleInput = document.getElementById('section_edit_title');
    const requiredCb = document.getElementById('section_edit_required');
    const newTitle = titleInput.value.trim();
    const was = sec.label || sec.title || '';

    if (newTitle && newTitle !== was) {
        if (sec.label) sec.label = newTitle; else sec.title = newTitle;
        logChange('edited', was || 'Untitled Section', `Renamed to "${newTitle}"`);
    }
    sec.required = !!requiredCb.checked;

    // Re-render and persist
    renderTemplateSections(activeTemplate);
    renderSidebarFromTemplate(activeTemplate);
    persistActiveTemplateChanges();
    showPublishIndicator();

    closeSectionEditModal();
    showAnimatedMessage('Section updated');
};

window.editField = function(sectionIndex, fieldIndex) {
    if (!activeTemplate) return;
    
    const sec = activeTemplate.sections[sectionIndex];
    const field = sec.fields[fieldIndex];
    
    const currentLabel = field.label || "";
    const currentType = field.type || "text";
    
    // Special handling for admin notes
    if (currentType === "admin-note") {
        const newContent = prompt("Edit Admin Note:", field.content || currentLabel);
        if (newContent !== null) {
            field.content = newContent;
            field.label = newContent;
        }
    } else {
        const newLabel = prompt("Edit Field Label:", currentLabel);
        if (newLabel !== null) {
            field.label = newLabel;
        }
    }
    
    const newType = prompt("Edit Field Type (text, textarea, date, choice, admin-note):", currentType);
    if (newType !== null && ["text", "textarea", "date", "choice", "notes", "admin-note"].includes(newType)) {
        field.type = newType;
        
        if (newType === "choice" && !field.choices) {
            const choicesInput = prompt("Enter choices (comma-separated):", "Yes,No");
            if (choicesInput) {
                field.choices = choicesInput.split(",").map(c => c.trim());
            }
        }
        
        if (newType === "admin-note" && !field.content) {
            const noteContent = prompt("Enter the admin note for end users:", field.label);
            if (noteContent) {
                field.content = noteContent;
                field.label = noteContent;
            }
        }
    }
    
    // Re-render
    renderTemplateSections(activeTemplate);
    
    console.log("✏️ Field updated:", field);
    persistActiveTemplateChanges();
    showPublishIndicator();
};

window.toggleToolbox = function(sectionIndex) {
    const toolbox = document.getElementById(`toolbox-${sectionIndex}`);
    if (toolbox) {
        toolbox.classList.toggle("hidden");
    }
    
    // Close other toolboxes
    document.querySelectorAll('[id^="toolbox-"]').forEach(tb => {
        if (tb.id !== `toolbox-${sectionIndex}`) {
            tb.classList.add("hidden");
        }
    });
};

window.addField = function(sectionIndex, fieldType) {
    if (!activeTemplate) return;
    
    const sec = activeTemplate.sections[sectionIndex];
    
    // Ensure fields array exists
    if (!sec.fields) {
        sec.fields = [];
    }
    
    const fieldLabel = prompt(`Enter label for new ${fieldType} field:`, `New ${fieldType} Field`);
    if (!fieldLabel) return;
    
    const newField = {
        id: `field_${Date.now()}`,
        label: fieldLabel,
        type: fieldType
    };
    
    // If admin note, show modal
    if (fieldType === "admin-note") {
        newField.content = "Important note";
        newField.label = "Important note";
        newField.color = 'blue'; // Default color
        sec.fields.push(newField);
        
        // Log the change
        const sectionTitle = sec.label || sec.title || 'Untitled Section';
        logChange('added', sectionTitle, `Added ${fieldType} field: "${fieldLabel}"`);
        
        // Close toolbox
        document.getElementById(`toolbox-${sectionIndex}`).classList.add("hidden");
        
        // Show admin note modal to configure
        const fieldIndex = sec.fields.length - 1;
        showAdminNoteModalForNewField(newField, sectionIndex, fieldIndex);
        return; // Modal will handle completion
    }
    
    // If choice field, ask for options
    else if (fieldType === "choice") {
         // Use modal for dropdown options
         newField.choices = ['Option 1', 'Option 2', 'Option 3']; // Temporary
         sec.fields.push(newField);
         
         // Log the change
         const sectionTitle = sec.label || sec.title || 'Untitled Section';
         logChange('added', sectionTitle, `Added ${fieldType} field: "${fieldLabel}"`);
         
         // Close toolbox
         document.getElementById(`toolbox-${sectionIndex}`).classList.add("hidden");
         
         // Show dropdown modal to configure options
         const fieldIndex = sec.fields.length - 1;
         showDropdownModalForNewField(newField, sectionIndex, fieldIndex);
         return; // Modal will handle completion
    }
    
    // Save to undo stack
    undoStack.push({
        action: 'addField',
        sectionIndex: sectionIndex,
        field: newField
    });

    sec.fields.push(newField);

    // Log the change
    const sectionTitle = sec.label || sec.title || 'Untitled Section';
    logChange('added', sectionTitle, `Added ${fieldType} field: "${fieldLabel}"`);

    // Show visual feedback with details
    setTimeout(() => {
        const sectionBody = document.getElementById(`section-body-${sectionIndex}`);
        if (sectionBody) {
            let notif = document.createElement('div');
            notif.className = 'field-add-notification';
            const sectionTitle = sec.label || sec.title || 'Untitled Section';
            notif.innerHTML = `🧰 Added <b>${fieldType}</b> field: "${fieldLabel}"<br>to <b>${sectionTitle}</b>`;
            notif.style = 'background:#e0f7fa;color:#00796b;padding:10px 18px;border-radius:8px;position:absolute;top:-38px;right:0;z-index:10;font-size:15px;font-weight:600;box-shadow:0 2px 8px rgba(60,80,120,0.08);pointer-events:none;transition:opacity 0.3s;opacity:1;';
            sectionBody.appendChild(notif);
            setTimeout(() => { notif.style.opacity = '0'; setTimeout(() => notif.remove(), 400); }, 2200);
        }
    }, 50);

    // Close toolbox and re-render
    document.getElementById(`toolbox-${sectionIndex}`).classList.add("hidden");
    renderTemplateSections(activeTemplate);

    // Show undo notification
    showUndoNotification();

    console.log("➕ Field added:", newField);
    persistActiveTemplateChanges();
    showPublishIndicator();
};

// replaced by modal-based deleteField later (keep stub if earlier defined)

window.undoLastAction = function() {
    if (undoStack.length === 0) return;
    
    const lastAction = undoStack.pop();
    
    if (lastAction.action === 'addField') {
        // Undo add: remove the field
        const sec = activeTemplate.sections[lastAction.sectionIndex];
        const fieldIndex = sec.fields.findIndex(f => f.id === lastAction.field.id);
        if (fieldIndex !== -1) {
            sec.fields.splice(fieldIndex, 1);
        }
    } else if (lastAction.action === 'deleteField') {
        // Undo delete: restore the field
        const sec = activeTemplate.sections[lastAction.sectionIndex];
        sec.fields.splice(lastAction.fieldIndex, 0, lastAction.field);
    }
    
    renderTemplateSections(activeTemplate);
    hideUndoNotification();
    
    console.log("↩️ Undo:", lastAction);
};

function showUndoNotification() {
    let notification = document.getElementById('undoNotification');
    if (!notification) {
        notification = document.createElement('div');
        notification.id = 'undoNotification';
        notification.className = 'admin-only fixed bottom-4 right-4 bg-slate-800 text-white px-4 py-2 rounded-lg shadow-lg z-50 flex items-center gap-3';
        notification.innerHTML = `
            <span class="text-sm">Action completed</span>
            <button onclick="undoLastAction()" class="px-3 py-1 bg-amber-500 hover:bg-amber-600 rounded text-xs font-semibold">
                ↩️ Undo
            </button>
        `;
        document.body.appendChild(notification);
    }
    
    notification.classList.remove('hidden');
    
    // Auto-hide after 10 seconds
    clearTimeout(notification.timeout);
    notification.timeout = setTimeout(() => {
        notification.classList.add('hidden');
    }, 10000);
}

function hideUndoNotification() {
    const notification = document.getElementById('undoNotification');
    if (notification) {
        notification.classList.add('hidden');
    }
}

// ============================================================================
// SECTION INTERACTION (Collapse / Required / Reorder)
// ============================================================================
// Update section label (admin-only pill in top right)
window.updateSectionLabel = function(sectionIndex, newLabel) {
    if (!activeTemplate || !activeTemplate.sections[sectionIndex]) return;
    
    const sec = activeTemplate.sections[sectionIndex];
    const oldLabel = sec.sectionLabel || '(none)';
    sec.sectionLabel = newLabel.trim();
    
    // Log change
    const sectionTitle = sec.label || sec.title || 'Untitled Section';
    logChange('edited', sectionTitle, `Label changed from "${oldLabel}" to "${newLabel}"`);
    
    // Persist changes
    persistActiveTemplateChanges();
    
    // Show publish indicator
    showPublishIndicator();
    
    console.log('🏷️ Section label updated:', newLabel);
};

window.toggleSectionCollapse = function(index) {
    if (!activeTemplate) return;
    if (collapsedSections.has(index)) collapsedSections.delete(index); else collapsedSections.add(index);
    renderTemplateSections(activeTemplate);
    applyAdminVisibility();
};

window.toggleSectionRequired = function(index) {
    if (!activeTemplate) return;
    const sec = activeTemplate.sections[index];
    sec.required = !sec.required;
    renderTemplateSections(activeTemplate);
    applyAdminVisibility();
    persistActiveTemplateChanges();
};

// Delete section
window.deleteSection = async function(sectionIndex) {
    if (!activeTemplate || !activeTemplate.sections[sectionIndex]) return;
    
    const sec = activeTemplate.sections[sectionIndex];
    const sectionTitle = sec.label || sec.title || 'Untitled Section';
    
    const confirmed = await showConfirm(
        'Delete Section',
        `Are you sure you want to delete section "${sectionTitle}"? This will remove all fields in this section and cannot be undone.`
    );
    
    if (!confirmed) return;
    
    // Remove section from array
    activeTemplate.sections.splice(sectionIndex, 1);
    
    // Log the deletion
    logChange('deleted', sectionTitle, `Entire section removed`);
    
    // Update collapsed sections set (remove deleted index and shift remaining)
    const newSet = new Set();
    collapsedSections.forEach(i => {
        if (i < sectionIndex) newSet.add(i);
        else if (i > sectionIndex) newSet.add(i - 1);
        // Skip the deleted index
    });
    collapsedSections = newSet;
    
    // Persist changes
    persistActiveTemplateChanges();
    
    // Re-render (section numbers will auto-update based on array index)
    renderTemplateSections(activeTemplate);
    renderSidebarFromTemplate(activeTemplate);
    applyAdminVisibility();
    
    // Show publish indicator
    showPublishIndicator();
    
    console.log('🗑️ Section deleted:', sectionTitle);
};

window.moveSection = function(index, direction) {
    if (!activeTemplate) return;
    const newIndex = index + direction;
    if (newIndex < 0 || newIndex >= activeTemplate.sections.length) return;
    const arr = activeTemplate.sections;
    const temp = arr[index];
    arr[index] = arr[newIndex];
    arr[newIndex] = temp;
    // Rebuild collapsed set with updated indices
    const newSet = new Set();
    collapsedSections.forEach(i => {
        if (i === index) newSet.add(newIndex);
        else if (i === newIndex) newSet.add(index);
        else newSet.add(i);
    });
    collapsedSections = newSet;
    renderTemplateSections(activeTemplate);
    renderSidebarFromTemplate(activeTemplate);
    applyAdminVisibility();
    persistActiveTemplateChanges();
};

// ============================================================================
// GENERIC CONFIRM MODAL
// ============================================================================
function showConfirm(title, message) {
    return new Promise((resolve) => {
        const backdrop = document.getElementById('confirm_modal_backdrop');
        const modal = document.getElementById('confirm_modal');

        document.getElementById('confirm_title').textContent = title;
        document.getElementById('confirm_message').textContent = message;

        backdrop.classList.remove('hidden');
        modal.classList.remove('hidden');

        const yesBtn = document.getElementById('confirm_yes');
        const noBtn = document.getElementById('confirm_no');

        function cleanup(result) {
            backdrop.classList.add('hidden');
            modal.classList.add('hidden');

            yesBtn.onclick = null;
            noBtn.onclick = null;

            resolve(result);
        }

        yesBtn.onclick = () => cleanup(true);
        noBtn.onclick = () => cleanup(false);
    });
}

// Small animated toast for success/info messages
function showAnimatedMessage(message, opts = {}) {
    try {
        const duration = opts.duration || 2200;
        const container = document.createElement('div');
        container.className = 'dpss-animated-toast';
        container.style.position = 'fixed';
        container.style.left = '50%';
        container.style.top = '16%';
        container.style.transform = 'translateX(-50%) scale(0.97)';
        container.style.zIndex = '99999';
        container.style.background = 'white';
        container.style.border = '1px solid rgba(15,23,42,0.06)';
        container.style.padding = '12px 18px';
        container.style.borderRadius = '12px';
        container.style.boxShadow = '0 12px 30px rgba(2,6,23,0.12)';
        container.style.fontSize = '14px';
        container.style.color = '#0f172a';
        container.style.opacity = '0';
        container.style.transition = 'opacity 260ms ease, transform 300ms cubic-bezier(.2,.9,.3,1)';
        container.textContent = message;
        document.body.appendChild(container);

        // animate in
        requestAnimationFrame(() => {
            container.style.opacity = '1';
            container.style.transform = 'translateX(-50%) scale(1)';
        });

        // hide after duration
        setTimeout(() => {
            container.style.opacity = '0';
            container.style.transform = 'translateX(-50%) scale(0.97)';
            setTimeout(() => { try { document.body.removeChild(container); } catch (e) {} }, 300);
        }, duration);
    } catch (e) {
        console.warn('Toast failed', e);
    }
}

// Undo-capable toast (message + Undo button)
function showUndoToast(message, undoCallback, opts = {}) {
    try {
        const duration = opts.duration || 4200;
        const container = document.createElement('div');
        container.className = 'dpss-undo-toast';
        container.style.position = 'fixed';
        container.style.left = '50%';
        container.style.bottom = '6%';
        container.style.transform = 'translateX(-50%) translateY(20px)';
        container.style.zIndex = '99999';
        container.style.background = 'white';
        container.style.border = '1px solid rgba(15,23,42,0.06)';
        container.style.padding = '10px 12px';
        container.style.borderRadius = '12px';
        container.style.boxShadow = '0 10px 30px rgba(2,6,23,0.12)';
        container.style.fontSize = '14px';
        container.style.color = '#0f172a';
        container.style.display = 'flex';
        container.style.alignItems = 'center';
        container.style.gap = '12px';
        container.style.opacity = '0';
        container.style.transition = 'opacity 240ms ease, transform 300ms cubic-bezier(.2,.9,.3,1)';

        const txt = document.createElement('div');
        txt.textContent = message;
        container.appendChild(txt);

        const btn = document.createElement('button');
        btn.textContent = 'Undo';
        btn.className = 'pill-btn pill-btn-blue';
        btn.onclick = () => {
            try { if (typeof undoCallback === 'function') undoCallback(); } catch (e) {}
            // remove toast immediately
            try { container.style.opacity = '0'; container.style.transform = 'translateX(-50%) translateY(20px)'; } catch (e) {}
            setTimeout(() => { try { document.body.removeChild(container); } catch (e) {} }, 240);
        };
        container.appendChild(btn);

        document.body.appendChild(container);
        requestAnimationFrame(() => { container.style.opacity = '1'; container.style.transform = 'translateX(-50%) translateY(0)'; });

        const tid = setTimeout(() => {
            try { container.style.opacity = '0'; container.style.transform = 'translateX(-50%) translateY(20px)'; } catch (e) {}
            setTimeout(() => { try { document.body.removeChild(container); } catch (e) {} }, 240);
        }, duration);
    } catch (e) {
        console.warn('Undo toast failed', e);
    }
}

// Convert field type with modal selection
let convertFieldContext = null; // Store context for conversion

window.convertFieldType = async function(sectionIndex, fieldIndex) {
    if (!activeTemplate) return;
    const sec = activeTemplate.sections[sectionIndex];
    const field = sec.fields[fieldIndex];
    const currentType = field.type || 'text';
    const currentLabel = field.label || '';
    
    // Store context for when user selects type
    convertFieldContext = { sectionIndex, fieldIndex, field, currentType, currentLabel };
    
    // Show convert modal
    const backdrop = document.getElementById('convert_modal_backdrop');
    const modal = document.getElementById('convert_modal');
    const info = document.getElementById('convert_current_info');
    
    info.textContent = `Current: ${currentType.toUpperCase()} — "${currentLabel}"`;
    
    backdrop.classList.remove('hidden');
    modal.classList.remove('hidden');
};

window.selectFieldType = async function(newType) {
    if (!convertFieldContext) return;
    
    const { sectionIndex, fieldIndex, field, currentType, currentLabel } = convertFieldContext;
    const sec = activeTemplate.sections[sectionIndex];
    
    // Close modal
    closeConvertModal();
    
    if (newType === currentType) {
        alert('Field is already this type.');
        return;
    }
    
    // Store old type for logging
    const oldType = currentType;
    field.type = newType;
    
    // Handle type-specific setup
    if (newType === 'choice' && !field.choices) {
         // Show dropdown options modal
         showDropdownModal(field, sectionIndex, fieldIndex, oldType, currentLabel);
         return; // Don't continue - modal will handle completion
    }
    
    if (newType === 'admin-note') {
        // Show admin note modal
        showAdminNoteModal(field, sectionIndex, fieldIndex, oldType, currentLabel);
        return; // Don't continue - modal will handle completion
    }
    
    // Log change
    const sectionTitle = sec.label || sec.title || 'Untitled Section';
    logChange('edited', sectionTitle, `Converted "${currentLabel}" from ${oldType} to ${newType}`);
    
    // Persist & re-render
    persistActiveTemplateChanges();
    renderTemplateSections(activeTemplate);
    showPublishIndicator();
    
    console.log('🔄 Field type converted:', {from: oldType, to: newType, field});
    
    // Clear context
    convertFieldContext = null;
};

window.closeConvertModal = function() {
     // Dropdown options modal state
     let dropdownModalContext = null;
 
     // Show dropdown options modal
     window.showDropdownModal = function(field, sectionIndex, fieldIndex, oldType, currentLabel) {
         const modal = document.getElementById('dropdown_modal');
         const backdrop = document.getElementById('dropdown_modal_backdrop');
         const container = document.getElementById('dropdown_options_container');
     
         // Store context
         dropdownModalContext = { field, sectionIndex, fieldIndex, oldType, currentLabel };
     
         // Clear container
         container.innerHTML = '';
     
         // Add initial options (from existing choices or defaults)
         const initialOptions = field.choices || ['Yes', 'No', 'N/A'];
         initialOptions.forEach(option => {
             addDropdownOptionInput(option);
         });
     
         // Show modal
         backdrop.classList.remove('hidden');
         modal.classList.remove('hidden');
     };
 
     // Add a new option input field
     window.addDropdownOption = function(value = '') {
         addDropdownOptionInput(value);
     };
 
     function addDropdownOptionInput(value = '') {
         const container = document.getElementById('dropdown_options_container');
         const index = container.children.length;
     
         const wrapper = document.createElement('div');
         wrapper.className = 'flex gap-2 items-center';
         wrapper.dataset.optionIndex = index;
     
         const input = document.createElement('input');
         input.type = 'text';
         input.value = value;
         input.placeholder = `Option ${index + 1}`;
         input.className = 'flex-1 px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100';
     
         const deleteBtn = document.createElement('button');
         deleteBtn.innerHTML = '🗑️';
         deleteBtn.className = 'px-3 py-2 text-sm hover:bg-red-50 hover:text-red-600 rounded transition-colors';
         deleteBtn.title = 'Remove option';
         deleteBtn.onclick = () => wrapper.remove();
     
         wrapper.appendChild(input);
         wrapper.appendChild(deleteBtn);
         container.appendChild(wrapper);
     
         // Focus the new input
         input.focus();
     }
 
     // Confirm and save dropdown options
     window.confirmDropdownOptions = function() {
         if (!dropdownModalContext) return;
     
        const { field, sectionIndex, fieldIndex, oldType, currentLabel, isNewField } = dropdownModalContext;
         const container = document.getElementById('dropdown_options_container');
     
         // Collect all option values
         const options = [];
         container.querySelectorAll('input[type="text"]').forEach(input => {
             const value = input.value.trim();
             if (value) options.push(value);
         });
     
         // Validate at least one option
         if (options.length === 0) {
             alert('Please enter at least one option');
             return;
         }
     
         // Save options to field
         field.choices = options;
     
        // Log change
         const sec = activeTemplate.sections[sectionIndex];
         const sectionTitle = sec.label || sec.title || 'Untitled Section';
     
         if (isNewField) {
             // For new fields, save to undo stack
             undoStack.push({
                 action: 'addField',
                 sectionIndex: sectionIndex,
                 field: field
             });
             showUndoNotification();
         } else {
             // For field type conversions
             logChange('edited', sectionTitle, `Converted "${currentLabel}" from ${oldType} to choice`);
         }
     
         // Persist & re-render
         persistActiveTemplateChanges();
         renderTemplateSections(activeTemplate);
         showPublishIndicator();
     
        const action = isNewField ? 'Field created' : 'Field type converted';
        console.log(`🔄 ${action}:`, {from: oldType, to: 'choice', options, field});
     
         // Close modal
         closeDropdownModal();
     // Show dropdown modal for new field creation
     window.showDropdownModalForNewField = function(field, sectionIndex, fieldIndex) {
         const modal = document.getElementById('dropdown_modal');
         const backdrop = document.getElementById('dropdown_modal_backdrop');
         const container = document.getElementById('dropdown_options_container');
     
         // Store context (no oldType since this is a new field)
         dropdownModalContext = { field, sectionIndex, fieldIndex, isNewField: true };
     
         // Clear container
         container.innerHTML = '';
     
         // Add initial empty options
         addDropdownOptionInput('Option 1');
         addDropdownOptionInput('Option 2');
         addDropdownOptionInput('Option 3');
     
         // Show modal
         backdrop.classList.remove('hidden');
         modal.classList.remove('hidden');
     };
 
     };
 
     // Close dropdown modal
     window.closeDropdownModal = function() {
     
             // If user cancelled a new field, remove it
             if (dropdownModalContext?.isNewField) {
                 const { sectionIndex, fieldIndex } = dropdownModalContext;
                 const sec = activeTemplate.sections[sectionIndex];
                 sec.fields.splice(fieldIndex, 1);
             }
     
         const modal = document.getElementById('dropdown_modal');
         const backdrop = document.getElementById('dropdown_modal_backdrop');
         const container = document.getElementById('dropdown_options_container');
     
         backdrop.classList.add('hidden');
         modal.classList.add('hidden');
         container.innerHTML = '';
         dropdownModalContext = null;
     };
 
    const backdrop = document.getElementById('convert_modal_backdrop');
    const modal = document.getElementById('convert_modal');
    backdrop.classList.add('hidden');
    modal.classList.add('hidden');
    convertFieldContext = null;
};

// ============================================================================
// ADMIN NOTE MODAL
// ============================================================================
let adminNoteModalContext = null;

// Show admin note modal
window.showAdminNoteModal = function(field, sectionIndex, fieldIndex, oldType, currentLabel) {
    const modal = document.getElementById('adminnote_modal');
    const backdrop = document.getElementById('adminnote_modal_backdrop');
    const contentInput = document.getElementById('adminnote_content');
    
    // Store context
    adminNoteModalContext = { field, sectionIndex, fieldIndex, oldType, currentLabel };
    
    // Pre-fill with existing content
    contentInput.value = field.content || field.label || 'Important note';
    
    // Select current color
    const currentColor = field.color || 'blue';
    selectAdminNoteColor(currentColor);
    
    // Show modal
    backdrop.classList.remove('hidden');
    modal.classList.remove('hidden');
    contentInput.focus();
};

// Show admin note modal for new field
window.showAdminNoteModalForNewField = function(field, sectionIndex, fieldIndex) {
    const modal = document.getElementById('adminnote_modal');
    const backdrop = document.getElementById('adminnote_modal_backdrop');
    const contentInput = document.getElementById('adminnote_content');
    
    // Store context
    adminNoteModalContext = { field, sectionIndex, fieldIndex, isNewField: true };
    
    // Pre-fill with default
    contentInput.value = 'Important: Please review this section carefully.';
    
    // Select default color
    selectAdminNoteColor('yellow');
    
    // Show modal
    backdrop.classList.remove('hidden');
    modal.classList.remove('hidden');
    contentInput.focus();
};

// Select admin note color
window.selectAdminNoteColor = function(color) {
    // Store selected color
    if (!adminNoteModalContext) {
        adminNoteModalContext = {};
    }
    adminNoteModalContext.selectedColor = color;
    
    // Update UI to show selection
    document.querySelectorAll('.admin-note-color-btn').forEach(btn => {
        if (btn.dataset.color === color) {
            btn.classList.add('border-blue-500');
            btn.classList.remove('border-transparent');
        } else {
            btn.classList.remove('border-blue-500');
            btn.classList.add('border-transparent');
        }
    });
};

// Confirm and save admin note
window.confirmAdminNote = function() {
    if (!adminNoteModalContext) return;
    
    const { field, sectionIndex, fieldIndex, oldType, currentLabel, isNewField } = adminNoteModalContext;
    const contentInput = document.getElementById('adminnote_content');
    const noteContent = contentInput.value.trim();
    const selectedColor = adminNoteModalContext.selectedColor || 'blue';
    
    // Validate content
    if (!noteContent) {
        alert('Please enter note content');
        return;
    }
    
    // Save to field
    field.content = noteContent;
    field.label = noteContent;
    field.color = selectedColor;
    
    // Log change
    const sec = activeTemplate.sections[sectionIndex];
    const sectionTitle = sec.label || sec.title || 'Untitled Section';
    
    if (isNewField) {
        // For new fields, save to undo stack
        undoStack.push({
            action: 'addField',
            sectionIndex: sectionIndex,
            field: field
        });
        showUndoNotification();
    } else {
        // For field type conversions
        logChange('edited', sectionTitle, `Converted "${currentLabel}" from ${oldType} to admin-note`);
    }
    
    // Persist & re-render
    persistActiveTemplateChanges();
    renderTemplateSections(activeTemplate);
    showPublishIndicator();
    
    const action = isNewField ? 'Admin note created' : 'Field converted to admin note';
    console.log(`📌 ${action}:`, {color: selectedColor, content: noteContent, field});
    
    // Close modal
    closeAdminNoteModal();
};

// Close admin note modal
window.closeAdminNoteModal = function() {
    const modal = document.getElementById('adminnote_modal');
    const backdrop = document.getElementById('adminnote_modal_backdrop');
    const contentInput = document.getElementById('adminnote_content');
    
    // If user cancelled a new field, remove it
    if (adminNoteModalContext?.isNewField) {
        const { sectionIndex, fieldIndex } = adminNoteModalContext;
        const sec = activeTemplate.sections[sectionIndex];
        sec.fields.splice(fieldIndex, 1);
    }
    
    backdrop.classList.add('hidden');
    modal.classList.add('hidden');
    contentInput.value = '';
    
    // Reset color selection
    document.querySelectorAll('.admin-note-color-btn').forEach(btn => {
        btn.classList.remove('border-blue-500');
        btn.classList.add('border-transparent');
    });
    
    adminNoteModalContext = null;
};

// Patch deleteField & editField to use modal
const originalDeleteField = window.deleteField;
window.deleteField = async function(sectionIndex, fieldIndex) {
    if (!activeTemplate) return;
    const sec = activeTemplate.sections[sectionIndex];
    const field = sec.fields[fieldIndex];
    const confirmed = await showConfirm('Delete Field', `Are you sure you want to delete the field: "${field.label}"? This cannot be undone without using Undo.`);
    if (!confirmed) return;
        // Call original logic stripped of confirm
        // Save to undo stack
        undoStack.push({
            action: 'deleteField',
            sectionIndex: sectionIndex,
            fieldIndex: fieldIndex,
            field: { ...field }
        });
        sec.fields.splice(fieldIndex, 1);
        
        // Log the change
        const sectionTitle = sec.label || sec.title || 'Untitled Section';
        logChange('deleted', sectionTitle, `Deleted field: "${field.label}"`);
        
        renderTemplateSections(activeTemplate);
        persistActiveTemplateChanges();
        showUndoNotification();
        showPublishIndicator();
        console.log('🗑️ Field deleted:', field);
};

const originalEditField = window.editField;
window.editField = async function(sectionIndex, fieldIndex) {
    if (!activeTemplate) return;
    const sec = activeTemplate.sections[sectionIndex];
    const field = sec.fields[fieldIndex];
    const confirmed = await showConfirm('Edit Field', `You are about to edit the field: "${field.label}". Continue?`);
    if (!confirmed) return;
        const currentLabel = field.label || '';
        const currentType = field.type || 'text';
        let changeDetails = [];
        
        if (currentType === 'admin-note') {
            // Append instead of replace
            const addContent = prompt('Add more to Admin Note (appends):', '');
            if (addContent) {
                field.content = (field.content ? field.content + '\n' : '') + addContent;
                field.label = field.content; // keep label synced
                changeDetails.push('Updated admin note content');
            }
        } else {
            const newLabel = prompt('Edit Field Label:', currentLabel);
            if (newLabel !== null && newLabel !== '' && newLabel !== currentLabel) {
                field.label = newLabel;
                changeDetails.push(`Changed label from "${currentLabel}" to "${newLabel}"`);
            }
        }
        const newType = prompt('Edit Field Type (text, textarea, date, choice, admin-note):', currentType);
        if (newType && ["text","textarea","date","choice","notes","admin-note"].includes(newType) && newType !== currentType) {
            field.type = newType;
            changeDetails.push(`Changed type from ${currentType} to ${newType}`);
            if (newType === 'choice' && !field.choices) {
                const choicesInput = prompt('Enter choices (comma-separated):', 'Yes,No');
                if (choicesInput) field.choices = choicesInput.split(',').map(c=>c.trim());
            }
            if (newType === 'admin-note' && !field.content) {
                const noteContent = prompt('Enter initial admin note:', 'Important:');
                if (noteContent) { field.content = noteContent; field.label = noteContent; }
            }
        }
        
        // Log the change if any modifications were made
        if (changeDetails.length > 0) {
            const sectionTitle = sec.label || sec.title || 'Untitled Section';
            logChange('edited', sectionTitle, `Field "${currentLabel}": ${changeDetails.join(', ')}`);
        }
        
        // Persist changes to localStorage
        persistActiveTemplateChanges();
        
        renderTemplateSections(activeTemplate);
        console.log('✏️ Field updated (modal flow):', field);
        
        // Show publish button indicator
        showPublishIndicator();
};

// ============================================================================
// TEMPLATE MANAGER UI
// ============================================================================
function renderTemplateManager() {
    const container = document.getElementById('templateList');
    if (!container) return;
    const programFilterEl = document.getElementById('programFilter');
    const searchEl = document.getElementById('managerSearch');
    const selectedProgram = programFilterEl ? programFilterEl.value : '';
    const searchQuery = searchEl ? searchEl.value.trim().toLowerCase() : '';

    // Imported templates filtered by program + keyword search (template name or program)
    const importedTemplates = allTemplates.filter(t => {
        if (!t.imported) return false;
        if (selectedProgram && t.program !== selectedProgram) return false;
        if (searchQuery) {
            const hayName = t.name ? t.name.toLowerCase() : '';
            const hayProg = t.program ? t.program.toLowerCase() : '';
            if (!hayName.includes(searchQuery) && !hayProg.includes(searchQuery)) return false;
        }
        return true;
    });
    
    if (importedTemplates.length === 0) {
        container.innerHTML = '<p class="text-xs text-slate-500">No uploaded templates yet. Use the Upload Template button above.</p>';
        return;
    }
    
    // Group by program
    const byProgram = {};
    importedTemplates.forEach(tpl => {
        const prog = tpl.program || 'General';
        if (!byProgram[prog]) byProgram[prog] = [];
        byProgram[prog].push(tpl);
    });
    
    // Render program tabs
    let html = '';
    Object.keys(byProgram).sort().forEach(program => {
        html += `
            <div class="border border-slate-200 rounded-lg p-3 mb-3">
                <h3 class="text-sm font-bold text-slate-700 mb-2">${program}</h3>
                <div class="space-y-2">
        `;
        
        byProgram[program].forEach(tpl => {
            const isHidden = tpl.hidden || false;
            const hiddenClass = isHidden ? 'opacity-50' : '';
            
            html += `
                <div class="border border-slate-300 rounded-md p-2 ${hiddenClass}">
                    <div class="flex items-center justify-between">
                        <div class="flex-1">
                            <div class="text-sm font-semibold text-slate-800">${tpl.name}</div>
                            <div class="text-xs text-slate-500">${tpl.sections?.length || 0} sections • ${tpl.file}</div>
                            ${isHidden ? '<span class="text-xs text-red-600">🚫 Hidden</span>' : ''}
                        </div>
                        <div class="flex gap-1">
                            <button onclick="previewTemplate('${tpl.file}')" class="px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200" title="Preview">👁️</button>
                            <button onclick="editTemplateMetadata('${tpl.file}')" class="px-2 py-1 text-xs bg-green-100 text-green-700 rounded hover:bg-green-200" title="Edit Sections">✏️</button>
                            <button onclick="renameTemplate('${tpl.file}')" class="px-2 py-1 text-xs bg-yellow-100 text-yellow-700 rounded hover:bg-yellow-200" title="Rename">📝</button>
                            <button onclick="toggleTemplateVisibility('${tpl.file}')" class="px-2 py-1 text-xs bg-purple-100 text-purple-700 rounded hover:bg-purple-200" title="${isHidden ? 'Show' : 'Hide'}">${isHidden ? '👁️' : '🚫'}</button>
                            <button onclick="deleteTemplate('${tpl.file}')" class="px-2 py-1 text-xs bg-red-100 text-red-700 rounded hover:bg-red-200" title="Delete">🗑️</button>
                        </div>
                    </div>
                </div>
            `;
        });
        
        html += `
                </div>
            </div>
        `;
    });
    
    container.innerHTML = html;
}

// Initialize template manager filters (program dropdown + search events)
function initTemplateManagerFilters() {
    const programFilterEl = document.getElementById('programFilter');
    const searchEl = document.getElementById('managerSearch');
    if (!programFilterEl) return; // Admin panel may not be present yet

    // Populate program dropdown
    const programs = [...new Set(allTemplates.filter(t=>t.imported).map(t => t.program || 'General'))].sort();
    programFilterEl.innerHTML = '<option value="">All Programs</option>' + programs.map(p => `<option value="${p}">${p}</option>`).join('');

    // Event listeners
    programFilterEl.addEventListener('change', () => {
        renderTemplateManager();
    });
    if (searchEl) {
        searchEl.addEventListener('input', () => {
            renderTemplateManager();
        });
    }
}

// ============================================================================
// TEMPLATE PREVIEW MODAL
// ============================================================================
let previewedTemplateFile = null;

// Preview template in modal
window.previewTemplate = function(file) {
    const tpl = allTemplates.find(t => t.file === file);
    if (!tpl) return;
    
    // Store for "Load This Template" button
    previewedTemplateFile = file;
    
    // Set header info
    document.getElementById('preview_title').textContent = tpl.name;
    document.getElementById('preview_subtitle').textContent = `${tpl.program} • ${tpl.sections.length} section${tpl.sections.length !== 1 ? 's' : ''}`;
    
    // Render template preview
    const container = document.getElementById('preview_content');
    container.innerHTML = '';
    
    tpl.sections.forEach((sec, sectionIndex) => {
        const sectionDiv = document.createElement('div');
        sectionDiv.className = 'bg-white rounded-lg border border-slate-200 p-5 mb-4 shadow-sm';
        
        const sectionTitle = sec.label || sec.title || 'Untitled Section';
        const requiredBadge = sec.required ? `<span class=\"ml-2 px-2 py-0.5 bg-red-50 text-red-600 border border-red-200 rounded-full text-[10px] font-semibold\">Required</span>` : '';
        
        let sectionHTML = `
            <div class=\"flex items-center mb-4\"> 
                <div class=\"text-xs font-semibold text-slate-500 tracking-wide\">SECTION ${String(sectionIndex + 1).padStart(2, '0')}</div>
            </div>
            <h3 class=\"text-base font-bold text-slate-900 mb-4 flex items-center\">${sectionTitle}${requiredBadge}</h3>
        `;
        
        // Render fields
        if (sec.fields && sec.fields.length > 0) {
            sec.fields.forEach((f) => {
                const label = f.label || f.title || 'Untitled Field';
                
                if (f.type === 'admin-note') {
                    const noteContent = f.content || f.label || '';
                    const color = f.color || 'blue';
                    sectionHTML += `
                        <div class=\"mb-3\">
                            <div class=\"p-3 bg-${color}-50 border-l-4 border-${color}-500 rounded\">
                                <div class=\"text-xs font-semibold text-${color}-700 mb-1\">📌 Admin Note</div>
                                <p class=\"text-sm text-${color}-900\">${noteContent}</p>
                            </div>
                        </div>
                    `;
                } else if (f.type === 'textarea' || f.type === 'notes') {
                    sectionHTML += `
                        <div class=\"mb-3\">
                            <label class=\"text-xs text-slate-600 block mb-1 font-medium\">${label}</label>
                            <div class=\"w-full rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 text-sm text-slate-400 min-h-[60px]\">
                                (Multi-line text input)
                            </div>
                        </div>
                    `;
                } else if (f.type === 'text') {
                    sectionHTML += `
                        <div class=\"mb-3\">
                            <label class=\"text-xs text-slate-600 block mb-1 font-medium\">${label}</label>
                            <div class=\"w-full rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 text-sm text-slate-400\">
                                (Text input)
                            </div>
                        </div>
                    `;
                } else if (f.type === 'date') {
                    sectionHTML += `
                        <div class=\"mb-3\">
                            <label class=\"text-xs text-slate-600 block mb-1 font-medium\">${label}</label>
                            <div class=\"w-full rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 text-sm text-slate-400\">
                                📅 (Date picker)
                            </div>
                        </div>
                    `;
                } else if (f.type === 'choice' && f.choices) {
                    sectionHTML += `
                        <div class=\"mb-3\">
                            <label class=\"text-xs text-slate-600 block mb-1 font-medium\">${label}</label>
                            <div class=\"w-full rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 text-sm\">
                                <div class=\"flex items-center justify-between\">
                                    <span class=\"text-slate-700\">${f.choices[0]}</span>
                                    <span class=\"text-slate-400\">▼</span>
                                </div>
                                <div class=\"text-xs text-slate-400 mt-1\">${f.choices.length} option${f.choices.length !== 1 ? 's' : ''}: ${f.choices.join(', ')}</div>
                            </div>
                        </div>
                    `;
                }
            });
        } else {
            sectionHTML += `<p class=\"text-sm text-slate-400 italic\">No fields in this section</p>`;
        }
        
        sectionDiv.innerHTML = sectionHTML;
        container.appendChild(sectionDiv);
    });
    
    // Show modal
    const modal = document.getElementById('preview_modal');
    const backdrop = document.getElementById('preview_modal_backdrop');
    backdrop.classList.remove('hidden');
    modal.classList.remove('hidden');
};

// Load the previewed template
window.loadPreviewedTemplate = function() {
    if (!previewedTemplateFile) return;
    
    const tpl = allTemplates.find(t => t.file === previewedTemplateFile);
    if (!tpl) return;
    
    // Close modal
    closePreviewModal();
    
    // Load template
    activeTemplate = {
  ...newTemplate,
  sections: normalizeTemplateSections(newTemplate.sections || [])
};
    document.getElementById('currentTemplateTag').textContent = tpl.name;
    renderTemplateSections(tpl);
    renderSidebarFromTemplate(tpl);
    
    console.log('✅ Loaded template from preview:', tpl.name);
};

// Close preview modal
window.closePreviewModal = function() {
    const modal = document.getElementById('preview_modal');
    const backdrop = document.getElementById('preview_modal_backdrop');
    const container = document.getElementById('preview_content');
    
    backdrop.classList.add('hidden');
    modal.classList.add('hidden');
    container.innerHTML = '';
    previewedTemplateFile = null;
};

// Edit template metadata and sections
window.editTemplateMetadata = function(file) {
    const tpl = allTemplates.find(t => t.file === file);
    if (!tpl) return;
    
    // Load and activate this template for editing
    document.getElementById('currentTemplateTag').textContent = activeTemplate.name;
renderTemplateSections(activeTemplate);
renderSidebarFromTemplate(activeTemplate);

    
    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });
    
    alert(`Template "${tpl.name}" is now loaded for editing. Use the admin controls on each section to make changes.`);
};

// Rename template
window.renameTemplate = function(file) {
    const tpl = allTemplates.find(t => t.file === file);
    if (!tpl) return;
    
    const newName = prompt('Enter new template name:', tpl.name);
    if (!newName || newName === tpl.name) return;
    
    // Update template name
    tpl.name = newName;
    
    // Update in localStorage
    localStorage.setItem(PERSIST_PREFIX + tpl.file, JSON.stringify(tpl));
    
    // Update in templatesIndex
    Object.keys(templatesIndex).forEach(prog => {
        const entry = templatesIndex[prog].find(t => t.file === file);
        if (entry) {
            entry.name = newName;
            entry.updated = new Date().toISOString();
        }
    });
    localStorage.setItem('dpss_templatesIndex', JSON.stringify(templatesIndex));
    
    // Refresh UI
    refreshTemplateDropdown();
    renderTemplateManager();
    
    if (activeTemplate && activeTemplate.file === file) {
        document.getElementById('currentTemplateTag').textContent = newName;
    }
    
    alert(`Template renamed to "${newName}"`);
};

// Toggle template visibility
window.toggleTemplateVisibility = function(file) {
    const tpl = allTemplates.find(t => t.file === file);
    if (!tpl) return;
    
    tpl.hidden = !tpl.hidden;
    
    // Update in localStorage
    localStorage.setItem(PERSIST_PREFIX + tpl.file, JSON.stringify(tpl));
    
    // Update in templatesIndex
    Object.keys(templatesIndex).forEach(prog => {
        const entry = templatesIndex[prog].find(t => t.file === file);
        if (entry) {
            entry.hidden = tpl.hidden;
            entry.updated = new Date().toISOString();
        }
    });
    localStorage.setItem('dpss_templatesIndex', JSON.stringify(templatesIndex));
    
    // Refresh UI
    refreshTemplateDropdown();
    renderTemplateManager();
    
    alert(`Template "${tpl.name}" is now ${tpl.hidden ? 'hidden' : 'visible'}`);
};

// Delete template - only allows deleting uploaded templates (not built-in)
window.deleteTemplate = async function(file) {
    const tpl = allTemplates.find(t => t.file === file);
    if (!tpl) {
        alert('Template not found.');
        return;
    }
    
    // Safety check: only allow deleting uploaded templates
    if (!tpl.imported) {
        alert('Cannot delete built-in system templates. Only uploaded templates can be deleted.');
        return;
    }
    
    const confirmed = await showConfirm(
        'Delete Template',
        `Are you sure you want to delete "${tpl.name}"? This cannot be undone.`
    );
    
    if (!confirmed) return;
    
    // Show delete toast with loading state
    showDeleteToast(tpl.name, 'loading');
    
    // Simulate async deletion with slight delay for better UX
    await new Promise(resolve => setTimeout(resolve, 800));
    
    // 1. Remove from localStorage
    localStorage.removeItem(PERSIST_PREFIX + file);
    console.log('🗑️ Removed from localStorage:', PERSIST_PREFIX + file);
    
    // 2. Remove from templatesIndex
    Object.keys(templatesIndex).forEach(prog => {
        templatesIndex[prog] = templatesIndex[prog].filter(t => t.file !== file);
    });
    localStorage.setItem('dpss_templatesIndex', JSON.stringify(templatesIndex));
    console.log('📋 Updated templatesIndex, removed:', file);
    
    // 3. Remove from allTemplates array
    const idx = allTemplates.indexOf(tpl);
    if (idx > -1) {
        allTemplates.splice(idx, 1);
        console.log('📦 Removed from allTemplates[]:', tpl.name);
    }
    
    // 4. Clear active template if it was the deleted one
    if (activeTemplate && activeTemplate.file === file) {
        activeTemplate = null;
        document.getElementById('currentTemplateTag').textContent = 'Default Template';
        showPlaceholders();
        console.log('🔄 Cleared active template');
    }
    
    // 5. Refresh UI
    refreshTemplateDropdown();
    renderTemplateManager();
    
    // 6. Show success state
    showDeleteToast(tpl.name, 'success');
    console.log('✅ Delete complete:', tpl.name);
    
    // Hide toast after 2 seconds
    setTimeout(() => {
        hideDeleteToast();
    }, 2000);
};

// Show delete toast notification
function showDeleteToast(templateName, state) {
    const toast = document.getElementById('deleteToast');
    const spinner = document.getElementById('deleteSpinner');
    const icon = document.getElementById('deleteIcon');
    const message = document.getElementById('deleteMessage');
    const subtext = document.getElementById('deleteSubtext');
    
    if (!toast) return;
    
    if (state === 'loading') {
        spinner.style.display = 'block';
        icon.style.display = 'none';
        message.textContent = 'Deleting...';
        subtext.textContent = templateName;
    } else if (state === 'success') {
        spinner.style.display = 'none';
        icon.style.display = 'block';
        message.textContent = 'Template Deleted!';
        message.className = 'text-lg font-bold text-green-600 mb-1';
        subtext.textContent = `"${templateName}" has been removed`;
    }
    
    toast.classList.add('visible');
}

// Hide delete toast
function hideDeleteToast() {
    const toast = document.getElementById('deleteToast');
    if (toast) {
        toast.classList.remove('visible');
        // Reset to loading state for next use
        setTimeout(() => {
            document.getElementById('deleteMessage').className = 'text-lg font-bold text-slate-800 mb-1';
        }, 300);
    }
}

// ============================================================================
// SCROLL BUTTONS
// ============================================================================
function initScrollButtons() {
    const scrollToTop = document.getElementById('scrollToTop');
    const scrollToBottom = document.getElementById('scrollToBottom');
    
    if (!scrollToTop || !scrollToBottom) return;
    
    // Show/hide buttons based on scroll position
    function updateScrollButtons() {
        const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
        const scrollHeight = document.documentElement.scrollHeight;
        const clientHeight = document.documentElement.clientHeight;
        const atTop = scrollTop < 200;
        const atBottom = scrollTop + clientHeight >= scrollHeight - 100;
        
        // Show top button if not at top
        if (atTop) {
            scrollToTop.classList.remove('visible');
        } else {
            scrollToTop.classList.add('visible');
        }
        
        // Show bottom button if not at bottom
        if (atBottom) {
            scrollToBottom.classList.remove('visible');
        } else {
            scrollToBottom.classList.add('visible');
        }
    }
    
    // Scroll to top
    scrollToTop.addEventListener('click', () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    });
    
    // Scroll to bottom
    scrollToBottom.addEventListener('click', () => {
        window.scrollTo({ top: document.documentElement.scrollHeight, behavior: 'smooth' });
    });
    
    // Update button visibility on scroll
    window.addEventListener('scroll', updateScrollButtons);
    
    // Initial check
    updateScrollButtons();
}

// ============================================================================
// CHANGE TRACKER
// ============================================================================
function logChange(type, section, details) {
    const change = {
        type: type, // 'added', 'edited', 'deleted'
        section: section,
        details: details,
        timestamp: new Date().toLocaleTimeString()
    };
    
    changeLog.push(change);
    updateChangeTracker();
    showChangeTracker();
}

function updateChangeTracker() {
    const body = document.getElementById('changesBody');
    const count = document.getElementById('changesCount');
    
    if (!body || !count) return;
    
    count.textContent = `${changeLog.length} change${changeLog.length !== 1 ? 's' : ''}`;
    
    if (changeLog.length === 0) {
        body.innerHTML = '<p class="text-xs text-slate-400 text-center py-4">No changes yet</p>';
        return;
    }
    
    // Show most recent changes first
    const html = changeLog.slice().reverse().map(change => {
        let typeLabel = '';
        let icon = '';
        switch(change.type) {
            case 'added':
                typeLabel = 'Added';
                icon = '➕';
                break;
            case 'edited':
                typeLabel = 'Edited';
                icon = '✏️';
                break;
            case 'deleted':
                typeLabel = 'Deleted';
                icon = '🗑️';
                break;
        }
        
        return `
            <div class="change-item ${change.type}">
                <div class="change-type" style="color: ${change.type === 'added' ? '#10b981' : change.type === 'edited' ? '#f59e0b' : '#ef4444'}">
                    ${icon} ${typeLabel}
                </div>
                <div class="change-details">
                    <strong>${change.section}</strong><br>
                    ${change.details}
                </div>
                <div class="change-timestamp">${change.timestamp}</div>
            </div>
        `;
    }).join('');
    
    body.innerHTML = html;
}

function showChangeTracker() {
    const tracker = document.getElementById('changesTracker');
    if (!tracker) return;
    
    tracker.classList.add('visible');
}

function hideChangeTracker() {
    const tracker = document.getElementById('changesTracker');
    if (!tracker) return;
    
    if (changeLog.length === 0) {
        tracker.classList.remove('visible');
    }
}

window.clearChangeLog = function() {
    if (changeLog.length === 0) return;
    
    if (confirm('Clear all change history? This will not undo the changes, only clear the log.')) {
        changeLog = [];
        updateChangeTracker();
        hideChangeTracker();
    }
};

// ============================================================================
// PUBLISH BUTTON
// ============================================================================
function initPublishButton() {
    const publishBtn = document.getElementById('publishBtn');
    if (!publishBtn) return;
    
    publishBtn.addEventListener('click', async () => {
        if (!activeTemplate) {
            alert('No active template to publish.');
            return;
        }
        
        const confirmed = await showConfirm(
            'Publish Changes',
            `Are you sure you want to publish all changes to "${activeTemplate.name}"? This will save the current structure permanently.`
        );
        
        if (!confirmed) return;
        // Show saving toast (loading)
        showSaveToast('loading', activeTemplate.name);
        
        // Simulate brief processing delay for UX
        await new Promise(r => setTimeout(r, 600));
        
        // Save to localStorage
        persistActiveTemplateChanges();
        
        // Update templatesIndex
        Object.keys(templatesIndex).forEach(prog => {
            const entry = templatesIndex[prog].find(t => t.file === activeTemplate.file);
            if (entry) {
                entry.updated = new Date().toISOString();
            }
        });
        localStorage.setItem('dpss_templatesIndex', JSON.stringify(templatesIndex));
        
        // Hide publish button
        publishBtn.classList.remove('visible', 'pulsing');
        
        // Clear change log after successful publish
        changeLog = [];
        updateChangeTracker();
        hideChangeTracker();
        
        // Show success state and auto-hide
        showSaveToast('success', activeTemplate.name);
        setTimeout(() => { hideSaveToast(); }, 2000);

        // Reload template from disk and re-render UI
        const filePath = `templates/${activeTemplate.program}/${activeTemplate.file}`;
        fetch(filePath)
            .then(r => r.json())
            .then(freshTemplate => {
                activeTemplate.sections = freshTemplate.sections;
                renderTemplateSections(activeTemplate);
                renderSidebarFromTemplate(activeTemplate);
            });
        
        console.log('📤 Published changes:', activeTemplate);
    });
}

// Show publish button indicator
window.showPublishIndicator = function() {
    const publishBtn = document.getElementById('publishBtn');
    if (!publishBtn) return;
    
    publishBtn.classList.add('visible', 'pulsing');
};

// ============================================================================
// INIT
// ============================================================================
window.addEventListener("load", async () => {
    await loadAllTemplates();
    showPlaceholders(); // Show initial placeholder state
    initHeaderFilters();
    initDarkMode();
    initAdminMode();
    initSidebarNavigation();
    initGenerateJournal();
    initTemplateExport();
    initUploadTemplate();
    initTemplateManagerFilters(); // Populate filters before initial render
    renderTemplateManager(); // Render template manager on load
    initScrollButtons(); // Initialize scroll buttons
    initPublishButton(); // Initialize publish button
    initRefreshButton(); // Initialize refresh button
    // Initialize Clear Values button
    initClearValuesButton();
});
console.log("🔥🔥 app.js is LOADED from LIVE SERVER 🔥🔥");

// ============================================
// SAVE/PUBLISH TOAST HELPERS
// ============================================
function showSaveToast(state, templateName) {
    const toast = document.getElementById('saveToast');
    const spinner = document.getElementById('saveSpinner');
    const icon = document.getElementById('saveIcon');
    const message = document.getElementById('saveMessage');
    const subtext = document.getElementById('saveSubtext');
    if (!toast) return;
    
    if (state === 'loading') {
        spinner.style.display = 'block';
        icon.style.display = 'none';
        message.textContent = 'Saving...';
        message.className = 'text-lg font-bold text-slate-800 mb-1';
        subtext.textContent = templateName ? `Updating "${templateName}"` : '';
    } else if (state === 'success') {
        spinner.style.display = 'none';
        icon.style.display = 'block';
        message.textContent = 'Changes have been saved!';
        message.className = 'text-lg font-bold text-green-600 mb-1';
        subtext.textContent = templateName ? `"${templateName}" updated successfully` : '';
    }
    
    toast.classList.add('visible');
}

function hideSaveToast() {
    const toast = document.getElementById('saveToast');
    if (toast) {
        toast.classList.remove('visible');
        setTimeout(() => {
            const msg = document.getElementById('saveMessage');
            if (msg) msg.className = 'text-lg font-bold text-slate-800 mb-1';
        }, 300);
    }
}

// ============================================
// REFRESH BUTTON & TOAST
// ============================================
function initRefreshButton() {
    const btn = document.getElementById('refreshAppBtn');
    if (!btn) return;
    btn.addEventListener('click', async () => {
        await refreshApplicationState();
    });
}

async function refreshApplicationState() {
    showRefreshToast('loading');
    // Simulate slight delay for UX
    await new Promise(r => setTimeout(r, 500));
    // Reload all templates
    await loadAllTemplates();
    // Reset active template and show placeholders
    activeTemplate = null;
    document.getElementById('currentTemplateTag').textContent = 'Default Template';
    showPlaceholders();
    // Re-render manager
    renderTemplateManager();
    // Hide publish button & change tracker
    const publishBtn = document.getElementById('publishBtn');
    if (publishBtn) publishBtn.classList.remove('visible','pulsing');
    changeLog = [];
    updateChangeTracker();
    hideChangeTracker();
    // Success state
    showRefreshToast('success');
    setTimeout(() => hideRefreshToast(), 2000);
    console.log('🔄 Application state refreshed');
}

function showRefreshToast(state) {
    const toast = document.getElementById('refreshToast');
    const spinner = document.getElementById('refreshSpinner');
    const icon = document.getElementById('refreshIcon');
    const message = document.getElementById('refreshMessage');
    const subtext = document.getElementById('refreshSubtext');
    if (!toast) return;
    if (state === 'loading') {
        spinner.style.display = 'block';
        icon.style.display = 'none';
        message.textContent = 'Refreshing...';
        message.className = 'text-lg font-bold text-slate-800 mb-1';
        subtext.textContent = 'Please wait';
    } else if (state === 'success') {
        spinner.style.display = 'none';
        icon.style.display = 'block';
        message.textContent = 'Refreshed SSD Journal Builder';
        message.className = 'text-lg font-bold text-indigo-600 mb-1';
        subtext.textContent = 'Content reloaded';
    }
    toast.classList.add('visible');
}

function hideRefreshToast() {
    const toast = document.getElementById('refreshToast');
    if (toast) {
        toast.classList.remove('visible');
        setTimeout(() => {
            const msg = document.getElementById('refreshMessage');
            if (msg) msg.className = 'text-lg font-bold text-slate-800 mb-1';
        }, 300);
    }
}
// ============================================================================
// FLOATING PROGRESS BAR — FINAL, SAFE, DPSS-FRIENDLY
// ============================================================================
// ============================================================================
// FLOATING PROGRESS BAR — FINAL (ARROW-ONLY SECTION NAVIGATION)
// No section list (prevents overload)
// Progress logic UNCHANGED
// 2025-12-16
// ============================================================================

(function initFloatingProgressBar() {

    function start() {
        if (!document.body) return;
        if (document.getElementById('floatingProgressBar')) return;

        // ===========================================================
        // UI
        // ===========================================================
        const bar = document.createElement('div');
        bar.id = 'floatingProgressBar';
        bar.innerHTML = `
            <div id="progressBarLabel">0% — Let’s get started!</div>
            <div id="progressBarTrack">
                <div id="progressBarFill"></div>
            </div>

            <div style="display:flex;gap:8px;margin-top:10px;">
                <button id="prevSectionBtn" disabled>⬆ Prev</button>
                <button id="nextSectionBtn" disabled>⬇ Next</button>
            </div>
        `;
        document.body.appendChild(bar);

        // ===========================================================
        // Styles
        // ===========================================================
        const style = document.createElement('style');
        style.textContent = `
            #floatingProgressBar {
                position: fixed;
                bottom: 24px;
                right: 24px;
                width: 300px;
                background: #ffffff;
                border-radius: 16px;
                box-shadow: 0 12px 28px rgba(0,0,0,0.18);
                padding: 18px;
                font-family: system-ui, -apple-system, BlinkMacSystemFont, sans-serif;
                z-index: 10000;
            }

            #progressBarLabel {
                text-align: center;
                margin-bottom: 10px;
                font-weight: 600;
                font-size: 13px;
                color: #1f2937;
            }

            #progressBarTrack {
                width: 100%;
                height: 16px;
                background: #e5e7eb;
                border-radius: 999px;
                overflow: hidden;
            }

            #progressBarFill {
                height: 100%;
                width: 0%;
                background: linear-gradient(90deg, #22c55e, #16a34a);
                transition: width 0.35s ease;
            }

            #prevSectionBtn,
            #nextSectionBtn {
                flex: 1;
                background: #22c55e;
                color: white;
                border: none;
                border-radius: 10px;
                padding: 6px;
                font-size: 12px;
                cursor: pointer;
            }

            #prevSectionBtn:disabled,
            #nextSectionBtn:disabled {
                opacity: 0.4;
                cursor: default;
            }

            .section-highlight {
                outline: 2px solid #22c55e;
                outline-offset: 4px;
                transition: outline 0.3s ease;
            }
        `;
        document.head.appendChild(style);

        // ===========================================================
        // Motivation messages (UNCHANGED)
        // ===========================================================
        function getMotivationMessage(percent) {
            if (percent === 100) return "✅ Journal Complete — Ready to generate";
            if (percent >= 90) return "🔥 Final stretch — almost there!";
            if (percent >= 75) return "🚀 Almost done — keep going!";
            if (percent >= 60) return "💪 Strong progress — past halfway!";
            if (percent >= 40) return "📈 Good momentum — stay focused!";
            if (percent >= 20) return "📝 Nice start — keep it moving!";
            return "👋 Let’s get started!";
        }

        // ===========================================================
        // Helpers
        // ===========================================================
        function getSectionForField(field) {
            return field.closest('[data-section-id], .journal-section, section');
        }

        function navigateToSection(section) {
            if (!section) return;

            section.scrollIntoView({ behavior: 'smooth', block: 'start' });
            section.classList.add('section-highlight');

            setTimeout(() => {
                section.classList.remove('section-highlight');
            }, 1200);
        }

        // ===========================================================
        // Progress + SECTION Missing Logic
        // ===========================================================
        let missingSections = [];
        let sectionIndex = 0;

        function updateProgressBar() {
            const container = document.getElementById('dynamicCoreSections');
            if (!container) return;

            const fields = container.querySelectorAll('input, textarea, select');

            let total = 0;
            let completed = 0;
            const sectionSet = new Set();

            fields.forEach(field => {

                if (
                    field.disabled ||
                    field.type === 'hidden' ||
                    field.offsetParent === null
                ) return;

                if (field.dataset?.type === 'note') return;
                if (field.closest('[id^="clarification-container"]')) return;

                total++;

                let isComplete = false;

                if (field.tagName === 'SELECT') {
                    const txt =
                        field.options[field.selectedIndex]?.text?.trim() || '';
                    if (txt && !txt.toLowerCase().startsWith('choose')) {
                        isComplete = true;
                    }
                } else if (
                    (field.tagName === 'INPUT' || field.tagName === 'TEXTAREA') &&
                    field.value.trim() !== ''
                ) {
                    isComplete = true;
                }

                if (isComplete) {
                    completed++;
                } else {
                    const section = getSectionForField(field);
                    if (section) sectionSet.add(section);
                }
            });

            missingSections = Array.from(sectionSet);

            const percent = total === 0
                ? 0
                : Math.round((completed / total) * 100);

            document.getElementById('progressBarFill').style.width =
                `${percent}%`;

            document.getElementById('progressBarLabel').textContent =
                `${percent}% — ${getMotivationMessage(percent)}`;

            const prevBtn = document.getElementById('prevSectionBtn');
            const nextBtn = document.getElementById('nextSectionBtn');

            if (missingSections.length && percent < 100) {
                prevBtn.disabled = false;
                nextBtn.disabled = false;

                if (sectionIndex >= missingSections.length) {
                    sectionIndex = 0;
                }
            } else {
                prevBtn.disabled = true;
                nextBtn.disabled = true;
            }
        }

        // ===========================================================
        // Arrow Navigation (SECTION-ONLY)
        // ===========================================================
        document.getElementById('nextSectionBtn').onclick = () => {
            if (!missingSections.length) return;
            navigateToSection(missingSections[sectionIndex]);
            sectionIndex = (sectionIndex + 1) % missingSections.length;
        };

        document.getElementById('prevSectionBtn').onclick = () => {
            if (!missingSections.length) return;
            sectionIndex =
                (sectionIndex - 1 + missingSections.length) % missingSections.length;
            navigateToSection(missingSections[sectionIndex]);
        };

        // ===========================================================
        // Events (UNCHANGED)
        // ===========================================================
        document.addEventListener('input', updateProgressBar, true);
        document.addEventListener('change', updateProgressBar, true);

        const observer = new MutationObserver(updateProgressBar);
        observer.observe(document.getElementById('dynamicCoreSections'), {
            childList: true,
            subtree: true
        });

        updateProgressBar();
        console.log('🟢 Floating progress bar (arrow-only section navigation) initialized');
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', start);
    } else {
        start();
    }

})();
// ============================================================================
// SECTION WIZARD – ISOLATED SAFE MVP (FINAL)
// Date: 2025-12-22
// Purpose: Create new blank sections via Admin-only wizard
// IMPORTANT:
// - Does NOT touch dropdowns, loaders, or conversion utilities
// - Operates ONLY on activeTemplate.sections
// ============================================================================

/* ---------------------------------------------------------------------------
   Inject "+ Create New Section" button (Admin only)
--------------------------------------------------------------------------- */
function ensureCreateNewSectionButton() {
    if (!document.body.classList.contains("admin-mode")) return;
    if (document.getElementById("createNewSectionBtn")) return;

    const btn = document.createElement("button");
    btn.id = "createNewSectionBtn";
    btn.textContent = "+ Create New Section";
    btn.className = "create-new-section-btn";
    btn.style.position = "fixed";
    btn.style.bottom = "24px";
    btn.style.right = "24px";
    btn.style.zIndex = "9999";

    btn.addEventListener("click", openSectionWizard);
    document.body.appendChild(btn);

    console.log("🧩 Create New Section button injected");
}

/* 🔑 IMPORTANT: Admin mode is applied AFTER load → observe it */
const adminModeObserver = new MutationObserver(() => {
    if (document.body.classList.contains("admin-mode")) {
        ensureCreateNewSectionButton();
    }
});
adminModeObserver.observe(document.body, {
    attributes: true,
    attributeFilter: ["class"]
});

/* ---------------------------------------------------------------------------
   Wizard State
--------------------------------------------------------------------------- */
let sectionWizardState = {
    step: 1,
    section: {
        id: "",
        title: "",
        required: false,
        description: "",
        fields: []
    }
};

/* ---------------------------------------------------------------------------
   Open Wizard
--------------------------------------------------------------------------- */
function openSectionWizard() {
    console.log("🟢 openSectionWizard fired");

    // 🔥 TEMP: bypass guards for validation
    if (!window.activeTemplate) {
        window.activeTemplate = { sections: [] };
        console.warn("⚠️ activeTemplate was missing — stubbed");
    }

    if (!Array.isArray(activeTemplate.sections)) {
        activeTemplate.sections = [];
        console.warn("⚠️ sections array was missing — fixed");
    }

    sectionWizardState = {
        step: 1,
        section: {
            id: `section_${crypto.randomUUID()}`,
            title: "",
            required: false,
            description: "",
            fields: []
        }
    };

    const existing = document.getElementById("sectionWizardModal");
    if (existing) existing.remove();

    const modal = document.createElement("div");
    modal.id = "sectionWizardModal";
    modal.style.position = "fixed";
    modal.style.inset = "0";
    modal.style.background = "rgba(0,0,0,0.45)";
    modal.style.zIndex = "99999";

    modal.innerHTML = `
        <div style="
            background:#fff;
            max-width:600px;
            margin:10vh auto;
            padding:24px;
            border-radius:12px;
        ">
            ${renderSectionWizardStep()}
        </div>
    `;

    modal.addEventListener("click", handleWizardActions);
    document.body.appendChild(modal);

    console.log("🟢 Section Wizard opened (forced)");
}

/* ---------------------------------------------------------------------------
   Render Wizard Steps
--------------------------------------------------------------------------- */
function renderSectionWizardStep() {
    const s = sectionWizardState.section;

    if (sectionWizardState.step === 1) {
        return `
            <h2>Create Section</h2>

            <label>
                Title
                <input id="sectionTitle" value="${s.title}" />
            </label>

            <label>
                <input type="checkbox" id="sectionRequired" ${s.required ? "checked" : ""}/>
                Required
            </label>

            <label>
                Description
                <textarea id="sectionDescription">${s.description}</textarea>
            </label>

            <button data-action="next">Next</button>
            <button data-action="close">Cancel</button>
        `;
    }

    if (sectionWizardState.step === 2) {
        const fields = s.fields.map((f, i) => `
            <div>
                <strong>${f.label}</strong> (${f.type})
                <button data-remove="${i}">Remove</button>
            </div>
        `).join("");

        return `
            <h2>Fields</h2>

            ${fields || "<p>No fields yet.</p>"}

            <button data-action="addField">Add Field</button>
            <button data-action="back">Back</button>
            <button data-action="next">Next</button>
        `;
    }

    return `
        <h2>Review</h2>

        <p><strong>${s.title}</strong></p>
        <p>${s.description || "(No description)"}</p>

        <ul>
            ${s.fields.map(f => `<li>${f.label} (${f.type})</li>`).join("")}
        </ul>

        <button data-action="back">Back</button>
        <button data-action="save">Save Section</button>
    `;
}

/* ---------------------------------------------------------------------------
   Actions
--------------------------------------------------------------------------- */
function handleWizardActions(e) {
    const action = e.target.dataset.action;

    if (action === "close") {
        closeSectionWizard();
        return;
    }

    if (action === "next") {
        if (sectionWizardState.step === 1) {
            const title = document.getElementById("sectionTitle").value.trim();
            if (!title) {
                alert("Title is required.");
                return;
            }
            sectionWizardState.section.title = title;
            sectionWizardState.section.required =
                document.getElementById("sectionRequired").checked;
            sectionWizardState.section.description =
                document.getElementById("sectionDescription").value.trim();
        }
        sectionWizardState.step++;
    }

    if (action === "back") {
        sectionWizardState.step--;
    }

    if (action === "addField") {
        const label = prompt("Field label?");
        if (!label) return;

        const type = prompt("Type: text | textarea | date | choice");
        if (!["text", "textarea", "date", "choice"].includes(type)) {
            alert("Invalid field type.");
            return;
        }

        const field = {
            id: `field_${crypto.randomUUID()}`,
            label,
            type,
            required: false
        };

        if (type === "choice") {
            const opts = prompt("Choices (comma separated)");
            field.choices = opts ? opts.split(",").map(v => v.trim()) : [];
        }

        sectionWizardState.section.fields.push(field);
    }

    if (action === "save") {
        activeTemplate.sections.push(
            JSON.parse(JSON.stringify(sectionWizardState.section))
        );
        renderTemplateSections(activeTemplate);
        closeSectionWizard();
        return;
    }

    if (e.target.dataset.remove !== undefined) {
        sectionWizardState.section.fields.splice(
            Number(e.target.dataset.remove),
            1
        );
    }

    const modal = document.getElementById("sectionWizardModal");
    if (modal) {
        modal.innerHTML = `
            <div style="
                background:#fff;
                max-width:600px;
                margin:10vh auto;
                padding:24px;
                border-radius:12px;
            ">
                ${renderSectionWizardStep()}
            </div>
        `;
    }
}

/* ---------------------------------------------------------------------------
   Close Wizard
--------------------------------------------------------------------------- */
function closeSectionWizard() {
    const modal = document.getElementById("sectionWizardModal");
    if (modal) modal.remove();
    console.log("🧹 Section Wizard closed");
}
// ============================================================================
// SECTION WIZARD – WIRE INTO EXISTING UI BUTTON
// Date: 2025-12-22
// Purpose: Reuse #btnSectionPicker to open Section Wizard
// ============================================================================

(function wireSectionWizardButton() {
    document.addEventListener("click", function (e) {
        const btn = e.target.closest("#btnSectionPicker");
        if (!btn) return;

        console.log("🟢 Section Picker button intercepted");

        // Stop existing behavior
        e.preventDefault();
        e.stopPropagation();

        // Safety checks
        if (!window.activeTemplate || !Array.isArray(activeTemplate.sections)) {
            alert("Select a template first.");
            return;
        }

        // Open wizard
        openSectionWizard();
    }, true);

    console.log("🧩 Section Wizard wired to #btnSectionPicker");
})();
