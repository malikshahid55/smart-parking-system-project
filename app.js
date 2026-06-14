/**
 * Smart Parking System - User Portal Application Script
 */

const API_URL = 'http://localhost:3000/reservations';

// State variables
let reservations = [];
let searchQuery = '';
let filterType = 'all';

// DOM Elements
const themeToggleBtn = document.getElementById('theme-toggle');
const bookingForm = document.getElementById('booking-form');
const reservationsListContainer = document.getElementById('reservations-list-container');
const listLoadingSpinner = document.getElementById('list-loading-spinner');
const emptyStateCard = document.getElementById('empty-state-card');
const apiErrorAlert = document.getElementById('api-error-alert');
const searchInput = document.getElementById('search-input');
const filterTypeSelect = document.getElementById('filter-type');

// Form Fields
const driverNameInput = document.getElementById('driverName');
const vehiclePlateInput = document.getElementById('vehiclePlate');
const vehicleTypeSelect = document.getElementById('vehicleType');
const contactPhoneInput = document.getElementById('contactPhone');
const bookingDateInput = document.getElementById('bookingDate');
const durationInput = document.getElementById('duration');

// Initialize Application
document.addEventListener('DOMContentLoaded', () => {
  initTheme();
  fetchReservations();
  setupEventListeners();
  setMinimumDate();
});

// Setup Event Listeners
function setupEventListeners() {
  // Theme Toggle Event
  themeToggleBtn.addEventListener('click', toggleTheme);

  // Form Submit Event
  bookingForm.addEventListener('submit', handleFormSubmit);

  // Filter Select Event
  filterTypeSelect.addEventListener('change', (e) => {
    filterType = e.target.value;
    renderReservations();
  });

  // Search Input Event with Debounce
  searchInput.addEventListener('input', debounce((e) => {
    searchQuery = e.target.value.toLowerCase().trim();
    renderReservations();
  }, 300));

  // Inline Validation Listeners on input/blur
  setupInlineValidation();
}

/* ========================================================================
   Theme Management (Persisted in localStorage)
   ======================================================================== */
function initTheme() {
  const storedTheme = localStorage.getItem('theme');
  const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  
  if (storedTheme === 'dark' || (!storedTheme && systemPrefersDark)) {
    document.body.classList.add('dark');
  } else {
    document.body.classList.remove('dark');
  }
}

function toggleTheme() {
  document.body.classList.toggle('dark');
  const isDark = document.body.classList.contains('dark');
  localStorage.setItem('theme', isDark ? 'dark' : 'light');
}

/* ========================================================================
   API Fetch Operations (GET & POST)
   ======================================================================== */
async function fetchReservations() {
  showLoading(true);
  hideError();

  try {
    const response = await fetch(API_URL);
    if (!response.ok) {
      throw new Error(`Failed to load reservations: Status ${response.status}`);
    }
    reservations = await response.json();
    renderReservations();
  } catch (error) {
    console.error('API Error:', error);
    showError();
  } finally {
    showLoading(false);
  }
}

async function createReservation(reservationData) {
  showLoading(true);
  hideError();

  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(reservationData)
    });

    if (!response.ok) {
      throw new Error(`Failed to create booking: Status ${response.status}`);
    }

    // Refresh application state
    await fetchReservations();
    bookingForm.reset();
    clearValidationStyles();
  } catch (error) {
    console.error('POST Error:', error);
    showError();
    showLoading(false);
  }
}

/* ========================================================================
   Rendering & Filtering UI Logic
   ======================================================================== */
function renderReservations() {
  // Clear list contents
  reservationsListContainer.innerHTML = '';

  // Filter criteria: search text + select filter (we only show active reservations on User panel to reduce noise, or show all based on filter)
  const filtered = reservations.filter(res => {
    const matchesSearch = 
      res.driverName.toLowerCase().includes(searchQuery) ||
      res.vehiclePlate.toLowerCase().includes(searchQuery);
    
    const matchesType = filterType === 'all' || res.vehicleType === filterType;
    
    return matchesSearch && matchesType;
  });

  if (filtered.length === 0) {
    reservationsListContainer.style.display = 'none';
    emptyStateCard.style.display = 'flex';
    return;
  }

  emptyStateCard.style.display = 'none';
  reservationsListContainer.style.display = 'grid';

  // Render cards
  filtered.forEach(res => {
    const card = document.createElement('div');
    card.className = 'res-card';
    card.id = `res-card-${res.id}`;
    
    const estimatedFee = (parseFloat(res.duration) * 5.0).toFixed(2);
    const badgeClass = res.status === 'Active' ? 'badge-active' : 'badge-completed';

    card.innerHTML = `
      <div class="res-card-header">
        <div>
          <h3 class="res-driver">${escapeHTML(res.driverName)}</h3>
          <span class="res-plate">${escapeHTML(res.vehiclePlate)}</span>
        </div>
        <span class="badge ${badgeClass}">${escapeHTML(res.status || 'Active')}</span>
      </div>
      <div class="res-details">
        <div>
          <div class="detail-label">Vehicle Type</div>
          <span class="badge badge-type">${escapeHTML(res.vehicleType)}</span>
        </div>
        <div>
          <div class="detail-label">Est. Fee</div>
          <div class="detail-value">$${estimatedFee}</div>
        </div>
        <div>
          <div class="detail-label">Date</div>
          <div class="detail-value">${escapeHTML(res.bookingDate)}</div>
        </div>
        <div>
          <div class="detail-label">Duration</div>
          <div class="detail-value">${escapeHTML(res.duration)} Hrs</div>
        </div>
      </div>
      <div class="res-card-footer">
        <div>
          <div class="detail-label">Contact Phone</div>
          <div class="detail-value" style="font-size: 0.8rem;">${escapeHTML(res.contactPhone)}</div>
        </div>
      </div>
    `;
    reservationsListContainer.appendChild(card);
  });
}

/* ========================================================================
   Form Submission and Validation
   ======================================================================== */
function handleFormSubmit(e) {
  e.preventDefault();

  const isValid = validateForm();
  if (!isValid) {
    return;
  }

  // Build booking entity
  const booking = {
    driverName: driverNameInput.value.trim(),
    vehiclePlate: vehiclePlateInput.value.trim().toUpperCase(),
    vehicleType: vehicleTypeSelect.value,
    contactPhone: contactPhoneInput.value.trim(),
    bookingDate: bookingDateInput.value,
    duration: durationInput.value.trim(),
    status: 'Active' // Default state for users
  };

  createReservation(booking);
}

function validateForm() {
  let isValid = true;

  // 1. Driver Name validation (letters/spaces, length >= 3)
  const nameVal = driverNameInput.value.trim();
  const nameRegex = /^[a-zA-Z\s]{3,50}$/;
  if (!nameRegex.test(nameVal)) {
    markInvalid(driverNameInput, true);
    isValid = false;
  } else {
    markInvalid(driverNameInput, false);
  }

  // 2. Vehicle Plate Validation (alphanumeric pattern checking e.g., ABC-1234 or AA-123-BB or alphanumeric)
  const plateVal = vehiclePlateInput.value.trim();
  const plateRegex = /^[A-Z0-9\-\s]{3,15}$/i;
  if (!plateRegex.test(plateVal)) {
    markInvalid(vehiclePlateInput, true);
    isValid = false;
  } else {
    markInvalid(vehiclePlateInput, false);
  }

  // 3. Vehicle Type Selection
  if (!vehicleTypeSelect.value) {
    markInvalid(vehicleTypeSelect, true);
    isValid = false;
  } else {
    markInvalid(vehicleTypeSelect, false);
  }

  // 4. Contact Phone (Pakistan phone format or general 10-12 digits e.g. 0300-1234567 or 03211234567)
  const phoneVal = contactPhoneInput.value.trim();
  const phoneRegex = /^(03\d{2}-\d{7})|(\d{11,12})$/;
  if (!phoneRegex.test(phoneVal)) {
    markInvalid(contactPhoneInput, true);
    isValid = false;
  } else {
    markInvalid(contactPhoneInput, false);
  }

  // 5. Booking Date (Cannot be in the past)
  const dateVal = bookingDateInput.value;
  const todayStr = new Date().toISOString().split('T')[0];
  if (!dateVal || dateVal < todayStr) {
    markInvalid(bookingDateInput, true);
    isValid = false;
  } else {
    markInvalid(bookingDateInput, false);
  }

  // 6. Duration Validation (between 1 and 24 hours)
  const durationVal = parseInt(durationInput.value);
  if (isNaN(durationVal) || durationVal < 1 || durationVal > 24) {
    markInvalid(durationInput, true);
    isValid = false;
  } else {
    markInvalid(durationInput, false);
  }

  return isValid;
}

function setupInlineValidation() {
  const validateField = (input, validationFn) => {
    input.addEventListener('blur', () => markInvalid(input, !validationFn()));
    input.addEventListener('input', () => {
      if (!input.classList.contains('is-invalid')) return;
      markInvalid(input, !validationFn());
    });
  };

  validateField(driverNameInput, () => /^[a-zA-Z\s]{3,50}$/.test(driverNameInput.value.trim()));
  validateField(vehiclePlateInput, () => /^[A-Z0-9\-\s]{3,15}$/i.test(vehiclePlateInput.value.trim()));
  validateField(vehicleTypeSelect, () => !!vehicleTypeSelect.value);
  validateField(contactPhoneInput, () => /^(03\d{2}-\d{7})|(\d{11,12})$/.test(contactPhoneInput.value.trim()));
  validateField(bookingDateInput, () => {
    const today = new Date().toISOString().split('T')[0];
    return bookingDateInput.value && bookingDateInput.value >= today;
  });
  validateField(durationInput, () => {
    const val = parseInt(durationInput.value);
    return !isNaN(val) && val >= 1 && val <= 24;
  });
}

function markInvalid(element, isInvalid) {
  if (isInvalid) {
    element.classList.add('is-invalid');
  } else {
    element.classList.remove('is-invalid');
  }
}

function clearValidationStyles() {
  const inputs = bookingForm.querySelectorAll('.form-control');
  inputs.forEach(input => input.classList.remove('is-invalid'));
}

function setMinimumDate() {
  const today = new Date().toISOString().split('T')[0];
  bookingDateInput.min = today;
}

/* ========================================================================
   Helper Functions
   ======================================================================== */
function showLoading(isLoading) {
  if (isLoading) {
    listLoadingSpinner.style.display = 'flex';
    reservationsListContainer.style.display = 'none';
    emptyStateCard.style.display = 'none';
  } else {
    listLoadingSpinner.style.display = 'none';
  }
}

function showError() {
  apiErrorAlert.classList.add('show');
}

function hideError() {
  apiErrorAlert.classList.remove('show');
}

// Debounce helper
function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

// Secure HTML strings to prevent XSS injection
function escapeHTML(str) {
  if (!str) return '';
  return str.replace(/[&<>'"]/g, 
    tag => ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      "'": '&#39;',
      '"': '&quot;'
    }[tag] || tag)
  );
}
