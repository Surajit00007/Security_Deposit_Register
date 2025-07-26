// Firebase is already initialized in index.html
// Using global firebase, auth, db variables

// Global variables for current user
let currentUser = null;
let userDataRef = null;
let userDataListener = null; // For real-time sync

// ===== AUTHENTICATION FUNCTIONS =====

function registerUser() {
  const email = document.getElementById("reg-email").value.trim();
  const password = document.getElementById("reg-password").value;

  if (!email || !password) {
    updateAuthStatus("⚠ Please fill in all fields", "error");
    return;
  }

  updateAuthStatus("⏳ Creating account...", "info");

  auth.createUserWithEmailAndPassword(email, password)
    .then((userCredential) => {
      updateAuthStatus("✅ Account created successfully! Welcome!", "success");
      clearAuthForms();
      // Initialize user data in Firestore
      initializeUserData(userCredential.user.uid);
    })
    .catch((error) => {
      updateAuthStatus("❌ Registration failed: " + error.message, "error");
    });
}

function loginUser() {
  const email = document.getElementById("login-email").value.trim();
  const password = document.getElementById("login-password").value;

  if (!email || !password) {
    updateAuthStatus("⚠ Please fill in all fields", "error");
    return;
  }

  updateAuthStatus("⏳ Signing in...", "info");

  auth.signInWithEmailAndPassword(email, password)
    .then((userCredential) => {
      updateAuthStatus("✅ Welcome back!", "success");
      clearAuthForms();
      // Load user data from Firestore with real-time sync
      loadUserDataFromFirestore(userCredential.user.uid);
    })
    .catch((error) => {
      updateAuthStatus("❌ Sign in failed: " + error.message, "error");
    });
}

function logoutUser() {
  updateAuthStatus("⏳ Signing out...", "info");
  
  auth.signOut().then(() => {
    updateAuthStatus("✅ You have been signed out successfully", "info");
    // Clear local data and stop real-time listener
    clearUserData();
  }).catch((error) => {
    updateAuthStatus("❌ Sign out failed: " + error.message, "error");
  });
}

// Helper functions for authentication
function updateAuthStatus(message, type = "info") {
  const statusElement = document.getElementById("auth-status");
  if (statusElement) {
    statusElement.textContent = message;
    statusElement.className = "auth-status-message " + type;
  }
}

function clearAuthForms() {
  document.getElementById("reg-email").value = "";
  document.getElementById("reg-password").value = "";
  document.getElementById("login-email").value = "";
  document.getElementById("login-password").value = "";
}

// Setup event listeners for authentication forms (buttons + keyboard)
function setupAuthEventListeners() {
    // Button click handlers - Modern approach using addEventListener
    document.getElementById('register-btn').addEventListener('click', registerUser);
    document.getElementById('login-btn').addEventListener('click', loginUser);
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
    
    // Password reset - Enter key support
    setupPasswordResetEventListeners();
}

// ===== END AUTHENTICATION FUNCTIONS =====

// Data storage
let agencies = [];
let deposits = [];
let payments = [];
let challanCounter = 1;
let editingDepositId = null;
let editingPaymentId = null;

// Initialize application
function init() {
    setupAuthEventListeners();
    populateYearDropdown();
    
    // Check if user is already authenticated
    auth.onAuthStateChanged((user) => {
        if (user) {
            document.getElementById("auth-status").innerText = `✅ Welcome, ${user.email}`;
            // Update header status
            const headerStatus = document.getElementById('auth-status-header');
            if (headerStatus) {
                headerStatus.textContent = `✅ Welcome, ${user.email}`;
                headerStatus.style.color = '#28a745';
            }
            // Load user data when authenticated with real-time sync
            loadUserDataFromFirestore(user.uid);
        } else {
            document.getElementById("auth-status").innerText = "Please login to access your data.";
            // Clear data when not authenticated
            clearUserData();
        }
    });
}

// ===== FIRESTORE INTEGRATION FUNCTIONS =====

// Initialize user data in Firestore for new users
async function initializeUserData(userId) {
  try {
    const userDoc = await db.collection('users').doc(userId).get();
    if (!userDoc.exists) {
      // Create initial user document
      await db.collection('users').doc(userId).set({
        agencies: [],
        deposits: [],
        payments: [],
        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
        lastUpdated: firebase.firestore.FieldValue.serverTimestamp()
      });
      console.log('User data initialized in Firestore');
    }
    // Set up user data reference
    currentUser = userId;
    userDataRef = db.collection('users').doc(userId);
    // Load user data with real-time sync
    await loadUserDataFromFirestore(userId);
  } catch (error) {
    console.error('Error initializing user data:', error);
    showAlert('Error initializing user data: ' + error.message, 'error');
  }
}

// Load user data from Firestore with real-time sync
async function loadUserDataFromFirestore(userId) {
  try {
    currentUser = userId;
    userDataRef = db.collection('users').doc(userId);
    
    // First, check if document exists
    const userDoc = await userDataRef.get();
    if (!userDoc.exists) {
      // Initialize if document doesn't exist
      await initializeUserData(userId);
      return;
    }
    
    // Set up real-time listener for live sync
    setupRealtimeListener(userId);
    
  } catch (error) {
    console.error('Error loading user data:', error);
    if (error.code === 'permission-denied') {
      showAlert('Permission denied. Please check your authentication.', 'error');
    } else if (error.code === 'unavailable') {
      showAlert('Network error. Please check your internet connection.', 'error');
    } else {
      showAlert('Error loading user data: ' + error.message, 'error');
    }
  }
}

// Set up real-time listener for live data synchronization
function setupRealtimeListener(userId) {
  // Remove existing listener if any
  if (userDataListener) {
    userDataListener();
    userDataListener = null;
  }
  
  // Set up new real-time listener
  userDataListener = db.collection('users').doc(userId).onSnapshot((doc) => {
    if (doc.exists) {
      const userData = doc.data();
      
      // Update local data arrays
      agencies = userData.agencies || [];
      deposits = userData.deposits || [];
      payments = userData.payments || [];
      
      // Refresh UI immediately with new data
      populateDropdowns();
      refreshTables();
      
      console.log('User data synced in real-time from Firestore');
      
      // Show sync indicator
      const headerStatus = document.getElementById('auth-status-header');
      if (headerStatus && currentUser) {
        const userEmail = auth.currentUser ? auth.currentUser.email : 'User';
        headerStatus.textContent = `✅ Welcome, ${userEmail} (✅ Synced)`;
        headerStatus.style.color = '#28a745';
        
        // Remove sync indicator after 2 seconds
        setTimeout(() => {
          if (headerStatus && currentUser) {
            headerStatus.textContent = `✅ Welcome, ${userEmail}`;
          }
        }, 2000);
      }
    } else {
      console.log('User document does not exist');
      // Initialize user data if document doesn't exist
      initializeUserData(userId);
    }
  }, (error) => {
    console.error('Real-time listener error:', error);
    if (error.code === 'permission-denied') {
      showAlert('Permission denied. Please check your authentication.', 'error');
    } else if (error.code === 'unavailable') {
      showAlert('Network error. Please check your internet connection.', 'error');
    } else {
      showAlert('Error syncing data: ' + error.message, 'error');
    }
  });
}

// Save user data to Firestore with improved feedback
async function saveUserDataToFirestore() {
  if (!currentUser || !userDataRef) {
    console.log('No user logged in, skipping Firestore save');
    return;
  }
  
  try {
    // Show saving indicator
    const headerStatus = document.getElementById('auth-status-header');
    const userEmail = auth.currentUser ? auth.currentUser.email : 'User';
    if (headerStatus) {
      headerStatus.textContent = `⏳ Saving data...`;
      headerStatus.style.color = '#007bff';
    }

    await userDataRef.update({
      agencies: agencies,
      deposits: deposits,
      payments: payments,
      lastUpdated: firebase.firestore.FieldValue.serverTimestamp()
    });
    
    console.log('User data saved to Firestore');
    
    // The real-time listener will automatically update the UI
    // So we don't need to manually refresh here
    
  } catch (error) {
    console.error('Error saving user data:', error);
    
    // Restore header status on error
    const headerStatus = document.getElementById('auth-status-header');
    if (headerStatus) {
      const userEmail = auth.currentUser ? auth.currentUser.email : 'User';
      headerStatus.textContent = `✅ Welcome, ${userEmail}`;
      headerStatus.style.color = '#28a745';
    }
    
    if (error.code === 'permission-denied') {
      showAlert('Permission denied. Please check your authentication.', 'error');
    } else if (error.code === 'unavailable') {
      showAlert('Network error. Please check your internet connection.', 'error');
    } else {
      showAlert('Error saving data: ' + error.message, 'error');
    }
  }
}

// Clear local user data on logout
function clearUserData() {
  // Stop real-time listener
  if (userDataListener) {
    userDataListener();
    userDataListener = null;
  }
  
  currentUser = null;
  userDataRef = null;
  agencies = [];
  deposits = [];
  payments = [];
  
  // Clear UI
  refreshTables();
  populateDropdowns();
  
  // Update header status
  const headerStatus = document.getElementById('auth-status-header');
  if (headerStatus) {
    headerStatus.textContent = 'Please login to access your data';
    headerStatus.style.color = '#6c757d';
  }
}

// Auth state monitoring is now handled in the init() function

// Tab management
function openTab(event, tabName) {
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
        // For programmatic calls, find the tab by data attribute or similar
        const tabButtons = document.querySelectorAll('.tab');
        tabButtons.forEach(tab => {
            if (tab.getAttribute('onclick') && tab.getAttribute('onclick').includes(tabName)) {
                tab.classList.add('active');
            }
        });
    }

    // Refresh data when viewing records
    if (tabName === 'view-records') {
        refreshRecordTables();
    }
}

// Data persistence with automatic refresh
function saveData() {
    // Save to Firestore if user is logged in
    if (currentUser) {
        saveUserDataToFirestore();
        // Real-time listener will handle UI refresh automatically
    } else {
        console.log('No user logged in, data not saved to Firestore');
    }
}

function loadData() {
    // Data is now loaded from Firestore in the auth state change handler
    // This function is kept for compatibility but data loading is handled by Firestore integration
    console.log('loadData called - data loading handled by Firestore integration');
}

// Utility functions
function showAlert(message, type) {
    // Create alert element
    const alert = document.createElement('div');
    alert.className = "alert alert-" + type;
    alert.textContent = message;
    
    // Insert at the beginning of the active tab
    const activeTab = document.querySelector('.tab-content.active');
    if (activeTab) {
        activeTab.insertBefore(alert, activeTab.firstChild);
    }
    
    // Remove alert after 3 seconds
    setTimeout(() => {
        alert.remove();
    }, 3000);
}

function refreshTables() {
    refreshAgencyTable();
    refreshRecordTables();
}

function refreshRecordTables() {
    refreshDepositRecords();
    refreshPaymentRecords();
}

function refreshAgencyTable() {
    const tbody = document.getElementById('agency-tbody');
    if (!tbody) return;
    
    tbody.innerHTML = '';

    agencies.forEach((agency, index) => {
        const row = tbody.insertRow();
        row.innerHTML = `
            <td>${agency.pan}</td>
            <td>${agency.name}</td>
            <td>${index + 1}</td>
            <td>
                <button class="btn btn-secondary" onclick="editAgency(${agency.id})">Edit</button>
                <button class="btn btn-danger" onclick="deleteAgency(${agency.id})">Delete</button>
            </td>
        `;
    });
}

function refreshDepositRecords() {
    const tbody = document.getElementById('deposit-records-tbody');
    if (!tbody) return;
    
    tbody.innerHTML = '';

    deposits.forEach((deposit, index) => {
        const row = tbody.insertRow();
        row.innerHTML = `
            <td>${index + 1}</td>
            <td>${deposit.agencyName}</td>
            <td>${deposit.tenderNo}</td>
            <td>${deposit.nature}</td>
            <td>${deposit.tvNo}</td>
            <td>${deposit.challanNo}</td>
            <td>${deposit.challanDate}</td>
            <td>₹${deposit.creditAmount.toLocaleString()}</td>
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
    if (!tbody) return;
    
    tbody.innerHTML = '';

    payments.forEach((payment, index) => {
        if (payment.challans && payment.challans.length > 0) {
            payment.challans.forEach((challan, challanIndex) => {
                const row = tbody.insertRow();
                row.innerHTML = `
                    <td>${index + 1}.${challanIndex + 1}</td>
                    <td>${payment.agencyName}</td>
                    <td>${payment.tenderNo}</td>
                    <td>${payment.tvNo}</td>
                    <td>${payment.tvDate}</td>
                    <td>₹${payment.paymentAmount.toLocaleString()}</td>
                    <td>${challan.challanNo}</td>
                    <td>${challan.challanDate}</td>
                    <td>
                        <button class="btn btn-secondary" onclick="editPayment(${payment.id})">Edit</button>
                        <button class="btn btn-danger" onclick="deletePayment(${payment.id})">Delete</button>
                    </td>
                `;
            });
        }
    });
}

// Populate dropdowns
function populateDropdowns() {
    const depositPan = document.getElementById('deposit-pan');
    const paymentPan = document.getElementById('payment-pan');
    const reportAgency = document.getElementById('report-agency');

    if (depositPan) {
        depositPan.innerHTML = '<option value="">Select PAN</option>';
        agencies.forEach(agency => {
            const option = new Option(`${agency.pan} - ${agency.name}`, agency.pan);
            depositPan.add(option);
        });
    }

    if (paymentPan) {
        paymentPan.innerHTML = '<option value="">Select PAN</option>';
        agencies.forEach(agency => {
            const option = new Option(`${agency.pan} - ${agency.name}`, agency.pan);
            paymentPan.add(option);
        });
    }

    if (reportAgency) {
        reportAgency.innerHTML = '<option value="">Select Agency</option>';
        agencies.forEach(agency => {
            const option = new Option(`${agency.pan} - ${agency.name}`, agency.pan);
            reportAgency.add(option);
        });
    }
}

function populateYearDropdown() {
    const yearSelect = document.getElementById('report-year');
    if (!yearSelect) return;
    
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

// Initialize application when page loads
window.onload = function() {
    init();
};

// ===== AGENCY MANAGEMENT FUNCTIONS =====

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

// Agency management with real-time refresh
function saveAgency() {
    // Check if user is authenticated
    if (!currentUser) {
        showAlert('Please login to save agency data', 'error');
        return;
    }

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
    saveData(); // This will trigger real-time sync
    clearAgencyForm();
    showAlert('Agency saved successfully', 'success');
}

function editAgency(id) {
    // Check if user is authenticated
    if (!currentUser) {
        showAlert('Please login to edit agency data', 'error');
        return;
    }

    const agency = agencies.find(a => a.id === id);
    if (agency) {
        document.getElementById('agency-pan').value = agency.pan;
        document.getElementById('agency-name').value = agency.name;
        
        // Remove from array for update
        agencies = agencies.filter(a => a.id !== id);
        saveData(); // Save changes and trigger real-time sync
    }
}

function deleteAgency(id) {
    // Check if user is authenticated
    if (!currentUser) {
        showAlert('Please login to delete agency data', 'error');
        return;
    }

    if (confirm('Are you sure you want to delete this agency?')) {
        agencies = agencies.filter(a => a.id !== id);
        saveData(); // This will trigger real-time sync
        showAlert('Agency deleted successfully', 'success');
    }
}

function clearAgencyForm() {
    document.getElementById('agency-pan').value = '';
    document.getElementById('agency-name').value = '';
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

// ===== DEPOSIT MANAGEMENT FUNCTIONS =====

function updateDepositAgencyName() {
    const pan = document.getElementById('deposit-pan').value;
    const agency = agencies.find(a => a.pan === pan);
    const nameField = document.getElementById('deposit-agency-name');
    
    if (nameField) {
        nameField.value = agency ? agency.name : '';
    }
}

function saveDeposit() {
    // Check if user is authenticated
    if (!currentUser) {
        showAlert('Please login to save deposit data', 'error');
        return;
    }

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

    const deposit = {
        id: editingDepositId || Date.now(),
        pan: pan,
        agencyName: agencyName,
        tenderNo: tenderNo,
        nature: nature,
        billNo: billNo,
        billDate: billDate,
        tvNo: tvNo,
        tvDate: tvDate,
        creditAmount: parseFloat(creditAmount),
        challanNo: challanNo,
        challanDate: challanDate
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

    saveData(); // This will trigger real-time sync
    clearDepositForm();
}

function clearDepositForm() {
    const fields = [
        'deposit-pan', 'deposit-agency-name', 'deposit-tender-no', 'deposit-nature',
        'deposit-bill-no', 'deposit-bill-date', 'deposit-tv-no', 'deposit-tv-date',
        'deposit-credit-amount', 'deposit-challan-no', 'deposit-challan-date'
    ];
    
    fields.forEach(fieldId => {
        const field = document.getElementById(fieldId);
        if (field) field.value = '';
    });
}

function editDeposit(id) {
    // Check if user is authenticated
    if (!currentUser) {
        showAlert('Please login to edit deposit data', 'error');
        return;
    }

    const deposit = deposits.find(d => d.id === id);
    if (!deposit) {
        showAlert('Deposit not found', 'error');
        return;
    }

    // Set editing mode
    editingDepositId = id;
    
    // Switch to Record Deposits tab
    openTab(null, 'record-deposits');
    
    // Populate form fields
    document.getElementById('deposit-pan').value = deposit.pan;
    document.getElementById('deposit-agency-name').value = deposit.agencyName;
    document.getElementById('deposit-tender-no').value = deposit.tenderNo;
    document.getElementById('deposit-nature').value = deposit.nature;
    document.getElementById('deposit-bill-no').value = deposit.billNo || '';
    document.getElementById('deposit-bill-date').value = deposit.billDate || '';
    document.getElementById('deposit-tv-no').value = deposit.tvNo;
    document.getElementById('deposit-tv-date').value = deposit.tvDate || '';
    document.getElementById('deposit-credit-amount').value = deposit.creditAmount;
    document.getElementById('deposit-challan-no').value = deposit.challanNo;
    document.getElementById('deposit-challan-date').value = deposit.challanDate || '';
    
    showAlert('Editing deposit record. Make your changes and click "Save Deposit".', 'info');
}

function deleteDeposit(id) {
    // Check if user is authenticated
    if (!currentUser) {
        showAlert('Please login to delete deposit data', 'error');
        return;
    }

    if (confirm('Are you sure you want to delete this deposit?')) {
        deposits = deposits.filter(d => d.id !== id);
        saveData(); // This will trigger real-time sync
        showAlert('Deposit deleted successfully', 'success');
    }
}

// ===== PAYMENT MANAGEMENT FUNCTIONS =====

function updatePaymentAgencyName() {
    const pan = document.getElementById('payment-pan').value;
    const agency = agencies.find(a => a.pan === pan);
    const nameField = document.getElementById('payment-agency-name');
    
    if (nameField) {
        nameField.value = agency ? agency.name : '';
    }
}

function savePayment() {
    // Check if user is authenticated
    if (!currentUser) {
        showAlert('Please login to save payment data', 'error');
        return;
    }

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

    const payment = {
        id: editingPaymentId || Date.now(),
        pan: pan,
        agencyName: agencyName,
        tenderNo: tenderNo,
        paymentAmount: parseFloat(paymentAmount),
        tvNo: tvNo,
        tvDate: tvDate,
        challans: [
            {
                challanNo: document.getElementById('payment-challan-no-1')?.value || '',
                challanDate: document.getElementById('payment-challan-date-1')?.value || '',
                challanAmount: parseFloat(document.getElementById('payment-challan-amount-1')?.value || 0)
            }
        ]
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

    saveData(); // This will trigger real-time sync
    clearPaymentForm();
}

function clearPaymentForm() {
    const fields = [
        'payment-pan', 'payment-agency-name', 'payment-tender-no',
        'payment-amount', 'payment-tv-no', 'payment-tv-date'
    ];
    
    fields.forEach(fieldId => {
        const field = document.getElementById(fieldId);
        if (field) field.value = '';
    });
}

function editPayment(id) {
    // Check if user is authenticated
    if (!currentUser) {
        showAlert('Please login to edit payment data', 'error');
        return;
    }

    const payment = payments.find(p => p.id === id);
    if (!payment) {
        showAlert('Payment not found', 'error');
        return;
    }

    // Set editing mode
    editingPaymentId = id;
    
    // Switch to Record Payments tab
    openTab(null, 'record-payments');
    
    // Populate form fields
    document.getElementById('payment-pan').value = payment.pan;
    document.getElementById('payment-agency-name').value = payment.agencyName;
    document.getElementById('payment-tender-no').value = payment.tenderNo;
    document.getElementById('payment-amount').value = payment.paymentAmount;
    document.getElementById('payment-tv-no').value = payment.tvNo;
    document.getElementById('payment-tv-date').value = payment.tvDate || '';
    
    showAlert('Editing payment record. Make your changes and click "Save Payment".', 'info');
}

function deletePayment(id) {
    // Check if user is authenticated
    if (!currentUser) {
        showAlert('Please login to delete payment data', 'error');
        return;
    }

    if (confirm('Are you sure you want to delete this payment?')) {
        payments = payments.filter(p => p.id !== id);
        saveData(); // This will trigger real-time sync
        showAlert('Payment deleted successfully', 'success');
    }
}

// ===== SEARCH FUNCTIONS =====

function searchDeposits() {
    const searchTerm = document.getElementById('deposit-search')?.value.toLowerCase() || '';
    const tbody = document.getElementById('deposit-records-tbody');
    if (!tbody) return;
    
    const rows = tbody.getElementsByTagName('tr');
    for (let row of rows) {
        const text = row.textContent.toLowerCase();
        row.style.display = text.includes(searchTerm) ? '' : 'none';
    }
}

function searchPayments() {
    const searchTerm = document.getElementById('payment-search')?.value.toLowerCase() || '';
    const tbody = document.getElementById('payment-records-tbody');
    if (!tbody) return;
    
    const rows = tbody.getElementsByTagName('tr');
    for (let row of rows) {
        const text = row.textContent.toLowerCase();
        row.style.display = text.includes(searchTerm) ? '' : 'none';
    }
}

// ===== REPORT GENERATION FUNCTIONS =====

function generateReport() {
    // Check if user is authenticated
    if (!currentUser) {
        showAlert('Please login to generate reports', 'error');
        return;
    }

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
    if (selectedAgency) {
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

    // Generate report based on type
    if (reportType === 'summary') {
        generateSummaryReport(filteredDeposits, filteredPayments);
    } else {
        generateDetailedReport(filteredDeposits, filteredPayments);
    }
}

function generateSummaryReport(deposits, payments) {
    const reportTable = document.getElementById('report-table');
    reportTable.innerHTML = '';

    // Create header
    const header = reportTable.createTHead();
    const headerRow = header.insertRow();
    ['Agency', 'Total Deposits', 'Total Payments', 'Balance'].forEach(text => {
        const th = document.createElement('th');
        th.textContent = text;
        headerRow.appendChild(th);
    });

    // Group data by agency
    const agencyData = {};
    
    deposits.forEach(deposit => {
        if (!agencyData[deposit.pan]) {
            agencyData[deposit.pan] = {
                name: deposit.agencyName,
                totalDeposits: 0,
                totalPayments: 0
            };
        }
        agencyData[deposit.pan].totalDeposits += deposit.creditAmount;
    });

    payments.forEach(payment => {
        if (!agencyData[payment.pan]) {
            agencyData[payment.pan] = {
                name: payment.agencyName,
                totalDeposits: 0,
                totalPayments: 0
            };
        }
        agencyData[payment.pan].totalPayments += payment.paymentAmount;
    });

    // Create table body
    const tbody = reportTable.createTBody();
    Object.keys(agencyData).forEach(pan => {
        const data = agencyData[pan];
        const row = tbody.insertRow();
        const balance = data.totalDeposits - data.totalPayments;
        
        row.innerHTML = `
            <td>${data.name}</td>
            <td>₹${data.totalDeposits.toLocaleString()}</td>
            <td>₹${data.totalPayments.toLocaleString()}</td>
            <td>₹${balance.toLocaleString()}</td>
        `;
    });
}

function generateDetailedReport(deposits, payments) {
    const reportTable = document.getElementById('report-table');
    reportTable.innerHTML = '';

    // Create header
    const header = reportTable.createTHead();
    const headerRow = header.insertRow();
    ['Date', 'Agency', 'Type', 'Description', 'Debit', 'Credit', 'Balance'].forEach(text => {
        const th = document.createElement('th');
        th.textContent = text;
        headerRow.appendChild(th);
    });

    // Combine and sort all transactions
    const allTransactions = [];
    
    deposits.forEach(deposit => {
        allTransactions.push({
            date: deposit.challanDate,
            agency: deposit.agencyName,
            type: 'Deposit',
            description: `${deposit.nature} - ${deposit.challanNo}`,
            debit: 0,
            credit: deposit.creditAmount
        });
    });

    payments.forEach(payment => {
        allTransactions.push({
            date: payment.tvDate,
            agency: payment.agencyName,
            type: 'Payment',
            description: `Payment - ${payment.tvNo}`,
            debit: payment.paymentAmount,
            credit: 0
        });
    });

    // Sort by date
    allTransactions.sort((a, b) => new Date(a.date) - new Date(b.date));

    // Create table body with running balance
    const tbody = reportTable.createTBody();
    let runningBalance = 0;
    
    allTransactions.forEach(transaction => {
        runningBalance += transaction.credit - transaction.debit;
        const row = tbody.insertRow();
        
        row.innerHTML = `
            <td>${transaction.date}</td>
            <td>${transaction.agency}</td>
            <td>${transaction.type}</td>
            <td>${transaction.description}</td>
            <td>${transaction.debit ? '₹' + transaction.debit.toLocaleString() : ''}</td>
            <td>${transaction.credit ? '₹' + transaction.credit.toLocaleString() : ''}</td>
            <td>₹${runningBalance.toLocaleString()}</td>
        `;
    });
}

// ===== EXPORT FUNCTIONS =====

function exportDeposits() {
    // Check if user is authenticated
    if (!currentUser) {
        showAlert('Please login to export data', 'error');
        return;
    }

    const csv = generateDepositCSV();
    downloadCSV(csv, 'deposits.csv');
    showAlert('Deposits exported successfully', 'success');
}

function exportPayments() {
    // Check if user is authenticated
    if (!currentUser) {
        showAlert('Please login to export data', 'error');
        return;
    }

    const csv = generatePaymentCSV();
    downloadCSV(csv, 'payments.csv');
    showAlert('Payments exported successfully', 'success');
}

function exportReport() {
    // Check if user is authenticated
    if (!currentUser) {
        showAlert('Please login to export reports', 'error');
        return;
    }

    const table = document.getElementById('report-table');
    const csv = tableToCSV(table);
    const filename = `Security_Deposit_Report_${new Date().toISOString().split('T')[0]}.csv`;
    downloadCSV(csv, filename);
    showAlert('Report exported successfully as ' + filename, 'success');
}

function generateDepositCSV() {
    const headers = ['S.No', 'Agency Name', 'Tender No', 'Nature', 'TV No', 'Challan No', 'Challan Date', 'Credit Amount'];
    let csv = headers.join(',') + '\n';
    
    deposits.forEach((deposit, index) => {
        const row = [
            index + 1,
            deposit.agencyName,
            deposit.tenderNo,
            deposit.nature,
            deposit.tvNo,
            deposit.challanNo,
            deposit.challanDate,
            deposit.creditAmount
        ];
        csv += row.join(',') + '\n';
    });
    
    return csv;
}

function generatePaymentCSV() {
    const headers = ['S.No', 'Agency Name', 'Tender No', 'TV No', 'TV Date', 'Payment Amount'];
    let csv = headers.join(',') + '\n';
    
    payments.forEach((payment, index) => {
        const row = [
            index + 1,
            payment.agencyName,
            payment.tenderNo,
            payment.tvNo,
            payment.tvDate,
            payment.paymentAmount
        ];
        csv += row.join(',') + '\n';
    });
    
    return csv;
}

function tableToCSV(table) {
    let csv = '';
    const rows = table.querySelectorAll('tr');
    
    rows.forEach(row => {
        const cols = row.querySelectorAll('td, th');
        const rowData = Array.from(cols).map(col => col.textContent);
        csv += rowData.join(',') + '\n';
    });
    
    return csv;
}

function downloadCSV(csv, filename) {
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.setAttribute('hidden', '');
    a.setAttribute('href', url);
    a.setAttribute('download', filename);
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
}

// ===== PASSWORD RESET FUNCTIONALITY =====

function sendPasswordReset() {
    const email = document.getElementById("resetEmail").value.trim();
    const resetBtn = document.getElementById("reset-btn");
    const resetStatus = document.getElementById("reset-status");
    
    if (!email) {
        showResetStatus("Please enter your email address.", "error");
        return;
    }

    // Validate email format
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailPattern.test(email)) {
        showResetStatus("Please enter a valid email address.", "error");
        return;
    }

    // Show loading state
    resetBtn.disabled = true;
    resetBtn.textContent = "⏳ Sending...";
    showResetStatus("Sending password reset email...", "info");

    auth.sendPasswordResetEmail(email)
        .then(() => {
            showResetStatus("✅ Password reset email sent! Check your inbox and spam folder.", "success");
            document.getElementById("resetEmail").value = "";
            
            // Hide the reset section after successful send
            setTimeout(() => {
                const container = document.getElementById("forgot-password-container");
                if (container) {
                    container.style.display = "none";
                }
            }, 3000);
        })
        .catch(error => {
            console.error("❌ Password reset error:", error);
            
            let errorMessage = "❌ ";
            switch (error.code) {
                case 'auth/user-not-found':
                    errorMessage += "No account found with this email address.";
                    break;
                case 'auth/invalid-email':
                    errorMessage += "Invalid email address format.";
                    break;
                case 'auth/too-many-requests':
                    errorMessage += "Too many reset attempts. Please try again later.";
                    break;
                default:
                    errorMessage += error.message;
            }
            
            showResetStatus(errorMessage, "error");
        })
        .finally(() => {
            // Restore button state
            resetBtn.disabled = false;
            resetBtn.textContent = "📧 Send Reset Link";
        });
}

function showResetStatus(message, type) {
    const resetStatus = document.getElementById("reset-status");
    if (resetStatus) {
        resetStatus.textContent = message;
        resetStatus.className = `reset-status-message ${type}`;
        
        // Set colors based on type
        switch (type) {
            case 'success':
                resetStatus.style.color = '#28a745';
                break;
            case 'error':
                resetStatus.style.color = '#dc3545';
                break;
            case 'info':
                resetStatus.style.color = '#007bff';
                break;
            default:
                resetStatus.style.color = '#6c757d';
        }
        
        // Clear status after 5 seconds for non-success messages
        if (type !== 'success') {
            setTimeout(() => {
                resetStatus.textContent = '';
            }, 5000);
        }
    }
}

// Add keyboard support for password reset
function setupPasswordResetEventListeners() {
    const resetEmailField = document.getElementById('resetEmail');
    if (resetEmailField) {
        resetEmailField.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                sendPasswordReset();
            }
        });
    }
}