import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { prisma } from '../prisma.js';
import { generateToken, authMiddleware } from '../middleware/auth.js';

const router = Router();

// POST /api/auth/register - Create a new user account with isolated profile
router.post('/register', async (req: Request, res: Response) => {
  try {
    const { email, password, name } = req.body;

    if (!email || typeof email !== 'string') {
      return res.status(400).json({ error: 'A valid email address is required.' });
    }

    if (!password || typeof password !== 'string' || password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters long.' });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(normalizedEmail)) {
      return res.status(400).json({ error: 'Invalid email format.' });
    }

    const cleanName = (name && typeof name === 'string' && name.trim()) ? name.trim() : normalizedEmail.split('@')[0];

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (existingUser) {
      return res.status(409).json({ error: 'An account with this email already exists. Please sign in.' });
    }

    // Hash password securely
    const passwordHash = await bcrypt.hash(password, 10);

    // Create user
    const user = await prisma.user.create({
      data: {
        email: normalizedEmail,
        passwordHash,
        name: cleanName,
        role: 'USER',
      },
    });

    // Auto-create initial candidate profile for this user
    await prisma.candidateProfile.create({
      data: {
        userId: user.id,
        fullName: cleanName,
        email: normalizedEmail,
        degree: 'B.Tech / B.S. in Computer Science',
        targetBatch: 2028,
        targetRoles: 'SWE, SDE, Backend, Fullstack, Systems',
        emailAlertsEnabled: true,
        alertFrequency: 'INSTANT',
      },
    });

    const token = generateToken({
      userId: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    });

    res.status(201).json({
      success: true,
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
    });
  } catch (error: any) {
    console.error('[Auth Register Error]:', error);
    res.status(500).json({ error: error.message || 'Registration failed.' });
  }
});

// POST /api/auth/login - Authenticate existing user
router.post('/login', async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required.' });
    }

    const normalizedEmail = (email as string).trim().toLowerCase();

    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    // Ensure candidate profile exists
    const profile = await prisma.candidateProfile.findUnique({
      where: { userId: user.id },
    });

    if (!profile) {
      await prisma.candidateProfile.create({
        data: {
          userId: user.id,
          fullName: user.name,
          email: user.email,
          degree: 'B.Tech / B.S. in Computer Science',
          targetBatch: 2028,
          targetRoles: 'SWE, SDE, Backend, Fullstack, Systems',
          emailAlertsEnabled: true,
          alertFrequency: 'INSTANT',
        },
      });
    }

    const token = generateToken({
      userId: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    });

    res.json({
      success: true,
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
    });
  } catch (error: any) {
    console.error('[Auth Login Error]:', error);
    res.status(500).json({ error: error.message || 'Login failed.' });
  }
});

// GET /api/auth/me - Retrieve currently authenticated user session
router.get('/me', authMiddleware, async (req: Request, res: Response) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.userId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
      },
    });

    if (!user) {
      return res.status(404).json({ error: 'User account not found.' });
    }

    res.json({ user });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
