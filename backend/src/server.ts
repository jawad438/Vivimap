// Load environment variables FIRST to ensure they are available for all imported modules.
import dotenv from 'dotenv';
dotenv.config();

import express, { type Request, type Response } from 'express';
import cors from 'cors';
import jwt from 'jsonwebtoken';
import path from 'path';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';
import { body, validationResult } from 'express-validator';

import connectDB from './config/database';
import { hashPassword, comparePassword } from './lib/password';
import { sendVerificationEmail } from './services/emailService';
import { protect, AuthRequest } from './middleware/auth';

import User from './models/User';
import VerificationCode from './models/VerificationCode';
import Memory from './models/Memory';

// --- INITIALIZATION & CONFIG ---
const app = express();
const PORT = process.env.PORT || 3001;
const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
    throw new Error('FATAL: JWT_SECRET is not defined in environment variables.');
}

// --- MIDDLEWARE ---
app.use(cors({
    origin: 'http://localhost:8080', // In a real deployment, you'd set this to your frontend's domain
    credentials: true,
}));
app.use(express.json());
app.use(cookieParser());

// Rate Limiting for Auth routes to prevent brute-force attacks
const authLimiter = rateLimit({
	windowMs: 15 * 60 * 1000, // 15 minutes
	max: 10, // Limit each IP to 10 requests per windowMs
	standardHeaders: true,
	legacyHeaders: false,
    message: 'Too many requests from this IP, please try again after 15 minutes',
});

// --- STATIC FILE SERVING ---
const projectRoot = path.resolve(__dirname, '..', '..');
app.use(express.static(projectRoot));

// --- AUTH ROUTES ---
const authRouter = express.Router();
authRouter.use(authLimiter);
app.use('/api/auth', authRouter);

// 1. Sign Up
const signupValidation = [
    body('email').isEmail().withMessage('Please enter a valid email.').normalizeEmail(),
    body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters long.'),
    body('fullName').trim().notEmpty().withMessage('Full name is required.').escape(),
    body('username').trim().isLength({ min: 3 }).withMessage('Username must be at least 3 characters.').isAlphanumeric().withMessage('Username can only contain letters and numbers.').escape(),
];

authRouter.post('/signup', signupValidation, async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ message: errors.array()[0].msg });
    }

    const { email, password, fullName, username } = req.body;

    try {
        const existingUser = await User.findOne({ $or: [{ email: email.toLowerCase() }, { username: username.toLowerCase() }] });
        if (existingUser) {
            return res.status(409).json({ message: 'Email or username already in use.' });
        }

        const hashedPassword = await hashPassword(password);
        await User.create({ email, password: hashedPassword, fullName, username, emailVerified: false });

        const code = Math.floor(10000 + Math.random() * 90000).toString();
        const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

        await VerificationCode.create({ code, email, expiresAt });
        
        res.status(201).json({ message: 'User created. Please check your email for a verification code.' });

        sendVerificationEmail(email, code).catch(err => {
            console.error(`[CRITICAL_EMAIL_FAILURE] Failed to send verification email to ${email}`, err);
        });

    } catch (error) {
        console.error('Signup error:', error);
        res.status(500).json({ message: 'Internal server error.' });
    }
});

// 2. Verify Email
authRouter.post('/verify-email', async (req: Request, res: Response) => {
    const { email, code } = req.body;

    if (!email || !code) {
        return res.status(400).json({ message: 'Email and verification code are required.' });
    }
    
    try {
        const verificationRequest = await VerificationCode.findOne({ email, code, expiresAt: { $gt: new Date() } });
        if (!verificationRequest) {
            return res.status(400).json({ message: 'Invalid or expired verification code.' });
        }
        
        const user = await User.findOne({ email: email.toLowerCase() });
        if (!user) {
            return res.status(404).json({ message: 'User associated with this code not found.' });
        }

        user.emailVerified = true;
        await user.save();
        await VerificationCode.deleteOne({ _id: verificationRequest._id });
        
        const tokenPayload = { user: { id: user._id, email: user.email, fullName: user.fullName, username: user.username } };
        const token = jwt.sign(tokenPayload, JWT_SECRET, { expiresIn: '7d' });

        res.cookie('token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
        });

        res.status(200).json({ user: tokenPayload.user });

    } catch (error) {
        console.error('Verification error:', error);
        res.status(500).json({ message: 'Internal server error.' });
    }
});

// 3. Login
authRouter.post('/login', async (req: Request, res: Response) => {
    const { email, password } = req.body;
    if (!email || !password) {
        return res.status(400).json({ message: 'Email and password are required.' });
    }

    try {
        const user = await User.findOne({ email: email.toLowerCase() }).select('+password');
        if (!user) {
            return res.status(401).json({ message: 'Invalid credentials.' });
        }

        const isPasswordValid = await comparePassword(password, user.password!);
        if (!isPasswordValid) {
            return res.status(401).json({ message: 'Invalid credentials.' });
        }

        if (!user.emailVerified) {
            const code = Math.floor(10000 + Math.random() * 90000).toString();
            const expiresAt = new Date(Date.now() + 5 * 60 * 1000);
            await VerificationCode.findOneAndUpdate({ email }, { code, expiresAt }, { upsert: true, new: true });
            
            res.status(403).json({ 
                message: 'Email not verified. We have sent you a new verification code.', 
                requiresVerification: true,
                email: user.email
            });

            sendVerificationEmail(email, code).catch(err => {
                console.error(`[CRITICAL_EMAIL_FAILURE] Failed to send verification email on login to ${email}`, err);
            });
            return;
        }
        
        const tokenPayload = { user: { id: user._id, email: user.email, fullName: user.fullName, username: user.username } };
        const token = jwt.sign(tokenPayload, JWT_SECRET, { expiresIn: '7d' });

        res.cookie('token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
        });
        
        res.status(200).json({ user: tokenPayload.user });

    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ message: 'Internal server error.' });
    }
});

// 4. Resend Verification Code
authRouter.post('/resend-verification', async (req: Request, res: Response) => {
    const { email } = req.body;
    if (!email) {
        return res.status(400).json({ message: 'Email is required.' });
    }

    try {
        const user = await User.findOne({ email: email.toLowerCase() });
        if (!user) {
            return res.status(404).json({ message: 'User not found.' });
        }
        if (user.emailVerified) {
            return res.status(400).json({ message: 'Email is already verified.' });
        }

        await VerificationCode.deleteMany({ email });
        
        const code = Math.floor(10000 + Math.random() * 90000).toString();
        const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

        await VerificationCode.create({ code, email, expiresAt });
        
        res.status(200).json({ message: 'A new verification code has been sent to your email.' });

        sendVerificationEmail(email, code).catch(err => {
            console.error(`[CRITICAL_EMAIL_FAILURE] Failed to resend verification email to ${email}`, err);
        });

    } catch (error) {
        console.error('Resend code error:', error);
        res.status(500).json({ message: 'Internal server error.' });
    }
});

// 5. Get current session from cookie
authRouter.get('/session', async (req: Request, res: Response) => {
    const token = req.cookies.token;
    if (!token) {
        return res.status(401).json({ message: 'Not authenticated.' });
    }

    try {
        const decoded = jwt.verify(token, JWT_SECRET) as { user: { id: string } };
        const user = await User.findById(decoded.user.id);
        if (!user) {
            return res.status(404).json({ message: 'User not found.' });
        }
        res.status(200).json({ user: { id: user._id, email: user.email, fullName: user.fullName, username: user.username } });
    } catch (error) {
        res.status(401).json({ message: 'Invalid token.' });
    }
});


// 6. Logout
authRouter.post('/logout', (req: Request, res: Response) => {
    res.clearCookie('token');
    res.status(200).json({ message: 'Logged out successfully' });
});


// --- MEMORY ROUTES ---
app.get('/api/memories', async (req: Request, res: Response) => {
    try {
        const memoriesFromDb = await Memory.find().populate({ path: 'author', select: 'username' }).lean();
        const memoriesForFrontend = memoriesFromDb.map(mem => ({
            id: mem._id.toString(),
            title: mem.title,
            description: mem.description,
            position: mem.position,
            files: mem.files,
            author: (mem.author as any)?.username || 'Unknown',
        }));
        res.status(200).json(memoriesForFrontend);
    } catch (error) {
        console.error('Error fetching memories from database:', error);
        res.status(500).json({ message: 'Internal server error while fetching memories.' });
    }
});

app.post('/api/memories', protect, async (req: AuthRequest, res: Response) => {
    const { title, description, position, files } = req.body;

    if (!title || !position) {
        return res.status(400).json({ message: 'Title and position are required.' });
    }

    try {
        const memory = new Memory({
            title,
            description,
            position,
            files,
            author: req.user!.id,
        });

        const createdMemory = await memory.save();
        const authorDoc = await User.findById(req.user!.id).select('username').lean();
        
        const memoryForFrontend = {
            id: createdMemory._id.toString(),
            title: createdMemory.title,
            description: createdMemory.description,
            position: createdMemory.position,
            files: createdMemory.files,
            author: authorDoc ? authorDoc.username : 'Unknown',
        };
        
        res.status(201).json(memoryForFrontend);
    } catch (error) {
        console.error('Create memory error:', error);
        res.status(500).json({ message: 'Failed to create memory.' });
    }
});

// --- SPA FALLBACK ---
app.get(/^(?!\/api).*/, (req: Request, res: Response) => {
    res.sendFile(path.join(projectRoot, 'index.html'));
});

// --- SERVER START ---
const startServer = async () => {
    try {
        await connectDB();
        app.listen(PORT, () => {
            console.log(`Vivimap server running on http://localhost:${PORT}`);
        });
    } catch (error) {
        console.error("!!! DATABASE CONNECTION FAILED !!!");
        console.error("The server could not start. This is likely due to a network issue or incorrect MongoDB URI.");
        console.error("Error details:", error);
        (process as any).exit(1);
    }
};

startServer();