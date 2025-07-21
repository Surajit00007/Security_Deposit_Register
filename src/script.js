// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAwMLOh7VtM2Ak74gQVrtHJtWHkm6O3XyM",
  authDomain: "pwdsubrata.firebaseapp.com",
  projectId: "pwdsubrata",
  storageBucket: "pwdsubrata.firebasestorage.app",
  messagingSenderId: "838170858736",
  appId: "1:838170858736:web:5eae624b7fcd930474de35",
  measurementId: "G-RGNST02KXX"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();

// Data storage
let agencies = [];
let deposits = [];
let payments = [];
let challanCounter = 1;
let editingDepositId = null;
let editingPaymentId = null;

// Initialize application
function init() {
    loadData();
    populateDropdowns();
    populateYearDropdown();
    refreshTables();
    setupAuthKeyboardListeners();
}

// Setup keyboard listeners and button click handlers for authentication forms
function setupAuthKeyboardListeners() {
    // Button click handlers
    document.getElementById('register-btn').addEventListener('click', registerUser);
    document.getElementById('login-btn').addEventListener('click', loginUser);
    document.getElementById('email-link-btn').addEventListener('click', sendSignInLink);
    document.getElementById('logout-btn').addEventListener('click', logoutUser);
    
    // Register form - Enter key support
    document.getElementById('reg-email').addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            document.getElementById('reg-password').focus();
        }
    });
    
    document.getElementById('reg-password').addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            registerUser();
        }
    });
    
    // Login form - Enter key support
    document.getElementById('login-email').addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            document.getElementById('login-password').focus();
        }
    });
    
    document.getElementById('login-password').addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            loginUser();
        }
    });
    
    // Email link form - Enter key support
    document.getElementById('emailLinkAddress').addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            sendSignInLink();
        }
    });
    
    console.log('✅ Authentication event listeners attached successfully');
}

// User authentication
function registerUser() {
  const email = document.getElementById("reg-email").value.trim();
  const password = document.getElementById("reg-password").value;

  if (!email || !password) {
    updateAuthStatus("❌ Please fill in all fields", "error");
    return;
  }

  updateAuthStatus("🔄 Creating account...", "info");

  auth.createUserWithEmailAndPassword(email, password)
    .then((userCredential) => {
      updateAuthStatus(`🎉 Account created successfully! Welcome, ${userCredential.user.email}`, "success");
      clearAuthForms();
    })
    .catch((error) => {
      updateAuthStatus(`❌ Registration failed: ${error.message}`, "error");
    });
}

function loginUser() {
  const email = document.getElementById("login-email").value.trim();
  const password = document.getElementById("login-password").value;

  if (!email || !password) {
    updateAuthStatus("❌ Please fill in all fields", "error");
    return;
  }

  updateAuthStatus("🔄 Signing in...", "info");

  auth.signInWithEmailAndPassword(email, password)
    .then((userCredential) => {
      updateAuthStatus(`✅ Successfully signed in! Welcome back, ${userCredential.user.email}`, "success");
      clearAuthForms();
    })
    .catch((error) => {
      updateAuthStatus(`❌ Sign in failed: ${error.message}`, "error");
    });
}

function logoutUser() {
  updateAuthStatus("🔄 Signing out...", "info");
  
  auth.signOut().then(() => {
    updateAuthStatus("👋 You have been signed out successfully", "info");
    showAuthForms();
  }).catch((error) => {
    updateAuthStatus(`❌ Sign out failed: ${error.message}`, "error");
  });
}

function sendSignInLink() {
  const email = document.getElementById("emailLinkAddress").value.trim();
  
  if (!email) {
    document.getElementById("emailLinkStatus").innerText = "❌ Please enter your email address";
    return;
  }

  if (!isValidEmail(email)) {
    document.getElementById("emailLinkStatus").innerText = "❌ Please enter a valid email address";
    return;
  }

  document.getElementById("emailLinkStatus").innerText = "🔄 Sending sign-in link...";

  const actionCodeSettings = {
    url: window.location.href,
    handleCodeInApp: true,
  };
  
  auth.sendSignInLinkToEmail(email, actionCodeSettings)
    .then(() => {
      window.localStorage.setItem('emailForSignIn', email);
      document.getElementById("emailLinkStatus").innerText = "✅ Sign-in link sent! Check your inbox and click the link to sign in.";
    })
    .catch(err => {
      document.getElementById("emailLinkStatus").innerText = `❌ Failed to send link: ${err.message}`;
    });
}

// Helper functions for UI management
function updateAuthStatus(message, type = "info") {
  const statusElement = document.getElementById("auth-status");
  statusElement.innerText = message;
  
  // Remove existing classes
  statusElement.classList.remove("success", "error", "info");
  
  // Add new class based on type
  if (type) {
    statusElement.classList.add(type);
  }
}

function clearAuthForms() {
  document.getElementById("reg-email").value = "";
  document.getElementById("reg-password").value = "";
  document.getElementById("login-email").value = "";
  document.getElementById("login-password").value = "";
  document.getElementById("emailLinkAddress").value = "";
  document.getElementById("emailLinkStatus").innerText = "";
}

function showAuthForms() {
  document.getElementById("auth-forms").style.display = "grid";
  document.getElementById("logout-section").style.display = "none";
}

function hideAuthForms() {
  document.getElementById("auth-forms").style.display = "none";
  document.getElementById("logout-section").style.display = "block";
}

function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

// Monitor auth state
auth.onAuthStateChanged((user) => {
  if (user) {
    updateAuthStatus(`🎉 Welcome back, ${user.email}! You are successfully signed in.`, "success");
    hideAuthForms();
  } else {
    updateAuthStatus("🔐 Please sign in to access the Security Deposit Register", "info");
    showAuthForms();
  }
});

// Tab management
function openTab(tabName) {
    // Hide all tab contents
    const tabContents = document.querySelectorAll('.tab-content');
    tabContents.forEach(content => content.classList.remove('active'));

    // Remove active class from all tabs
    const tabs = document.querySelectorAll('.tab');
    tabs.forEach(tab => tab.classList.remove('active'));

    // Show selected tab content
    document.getElementById(tabName).classList.add('active');

    // Add active class to clicked tab - handle both click events and programmatic calls
    if (event && event.target) {
        event.target.classList.add('active');
    } else {
        // For programmatic calls, find the tab by content
        const tabButtons = document.querySelectorAll('.tab');
        tabButtons.forEach(tab => {
            if (tab.onclick && tab.onclick.toString().includes(`'${tabName}'`)) {
                tab.classList.add('active');
            }
        });
    }

    // Refresh data when viewing records
    if (tabName === 'view-records') {
        refreshRecordTables();
    }
}

// Data persistence
function saveData() {
    const data = {
        agencies: agencies,
        deposits: deposits,
        payments: payments
    };
    // In a real application, this would save to a database
    console.log('Data saved:', data);
}

function loadData() {
    // In a real application, this would load from a database
    // For now, start with empty data
    if (agencies.length === 0) {
        agencies = [];
    }
}

// PAN formatting function
function formatPAN(input) {
    let value = input.value.toUpperCase().replace(/[^A-Z0-9]/g, '');
    
    // Limit to valid PAN characters only
    if (value.length > 10) {
        value = value.substring(0, 10);
    }
    
    // Visual feedback for format validation
    const panPattern = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;
    if (value.length === 10) {
        if (panPattern.test(value)) {
            input.style.borderColor = '#28a745'; // Green for valid
            input.style.backgroundColor = '#f8fff9';
        } else {
            input.style.borderColor = '#dc3545'; // Red for invalid
            input.style.backgroundColor = '#fff8f8';
        }
    } else {
        input.style.borderColor = '#e9ecef'; // Default color
        input.style.backgroundColor = 'white';
    }
    
    input.value = value;
}

// Agency management
function saveAgency() {
    const pan = document.getElementById('agency-pan').value.trim().toUpperCase();
    const name = document.getElementById('agency-name').value.trim();

    if (!pan || !name) {
        showAlert('Please fill in all fields', 'error');
        return;
    }

    // Validate PAN format (ABCDE1234F)
    const panPattern = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;
    if (!panPattern.test(pan)) {
        showAlert('Please enter PAN in correct format: ABCDE1234F (5 letters + 4 digits + 1 letter)', 'error');
        return;
    }

    // Check if PAN already exists
    const existingAgency = agencies.find(a => a.pan === pan);
    if (existingAgency) {
        showAlert('PAN already exists', 'error');
        return;
    }

    const agency = {
        id: Date.now(),
        pan: pan,
        name: name
    };

    agencies.push(agency);
    saveData();
    refreshAgencyTable();
    populateDropdowns();
    clearAgencyForm();
    showAlert('Agency saved successfully', 'success');
}

function editAgency(id) {
    const agency = agencies.find(a => a.id === id);
    if (agency) {
        document.getElementById('agency-pan').value = agency.pan;
        document.getElementById('agency-name').value = agency.name;
        
        // Remove from array for update
        agencies = agencies.filter(a => a.id !== id);
        refreshAgencyTable();
        populateDropdowns();
    }
}

function deleteAgency(id) {
    if (confirm('Are you sure you want to delete this agency?')) {
        agencies = agencies.filter(a => a.id !== id);
        saveData();
        refreshAgencyTable();
        populateDropdowns();
        showAlert('Agency deleted successfully', 'success');
    }
}

function clearAgencyForm() {
    document.getElementById('agency-pan').value = '';
    document.getElementById('agency-name').value = '';
}

function refreshAgencyTable() {
    const tbody = document.getElementById('agency-tbody');
    tbody.innerHTML = '';

    agencies.forEach((agency, index) => {
        const row = tbody.insertRow();
        row.innerHTML = `
            <td>${index + 1}</td>
            <td>${agency.pan}</td>
            <td>${agency.name}</td>
            <td>
                <button class="btn btn-secondary" onclick="editAgency(${agency.id})">Edit</button>
                <button class="btn btn-danger" onclick="deleteAgency(${agency.id})">Delete</button>
            </td>
        `;
    });
}

function searchAgencies() {
    const searchTerm = document.getElementById('agency-search').value.toLowerCase();
    const tbody = document.getElementById('agency-tbody');
    const rows = tbody.getElementsByTagName('tr');

    for (let row of rows) {
        const text = row.textContent.toLowerCase();
        row.style.display = text.includes(searchTerm) ? '' : 'none';
    }
}

// Populate dropdowns
function populateDropdowns() {
    const depositPan = document.getElementById('deposit-pan');
    const paymentPan = document.getElementById('payment-pan');
    const reportAgency = document.getElementById('report-agency');

    // Clear existing options
    depositPan.innerHTML = '<option value="">Select PAN</option>';
    paymentPan.innerHTML = '<option value="">Select PAN</option>';
    reportAgency.innerHTML = '<option value="">Select Agency</option>';

    agencies.forEach(agency => {
        const option1 = new Option(`${agency.pan} - ${agency.name}`, agency.pan);
        const option2 = new Option(`${agency.pan} - ${agency.name}`, agency.pan);
        const option3 = new Option(`${agency.pan} - ${agency.name}`, agency.pan);
        
        depositPan.add(option1);
        paymentPan.add(option2);
        reportAgency.add(option3);
    });
}

function populateYearDropdown() {
    const yearSelect = document.getElementById('report-year');
    const currentYear = new Date().getFullYear();
    
    // Add "Before 2015-16" option first
    const beforeOption = new Option('Before 2015-16', 'before-2015');
    yearSelect.add(beforeOption);
    
    // Add year options from 2015 onwards
    for (let year = 2015; year <= currentYear; year++) {
        const option = new Option(`${year}-${year + 1}`, year);
        yearSelect.add(option);
    }
}

// Deposit management
function updateDepositAgencyName() {
    const pan = document.getElementById('deposit-pan').value;
    const agency = agencies.find(a => a.pan === pan);
    const nameField = document.getElementById('deposit-agency-name');
    
    nameField.value = agency ? agency.name : '';
}

function toggleDepositFields() {
    const nature = document.getElementById('deposit-nature').value;
    const emdFields = document.getElementById('emd-fields');
    const sdFields = document.getElementById('sd-fields');
    const billNoField = document.getElementById('deposit-bill-no');
    const billDateField = document.getElementById('deposit-bill-date');

    emdFields.classList.add('hidden');
    sdFields.classList.add('hidden');

    if (nature === 'EMD') {
        emdFields.classList.remove('hidden');
        billNoField.value = 'NA';
        billNoField.disabled = true;
        billDateField.disabled = true;
    } else if (nature === 'SD') {
        sdFields.classList.remove('hidden');
        billNoField.disabled = false;
        billDateField.disabled = false;
        billNoField.value = '';
    } else {
        billNoField.disabled = false;
        billDateField.disabled = false;
        billNoField.value = '';
    }
    
    // Reset work completion fields when nature changes
    document.getElementById('work-completed').value = '';
    toggleWorkCompletionFields();
}

function toggleWorkCompletionFields() {
    const workCompleted = document.getElementById('work-completed').value;
    const billTypeGroup = document.getElementById('bill-type-group');
    const sdCompletionDate = document.getElementById('sd-completion-date');
    const sdDefectPeriod = document.getElementById('sd-defect-period');
    
    if (workCompleted === 'NO') {
        // Show Bill Type field
        billTypeGroup.style.display = 'block';
        
        // Hide SD completion fields
        if (sdCompletionDate) {
            sdCompletionDate.parentElement.style.display = 'none';
            sdCompletionDate.value = '';
        }
        if (sdDefectPeriod) {
            sdDefectPeriod.parentElement.style.display = 'none';
            sdDefectPeriod.value = '';
        }
    } else if (workCompleted === 'YES') {
        // Hide Bill Type field
        billTypeGroup.style.display = 'none';
        document.getElementById('bill-type').value = '';
        
        // Show SD completion fields if SD is selected
        const nature = document.getElementById('deposit-nature').value;
        if (nature === 'SD') {
            if (sdCompletionDate) {
                sdCompletionDate.parentElement.style.display = 'block';
            }
            if (sdDefectPeriod) {
                sdDefectPeriod.parentElement.style.display = 'block';
            }
        }
    } else {
        // No selection - hide Bill Type and show default SD fields
        billTypeGroup.style.display = 'none';
        document.getElementById('bill-type').value = '';
        
        const nature = document.getElementById('deposit-nature').value;
        if (nature === 'SD') {
            if (sdCompletionDate) {
                sdCompletionDate.parentElement.style.display = 'block';
            }
            if (sdDefectPeriod) {
                sdDefectPeriod.parentElement.style.display = 'block';
            }
        }
    }
}

function saveDeposit() {
    const pan = document.getElementById('deposit-pan').value;
    const agencyName = document.getElementById('deposit-agency-name').value;
    const tenderNo = document.getElementById('deposit-tender-no').value;
    const nature = document.getElementById('deposit-nature').value;
    const billNo = document.getElementById('deposit-bill-no').value;
    const billDate = document.getElementById('deposit-bill-date').value;
    const tvNo = document.getElementById('deposit-tv-no').value;
    const tvDate = document.getElementById('deposit-tv-date').value;
    const creditAmount = document.getElementById('deposit-credit-amount').value;
    const challanNo = document.getElementById('deposit-challan-no').value;
    const challanDate = document.getElementById('deposit-challan-date').value;

    if (!pan || !tenderNo || !nature || !tvNo || !creditAmount || !challanNo) {
        showAlert('Please fill in all required fields', 'error');
        return;
    }

    const workCompleted = document.getElementById('work-completed').value;
    const billType = document.getElementById('bill-type').value;

    const deposit = {
        id: editingDepositId || Date.now(),
        pan: pan,
        agencyName: agencyName,
        tenderNo: tenderNo,
        nature: nature,
        billNo: billNo,
        billDate: billDate,
        workCompleted: workCompleted,
        billType: workCompleted === 'YES' ? 'Final' : (workCompleted === 'NO' ? billType : ''),
        tvNo: tvNo,
        tvDate: tvDate,
        creditAmount: parseFloat(creditAmount),
        challanNo: challanNo,
        challanDate: challanDate,
        emdSource: nature === 'EMD' ? document.getElementById('emd-source').value : '',
        completionDate: (nature === 'SD' && workCompleted === 'YES') ? document.getElementById('sd-completion-date').value : '',
        defectPeriod: (nature === 'SD' && workCompleted === 'YES') ? document.getElementById('sd-defect-period').value : ''
    };

    if (editingDepositId) {
        // Update existing deposit
        const index = deposits.findIndex(d => d.id === editingDepositId);
        if (index !== -1) {
            deposits[index] = deposit;
            showAlert('Deposit updated successfully', 'success');
        }
        editingDepositId = null;
    } else {
        // Add new deposit
        deposits.push(deposit);
        showAlert('Deposit saved successfully', 'success');
    }

    saveData();
    clearDepositForm();
    resetDepositForm();
}

function clearDepositForm() {
    document.getElementById('deposit-pan').value = '';
    document.getElementById('deposit-agency-name').value = '';
    document.getElementById('deposit-tender-no').value = '';
    document.getElementById('deposit-nature').value = '';
    document.getElementById('deposit-bill-no').value = '';
    document.getElementById('deposit-bill-date').value = '';
    document.getElementById('deposit-tv-no').value = '';
    document.getElementById('deposit-tv-date').value = '';
    document.getElementById('deposit-credit-amount').value = '';
    document.getElementById('deposit-challan-no').value = '';
    document.getElementById('deposit-challan-date').value = '';
    document.getElementById('emd-source').value = '';
    document.getElementById('sd-completion-date').value = '';
    document.getElementById('sd-defect-period').value = '';
    document.getElementById('work-completed').value = '';
    document.getElementById('bill-type').value = '';
    
    document.getElementById('emd-fields').classList.add('hidden');
    document.getElementById('sd-fields').classList.add('hidden');
    document.getElementById('bill-type-group').style.display = 'none';
    document.getElementById('deposit-bill-no').disabled = false;
    document.getElementById('deposit-bill-date').disabled = false;
}

function resetDepositForm() {
    // Reset save button
    const saveButton = document.querySelector('#record-deposits .btn[onclick="saveDeposit()"]');
    if (saveButton) {
        saveButton.textContent = 'Save Deposit';
        saveButton.className = 'btn';
    }
    
    // Remove cancel button if exists
    const cancelButton = document.querySelector('#record-deposits .btn[onclick="cancelDepositEdit()"]');
    if (cancelButton) {
        cancelButton.remove();
    }
    
    editingDepositId = null;
}

function cancelDepositEdit() {
    clearDepositForm();
    resetDepositForm();
    showAlert('Edit cancelled', 'info');
}

// Payment management
function updatePaymentAgencyName() {
    const pan = document.getElementById('payment-pan').value;
    const agency = agencies.find(a => a.pan === pan);
    const nameField = document.getElementById('payment-agency-name');
    
    nameField.value = agency ? agency.name : '';
    updateTenderDropdown();
}

function updateTenderDropdown() {
    const pan = document.getElementById('payment-pan').value;
    const tenderSelect = document.getElementById('payment-tender-no');
    
    tenderSelect.innerHTML = '<option value="">Select Tender Number</option>';
    
    const agencyDeposits = deposits.filter(d => d.pan === pan);
    const uniqueTenders = [...new Set(agencyDeposits.map(d => d.tenderNo))];
    
    uniqueTenders.forEach(tender => {
        const option = new Option(tender, tender);
        tenderSelect.add(option);
    });
    
    // Reset challan selection when tender dropdown changes
    loadExistingChallans();
}

function loadExistingChallans() {
    const pan = document.getElementById('payment-pan').value;
    const tenderNo = document.getElementById('payment-tender-no').value;
    
    if (!pan || !tenderNo) {
        hideAvailableChallans();
        return;
    }
    
    // Find all deposits for the selected tender
    const tenderDeposits = deposits.filter(d => d.pan === pan && d.tenderNo === tenderNo);
    
    if (tenderDeposits.length === 0) {
        hideAvailableChallans();
        return;
    }
    
    // Populate available challans
    const availableChallansList = document.getElementById('available-challans-list');
    availableChallansList.innerHTML = '';
    
    tenderDeposits.forEach((deposit, index) => {
        const challanOption = document.createElement('div');
        challanOption.className = 'challan-option';
        challanOption.innerHTML = `
            <label>
                <input type="checkbox" class="challan-checkbox" value="${index}" data-challan-no="${deposit.challanNo}" data-challan-date="${deposit.challanDate}">
                <div class="challan-details">
                    <div class="challan-number">${deposit.challanNo}</div>
                    <div class="challan-date">Date: ${deposit.challanDate}</div>
                </div>
            </label>
        `;
        availableChallansList.appendChild(challanOption);
    });
    
    // Show the "Select from Available Challans" button
    const showButton = document.querySelector('#manual-challan-section .btn[onclick="showAvailableChallans()"]');
    if (showButton) {
        showButton.style.display = 'inline-block';
    }
}

function showAvailableChallans() {
    document.getElementById('available-challans-section').classList.remove('hidden');
    document.getElementById('manual-challan-section').classList.add('hidden');
}

function hideAvailableChallans() {
    document.getElementById('available-challans-section').classList.add('hidden');
    document.getElementById('manual-challan-section').classList.remove('hidden');
}

function addSelectedChallans() {
    const checkboxes = document.querySelectorAll('#available-challans-list input[type="checkbox"]:checked');
    
    if (checkboxes.length === 0) {
        showAlert('Please select at least one challan', 'error');
        return;
    }
    
    // Clear existing challan container
    const challanContainer = document.getElementById('challan-container');
    challanContainer.innerHTML = '';
    
    // Add selected challans
    checkboxes.forEach((checkbox, index) => {
        const challanNo = checkbox.dataset.challanNo;
        const challanDate = checkbox.dataset.challanDate;
        
        const challanEntry = document.createElement('div');
        challanEntry.className = 'challan-entry';
        challanEntry.innerHTML = `
            <div class="form-group">
                <label for="payment-challan-no-${index + 1}">Treasury Challan Number</label>
                <input type="text" id="payment-challan-no-${index + 1}" placeholder="Enter Challan Number" value="${challanNo}">
            </div>
            <div class="form-group">
                <label for="payment-challan-date-${index + 1}">Challan Date</label>
                <input type="date" id="payment-challan-date-${index + 1}" value="${challanDate}">
            </div>
            <div class="form-group">
                <label for="payment-challan-amount-${index + 1}">Payment amount against Challan (${index + 1})</label>
                <input type="number" id="payment-challan-amount-${index + 1}" placeholder="Enter Payment Amount" onchange="calculateTotalPayment()">
            </div>
            ${index === 0 ? '<button class="btn btn-secondary" onclick="addChallanEntry()">Add Challan</button>' : '<button class="btn btn-danger" onclick="removeChallanEntry(this)">Remove</button>'}
        `;
        challanContainer.appendChild(challanEntry);
    });
    
    // Update challan counter
    challanCounter = checkboxes.length;
    
    // Hide available challans section
    hideAvailableChallans();
    
    showAlert(`${checkboxes.length} challan(s) added successfully`, 'success');
}

function addChallanEntry() {
    challanCounter++;
    const container = document.getElementById('challan-container');
    
    const challanEntry = document.createElement('div');
    challanEntry.className = 'challan-entry';
    challanEntry.innerHTML = `
        <div class="form-group">
            <label for="payment-challan-no-${challanCounter}">Treasury Challan Number</label>
            <input type="text" id="payment-challan-no-${challanCounter}" placeholder="Enter Challan Number">
        </div>
        <div class="form-group">
            <label for="payment-challan-date-${challanCounter}">Challan Date</label>
            <input type="date" id="payment-challan-date-${challanCounter}">
        </div>
        <div class="form-group">
            <label for="payment-challan-amount-${challanCounter}">Payment amount against Challan (${challanCounter})</label>
            <input type="number" id="payment-challan-amount-${challanCounter}" placeholder="Enter Payment Amount" onchange="calculateTotalPayment()">
        </div>
        <button class="btn btn-danger" onclick="removeChallanEntry(this)">Remove</button>
    `;
    
    container.appendChild(challanEntry);
}

function removeChallanEntry(button) {
    button.parentElement.remove();
    calculateTotalPayment();
}

function calculateTotalPayment() {
    const challanAmountInputs = document.querySelectorAll('input[id^="payment-challan-amount-"]');
    let total = 0;
    
    challanAmountInputs.forEach(input => {
        const value = parseFloat(input.value) || 0;
        total += value;
    });
    
    document.getElementById('payment-amount').value = total;
}

function savePayment() {
    const pan = document.getElementById('payment-pan').value;
    const agencyName = document.getElementById('payment-agency-name').value;
    const tenderNo = document.getElementById('payment-tender-no').value;
    const paymentAmount = document.getElementById('payment-amount').value;
    const tvNo = document.getElementById('payment-tv-no').value;
    const tvDate = document.getElementById('payment-tv-date').value;

    if (!pan || !tenderNo || !paymentAmount || !tvNo) {
        showAlert('Please fill in all required fields', 'error');
        return;
    }

    // Collect all challan entries
    const challanEntries = [];
    const challanContainer = document.getElementById('challan-container');
    const challanInputs = challanContainer.querySelectorAll('.challan-entry');
    
    challanInputs.forEach((entry, index) => {
        const challanNo = entry.querySelector(`input[id*="challan-no"]`).value;
        const challanDate = entry.querySelector(`input[id*="challan-date"]`).value;
        const challanAmount = entry.querySelector(`input[id*="challan-amount"]`).value;
        
        if (challanNo && challanDate && challanAmount) {
            challanEntries.push({
                challanNo: challanNo,
                challanDate: challanDate,
                challanAmount: parseFloat(challanAmount)
            });
        }
    });

    if (challanEntries.length === 0) {
        showAlert('Please add at least one challan entry with all required fields', 'error');
        return;
    }

    const payment = {
        id: editingPaymentId || Date.now(),
        pan: pan,
        agencyName: agencyName,
        tenderNo: tenderNo,
        paymentAmount: parseFloat(paymentAmount),
        tvNo: tvNo,
        tvDate: tvDate,
        challans: challanEntries
    };

    if (editingPaymentId) {
        // Update existing payment
        const index = payments.findIndex(p => p.id === editingPaymentId);
        if (index !== -1) {
            payments[index] = payment;
            showAlert('Payment updated successfully', 'success');
        }
        editingPaymentId = null;
    } else {
        // Add new payment
        payments.push(payment);
        showAlert('Payment saved successfully', 'success');
    }

    saveData();
    clearPaymentForm();
    resetPaymentForm();
}

function clearPaymentForm() {
    document.getElementById('payment-pan').value = '';
    document.getElementById('payment-agency-name').value = '';
    document.getElementById('payment-tender-no').value = '';
    document.getElementById('payment-amount').value = '';
    document.getElementById('payment-tv-no').value = '';
    document.getElementById('payment-tv-date').value = '';
    
    // Reset challan container
    const container = document.getElementById('challan-container');
    container.innerHTML = `
        <div class="challan-entry">
            <div class="form-group">
                <label for="payment-challan-no-1">Treasury Challan Number</label>
                <input type="text" id="payment-challan-no-1" placeholder="Enter Challan Number">
            </div>
            <div class="form-group">
                <label for="payment-challan-date-1">Challan Date</label>
                <input type="date" id="payment-challan-date-1">
            </div>
            <div class="form-group">
                <label for="payment-challan-amount-1">Payment amount against Challan (1)</label>
                <input type="number" id="payment-challan-amount-1" placeholder="Enter Payment Amount" onchange="calculateTotalPayment()">
            </div>
            <button class="btn btn-secondary" onclick="addChallanEntry()">Add Challan</button>
        </div>
    `;
    challanCounter = 1;
    
    // Hide available challans section and show manual entry
    hideAvailableChallans();
    
    // Hide the "Select from Available Challans" button
    const showButton = document.querySelector('#manual-challan-section .btn[onclick="showAvailableChallans()"]');
    if (showButton) {
        showButton.style.display = 'none';
    }
}

function resetPaymentForm() {
    // Reset save button
    const saveButton = document.querySelector('#record-payments .btn[onclick="savePayment()"]');
    if (saveButton) {
        saveButton.textContent = 'Save Payment';
        saveButton.className = 'btn';
    }
    
    // Remove cancel button if exists
    const cancelButton = document.querySelector('#record-payments .btn[onclick="cancelPaymentEdit()"]');
    if (cancelButton) {
        cancelButton.remove();
    }
    
    editingPaymentId = null;
}

function cancelPaymentEdit() {
    clearPaymentForm();
    resetPaymentForm();
    showAlert('Edit cancelled', 'info');
}

// View records
function refreshRecordTables() {
    refreshDepositRecords();
    refreshPaymentRecords();
}

function refreshDepositRecords() {
    const tbody = document.getElementById('deposit-records-tbody');
    tbody.innerHTML = '';

    deposits.forEach((deposit, index) => {
        const row = tbody.insertRow();
        row.innerHTML = `
            <td>${index + 1}</td>
            <td>${deposit.agencyName}</td>
            <td>${deposit.tenderNo}</td>
            <td>${deposit.billType || 'N/A'}</td>
            <td>${deposit.nature}</td>
            <td>${deposit.tvNo}</td>
            <td>${deposit.challanNo}</td>
            <td>${deposit.challanDate}</td>
            <td>₹${deposit.creditAmount.toLocaleString()}</td>
            <td>
                <button class="btn btn-secondary" onclick="editDeposit(${deposit.id})">Edit</button>
                <button class="btn btn-danger" onclick="deleteDeposit(${deposit.id})">Delete</button>
            </td>
        `;
    });
}

function refreshPaymentRecords() {
    const tbody = document.getElementById('payment-records-tbody');
    tbody.innerHTML = '';

    payments.forEach((payment, index) => {
        payment.challans.forEach((challan, challanIndex) => {
            const row = tbody.insertRow();
            row.innerHTML = `
                <td>${index + 1}.${challanIndex + 1}</td>
                <td>${payment.agencyName}</td>
                <td>${payment.tenderNo}</td>
                <td>${challan.challanNo}</td>
                <td>${challan.challanDate}</td>
                <td>₹${(challan.challanAmount || 0).toLocaleString()}</td>
                <td>${payment.tvNo}</td>
                <td>${payment.tvDate}</td>
                <td>
                    <button class="btn btn-secondary" onclick="editPayment(${payment.id})">Edit</button>
                    <button class="btn btn-danger" onclick="deletePayment(${payment.id})">Delete</button>
                </td>
            `;
        });
    });
}

function searchDeposits() {
    const searchTerm = document.getElementById('deposit-search').value.toLowerCase();
    const tbody = document.getElementById('deposit-records-tbody');
    const rows = tbody.getElementsByTagName('tr');

    for (let row of rows) {
        const text = row.textContent.toLowerCase();
        row.style.display = text.includes(searchTerm) ? '' : 'none';
    }
}

function searchPayments() {
    const searchTerm = document.getElementById('payment-search').value.toLowerCase();
    const tbody = document.getElementById('payment-records-tbody');
    const rows = tbody.getElementsByTagName('tr');

    for (let row of rows) {
        const text = row.textContent.toLowerCase();
        row.style.display = text.includes(searchTerm) ? '' : 'none';
    }
}

function editDeposit(id) {
    const deposit = deposits.find(d => d.id === id);
    if (!deposit) {
        showAlert('Deposit not found', 'error');
        return;
    }

    // Set editing mode
    editingDepositId = id;
    
    // Switch to Record Deposits tab
    openTab('record-deposits');
    
    // Populate form fields
    document.getElementById('deposit-pan').value = deposit.pan;
    document.getElementById('deposit-agency-name').value = deposit.agencyName;
    document.getElementById('deposit-tender-no').value = deposit.tenderNo;
    document.getElementById('deposit-nature').value = deposit.nature;
    document.getElementById('deposit-bill-no').value = deposit.billNo;
    document.getElementById('deposit-bill-date').value = deposit.billDate;
    document.getElementById('work-completed').value = deposit.workCompleted || '';
    document.getElementById('bill-type').value = deposit.billType || '';
    document.getElementById('deposit-tv-no').value = deposit.tvNo;
    document.getElementById('deposit-tv-date').value = deposit.tvDate;
    document.getElementById('deposit-credit-amount').value = deposit.creditAmount;
    document.getElementById('deposit-challan-no').value = deposit.challanNo;
    document.getElementById('deposit-challan-date').value = deposit.challanDate;
    
    // Handle nature-specific fields
    toggleDepositFields();
    
    if (deposit.nature === 'EMD') {
        document.getElementById('emd-source').value = deposit.emdSource;
    } else if (deposit.nature === 'SD') {
        document.getElementById('sd-completion-date').value = deposit.completionDate;
        document.getElementById('sd-defect-period').value = deposit.defectPeriod;
    }
    
    // Handle work completion fields
    toggleWorkCompletionFields();
    
    // Update save button text
    const saveButton = document.querySelector('#record-deposits .btn[onclick="saveDeposit()"]');
    saveButton.textContent = 'Update Deposit';
    saveButton.className = 'btn btn-success';
    
    // Add cancel button if not exists
    if (!document.querySelector('#record-deposits .btn[onclick="cancelDepositEdit()"]')) {
        const cancelButton = document.createElement('button');
        cancelButton.className = 'btn btn-secondary';
        cancelButton.textContent = 'Cancel Edit';
        cancelButton.onclick = cancelDepositEdit;
        saveButton.parentNode.insertBefore(cancelButton, saveButton.nextSibling);
    }
    
    showAlert('Editing deposit record. Make your changes and click "Update Deposit".', 'info');
}

function deleteDeposit(id) {
    if (confirm('Are you sure you want to delete this deposit?')) {
        deposits = deposits.filter(d => d.id !== id);
        saveData();
        refreshDepositRecords();
        showAlert('Deposit deleted successfully', 'success');
    }
}

function editPayment(id) {
    const payment = payments.find(p => p.id === id);
    if (!payment) {
        showAlert('Payment not found', 'error');
        return;
    }

    // Set editing mode
    editingPaymentId = id;
    
    // Switch to Record Payments tab
    openTab('record-payments');
    
    // Populate form fields
    document.getElementById('payment-pan').value = payment.pan;
    document.getElementById('payment-agency-name').value = payment.agencyName;
    document.getElementById('payment-tender-no').innerHTML = `<option value="${payment.tenderNo}">${payment.tenderNo}</option>`;
    document.getElementById('payment-tender-no').value = payment.tenderNo;
    document.getElementById('payment-amount').value = payment.paymentAmount;
    document.getElementById('payment-tv-no').value = payment.tvNo;
    document.getElementById('payment-tv-date').value = payment.tvDate;
    
    // Populate challan entries
    const challanContainer = document.getElementById('challan-container');
    challanContainer.innerHTML = '';
    
    payment.challans.forEach((challan, index) => {
        const challanEntry = document.createElement('div');
        challanEntry.className = 'challan-entry';
        challanEntry.innerHTML = `
            <div class="form-group">
                <label for="payment-challan-no-${index + 1}">Treasury Challan Number</label>
                <input type="text" id="payment-challan-no-${index + 1}" placeholder="Enter Challan Number" value="${challan.challanNo}">
            </div>
            <div class="form-group">
                <label for="payment-challan-date-${index + 1}">Challan Date</label>
                <input type="date" id="payment-challan-date-${index + 1}" value="${challan.challanDate}">
            </div>
            <div class="form-group">
                <label for="payment-challan-amount-${index + 1}">Payment amount against Challan (${index + 1})</label>
                <input type="number" id="payment-challan-amount-${index + 1}" placeholder="Enter Payment Amount" value="${challan.challanAmount || ''}" onchange="calculateTotalPayment()">
            </div>
            ${index === 0 ? '<button class="btn btn-secondary" onclick="addChallanEntry()">Add Challan</button>' : '<button class="btn btn-danger" onclick="removeChallanEntry(this)">Remove</button>'}
        `;
        challanContainer.appendChild(challanEntry);
    });
    
    challanCounter = payment.challans.length;
    
    // Calculate total payment amount
    setTimeout(() => {
        calculateTotalPayment();
    }, 100);
    
    // Update save button text
    const saveButton = document.querySelector('#record-payments .btn[onclick="savePayment()"]');
    saveButton.textContent = 'Update Payment';
    saveButton.className = 'btn btn-success';
    
    // Add cancel button if not exists
    if (!document.querySelector('#record-payments .btn[onclick="cancelPaymentEdit()"]')) {
        const cancelButton = document.createElement('button');
        cancelButton.className = 'btn btn-secondary';
        cancelButton.textContent = 'Cancel Edit';
        cancelButton.onclick = cancelPaymentEdit;
        saveButton.parentNode.insertBefore(cancelButton, saveButton.nextSibling);
    }
    
    showAlert('Editing payment record. Make your changes and click "Update Payment".', 'info');
}

function deletePayment(id) {
    if (confirm('Are you sure you want to delete this payment?')) {
        payments = payments.filter(p => p.id !== id);
        saveData();
        refreshPaymentRecords();
        showAlert('Payment deleted successfully', 'success');
    }
}

// Export functions
function exportDeposits() {
    const csv = generateDepositCSV();
    downloadCSV(csv, 'deposits.csv');
    showAlert('Deposits exported successfully', 'success');
}

function exportPayments() {
    const csv = generatePaymentCSV();
    downloadCSV(csv, 'payments.csv');
    showAlert('Payments exported successfully', 'success');
}

function generateDepositCSV() {
    const headers = ['Sl. No.', 'Agency Name', 'Tender No.', 'Type', 'TV Number', 'Treasury Challan No.', 'Challan Date', 'Amount'];
    const rows = deposits.map((deposit, index) => [
        index + 1,
        deposit.agencyName,
        deposit.tenderNo,
        deposit.nature,
        deposit.tvNo,
        deposit.challanNo,
        deposit.challanDate,
        deposit.creditAmount
    ]);
    
    return [headers, ...rows].map(row => row.join(',')).join('\n');
}

function generatePaymentCSV() {
    const headers = ['Sl. No.', 'Agency Name', 'Tender No.', 'Treasury Challan No.', 'Challan Date', 'Amount', 'TV Number', 'TV Date'];
    const rows = [];
    
    payments.forEach((payment, index) => {
        payment.challans.forEach((challan, challanIndex) => {
            rows.push([
                `${index + 1}.${challanIndex + 1}`,
                payment.agencyName,
                payment.tenderNo,
                challan.challanNo,
                challan.challanDate,
                payment.paymentAmount,
                payment.tvNo,
                payment.tvDate
            ]);
        });
    });
    
    return [headers, ...rows].map(row => row.join(',')).join('\n');
}

function downloadCSV(csv, filename) {
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    window.URL.revokeObjectURL(url);
}

// Handle year selection to auto-populate date ranges
function handleYearSelection() {
    const yearSelect = document.getElementById('report-year');
    const fromDateInput = document.getElementById('report-from-date');
    const toDateInput = document.getElementById('report-to-date');
    const selectedYear = yearSelect.value;

    if (selectedYear === 'before-2015') {
        // Set date range for "Before 2015-16" (up to March 31, 2015)
        fromDateInput.value = '2000-04-01'; // Start from a reasonable old date
        toDateInput.value = '2015-03-31';   // End before 2015-16 financial year
    } else if (selectedYear && selectedYear !== '') {
        // Set financial year dates (April 1 to March 31)
        const startYear = parseInt(selectedYear);
        const endYear = startYear + 1;
        fromDateInput.value = `${startYear}-04-01`;
        toDateInput.value = `${endYear}-03-31`;
    }
    // If no year selected, leave date fields as they are
}

// Reports
function toggleReportFields() {
    const reportType = document.getElementById('report-type').value;
    const agencyGroup = document.getElementById('agency-select-group');
    
    if (reportType === 'AGENCY') {
        agencyGroup.style.display = 'block';
    } else {
        agencyGroup.style.display = 'none';
    }
}

function generateReport() {
    const reportType = document.getElementById('report-type').value;
    const selectedAgency = document.getElementById('report-agency').value;
    const year = document.getElementById('report-year').value;
    const fromDate = document.getElementById('report-from-date').value;
    const toDate = document.getElementById('report-to-date').value;
    const format = document.getElementById('report-format').value;

    if (!fromDate || !toDate) {
        showAlert('Please select date range', 'error');
        return;
    }

    let filteredDeposits = deposits;
    let filteredPayments = payments;

    // Filter by agency if selected
    if (reportType === 'AGENCY' && selectedAgency) {
        filteredDeposits = deposits.filter(d => d.pan === selectedAgency);
        filteredPayments = payments.filter(p => p.pan === selectedAgency);
    }

    // Filter by date range
    filteredDeposits = filteredDeposits.filter(d => {
        const depositDate = new Date(d.challanDate);
        return depositDate >= new Date(fromDate) && depositDate <= new Date(toDate);
    });

    filteredPayments = filteredPayments.filter(p => {
        const paymentDate = new Date(p.tvDate);
        return paymentDate >= new Date(fromDate) && paymentDate <= new Date(toDate);
    });

    if (format === 'ABSTRACT') {
        generateAbstractReport(filteredDeposits, filteredPayments, fromDate);
    } else {
        generateDetailedReport(filteredDeposits, filteredPayments);
    }

    document.getElementById('report-results').classList.remove('hidden');
}

function generateAbstractReport(filteredDeposits, filteredPayments, fromDate) {
    // Calculate opening balance (deposits before date range)
    const openingDeposits = deposits.filter(d => new Date(d.challanDate) < new Date(fromDate));
    const openingPayments = payments.filter(p => new Date(p.tvDate) < new Date(fromDate));
    
    const openingBalance = openingDeposits.reduce((sum, d) => sum + d.creditAmount, 0) - 
                         openingPayments.reduce((sum, p) => sum + p.paymentAmount, 0);

    const totalCredit = filteredDeposits.reduce((sum, d) => sum + d.creditAmount, 0);
    const totalPayment = filteredPayments.reduce((sum, p) => sum + p.paymentAmount, 0);
    const balance = openingBalance + totalCredit - totalPayment;

    // Update summary cards
    document.getElementById('opening-balance').textContent = `₹${openingBalance.toLocaleString()}`;
    document.getElementById('total-credit').textContent = `₹${totalCredit.toLocaleString()}`;
    document.getElementById('total-payment').textContent = `₹${totalPayment.toLocaleString()}`;
    document.getElementById('closing-balance').textContent = `₹${balance.toLocaleString()}`;

    // Generate abstract table
    const thead = document.getElementById('report-thead');
    const tbody = document.getElementById('report-tbody');
    
    thead.innerHTML = `
        <tr>
            <th>Opening Balance</th>
            <th>Credit Amount</th>
            <th>Payment Amount</th>
            <th>Closing Balance</th>
        </tr>
    `;

    tbody.innerHTML = `
        <tr>
            <td>₹${openingBalance.toLocaleString()}</td>
            <td>₹${totalCredit.toLocaleString()}</td>
            <td>₹${totalPayment.toLocaleString()}</td>
            <td>₹${balance.toLocaleString()}</td>
        </tr>
    `;
    
    // Add data attributes for export purposes
    const abstractRow = tbody.rows[0];
    abstractRow.cells[0].setAttribute('data-export-value', openingBalance);
    abstractRow.cells[1].setAttribute('data-export-value', totalCredit);
    abstractRow.cells[2].setAttribute('data-export-value', totalPayment);
    abstractRow.cells[3].setAttribute('data-export-value', balance);
}

function generateDetailedReport(filteredDeposits, filteredPayments) {
    const thead = document.getElementById('report-thead');
    const tbody = document.getElementById('report-tbody');
    
    thead.innerHTML = `
        <tr>
            <th>Sl. No.</th>
            <th>Agency Name</th>
            <th>Tender No.</th>
            <th>Credit Amount</th>
            <th>Payment Amount</th>
            <th>T.V. No.</th>
            <th>Date</th>
        </tr>
    `;

    tbody.innerHTML = '';
    let totalCredit = 0;
    let totalPayment = 0;
    
    // Combine all records with type and date information
    const allRecords = [];
    
    // Add deposit records
    filteredDeposits.forEach(deposit => {
        allRecords.push({
            type: 'DEPOSIT',
            agencyName: deposit.agencyName,
            tenderNo: deposit.tenderNo,
            depositType: deposit.nature, // EMD/SD
            creditAmount: deposit.creditAmount,
            paymentAmount: 0,
            tvNo: deposit.tvNo,
            tvDate: deposit.tvDate,
            displayDate: deposit.challanDate,
            challanNo: deposit.challanNo || '' // Add challan number for export
        });
        totalCredit += deposit.creditAmount;
    });

    // Add payment records
    filteredPayments.forEach(payment => {
        allRecords.push({
            type: 'PAYMENT',
            agencyName: payment.agencyName,
            tenderNo: payment.tenderNo,
            depositType: '', // Not applicable for payments
            creditAmount: 0,
            paymentAmount: payment.paymentAmount,
            tvNo: payment.tvNo,
            tvDate: payment.tvDate,
            displayDate: payment.tvDate,
            challanNo: '' // Empty for payments
        });
        totalPayment += payment.paymentAmount;
    });

    // Sort all records by TV date chronologically
    allRecords.sort((a, b) => {
        const dateA = new Date(a.tvDate || a.displayDate);
        const dateB = new Date(b.tvDate || b.displayDate);
        return dateA - dateB;
    });

    // Add sorted records to table
    allRecords.forEach((record, index) => {
        const row = tbody.insertRow();
        row.innerHTML = `
            <td>${index + 1}</td>
            <td>${record.agencyName}</td>
            <td>${record.tenderNo}</td>
            <td>${record.creditAmount > 0 ? '₹' + record.creditAmount.toLocaleString() : '-'}</td>
            <td>${record.paymentAmount > 0 ? '₹' + record.paymentAmount.toLocaleString() : '-'}</td>
            <td>${record.tvNo}</td>
            <td>${record.displayDate}</td>
        `;
        
        // Add data attributes for export purposes (including hidden data)
        row.cells[3].setAttribute('data-export-value', record.creditAmount > 0 ? record.creditAmount : '0');
        row.cells[4].setAttribute('data-export-value', record.paymentAmount > 0 ? record.paymentAmount : '0');
        row.setAttribute('data-challan-no', record.challanNo || ''); // Hidden challan number
        row.setAttribute('data-type', record.type === 'DEPOSIT' ? record.depositType : 'PAYMENT'); // Hidden type
    });

    // Add total row
    const totalRow = tbody.insertRow();
    totalRow.innerHTML = `
        <td></td>
        <td></td>
        <td><strong>Total</strong></td>
        <td><strong>₹${totalCredit.toLocaleString()}</strong></td>
        <td><strong>₹${totalPayment.toLocaleString()}</strong></td>
        <td></td>
        <td></td>
    `;
    
    // Add data attributes for export purposes
    totalRow.cells[3].setAttribute('data-export-value', totalCredit);
    totalRow.cells[4].setAttribute('data-export-value', totalPayment);
    totalRow.setAttribute('data-challan-no', ''); // Empty challan for total row
    totalRow.setAttribute('data-type', ''); // Empty type for total row

    // Update summary cards
    document.getElementById('total-credit').textContent = `₹${totalCredit.toLocaleString()}`;
    document.getElementById('total-payment').textContent = `₹${totalPayment.toLocaleString()}`;
    document.getElementById('closing-balance').textContent = `₹${(totalCredit - totalPayment).toLocaleString()}`;
}

function exportReport() {
    const table = document.getElementById('report-table');
    const csv = tableToCSV(table);
    const filename = `Security_Deposit_Report_${new Date().toISOString().split('T')[0]}.csv`;
    downloadCSV(csv, filename);
    showAlert('Report exported successfully as ' + filename, 'success');
}

function tableToCSV(table) {
    const rows = Array.from(table.rows);
    return rows.map((row, rowIndex) => {
        const cells = Array.from(row.cells);
        
        // Handle header row - add hidden columns
        if (rowIndex === 0) {
            const headerCells = cells.map(cell => cell.textContent.trim());
            // Insert Treasury Challan No. after Tender No. (index 2)
            headerCells.splice(3, 0, 'Treasury Challan No.');
            // Insert Type after Treasury Challan No. (index 3, now 4)
            headerCells.splice(4, 0, 'Type');
            return headerCells.join(',');
        }
        
        // Handle data rows
        const csvCells = cells.map((cell, cellIndex) => {
            let cellText = cell.textContent.trim();
            
            // Use data-export-value if available (for amount columns)
            if (cell.hasAttribute('data-export-value')) {
                return cell.getAttribute('data-export-value');
            }
            
            // Handle amount columns (Credit Amount = column 3, Payment Amount = column 4 in new structure)
            if (cellIndex === 3 || cellIndex === 4) {
                if (cellText === '-') {
                    return '0';
                }
                if (cellText.includes('₹')) {
                    // Remove ₹ symbol, commas, and any text formatting
                    let numericValue = cellText.replace(/₹|,|\*|\s/g, '');
                    // Handle Total row special formatting
                    if (cellText.includes('Total')) {
                        numericValue = numericValue.replace(/Total/g, '');
                    }
                    return numericValue.trim();
                }
                return cellText;
            }
            
            // For Total row, handle the "Total" text cell
            if (cellText.includes('Total')) {
                return 'Total';
            }
            
            // Regular text cells - wrap in quotes if containing commas
            if (cellText.includes(',') || cellText.includes('"') || cellText.includes('\n')) {
                cellText = '"' + cellText.replace(/"/g, '""') + '"';
            }
            
            return cellText;
        });
        
        // Insert hidden columns data
        // Insert Treasury Challan No. after Tender No. (index 2)
        const challanNo = row.getAttribute('data-challan-no') || '';
        csvCells.splice(3, 0, challanNo);
        
        // Insert Type after Treasury Challan No. (index 3, now 4)
        const typeData = row.getAttribute('data-type') || '';
        csvCells.splice(4, 0, typeData);
        
        return csvCells.join(',');
    }).join('\n');
}

// Utility functions
function showAlert(message, type) {
    // Create alert element
    const alert = document.createElement('div');
    alert.className = `alert alert-${type}`;
    alert.textContent = message;
    
    // Insert at the beginning of the active tab
    const activeTab = document.querySelector('.tab-content.active');
    activeTab.insertBefore(alert, activeTab.firstChild);
    
    // Remove alert after 3 seconds
    setTimeout(() => {
        alert.remove();
    }, 3000);
}

function refreshTables() {
    refreshAgencyTable();
    refreshRecordTables();
}

// Initialize application when page loads
window.onload = function() {
    init();
};