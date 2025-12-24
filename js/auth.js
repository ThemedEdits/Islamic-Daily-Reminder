import { auth } from "./firebase.js";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";

const emailInput = document.getElementById("email");
const passwordInput = document.getElementById("password");
const msg = document.getElementById("msg");

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
    'default': 'An error occurred. Please try again.'
};

// Show message with animation
function showMessage(text, type = 'error') {
    msg.textContent = text;
    msg.className = `message ${type}`;
    msg.style.display = 'block';
    
    if (type === 'success') {
        setTimeout(() => {
            msg.style.opacity = '0';
            msg.style.transform = 'translateY(-10px)';
            setTimeout(() => {
                msg.style.display = 'none';
                msg.style.opacity = '1';
                msg.style.transform = 'translateY(0)';
            }, 300);
        }, 3000);
    }
}

// Validate inputs
function validateInputs() {
    const email = emailInput.value.trim();
    const password = passwordInput.value.trim();
    
    if (!email || !password) {
        showMessage('Please fill in all fields', 'error');
        return false;
    }
    
    if (password.length < 6) {
        showMessage('Password must be at least 6 characters', 'error');
        return false;
    }
    
    return true;
}

// Button click handlers with loading states
document.getElementById("signupBtn").onclick = async () => {
    if (!validateInputs()) return;
    
    const btn = document.getElementById("signupBtn");
    const originalText = btn.innerHTML;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Creating Account...';
    btn.disabled = true;
    
    try {
        await createUserWithEmailAndPassword(
            auth,
            emailInput.value,
            passwordInput.value
        );
        
        showMessage('Account created successfully! Redirecting...', 'success');
        setTimeout(() => {
            window.location.href = "dashboard.html";
        }, 1500);
        
    } catch (e) {
        const message = errorMessages[e.code] || errorMessages.default;
        showMessage(message, 'error');
        
        // Add shake animation to inputs
        emailInput.classList.add('shake');
        passwordInput.classList.add('shake');
        setTimeout(() => {
            emailInput.classList.remove('shake');
            passwordInput.classList.remove('shake');
        }, 500);
    } finally {
        btn.innerHTML = originalText;
        btn.disabled = false;
    }
};

document.getElementById("loginBtn").onclick = async () => {
    if (!validateInputs()) return;
    
    const btn = document.getElementById("loginBtn");
    const originalText = btn.innerHTML;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Signing In...';
    btn.disabled = true;
    
    try {
        await signInWithEmailAndPassword(
            auth,
            emailInput.value,
            passwordInput.value
        );
        
        showMessage('Welcome back! Redirecting...', 'success');
        setTimeout(() => {
            window.location.href = "dashboard.html";
        }, 1500);
        
    } catch (e) {
        const message = errorMessages[e.code] || errorMessages.default;
        showMessage(message, 'error');
        
        // Add shake animation to inputs
        emailInput.classList.add('shake');
        passwordInput.classList.add('shake');
        setTimeout(() => {
            emailInput.classList.remove('shake');
            passwordInput.classList.remove('shake');
        }, 500);
    } finally {
        btn.innerHTML = originalText;
        btn.disabled = false;
    }
};

// Add enter key support
emailInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        passwordInput.focus();
    }
});

passwordInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        document.getElementById("loginBtn").click();
    }
});

// Add CSS for shake animation
const style = document.createElement('style');
style.textContent = `
    .shake {
        animation: shake 0.5s ease-in-out;
    }
    
    @keyframes shake {
        0%, 100% { transform: translateX(0); }
        25% { transform: translateX(-5px); }
        75% { transform: translateX(5px); }
    }
`;
document.head.appendChild(style);