// Load Google Charts for Expense Visualization
google.charts.load('current', { packages: ['corechart'] });
google.charts.setOnLoadCallback(updateExpenseCharts);

// =============== Expense Tracking Functions ===============

//Add Expense Form

// Initialize expenses array from localStorage
let expenses = JSON.parse(localStorage.getItem('expenses')) || [];
const apiKey = '04a7249b239018478c703abd';
const baseCurrency = 'GHS';
let conversionRates = {};

// Fetch live conversion rates
async function fetchConversionRates() {
    try {
        const response = await fetch(`https://v6.exchangerate-api.com/v6/${apiKey}/latest/${baseCurrency}`);
        const data = await response.json();
        if (data.result === "success") {
            conversionRates = data.conversion_rates;
            console.log("Conversion Rates:", conversionRates);
        } else {
            alert("Failed to fetch conversion rates.");
        }
    } catch (error) {
        alert("Error fetching currency data.");
        console.error(error);
    }
}

async function addExpense(event) {
    event.preventDefault();

    const name = document.getElementById('expenseName').value.trim();
    const amount = parseFloat(document.getElementById('expenseAmount').value);
    const currency = document.getElementById('expenseCurrency') ? document.getElementById('expenseCurrency').value : 'GHS';
    const category = document.getElementById('expenseCategory').value;

    if (!name || isNaN(amount) || amount <= 0) {
        alert('Please enter valid expense details.');
        return;
    }

    if (!conversionRates || Object.keys(conversionRates).length === 0) {
        alert('Currency conversion rates not available. Try again later.');
        return;
    }

    // Convert to GH₵ if needed
    const convertedAmount = conversionRates[currency] 
        ? amount / conversionRates[currency] 
        : amount;

    const newExpense = { 
        id: Date.now(), 
        name, 
        amount, 
        currency, 
        category, 
        convertedAmount, 
        date: new Date().toISOString()  // ✅ Ensure valid timestamp
    };

    expenses.push(newExpense);
    localStorage.setItem('expenses', JSON.stringify(expenses));

    updateExpenseUI();
    document.getElementById('expenseForm').reset();
}


// Function to Display Expenses
function updateExpenseUI() {
    const expenseLog = document.getElementById('expenseLog').querySelector('ul');
    const categoryBreakdown = document.getElementById('categoryBreakdown');

    expenseLog.innerHTML = '';
    categoryBreakdown.innerHTML = '';

    let todayTotal = 0, weekTotal = 0, monthTotal = 0;
    let categoryTotals = {};

    let today = new Date();
    today.setHours(0, 0, 0, 0); // Normalize today’s date

    expenses.forEach(exp => {
        // ✅ Validate and sanitize the date
        if (!exp.date || isNaN(new Date(exp.date))) {
            console.warn("Skipping invalid date for expense:", exp);
            return; // Skip this invalid entry
        }

        let expenseDate = new Date(exp.date);
        expenseDate.setHours(0, 0, 0, 0); // Normalize expense date

        if (expenseDate.toDateString() === today.toDateString()) {
            todayTotal += exp.convertedAmount;
        }

        let diffDays = (today - expenseDate) / (1000 * 60 * 60 * 24);
        if (diffDays <= 7) {
            weekTotal += exp.convertedAmount;
        }

        if (expenseDate.getMonth() === today.getMonth() && expenseDate.getFullYear() === today.getFullYear()) {
            monthTotal += exp.convertedAmount;
        }

        categoryTotals[exp.category] = (categoryTotals[exp.category] || 0) + exp.convertedAmount;

        expenseLog.innerHTML += `
            <li class="list-group-item d-flex justify-content-between align-items-center">
                ${exp.name} - ${exp.amount} ${exp.currency} 
                <strong>(≈ GH₵${exp.convertedAmount.toFixed(2)})</strong>
                <button class="btn btn-danger btn-sm" onclick="deleteExpense(${exp.id})">Delete</button>
            </li>`;
    });

    // Update summary
    document.getElementById('todayTotal').innerText = todayTotal.toFixed(2);
    document.getElementById('weekTotal').innerText = weekTotal.toFixed(2);
    document.getElementById('monthTotal').innerText = monthTotal.toFixed(2);
    document.getElementById('monthlyTotal').innerText = monthTotal.toFixed(2);

    // Update category breakdown
    for (let category in categoryTotals) {
        categoryBreakdown.innerHTML += `
            <li class="list-group-item">
                ${category}: GH₵${categoryTotals[category].toFixed(2)}
            </li>`;
    }
}


// Function to Delete an Expense
function deleteExpense(id) {
    if (confirm('Are you sure you want to delete this expense?')) {
        expenses = expenses.filter(exp => exp.id !== id);
        localStorage.setItem('expenses', JSON.stringify(expenses));
        updateExpenseUI();
    }
}

// Initialize app
window.onload = async () => {
    await fetchConversionRates();
    updateExpenseUI();
};

// Attach form submission
document.getElementById('expenseForm').addEventListener('submit', addExpense);


//end..........

// Function to Save an Expense Entry
function saveExpense(expense) {
    const expenses = JSON.parse(localStorage.getItem('expenses')) || [];

    // Create expense entry
    const newExpense = {
        id: Date.now(),
        name: expense.name,
        category: expense.category,
        amount: expense.amount,
        date: new Date().toISOString(),
    };

    expenses.push(newExpense);
    localStorage.setItem('expenses', JSON.stringify(expenses));

    updateExpenseUI(); // Refresh the UI
}

function displayExpenses() {
    let expenses = JSON.parse(localStorage.getItem('expenses')) || [];
    let recurringExpenses = JSON.parse(localStorage.getItem("recurringExpenses")) || [];
    
    const expenseLog = document.getElementById('expenseLog');
    const manageLog = document.getElementById('manageLog');
    const recurringList = document.getElementById("recurringExpenseList");

    expenseLog.innerHTML = '';
    manageLog.innerHTML = '';
    recurringList.innerHTML = ''; 

    // Display normal expenses
    expenses.slice().reverse().forEach(expense => {
        const listItem = document.createElement('li');
        listItem.className = 'list-group-item';

        listItem.innerHTML = `
            <strong>${expense.name}</strong> - GH₵ ${parseFloat(expense.amount).toFixed(2)} 
            <span class="badge bg-primary">${expense.category}</span>
            <small class="text-muted">(${expense.date ? new Date(expense.date).toLocaleDateString() : 'No Date'})</small>
            ${expense.isRecurring ? '<span class="badge bg-info">Recurring</span>' : ''}
            <button class="btn btn-warning btn-sm" onclick="editExpense(${expense.id})">Edit</button>
            <button class="btn btn-sm btn-danger" onclick="deleteExpense(${expense.id})">Delete</button>
        `;

        manageLog.appendChild(listItem);
    });

    // Display scheduled recurring expenses
    recurringExpenses.forEach((expense, index) => {
        const listItem = document.createElement("li");
        listItem.classList.add("list-group-item", "d-flex", "justify-content-between", "align-items-center");

        listItem.innerHTML = `
            ${expense.name} - GH₵${expense.amount} (${expense.frequency}, starts on ${expense.startDate})
            <button class="btn btn-warning btn-sm" onclick="editRecurringExpense(${index})">Edit</button>
            <button class="btn btn-danger btn-sm" onclick="deleteRecurringExpense(${index})">Delete</button>
        `;
        recurringList.appendChild(listItem);
    });
}

function editRecurringExpense(index) {
    let recurringExpenses = JSON.parse(localStorage.getItem("recurringExpenses")) || [];
    let expense = recurringExpenses[index];

    document.getElementById("recurringName").value = expense.name;
    document.getElementById("recurringAmount").value = expense.amount;
    document.getElementById("recurringCategory").value = expense.category;
    document.getElementById("recurringFrequency").value = expense.frequency;
    document.getElementById("recurringStartDate").value = expense.startDate;

    // Remove the old entry and wait for user to re-save
    recurringExpenses.splice(index, 1);
    localStorage.setItem("recurringExpenses", JSON.stringify(recurringExpenses));

    showToast("✏️ Edit the recurring expense and save changes.", "warning");
}


function editRecurringExpense(index) {
    let recurringExpenses = JSON.parse(localStorage.getItem("recurringExpenses")) || [];
    let expense = recurringExpenses[index];

    // Populate modal form with existing values
    document.getElementById("editRecurringIndex").value = index; // Store index for update
    document.getElementById("editRecurringName").value = expense.name;
    document.getElementById("editRecurringAmount").value = expense.amount;
    document.getElementById("editRecurringCategory").value = expense.category;
    document.getElementById("editRecurringFrequency").value = expense.frequency;
    document.getElementById("editRecurringStartDate").value = expense.startDate;

    // Show modal
    let editModal = new bootstrap.Modal(document.getElementById("editRecurringModal"));
    editModal.show();
}


function updateRecurringExpense() {
    let index = document.getElementById("editRecurringIndex").value;
    let recurringExpenses = JSON.parse(localStorage.getItem("recurringExpenses")) || [];

    // Get updated values
    let updatedExpense = {
        name: document.getElementById("editRecurringName").value.trim(),
        amount: parseFloat(document.getElementById("editRecurringAmount").value),
        category: document.getElementById("editRecurringCategory").value,
        frequency: document.getElementById("editRecurringFrequency").value,
        startDate: document.getElementById("editRecurringStartDate").value
    };

    // Validate inputs
    if (!updatedExpense.name || isNaN(updatedExpense.amount) || updatedExpense.amount <= 0 || !updatedExpense.startDate) {
        showToast("⚠️ Please enter valid recurring expense details.", "danger");
        return;
    }

    // Update the recurring expense in the array
    recurringExpenses[index] = updatedExpense;
    localStorage.setItem("recurringExpenses", JSON.stringify(recurringExpenses));

    // Close the modal
    let editModal = bootstrap.Modal.getInstance(document.getElementById("editRecurringModal"));
    editModal.hide();

    showToast("✅ Recurring expense updated successfully!", "success");
    displayExpenses(); // Refresh the list
}


function deleteRecurringExpense(index) {
    let recurringExpenses = JSON.parse(localStorage.getItem("recurringExpenses")) || [];
    
    if (index >= 0 && index < recurringExpenses.length) {
        recurringExpenses.splice(index, 1); // Remove item at index
        localStorage.setItem("recurringExpenses", JSON.stringify(recurringExpenses));
        showToast("🗑️ Recurring expense deleted!", "danger");
        displayExpenses(); // Refresh the list
    }
}


// Function to Add a Recurring Expenses
// Function to Add a Recurring Expense (Prevent Duplicates)
window.addRecurringExpense = function () {
    console.log("🔄 addRecurringExpense() function called!"); // Debugging log

    let name = document.getElementById("recurringName")?.value.trim();
    let amount = parseFloat(document.getElementById("recurringAmount")?.value);
    let category = document.getElementById("recurringCategory")?.value;
    let frequency = document.getElementById("recurringFrequency")?.value;
    let startDate = document.getElementById("recurringStartDate")?.value;

    // Check if inputs exist and are valid
    if (!name || isNaN(amount) || amount <= 0 || !startDate) {
        showToast("⚠️ Please enter valid recurring expense details.", "danger");
        console.error("❌ Invalid input data:", { name, amount, category, frequency, startDate });
        return;
    }

    let recurringExpenses = JSON.parse(localStorage.getItem("recurringExpenses")) || [];

    // Check if a duplicate expense already exists
    let isDuplicate = recurringExpenses.some(expense =>
        expense.name === name &&
        expense.category === category &&
        expense.frequency === frequency &&
        expense.startDate === startDate
    );

    if (isDuplicate) {
        showToast("⚠️ This recurring expense already exists!", "danger");
        console.warn("❌ Duplicate detected:", { name, category, frequency, startDate });
        return;
    }

    // Add the new expense since it's not a duplicate
    recurringExpenses.push({ name, amount, category, frequency, startDate });
    localStorage.setItem("recurringExpenses", JSON.stringify(recurringExpenses));

    showToast("✅ Recurring expense added successfully!", "success");
    loadRecurringExpenses();
};




function updateExpenseSummary() {
    const expenses = JSON.parse(localStorage.getItem('expenses')) || [];
    const today = new Date().toISOString().split("T")[0];
    const startOfWeek = getStartOfWeek();
    const startOfMonth = getStartOfMonth();

    let todayTotal = 0, weekTotal = 0, thisMonthTotal = 0, totalMonthlyExpenditure = 0;
    let categoryTotals = {};

    expenses.forEach(expense => {
        const expenseDate = new Date(expense.date);
        const expenseMonth = expenseDate.getMonth();
        const expenseYear = expenseDate.getFullYear();
        const currentMonth = new Date().getMonth();
        const currentYear = new Date().getFullYear();

        // Check for Today's Total
        if (expenseDate.toISOString().split("T")[0] === today) {
            todayTotal += parseFloat(expense.amount);
        }

        // Check for This Week's Total
        if (expenseDate >= startOfWeek) {
            weekTotal += parseFloat(expense.amount);
        }

        // Check for This Month's Total (Inside Expense Summary)
        if (expenseMonth === currentMonth && expenseYear === currentYear) {
            thisMonthTotal += parseFloat(expense.amount);
            categoryTotals[expense.category] = (categoryTotals[expense.category] || 0) + parseFloat(expense.amount);
        }

        // Calculate Total Monthly Expenditure (For the top display)
        totalMonthlyExpenditure += parseFloat(expense.amount);
    });

    // ✅ Update "Total Monthly Expenditure" Above Expense Form
    const monthlyExpenditureElement = document.getElementById('monthlyTotal');
    if (monthlyExpenditureElement) {
        monthlyExpenditureElement.textContent = totalMonthlyExpenditure.toFixed(2);
    }

    // ✅ Update Expense Summary: Today, This Week, This Month
    const todayTotalElement = document.getElementById('todayTotal');
    const weekTotalElement = document.getElementById('weekTotal');
    const monthTotalElement = document.getElementById('monthTotal'); // ✅ Fix for "This Month" inside summary

    if (todayTotalElement) todayTotalElement.textContent = todayTotal.toFixed(2);
    if (weekTotalElement) weekTotalElement.textContent = weekTotal.toFixed(2);
    if (monthTotalElement) monthTotalElement.textContent = thisMonthTotal.toFixed(2); // ✅ Correctly updates "This Month"

    // ✅ Update Monthly Breakdown (By Category)
    const categoryBreakdown = document.getElementById('categoryBreakdown');
    if (categoryBreakdown) {
        categoryBreakdown.innerHTML = '';
        for (const category in categoryTotals) {
            const listItem = document.createElement('li');
            listItem.className = 'list-group-item';
            listItem.innerHTML = `${category}: GH₵ ${categoryTotals[category].toFixed(2)}`;
            categoryBreakdown.appendChild(listItem);
        }
    }
}

// ✅ Utility Functions for Date Calculation
function getStartOfWeek() {
    const now = new Date();
    const dayOfWeek = now.getDay();
    return new Date(now.setDate(now.getDate() - dayOfWeek));
}

function getStartOfMonth() {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
}

// Function to Open the Edit Modal and Populate It
function editExpense(id) {
    console.log("Editing Expense ID:", id); // Debugging

    let expenses = JSON.parse(localStorage.getItem('expenses')) || [];
    let expense = expenses.find(exp => exp.id === id);

    if (expense) {
        document.getElementById("editExpenseId").value = expense.id;
        document.getElementById("editExpenseName").value = expense.name;
        document.getElementById("editExpenseAmount").value = expense.amount;
        document.getElementById("editExpenseCategory").value = expense.category;

        let editModal = new bootstrap.Modal(document.getElementById('editExpenseModal'));
        editModal.show();
    } else {
        console.error("Expense not found:", id);
    }
}


// Function to Save the Edited Expense
function showToast(message) {
    let toastEl = document.getElementById("expenseToast");
    let toastBody = toastEl.querySelector(".toast-body");
    toastBody.textContent = message;
    
    let toast = new bootstrap.Toast(toastEl);
    toast.show();
}

document.getElementById("editExpenseForm").addEventListener("submit", function (event) {
    event.preventDefault();

    let expenseId = parseInt(document.getElementById("editExpenseId").value);
    let updatedName = document.getElementById("editExpenseName").value.trim();
    let updatedAmount = parseFloat(document.getElementById("editExpenseAmount").value);
    let updatedCategory = document.getElementById("editExpenseCategory").value;

    if (!updatedName || isNaN(updatedAmount) || !updatedCategory) {
        showToast("⚠️ Please enter valid expense details.");
        return;
    }

    let expenses = JSON.parse(localStorage.getItem("expenses")) || [];

    // Find and update the expense
    let updatedExpenses = expenses.map(exp => {
        if (exp.id === expenseId) {
            return { ...exp, name: updatedName, amount: updatedAmount, category: updatedCategory };
        }
        return exp;
    });

    localStorage.setItem("expenses", JSON.stringify(updatedExpenses));

    // Close the modal
    let editModal = bootstrap.Modal.getInstance(document.getElementById('editExpenseModal'));
    editModal.hide();

    // Refresh UI
    updateExpenseSummary();
    displayExpenses();
});

        //editing ended


// Function to Delete an Expense
function deleteExpense(id) {
    if (confirm("Are you sure you want to delete this expense?")) {
        let expenses = JSON.parse(localStorage.getItem("expenses")) || [];
        expenses = expenses.filter(exp => exp.id !== id);
        localStorage.setItem("expenses", JSON.stringify(expenses));
        updateExpenseUI();
    }
}

// =============== Expense Chart Functions ===============

// Function to Update Expense Charts
function updateExpenseCharts() {
    const expenses = JSON.parse(localStorage.getItem('expenses')) || [];
    const currentMonth = new Date().getMonth();

    const categoryData = {};
    const monthlyData = {};

    expenses.forEach(expense => {
        // Category-wise (Pie Chart Data)
        categoryData[expense.category] = (categoryData[expense.category] || 0) + parseFloat(expense.amount);

        // Monthly Trends (Bar Chart Data)
        if (new Date(expense.date).getMonth() === currentMonth) {
            monthlyData[expense.name] = (monthlyData[expense.name] || 0) + parseFloat(expense.amount);
        }
    });

    drawPieChart(categoryData);
    drawBarChart(monthlyData);
}

// Function to redraw charts on window resize
window.addEventListener('resize', updateExpenseCharts);

// Draw Expense Pie Chart
function drawPieChart(categoryData) {
    const data = new google.visualization.DataTable();
    data.addColumn('string', 'Category');
    data.addColumn('number', 'Amount');

    for (const category in categoryData) {
        data.addRow([category, categoryData[category]]);
    }

    const options = {
        title: 'Expense Distribution by Category',
        is3D: true,
        colors: ['#1E88E5', '#D32F2F', '#43A047', '#FB8C00', '#8E24AA'],
        chartArea: { width: '90%', height: '80%' }, // Responsive chart area
        legend: { position: 'bottom' }
    };

    const chart = new google.visualization.PieChart(document.getElementById('expensePieChart'));
    chart.draw(data, options);
}

// Draw Expense Bar Chart
function drawBarChart(monthlyData) {
    const data = new google.visualization.DataTable();
    data.addColumn('string', 'Expense');
    data.addColumn('number', 'Amount');

    for (const item in monthlyData) {
        data.addRow([item, monthlyData[item]]);
    }

    const options = {
        title: 'Monthly Expense Trends',
        hAxis: { title: 'Expense' },
        vAxis: { title: 'Amount (GH₵)' },
        colors: ['#1B9E77'],
        chartArea: { width: '85%', height: '70%' }, // Responsive chart area
        legend: { position: 'bottom' }
    };

    const chart = new google.visualization.ColumnChart(document.getElementById('expenseBarChart'));
    chart.draw(data, options);
}

// =============== Utility Functions ===============
function getStartOfWeek() {
    const now = new Date();
    now.setDate(now.getDate() - now.getDay());
    return now;
}

function getStartOfMonth() {
    return new Date(new Date().getFullYear(), new Date().getMonth(), 1);
}

// =============== Initialize UI ===============
function updateExpenseUI() {
    displayExpenses();
    updateExpenseSummary();
    updateExpenseCharts();
}

document.addEventListener('DOMContentLoaded', updateExpenseUI);


// =============== Expense Limits Handling ===============

// Function to load saved limits from localStorage
function loadLimits() {
    const monthlyLimit = localStorage.getItem("monthlyLimit") || "";
    const categoryLimits = JSON.parse(localStorage.getItem("categoryLimits")) || {};

    document.getElementById("monthlyLimit").value = monthlyLimit;

    // Populate category limit inputs
    const categories = ["Food", "Transport", "Health", "Credit"];
    const categoryLimitInputs = document.getElementById("categoryLimitInputs");
    categoryLimitInputs.innerHTML = "";

    categories.forEach(category => {
        const inputDiv = document.createElement("div");
        inputDiv.classList.add("mb-2");

        inputDiv.innerHTML = `
            <label class="form-label">${category}</label>
            <input type="number" class="form-control category-limit" data-category="${category}" 
                   placeholder="Set limit for ${category}" value="${categoryLimits[category] || ''}" min="0">
        `;

        categoryLimitInputs.appendChild(inputDiv);
    });
}

// Function to save limits
function saveLimits() {
    const monthlyLimit = document.getElementById("monthlyLimit").value;
    const categoryInputs = document.querySelectorAll(".category-limit");

    let categoryLimits = {};
    categoryInputs.forEach(input => {
        const category = input.getAttribute("data-category");
        const limit = parseFloat(input.value);
        if (!isNaN(limit)) {
            categoryLimits[category] = limit;
        }
    });

    // Save to localStorage
    localStorage.setItem("monthlyLimit", monthlyLimit);
    localStorage.setItem("categoryLimits", JSON.stringify(categoryLimits));

    showToast("✅ Expense limits saved successfully!", "success");
}

// Function to check limits and display warnings
function checkLimits() {
    const expenses = JSON.parse(localStorage.getItem("expenses")) || [];
    const monthlyLimit = parseFloat(localStorage.getItem("monthlyLimit")) || 0;
    const categoryLimits = JSON.parse(localStorage.getItem("categoryLimits")) || {};

    let totalSpent = 0;
    let categorySpent = {};
    let warnings = [];

    expenses.forEach(exp => {
        totalSpent += parseFloat(exp.amount);
        categorySpent[exp.category] = (categorySpent[exp.category] || 0) + parseFloat(exp.amount);
    });

    // Check monthly limit
    if (monthlyLimit > 0 && totalSpent > monthlyLimit) {
        warnings.push(`⚠️ You have exceeded your monthly budget cap of GH₵${monthlyLimit}!`);
    }

    // Check category limits
    for (const category in categoryLimits) {
        if (categorySpent[category] && categorySpent[category] > categoryLimits[category]) {
            warnings.push(`⚠️ You have exceeded your ${category} budget of GH₵${categoryLimits[category]}!`);
        }
    }

    // Display warnings
    const warningDiv = document.getElementById("limitWarnings");
    warningDiv.innerHTML = "";

    if (warnings.length > 0) {
        warnings.forEach(msg => {
            const warningElement = document.createElement("div");
            warningElement.classList.add("alert", "alert-warning", "mt-2");
            warningElement.innerHTML = msg;
            warningDiv.appendChild(warningElement);
        });
    }
}

// Function to show Bootstrap Toast notifications
function showToast(message, type = "danger") {
    let toastEl = document.getElementById("expenseToast");
    let toastBody = toastEl.querySelector(".toast-body");

    toastBody.textContent = message;
    toastEl.classList.remove("bg-danger", "bg-success");
    toastEl.classList.add(type === "success" ? "bg-success" : "bg-danger");

    let toast = new bootstrap.Toast(toastEl);
    toast.show();
}

// Initialize on page load
window.onload = function () {
    loadLimits(); 
    setTimeout(checkLimits, 500); // Delay to allow other scripts to load
    fetchConversionRates(); // Ensure currency rates are fetched properly


    // =================== RECURRING EXPENSES LOGIC ===================
// Load existing recurring expenses from localStorage
function loadRecurringExpenses() {
    let recurringExpenses = JSON.parse(localStorage.getItem("recurringExpenses")) || [];
    const list = document.getElementById("recurringExpenseList");
    list.innerHTML = "";

    recurringExpenses.forEach((expense, index) => {
        const listItem = document.createElement("li");
        listItem.classList.add("list-group-item", "d-flex", "justify-content-between", "align-items-center");

        listItem.innerHTML = `
            <div>
                ${expense.name} - GH₵${expense.amount} (${expense.frequency}, starts on ${expense.startDate})
            </div>
            <div>
                <button class="btn btn-warning btn-sm me-2" onclick="editRecurringExpense(${index})">Edit</button>
                <button class="btn btn-danger btn-sm" onclick="deleteRecurringExpense(${index})">Delete</button>
            </div>
        `;
        list.appendChild(listItem);
    });
}

// Function to Add a Recurring Expense
window.addRecurringExpense = function () {
    let name = document.getElementById("recurringName")?.value.trim();
    let amount = parseFloat(document.getElementById("recurringAmount")?.value);
    let category = document.getElementById("recurringCategory")?.value;
    let frequency = document.getElementById("recurringFrequency")?.value;
    let startDate = document.getElementById("recurringStartDate")?.value;

    if (!name || isNaN(amount) || amount <= 0 || !startDate) {
        showToast("⚠️ Please enter valid recurring expense details.", "danger");
        return;
    }

    let recurringExpenses = JSON.parse(localStorage.getItem("recurringExpenses")) || [];
    recurringExpenses.push({ name, amount, category, frequency, startDate });

    localStorage.setItem("recurringExpenses", JSON.stringify(recurringExpenses));

    showToast("✅ Recurring expense added successfully!", "success");
    loadRecurringExpenses();
};

// Function to Edit a Recurring Expense
function editRecurringExpense(index) {
    let recurringExpenses = JSON.parse(localStorage.getItem("recurringExpenses")) || [];
    let expense = recurringExpenses[index];

    document.getElementById("editRecurringId").value = index;
    document.getElementById("editRecurringName").value = expense.name;
    document.getElementById("editRecurringAmount").value = expense.amount;
    document.getElementById("editRecurringCategory").value = expense.category;
    document.getElementById("editRecurringFrequency").value = expense.frequency;
    document.getElementById("editRecurringStartDate").value = expense.startDate;

    let editModal = new bootstrap.Modal(document.getElementById("editRecurringModal"));
    editModal.show();
}

// Function to Save Edited Recurring Expense
function saveEditedRecurring() {
    let index = document.getElementById("editRecurringId").value;
    let name = document.getElementById("editRecurringName").value.trim();
    let amount = parseFloat(document.getElementById("editRecurringAmount").value);
    let category = document.getElementById("editRecurringCategory").value;
    let frequency = document.getElementById("editRecurringFrequency").value;
    let startDate = document.getElementById("editRecurringStartDate").value;

    if (!name || isNaN(amount) || amount <= 0 || !startDate) {
        showToast("⚠️ Please enter valid recurring expense details.", "danger");
        return;
    }

    let recurringExpenses = JSON.parse(localStorage.getItem("recurringExpenses")) || [];
    recurringExpenses[index] = { name, amount, category, frequency, startDate };

    localStorage.setItem("recurringExpenses", JSON.stringify(recurringExpenses));

    let editModal = bootstrap.Modal.getInstance(document.getElementById("editRecurringModal"));
    editModal.hide();

    showToast("✅ Recurring expense updated successfully!", "success");
    loadRecurringExpenses();
}

// Function to Delete a Recurring Expense
function deleteRecurringExpense(index) {
    let recurringExpenses = JSON.parse(localStorage.getItem("recurringExpenses")) || [];
    recurringExpenses.splice(index, 1);
    localStorage.setItem("recurringExpenses", JSON.stringify(recurringExpenses));

    showToast("🗑️ Recurring expense deleted!", "danger");
    loadRecurringExpenses();
}

// Function to Check and Auto-Log Recurring Expenses
function checkAndLogRecurringExpenses() {
    let recurringExpenses = JSON.parse(localStorage.getItem("recurringExpenses")) || [];
    let expenses = JSON.parse(localStorage.getItem("expenses")) || [];
    let today = new Date().toISOString().split("T")[0];

    let newExpenses = [];

    recurringExpenses.forEach(expense => {
        let lastLogged = localStorage.getItem(`logged_${expense.name}_${expense.startDate}`) || "";
        if (lastLogged === today) return; // Skip if already logged today

        let shouldLog = false;
        let startDate = new Date(expense.startDate);
        let currentDate = new Date();

        if (expense.frequency === "daily") {
            shouldLog = true;
        } else if (expense.frequency === "weekly") {
            let daysDifference = Math.floor((currentDate - startDate) / (1000 * 60 * 60 * 24));
            shouldLog = daysDifference % 7 === 0;
        } else if (expense.frequency === "monthly") {
            shouldLog = startDate.getDate() === currentDate.getDate();
        }

        if (shouldLog) {
            newExpenses.push({
                id: Date.now(), // Ensure unique ID
                name: expense.name,
                amount: expense.amount,
                category: expense.category,
                date: today,
                isRecurring: true // Mark as recurring
            });

            localStorage.setItem(`logged_${expense.name}_${expense.startDate}`, today);
            showToast(`📅 Recurring expense "${expense.name}" logged!`, "success");
        }
    });

    if (newExpenses.length > 0) {
        expenses = [...newExpenses, ...expenses]; // Merge new expenses with existing ones
        localStorage.setItem("expenses", JSON.stringify(expenses));
    }

    displayExpenses(); // ✅ Ensure recurring expenses are displayed
}


window.onload = function () {
    loadRecurringExpenses();
    checkAndLogRecurringExpenses(); // ✅ Ensures recurring expenses are reloaded
    displayExpenses(); // ✅ Ensures they appear after refresh
};


};

