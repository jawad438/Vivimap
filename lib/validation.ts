
export interface PasswordValidationResult {
    isValid: boolean;
    messages: string[];
}

const commonPasswords = [
    '123456', 'password', '12345678', 'qwerty', '123456789', '1234', '111111', 'admin', '123123', 'secret'
];

const allowedDomains = [
    'gmail.com', 'yahoo.com', 'outlook.com', 'hotmail.com', 'icloud.com', 'aol.com',
    'mail.com', 'protonmail.com', 'live.com', 'msn.com', 'yandex.com', 'zoho.com', 'gmx.com', 'me.com'
];

const blockedDomains = [
    'mailinator.com', 'temp-mail.org', '10minutemail.com', 'guerrillamail.com'
];

export function validateEmail(email: string): string | null {
    if (!email || !email.includes('@')) {
        return "Please enter a valid email address.";
    }
    const domain = email.split('@')[1].toLowerCase();

    if (blockedDomains.includes(domain)) {
        return "Temporary email addresses are not allowed.";
    }

    if (!allowedDomains.includes(domain)) {
        return "Sorry, only popular email providers are allowed at this time.";
    }

    return null; // Email is valid
}

export function validatePassword(password: string, email: string): PasswordValidationResult {
    const messages: string[] = [];
    let isValid = true;

    if (password.length < 8) {
        messages.push("Password must be at least 8 characters long.");
        isValid = false;
    }

    if (!/\d/.test(password) || !/[a-zA-Z]/.test(password)) {
        messages.push("Password must include both letters and numbers.");
        isValid = false;
    }

    if (commonPasswords.includes(password.toLowerCase())) {
        messages.push("Password is too common. Please choose a stronger one.");
        isValid = false;
    }
    
    if (email) {
        const emailUsername = email.split('@')[0];
        if (emailUsername && password.toLowerCase().includes(emailUsername.toLowerCase())) {
            messages.push("Password should not contain your email address.");
            isValid = false;
        }
    }


    return { isValid, messages };
}

export function validateName(name: string): string | null {
    if (name.trim().length < 3) return "Full name must be at least 3 characters.";
    if (name.trim().length > 50) return "Full name cannot exceed 50 characters.";
    if (!/^[a-zA-Z\s'-]+$/.test(name)) return "Full name can only contain letters, spaces, hyphens, and apostrophes.";
    return null;
}

export function validateUsername(username: string): string | null {
    if (username.length < 3) return "Username must be at least 3 characters.";
    if (username.length > 20) return "Username cannot exceed 20 characters.";
    if (!/^[a-zA-Z0-9_]+$/.test(username)) return "Username can only contain letters, numbers, and underscores.";
    return null;
}

export function validateVerificationCode(code: string): string | null {
    if (!/^\d{5}$/.test(code)) {
        return "Please enter a valid 5-digit code.";
    }
    return null;
}
