const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

/**
 * @swagger
 * tags:
 *   - name: Auth
 *     description: User authentication
 */

/**
 * @swagger
 * /api/auth/signup:
 *   post:
 *     summary: Register a new user
 *     tags:
 *       - Auth
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               username:
 *                 type: string
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       201:
 *         description: User registered successfully
 */
router.post('/signup', authController.signup);

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Login and get a JWT token
 *     tags:
 *       - Auth
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Login successful
 */
router.post('/login', authController.login);









/****************************************************** */

/**
 * @swagger
 * /api/auth/forgot-password:
 *   post:
 *     summary: Send forgot password reset link
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *                 example: test@gmail.com
 *     responses:
 *       200:
 *         description: Reset link sent
 */
router.post("/forgot-password", authController.forgotPassword);


// /**
//  * @swagger
//  * /api/auth/reset-password/{token}:
//  *   get:
//  *     summary: Open reset password page
//  *     tags: [Auth]
//  *     parameters:
//  *       - in: path
//  *         name: token
//  *         required: true
//  *         schema:
//  *           type: string
//  *     responses:
//  *       200:
//  *         description: Reset page opened
//  */
// router.get("/reset-password/:token", authController.openResetPage);


// /**
//  * @swagger
//  * /api/auth/reset-password/{token}:
//  *   post:
//  *     summary: Reset password
//  *     tags: [Auth]
//  *     parameters:
//  *       - in: path
//  *         name: token
//  *         required: true
//  *         schema:
//  *           type: string
//  *     requestBody:
//  *       required: true
//  *       content:
//  *         application/json:
//  *           schema:
//  *             type: object
//  *             properties:
//  *               password:
//  *                 type: string
//  *                 example: newPassword123
//  *     responses:
//  *       200:
//  *         description: Password changed successfully
//  */
// router.post("/reset-password/:token", authController.resetPassword);



module.exports = router;
