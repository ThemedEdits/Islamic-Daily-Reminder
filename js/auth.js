import { auth } from "./firebase.js";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";

// DOM Elements
const switchToLogin = document.getElementById('switchToLogin');
const switchToSignup = document.getElementById('switchToSignup');
const loginForm = document.getElementById('loginForm');
const signupForm = document.getElementById('signupForm');
const loginFormElement = document.getElementById('loginFormElement');
const signupFormElement = document.getElementById('signupFormElement');

// Input Elements
const loginEmail = document.getElementById('loginEmail');
const loginPassword = document.getElementById('loginPassword');
const signupEmail = document.getElementById('signupEmail');
const signupPassword = document.getElementById('signupPassword');
const signupConfirmPassword = document.getElementById('signupConfirmPassword');

// Button Elements
const loginBtn = document.getElementById('loginBtn');
const signupBtn = document.getElementById('signupBtn');

// Password Toggle Elements
const toggleLoginPassword = document.getElementById('toggleLoginPassword');
const toggleSignupPassword = document.getElementById('toggleSignupPassword');
const toggleConfirmPassword = document.getElementById('toggleConfirmPassword');

// Password Strength Elements
const passwordStrengthFill = document.getElementById('passwordStrengthFill');
const passwordStrengthText = document.getElementById('passwordStrengthText');

// Error messages mapping
const errorMessages = {
    'auth/email-already-in-use': 'This email is already registered. Please sign in instead.',
    'auth/invalid-email': 'Please enter a valid email address.',
    'auth/operation-not-allowed': 'Email/password accounts are not enabled. Please contact support.',
    'auth/weak-password': 'Password should be at least 6 characters long.',
    'auth/user-disabled': 'This account has been disabled. Please contact support.',
    'auth/user-not-found': 'No account found with this email.',
    'auth/wrong-password': 'Incorrect password. Please try again.',
    'auth/too-many-requests': 'Too many attempts. Please try again later.',
    'auth/email-already-exists': 'This email is already in use.',
    'auth/invalid-password': 'Password must be at least 6 characters long.',
    'default': 'An error occurred. Please try again.'
};

// Initialize form switching
function initFormSwitching() {
    switchToLogin.addEventListener('click', () => {
        switchToLogin.classList.add('active');
        switchToSignup.classList.remove('active');
        loginForm.classList.add('active');
        signupForm.classList.remove('active');
    });

    switchToSignup.addEventListener('click', () => {
        switchToSignup.classList.add('active');
        switchToLogin.classList.remove('active');
        signupForm.classList.add('active');
        loginForm.classList.remove('active');
    });
}

// Initialize password toggles
function initPasswordToggles() {
    toggleLoginPassword.addEventListener('click', () => {
        const type = loginPassword.getAttribute('type') === 'password' ? 'text' : 'password';
        loginPassword.setAttribute('type', type);
        toggleLoginPassword.innerHTML = type === 'password' ? '<i class="fas fa-eye"></i>' : '<i class="fas fa-eye-slash"></i>';
    });

    toggleSignupPassword.addEventListener('click', () => {
        const type = signupPassword.getAttribute('type') === 'password' ? 'text' : 'password';
        signupPassword.setAttribute('type', type);
        toggleSignupPassword.innerHTML = type === 'password' ? '<i class="fas fa-eye"></i>' : '<i class="fas fa-eye-slash"></i>';
    });

    toggleConfirmPassword.addEventListener('click', () => {
        const type = signupConfirmPassword.getAttribute('type') === 'password' ? 'text' : 'password';
        signupConfirmPassword.setAttribute('type', type);
        toggleConfirmPassword.innerHTML = type === 'password' ? '<i class="fas fa-eye"></i>' : '<i class="fas fa-eye-slash"></i>';
    });
}

// Show field error
function showFieldError(fieldId, message) {
    const errorElement = document.getElementById(fieldId);
    if (errorElement) {
        errorElement.textContent = message;
        errorElement.classList.add('show');
        errorElement.innerHTML = `<i class="fas fa-exclamation-circle"></i> ${message}`;
    }
}

// Clear field error
function clearFieldError(fieldId) {
    const errorElement = document.getElementById(fieldId);
    if (errorElement) {
        errorElement.textContent = '';
        errorElement.classList.remove('show');
    }
}

// Validate email
function validateEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
}

// Check password strength
function checkPasswordStrength(password) {
    let strength = 0;
    
    // Length check
    if (password.length >= 8) strength += 25;
    if (password.length >= 12) strength += 10;
    
    // Complexity checks
    if (/[A-Z]/.test(password)) strength += 20;
    if (/[a-z]/.test(password)) strength += 20;
    if (/[0-9]/.test(password)) strength += 20;
    if (/[^A-Za-z0-9]/.test(password)) strength += 25;
    
    // Update UI
    let strengthClass = 'weak';
    let strengthText = 'Weak';
    
    if (strength >= 75) {
        strengthClass = 'strong';
        strengthText = 'Strong';
    } else if (strength >= 50) {
        strengthClass = 'medium';
        strengthText = 'Medium';
    }
    
    passwordStrengthFill.className = `strength-fill ${strengthClass}`;
    passwordStrengthFill.style.width = `${strength}%`;
    passwordStrengthText.textContent = `Password strength: ${strengthText}`;
    
    return strength;
}

// Validate login form
function validateLoginForm() {
    let isValid = true;
    clearFieldError('loginEmailError');
    clearFieldError('loginPasswordError');

    // Email validation
    if (!loginEmail.value.trim()) {
        showFieldError('loginEmailError', 'Email is required');
        loginEmail.classList.add('input-error');
        isValid = false;
    } else if (!validateEmail(loginEmail.value.trim())) {
        showFieldError('loginEmailError', 'Please enter a valid email');
        loginEmail.classList.add('input-error');
        isValid = false;
    } else {
        loginEmail.classList.remove('input-error');
    }

    // Password validation
    if (!loginPassword.value.trim()) {
        showFieldError('loginPasswordError', 'Password is required');
        loginPassword.classList.add('input-error');
        isValid = false;
    } else if (loginPassword.value.length < 6) {
        showFieldError('loginPasswordError', 'Password must be at least 6 characters');
        loginPassword.classList.add('input-error');
        isValid = false;
    } else {
        loginPassword.classList.remove('input-error');
    }

    return isValid;
}

// Validate signup form
function validateSignupForm() {
    let isValid = true;
    clearFieldError('signupEmailError');
    clearFieldError('signupPasswordError');
    clearFieldError('signupConfirmPasswordError');

    // Email validation
    if (!signupEmail.value.trim()) {
        showFieldError('signupEmailError', 'Email is required');
        signupEmail.classList.add('input-error');
        isValid = false;
    } else if (!validateEmail(signupEmail.value.trim())) {
        showFieldError('signupEmailError', 'Please enter a valid email');
        signupEmail.classList.add('input-error');
        isValid = false;
    } else {
        signupEmail.classList.remove('input-error');
    }

    // Password validation
    if (!signupPassword.value.trim()) {
        showFieldError('signupPasswordError', 'Password is required');
        signupPassword.classList.add('input-error');
        isValid = false;
    } else if (signupPassword.value.length < 6) {
        showFieldError('signupPasswordError', 'Password must be at least 6 characters');
        signupPassword.classList.add('input-error');
        isValid = false;
    } else {
        signupPassword.classList.remove('input-error');
        checkPasswordStrength(signupPassword.value);
    }

    // Confirm password validation
    if (!signupConfirmPassword.value.trim()) {
        showFieldError('signupConfirmPasswordError', 'Please confirm your password');
        signupConfirmPassword.classList.add('input-error');
        isValid = false;
    } else if (signupPassword.value !== signupConfirmPassword.value) {
        showFieldError('signupConfirmPasswordError', 'Passwords do not match');
        signupConfirmPassword.classList.add('input-error');
        isValid = false;
    } else {
        signupConfirmPassword.classList.remove('input-error');
    }

    return isValid;
}

// Show success message
function showSuccessMessage(formElement, message) {
    // Remove any existing messages
    const existingMsg = formElement.querySelector('.form-message');
    if (existingMsg) existingMsg.remove();

    // Create success message
    const successMsg = document.createElement('div');
    successMsg.className = 'form-message success';
    successMsg.innerHTML = `<i class="fas fa-check-circle"></i> ${message}`;
    
    formElement.appendChild(successMsg);
    
    // Remove message after 3 seconds
    setTimeout(() => {
        successMsg.style.opacity = '0';
        successMsg.style.transform = 'translateY(-10px)';
        setTimeout(() => successMsg.remove(), 300);
    }, 3000);
}

// Handle login
async function handleLogin(e) {
    e.preventDefault();
    
    if (!validateLoginForm()) return;
    
    const btn = loginBtn;
    const originalText = btn.innerHTML;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Signing In...';
    btn.disabled = true;

    try {
        await signInWithEmailAndPassword(
            auth,
            loginEmail.value.trim(),
            loginPassword.value.trim()
        );

        showSuccessMessage(loginFormElement, 'Welcome back! Redirecting...');
        
        setTimeout(() => {
            window.location.href = "dashboard.html";
        }, 1500);

    } catch (error) {
        console.error('Login error:', error);
        const message = errorMessages[error.code] || errorMessages.default;
        
        if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password') {
            showFieldError('loginEmailError', message);
            loginEmail.classList.add('input-error');
            loginPassword.classList.add('input-error');
        } else if (error.code === 'auth/invalid-email') {
            showFieldError('loginEmailError', message);
            loginEmail.classList.add('input-error');
        } else {
            // Show general error
            const errorMsg = document.createElement('div');
            errorMsg.className = 'form-message error';
            errorMsg.innerHTML = `<i class="fas fa-exclamation-circle"></i> ${message}`;
            loginFormElement.appendChild(errorMsg);
            
            setTimeout(() => errorMsg.remove(), 5000);
        }
    } finally {
        btn.innerHTML = originalText;
        btn.disabled = false;
    }
}

// Handle signup
async function handleSignup(e) {
    e.preventDefault();
    
    if (!validateSignupForm()) return;
    
    const btn = signupBtn;
    const originalText = btn.innerHTML;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Creating Account...';
    btn.disabled = true;

    try {
        await createUserWithEmailAndPassword(
            auth,
            signupEmail.value.trim(),
            signupPassword.value.trim()
        );

        showSuccessMessage(signupFormElement, 'Account created successfully! Redirecting...');
        
        setTimeout(() => {
            window.location.href = "dashboard.html";
        }, 1500);

    } catch (error) {
        console.error('Signup error:', error);
        const message = errorMessages[error.code] || errorMessages.default;
        
        if (error.code === 'auth/email-already-in-use') {
            showFieldError('signupEmailError', message);
            signupEmail.classList.add('input-error');
        } else if (error.code === 'auth/invalid-email') {
            showFieldError('signupEmailError', message);
            signupEmail.classList.add('input-error');
        } else if (error.code === 'auth/weak-password') {
            showFieldError('signupPasswordError', message);
            signupPassword.classList.add('input-error');
        } else {
            // Show general error
            const errorMsg = document.createElement('div');
            errorMsg.className = 'form-message error';
            errorMsg.innerHTML = `<i class="fas fa-exclamation-circle"></i> ${message}`;
            signupFormElement.appendChild(errorMsg);
            
            setTimeout(() => errorMsg.remove(), 5000);
        }
    } finally {
        btn.innerHTML = originalText;
        btn.disabled = false;
    }
}

// Real-time validation
function initRealTimeValidation() {
    // Login form real-time validation
    loginEmail.addEventListener('input', () => {
        clearFieldError('loginEmailError');
        loginEmail.classList.remove('input-error');
    });

    loginPassword.addEventListener('input', () => {
        clearFieldError('loginPasswordError');
        loginPassword.classList.remove('input-error');
    });

    // Signup form real-time validation
    signupEmail.addEventListener('input', () => {
        clearFieldError('signupEmailError');
        signupEmail.classList.remove('input-error');
    });

    signupPassword.addEventListener('input', () => {
        clearFieldError('signupPasswordError');
        signupPassword.classList.remove('input-error');
        
        if (signupPassword.value) {
            checkPasswordStrength(signupPassword.value);
        } else {
            passwordStrengthFill.style.width = '0%';
            passwordStrengthText.textContent = 'Password strength: Weak';
        }
    });

    signupConfirmPassword.addEventListener('input', () => {
        clearFieldError('signupConfirmPasswordError');
        signupConfirmPassword.classList.remove('input-error');
    });
}

// Initialize everything
function init() {
    initFormSwitching();
    initPasswordToggles();
    initRealTimeValidation();
    
    // Form submissions
    loginFormElement.addEventListener('submit', handleLogin);
    signupFormElement.addEventListener('submit', handleSignup);
    
    // Enter key support
    loginEmail.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            loginPassword.focus();
        }
    });
    
    loginPassword.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            handleLogin(e);
        }
    });
    
    signupEmail.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            signupPassword.focus();
        }
    });
    
    signupPassword.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            signupConfirmPassword.focus();
        }
    });
    
    signupConfirmPassword.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            handleSignup(e);
        }
    });
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', init);

// Make functions available globally for debugging
window.validateLoginForm = validateLoginForm;
window.validateSignupForm = validateSignupForm;