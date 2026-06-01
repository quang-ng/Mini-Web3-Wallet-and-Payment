import { Router, Request, Response } from 'express';
import { hashPassword, comparePassword } from '../auth/password';
import { generateToken } from '../auth/jwt';
import userDb from '../db/userDb';
import { registrationLimiter, loginLimiter } from '../middleware/rateLimiter';
import logger from '../utils/logger';


const router = Router();

router.post('/register', registrationLimiter, async (req: Request, res: Response) => {
  try {
    const { email, name, password } = req.body;
    logger.debug('Auth', 'Register request', { email, name });

    if (!email || !name || !password) {
      logger.warn('Auth', 'Register validation failed - missing fields', { email, name });
      return res.status(400).json({ error: 'Email, name, and password required' });
    }

    const existingUser = await userDb.findUserByEmail(email);
    if (existingUser) {
      logger.warn('Auth', 'Register failed - email already exists', { email });
      return res.status(409).json({ error: 'Email already registered' });
    }

    logger.debug('Auth', 'Hashing password for new user', { email });
    const passwordHash = await hashPassword(password);
    const user = await userDb.createUser(email, name, passwordHash);


    logger.info('Auth', 'User registered successfully', { userId: user.id, email });
    res.status(201).json({
      success: true,
      user: { id: user.id, email: user.email, name: user.name },
    });
  } catch (error) {
    logger.error('Auth', 'Register error:', error);
    res.status(500).json({ error: 'Registration failed' });
  }
});

router.post('/login', loginLimiter, async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    logger.debug('Auth', 'Login request', { email });

    if (!email || !password) {
      logger.warn('Auth', 'Login validation failed - missing fields');
      return res.status(400).json({ error: 'Email and password required' });
    }

    const user = await userDb.findUserByEmail(email);
    if (!user) {
      logger.warn('Auth', 'Login failed - user not found', { email });
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    logger.debug('Auth', 'Comparing password hash', { email });
    const passwordMatch = await comparePassword(password, user.password_hash);
    if (!passwordMatch) {
      logger.warn('Auth', 'Login failed - invalid password', { email });
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const token = generateToken(user.id, user.email);
    logger.info('Auth', 'User logged in successfully', { userId: user.id, email });

    res.json({
      success: true,
      token,
      user: { id: user.id, email: user.email, name: user.name },
    });
  } catch (error) {
    logger.error('Auth', 'Login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
});

export default router;
