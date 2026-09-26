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

// DOM Elements
const loanAmountInput = document.getElementById('loanAmount');
const interestRateInput = document.getElementById('interestRate');
const loanTenureInput = document.getElementById('loanTenure');
const extraMonthlyInput = document.getElementById('extraMonthly');
const extraDurationInput = document.getElementById('extraDuration');
const calculateBtn = document.getElementById('calculateBtn');
const resetBtn = document.getElementById('resetBtn');

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

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    // Format currency inputs on blur
    loanAmountInput.addEventListener('blur', formatCurrencyInput);
    extraMonthlyInput.addEventListener('blur', formatCurrencyInput);
    
    // Remove formatting on focus
    loanAmountInput.addEventListener('focus', removeCurrencyFormat);
    extraMonthlyInput.addEventListener('focus', removeCurrencyFormat);
    
    // Tab switching
    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => switchTab(btn.dataset.tab));
    });
    
    // View toggle
    toggleBtns.forEach(btn => {
        btn.addEventListener('click', () => switchView(btn.dataset.view));
    });
    
    // Calculate button
    calculateBtn.addEventListener('click', calculate);
    
    // Reset button
    resetBtn.addEventListener('click', reset);
    
    // Custom schedule modal
    addScheduleBtn.addEventListener('click', () => openScheduleModal());
    closeModal.addEventListener('click', () => closeScheduleModal());
    modalCancel.addEventListener('click', () => closeScheduleModal());
    modalAdd.addEventListener('click', () => addSchedulePeriod());
    
    // Close modal on backdrop click
    scheduleModal.addEventListener('click', (e) => {
        if (e.target === scheduleModal) closeScheduleModal();
    });
    
    // Initial calculation
    calculate();
});

// Tab Switching
function switchTab(tabName) {
    tabBtns.forEach(btn => {
        if (btn.dataset.tab === tabName) {
            btn.classList.add('active');
        } else {
            btn.classList.remove('active');
        }
    });
    
    if (tabName === 'fixed') {
        fixedTab.classList.add('active');
        customTab.classList.remove('active');
    } else {
        fixedTab.classList.remove('active');
        customTab.classList.add('active');
    }
}

// View Switching
function switchView(viewName) {
    toggleBtns.forEach(btn => {
        if (btn.dataset.view === viewName) {
            btn.classList.add('active');
        } else {
            btn.classList.remove('active');
        }
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

// Calculate Loan
function calculate() {
    const principal = parseCurrency(loanAmountInput.value);
    const rate = parseFloat(interestRateInput.value);
    const tenure = parseInt(loanTenureInput.value);
    
    if (!principal || !rate || !tenure) {
        alert('Please fill in all basic loan details');
        return;
    }
    
    // Get extra payment schedule
    let extraPaymentSchedule = [];
    
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
        }
    } else {
        extraPaymentSchedule = customSchedule;
    }
    
    // Calculate
    currentResults = calculator.analyze(principal, rate, tenure, extraPaymentSchedule);
    
    // Update UI
    updateSummaryCards();
    updateComparisonChart();
    updateBreakdownViews();
}

// Update Summary Cards
function updateSummaryCards() {
    const { standard, proposed, savings } = currentResults;
    
    document.getElementById('standardEMI').textContent = formatCurrency(standard.emi);
    document.getElementById('proposedEMI').textContent = formatCurrency(proposed.avgEMI);
    document.getElementById('totalSavings').textContent = formatCurrency(savings.interestSaved);
    document.getElementById('timeSaved').textContent = 
        `${savings.timeSavedYears} yrs ${savings.timeSavedRemainingMonths} mo`;
}

// Update Comparison Chart
function updateComparisonChart() {
    const { standard, proposed, savings } = currentResults;
    
    // Update values
    document.getElementById('standardTotal').textContent = formatCurrency(standard.totalPaid);
    document.getElementById('proposedTotal').textContent = formatCurrency(proposed.totalPaid);
    document.getElementById('standardDuration').textContent = `${standard.duration} months`;
    document.getElementById('proposedDuration').textContent = `${proposed.duration} months`;
    
    // Update bar widths
    const standardBar = document.getElementById('standardBar');
    const proposedBar = document.getElementById('proposedBar');
    
    standardBar.style.width = '100%';
    const proposedPercentage = (proposed.duration / standard.duration) * 100;
    proposedBar.style.width = proposedPercentage + '%';
}

// Update Breakdown Views
function updateBreakdownViews() {
    updateSummaryView();
    updateYearlyView();
    updateMonthlyView();
}

// Update Summary View
function updateSummaryView() {
    const { standard, proposed, savings } = currentResults;
    
    document.getElementById('summaryStandardDuration').textContent = 
        `${standard.durationYears} years ${standard.durationMonths} months`;
    document.getElementById('summaryProposedDuration').textContent = 
        `${proposed.durationYears} years ${proposed.durationMonths} months`;
    document.getElementById('summaryStandardInterest').textContent = 
        formatCurrency(standard.totalInterest);
    document.getElementById('summaryProposedInterest').textContent = 
        formatCurrency(proposed.totalInterest);
    document.getElementById('summaryInterestSaved').textContent = 
        formatCurrency(savings.interestSaved);
    document.getElementById('summaryTimeSaved').textContent = 
        `${savings.timeSavedMonths} months`;
}

// Update Yearly View
function updateYearlyView() {
    const { proposed } = currentResults;
    const tbody = document.getElementById('yearlyTableBody');
    tbody.innerHTML = '';
    
    proposed.yearly.forEach(year => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${year.year}</td>
            <td>${formatCurrencyDetailed(year.openingBalance)}</td>
            <td>${formatCurrencyDetailed(year.totalPayment)}</td>
            <td>${formatCurrencyDetailed(year.totalInterest)}</td>
            <td>${formatCurrencyDetailed(year.totalPrincipal)}</td>
            <td>${formatCurrencyDetailed(year.closingBalance)}</td>
        `;
        tbody.appendChild(row);
    });
}

// Update Monthly View
function updateMonthlyView() {
    const { proposed } = currentResults;
    const tbody = document.getElementById('monthlyTableBody');
    tbody.innerHTML = '';
    
    // Show first 100 months to avoid performance issues
    const maxMonths = Math.min(proposed.schedule.length, 100);
    
    for (let i = 0; i < maxMonths; i++) {
        const payment = proposed.schedule[i];
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${payment.month}</td>
            <td>${formatCurrencyDetailed(payment.emi)}</td>
            <td>${formatCurrencyDetailed(payment.extraPayment)}</td>
            <td>${formatCurrencyDetailed(payment.interest)}</td>
            <td>${formatCurrencyDetailed(payment.principal)}</td>
            <td>${formatCurrencyDetailed(payment.closingBalance)}</td>
        `;
        tbody.appendChild(row);
    }
    
    if (proposed.schedule.length > 100) {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td colspan="6" style="text-align: center; color: var(--text-muted); padding: 1rem;">
                Showing first 100 months. Total: ${proposed.schedule.length} months
            </td>
        `;
        tbody.appendChild(row);
    }
}

// Custom Schedule Management
function openScheduleModal() {
    scheduleModal.classList.add('active');
}

function closeScheduleModal() {
    scheduleModal.classList.remove('active');
}

function addSchedulePeriod() {
    const startMonth = parseInt(document.getElementById('modalStartMonth').value);
    const endMonth = parseInt(document.getElementById('modalEndMonth').value);
    const amount = parseCurrency(document.getElementById('modalExtraAmount').value);
    
    if (!startMonth || !endMonth || !amount) {
        alert('Please fill in all fields');
        return;
    }
    
    if (startMonth > endMonth) {
        alert('Start month must be less than or equal to end month');
        return;
    }
    
    customSchedule.push({
        startMonth: startMonth,
        endMonth: endMonth,
        amount: amount
    });
    
    renderCustomSchedule();
    closeScheduleModal();
    
    // Reset modal inputs
    document.getElementById('modalStartMonth').value = 1;
    document.getElementById('modalEndMonth').value = 12;
    document.getElementById('modalExtraAmount').value = 10000;
}

function renderCustomSchedule() {
    scheduleList.innerHTML = '';
    
    customSchedule.forEach((item, index) => {
        const div = document.createElement('div');
        div.className = 'schedule-item';
        div.innerHTML = `
            <div class="schedule-info">
                <div class="schedule-range">Months ${item.startMonth} - ${item.endMonth}</div>
                <div class="schedule-amount">${formatCurrency(item.amount)}/month</div>
            </div>
            <button class="schedule-remove" onclick="removeSchedule(${index})">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
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
}

// Reset Function
function reset() {
    loanAmountInput.value = '6000000';
    interestRateInput.value = '7.75';
    loanTenureInput.value = '30';
    extraMonthlyInput.value = '0';
    extraDurationInput.value = '0';
    customSchedule = [];
    renderCustomSchedule();
    calculate();
}

// Make removeSchedule available globally
window.removeSchedule = removeSchedule;
