// AetherScan App Logic (Web Browser Native version)

// DOM Elements
const btnSelectFolder = document.getElementById('btn-select-folder');
const scanStatus = document.getElementById('scan-status');
const scanStatusText = document.getElementById('scan-status-text');
const activePathLabel = document.getElementById('active-path-label');

// Stats Elements
const statTotalSize = document.getElementById('stat-total-size');
const statTotalFiles = document.getElementById('stat-total-files');
const statTotalFolders = document.getElementById('stat-total-folders');
const statLargestFile = document.getElementById('stat-largest-file');

// Filter Elements
const searchInput = document.getElementById('search-input');
const sizeFilter = document.getElementById('size-filter');
const categoryFilters = document.querySelectorAll('.category-filter');
const sortSelect = document.getElementById('sort-select');
const btnResetFilters = document.getElementById('btn-reset-filters');

// Views & Navigation Elements
const tabBtns = document.querySelectorAll('.tab-btn');
const tabPanels = document.querySelectorAll('.tab-panel');
const treemapContainer = document.getElementById('treemap-container');
const fileListBody = document.getElementById('file-list-body');
const listPagination = document.getElementById('list-pagination');
const paginationInfo = document.getElementById('pagination-info');
const btnPrevPage = document.getElementById('btn-prev-page');
const btnNextPage = document.getElementById('btn-next-page');

// Details Panel Elements
const sidebarDetails = document.getElementById('sidebar-details');
const btnCloseDetails = document.getElementById('btn-close-details');
const detailsFilename = document.getElementById('details-filename');
const detailsPath = document.getElementById('details-path');
const detailsSize = document.getElementById('details-size');
const detailsType = document.getElementById('details-type');
const detailsModified = document.getElementById('details-modified');
const btnCopyPath = document.getElementById('btn-copy-path');
const detailsIcon = document.getElementById('details-icon');
const detailsFileIconBox = document.getElementById('details-file-icon-box');

// Toast Notification
const toast = document.getElementById('toast');
const toastMessage = document.getElementById('toast-message');

// Category Mapping helper
const categoryMap = {
    // Video
    mp4: 'video', mkv: 'video', avi: 'video', mov: 'video', wmv: 'video', flv: 'video', webm: 'video', m4v: 'video',
    // Audio
    mp3: 'audio', wav: 'audio', flac: 'audio', ogg: 'audio', m4a: 'audio', wma: 'audio', aac: 'audio',
    // Image
    png: 'image', jpg: 'image', jpeg: 'image', gif: 'image', svg: 'image', webp: 'image', bmp: 'image', ico: 'image', tiff: 'image',
    // Document / Code
    pdf: 'document', doc: 'document', docx: 'document', xls: 'document', xlsx: 'document', ppt: 'document', pptx: 'document', 
    txt: 'document', csv: 'document', epub: 'document', odt: 'document', html: 'document', css: 'document', 
    js: 'document', json: 'document', xml: 'document', md: 'document', py: 'document',
    // Archive
    zip: 'archive', rar: 'archive', tar: 'archive', gz: 'archive', '7z': 'archive', iso: 'archive', bz2: 'archive',
    // Executable
    exe: 'executable', msi: 'executable', bat: 'executable', sh: 'executable', cmd: 'executable', com: 'executable', apk: 'executable', dmg: 'executable', app: 'executable'
};

// Lucide Icon mappings for categories
const categoryIcons = {
    video: 'video',
    audio: 'music',
    image: 'image',
    document: 'file-text',
    archive: 'file-archive',
    executable: 'terminal',
    other: 'file'
};

// Global App State
let allFiles = [];
let scannedFoldersSet = new Set();
let selectedFile = null;
let currentFolderHandle = null;

// Pagination state
let currentPage = 1;
const itemsPerPage = 50;

// Chart JS Instances
let sizeChartInstance = null;
let countChartInstance = null;

// Progress Scan variables
let scannedFilesCount = 0;
let scannedBytesSum = 0;

// Initialize Lucide Icons on load
document.addEventListener('DOMContentLoaded', () => {
    lucide.createIcons();
    initEventListeners();
});

// Event Listeners Initialization
function initEventListeners() {
    // Select Folder (Browser showDirectoryPicker)
    btnSelectFolder.addEventListener('click', handleSelectFolder);
    
    // Tab switching
    tabBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            const targetTab = e.currentTarget.getAttribute('data-tab');
            switchTab(targetTab);
        });
    });

    // Filters
    searchInput.addEventListener('input', () => {
        currentPage = 1;
        renderAllViews();
    });
    
    sizeFilter.addEventListener('change', () => {
        currentPage = 1;
        renderAllViews();
    });
    
    categoryFilters.forEach(cb => {
        cb.addEventListener('change', () => {
            currentPage = 1;
            renderAllViews();
        });
    });
    
    sortSelect.addEventListener('change', () => {
        renderAllViews();
    });
    
    btnResetFilters.addEventListener('click', resetFilters);

    // Sidebar Close
    btnCloseDetails.addEventListener('click', () => {
        sidebarDetails.classList.add('hidden');
        document.querySelectorAll('.active-row').forEach(r => r.classList.remove('active-row'));
    });

    // Copy Path
    btnCopyPath.addEventListener('click', copyPathToClipboard);

    // Pagination
    btnPrevPage.addEventListener('click', () => {
        if (currentPage > 1) {
            currentPage--;
            renderListView();
        }
    });

    btnNextPage.addEventListener('click', () => {
        const filtered = getFilteredAndSortedFiles();
        const maxPage = Math.ceil(filtered.length / itemsPerPage);
        if (currentPage < maxPage) {
            currentPage++;
            renderListView();
        }
    });
}

// Select folder and scan (Uses showDirectoryPicker)
async function handleSelectFolder() {
    try {
        if (!window.showDirectoryPicker) {
            throw new Error("Seu navegador nao suporta a API de Acesso ao Sistema de Arquivos (como Chrome/Edge). Se estiver abrindo como arquivo local (file://), lembre-se de que a API requer uma origem segura como HTTPS ou localhost.");
        }

        currentFolderHandle = await window.showDirectoryPicker();
        
        // Reset state
        allFiles = [];
        scannedFoldersSet = new Set();
        scannedFilesCount = 0;
        scannedBytesSum = 0;
        selectedFile = null;
        currentPage = 1;
        
        // Hide details panel
        sidebarDetails.classList.add('hidden');

        // Show status spinner
        scanStatus.classList.remove('hidden');
        btnSelectFolder.disabled = true;
        
        activePathLabel.textContent = `Pasta Ativa: ${currentFolderHandle.name}`;
        activePathLabel.style.display = 'block';
        
        const startTime = performance.now();
        showToast(`Escaneando pasta: ${currentFolderHandle.name}...`);
        
        // Scan recursively
        allFiles = await scanDirectory(currentFolderHandle);
        
        const endTime = performance.now();
        const durationSec = ((endTime - startTime) / 1000).toFixed(1);
        
        // Hide spinner
        scanStatus.classList.add('hidden');
        btnSelectFolder.disabled = false;
        
        showToast(`Concluido em ${durationSec}s! ${allFiles.length} arquivos analisados.`);
        
        // Update main stats
        updateGlobalStats();

        // Render views
        renderAllViews();
        
    } catch (err) {
        console.error("Directory selection error:", err);
        scanStatus.classList.add('hidden');
        btnSelectFolder.disabled = false;
        if (err.name !== 'AbortError') {
            showToast(err.message || "Erro ao ler diretorio. Certifique-se de usar Chrome/Edge em localhost ou HTTPS.", true);
        }
    }
}

// Recursive directory scanning
async function scanDirectory(dirHandle, relativePath = '') {
    let files = [];
    
    // Add folder to folder set
    if (relativePath) {
        scannedFoldersSet.add(relativePath);
    } else {
        scannedFoldersSet.add(dirHandle.name);
    }
    
    try {
        for await (const entry of dirHandle.values()) {
            const entryPath = relativePath ? `${relativePath}/${entry.name}` : entry.name;
            
            if (entry.kind === 'file') {
                try {
                    const file = await entry.getFile();
                    const ext = file.name.split('.').pop().toLowerCase();
                    const category = categoryMap[ext] || 'other';
                    
                    files.push({
                        name: file.name,
                        path: entryPath,
                        size: file.size,
                        type: file.type || `Arquivo ${ext.toUpperCase() || 'Desconhecido'}`,
                        lastModified: file.lastModified,
                        extension: ext,
                        category: category
                    });
                    
                    scannedFilesCount++;
                    scannedBytesSum += file.size;
                    
                    if (scannedFilesCount % 100 === 0) {
                        scanStatusText.textContent = `Varridos: ${scannedFilesCount} arquivos (${formatBytes(scannedBytesSum)})`;
                    }
                } catch (e) {
                    console.warn(`Acesso negado ou erro ao ler o arquivo: ${entryPath}`, e);
                }
            } else if (entry.kind === 'directory') {
                try {
                    const subFiles = await scanDirectory(entry, entryPath);
                    files = files.concat(subFiles);
                } catch (e) {
                    console.warn(`Acesso negado ou erro ao ler a subpasta: ${entryPath}`, e);
                }
            }
        }
    } catch (err) {
        console.error(`Erro ao iterar diretorio ${relativePath || dirHandle.name}:`, err);
    }
    
    return files;
}

// Tab switcher logic
function switchTab(tabId) {
    tabBtns.forEach(btn => {
        btn.classList.toggle('active', btn.getAttribute('data-tab') === tabId);
    });
    
    tabPanels.forEach(panel => {
        panel.classList.toggle('active', panel.id === tabId);
    });
}

// Global stats update
function updateGlobalStats() {
    if (allFiles.length === 0) {
        statTotalSize.textContent = '0 B';
        statTotalFiles.textContent = '0';
        statTotalFolders.textContent = '0';
        statLargestFile.textContent = '-';
        return;
    }
    
    const totalBytes = allFiles.reduce((acc, f) => acc + f.size, 0);
    statTotalSize.textContent = formatBytes(totalBytes);
    
    statTotalFiles.textContent = allFiles.length.toLocaleString('pt-BR');
    statTotalFolders.textContent = scannedFoldersSet.size.toLocaleString('pt-BR');
    
    const largest = allFiles.reduce((max, f) => f.size > max.size ? f : max, allFiles[0]);
    statLargestFile.textContent = `${largest.name} (${formatBytes(largest.size)})`;
}

// Get files with filters applied, then sorted
function getFilteredAndSortedFiles() {
    const query = searchInput.value.toLowerCase().trim();
    const minSize = parseInt(sizeFilter.value, 10);
    const activeCategories = Array.from(document.querySelectorAll('.category-filter:checked')).map(cb => cb.value);
    
    let filtered = allFiles.filter(file => {
        const matchesSearch = file.name.toLowerCase().includes(query) || file.path.toLowerCase().includes(query);
        const matchesSize = file.size >= minSize;
        const matchesCategory = activeCategories.includes(file.category);
        return matchesSearch && matchesSize && matchesCategory;
    });
    
    const sortBy = sortSelect.value;
    filtered.sort((a, b) => {
        if (sortBy === 'size-desc') {
            return b.size - a.size;
        } else if (sortBy === 'size-asc') {
            return a.size - b.size;
        } else if (sortBy === 'name-asc') {
            return a.name.localeCompare(b.name);
        } else if (sortBy === 'type-asc') {
            return a.extension.localeCompare(b.extension);
        }
        return 0;
    });
    
    return filtered;
}

// Render all views reactively
function renderAllViews() {
    renderTreemapView();
    renderChartsView();
    renderListView();
}

// 1. Render Treemap View
function renderTreemapView() {
    treemapContainer.innerHTML = '';
    
    const filtered = getFilteredAndSortedFiles();
    
    if (filtered.length === 0) {
        treemapContainer.innerHTML = `
            <div class="empty-state">
                <i data-lucide="filter-x" class="empty-icon"></i>
                <h3>Nenhum arquivo corresponde aos filtros</h3>
                <p>Ajuste os filtros de tamanho, nome ou tipo na barra lateral.</p>
            </div>
        `;
        lucide.createIcons();
        return;
    }
    
    const limit = 150;
    const itemsToRender = filtered.slice(0, limit);
    const maxItemSize = Math.max(...itemsToRender.map(i => i.size));
    
    itemsToRender.forEach(file => {
        const block = document.createElement('div');
        block.className = 'treemap-block';
        
        // Define color class based on file size
        let sizeClass = 'size-small';
        if (file.size >= 1073741824) { // > 1GB
            sizeClass = 'size-gigantic';
        } else if (file.size >= 104857600) { // 100MB - 1GB
            sizeClass = 'size-large';
        } else if (file.size >= 10485760) { // 10MB - 100MB
            sizeClass = 'size-medium';
        }
        
        block.classList.add(sizeClass);
        
        const ratio = maxItemSize > 0 ? (file.size / maxItemSize) : 1;
        const flexGrowValue = Math.max(1, Math.round(ratio * 100));
        
        block.style.flexGrow = flexGrowValue;
        
        block.innerHTML = `
            <span class="block-name" title="${file.name}">${file.name}</span>
            <span class="block-size">${formatBytes(file.size)}</span>
        `;
        
        // Click action
        block.addEventListener('click', (e) => {
            e.stopPropagation();
            showFileDetails(file, block);
        });
        
        treemapContainer.appendChild(block);
    });
}

// 2. Render Charts View
function renderChartsView() {
    const filtered = getFilteredAndSortedFiles();
    
    const categories = ['video', 'audio', 'image', 'document', 'archive', 'executable', 'other'];
    const catLabels = {
        video: 'Videos',
        audio: 'Audios',
        image: 'Imagens',
        document: 'Documentos',
        archive: 'Compactados',
        executable: 'Executaveis',
        other: 'Outros'
    };
    
    const catColors = {
        video: '#ff007f',
        audio: '#ff7b00',
        image: '#00e676',
        document: '#00f2fe',
        archive: '#9b51e0',
        executable: '#f1c40f',
        other: '#94a3b8'
    };
    
    const sizeData = {};
    const countData = {};
    
    categories.forEach(c => {
        sizeData[c] = 0;
        countData[c] = 0;
    });
    
    filtered.forEach(file => {
        const cat = file.category;
        sizeData[cat] += file.size;
        countData[cat] += 1;
    });
    
    const labels = categories.map(c => catLabels[c]);
    const backgroundColors = categories.map(c => catColors[c]);
    
    const sizesInMB = categories.map(c => (sizeData[c] / (1024 * 1024)).toFixed(2));
    const counts = categories.map(c => countData[c]);
    
    if (sizeChartInstance) sizeChartInstance.destroy();
    if (countChartInstance) countChartInstance.destroy();
    
    if (filtered.length === 0) return;
    
    const ctxSize = document.getElementById('type-size-chart').getContext('2d');
    sizeChartInstance = new Chart(ctxSize, {
        type: 'doughnut',
        data: {
            labels: labels,
            datasets: [{
                data: sizesInMB,
                backgroundColor: backgroundColors,
                borderWidth: 1,
                borderColor: '#1e293b'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: { color: '#94a3b8', font: { family: 'Inter' } }
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            const val = parseFloat(context.raw);
                            const bytes = val * 1024 * 1024;
                            return ` ${context.label}: ${formatBytes(bytes)}`;
                        }
                    }
                }
            }
        }
    });

    const ctxCount = document.getElementById('type-count-chart').getContext('2d');
    countChartInstance = new Chart(ctxCount, {
        type: 'doughnut',
        data: {
            labels: labels,
            datasets: [{
                data: counts,
                backgroundColor: backgroundColors,
                borderWidth: 1,
                borderColor: '#1e293b'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: { color: '#94a3b8', font: { family: 'Inter' } }
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return ` ${context.label}: ${context.raw} arquivos`;
                        }
                    }
                }
            }
        }
    });
}

// 3. Render Table List View
function renderListView() {
    fileListBody.innerHTML = '';
    
    const filtered = getFilteredAndSortedFiles();
    
    if (filtered.length === 0) {
        fileListBody.innerHTML = `
            <tr>
                <td colspan="5" class="table-empty">
                    Nenhum arquivo corresponde aos filtros ativos.
                </td>
            </tr>
        `;
        listPagination.classList.add('hidden');
        return;
    }
    
    const totalItems = filtered.length;
    const totalPages = Math.ceil(totalItems / itemsPerPage);
    
    if (currentPage > totalPages) currentPage = totalPages;
    if (currentPage < 1) currentPage = 1;
    
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = Math.min(startIndex + itemsPerPage, totalItems);
    
    const pageItems = filtered.slice(startIndex, endIndex);
    
    listPagination.classList.remove('hidden');
    paginationInfo.textContent = `Mostrando ${startIndex + 1}-${endIndex} de ${totalItems} arquivos`;
    
    btnPrevPage.disabled = currentPage === 1;
    btnNextPage.disabled = currentPage === totalPages;
    
    pageItems.forEach(file => {
        const tr = document.createElement('tr');
        if (selectedFile && selectedFile.path === file.path) {
            tr.classList.add('active-row');
        }
        
        let badgeColorClass = 'bg-other';
        if (file.category) {
            badgeColorClass = `bg-${file.category}`;
        }
        
        tr.innerHTML = `
            <td>
                <div style="display: flex; align-items: center; gap: 8px;">
                    <i data-lucide="${categoryIcons[file.category] || 'file'}" class="table-file-icon" style="color: ${getCategoryColorHex(file.category)}; width: 16px; height: 16px;"></i>
                    <span class="text-white" title="${file.name}">${file.name}</span>
                </div>
            </td>
            <td>
                <span class="ext-badge ${badgeColorClass}">${file.extension || 'N/A'}</span>
            </td>
            <td class="text-right text-highlight" style="font-weight: 600;">
                ${formatBytes(file.size)}
            </td>
            <td title="${file.path}" style="color: var(--text-muted); font-size: 0.8rem; font-family: monospace;">
                ${file.path}
            </td>
            <td>
                <button class="btn-icon btn-row-copy" title="Copiar caminho relativo">
                    <i data-lucide="copy" style="width: 14px; height: 14px;"></i>
                </button>
            </td>
        `;
        
        // Copy path button listener
        tr.querySelector('.btn-row-copy').addEventListener('click', (e) => {
            e.stopPropagation();
            navigator.clipboard.writeText(file.path);
            showToast("Caminho copiado!");
        });
        
        // Row selection listener
        tr.addEventListener('click', () => {
            document.querySelectorAll('.active-row').forEach(row => row.classList.remove('active-row'));
            tr.classList.add('active-row');
            showFileDetails(file);
        });
        
        fileListBody.appendChild(tr);
    });
    
    lucide.createIcons();
}

// Show File Details sidebar
function showFileDetails(file, blockElement = null) {
    selectedFile = file;
    
    // Populate panel data
    detailsFilename.textContent = file.name;
    detailsPath.textContent = file.path;
    detailsSize.textContent = formatBytes(file.size);
    detailsType.textContent = file.type;
    detailsModified.textContent = new Date(file.lastModified).toLocaleString('pt-BR');
    
    // Update panel icon styling and color
    const category = file.category;
    const iconName = categoryIcons[category] || 'file';
    const colorHex = getCategoryColorHex(category);
    
    detailsIcon.setAttribute('data-lucide', iconName);
    detailsIcon.style.color = colorHex;
    detailsFileIconBox.style.borderColor = colorHex;
    detailsFileIconBox.style.boxShadow = `0 4px 15px ${colorHex}22`;
    
    lucide.createIcons();
    
    // Open sidebar
    sidebarDetails.classList.remove('hidden');
}

// Copy path action
function copyPathToClipboard() {
    if (!selectedFile) return;
    
    navigator.clipboard.writeText(selectedFile.path).then(() => {
        showToast("Caminho copiado!");
    }).catch(err => {
        console.error("Clipboard copy failed:", err);
        showToast("Erro ao copiar caminho.", true);
    });
}

// Reset filters to defaults
function resetFilters() {
    searchInput.value = '';
    sizeFilter.value = '52428800'; // Default > 50MB
    categoryFilters.forEach(cb => cb.checked = true);
    sortSelect.value = 'size-desc';
    currentPage = 1;
    
    renderAllViews();
    showToast("Filtros resetados!");
}

// Helper: Formatter for Bytes
function formatBytes(bytes, decimals = 2) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

// Helper: Get hex color by category
function getCategoryColorHex(category) {
    const colors = {
        video: '#ff007f',
        audio: '#ff7b00',
        image: '#00e676',
        document: '#00f2fe',
        archive: '#9b51e0',
        executable: '#f1c40f',
        other: '#94a3b8'
    };
    return colors[category] || '#94a3b8';
}

// Helper: Show toast notification
function showToast(message, isError = false) {
    toastMessage.textContent = message;
    
    const toastIcon = document.getElementById('toast-icon');
    if (isError) {
        toast.style.borderColor = '#ff007f';
        toast.style.boxShadow = '0 0 15px rgba(255, 0, 127, 0.4)';
        toastIcon.setAttribute('data-lucide', 'alert-triangle');
        toastIcon.style.color = '#ff007f';
    } else {
        toast.style.borderColor = 'var(--neon-cyan)';
        toast.style.boxShadow = '0 0 15px var(--neon-cyan-glow)';
        toastIcon.setAttribute('data-lucide', 'info');
        toastIcon.style.color = 'var(--neon-cyan)';
    }
    
    lucide.createIcons();
    
    toast.classList.remove('hidden');
    toast.style.opacity = '1';
    
    setTimeout(() => {
        toast.style.opacity = '0';
        setTimeout(() => {
            toast.classList.add('hidden');
        }, 300);
    }, 3500);
}
