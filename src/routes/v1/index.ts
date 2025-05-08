import express from 'express';
import { userRoutes } from './user';
import { authRoutes } from './auth';
import { logRoutes } from './log';
import { userActivityRoutes } from './user-activity';
import { adminAuth } from '../../middlewares/admin-auth';
import { adRoutes } from './ad';
import { adAdminRoutes } from './ad-admin';
import { auth } from '../../middlewares/auth';

export const routes = express.Router();
routes.use('/auth', authRoutes);
routes.use('/ads', auth, adRoutes);
routes.use('/ads-admin', adminAuth, adAdminRoutes);
routes.use('/users', adminAuth, userRoutes);
routes.use('/logs', adminAuth, logRoutes);
routes.use('/user-activity', adminAuth, userActivityRoutes);

