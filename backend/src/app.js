import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';

// Import Middlewares
import { verifyAuth } from './middleware/authMiddleware.js';
import { restrictTo } from './middleware/roleMiddleware.js';
import { errorHandler } from './middleware/errorHandler.js';

// Import Controllers
import * as authController from './controllers/authController.js';
import * as profileController from './controllers/profileController.js';
import * as discoveryController from './controllers/discoveryController.js';
import * as bookingController from './controllers/bookingController.js';
import * as notificationController from './controllers/notificationController.js';
import * as adminController from './controllers/adminController.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Security Middlewares
app.use(helmet({
  crossOriginResourcePolicy: false // Allows loading local resource images or placeholders smoothly
}));

app.use(cors({
  origin: ['http://localhost:3000', 'https://want-a-bai.firebaseapp.com'],
  credentials: true
}));

app.use(express.json());

// Rate Limiter
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per window
  message: { error: 'Too many requests from this IP, please try again after 15 minutes' }
});
app.use('/api/', limiter);

// Health Check
app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'ok', timestamp: new Date() });
});

// Auth Route
app.post('/api/auth/sync', verifyAuth, authController.syncAuth);

// Profile Routes
app.get('/api/profiles/me', verifyAuth, profileController.getMyProfile);
app.post('/api/profiles/client', verifyAuth, restrictTo('CLIENT'), profileController.upsertClientProfile);
app.post('/api/profiles/maid', verifyAuth, restrictTo('MAID'), profileController.upsertMaidProfile);

// Discovery Route
app.get('/api/discovery/maids', verifyAuth, discoveryController.discoverMaids);

// Booking Routes
app.get('/api/bookings/my', verifyAuth, bookingController.getMyBookings);
app.post('/api/bookings/thread', verifyAuth, restrictTo('CLIENT'), bookingController.initializeThread);
app.post('/api/bookings/request', verifyAuth, restrictTo('CLIENT'), bookingController.raiseRequest);
app.post('/api/bookings/request/:requestId/action', verifyAuth, restrictTo('MAID'), bookingController.respondToRequest);
app.post('/api/bookings/terminate/:appointmentId', verifyAuth, restrictTo('CLIENT'), bookingController.requestTermination);
app.post('/api/bookings/terminate/:appointmentId/approve', verifyAuth, restrictTo('MAID'), bookingController.approveTermination);

// Notification Routes
app.get('/api/notifications', verifyAuth, notificationController.getNotifications);
app.put('/api/notifications/:id/read', verifyAuth, notificationController.markAsRead);

// Admin Service Catalog (Exposed GET publicly to authenticated users for dropdowns)
app.get('/api/admin/services', verifyAuth, adminController.getServices);

// Strictly Protected Administrative Endpoints
app.get('/api/admin/analytics', verifyAuth, restrictTo('ADMIN'), adminController.getAnalytics);
app.post('/api/admin/services', verifyAuth, restrictTo('ADMIN'), adminController.createService);
app.delete('/api/admin/services/:serviceId', verifyAuth, restrictTo('ADMIN'), adminController.deleteService);
app.get('/api/admin/users', verifyAuth, restrictTo('ADMIN'), adminController.getUsers);
app.delete('/api/admin/users/:userId', verifyAuth, restrictTo('ADMIN'), adminController.deleteUser);
app.post('/api/admin/users/promote', verifyAuth, restrictTo('ADMIN'), adminController.promoteToAdmin);
app.get('/api/admin/bookings', verifyAuth, restrictTo('ADMIN'), adminController.getBookings);
app.post('/api/admin/appointments/:appointmentId/cancel', verifyAuth, restrictTo('ADMIN'), adminController.forceCancelAppointment);

// 404 Route handler
app.use((req, res, next) => {
  res.status(404).json({ error: `Not Found: ${req.method} ${req.url}` });
});

// Global Error Handler Middleware
app.use(errorHandler);

// Start listening
app.listen(PORT, () => {
  console.log(`Want-A-Bai Backend server running on http://localhost:${PORT}`);
});
