/**
 * Smart Parking System - Admin Portal Application Script
 */

const API_URL = 'http://localhost:3000/reservations';

// State Management
let reservations = [];
let searchQuery = '';
let filterStatus = 'all';
let deleteIdCandidate = null;

// DOM Elements
const themeToggleBtn = document.getElementById('theme-toggle');
const tableBody = document.getElementById('table-body');
const tableLoadingSpinner = document.getElementById('table-loading-spinner');
const tableView = document.getElementById('table-view');
const emptyStateCard = document.getElementById('empty-state-card');
const apiErrorAlert = document.getElementById('api-error-alert');
const searchInput = document.getElementById('search-input');
const filterStatusSelect = document.getElementById('filter-status');

// Stat Display Elements
const statTotalVal = document.getElementById('stat-total-val');
const statActiveVal = document.getElementById('stat-active-val');
const statRevenueVal = document.getElementById('stat-revenue-val');

// Modal Elements
const editModal = document.getElementById('edit-modal');
const editForm = document.getElementById('edit-form');
const btnCloseModal = document.getElementById('btn-close-modal');
const btnCancelEdit = document.getElementById('btn-cancel-edit');

// Modal Inputs
const editIdInput = document.getElementById('edit-id');
const editDriverNameInput = document.getElementById('edit-driverName');
const editVehiclePlateInput = document.getElementById('edit-vehiclePlate');
const editVehicleTypeSelect = document.getElementById('edit-vehicleType');
const editContactPhoneInput = document.getElementById('edit-contactPhone');
const editBookingDateInput = document.getElementById('edit-bookingDate');
const editDurationInput = document.getElementById('edit-duration');
const editStatusSelect = document.getElementById('edit-status');

// Custom Confirmation Dialog Elements
const confirmOverlay = document.getElementById('confirm-overlay');
const btnConfirmCancel = document.getElementById('btn-confirm-cancel');
const btnConfirmDelete = document.getElementById('btn-confirm-delete');

// Initial Setup
document.addEventListener('DOMContentLoaded', () => {
  initTheme();
  fetchAdminData();
  setupEventListeners();
});

// Setup Events
function setupEventListeners() {
  // Theme Toggle
  themeToggleBtn.addEventListener('click', toggleTheme);

  // Search Input (Debounced)
  searchInput.addEventListener('input', debounce((e) => {
    searchQuery = e.target.value.toLowerCase().trim();
    renderAdminView();
  }, 300));

  // Filter Status
  filterStatusSelect.addEventListener('change', (e) => {
    filterStatus = e.target.value;
    renderAdminView();
  });

  // Edit Modal Actions
  btnCloseModal.addEventListener('click', closeEditModal);
  btnCancelEdit.addEventListener('click', closeEditModal);
  editForm.addEventListener('submit', handleEditFormSubmit);

  // Confirm Delete Actions
  btnConfirmCancel.addEventListener('click', closeDeleteConfirm);
  btnConfirmDelete.addEventListener('click', executeDelete);

  // Setup inline validation for edit form
  setupEditFormValidation();
}

/* ========================================================================
   Theme Configuration (Synced with User Panel)
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
   API Data Fetches (GET, PUT/PATCH, DELETE)
   ======================================================================== */
async function fetchAdminData() {
  showLoading(true);
  hideError();

  try {
    const response = await fetch(API_URL);
    if (!response.ok) {
      throw new Error(`Failed server request: ${response.status}`);
    }
    reservations = await response.json();
    calculateStats();
    renderAdminView();
  } catch (error) {
    console.error('API Error:', error);
    showError();
  } finally {
    showLoading(false);
  }
}

async function updateReservation(id, updatedData) {
  showLoading(true);
  hideError();

  try {
    const response = await fetch(`${API_URL}/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(updatedData)
    });

    if (!response.ok) {
      throw new Error(`Update failed: ${response.status}`);
    }

    closeEditModal();
    await fetchAdminData();
  } catch (error) {
    console.error('PUT Error:', error);
    showError();
    showLoading(false);
  }
}

async function executeDelete() {
  if (!deleteIdCandidate) return;
  
  showLoading(true);
  hideError();
  closeDeleteConfirm();

  try {
    const response = await fetch(`${API_URL}/${deleteIdCandidate}`, {
      method: 'DELETE'
    });

    if (!response.ok) {
      throw new Error(`Deletion failed: ${response.status}`);
    }

    deleteIdCandidate = null;
    await fetchAdminData();
  } catch (error) {
    console.error('DELETE Error:', error);
    showError();
    showLoading(false);
  }
}

/* ========================================================================
   Render Dashboard & Data Calculations
   ======================================================================== */
function calculateStats() {
  const total = reservations.length;
  const activeCount = reservations.filter(r => r.status === 'Active').matches = reservations.filter(r => r.status === 'Active').length;
  
  // 1. Total Reservations
  statTotalVal.textContent = total;

  // 2. Active occupancy rate (Percentage)
  const rate = total > 0 ? ((activeCount / total) * 100).toFixed(0) : 0;
  statActiveVal.textContent = `${activeCount} (${rate}%)`;

  // 3. Estimated Revenue (Sum of Duration * $5.0)
  const revenue = reservations
    .filter(r => r.status !== 'Cancelled') // Exclude cancelled ones from revenue
    .reduce((sum, r) => sum + (parseFloat(r.duration) * 5.0), 0.0);
  statRevenueVal.textContent = `$${revenue.toFixed(2)}`;
}

function renderAdminView() {
  tableBody.innerHTML = '';

  const filtered = reservations.filter(res => {
    const matchesSearch = 
      res.driverName.toLowerCase().includes(searchQuery) ||
      res.vehiclePlate.toLowerCase().includes(searchQuery) ||
      res.id.toString().includes(searchQuery);

    const matchesStatus = filterStatus === 'all' || res.status === filterStatus;

    return matchesSearch && matchesStatus;
  });

  if (filtered.length === 0) {
    tableView.style.display = 'none';
    emptyStateCard.style.display = 'flex';
    return;
  }

  emptyStateCard.style.display = 'none';
  tableView.style.display = 'block';

  filtered.forEach(res => {
    const row = document.createElement('tr');
    row.id = `admin-row-${res.id}`;
    
    let statusClass = 'badge-active';
    if (res.status === 'Completed') statusClass = 'badge-completed';
    if (res.status === 'Cancelled') statusClass = 'badge-cancelled';

    row.innerHTML = `
      <td><strong>#${res.id}</strong></td>
      <td>${escapeHTML(res.driverName)}</td>
      <td><span class="res-plate">${escapeHTML(res.vehiclePlate)}</span></td>
      <td><span class="badge badge-type">${escapeHTML(res.vehicleType)}</span></td>
      <td>${escapeHTML(res.bookingDate)}</td>
      <td>${escapeHTML(res.duration)} Hrs</td>
      <td>${escapeHTML(res.contactPhone)}</td>
      <td><span class="badge ${statusClass}">${escapeHTML(res.status || 'Active')}</span></td>
      <td>
        <div class="actions-cell">
          <button class="btn btn-primary btn-sm" onclick="openEditFlow('${res.id}')">
            Edit
          </button>
          <button class="btn btn-danger btn-sm" onclick="confirmDeleteFlow('${res.id}')">
            Delete
          </button>
        </div>
      </td>
    `;
    tableBody.appendChild(row);
  });
}

/* ========================================================================
   Edit Action Flow (Modal Logic)
   ======================================================================== */
window.openEditFlow = function(id) {
  const record = reservations.find(r => r.id.toString() === id.toString());
  if (!record) return;

  // Pre-load data in form inputs
  editIdInput.value = record.id;
  editDriverNameInput.value = record.driverName;
  editVehiclePlateInput.value = record.vehiclePlate;
  editVehicleTypeSelect.value = record.vehicleType;
  editContactPhoneInput.value = record.contactPhone;
  editBookingDateInput.value = record.bookingDate;
  editDurationInput.value = record.duration;
  editStatusSelect.value = record.status || 'Active';

  // Open modal visual
  clearModalValidationStyles();
  editModal.classList.add('show');
};

function closeEditModal() {
  editModal.classList.remove('show');
  editForm.reset();
}

function handleEditFormSubmit(e) {
  e.preventDefault();

  const isValid = validateEditForm();
  if (!isValid) return;

  const id = editIdInput.value;
  const updatedData = {
    driverName: editDriverNameInput.value.trim(),
    vehiclePlate: editVehiclePlateInput.value.trim().toUpperCase(),
    vehicleType: editVehicleTypeSelect.value,
    contactPhone: editContactPhoneInput.value.trim(),
    bookingDate: editBookingDateInput.value,
    duration: editDurationInput.value.trim(),
    status: editStatusSelect.value
  };

  updateReservation(id, updatedData);
}

function validateEditForm() {
  let isValid = true;

  // 1. Driver Name Validation
  const nameVal = editDriverNameInput.value.trim();
  if (!/^[a-zA-Z\s]{3,50}$/.test(nameVal)) {
    markInvalid(editDriverNameInput, true);
    isValid = false;
  } else {
    markInvalid(editDriverNameInput, false);
  }

  // 2. Vehicle Plate Validation
  const plateVal = editVehiclePlateInput.value.trim();
  if (!/^[A-Z0-9\-\s]{3,15}$/i.test(plateVal)) {
    markInvalid(editVehiclePlateInput, true);
    isValid = false;
  } else {
    markInvalid(editVehiclePlateInput, false);
  }

  // 3. Vehicle Type Select
  if (!editVehicleTypeSelect.value) {
    markInvalid(editVehicleTypeSelect, true);
    isValid = false;
  } else {
    markInvalid(editVehicleTypeSelect, false);
  }

  // 4. Contact Phone Validation
  const phoneVal = editContactPhoneInput.value.trim();
  if (!/^(03\d{2}-\d{7})|(\d{11,12})$/.test(phoneVal)) {
    markInvalid(editContactPhoneInput, true);
    isValid = false;
  } else {
    markInvalid(editContactPhoneInput, false);
  }

  // 5. Booking Date
  if (!editBookingDateInput.value) {
    markInvalid(editBookingDateInput, true);
    isValid = false;
  } else {
    markInvalid(editBookingDateInput, false);
  }

  // 6. Duration Validation
  const durationVal = parseInt(editDurationInput.value);
  if (isNaN(durationVal) || durationVal < 1 || durationVal > 24) {
    markInvalid(editDurationInput, true);
    isValid = false;
  } else {
    markInvalid(editDurationInput, false);
  }

  return isValid;
}

function setupEditFormValidation() {
  const validateField = (input, validationFn) => {
    input.addEventListener('blur', () => markInvalid(input, !validationFn()));
    input.addEventListener('input', () => {
      if (!input.classList.contains('is-invalid')) return;
      markInvalid(input, !validationFn());
    });
  };

  validateField(editDriverNameInput, () => /^[a-zA-Z\s]{3,50}$/.test(editDriverNameInput.value.trim()));
  validateField(editVehiclePlateInput, () => /^[A-Z0-9\-\s]{3,15}$/i.test(editVehiclePlateInput.value.trim()));
  validateField(editVehicleTypeSelect, () => !!editVehicleTypeSelect.value);
  validateField(editContactPhoneInput, () => /^(03\d{2}-\d{7})|(\d{11,12})$/.test(editContactPhoneInput.value.trim()));
  validateField(editBookingDateInput, () => !!editBookingDateInput.value);
  validateField(editDurationInput, () => {
    const val = parseInt(editDurationInput.value);
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

function clearModalValidationStyles() {
  const inputs = editForm.querySelectorAll('.form-control');
  inputs.forEach(input => input.classList.remove('is-invalid'));
}

/* ========================================================================
   Delete Confirmation Dialog Flow
   ======================================================================== */
window.confirmDeleteFlow = function(id) {
  deleteIdCandidate = id;
  confirmOverlay.classList.add('show');
};

function closeDeleteConfirm() {
  confirmOverlay.classList.remove('show');
}

/* ========================================================================
   Helper Functions
   ======================================================================== */
function showLoading(isLoading) {
  if (isLoading) {
    tableLoadingSpinner.style.display = 'flex';
    tableView.style.display = 'none';
    emptyStateCard.style.display = 'none';
  } else {
    tableLoadingSpinner.style.display = 'none';
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
