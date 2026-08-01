/*=========================================================================
   RICH NOTES (Phase 2) — lightweight markdown-style formatting, no deps.
   Textarea stores plain markdown-ish text (**bold**, *italic*, "- " lists);
   renderNotesMarkdown() turns it into safe HTML for display.
=========================================================================*/
function wrapNotesSelection(marker){
    const ta = $("taskNotes");
    if(!ta) return;
    const start = ta.selectionStart, end = ta.selectionEnd;
    const value = ta.value;
    const selected = value.slice(start, end) || "text";
    ta.value = value.slice(0, start) + marker + selected + marker + value.slice(end);
    ta.focus();
    ta.selectionStart = start + marker.length;
    ta.selectionEnd = start + marker.length + selected.length;
}

function prefixNotesLines(prefix){
    const ta = $("taskNotes");
    if(!ta) return;
    const start = ta.selectionStart, end = ta.selectionEnd;
    const value = ta.value;
    const lineStart = value.lastIndexOf("\n", start - 1) + 1;
    const lineEndRaw = value.indexOf("\n", end);
    const lineEnd = lineEndRaw === -1 ? value.length : lineEndRaw;
    const block = value.slice(lineStart, lineEnd);
    const prefixed = block.split("\n").map(l => l.startsWith(prefix) ? l : prefix + l).join("\n");
    ta.value = value.slice(0, lineStart) + prefixed + value.slice(lineEnd);
    ta.focus();
}

/* Escapes HTML first, then applies a small set of markdown-style rules. Safe against injection. */
function renderNotesMarkdown(raw){
    if(!raw) return "";
    let html = escapeHtml(raw);
    html = html.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
    html = html.replace(/(^|[^*])\*(?!\*)(.+?)\*(?!\*)/g, "$1<em>$2</em>");

    const lines = html.split("\n");
    let out = [], inList = false;
    lines.forEach(line => {
        if(/^-\s+/.test(line)){
            if(!inList){ out.push("<ul>"); inList = true; }
            out.push("<li>" + line.replace(/^-\s+/, "") + "</li>");
        }else{
            if(inList){ out.push("</ul>"); inList = false; }
            if(line.trim() !== "") out.push(line + "<br>");
        }
    });
    if(inList) out.push("</ul>");
    return out.join("");
}
