// ============================================
// CLIMATE DASHBOARD - JAVASCRIPT
// ============================================

// Global variables
const BANNER_DISTRICT_METADATA = {
    pemagatshel: {
        name: "Pemagatshel",
        display_name: "PEMAGATSHEL",
        longitude: 91.44,
        latitude: 27.03,
        area_km2: 1022.10,
        area_display: "1,022.10 km²",
        elevation: "1,000–3,500 m asl"
    },
    chhukha: {
        name: "Chhukha",
        display_name: "CHHUKHA",
        longitude: 89.39,
        latitude: 26.85,
        area_km2: 1879.50,
        area_display: "1,879.50 km²",
        elevation: "200–3,500 m asl"
    },
    samtse: {
        name: "Samtse",
        display_name: "SAMTSE",
        longitude: 88.88,
        latitude: 27.01,
        area_km2: 1309.10,
        area_display: "1,309.10 km²",
        elevation: "200–4,400 m asl"
    },
    sarpang: {
        name: "Sarpang",
        display_name: "SARPANG",
        longitude: 90.43,
        latitude: 26.91,
        area_km2: 1655.00,
        area_display: "1,655.00 km²",
        elevation: "200–3,600 m asl"
    },
    samdrup_jongkhar: {
        name: "Samdrup Jongkhar",
        display_name: "SAMDRUP JONGKHAR",
        longitude: 91.46,
        latitude: 26.86,
        area_km2: 1877.67,
        area_display: "1,877.67 km²",
        elevation: "200–3,500 m asl"
    }
};

let districtMetadata = { ...BANNER_DISTRICT_METADATA };
let currentDistrict = 'pemagatshel';
let currentAnalysis = 'temperature';
let graphViewportObserver = null;

function debounce(fn, delay = 150) {
    let timer;

    return function(...args) {
        clearTimeout(timer);
        timer = setTimeout(() => fn.apply(this, args), delay);
    };
}

function safelyResizePlot(plotDiv, delay = 80) {
    if (typeof plotDiv === "string") {
        plotDiv = document.getElementById(plotDiv);
    }

    if (!plotDiv || !window.Plotly) return;

    requestAnimationFrame(() => {
        try {
            Plotly.Plots.resize(plotDiv);
        } catch (error) {
            console.warn("Plotly resize failed:", error);
        }
    });

    setTimeout(() => {
        try {
            Plotly.Plots.resize(plotDiv);
        } catch (error) {
            console.warn("Delayed Plotly resize failed:", error);
        }
    }, delay);
}

window.addEventListener("resize", debounce(() => {
    if (!window.Plotly) return;

    document.querySelectorAll(".plotly-graph-div").forEach((plot) => {
        safelyResizePlot(plot, 120);
    });
}, 150));

function setupMobileMenu() {
    document.querySelectorAll(".navbar").forEach((navbar) => {
        const toggle = navbar.querySelector(".mobile-menu-toggle");
        const navLinks = navbar.querySelector(".nav-links");

        if (!toggle || !navLinks) return;

        const closeMenu = () => {
            navLinks.classList.remove("open");
            toggle.setAttribute("aria-expanded", "false");
        };

        toggle.addEventListener("click", (event) => {
            event.stopPropagation();
            const isOpen = navLinks.classList.toggle("open");
            toggle.setAttribute("aria-expanded", String(isOpen));
        });

        navLinks.querySelectorAll("a").forEach((link) => {
            link.addEventListener("click", closeMenu);
        });

        document.addEventListener("click", (event) => {
            if (!navbar.contains(event.target)) {
                closeMenu();
            }
        });

        window.addEventListener("resize", debounce(() => {
            if (window.innerWidth > 768) {
                closeMenu();
            }
        }, 150));
    });
}

// Image mapping for districts
const dzongImages = {
    pemagatshel: "/static/images/pemagatshel_dzong.png",
    chhukha: "/static/images/chhukha_dzong.png",
    samtse: "/static/images/samtse_dzong.png",
    sarpang: "/static/images/sarpang_dzong.png",
    samdrup_jongkhar: "/static/images/samdrup_jongkhar_dzong.png"
};

// ============================================
// INITIALIZATION
// ============================================

document.addEventListener('DOMContentLoaded', async function() {
    setupMobileMenu();

    if (!document.querySelector('.dashboard-container')) {
        return;
    }

    console.log('Dashboard initializing...');
    
    // Load district metadata
    await loadDistrictMetadata();
    
    // Set up event listeners
    setupEventListeners();
    
    // Set active tab button for initial load
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('active');
        if (btn.dataset.tab === 'temperature') {
            btn.classList.add('active');
        }
    });
    
    // Load initial dashboard
    await updateDashboard(currentDistrict, currentAnalysis);
});

// ============================================
// LOAD DISTRICT METADATA
// ============================================

async function loadDistrictMetadata() {
    try {
        const response = await fetch('/static/data/district_metadata.json', { cache: 'no-store' });
        const loadedMetadata = await response.json();
        districtMetadata = { ...loadedMetadata, ...BANNER_DISTRICT_METADATA };
        console.log('District metadata loaded:', districtMetadata);
    } catch (error) {
        console.error('Error loading district metadata:', error);
    }
}

// ============================================
// EVENT LISTENERS
// ============================================

function clearActiveButtons() {
    document.querySelectorAll(".district-btn").forEach((btn) => {
        btn.classList.remove("active");
    });

    const extremeBtn = document.getElementById("extreme-events-btn");
    if (extremeBtn) {
        extremeBtn.classList.remove("active");
    }
}

function setDistrictActive(districtKey) {
    clearActiveButtons();

    const selectedBtn = document.querySelector(
        `.district-btn[data-district="${districtKey}"]`
    );

    if (selectedBtn) {
        selectedBtn.classList.add("active");
    }
}

function setExtremeActive() {
    clearActiveButtons();

    const extremeBtn = document.getElementById("extreme-events-btn");

    if (extremeBtn) {
        extremeBtn.classList.add("active");
    }
}

function setAnalysisTabActive(tab) {
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('active');
        if (btn.dataset.tab === tab) {
            btn.classList.add('active');
        }
    });
}

function showAnalysisTabs() {
    const wrapper = document.getElementById('analysis-tabs-wrapper');
    if (wrapper) {
        wrapper.style.display = 'block';
    }

    const tabs = document.getElementById('analysisTabs');
    if (tabs) {
        tabs.style.display = 'grid';
    }
}

function hideAnalysisTabs() {
    const wrapper = document.getElementById('analysis-tabs-wrapper');
    if (wrapper) {
        wrapper.style.display = 'none';
    }

    const tabs = document.getElementById('analysisTabs');
    if (tabs) {
        tabs.style.display = 'none';
    }
}

function setupEventListeners() {
    // District buttons
    document.querySelectorAll('.district-btn').forEach(btn => {
        btn.addEventListener('click', async function() {
            const district = this.dataset.district;
            currentDistrict = district;
            
            setDistrictActive(district);
            showDistrictHeader(district, districtMetadata);
            
            // Show regular header and tabs
            document.getElementById('regularDzongkhagHeader').style.display = 'grid';
            showAnalysisTabs();
            document.getElementById('extreme-events-section').style.display = 'none';

            if (currentAnalysis === 'extreme') {
                currentAnalysis = 'temperature';
                setAnalysisTabActive(currentAnalysis);
                document.getElementById('temperature-analysis').style.display = 'flex';
                document.getElementById('rainfall-analysis').style.display = 'none';
            }
            
            // Load the current analysis tab
            await updateDashboard(district, currentAnalysis);
        });
    });

    // Analysis tabs
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', async function() {
            const tab = this.dataset.tab;
            await switchAnalysis(tab);
        });
    });

    // Extreme Events button
    const extremeBtn = document.getElementById('extreme-events-btn');
    if (extremeBtn) {
        extremeBtn.addEventListener('click', async function() {
            currentAnalysis = 'extreme';
            
            setExtremeActive();
            showExtremeHeader();
            
            // Hide regular header and tabs
            document.getElementById('regularDzongkhagHeader').style.display = 'none';
            hideAnalysisTabs();
            document.getElementById('temperature-analysis').style.display = 'none';
            document.getElementById('rainfall-analysis').style.display = 'none';
            document.getElementById('extreme-events-section').style.display = 'flex';
            
            await loadExtremeEvents();
        });
    }
}

// ============================================
// SWITCH DISTRICT
// ============================================

// ============================================
// SWITCH ANALYSIS TAB
// ============================================

async function switchAnalysis(tab) {
    currentAnalysis = tab;
    
    // Show regular header and tabs
    document.getElementById('regularDzongkhagHeader').style.display = 'grid';
    showAnalysisTabs();
    
    // Hide extreme events if switching tabs
    document.getElementById('extreme-events-section').style.display = 'none';
    
    // Update active tab
    setAnalysisTabActive(tab);

    // Show/hide analysis sections
    document.getElementById('temperature-analysis').style.display = tab === 'temperature' ? 'flex' : 'none';
    document.getElementById('rainfall-analysis').style.display = tab === 'rainfall' ? 'flex' : 'none';

    // Load graphs
    if (tab === 'temperature') {
        await loadTemperatureAnalysis(currentDistrict);
    } else if (tab === 'rainfall') {
        await loadRainfallAnalysis(currentDistrict);
    }
}

// ============================================
// UPDATE DASHBOARD
// ============================================

async function updateDashboard(district, analysis) {
    // Show analysis tabs and regular header
    document.getElementById('regularDzongkhagHeader').style.display = 'grid';
    showAnalysisTabs();
    
    // Hide extreme events
    document.getElementById('extreme-events-section').style.display = 'none';

    // Load appropriate analysis
    if (analysis === 'temperature') {
        await loadTemperatureAnalysis(district);
    } else if (analysis === 'rainfall') {
        await loadRainfallAnalysis(district);
    }
}

// ============================================
// UPDATE DZONGKHAG HEADER
// ============================================

function showDistrictHeader(districtKey, metadata) {
    const district = metadata[districtKey];
    if (!district) return;

    document.getElementById('header-label').textContent = 'SELECTED DZONGKHAG';
    document.getElementById('header-label').style.display = 'block';
    document.getElementById('selected-district-name').textContent = district.display_name;
    document.getElementById('district-description').textContent = 'Climate information and analysis';

    const infoCards = document.getElementById('district-info-cards');
    if (infoCards) {
        infoCards.style.display = 'grid';
    }

    const extremeSummary = document.getElementById('extreme-summary-cards');
    if (extremeSummary) {
        extremeSummary.style.display = 'none';
    }

    showAnalysisTabs();

    document.getElementById('district-elevation').textContent = district.elevation;
    document.getElementById('district-area').textContent = district.area_display || `${district.area_km2} km²`;
    document.getElementById('district-latitude').textContent = `${district.latitude}°`;
    document.getElementById('district-longitude').textContent = `${district.longitude}°`;

    const headerImage = document.getElementById('district-header-image');
    if (headerImage) {
        headerImage.src = dzongImages[districtKey];
        headerImage.alt = `${district.name} image`;
    }
}

function showExtremeHeader() {
    const headerLabel = document.getElementById('header-label');
    if (headerLabel) {
        headerLabel.style.display = 'none';
    }

    const selectedDistrictName = document.getElementById('selected-district-name');
    if (selectedDistrictName) {
        selectedDistrictName.textContent = 'OVERALL EXTREME EVENTS';
    }

    const districtDescription = document.getElementById('district-description');
    if (districtDescription) {
        districtDescription.textContent = 'This section compares extreme daily rainfall, maximum temperature, and minimum temperature events across the five southern Dzongkhags.';
    }

    const infoCards = document.getElementById('district-info-cards');
    if (infoCards) {
        infoCards.style.display = 'none';
    }

    const extremeSummary = document.getElementById('extreme-summary-cards');
    if (extremeSummary) {
        extremeSummary.style.display = 'grid';
    }

    hideAnalysisTabs();

    const headerImage = document.getElementById('district-header-image');
    if (headerImage) {
        headerImage.src = '/static/images/home_background.png';
    }
}

// ============================================
// LOAD CHART DATA
// ============================================

async function loadChart(path) {
    try {
        const response = await fetch(path);
        if (!response.ok) {
            console.warn(`Could not load chart from ${path}`);
            return null;
        }
        const chart = await response.json();
        return chart;
    } catch (error) {
        console.error(`Error loading chart from ${path}:`, error);
        return null;
    }
}

function cleanChartTitle(title) {
    if (!title) return '';

    return title
        .replace(/\s+in\s+(Pemagatshel|Chhukha|Samtse|Sarpang|Samdrup\s+Jongkhar)\s+Dzongkhag\s*:?/i, match => {
            return match.trim().endsWith(':') ? ':' : '';
        })
        .replace(/\s+:/g, ':')
        .replace(/\(\s*1996\s*[–-]\s*2025\s*\)/g, ', 1996–2025')
        .replace(/\s{2,}/g, ' ')
        .trim();
}

function getStandardChartTitle(chart, fileName = '') {
    const chartId = (chart.chart_id || '').toLowerCase();
    const variable = (chart.variable || '').toLowerCase();
    const originalTitle = (chart.title || '').toLowerCase();
    const file = (fileName || '').toLowerCase();

    if ((chart.category || '').toLowerCase().includes('extreme')) {
        return chart.title || '';
    }

    if (
        file.includes('historical_temperature') ||
        chartId.includes('historical_temperature') ||
        originalTitle.includes('historical temperature')
    ) {
        return 'Historical Temperature Trend, 1996–2025';
    }

    if (
        file.includes('projected_tmax') ||
        chartId.includes('projected_tmax') ||
        variable === 'tmax' ||
        originalTitle.includes('yearly mean tmax')
    ) {
        return 'Yearly Mean Tmax: Historical and 30-Year Forecast';
    }

    if (
        file.includes('projected_tmin') ||
        chartId.includes('projected_tmin') ||
        variable === 'tmin' ||
        originalTitle.includes('yearly mean tmin')
    ) {
        return 'Yearly Mean Tmin: Historical and 30-Year Forecast';
    }

    if (
        file.includes('historical_rainfall_rainydays') ||
        chartId.includes('historical_rainfall') ||
        originalTitle.includes('rainy days')
    ) {
        return 'Historical Rainfall and Rainy Days, 1996–2025';
    }

    if (
        file.includes('projected_rainfall') ||
        chartId.includes('projected_rainfall') ||
        originalTitle.includes('annual rainfall')
    ) {
        return 'Annual Rainfall: Historical and 30-Year Forecast';
    }

    if (
        file.includes('decadal_temperature_shift') ||
        chartId.includes('decadal_temperature') ||
        chartId.includes('temperature_shift') ||
        originalTitle.includes('temperature shift') ||
        originalTitle.includes('average temperature change')
    ) {
        return 'Monthly Temperature Shift: Historical vs Projected';
    }

    if (
        file.includes('decadal_rainfall_shift') ||
        chartId.includes('decadal_rainfall') ||
        chartId.includes('rainfall_shift') ||
        originalTitle.includes('rainfall shift')
    ) {
        return 'Monthly Rainfall Shift: Historical vs Projected';
    }

    return cleanChartTitle(chart.title || '');
}

// ============================================
// RENDER KPI CARDS
// ============================================

function createKPICard(label, value, unit = '', trendInfo = {}, cardType = '') {
    if (trendInfo && Object.keys(trendInfo).length > 0) {
        return `
            <div class="kpi-card ${cardType}">
                <div class="kpi-mini-header">
                    <span class="kpi-icon">${getKpiIcon(label)}</span>
                    <span class="kpi-name">${label}</span>
                </div>
                <div class="kpi-trend-row">
                    <span>Trend:</span>
                    <strong>${trendInfo.trend ?? 'N/A'}</strong>
                </div>
                <div class="kpi-trend-row">
                    <span>p-value:</span>
                    <strong>${formatNumber(trendInfo.pValue)}</strong>
                </div>
                <div class="kpi-trend-row">
                    <span>Sen's slope:</span>
                    <strong>${formatNumber(trendInfo.slope)}</strong>
                </div>
            </div>
        `;
    }

    let kpiHtml = `
        <div class="kpi-card ${cardType}">
            <div class="kpi-label">${label}</div>
            <div class="kpi-value">${value}</div>
    `;
    
    if (unit) {
        kpiHtml += `<div class="kpi-unit">${unit}</div>`;
    }
    
    if (Object.keys(trendInfo).length > 0) {
        let details = '';
        if (trendInfo.trend) {
            details += `Trend: ${trendInfo.trend} | `;
        }
        if (trendInfo.pValue !== undefined) {
            details += `p-value: ${trendInfo.pValue.toFixed(4)} | `;
        }
        if (trendInfo.slope !== undefined) {
            details += `Slope: ${trendInfo.slope.toFixed(4)}`;
        }
        if (details) {
            kpiHtml += `<div class="kpi-details">${details}</div>`;
        }
    }
    
    kpiHtml += `</div>`;
    return kpiHtml;
}

function renderKpis(kpis, container, chart = null) {
    container.innerHTML = '';
    container.classList.remove('shift-kpi-grid');

    if (!kpis || Object.keys(kpis).length === 0) {
        container.style.display = 'none';
        return;
    }

    container.style.display = 'grid';
    container.classList.toggle('single-kpi-grid', Object.keys(kpis).length === 1);

    Object.entries(kpis).forEach(([key, value]) => {
        const card = document.createElement('div');
        card.className = 'kpi-card';

        const label = formatKpiLabel(key);
        const icon = getKpiIcon(key);
        const isTrendKpi =
            value &&
            typeof value === 'object' &&
            (
                value.trend !== undefined ||
                value.p_value !== undefined ||
                value.sen_slope !== undefined
            );

        if (isTrendKpi) {
            card.classList.add('trend-kpi-card');
            card.innerHTML = `
                <div class="trend-kpi-header">
                    <span class="trend-kpi-icon">${icon}</span>
                    <span class="trend-kpi-title">${label}</span>
                </div>

                <div class="trend-kpi-stats">
                    <div class="trend-kpi-stat">
                        <span>Trend:</span>
                        <strong>${formatTrendText(value.trend)}</strong>
                    </div>

                    <div class="trend-kpi-divider"></div>

                    <div class="trend-kpi-stat">
                        <span>p-value:</span>
                        <strong>${formatNumber(value.p_value)}</strong>
                    </div>

                    <div class="trend-kpi-divider"></div>

                    <div class="trend-kpi-stat">
                        <span>Sen's slope:</span>
                        <strong>${formatNumber(value.sen_slope)}</strong>
                    </div>
                </div>
            `;
        } else {
            card.innerHTML = `
                <div class="kpi-simple-header">
                    <span class="trend-kpi-icon">${icon}</span>
                    <span class="trend-kpi-title">${label}</span>
                </div>
                <div class="kpi-simple-value">${renderKpiValue(value)}</div>
            `;
        }

        container.appendChild(card);
    });
}

function formatTrendText(trend) {
    if (!trend) return 'N/A';

    const value = String(trend).toLowerCase().trim();

    if (value === 'no trend') return 'No trend';
    if (value === 'increasing') return 'Increasing';
    if (value === 'decreasing') return 'Decreasing';

    return value.replace(/\b\w/g, c => c.toUpperCase());
}

function formatKpiLabel(key) {
    const labels = {
        tmax: 'Tmax',
        tmin: 'Tmin',
        tavg: 'Tavg',
        rainfall: 'Rainfall',
        rainy_days: 'Rainy Days',
        projected_tmax: 'Projected Tmax',
        projected_tmin: 'Projected Tmin',
        projected_tavg: 'Projected Tavg',
        projected_rainfall: 'Projected Rainfall',
        average_temperature_shift: 'Average Temperature Shift',
        average_rainfall_shift: 'Average Rainfall Shift',
        average_shift_c: 'Average Temperature Shift',
        average_shift_mm: 'Average Rainfall Shift',
        highest_projected_rainfall: 'Highest Projected Rainfall',
        highest_percentage_change: 'Highest Percentage Change',
        lowest_percentage_change: 'Lowest Percentage Change'
    };

    return labels[key] || key
        .replace(/_/g, ' ')
        .replace(/\b\w/g, c => c.toUpperCase());
}

function getKpiIcon(key) {
    const lower = String(key).toLowerCase();

    if (lower.includes('tmax')) return '&#128200;';
    if (lower.includes('tmin')) return '&#128201;';
    if (lower.includes('tavg')) return '&#128202;';
    if (lower.includes('rain')) return '&#127783;&#65039;';
    if (lower.includes('shift')) return '&#8599;&#65039;';
    if (lower.includes('percentage')) return '%';

    return '&#128204;';
}

function formatNumber(value) {
    if (value === undefined || value === null || value === '') {
        return 'N/A';
    }

    const num = Number(value);

    if (Number.isNaN(num)) {
        return value;
    }

    if (Math.abs(num) < 0.0001 && num !== 0) {
        return num.toExponential(2);
    }

    return num.toFixed(4);
}

function renderKpiValue(value) {
    if (value === undefined || value === null || value === '') {
        return '';
    }

    if (typeof value === 'number') {
        return formatNumber(value);
    }

    if (typeof value === 'string') {
        return value;
    }

    if (typeof value === 'object') {
        const val = value.value !== undefined ? value.value : '';
        const unit = value.unit || '';
        return `${val} ${unit}`.trim();
    }

    return '';
}

function renderShiftKpiValue(value) {
    if (value === undefined || value === null || value === '') {
        return '';
    }

    if (typeof value === 'number') {
        return `<span class="shift-kpi-number">${formatShiftNumber(value)}</span>`;
    }

    if (typeof value === 'string') {
        return `<span class="shift-kpi-number">${value}</span>`;
    }

    if (typeof value === 'object') {
        const val = value.value !== undefined ? value.value : '';
        const unit = value.unit || '';

        return `
            <span class="shift-kpi-number">${formatShiftNumber(val)}</span>
            ${unit ? `<span class="shift-kpi-unit">${unit}</span>` : ''}
        `;
    }

    return '';
}

function formatShiftNumber(value) {
    const num = Number(value);

    if (Number.isNaN(num)) {
        return value;
    }

    return Number.isInteger(num) ? String(num) : num.toFixed(2).replace(/\.00$/, '');
}

function createShiftKPICard(label, value, unit = '') {
    const formattedValue = unit
        ? renderShiftKpiValue({ value, unit })
        : renderShiftKpiValue(value);

    return `
        <div class="kpi-card shift-kpi-card">
            <div class="shift-kpi-label">${label}</div>
            <div class="shift-kpi-value">${formattedValue}</div>
        </div>
    `;
}

function getKpiDisplayValue(kpi, decimals = 2) {
    const value = typeof kpi === 'object' && kpi !== null ? kpi.value : kpi;
    return typeof value === 'number' ? value.toFixed(decimals) : 'N/A';
}

function getKpiDisplayUnit(kpi, fallbackUnit = '') {
    return typeof kpi === 'object' && kpi !== null ? (kpi.unit || fallbackUnit) : fallbackUnit;
}

// ============================================
// RENDER PLOTLY CHART
// ============================================

const plotConfig = {
    responsive: true,
    displaylogo: false,
    scrollZoom: true,
    modeBarButtonsToRemove: ["lasso2d", "select2d"]
};

function decodeBdataArray(obj) {
    if (!obj || typeof obj !== "object" || !obj.dtype || !obj.bdata) {
        return obj;
    }

    const binary = atob(obj.bdata);
    const buffer = new ArrayBuffer(binary.length);
    const bytes = new Uint8Array(buffer);

    for (let i = 0; i < binary.length; i++) {
        bytes[i] = binary.charCodeAt(i);
    }

    let typedArray;

    if (obj.dtype === "i4") {
        typedArray = new Int32Array(buffer);
    } else if (obj.dtype === "f8") {
        typedArray = new Float64Array(buffer);
    } else if (obj.dtype === "f4") {
        typedArray = new Float32Array(buffer);
    } else if (obj.dtype === "i2") {
        typedArray = new Int16Array(buffer);
    } else if (obj.dtype === "i1") {
        typedArray = new Int8Array(buffer);
    } else if (obj.dtype === "u4") {
        typedArray = new Uint32Array(buffer);
    } else if (obj.dtype === "u2") {
        typedArray = new Uint16Array(buffer);
    } else if (obj.dtype === "u1") {
        typedArray = new Uint8Array(buffer);
    } else {
        console.warn("Unsupported dtype:", obj.dtype);
        return obj;
    }

    return Array.from(typedArray);
}

function normalizePlotlyFigure(figure) {
    if (!figure || !Array.isArray(figure.data)) {
        return figure;
    }

    const normalizedData = figure.data.map((trace) => {
        const newTrace = { ...trace };

        if (newTrace.x && typeof newTrace.x === "object" && newTrace.x.bdata) {
            newTrace.x = decodeBdataArray(newTrace.x);
        }

        if (newTrace.y && typeof newTrace.y === "object" && newTrace.y.bdata) {
            newTrace.y = decodeBdataArray(newTrace.y);
        }

        if (newTrace.customdata && typeof newTrace.customdata === "object" && newTrace.customdata.bdata) {
            newTrace.customdata = decodeBdataArray(newTrace.customdata);
        }

        return newTrace;
    });

    return {
        ...figure,
        data: normalizedData,
        layout: figure.layout || {}
    };
}

function normalizeTraceStyle(data) {
    if (!Array.isArray(data)) {
        return data;
    }

    return data.map((trace) => {
        const t = { ...trace };
        const name = (t.name || "").toLowerCase();

        if (t.type === "bar") {
            return t;
        }

        const isScatterLike =
            t.type === "scatter" ||
            (typeof t.mode === "string" && (
                t.mode.includes("lines") || t.mode.includes("markers")
            ));

        if (!isScatterLike) {
            return t;
        }

        const isTrend = name.includes("trend");
        const isForecast = name.includes("forecast");
        const isHistorical = name.includes("historical");

        if (isTrend) {
            t.mode = "lines";
            t.line = {
                ...(t.line || {}),
                color: t.line?.color || "black",
                width: 1.8,
                dash: "dash"
            };
            return t;
        }

        if (isForecast) {
            t.mode = "lines+markers";
            t.line = {
                ...(t.line || {}),
                color: t.line?.color || "red",
                width: 1.9,
                dash: "dash"
            };
            t.marker = {
                ...(t.marker || {}),
                color: t.marker?.color || "red",
                size: 5.5,
                symbol: "circle"
            };
            return t;
        }

        if (isHistorical) {
            t.mode = "lines+markers";
            t.line = {
                ...(t.line || {}),
                width: 1.9,
                dash: t.line?.dash || "solid"
            };
            t.marker = {
                ...(t.marker || {}),
                size: 5.5,
                symbol: "circle"
            };
            return t;
        }

        t.mode = t.mode || "lines+markers";
        t.line = {
            ...(t.line || {}),
            width: 1.9
        };
        t.marker = {
            ...(t.marker || {}),
            size: 5.5,
            symbol: "circle"
        };

        return t;
    });
}

function enforceAxisLines(layout) {
    const axisFont = {
        size: 13,
        color: "#073b5c"
    };

    const titleFont = {
        size: 15,
        color: "#073b5c"
    };

    const newLayout = {
        ...(layout || {}),
        title: { text: "" },
        autosize: true,
        font: {
            ...(layout?.font || {}),
            size: 13,
            color: "#073b5c"
        },
        margin: {
            ...(layout?.margin || {}),
            t: 10,
            r: 35,
            b: 78,
            l: 70
        },
        legend: {
            ...(layout?.legend || {}),
            orientation: "h",
            x: 0.5,
            xanchor: "center",
            y: -0.18,
            yanchor: "top",
            font: {
                size: 12,
                color: "#073b5c"
            }
        }
    };

    newLayout.xaxis = {
        ...(layout?.xaxis || {}),
        showline: true,
        linecolor: "black",
        linewidth: 1.2,
        mirror: false,
        showgrid: false,
        zeroline: false,
        ticks: "outside",
        ticklen: 5,
        tickwidth: 1,
        tickcolor: "black",
        tickfont: axisFont,
        titlefont: titleFont,
        automargin: true
    };

    newLayout.yaxis = {
        ...(layout?.yaxis || {}),
        showline: true,
        linecolor: "#000000",
        linewidth: 2,
        mirror: false,
        showgrid: false,
        zeroline: false,
        tickfont: axisFont,
        titlefont: titleFont,
        automargin: true
    };

    if (layout?.xaxis2) {
        newLayout.xaxis2 = {
            ...(layout.xaxis2 || {}),
            showline: true,
            linecolor: "black",
            linewidth: 1.2,
            mirror: false,
            showgrid: false,
            zeroline: false,
            tickfont: axisFont,
            titlefont: titleFont,
            automargin: true
        };
    }

    if (layout?.yaxis2) {
        newLayout.yaxis2 = {
            ...(layout.yaxis2 || {}),
            showline: true,
            linecolor: "#000000",
            linewidth: 2,
            mirror: false,
            showgrid: false,
            zeroline: false,
            tickfont: axisFont,
            titlefont: titleFont,
            automargin: true
        };
    }

    return newLayout;
}

function forceVisibleAxes(layout) {
    const fixedLayout = { ...(layout || {}) };

    fixedLayout.xaxis = {
        ...(fixedLayout.xaxis || {}),
        showline: true,
        linecolor: "#000000",
        linewidth: 1.2,
        mirror: false,
        showgrid: false,
        zeroline: false,
        ticks: "outside",
        ticklen: 5,
        tickwidth: 1,
        tickcolor: "#000000",
        automargin: true
    };

    fixedLayout.yaxis = {
        ...(fixedLayout.yaxis || {}),
        showline: true,
        linecolor: "#000000",
        linewidth: 2,
        mirror: false,
        showgrid: false,
        zeroline: false,
        ticks: "outside",
        ticklen: 5,
        tickwidth: 1,
        tickcolor: "#000000",
        automargin: true
    };

    if (fixedLayout.xaxis2) {
        fixedLayout.xaxis2 = {
            ...(fixedLayout.xaxis2 || {}),
            showline: true,
            linecolor: "#000000",
            linewidth: 1.2,
            mirror: false,
            showgrid: false,
            zeroline: false,
            ticks: "outside",
            ticklen: 5,
            tickwidth: 1,
            tickcolor: "#000000",
            automargin: true
        };
    }

    if (fixedLayout.yaxis2) {
        fixedLayout.yaxis2 = {
            ...(fixedLayout.yaxis2 || {}),
            showline: true,
            linecolor: "#000000",
            linewidth: 2,
            mirror: false,
            showgrid: false,
            zeroline: false,
            ticks: "outside",
            ticklen: 5,
            tickwidth: 1,
            tickcolor: "#000000",
            automargin: true
        };
    }

    return fixedLayout;
}

function addLegendAxisSpacing(layout) {
    const fixedLayout = { ...(layout || {}) };
    const existingXAxisTitle = fixedLayout.xaxis?.title;
    const existingXAxisTitleText =
        typeof existingXAxisTitle === "string"
            ? existingXAxisTitle
            : existingXAxisTitle?.text;
    const xAxisTitle =
        existingXAxisTitle && typeof existingXAxisTitle === "object"
            ? existingXAxisTitle
            : {};

    fixedLayout.margin = {
        ...(fixedLayout.margin || {}),
        b: 125
    };

    fixedLayout.xaxis = {
        ...(fixedLayout.xaxis || {}),
        automargin: true,
        title: {
            ...xAxisTitle,
            text: existingXAxisTitleText || "Year",
            standoff: 25
        }
    };

    fixedLayout.legend = {
        ...(fixedLayout.legend || {}),
        orientation: "h",
        x: 0.5,
        xanchor: "center",
        y: -0.35,
        yanchor: "top"
    };

    return fixedLayout;
}

function addBottomAxisShape(layout) {
    const fixedLayout = { ...(layout || {}) };

    fixedLayout.shapes = (fixedLayout.shapes || []).filter(shape => {
        return !(shape.name === "forced-x-axis-baseline");
    });

    fixedLayout.shapes.push({
        name: "forced-x-axis-baseline",
        type: "line",
        xref: "paper",
        yref: "paper",
        x0: 0,
        x1: 1,
        y0: 0,
        y1: 0,
        line: {
            color: "#000000",
            width: 1.2
        },
        layer: "above"
    });

    return fixedLayout;
}

function addForcedBottomXAxisLine(layout) {
    const fixedLayout = { ...(layout || {}) };

    fixedLayout.shapes = Array.isArray(fixedLayout.shapes)
        ? fixedLayout.shapes.filter(shape => shape.name !== "forced-bottom-x-axis-line")
        : [];

    fixedLayout.shapes.push({
        name: "forced-bottom-x-axis-line",
        type: "line",
        xref: "paper",
        yref: "paper",
        x0: 0,
        x1: 1,
        y0: 0.002,
        y1: 0.002,
        line: {
            color: "#000000",
            width: 1,
            dash: "solid"
        },
        layer: "above"
    });

    return fixedLayout;
}

function isShiftChart(chart) {
    const title = (chart?.title || "").toLowerCase();
    const chartId = (chart?.chart_id || "").toLowerCase();

    return (
        title.includes("shift") ||
        chartId.includes("shift") ||
        title.includes("historical vs projected") ||
        chartId.includes("decadal_temperature") ||
        chartId.includes("decadal_rainfall")
    );
}

function isMonthlyTemperatureShiftChart(divId = "", chart = {}) {
    const id = `${divId || ""} ${chart?.chart_id || ""}`.toLowerCase();
    const title = (chart?.title || "").toLowerCase();

    return (
        id.includes("decadal-temp-plot") ||
        id.includes("decadal_temperature_shift") ||
        id.includes("monthly_temperature_shift") ||
        id.includes("temperature_shift") ||
        title.includes("monthly temperature shift") ||
        title.includes("temperature shift")
    );
}

function applyMobileMonthlyShiftSpacing(layout, divId = "", chart = {}) {
    const isMobile = window.innerWidth <= 560;

    if (!isMobile || !isMonthlyTemperatureShiftChart(divId, chart)) {
        return layout;
    }

    const fixedLayout = { ...(layout || {}) };
    const existingXAxisTitle = fixedLayout.xaxis?.title;
    const existingXAxisTitleText =
        typeof existingXAxisTitle === "string"
            ? existingXAxisTitle
            : existingXAxisTitle?.text;
    const xAxisTitle =
        existingXAxisTitle && typeof existingXAxisTitle === "object"
            ? existingXAxisTitle
            : {};

    fixedLayout.margin = {
        ...(fixedLayout.margin || {}),
        l: Math.max((fixedLayout.margin && fixedLayout.margin.l) || 0, 58),
        r: Math.max((fixedLayout.margin && fixedLayout.margin.r) || 0, 50),
        t: Math.max((fixedLayout.margin && fixedLayout.margin.t) || 0, 95),
        b: Math.max((fixedLayout.margin && fixedLayout.margin.b) || 0, 95)
    };

    fixedLayout.legend = {
        ...(fixedLayout.legend || {}),
        orientation: "h",
        x: 0.5,
        xanchor: "center",
        y: 1.18,
        yanchor: "bottom",
        traceorder: "normal",
        bgcolor: "rgba(255,255,255,0.9)",
        font: {
            ...((fixedLayout.legend && fixedLayout.legend.font) || {}),
            size: 9
        }
    };

    fixedLayout.xaxis = {
        ...(fixedLayout.xaxis || {}),
        automargin: true,
        tickangle: -90,
        title: {
            ...xAxisTitle,
            text: existingXAxisTitleText || "Month",
            standoff: 22
        }
    };

    fixedLayout.yaxis = {
        ...(fixedLayout.yaxis || {}),
        automargin: true
    };

    fixedLayout.yaxis2 = {
        ...(fixedLayout.yaxis2 || {}),
        automargin: true
    };

    delete fixedLayout.width;
    fixedLayout.height = Math.max(Number(fixedLayout.height) || 0, 430);
    fixedLayout.autosize = true;

    return fixedLayout;
}

function removeDashedZeroBaseline(layout) {
    if (!layout) {
        return layout;
    }

    const newLayout = { ...layout };

    if (Array.isArray(newLayout.shapes)) {
        newLayout.shapes = newLayout.shapes.filter((shape) => {
            const isHorizontalLine =
                shape.type === "line" &&
                shape.y0 === shape.y1;

            const isZeroLine =
                Number(shape.y0) === 0 || Number(shape.y1) === 0;

            const isDashed =
                shape.line &&
                (
                    shape.line.dash === "dash" ||
                    shape.line.dash === "dot" ||
                    shape.line.dash === "dashdot"
                );

            return !(isHorizontalLine && isZeroLine && isDashed);
        });
    }

    return newLayout;
}

function removeZeroBaselineTrace(data, chart) {
    if (!isShiftChart(chart) || !Array.isArray(data)) {
        return data;
    }

    return data.filter((trace) => {
        const name = (trace.name || "").toLowerCase();

        const isBaselineName =
            name.includes("zero") ||
            name.includes("baseline") ||
            name.includes("0 line") ||
            name.includes("0% line");

        const y = trace.y;
        const isAllZero =
            Array.isArray(y) &&
            y.length > 0 &&
            y.every((v) => Number(v) === 0);

        const isDashedLine =
            trace.line &&
            (
                trace.line.dash === "dash" ||
                trace.line.dash === "dot" ||
                trace.line.dash === "dashdot"
            );

        return !(
            (isBaselineName && isAllZero) ||
            ((isBaselineName || isAllZero) && isDashedLine)
        );
    });
}

function bringShiftLinesToFront(data, chart) {
    if (!isShiftChart(chart) || !Array.isArray(data)) {
        return data;
    }

    const bars = [];
    const lines = [];
    const others = [];

    data.forEach((trace) => {
        const traceType = trace.type || "";
        const traceMode = trace.mode || "";

        const isBarTrace = traceType === "bar";

        const isLineTrace =
            traceType === "scatter" ||
            traceMode.includes("lines") ||
            traceMode.includes("markers");

        if (isBarTrace) {
            bars.push({
                ...trace,
                opacity: trace.opacity !== undefined ? trace.opacity : 0.85
            });
        } else if (isLineTrace) {
            lines.push({
                ...trace,
                mode: trace.mode || "lines+markers",
                line: {
                    ...(trace.line || {}),
                    width: trace.line?.width || 2
                },
                marker: {
                    ...(trace.marker || {}),
                    size: trace.marker?.size || 6
                }
            });
        } else {
            others.push(trace);
        }
    });

    return [...bars, ...others, ...lines];
}

function setShiftLegendOrder(data, chart) {
    if (!isShiftChart(chart) || !Array.isArray(data)) {
        return data;
    }

    return data.map((trace) => {
        const name = (trace.name || "").toLowerCase();

        if (name.includes("historical")) {
            return { ...trace, legendrank: 1 };
        }

        if (name.includes("forecast")) {
            return { ...trace, legendrank: 2 };
        }

        if (name.includes("percentage")) {
            return { ...trace, legendrank: 3 };
        }

        return trace;
    });
}

function deepCloneFigure(figure) {
    return JSON.parse(JSON.stringify(figure));
}

function isLineTrace(trace) {
    return trace.type === "scatter" || (trace.mode && trace.mode.includes("lines"));
}

function isBarTrace(trace) {
    return trace.type === "bar";
}

function isTrendTrace(trace) {
    const name = String(trace.name || "").toLowerCase();
    return name.includes("trend");
}

function detectAnimationType(figure, chartId = "", chartTitle = "") {
    const id = String(chartId || "").toLowerCase();
    const title = String(chartTitle || "").toLowerCase();

    const hasBars = figure.data.some(isBarTrace);
    const hasLines = figure.data.some(isLineTrace);

    if (id.includes("extreme") || title.includes("extreme")) {
        return "extreme_bar";
    }

    if (id.includes("rainfall_rainydays") || title.includes("rainy days")) {
        return "rainfall_rainydays";
    }

    if (id.includes("decadal") || title.includes("shift") || title.includes("percentage change")) {
        return "monthly_shift";
    }

    if (id.includes("projected") || title.includes("forecast") || title.includes("30-year forecast")) {
        return "projected_line";
    }

    if (hasBars && hasLines) {
        return "mixed";
    }

    if (hasBars) {
        return "bar";
    }

    if (hasLines) {
        return "line";
    }

    return "default";
}

function isArrayLikePlotValue(value) {
    return Array.isArray(value);
}

function getTraceLength(trace) {
    if (isArrayLikePlotValue(trace.y)) {
        return trace.y.length;
    }

    if (isArrayLikePlotValue(trace.x)) {
        return trace.x.length;
    }

    return 0;
}

function getZeroedValues(values) {
    if (!isArrayLikePlotValue(values)) {
        return values;
    }

    return values.map(() => 0);
}

function getInterpolatedValues(values, progress, overshoot = false) {
    if (!isArrayLikePlotValue(values)) {
        return values;
    }

    const easedProgress = easeOutCubic(progress);
    const popMultiplier = overshoot && progress < 0.78
        ? 1 + Math.sin(progress * Math.PI) * 0.06
        : 1;

    return values.map((value) => {
        const numericValue = Number(value);

        if (!Number.isFinite(numericValue)) {
            return value;
        }

        const multiplier = numericValue > 0 ? popMultiplier : 1;
        return numericValue * easedProgress * multiplier;
    });
}

function easeOutCubic(t) {
    return 1 - Math.pow(1 - t, 3);
}

function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

function getLineTracePayload(trace, pointCount) {
    const payload = {};

    if (isArrayLikePlotValue(trace.x)) {
        payload.x = [trace.x.slice(0, pointCount)];
    }

    if (isArrayLikePlotValue(trace.y)) {
        payload.y = [trace.y.slice(0, pointCount)];
    }

    if (isArrayLikePlotValue(trace.customdata)) {
        payload.customdata = [trace.customdata.slice(0, pointCount)];
    }

    if (isArrayLikePlotValue(trace.text)) {
        payload.text = [trace.text.slice(0, pointCount)];
    }

    return payload;
}

function getAnimationTraceOrder(data, animationType) {
    const indices = data.map((_, index) => index);
    const lineIndices = indices.filter(index => isLineTrace(data[index]));
    const barIndices = indices.filter(index => isBarTrace(data[index]));
    const trendLineIndices = lineIndices.filter(index => isTrendTrace(data[index]));
    const nonTrendLineIndices = lineIndices.filter(index => !isTrendTrace(data[index]));

    if (animationType === "rainfall_rainydays") {
        return [...barIndices, ...nonTrendLineIndices, ...trendLineIndices];
    }

    if (animationType === "monthly_shift") {
        return [...nonTrendLineIndices, ...barIndices, ...trendLineIndices];
    }

    if (animationType === "projected_line" || animationType === "line") {
        return [...nonTrendLineIndices, ...trendLineIndices];
    }

    if (animationType === "bar" || animationType === "extreme_bar") {
        return barIndices;
    }

    return [...barIndices, ...nonTrendLineIndices, ...trendLineIndices];
}

function createAnimatedStartFigure(finalFigure) {
    const startFigure = deepCloneFigure(finalFigure);

    startFigure.data = startFigure.data.map((trace) => {
        const animatedTrace = { ...trace };

        if (isLineTrace(animatedTrace)) {
            if (isArrayLikePlotValue(animatedTrace.x)) {
                animatedTrace.x = [];
            }

            if (isArrayLikePlotValue(animatedTrace.y)) {
                animatedTrace.y = [];
            }

            if (isArrayLikePlotValue(animatedTrace.customdata)) {
                animatedTrace.customdata = [];
            }

            if (isArrayLikePlotValue(animatedTrace.text)) {
                animatedTrace.text = [];
            }
        }

        if (isBarTrace(animatedTrace)) {
            if (animatedTrace.orientation === "h" && isArrayLikePlotValue(animatedTrace.x)) {
                animatedTrace.x = getZeroedValues(animatedTrace.x);
            } else if (isArrayLikePlotValue(animatedTrace.y)) {
                animatedTrace.y = getZeroedValues(animatedTrace.y);
            }
        }

        return animatedTrace;
    });

    return startFigure;
}

async function animateLineTrace(plotDiv, trace, traceIndex) {
    const pointCount = getTraceLength(trace);

    if (!pointCount) {
        return;
    }

    const frames = Math.min(Math.max(pointCount, 12), 45);

    for (let frame = 1; frame <= frames; frame++) {
        const currentPointCount = Math.max(1, Math.ceil((frame / frames) * pointCount));
        await Plotly.restyle(plotDiv, getLineTracePayload(trace, currentPointCount), [traceIndex]);
        await delay(16);
    }
}

async function animateBarTrace(plotDiv, trace, traceIndex, allowPop = false) {
    const isHorizontal = trace.orientation === "h";
    const values = isHorizontal ? trace.x : trace.y;

    if (!isArrayLikePlotValue(values) || !values.length) {
        return;
    }

    const frames = 28;

    for (let frame = 1; frame <= frames; frame++) {
        const progress = frame / frames;
        const animatedValues = getInterpolatedValues(values, progress, allowPop);
        const payload = isHorizontal ? { x: [animatedValues] } : { y: [animatedValues] };
        await Plotly.restyle(plotDiv, payload, [traceIndex]);
        await delay(16);
    }
}

async function renderAnimatedPlot(plotDiv, figure, chartId = "", chartTitle = "") {
    const finalFigure = deepCloneFigure(figure);
    finalFigure.layout = applyMobileMonthlyShiftSpacing(finalFigure.layout, chartId, {
        chart_id: chartId,
        title: chartTitle
    });
    const animationType = detectAnimationType(finalFigure, chartId, chartTitle);
    const startFigure = createAnimatedStartFigure(finalFigure);

    await Plotly.newPlot(
        plotDiv,
        startFigure.data,
        startFigure.layout,
        plotConfig
    );
    safelyResizePlot(plotDiv, 80);

    const traceOrder = getAnimationTraceOrder(finalFigure.data, animationType);

    for (const traceIndex of traceOrder) {
        const trace = finalFigure.data[traceIndex];

        if (isBarTrace(trace)) {
            await animateBarTrace(plotDiv, trace, traceIndex, animationType === "extreme_bar");
        } else if (isLineTrace(trace)) {
            await animateLineTrace(plotDiv, trace, traceIndex);
        }
    }

    await Plotly.react(
        plotDiv,
        finalFigure.data,
        finalFigure.layout,
        plotConfig
    );

    safelyResizePlot(plotDiv, 120);
}

function setupGraphViewportObserver() {
    if (graphViewportObserver) {
        graphViewportObserver.disconnect();
    }

    graphViewportObserver = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
            const card = entry.target;

            if (entry.isIntersecting) {
                if (card.dataset.inViewport !== "true") {
                    card.dataset.inViewport = "true";
                    runViewportGraphAnimation(card);
                }
            } else {
                card.dataset.inViewport = "false";
                card.dataset.hasAnimatedInViewport = "false";
            }
        });
    }, {
        threshold: 0.35,
        rootMargin: "0px 0px -8% 0px"
    });
}

async function runViewportGraphAnimation(card) {
    if (!card) return;

    if (card.dataset.hasAnimatedInViewport === "true") return;

    card.dataset.hasAnimatedInViewport = "true";

    const plotDiv = card.querySelector(".plot, .plotly-graph-div, [data-plot]");
    if (!plotDiv) return;

    const chartPayload = card.__chartPayload;

    if (!chartPayload || !chartPayload.figure) return;

    try {
        await renderAnimatedPlot(
            plotDiv,
            chartPayload.figure,
            chartPayload.chart_id,
            chartPayload.title
        );
    } catch (error) {
        console.error("Viewport graph animation failed:", error);

        await Plotly.newPlot(
            plotDiv,
            chartPayload.figure.data,
            chartPayload.figure.layout,
            plotConfig
        );
        safelyResizePlot(plotDiv, 120);
    }

    safelyResizePlot(plotDiv, 150);

    if (card.dataset.needsSecondResize === "true") {
        safelyResizePlot(plotDiv, 220);
    }
}

function isElementPartlyVisible(el) {
    const rect = el.getBoundingClientRect();
    const windowHeight = window.innerHeight || document.documentElement.clientHeight;

    return rect.top < windowHeight * 0.85 && rect.bottom > windowHeight * 0.15;
}

function observeGraphCard(card, chart) {
    if (!card || !graphViewportObserver || !chart) return;

    card.__chartPayload = {
        figure: chart.figure,
        chart_id: chart.chart_id,
        title: chart.title
    };

    card.dataset.inViewport = "false";
    card.dataset.hasAnimatedInViewport = "false";

    graphViewportObserver.observe(card);

    if (isElementPartlyVisible(card)) {
        runViewportGraphAnimation(card);
    }
}

async function renderPlotlyChart(divId, chartData) {
    if (!chartData || !chartData.figure) {
        console.error(`Invalid chart data for ${divId}`);
        return;
    }

    try {
        const plotElement = document.getElementById(divId);
        const chartCard = plotElement ? plotElement.closest('.graph-card') : null;
        const districtKey = String(currentDistrict || '').toLowerCase();
        const isChhukhaAnalysisChart =
            districtKey.includes('chhukha') &&
            (currentAnalysis === 'temperature' || currentAnalysis === 'rainfall');
        const isIndividualExtremeChart =
            ['extreme-rainfall-plot', 'extreme-tmax-plot', 'extreme-tmin-plot'].includes(divId) ||
            ((chartData.category || '').toLowerCase().includes('extreme') && divId.startsWith('extreme-'));
        const isMonthlyTempShiftChart = isMonthlyTemperatureShiftChart(divId, chartData);

        if (chartCard) {
            if (isChhukhaAnalysisChart) {
                chartCard.classList.add('chhukha-chart-card');
                chartCard.dataset.needsSecondResize = "true";
            } else {
                chartCard.classList.remove('chhukha-chart-card');
                chartCard.dataset.needsSecondResize = "false";
            }

            chartCard.classList.toggle('monthly-shift-card', isMonthlyTempShiftChart);
            chartCard.classList.toggle('monthly-temperature-shift-card', isMonthlyTempShiftChart);
        }

        if (plotElement) {
            plotElement.dataset.plot = "true";
            plotElement.style.width = "100%";
            plotElement.style.maxWidth = "100%";
            plotElement.style.minWidth = "0";
        }

        const normalizedFigure = normalizePlotlyFigure(chartData.figure);
        let styledData = normalizeTraceStyle(normalizedFigure.data);
        styledData = removeZeroBaselineTrace(styledData, chartData);
        styledData = bringShiftLinesToFront(styledData, chartData);
        styledData = setShiftLegendOrder(styledData, chartData);

        if (districtKey === 'chhukha' && divId === 'historical-rainfall-plot') {
            styledData = styledData.map((trace) => {
                if ((trace.name || '').trim() === 'Rain (mm)') {
                    return { ...trace, name: 'Rainfall (mm)' };
                }

                return trace;
            });
        }

        let cleanLayout = { ...(normalizedFigure.layout || {}) };

        if (isShiftChart(chartData)) {
            cleanLayout = removeDashedZeroBaseline(cleanLayout);

            cleanLayout.xaxis = {
                ...(cleanLayout.xaxis || {}),
                zeroline: false,
                showline: true,
                linecolor: "black",
                linewidth: 1.2,
                showgrid: false
            };

            cleanLayout.yaxis = {
                ...(cleanLayout.yaxis || {}),
                zeroline: false,
                showline: true,
                linecolor: "#000000",
                linewidth: 2,
                showgrid: false
            };

            if (cleanLayout.xaxis2) {
                cleanLayout.xaxis2 = {
                    ...(cleanLayout.xaxis2 || {}),
                    zeroline: false,
                    showline: true,
                    linecolor: "black",
                    linewidth: 1.2,
                    showgrid: false
                };
            }

            if (cleanLayout.yaxis2) {
                cleanLayout.yaxis2 = {
                    ...(cleanLayout.yaxis2 || {}),
                    zeroline: false,
                    showline: true,
                    linecolor: "#000000",
                    linewidth: 2,
                    mirror: false,
                    showgrid: false
                };
            }
        }

        cleanLayout = enforceAxisLines(cleanLayout);
        cleanLayout = forceVisibleAxes(cleanLayout);

        if (isIndividualExtremeChart) {
            cleanLayout.margin = {
                ...(cleanLayout.margin || {}),
                t: 30,
                r: 35,
                b: 45,
                l: 70
            };

            cleanLayout.height = 360;
        }

        if (divId === 'extreme-rainfall-plot') {
            cleanLayout.yaxis = {
                ...(cleanLayout.yaxis || {}),
                showline: true,
                linecolor: "#000000",
                linewidth: 1.4,
                zeroline: false
            };
        }

        if (isChhukhaAnalysisChart) {
            const isMobilePhone = window.innerWidth <= 560;

            cleanLayout.height = isMobilePhone ? 390 : 330;

            cleanLayout.margin = {
                ...(cleanLayout.margin || {}),
                t: 8,
                r: 35,
                b: isMobilePhone ? 110 : 88,
                l: 70
            };

            cleanLayout.legend = {
                ...(cleanLayout.legend || {}),
                orientation: "h",
                x: 0.5,
                xanchor: "center",
                y: -0.22,
                yanchor: "top",
                font: {
                    size: 12,
                    color: "#073b5c"
                }
            };

            cleanLayout.xaxis = {
                ...(cleanLayout.xaxis || {}),
                showline: true,
                linecolor: "#000000",
                linewidth: 1,
                showgrid: false,
                zeroline: false,
                automargin: true,
                ticks: "outside",
                ticklen: 5,
                tickwidth: 1,
                tickcolor: "#000000"
            };

            cleanLayout.yaxis = {
                ...(cleanLayout.yaxis || {}),
                showline: true,
                linecolor: "#000000",
                linewidth: 2,
                showgrid: false,
                zeroline: false,
                automargin: true,
                ticks: "outside",
                ticklen: 5,
                tickwidth: 1,
                tickcolor: "#000000"
            };
        }

        cleanLayout = addLegendAxisSpacing(cleanLayout);
        cleanLayout = applyMobileMonthlyShiftSpacing(cleanLayout, divId, chartData);

        if (window.innerWidth <= 560) {
            delete cleanLayout.width;
            cleanLayout.autosize = true;
        }

        const finalFigure = {
            ...normalizedFigure,
            data: styledData,
            layout: cleanLayout
        };

        if (!chartCard || !plotElement || !graphViewportObserver) {
            try {
                await renderAnimatedPlot(
                    plotElement || divId,
                    finalFigure,
                    chartData.chart_id,
                    chartData.title
                );
            } catch (error) {
                console.error("Animation failed, rendering normal Plotly graph:", error);
                await Plotly.newPlot(
                    plotElement || divId,
                    finalFigure.data,
                    finalFigure.layout,
                    plotConfig
                );
                safelyResizePlot(plotElement || document.getElementById(divId), 120);
            }
            return;
        }

        plotElement.innerHTML = "";

        observeGraphCard(chartCard, {
            figure: finalFigure,
            chart_id: chartData.chart_id,
            title: chartData.title
        });
    } catch (error) {
        console.error(`Error rendering Plotly chart in ${divId}:`, error);
    }
}

// ============================================
// TEMPERATURE ANALYSIS
// ============================================

async function loadTemperatureAnalysis(district) {
    console.log('Loading temperature analysis for:', district);

    setupGraphViewportObserver();
    // Clear previous content
    clearPlots(['historical-temp', 'projected-tmax', 'projected-tmin', 'decadal-temp']);

    // Load all temperature charts
    const [historicalTemp, projectedTmax, projectedTmin, decadalTemp] = await Promise.all([
        loadChart(`/static/data/${district}/historical_temperature.json`),
        loadChart(`/static/data/${district}/projected_tmax.json`),
        loadChart(`/static/data/${district}/projected_tmin.json`),
        loadChart(`/static/data/${district}/decadal_temperature_shift.json`)
    ]);

    // Render Historical Temperature
    if (historicalTemp) {
        document.getElementById('historical-temp-title').textContent = getStandardChartTitle(historicalTemp, 'historical_temperature.json');
        renderTemperatureKPIs('historical-temp-kpis', historicalTemp.kpis);
        await renderPlotlyChart('historical-temp-plot', historicalTemp);
        document.getElementById('historical-temp-interpretation').textContent = historicalTemp.interpretation || '';
    }

    // Render Projected Tmax
    if (projectedTmax) {
        document.getElementById('projected-tmax-title').textContent = getStandardChartTitle(projectedTmax, 'projected_tmax.json');
        renderTemperatureKPIs('projected-tmax-kpis', projectedTmax.kpis);
        await renderPlotlyChart('projected-tmax-plot', projectedTmax);
        document.getElementById('projected-tmax-interpretation').textContent = projectedTmax.interpretation || '';
    }

    // Render Projected Tmin
    if (projectedTmin) {
        document.getElementById('projected-tmin-title').textContent = getStandardChartTitle(projectedTmin, 'projected_tmin.json');
        renderTemperatureKPIs('projected-tmin-kpis', projectedTmin.kpis);
        await renderPlotlyChart('projected-tmin-plot', projectedTmin);
        document.getElementById('projected-tmin-interpretation').textContent = projectedTmin.interpretation || '';
    }

    // Render Decadal Temperature Shift
    if (decadalTemp) {
        document.getElementById('decadal-temp-title').textContent = getStandardChartTitle(decadalTemp, 'decadal_temperature_shift.json');
        renderTemperatureShiftKPIs('decadal-temp-kpis', decadalTemp.kpis);
        await renderPlotlyChart('decadal-temp-plot', decadalTemp);
        document.getElementById('decadal-temp-interpretation').textContent = decadalTemp.interpretation || '';
    }
}

function renderTemperatureKPIs(containerId, kpis) {
    const container = document.getElementById(containerId);
    renderKpis(kpis, container);
    return;
    container.innerHTML = '';

    if (kpis.tmax) {
        let tmaxValue = kpis.tmax.value || kpis.tmax.mean || kpis.tmax.average;
        container.innerHTML += createKPICard(
            'Tmax',
            tmaxValue !== undefined && tmaxValue !== null ? tmaxValue.toFixed(2) : 'N/A',
            kpis.tmax.unit || '°C',
            {
                trend: kpis.tmax.trend,
                pValue: kpis.tmax.p_value,
                slope: kpis.tmax.sen_slope
            },
            'temperature'
        );
    }

    if (kpis.tmin) {
        let tminValue = kpis.tmin.value || kpis.tmin.mean || kpis.tmin.average;
        container.innerHTML += createKPICard(
            'Tmin',
            tminValue !== undefined && tminValue !== null ? tminValue.toFixed(2) : 'N/A',
            kpis.tmin.unit || '°C',
            {
                trend: kpis.tmin.trend,
                pValue: kpis.tmin.p_value,
                slope: kpis.tmin.sen_slope
            },
            'temperature'
        );
    }

    if (kpis.tavg) {
        let tavgValue = kpis.tavg.value || kpis.tavg.mean || kpis.tavg.average;
        container.innerHTML += createKPICard(
            'Tavg',
            tavgValue !== undefined && tavgValue !== null ? tavgValue.toFixed(2) : 'N/A',
            kpis.tavg.unit || '°C',
            {
                trend: kpis.tavg.trend,
                pValue: kpis.tavg.p_value,
                slope: kpis.tavg.sen_slope
            },
            'temperature'
        );
    }
}

function renderTemperatureShiftKPIs(containerId, kpis) {
    const container = document.getElementById(containerId);
    container.innerHTML = '';
    container.classList.add('shift-kpi-grid');
    kpis = kpis || {};

    if (kpis.average_shift_c !== undefined) {
        container.innerHTML += createShiftKPICard('Average Temperature Shift', kpis.average_shift_c, '&deg;C');
    }

    if (kpis.highest_percentage_change !== undefined) {
        container.innerHTML += createShiftKPICard('Highest Percentage Change', kpis.highest_percentage_change);
    }

    if (kpis.lowest_percentage_change !== undefined) {
        container.innerHTML += createShiftKPICard('Lowest Percentage Change', kpis.lowest_percentage_change);
    }

    return;

    if (kpis.average_shift_c !== undefined) {
        container.innerHTML += createKPICard(
            'Average Temperature Shift',
            getKpiDisplayValue(kpis.average_shift_c, 2),
            '°C',
            {},
            'temperature'
        );
    }

    if (kpis.highest_percentage_change !== undefined) {
        container.innerHTML += createKPICard(
            'Highest Percentage Change',
            getKpiDisplayValue(kpis.highest_percentage_change, 2),
            getKpiDisplayUnit(kpis.highest_percentage_change, '%'),
            {},
            'temperature'
        );
    }

    if (kpis.lowest_percentage_change !== undefined) {
        container.innerHTML += createKPICard(
            'Lowest Percentage Change',
            getKpiDisplayValue(kpis.lowest_percentage_change, 2),
            getKpiDisplayUnit(kpis.lowest_percentage_change, '%'),
            {},
            'temperature'
        );
    }
}

// ============================================
// RAINFALL ANALYSIS
// ============================================

async function loadRainfallAnalysis(district) {
    console.log('Loading rainfall analysis for:', district);

    setupGraphViewportObserver();
    // Clear previous content
    clearPlots(['historical-rainfall', 'projected-rainfall', 'decadal-rainfall']);

    // Load all rainfall charts
    const [historicalRainfall, projectedRainfall, decadalRainfall] = await Promise.all([
        loadChart(`/static/data/${district}/historical_rainfall_rainydays.json`),
        loadChart(`/static/data/${district}/projected_rainfall.json`),
        loadChart(`/static/data/${district}/decadal_rainfall_shift.json`)
    ]);

    // Render Historical Rainfall
    if (historicalRainfall) {
        document.getElementById('historical-rainfall-title').textContent = getStandardChartTitle(historicalRainfall, 'historical_rainfall_rainydays.json');
        renderRainfallKPIs('historical-rainfall-kpis', historicalRainfall.kpis);
        await renderPlotlyChart('historical-rainfall-plot', historicalRainfall);
        document.getElementById('historical-rainfall-interpretation').textContent = historicalRainfall.interpretation || '';
    }

    // Render Projected Rainfall
    if (projectedRainfall) {
        document.getElementById('projected-rainfall-title').textContent = getStandardChartTitle(projectedRainfall, 'projected_rainfall.json');
        renderRainfallKPIs('projected-rainfall-kpis', projectedRainfall.kpis);
        await renderPlotlyChart('projected-rainfall-plot', projectedRainfall);
        document.getElementById('projected-rainfall-interpretation').textContent = projectedRainfall.interpretation || '';
    }

    // Render Decadal Rainfall Shift
    if (decadalRainfall) {
        document.getElementById('decadal-rainfall-title').textContent = getStandardChartTitle(decadalRainfall, 'decadal_rainfall_shift.json');
        renderRainfallShiftKPIs('decadal-rainfall-kpis', decadalRainfall.kpis);
        await renderPlotlyChart('decadal-rainfall-plot', decadalRainfall);
        document.getElementById('decadal-rainfall-interpretation').textContent = decadalRainfall.interpretation || '';
    }
}

function renderRainfallKPIs(containerId, kpis) {
    const container = document.getElementById(containerId);
    renderKpis(kpis, container);
    return;
    container.innerHTML = '';

    if (kpis.rainfall) {
        // Try to get value from multiple possible field names
        let rainfallValue = kpis.rainfall.value;
        if (rainfallValue === undefined || rainfallValue === null) {
            rainfallValue = kpis.rainfall.mean || kpis.rainfall.average || kpis.rainfall.annual;
        }
        
        const displayValue = rainfallValue !== undefined && rainfallValue !== null 
            ? rainfallValue.toFixed(1) 
            : 'N/A';

        container.innerHTML += createKPICard(
            'Rainfall',
            displayValue,
            kpis.rainfall.unit || 'mm',
            {
                trend: kpis.rainfall.trend,
                pValue: kpis.rainfall.p_value,
                slope: kpis.rainfall.sen_slope
            },
            'rainfall'
        );
    }
}

function renderRainfallShiftKPIs(containerId, kpis) {
    const container = document.getElementById(containerId);
    container.innerHTML = '';
    container.classList.add('shift-kpi-grid');
    kpis = kpis || {};

    if (kpis.average_shift_mm !== undefined) {
        container.innerHTML += createShiftKPICard('Average Rainfall Shift', kpis.average_shift_mm, 'mm');
    }

    if (kpis.highest_projected_rainfall !== undefined) {
        container.innerHTML += createShiftKPICard('Highest Projected Rainfall', kpis.highest_projected_rainfall);
    }

    if (kpis.highest_percentage_change !== undefined) {
        container.innerHTML += createShiftKPICard('Highest Percentage Change', kpis.highest_percentage_change);
    }

    if (kpis.lowest_percentage_change !== undefined) {
        container.innerHTML += createShiftKPICard('Lowest Percentage Change', kpis.lowest_percentage_change);
    }

    return;

    if (kpis.average_shift_mm !== undefined) {
        container.innerHTML += createKPICard(
            'Average Rainfall Shift',
            getKpiDisplayValue(kpis.average_shift_mm, 1),
            'mm',
            {},
            'rainfall'
        );
    }

    if (kpis.highest_projected_rainfall !== undefined) {
        container.innerHTML += createKPICard(
            'Highest Projected Rainfall',
            getKpiDisplayValue(kpis.highest_projected_rainfall, 1),
            getKpiDisplayUnit(kpis.highest_projected_rainfall, 'mm'),
            {},
            'rainfall'
        );
    }

    if (kpis.highest_percentage_change !== undefined) {
        container.innerHTML += createKPICard(
            'Highest Percentage Change',
            getKpiDisplayValue(kpis.highest_percentage_change, 2),
            getKpiDisplayUnit(kpis.highest_percentage_change, '%'),
            {},
            'rainfall'
        );
    }

    if (kpis.lowest_percentage_change !== undefined) {
        container.innerHTML += createKPICard(
            'Lowest Percentage Change',
            getKpiDisplayValue(kpis.lowest_percentage_change, 2),
            getKpiDisplayUnit(kpis.lowest_percentage_change, '%'),
            {},
            'rainfall'
        );
    }
}

// ============================================
// EXTREME EVENTS
// ============================================

async function loadExtremeEvents() {
    console.log('Loading extreme events...');

    setupGraphViewportObserver();
    // Clear previous content
    clearPlots(['extreme-rainfall', 'extreme-tmax', 'extreme-tmin']);

    // Load extreme event charts
    const [extremeRainfall, extremeTmax, extremeTmin] = await Promise.all([
        loadChart('/static/data/extreme_events/extreme_daily_rainfall_events.json'),
        loadChart('/static/data/extreme_events/extreme_tmax.json'),
        loadChart('/static/data/extreme_events/extreme_tmin.json')
    ]);

    // Render Extreme Rainfall
    if (extremeRainfall) {
        document.getElementById('extreme-rainfall-title').textContent = cleanChartTitle(extremeRainfall.title || 'Extreme Daily Rainfall Events');
        document.getElementById('extreme-rainfall-summary').innerHTML = '';
        await renderPlotlyChart('extreme-rainfall-plot', extremeRainfall);
        document.getElementById('extreme-rainfall-interpretation').textContent = extremeRainfall.interpretation || '';
    }

    // Render Extreme Tmax
    if (extremeTmax) {
        document.getElementById('extreme-tmax-title').textContent = cleanChartTitle(extremeTmax.title || 'Extreme Daily Maximum Temperature');
        document.getElementById('extreme-tmax-summary').innerHTML = '';
        await renderPlotlyChart('extreme-tmax-plot', extremeTmax);
        document.getElementById('extreme-tmax-interpretation').textContent = extremeTmax.interpretation || '';
    }

    // Render Extreme Tmin
    if (extremeTmin) {
        document.getElementById('extreme-tmin-title').textContent = cleanChartTitle(extremeTmin.title || 'Extreme Daily Minimum Temperature');
        document.getElementById('extreme-tmin-summary').innerHTML = '';
        await renderPlotlyChart('extreme-tmin-plot', extremeTmin);
        document.getElementById('extreme-tmin-interpretation').textContent = extremeTmin.interpretation || '';
    }

    // Update extreme events header summary
    updateExtremeHeaderSummary([extremeRainfall, extremeTmax, extremeTmin].filter(Boolean));
}

function renderExtremeSummary(containerId, summary) {
    const container = document.getElementById(containerId);
    container.innerHTML = '';

    const titles = {
        'extreme-rainfall-summary': 'Highest Rainfall Event',
        'extreme-tmax-summary': 'Highest Tmax Event',
        'extreme-tmin-summary': 'Lowest Tmin Event'
    };
    const title = titles[containerId] || 'Extreme Event';

    const formatValueWithUnit = (value, unit = '') => {
        const displayValue = value !== undefined && value !== null ? value : 'N/A';
        if (!unit) return displayValue;
        return unit === '\u00b0C' ? `${displayValue}${unit}` : `${displayValue} ${unit}`;
    };

    const createExtremeKpiCard = (item) => `
        <div class="extreme-kpi-card">
            <div class="extreme-kpi-header">
                <span class="extreme-kpi-icon">&#128200;</span>
                <span class="extreme-kpi-title">${title}</span>
            </div>
            <div class="extreme-kpi-meta">
                <span>Dzongkhag: <strong>${item.district || 'N/A'}</strong></span>
                <span class="divider"></span>
                <span>Value: <strong>${formatValueWithUnit(item.value, item.unit)}</strong></span>
            </div>
            <div class="extreme-kpi-date">Date: <strong>${item.date || 'N/A'}</strong></div>
        </div>
    `;

    if (Array.isArray(summary)) {
        summary.forEach(item => {
            container.innerHTML += createExtremeKpiCard(item);
        });
    } else if (typeof summary === 'object' && summary !== null) {
        container.innerHTML += createExtremeKpiCard(summary);
    }
}

function formatExtremeSummary(chart) {
    const summary = chart.summary || {};

    return {
        district: summary.district || 'N/A',
        value: summary.value !== undefined && summary.value !== null ? summary.value : 'N/A',
        unit: summary.unit || '',
        date: summary.date || 'N/A'
    };
}

function updateExtremeHeaderSummary(charts) {
    const chartList = Array.isArray(charts) ? charts : Array.from(arguments).filter(Boolean);

    const rainfallChart = chartList.find(c =>
        (c.chart_id || '').toLowerCase().includes('rainfall') ||
        (c.variable || '').toLowerCase().includes('rainfall')
    );

    const tmaxChart = chartList.find(c =>
        (c.chart_id || '').toLowerCase().includes('tmax') ||
        (c.variable || '').toLowerCase().includes('maximum')
    );

    const tminChart = chartList.find(c =>
        (c.chart_id || '').toLowerCase().includes('tmin') ||
        (c.variable || '').toLowerCase().includes('minimum')
    );

    const rainfall = formatExtremeSummary(rainfallChart || {});
    const tmax = formatExtremeSummary(tmaxChart || {});
    const tmin = formatExtremeSummary(tminChart || {});

    const summaryBox = document.getElementById('extreme-summary-cards');
    if (!summaryBox) return;

    summaryBox.innerHTML = `
        <div class="extreme-summary-card">
            <span>Highest Rainfall Event</span>
            <strong>${rainfall.value} ${rainfall.unit}</strong>
            <small>${rainfall.district} &bull; ${rainfall.date}</small>
        </div>
        <div class="extreme-summary-card">
            <span>Highest Tmax Event</span>
            <strong>${tmax.value}${tmax.unit}</strong>
            <small>${tmax.district} &bull; ${tmax.date}</small>
        </div>
        <div class="extreme-summary-card">
            <span>Lowest Tmin Event</span>
            <strong>${tmin.value}${tmin.unit}</strong>
            <small>${tmin.district} &bull; ${tmin.date}</small>
        </div>
    `;
    summaryBox.style.display = 'grid';
}

// ============================================
// UTILITY FUNCTIONS
// ============================================

function clearPlots(plotIds) {
    plotIds.forEach(id => {
        const element = document.getElementById(`${id}-plot`);
        if (element) {
            element.innerHTML = '';
            delete element.dataset.plot;

            const card = element.closest('.graph-card');
            if (card) {
                delete card.__chartPayload;
                delete card.dataset.inViewport;
                delete card.dataset.hasAnimatedInViewport;
                delete card.dataset.needsSecondResize;
            }
        }
        const kpiContainer = document.getElementById(`${id}-kpis`);
        if (kpiContainer) {
            kpiContainer.innerHTML = '';
        }
    });
}

console.log('Dashboard script loaded successfully');
