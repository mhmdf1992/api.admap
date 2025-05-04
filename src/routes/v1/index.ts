import express from 'express';
import { userRoutes } from './user';
import { authRoutes } from './auth';
import { logRoutes } from './log';
import { userActivityRoutes } from './user-activity';
import { adminAuth } from '../../middlewares/admin-auth';

export const routes = express.Router();
routes.use('/auth', authRoutes);
routes.use('/users', adminAuth, userRoutes);
routes.use('/logs', adminAuth, logRoutes);
routes.use('/user-activity', adminAuth, userActivityRoutes);

