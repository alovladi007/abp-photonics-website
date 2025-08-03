// Patent Search Integration with Backend API
document.addEventListener('DOMContentLoaded', function() {
    // Check if API client is available
    if (!window.abpAPI) {
        console.error('API client not loaded');
        return;
    }

    // DOM elements
    const searchForm = document.getElementById('patent-search-form');
    const searchInput = document.getElementById('search-input');
    const categoryFilter = document.getElementById('category-filter');
    const yearFilter = document.getElementById('year-filter');
    const statusFilter = document.getElementById('status-filter');
    const resultsContainer = document.getElementById('search-results');
    const loadingSpinner = document.getElementById('loading-spinner');
    const paginationContainer = document.getElementById('pagination');

    // Load categories on page load
    loadCategories();

    // Search form submission
    if (searchForm) {
        searchForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            await performSearch();
        });
    }

    // Filter changes
    [categoryFilter, yearFilter, statusFilter].forEach(filter => {
        if (filter) {
            filter.addEventListener('change', performSearch);
        }
    });

    // Load patent categories
    async function loadCategories() {
        try {
            const data = await window.abpAPI.getPatentCategories();
            if (categoryFilter && data.categories) {
                categoryFilter.innerHTML = '<option value="">All Categories</option>';
                data.categories.forEach(cat => {
                    const option = document.createElement('option');
                    option.value = cat.category;
                    option.textContent = `${cat.category} (${cat.count})`;
                    categoryFilter.appendChild(option);
                });
            }
        } catch (error) {
            console.error('Failed to load categories:', error);
        }
    }

    // Perform search
    async function performSearch(page = 0) {
        showLoading(true);
        
        const params = {
            query: searchInput?.value || '',
            category: categoryFilter?.value || '',
            year: yearFilter?.value || '',
            status: statusFilter?.value || '',
            limit: 20,
            offset: page * 20
        };

        try {
            const data = await window.abpAPI.searchPatents(params);
            displayResults(data.patents);
            updatePagination(data.pagination);
        } catch (error) {
            console.error('Search failed:', error);
            displayError('Failed to search patents. Please try again.');
        } finally {
            showLoading(false);
        }
    }

    // Display search results
    function displayResults(patents) {
        if (!resultsContainer) return;

        if (patents.length === 0) {
            resultsContainer.innerHTML = `
                <div class="text-center py-8">
                    <p class="text-gray-400">No patents found matching your search criteria.</p>
                </div>
            `;
            return;
        }

        resultsContainer.innerHTML = patents.map(patent => `
            <div class="bg-slate-800/50 p-6 rounded-lg border border-blue-600/30 hover:border-cyan-400/50 transition-all cursor-pointer" onclick="viewPatentDetails('${patent.id}')">
                <div class="flex justify-between items-start mb-4">
                    <h3 class="text-xl font-semibold text-white">${escapeHtml(patent.title)}</h3>
                    <span class="px-3 py-1 bg-blue-600/20 text-blue-300 text-xs rounded-full">${patent.id}</span>
                </div>
                <p class="text-gray-300 mb-4">${escapeHtml(patent.abstract || 'No abstract available').substring(0, 200)}...</p>
                <div class="flex justify-between items-center text-sm">
                    <div class="flex gap-4">
                        <span class="text-gray-400">Filed: ${formatDate(patent.filing_date)}</span>
                        ${patent.grant_date ? `<span class="text-gray-400">Granted: ${formatDate(patent.grant_date)}</span>` : ''}
                    </div>
                    <div class="flex gap-2">
                        <span class="px-2 py-1 bg-cyan-600/20 text-cyan-300 text-xs rounded">${patent.category}</span>
                        <span class="px-2 py-1 ${getStatusColor(patent.status)} text-xs rounded">${patent.status}</span>
                    </div>
                </div>
                ${patent.inventors ? `
                    <div class="mt-3 text-sm text-gray-400">
                        Inventors: ${escapeHtml(patent.inventors)}
                    </div>
                ` : ''}
            </div>
        `).join('');
    }

    // Update pagination
    function updatePagination(pagination) {
        if (!paginationContainer || !pagination) return;

        const currentPage = Math.floor(pagination.offset / pagination.limit);
        const totalPages = pagination.pages;

        let paginationHTML = '';

        // Previous button
        if (currentPage > 0) {
            paginationHTML += `<button onclick="performSearch(${currentPage - 1})" class="px-4 py-2 bg-slate-700 text-white rounded hover:bg-slate-600">Previous</button>`;
        }

        // Page numbers
        for (let i = 0; i < totalPages; i++) {
            if (i === currentPage) {
                paginationHTML += `<span class="px-4 py-2 bg-cyan-600 text-white rounded">${i + 1}</span>`;
            } else if (i === 0 || i === totalPages - 1 || Math.abs(i - currentPage) <= 2) {
                paginationHTML += `<button onclick="performSearch(${i})" class="px-4 py-2 bg-slate-700 text-white rounded hover:bg-slate-600">${i + 1}</button>`;
            } else if (Math.abs(i - currentPage) === 3) {
                paginationHTML += `<span class="px-2">...</span>`;
            }
        }

        // Next button
        if (currentPage < totalPages - 1) {
            paginationHTML += `<button onclick="performSearch(${currentPage + 1})" class="px-4 py-2 bg-slate-700 text-white rounded hover:bg-slate-600">Next</button>`;
        }

        paginationContainer.innerHTML = paginationHTML;
    }

    // View patent details
    window.viewPatentDetails = async function(patentId) {
        try {
            const patent = await window.abpAPI.getPatent(patentId);
            // Show patent details in a modal or navigate to detail page
            showPatentModal(patent.patent);
        } catch (error) {
            console.error('Failed to load patent details:', error);
        }
    };

    // Show patent modal
    function showPatentModal(patent) {
        const modal = document.createElement('div');
        modal.className = 'fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4';
        modal.innerHTML = `
            <div class="bg-slate-900 rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto p-8">
                <div class="flex justify-between items-start mb-6">
                    <h2 class="text-2xl font-bold text-white">${escapeHtml(patent.title)}</h2>
                    <button onclick="this.closest('.fixed').remove()" class="text-gray-400 hover:text-white">
                        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                        </svg>
                    </button>
                </div>
                
                <div class="space-y-6">
                    <div>
                        <h3 class="text-lg font-semibold text-cyan-400 mb-2">Patent Information</h3>
                        <div class="grid grid-cols-2 gap-4 text-sm">
                            <div>
                                <span class="text-gray-400">Patent ID:</span>
                                <span class="text-white ml-2">${patent.id}</span>
                            </div>
                            <div>
                                <span class="text-gray-400">Status:</span>
                                <span class="text-white ml-2">${patent.status}</span>
                            </div>
                            <div>
                                <span class="text-gray-400">Filing Date:</span>
                                <span class="text-white ml-2">${formatDate(patent.filing_date)}</span>
                            </div>
                            <div>
                                <span class="text-gray-400">Grant Date:</span>
                                <span class="text-white ml-2">${patent.grant_date ? formatDate(patent.grant_date) : 'Pending'}</span>
                            </div>
                        </div>
                    </div>
                    
                    <div>
                        <h3 class="text-lg font-semibold text-cyan-400 mb-2">Abstract</h3>
                        <p class="text-gray-300">${escapeHtml(patent.abstract || 'No abstract available')}</p>
                    </div>
                    
                    <div>
                        <h3 class="text-lg font-semibold text-cyan-400 mb-2">Claims</h3>
                        <pre class="text-gray-300 whitespace-pre-wrap">${escapeHtml(patent.claims || 'No claims available')}</pre>
                    </div>
                    
                    ${patent.inventors && patent.inventors.length > 0 ? `
                        <div>
                            <h3 class="text-lg font-semibold text-cyan-400 mb-2">Inventors</h3>
                            <ul class="list-disc list-inside text-gray-300">
                                ${patent.inventors.map(inv => `<li>${escapeHtml(inv.name)} ${inv.email ? `(${inv.email})` : ''}</li>`).join('')}
                            </ul>
                        </div>
                    ` : ''}
                    
                    <div class="flex gap-4 mt-8">
                        <button onclick="analyzePatent('${patent.id}')" class="px-6 py-3 bg-cyan-600 text-white rounded-lg hover:bg-cyan-700 transition-colors">
                            AI Analysis
                        </button>
                        <button onclick="this.closest('.fixed').remove()" class="px-6 py-3 bg-slate-700 text-white rounded-lg hover:bg-slate-600 transition-colors">
                            Close
                        </button>
                    </div>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
    }

    // Analyze patent with AI
    window.analyzePatent = async function(patentId) {
        if (!window.abpAPI.token) {
            alert('Please login to use AI analysis features');
            return;
        }

        try {
            const analysis = await window.abpAPI.analyzePatent(patentId, 'comprehensive');
            showAnalysisResults(analysis.analysis);
        } catch (error) {
            console.error('Analysis failed:', error);
            alert('Failed to analyze patent. Please try again.');
        }
    };

    // Helper functions
    function showLoading(show) {
        if (loadingSpinner) {
            loadingSpinner.style.display = show ? 'block' : 'none';
        }
    }

    function displayError(message) {
        if (resultsContainer) {
            resultsContainer.innerHTML = `
                <div class="text-center py-8">
                    <p class="text-red-400">${message}</p>
                </div>
            `;
        }
    }

    function getStatusColor(status) {
        const colors = {
            'granted': 'bg-green-600/20 text-green-300',
            'pending': 'bg-yellow-600/20 text-yellow-300',
            'filed': 'bg-blue-600/20 text-blue-300'
        };
        return colors[status] || 'bg-gray-600/20 text-gray-300';
    }

    function formatDate(dateString) {
        if (!dateString) return 'N/A';
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
    }

    function escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    // Initial search
    performSearch();
});