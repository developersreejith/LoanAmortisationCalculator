// Loan Calculator Core Logic

class LoanCalculator {
    constructor() {
        this.principal = 0;
        this.rateAnnual = 0;
        this.tenureYears = 0;
        this.extraPayments = [];
    }

    // Calculate EMI using standard formula
    calculateEMI(principal, rateAnnual, tenureMonths) {
        const rateMonthly = rateAnnual / (12 * 100);
        if (rateMonthly === 0) {
            return principal / tenureMonths;
        }
        
        const emi = principal * rateMonthly * Math.pow(1 + rateMonthly, tenureMonths) / 
                    (Math.pow(1 + rateMonthly, tenureMonths) - 1);
        return emi;
    }

    // Calculate loan schedule with extra payments
    calculateSchedule(principal, rateAnnual, emi, extraPaymentSchedule = []) {
        const rateMonthly = rateAnnual / (12 * 100);
        let balance = principal;
        let month = 0;
        const schedule = [];
        
        while (balance > 0 && month < 1000) {
            month++;
            const interest = balance * rateMonthly;
            
            // Get extra payment for this month
            const extraPayment = this.getExtraPaymentForMonth(month, extraPaymentSchedule);
            const totalPayment = emi + extraPayment;
            
            // Calculate principal payment
            let principalPaid;
            let actualPayment;
            
            // Treat a remainder under 1 paisa as paid off (floating-point rounding would otherwise add an extra month)
            if (balance + interest < totalPayment + 0.01) {
                principalPaid = balance;
                actualPayment = balance + interest;
            } else {
                principalPaid = totalPayment - interest;
                actualPayment = totalPayment;
            }
            
            balance -= principalPaid;
            
            schedule.push({
                month: month,
                openingBalance: balance + principalPaid,
                emi: emi,
                extraPayment: extraPayment,
                totalPayment: actualPayment,
                interest: interest,
                principal: principalPaid,
                closingBalance: Math.max(0, balance)
            });
            
            if (balance <= 0) break;
        }
        
        return schedule;
    }

    // Get extra payment for a specific month
    getExtraPaymentForMonth(month, schedule) {
        let total = 0;
        for (const period of schedule) {
            if (month >= period.startMonth && month <= period.endMonth) {
                total += period.amount;
            }
        }
        return total;
    }

    // Convert monthly schedule to yearly summary
    getYearlySummary(schedule) {
        const yearly = {};
        
        for (const payment of schedule) {
            const year = Math.ceil(payment.month / 12);
            
            if (!yearly[year]) {
                yearly[year] = {
                    year: year,
                    months: 0,
                    totalPayment: 0,
                    totalInterest: 0,
                    totalPrincipal: 0,
                    totalExtra: 0,
                    openingBalance: payment.openingBalance,
                    closingBalance: payment.closingBalance
                };
            }
            
            yearly[year].months++;
            yearly[year].totalPayment += payment.totalPayment;
            yearly[year].totalInterest += payment.interest;
            yearly[year].totalPrincipal += payment.principal;
            yearly[year].totalExtra += payment.extraPayment;
            yearly[year].closingBalance = payment.closingBalance;
        }
        
        return Object.values(yearly);
    }

    // Calculate complete loan analysis
    analyze(principal, rateAnnual, tenureYears, extraPaymentSchedule = []) {
        this.principal = principal;
        this.rateAnnual = rateAnnual;
        this.tenureYears = tenureYears;
        this.extraPayments = extraPaymentSchedule;

        const tenureMonths = tenureYears * 12;
        const standardEMI = this.calculateEMI(principal, rateAnnual, tenureMonths);
        
        // Calculate standard loan
        const standardSchedule = this.calculateSchedule(principal, rateAnnual, standardEMI, []);
        const standardTotal = standardSchedule.reduce((sum, p) => sum + p.totalPayment, 0);
        const standardInterest = standardSchedule.reduce((sum, p) => sum + p.interest, 0);
        const standardDuration = standardSchedule.length;
        
        // Calculate loan with extra payments
        const proposedSchedule = this.calculateSchedule(principal, rateAnnual, standardEMI, extraPaymentSchedule);
        const proposedTotal = proposedSchedule.reduce((sum, p) => sum + p.totalPayment, 0);
        const proposedInterest = proposedSchedule.reduce((sum, p) => sum + p.interest, 0);
        const proposedDuration = proposedSchedule.length;
        const totalExtraPaid = proposedSchedule.reduce((sum, p) => sum + p.extraPayment, 0);
        
        // Calculate average EMI with extra payments
        const avgEMI = proposedTotal / proposedDuration;
        
        // Calculate savings
        const timeSavedMonths = standardDuration - proposedDuration;
        const timeSavedYears = Math.floor(timeSavedMonths / 12);
        const timeSavedRemainingMonths = timeSavedMonths % 12;
        const interestSaved = standardInterest - proposedInterest;
        const totalSaved = standardTotal - proposedTotal;
        
        return {
            standard: {
                emi: standardEMI,
                duration: standardDuration,
                durationYears: Math.floor(standardDuration / 12),
                durationMonths: standardDuration % 12,
                totalPaid: standardTotal,
                totalInterest: standardInterest,
                schedule: standardSchedule,
                yearly: this.getYearlySummary(standardSchedule)
            },
            proposed: {
                emi: standardEMI,
                avgEMI: avgEMI,
                duration: proposedDuration,
                durationYears: Math.floor(proposedDuration / 12),
                durationMonths: proposedDuration % 12,
                totalPaid: proposedTotal,
                totalInterest: proposedInterest,
                totalExtra: totalExtraPaid,
                schedule: proposedSchedule,
                yearly: this.getYearlySummary(proposedSchedule)
            },
            savings: {
                timeSavedMonths: timeSavedMonths,
                timeSavedYears: timeSavedYears,
                timeSavedRemainingMonths: timeSavedRemainingMonths,
                interestSaved: interestSaved,
                totalSaved: totalSaved,
                returnOnExtra: totalExtraPaid > 0 ? (interestSaved / totalExtraPaid * 100) : 0
            }
        };
    }
}

// Utility Functions
const formatCurrency = (amount) => {
    return '₹' + amount.toLocaleString('en-IN', { 
        maximumFractionDigits: 0,
        minimumFractionDigits: 0
    });
};

const formatCurrencyDetailed = (amount) => {
    return '₹' + amount.toLocaleString('en-IN', { 
        maximumFractionDigits: 2,
        minimumFractionDigits: 2
    });
};

const parseCurrency = (value) => {
    return parseFloat(value.toString().replace(/[^0-9.-]+/g, '')) || 0;
};

// Export calculator instance
const calculator = new LoanCalculator();


// ==================== Application Logic & UI ====================

// Application State
let currentResults = null;
let customSchedule = [];
let lastInputs = null;          // the inputs behind the results on screen
let showAllMonths = false;
let balanceGeom = null;         // balance chart geometry, used by the hover cursor
let balanceCursorMonth = null;
let focusBeforeModal = null;

// DOM Elements
const loanAmountInput = document.getElementById('loanAmount');
const interestRateInput = document.getElementById('interestRate');
const loanTenureInput = document.getElementById('loanTenure');
const extraMonthlyInput = document.getElementById('extraMonthly');
const extraDurationInput = document.getElementById('extraDuration');
const calculateBtn = document.getElementById('calculateBtn');
const resetBtn = document.getElementById('resetBtn');
const themeToggle = document.getElementById('themeToggle');
const resultsSection = document.getElementById('results');
const stalePill = document.getElementById('stalePill');
const loanAmountWords = document.getElementById('loanAmountWords');

// Tab elements
const tabBtns = document.querySelectorAll('.tab-btn');
const fixedTab = document.getElementById('fixedTab');
const customTab = document.getElementById('customTab');

// Custom schedule elements
const scheduleList = document.getElementById('scheduleList');
const addScheduleBtn = document.getElementById('addScheduleBtn');
const scheduleModal = document.getElementById('scheduleModal');
const closeModal = document.getElementById('closeModal');
const modalCancel = document.getElementById('modalCancel');
const modalAdd = document.getElementById('modalAdd');

// View toggle elements
const toggleBtns = document.querySelectorAll('.toggle-btn');
const summaryView = document.getElementById('summaryView');
const yearlyView = document.getElementById('yearlyView');
const monthlyView = document.getElementById('monthlyView');

// Chart elements
const balanceChart = document.getElementById('balanceChart');
const balanceTable = document.getElementById('balanceTable');
const balanceTableToggle = document.getElementById('balanceTableToggle');
const vizTooltip = document.getElementById('vizTooltip');

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    // Format currency inputs on blur
    loanAmountInput.addEventListener('blur', formatCurrencyInput);
    extraMonthlyInput.addEventListener('blur', formatCurrencyInput);

    // Remove formatting on focus
    loanAmountInput.addEventListener('focus', removeCurrencyFormat);
    extraMonthlyInput.addEventListener('focus', removeCurrencyFormat);

    // Show the loan amount in lakh / crore while typing
    loanAmountInput.addEventListener('input', updateAmountWords);

    // Editing any input makes the results on screen out of date
    [loanAmountInput, interestRateInput, loanTenureInput, extraMonthlyInput, extraDurationInput].forEach(input => {
        input.addEventListener('input', () => setStale(true));
    });

    // Enter in any field calculates
    document.querySelector('.inputs').addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && e.target.matches('input')) {
            e.preventDefault();
            e.target.blur();
            calculateFromButton();
        }
    });

    // Tab switching
    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            if (btn.classList.contains('active')) return;
            switchTab(btn.dataset.tab);
            setStale(true);
        });
    });

    // View toggle
    toggleBtns.forEach(btn => {
        btn.addEventListener('click', () => switchView(btn.dataset.view));
    });

    // Calculate button
    calculateBtn.addEventListener('click', calculateFromButton);

    // Reset button
    resetBtn.addEventListener('click', reset);

    // Light / dark theme
    themeToggle.addEventListener('click', toggleTheme);
    const darkQuery = window.matchMedia('(prefers-color-scheme: dark)');
    if (darkQuery.addEventListener) darkQuery.addEventListener('change', syncThemeToggle);
    syncThemeToggle();

    // Custom schedule modal
    addScheduleBtn.addEventListener('click', () => openScheduleModal());
    closeModal.addEventListener('click', () => closeScheduleModal());
    modalCancel.addEventListener('click', () => closeScheduleModal());
    modalAdd.addEventListener('click', () => addSchedulePeriod());

    // Close modal on backdrop click or Escape; Enter adds the period
    scheduleModal.addEventListener('click', (e) => {
        if (e.target === scheduleModal) closeScheduleModal();
    });
    scheduleModal.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && e.target.matches('input')) {
            e.preventDefault();
            addSchedulePeriod();
        }
    });
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && scheduleModal.classList.contains('active')) closeScheduleModal();
    });

    // Charts
    balanceTableToggle.addEventListener('click', toggleBalanceTable);
    setupBalanceChartInteraction();
    setupMoneyBarTooltips();
    if ('ResizeObserver' in window) {
        new ResizeObserver(() => renderBalanceChart()).observe(balanceChart);
    } else {
        window.addEventListener('resize', renderBalanceChart);
    }
    // Re-measure chart labels once the web font has loaded
    if (document.fonts) document.fonts.ready.then(() => renderBalanceChart());
    window.addEventListener('scroll', hideBalanceCursor, { passive: true });
    document.addEventListener('pointerdown', (e) => {
        if (!e.target.closest('.balance-chart, .seg')) hideBalanceCursor();
    });

    renderCustomSchedule();
    updateAmountWords();

    // Initial calculation
    calculate();
});

// Tab Switching
function switchTab(tabName) {
    tabBtns.forEach(btn => {
        const active = btn.dataset.tab === tabName;
        btn.classList.toggle('active', active);
        btn.setAttribute('aria-pressed', active);
    });

    fixedTab.classList.toggle('active', tabName === 'fixed');
    customTab.classList.toggle('active', tabName !== 'fixed');
}

// View Switching
function switchView(viewName) {
    toggleBtns.forEach(btn => {
        const active = btn.dataset.view === viewName;
        btn.classList.toggle('active', active);
        btn.setAttribute('aria-pressed', active);
    });

    summaryView.classList.remove('active');
    yearlyView.classList.remove('active');
    monthlyView.classList.remove('active');

    document.getElementById(viewName + 'View').classList.add('active');
}

// Currency Input Formatting
function formatCurrencyInput(e) {
    const value = parseCurrency(e.target.value);
    e.target.value = value.toLocaleString('en-IN');
}

function removeCurrencyFormat(e) {
    const value = parseCurrency(e.target.value);
    e.target.value = value;
}

// ---------- Plain-English formatting ----------

// 167 -> "13 years 11 months" (short: "13 yrs 11 mos"); 360 -> "30 years"
function formatDuration(totalMonths, short = false) {
    const months = Math.max(0, Math.round(totalMonths));
    const years = Math.floor(months / 12);
    const rest = months % 12;
    const unit = (n, word) => `${n} ${word}${n === 1 ? '' : 's'}`;
    const [yearWord, monthWord] = short ? ['yr', 'mo'] : ['year', 'month'];
    if (years && rest) return `${unit(years, yearWord)} ${unit(rest, monthWord)}`;
    if (years) return unit(years, yearWord);
    return rest ? unit(rest, monthWord) : '0 months';
}

// 6000000 -> "60 lakh", 12500000 -> "1.25 crore"; null below one lakh
function amountInWords(amount) {
    const trim = n => String(parseFloat(n.toFixed(2)));
    if (amount >= 1e7) return `${trim(amount / 1e7)} crore`;
    if (amount >= 1e5) return `${trim(amount / 1e5)} lakh`;
    return null;
}

// For sentences: "₹56.77 lakh", or "₹16,036" for smaller amounts
function formatMoneyWords(amount) {
    const words = amountInWords(amount);
    return words ? `₹${words}` : formatCurrency(amount);
}

// Axis labels: ₹20L, ₹1.5Cr, ₹50K
function formatCompact(amount) {
    if (amount >= 1e7) return `₹${parseFloat((amount / 1e7).toFixed(2))}Cr`;
    if (amount >= 1e5) return `₹${parseFloat((amount / 1e5).toFixed(1))}L`;
    if (amount >= 1e3) return `₹${parseFloat((amount / 1e3).toFixed(1))}K`;
    return `₹${Math.round(amount)}`;
}

function formatBalance(amount) {
    return amount < 0.5 ? 'Paid off' : formatCurrency(amount);
}

function setText(id, text) {
    document.getElementById(id).textContent = text;
}

// Fill an element with text; { strong: '...' } parts are wrapped in <strong>
function setRichText(element, parts) {
    element.replaceChildren(...parts.map(part => {
        if (typeof part === 'string') return document.createTextNode(part);
        const strong = document.createElement('strong');
        strong.textContent = part.strong;
        return strong;
    }));
}

function prefersReducedMotion() {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

function updateAmountWords() {
    const words = amountInWords(parseCurrency(loanAmountInput.value));
    loanAmountWords.textContent = words ? ` · ₹${words}` : '';
}

// Dim the results and nudge the Calculate button when inputs have changed
function setStale(stale) {
    resultsSection.classList.toggle('is-stale', stale);
    stalePill.hidden = !stale;
    calculateBtn.classList.toggle('needs-update', stale);
}

// Calculate Loan
function calculateFromButton() {
    if (!calculate()) return;
    // In the one-column layout the results sit below the inputs
    if (window.matchMedia('(max-width: 1079px)').matches) {
        resultsSection.scrollIntoView({ behavior: prefersReducedMotion() ? 'auto' : 'smooth', block: 'start' });
    }
}

function calculate() {
    const principal = parseCurrency(loanAmountInput.value);
    const rate = parseFloat(interestRateInput.value);
    const tenure = parseInt(loanTenureInput.value);

    if (!(principal > 0) || !(rate > 0) || !(tenure > 0)) {
        alert('Please fill in all basic loan details');
        return false;
    }

    // Get extra payment schedule
    let extraPaymentSchedule = [];
    let plan = null;

    const activeTab = document.querySelector('.tab-btn.active').dataset.tab;

    if (activeTab === 'fixed') {
        const extraMonthly = parseCurrency(extraMonthlyInput.value);
        const extraDuration = parseInt(extraDurationInput.value);

        if (extraMonthly > 0) {
            const endMonth = extraDuration > 0 ? extraDuration : tenure * 12;
            extraPaymentSchedule.push({
                startMonth: 1,
                endMonth: endMonth,
                amount: extraMonthly
            });
            plan = { type: 'fixed', amount: extraMonthly, months: extraDuration > 0 ? extraDuration : 0 };
        }
    } else {
        extraPaymentSchedule = customSchedule;
        if (customSchedule.length) plan = { type: 'custom' };
    }

    // Calculate
    currentResults = calculator.analyze(principal, rate, tenure, extraPaymentSchedule);
    lastInputs = { principal, rate, tenure, plan };
    showAllMonths = false;

    // Update UI
    setStale(false);
    updateSummaryCards();
    updateComparisonChart();
    renderBalanceChart();
    updateBalanceTable();
    updateBreakdownViews();
    return true;
}

// Headline + key numbers
function updateSummaryCards() {
    const { standard, proposed, savings } = currentResults;
    const { principal, rate, tenure, plan } = lastInputs;
    const hasExtra = proposed.totalExtra > 0;
    const interestSaved = Math.max(0, savings.interestSaved);
    const monthsSaved = Math.max(0, savings.timeSavedMonths);

    setText('standardEMI', formatCurrency(standard.emi));
    setText('heroMeta', `for a ${formatMoneyWords(principal)} loan at ${rate}% a year over ${formatDuration(tenure * 12)}`);

    let insight;
    if (hasExtra) {
        insight = plan.type === 'fixed'
            ? ['By paying ', { strong: formatCurrency(plan.amount) }, ` extra every month${plan.months ? ` for the first ${formatDuration(plan.months)}` : ''}, you save `]
            : ['With your custom extra payment plan, you save '];
        insight.push({ strong: formatMoneyWords(interestSaved) }, ' in interest');
        if (monthsSaved > 0) insight.push(' and become loan-free ', { strong: formatDuration(monthsSaved) }, ' sooner.');
        else insight.push('.');
    } else if (plan) {
        insight = ['Your extra payments start after the loan is already paid off, so they make no difference. Try earlier months.'];
    } else {
        insight = ['Tip: add an extra monthly payment under ', { strong: 'Extra payments' }, ' to see how much interest and time you could save.'];
    }
    setRichText(document.getElementById('heroInsight'), insight);

    setText('totalSavings', formatCurrency(interestSaved));
    setText('totalSavingsDesc', hasExtra ? 'Less interest than paying only the EMI' : 'Add extra payments to start saving');
    setText('timeSaved', formatDuration(monthsSaved, true));
    setText('timeSavedDesc', monthsSaved > 0
        ? `Loan ends in ${formatDuration(proposed.duration, true)} instead of ${formatDuration(standard.duration, true)}`
        : `Your loan runs the full ${formatDuration(standard.duration, true)}`);
    setText('proposedEMI', formatCurrency(proposed.avgEMI));
    setText('proposedEMIDesc', hasExtra
        ? `EMI plus extra, averaged over ${formatDuration(proposed.duration, true)}`
        : 'Same as your EMI, as there are no extra payments');
}

// ---------- Where your money goes (stacked bars) ----------

function updateComparisonChart() {
    const { standard, proposed } = currentResults;
    const { principal } = lastInputs;
    const hasExtra = proposed.totalExtra > 0;
    const largestTotal = Math.max(standard.totalPaid, proposed.totalPaid);

    [['standard', standard], ['proposed', proposed]].forEach(([key, scenario]) => {
        const interest = Math.max(0, scenario.totalInterest);
        const bar = document.getElementById(key + 'Bar');
        const [principalSeg, interestSeg] = bar.children;

        // Both bars share one scale, so the interest part visibly shrinks
        bar.style.width = (scenario.totalPaid / largestTotal * 100) + '%';
        principalSeg.style.flexGrow = principal;
        interestSeg.style.flexGrow = interest;
        setSegmentData(principalSeg, 'Loan amount', principal, scenario.totalPaid);
        setSegmentData(interestSeg, 'Interest', interest, scenario.totalPaid);

        setText(key + 'Total', formatCurrency(scenario.totalPaid));
        document.getElementById(key + 'Note').replaceChildren(
            noteItem('swatch-principal', 'Loan amount', principal),
            noteItem('swatch-interest', 'Interest', interest)
        );
    });

    setText('standardDuration', formatDuration(standard.duration));
    setText('proposedDuration', hasExtra ? formatDuration(proposed.duration) : 'no extra payments added');
}

function setSegmentData(seg, label, value, total) {
    seg.dataset.label = label;
    seg.dataset.value = value;
    seg.dataset.share = total > 0 ? value / total : 0;
    seg.setAttribute('aria-label', `${seg.parentElement.dataset.scenario}: ${label} ${formatCurrency(value)}`);
}

function noteItem(swatchClass, label, value) {
    const item = document.createElement('span');
    item.className = 'note-item';
    const swatch = document.createElement('span');
    swatch.className = 'swatch ' + swatchClass;
    const amount = document.createElement('strong');
    amount.textContent = formatCurrency(value);
    item.append(swatch, `${label} `, amount);
    return item;
}

function setupMoneyBarTooltips() {
    document.querySelectorAll('.money-bar .seg').forEach(seg => {
        seg.addEventListener('pointermove', (e) => showSegmentTooltip(seg, e.clientX, e.clientY));
        seg.addEventListener('pointerleave', hideTooltip);
        seg.addEventListener('focus', () => {
            const rect = seg.getBoundingClientRect();
            showSegmentTooltip(seg, rect.left + rect.width / 2, rect.top);
        });
        seg.addEventListener('blur', hideTooltip);
    });
}

function showSegmentTooltip(seg, x, y) {
    if (!seg.dataset.label) return;
    const isInterest = seg.classList.contains('seg-interest');
    const share = Math.round(parseFloat(seg.dataset.share) * 100);
    showTooltip([
        tooltipHead(seg.parentElement.dataset.scenario),
        tooltipRow(isInterest ? 'var(--viz-interest)' : 'var(--viz-principal)', formatCurrency(parseFloat(seg.dataset.value)), seg.dataset.label),
        tooltipNote(`${share}% of everything you pay`)
    ], x, y);
}

// ---------- Tooltip ----------

function tooltipHead(text) {
    const head = document.createElement('div');
    head.className = 'tt-head';
    head.textContent = text;
    return head;
}

function tooltipRow(color, value, name) {
    const row = document.createElement('div');
    row.className = 'tt-row';
    const key = document.createElement('span');
    key.className = 'tt-key';
    key.style.background = color;
    const valueEl = document.createElement('span');
    valueEl.className = 'tt-value';
    valueEl.textContent = value;
    const nameEl = document.createElement('span');
    nameEl.className = 'tt-name';
    nameEl.textContent = name;
    row.append(key, valueEl, nameEl);
    return row;
}

function tooltipNote(text) {
    const note = document.createElement('div');
    note.className = 'tt-note';
    note.textContent = text;
    return note;
}

function showTooltip(children, x, y) {
    vizTooltip.replaceChildren(...children);
    vizTooltip.hidden = false;
    const gap = 14;
    const edge = 8;
    const width = vizTooltip.offsetWidth;
    const height = vizTooltip.offsetHeight;
    let left = x + gap;
    if (left + width > window.innerWidth - edge) left = x - gap - width;
    let top = y - height - gap;
    if (top < edge) top = y + gap;
    vizTooltip.style.left = Math.max(edge, left) + 'px';
    vizTooltip.style.top = top + 'px';
}

function hideTooltip() {
    vizTooltip.hidden = true;
}

// ---------- Balance over time (line chart) ----------

// Balance owed after each month; index 0 is the start of the loan
function balancePoints(schedule, principal) {
    return [principal, ...schedule.map(p => p.closingBalance)];
}

function balanceAt(points, month) {
    return month < points.length ? points[month] : 0;
}

// A round axis step: 1, 2, 2.5 or 5 times a power of ten
function niceStep(max, targetTicks) {
    const raw = max / targetTicks;
    const magnitude = Math.pow(10, Math.floor(Math.log10(raw)));
    const normalized = raw / magnitude;
    const nice = normalized <= 1 ? 1 : normalized <= 2 ? 2 : normalized <= 2.5 ? 2.5 : normalized <= 5 ? 5 : 10;
    return nice * magnitude;
}

let measureContext = null;
function measureText(text, font) {
    if (!measureContext) measureContext = document.createElement('canvas').getContext('2d');
    measureContext.font = `${font} Inter, system-ui, sans-serif`;
    return measureContext.measureText(text).width;
}

function renderBalanceChart() {
    if (!currentResults) return;
    const width = balanceChart.clientWidth;
    const height = balanceChart.clientHeight;
    if (!width || !height) return;

    const { standard, proposed } = currentResults;
    const { principal } = lastInputs;
    const hasExtra = proposed.totalExtra > 0;
    const emiPoints = balancePoints(standard.schedule, principal);
    const extraPoints = balancePoints(proposed.schedule, principal);

    const yStep = niceStep(principal, 4);
    const yMax = Math.ceil(principal / yStep) * yStep;
    const yTicks = [];
    for (let v = 0; v <= yMax + yStep / 2; v += yStep) yTicks.push(v);
    const tickLabels = yTicks.map(v => (v === 0 ? '₹0' : formatCompact(v)));
    const labelWidth = Math.max(...tickLabels.map(t => measureText(t, '12px')));

    const margin = { top: 12, right: 12, bottom: 30, left: Math.ceil(labelWidth) + 14 };
    const plotW = width - margin.left - margin.right;
    const plotH = height - margin.top - margin.bottom;
    const xMax = Math.max(standard.duration, proposed.duration, 1);
    const x = month => margin.left + (month / xMax) * plotW;
    const y = value => margin.top + plotH - (value / yMax) * plotH;
    const baseY = Math.round(y(0)) + 0.5;
    const path = points => points.map((v, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)} ${y(v).toFixed(1)}`).join('');

    let svg = `<svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" aria-hidden="true">`;

    // Gridlines and axis labels
    svg += '<g class="viz-grid">';
    yTicks.forEach(v => {
        if (v === 0) return;
        const gy = Math.round(y(v)) + 0.5;
        svg += `<line x1="${margin.left}" x2="${width - margin.right}" y1="${gy}" y2="${gy}"/>`;
    });
    svg += '</g>';
    yTicks.forEach((v, i) => {
        svg += `<text class="viz-tick" x="${margin.left - 10}" y="${y(v)}" text-anchor="end" dominant-baseline="middle">${tickLabels[i]}</text>`;
    });
    const years = xMax / 12;
    const yearStep = [1, 2, 5, 10, 20].find(step => plotW / (years / step) >= 64) || 20;
    for (let yr = 0; yr * 12 <= xMax; yr += yearStep) {
        const tx = x(yr * 12);
        const anchor = yr === 0 ? 'start' : (tx > width - margin.right - 24 ? 'end' : 'middle');
        svg += `<text class="viz-tick" x="${tx}" y="${height - 8}" text-anchor="${anchor}">${yr === 0 ? 'Start' : `${yr} yr${yr === 1 ? '' : 's'}`}</text>`;
    }
    svg += `<line class="viz-baseline" x1="${margin.left}" x2="${width - margin.right}" y1="${baseY}" y2="${baseY}"/>`;

    // Lines: EMI only is the grey baseline, the extra-payment plan is the highlighted story
    if (hasExtra) {
        svg += `<path class="viz-area" d="${path(extraPoints)}L${x(extraPoints.length - 1).toFixed(1)} ${baseY}L${x(0)} ${baseY}Z"/>`;
    }
    svg += `<path class="viz-line viz-line-emi" d="${path(emiPoints)}"/>`;
    if (hasExtra) svg += `<path class="viz-line viz-line-extra" d="${path(extraPoints)}"/>`;

    // Pay-off markers
    svg += `<circle class="viz-dot viz-dot-emi" cx="${x(standard.duration)}" cy="${baseY}" r="4"/>`;
    if (hasExtra) {
        svg += `<circle class="viz-dot viz-dot-extra" cx="${x(proposed.duration)}" cy="${baseY}" r="4"/>`;
        // Label the plan's pay-off point only where it clears the grey line
        const label = `Paid off in ${formatDuration(proposed.duration, true)}`;
        const labelX = x(proposed.duration) + 10;
        const labelRight = labelX + measureText(label, '600 12px');
        const monthAtLabelEnd = Math.min(xMax, Math.ceil(((labelRight - margin.left) / plotW) * xMax));
        if (labelRight <= width - margin.right && y(balanceAt(emiPoints, monthAtLabelEnd)) < baseY - 30) {
            svg += `<text class="viz-end-label" x="${labelX}" y="${baseY - 10}">${label}</text>`;
        }
    }

    // Hover cursor
    svg += `<g class="viz-cursor" style="display:none"><line class="viz-crosshair" y1="${margin.top}" y2="${baseY}"/>`;
    svg += `<circle class="viz-dot viz-dot-emi" r="4"/>${hasExtra ? '<circle class="viz-dot viz-dot-extra" r="4"/>' : ''}</g>`;
    svg += '</svg>';

    balanceChart.innerHTML = svg;
    balanceGeom = { margin, plotW, xMax, x, y, emiPoints, extraPoints, hasExtra };

    const summary = hasExtra
        ? `Loan balance over time. With EMI only the loan is paid off in ${formatDuration(standard.duration)}; with extra payments in ${formatDuration(proposed.duration)}.`
        : `Loan balance over time. With EMI only the loan is paid off in ${formatDuration(standard.duration)}.`;
    balanceChart.setAttribute('aria-label', `${summary} Use the left and right arrow keys to read the balance year by year, or choose View as table.`);
    setText('balanceSubtitle', hasExtra
        ? 'The amount you still owe over time. Hover or tap the chart for exact figures.'
        : 'The amount you still owe over time with EMI only. Add extra payments to compare.');
    document.getElementById('balanceLegend').hidden = !hasExtra;
}

function setupBalanceChartInteraction() {
    const fromPointer = (e) => {
        if (!balanceGeom) return;
        const rect = balanceChart.getBoundingClientRect();
        const { margin, plotW, xMax } = balanceGeom;
        const month = Math.round(((e.clientX - rect.left - margin.left) / plotW) * xMax);
        showBalanceCursor(Math.min(xMax, Math.max(0, month)), e.clientX, e.clientY);
    };
    balanceChart.addEventListener('pointermove', fromPointer);
    balanceChart.addEventListener('pointerdown', fromPointer);
    balanceChart.addEventListener('pointerleave', (e) => {
        if (e.pointerType === 'mouse') hideBalanceCursor();
    });
    balanceChart.addEventListener('focus', () => {
        if (balanceGeom && balanceChart.matches(':focus-visible')) {
            showBalanceCursor(balanceCursorMonth ?? Math.min(12, balanceGeom.xMax));
        }
    });
    balanceChart.addEventListener('blur', hideBalanceCursor);
    balanceChart.addEventListener('keydown', (e) => {
        if (!balanceGeom) return;
        let month = balanceCursorMonth ?? 0;
        const step = e.shiftKey ? 1 : 12;
        if (e.key === 'ArrowRight') month += step;
        else if (e.key === 'ArrowLeft') month -= step;
        else if (e.key === 'Home') month = 0;
        else if (e.key === 'End') month = balanceGeom.xMax;
        else return;
        e.preventDefault();
        showBalanceCursor(Math.min(balanceGeom.xMax, Math.max(0, month)));
    });
}

function showBalanceCursor(month, clientX, clientY) {
    const cursor = balanceChart.querySelector('.viz-cursor');
    const g = balanceGeom;
    if (!cursor || !g) return;
    balanceCursorMonth = month;

    const cx = g.x(month);
    const emiValue = balanceAt(g.emiPoints, month);
    const extraValue = balanceAt(g.extraPoints, month);
    cursor.style.display = '';
    const line = cursor.querySelector('.viz-crosshair');
    line.setAttribute('x1', cx);
    line.setAttribute('x2', cx);
    const emiDot = cursor.querySelector('.viz-dot-emi');
    emiDot.setAttribute('cx', cx);
    emiDot.setAttribute('cy', g.y(emiValue));
    const extraDot = cursor.querySelector('.viz-dot-extra');
    if (extraDot) {
        extraDot.setAttribute('cx', cx);
        extraDot.setAttribute('cy', g.y(extraValue));
    }

    const rows = [tooltipHead(month === 0 ? 'At the start' : `After ${formatDuration(month)}`)];
    if (g.hasExtra) rows.push(tooltipRow('var(--viz-extra)', formatBalance(extraValue), 'With extra payments'));
    rows.push(tooltipRow('var(--viz-emi)', formatBalance(emiValue), 'EMI only'));

    if (clientX === undefined) {
        const rect = balanceChart.getBoundingClientRect();
        clientX = rect.left + cx;
        clientY = rect.top + g.margin.top + 8;
    }
    showTooltip(rows, clientX, clientY);
}

function hideBalanceCursor() {
    const cursor = balanceChart.querySelector('.viz-cursor');
    if (cursor) cursor.style.display = 'none';
    hideTooltip();
}

function toggleBalanceTable() {
    const showTable = balanceTable.hidden;
    balanceTable.hidden = !showTable;
    balanceChart.hidden = showTable;
    balanceTableToggle.textContent = showTable ? 'View as chart' : 'View as table';
    balanceTableToggle.setAttribute('aria-pressed', showTable);
}

// Table twin of the balance chart: balance left at the end of each year
function updateBalanceTable() {
    const { standard, proposed } = currentResults;
    const { principal } = lastInputs;
    const emiPoints = balancePoints(standard.schedule, principal);
    const extraPoints = balancePoints(proposed.schedule, principal);
    const years = Math.ceil(Math.max(standard.duration, proposed.duration) / 12);
    const tbody = document.getElementById('balanceTableBody');
    tbody.innerHTML = '';

    for (let yr = 0; yr <= years; yr++) {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${yr === 0 ? 'Start' : `Year ${yr}`}</td>
            <td class="col-extra">${formatBalance(balanceAt(extraPoints, yr * 12))}</td>
            <td>${formatBalance(balanceAt(emiPoints, yr * 12))}</td>
        `;
        tbody.appendChild(row);
    }
    balanceTable.classList.toggle('no-extra', !(proposed.totalExtra > 0));
}

// ---------- Detailed breakdown ----------

function updateBreakdownViews() {
    updateSummaryView();
    updateYearlyView();
    updateMonthlyView();
}

function updateSummaryView() {
    const { standard, proposed, savings } = currentResults;
    const hasExtra = proposed.totalExtra > 0;
    const monthsSaved = Math.max(0, savings.timeSavedMonths);
    const sameAsEmiOnly = 'No extra payments added yet, so this is the same as EMI only.';

    setText('summaryStandardDuration', formatDuration(standard.duration));
    setText('summaryProposedDuration', formatDuration(proposed.duration));
    setText('summaryStandardInterest', formatCurrency(standard.totalInterest));
    setText('summaryProposedInterest', formatCurrency(proposed.totalInterest));
    setText('summaryInterestSaved', formatCurrency(Math.max(0, savings.interestSaved)));
    setText('summaryTimeSaved', formatDuration(monthsSaved));

    setText('summaryProposedDurationDesc', hasExtra ? 'If you also pay the extra amounts you entered.' : sameAsEmiOnly);
    setText('summaryProposedInterestDesc', hasExtra ? 'Lower, because extra payments shrink your loan faster.' : sameAsEmiOnly);
    setText('summaryInterestSavedDesc', hasExtra
        ? 'The difference between the two interest amounts above.'
        : 'Add extra payments to see how much you can save.');
    let timeNote;
    if (monthsSaved > 0) timeNote = `That's ${monthsSaved} fewer monthly payment${monthsSaved === 1 ? '' : 's'} to make.`;
    else if (hasExtra) timeNote = 'Not enough extra yet to cut a full month off the loan.';
    else timeNote = 'Add extra payments to finish your loan sooner.';
    setText('summaryTimeSavedDesc', timeNote);
}

function updateYearlyView() {
    const { proposed } = currentResults;
    setText('yearlyCaption', proposed.totalExtra > 0
        ? 'How your loan changes each year, including your extra payments.'
        : 'How your loan changes each year when you pay only the EMI.');
    const tbody = document.getElementById('yearlyTableBody');
    tbody.innerHTML = '';

    proposed.yearly.forEach(year => {
        const partYear = year.months < 12 ? ` <span class="part-year">(${formatDuration(year.months)})</span>` : '';
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>Year ${year.year}${partYear}</td>
            <td>${formatCurrency(year.openingBalance)}</td>
            <td>${formatCurrency(year.totalPayment)}</td>
            <td>${formatCurrency(year.totalInterest)}</td>
            <td>${formatCurrency(year.totalPrincipal)}</td>
            <td>${formatCurrency(year.closingBalance)}</td>
        `;
        tbody.appendChild(row);
    });
}

function updateMonthlyView() {
    const { proposed } = currentResults;
    const total = proposed.schedule.length;
    setText('monthlyCaption', `Your repayment schedule, month by month (${formatDuration(total)} in total).`);
    const tbody = document.getElementById('monthlyTableBody');
    tbody.innerHTML = '';

    // Show the first 100 months unless the user asks for all of them
    const maxMonths = showAllMonths ? total : Math.min(total, 100);

    for (let i = 0; i < maxMonths; i++) {
        const payment = proposed.schedule[i];
        const extraCell = payment.extraPayment > 0
            ? `<td class="cell-extra">${formatCurrencyDetailed(payment.extraPayment)}</td>`
            : '<td class="cell-muted">—</td>';
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${payment.month}</td>
            <td>${formatCurrencyDetailed(payment.emi)}</td>
            ${extraCell}
            <td>${formatCurrencyDetailed(payment.interest)}</td>
            <td>${formatCurrencyDetailed(payment.principal)}</td>
            <td>${formatCurrencyDetailed(payment.closingBalance)}</td>
        `;
        tbody.appendChild(row);
    }

    if (total > maxMonths) {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td colspan="6" class="table-note">
                Showing the first ${maxMonths} of ${total} months.<button class="btn-link" type="button">Show all months</button>
            </td>
        `;
        row.querySelector('button').addEventListener('click', () => {
            showAllMonths = true;
            updateMonthlyView();
        });
        tbody.appendChild(row);
    }
}

// Custom Schedule Management
function openScheduleModal() {
    focusBeforeModal = document.activeElement;
    scheduleModal.classList.add('active');
    if (window.matchMedia('(pointer: fine)').matches) document.getElementById('modalStartMonth').focus();
}

function closeScheduleModal() {
    scheduleModal.classList.remove('active');
    if (focusBeforeModal && document.contains(focusBeforeModal)) focusBeforeModal.focus();
}

function addSchedulePeriod() {
    const startMonth = parseInt(document.getElementById('modalStartMonth').value);
    const endMonth = parseInt(document.getElementById('modalEndMonth').value);
    const amount = parseCurrency(document.getElementById('modalExtraAmount').value);

    if (!(startMonth > 0) || !(endMonth > 0) || !(amount > 0)) {
        alert('Please fill in all fields');
        return;
    }

    if (startMonth > endMonth) {
        alert('"From month" must be the same as or before "To month"');
        return;
    }

    customSchedule.push({
        startMonth: startMonth,
        endMonth: endMonth,
        amount: amount
    });

    renderCustomSchedule();
    closeScheduleModal();
    setStale(true);

    // Reset modal inputs
    document.getElementById('modalStartMonth').value = 1;
    document.getElementById('modalEndMonth').value = 12;
    document.getElementById('modalExtraAmount').value = 10000;
}

function renderCustomSchedule() {
    scheduleList.innerHTML = '';

    if (!customSchedule.length) {
        scheduleList.innerHTML = '<div class="schedule-empty">No extra payment periods yet.</div>';
        return;
    }

    customSchedule.forEach((item, index) => {
        const div = document.createElement('div');
        div.className = 'schedule-item';
        div.innerHTML = `
            <div class="schedule-info">
                <div class="schedule-range">Month ${item.startMonth} to ${item.endMonth}</div>
                <div class="schedule-amount">${formatCurrency(item.amount)} extra each month · ${formatDuration(item.endMonth - item.startMonth + 1)}</div>
            </div>
            <button class="schedule-remove" type="button" onclick="removeSchedule(${index})" aria-label="Remove month ${item.startMonth} to ${item.endMonth}">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
                    <line x1="18" y1="6" x2="6" y2="18"/>
                    <line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
            </button>
        `;
        scheduleList.appendChild(div);
    });
}

function removeSchedule(index) {
    customSchedule.splice(index, 1);
    renderCustomSchedule();
    setStale(true);
}

// Reset Function
function reset() {
    loanAmountInput.value = '60,00,000';
    interestRateInput.value = '7.75';
    loanTenureInput.value = '30';
    extraMonthlyInput.value = '0';
    extraDurationInput.value = '0';
    customSchedule = [];
    renderCustomSchedule();
    updateAmountWords();
    calculate();
}

// Light / dark theme: follows the device until the user picks one
function currentTheme() {
    const chosen = document.documentElement.dataset.theme;
    if (chosen === 'light' || chosen === 'dark') return chosen;
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

function toggleTheme() {
    const next = currentTheme() === 'dark' ? 'light' : 'dark';
    document.documentElement.dataset.theme = next;
    try {
        localStorage.setItem('loanCalcTheme', next);
    } catch (e) {}
    syncThemeToggle();
}

function syncThemeToggle() {
    const dark = currentTheme() === 'dark';
    const label = dark ? 'Switch to light theme' : 'Switch to dark theme';
    themeToggle.classList.toggle('is-dark', dark);
    themeToggle.setAttribute('aria-label', label);
    themeToggle.title = label;
}

// Make removeSchedule available globally
window.removeSchedule = removeSchedule;
