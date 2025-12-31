// processors/table.js
// Handles table enhancement: sorting, filtering, and export functionality

/**
 * Process all tables in HTML to add enhanced functionality
 */
export function processTables(html) {
  const tableRegex = /<table([^>]*)>([\s\S]*?)<\/table>/gi;
  let tableIndex = 0;
  
  html = html.replace(tableRegex, (match, attrs, content) => {
    const tableId = `artifactuse-table-${tableIndex++}`;
    return createEnhancedTable(tableId, attrs, content);
  });
  
  return html;
}

/**
 * Create enhanced table wrapper with controls
 */
export function createEnhancedTable(tableId, attrs, content) {
  // Parse table to extract headers and determine if it has data
  const hasHeader = /<thead/i.test(content) || /<th/i.test(content);
  const rowCount = (content.match(/<tr/gi) || []).length;
  
  // Only enhance tables with headers and more than 2 rows
  if (!hasHeader || rowCount < 3) {
    return `<table${attrs} class="artifactuse-table">${content}</table>`;
  }
  
  // Enhance table content with sortable headers
  const enhancedContent = enhanceTableContent(content);
  
  return `
    <div class="artifactuse-table-container" data-table-id="${tableId}">
      <div class="artifactuse-table-controls">
        <div class="artifactuse-table-search">
          <input 
            type="text" 
            placeholder="Search table..." 
            class="artifactuse-table-search-input"
            data-table-search="${tableId}"
          />
          <svg class="artifactuse-table-search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="11" cy="11" r="8"></circle>
            <path d="m21 21-4.35-4.35"></path>
          </svg>
        </div>
        <div class="artifactuse-table-actions">
          <button class="artifactuse-table-action-btn" data-table-export="${tableId}" data-format="csv" title="Export CSV">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
              <polyline points="7 10 12 15 17 10"></polyline>
              <line x1="12" y1="15" x2="12" y2="3"></line>
            </svg>
            <span>CSV</span>
          </button>
          <button class="artifactuse-table-action-btn" data-table-copy="${tableId}" title="Copy to clipboard">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
              <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
            </svg>
            <span>Copy</span>
          </button>
        </div>
      </div>
      <div class="artifactuse-table-wrapper">
        <table${attrs} class="artifactuse-table artifactuse-enhanced-table" id="${tableId}">${enhancedContent}</table>
      </div>
      <div class="artifactuse-table-footer">
        <span class="artifactuse-table-row-count" data-table-count="${tableId}"></span>
      </div>
    </div>
  `;
}

/**
 * Enhance table content with sortable headers
 */
function enhanceTableContent(content) {
  let headerIndex = 0;
  
  content = content.replace(/<th(\s[^>]*)?>([\s\S]*?)<\/th>/gi, (match, attrs, text) => {
    const colIndex = headerIndex++;
    attrs = attrs || '';
    return `
      <th${attrs} class="artifactuse-sortable-header" data-sort-col="${colIndex}">
        <div class="artifactuse-th-content">
          <span>${text}</span>
          <span class="artifactuse-sort-indicator">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M7 15l5 5 5-5"></path>
              <path d="M7 9l5-5 5 5"></path>
            </svg>
          </span>
        </div>
      </th>
    `;
  });
  
  return content;
}

/**
 * Generate CSV from table data
 */
export function tableToCSV(tableElement) {
  const rows = tableElement.querySelectorAll('tr');
  const csv = [];
  
  rows.forEach(row => {
    const cells = row.querySelectorAll('th, td');
    const rowData = [];
    
    cells.forEach(cell => {
      // Escape quotes and wrap in quotes if contains comma
      let text = cell.textContent.trim();
      text = text.replace(/"/g, '""');
      if (text.includes(',') || text.includes('\n') || text.includes('"')) {
        text = `"${text}"`;
      }
      rowData.push(text);
    });
    
    csv.push(rowData.join(','));
  });
  
  return csv.join('\n');
}

/**
 * Download CSV file
 */
export function downloadCSV(csv, filename = 'table-data.csv') {
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Copy table data to clipboard as tab-separated values
 */
export function copyTableToClipboard(tableElement) {
  const rows = tableElement.querySelectorAll('tr');
  const text = [];
  
  rows.forEach(row => {
    const cells = row.querySelectorAll('th, td');
    const rowData = [];
    cells.forEach(cell => {
      rowData.push(cell.textContent.trim());
    });
    text.push(rowData.join('\t'));
  });
  
  return text.join('\n');
}

/**
 * Sort table by column
 */
export function sortTable(tableElement, colIndex, ascending = true) {
  const tbody = tableElement.querySelector('tbody') || tableElement;
  const rows = Array.from(tbody.querySelectorAll('tr')).filter(row => !row.querySelector('th'));
  
  rows.sort((a, b) => {
    const aCell = a.cells[colIndex];
    const bCell = b.cells[colIndex];
    
    if (!aCell || !bCell) return 0;
    
    let aVal = aCell.textContent.trim();
    let bVal = bCell.textContent.trim();
    
    // Try numeric comparison
    const aNum = parseFloat(aVal.replace(/[,$%]/g, ''));
    const bNum = parseFloat(bVal.replace(/[,$%]/g, ''));
    
    if (!isNaN(aNum) && !isNaN(bNum)) {
      return ascending ? aNum - bNum : bNum - aNum;
    }
    
    // Try date comparison
    const aDate = new Date(aVal);
    const bDate = new Date(bVal);
    
    if (!isNaN(aDate.getTime()) && !isNaN(bDate.getTime())) {
      return ascending ? aDate - bDate : bDate - aDate;
    }
    
    // String comparison
    return ascending 
      ? aVal.localeCompare(bVal) 
      : bVal.localeCompare(aVal);
  });
  
  // Re-append sorted rows
  rows.forEach(row => tbody.appendChild(row));
}

/**
 * Filter table rows by search term
 */
export function filterTable(tableElement, searchTerm) {
  const rows = tableElement.querySelectorAll('tbody tr, tr:not(:first-child)');
  const term = searchTerm.toLowerCase().trim();
  let visibleCount = 0;
  
  rows.forEach(row => {
    // Skip header rows
    if (row.querySelector('th')) {
      row.style.display = '';
      return;
    }
    
    const text = row.textContent.toLowerCase();
    const matches = !term || text.includes(term);
    row.style.display = matches ? '' : 'none';
    if (matches) visibleCount++;
  });
  
  return visibleCount;
}

/**
 * Initialize table interactivity (call this after DOM is ready)
 */
export function initializeTables() {
  // Search functionality
  document.querySelectorAll('[data-table-search]').forEach(input => {
    const tableId = input.dataset.tableSearch;
    const table = document.getElementById(tableId);
    const countEl = document.querySelector(`[data-table-count="${tableId}"]`);
    
    if (table) {
      // Set initial count
      const dataRows = table.querySelectorAll('tbody tr, tr:not(:first-child)');
      const totalRows = Array.from(dataRows).filter(row => !row.querySelector('th')).length;
      if (countEl) countEl.textContent = `${totalRows} rows`;
      
      input.addEventListener('input', (e) => {
        const visibleCount = filterTable(table, e.target.value);
        if (countEl) {
          countEl.textContent = e.target.value 
            ? `${visibleCount} of ${totalRows} rows` 
            : `${totalRows} rows`;
        }
      });
    }
  });
  
  // Sort functionality
  document.querySelectorAll('.artifactuse-sortable-header').forEach(header => {
    header.addEventListener('click', () => {
      const table = header.closest('table');
      const colIndex = parseInt(header.dataset.sortCol);
      const currentDir = header.dataset.sortDir;
      const ascending = currentDir !== 'asc';
      
      // Reset all headers
      table.querySelectorAll('.artifactuse-sortable-header').forEach(h => {
        h.dataset.sortDir = '';
        h.classList.remove('sort-asc', 'sort-desc');
      });
      
      // Set current header
      header.dataset.sortDir = ascending ? 'asc' : 'desc';
      header.classList.add(ascending ? 'sort-asc' : 'sort-desc');
      
      sortTable(table, colIndex, ascending);
    });
  });
  
  // Export CSV functionality
  document.querySelectorAll('[data-table-export]').forEach(btn => {
    btn.addEventListener('click', () => {
      const tableId = btn.dataset.tableExport;
      const table = document.getElementById(tableId);
      if (table) {
        const csv = tableToCSV(table);
        downloadCSV(csv, `${tableId}.csv`);
      }
    });
  });
  
  // Copy functionality
  document.querySelectorAll('[data-table-copy]').forEach(btn => {
    btn.addEventListener('click', async () => {
      const tableId = btn.dataset.tableCopy;
      const table = document.getElementById(tableId);
      if (table) {
        const text = copyTableToClipboard(table);
        try {
          await navigator.clipboard.writeText(text);
          const span = btn.querySelector('span');
          const originalText = span ? span.textContent : '';
          if (span) span.textContent = 'Copied!';
          btn.classList.add('copied');
          setTimeout(() => {
            if (span) span.textContent = originalText;
            btn.classList.remove('copied');
          }, 2000);
        } catch (err) {
          console.error('Failed to copy:', err);
        }
      }
    });
  });
}

export default {
  processTables,
  createEnhancedTable,
  tableToCSV,
  downloadCSV,
  copyTableToClipboard,
  sortTable,
  filterTable,
  initializeTables,
};