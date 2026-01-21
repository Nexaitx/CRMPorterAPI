const User = require('../models/user');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const sendMail = require("../utils/sendMail");
const crypto = require("crypto");


// --- 1. SIGN UP LOGIC ---
exports.signup = async (req, res) => {
  try {
    const { username, email, password, confirmPassword } = req.body;

    // Check if user already exists
    let user = await User.findOne({ email });
    if (user) return res.status(400).json({ msg: 'User already exists' });

    // Check if passwords match
    if (password !== confirmPassword) {
      return res.status(400).json({ msg: 'Passwords do not match' });
    }

    // Hash the password (Encryption)
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create new user
    user = new User({
      username,
      email,
      password: hashedPassword
    });

    await user.save();
    res.status(201).json({ msg: 'User registered successfully' });

  } catch (err) {
    res.status(500).send('Server Error');
  }
};

// --- 2. LOGIN LOGIC ---
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Check if user exists
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ msg: 'Invalid Credentials' });

    // Validate Password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ msg: 'Invalid Credentials' });

    // Generate JWT Token
    const payload = { userId: user._id };
    const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '1h' });

    res.json({ token });

  } catch (err) {
    res.status(500).send('Server Error');
  }
};


/********************* */
/**
 * @desc   Forgot Password - Send reset link
 * @route  POST /api/auth/forgot-password
 */
exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const token = crypto.randomBytes(32).toString("hex");

    user.resetToken = token;
    user.resetTokenExpiry = Date.now() + 30 * 60 * 1000; // 30 min
    await user.save();

    // https://crmporterapi.onrender.com

         const resetLink = `https://crmporterapi.onrender.com/api/auth/reset-password/${token}`;

    //  const resetLink = `http://localhost:3000/api/auth/reset-password/${token}`;

    await sendMail(user.email, resetLink);

    res.json({ message: "Reset password link sent to your email" });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};


/**
 * @desc   Open Reset Password Page
 * @route  GET /api/auth/reset-password/{token}
 */
exports.openResetPage = async (req, res) => {
  try {
    const { token } = req.params;

    const user = await User.findOne({
      resetToken: token,
      resetTokenExpiry: { $gt: Date.now() }
    });

    if (!user) {
      return res.send(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>Reset Password</title>
          <style>
            body { 
              font-family: Arial, sans-serif; 
              padding: 50px; 
              text-align: center; 
              background-color: #f5f5f5;
            }
            .container {
              background: white;
              padding: 40px;
              border-radius: 10px;
              box-shadow: 0 0 10px rgba(0,0,0,0.1);
              display: inline-block;
              max-width: 500px;
            }
            .error {
              color: #e74c3c;
            }
            .btn {
              display: inline-block;
              padding: 10px 20px;
              background-color: #3498db;
              color: white;
              text-decoration: none;
              border-radius: 5px;
              margin-top: 20px;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <h2 class="error">❌ Invalid Reset Link</h2>
            <p>This password reset link has expired or is invalid.</p>
            <p>Please request a new reset link.</p>
            <a href="/api/auth/forgot-password" class="btn">Request New Reset Link</a>
          </div>
        </body>
        </html>
      `);
    }

    res.send(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Reset Password</title>
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
        <style>
          * {
            box-sizing: border-box;
            margin: 0;
            padding: 0;
          }
          
          body { 
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
            padding: 20px; 
            text-align: center; 
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            display: flex;
            justify-content: center;
            align-items: center;
          }
          
          .container {
            background: white;
            padding: 40px 30px;
            border-radius: 15px;
            box-shadow: 0 15px 35px rgba(0,0,0,0.2);
            width: 100%;
            max-width: 450px;
            text-align: left;
          }
          
          h2 {
            color: #333;
            margin-bottom: 10px;
            text-align: center;
            font-size: 28px;
          }
          
          .subtitle {
            color: #666;
            text-align: center;
            margin-bottom: 30px;
            font-size: 14px;
          }
          
          .form-group {
            margin-bottom: 20px;
            position: relative;
          }
          
          label {
            display: block;
            margin-bottom: 8px;
            color: #555;
            font-weight: 500;
          }
          
          .input-wrapper {
            position: relative;
            display: flex;
            align-items: center;
          }
          
          input {
            width: 100%;
            padding: 12px 45px 12px 12px;
            border: 2px solid #ddd;
            border-radius: 8px;
            font-size: 16px;
            transition: border-color 0.3s;
          }
          
          input:focus {
            outline: none;
            border-color: #667eea;
            box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
          }
          
          .toggle-password {
            position: absolute;
            right: 10px;
            background: none;
            border: none;
            cursor: pointer;
            color: #666;
            font-size: 18px;
            padding: 5px 8px;
            border-radius: 4px;
            transition: all 0.2s;
            display: flex;
            align-items: center;
            justify-content: center;
            width: 36px;
            height: 36px;
          }
          
          .toggle-password:hover {
            color: #667eea;
            background-color: #f5f5f5;
          }
          
          .toggle-password:active {
            transform: scale(0.95);
          }
          
          .error-message {
            color: #e74c3c;
            font-size: 14px;
            margin-top: 5px;
            display: none;
          }
          
          .success-message {
            color: #2ecc71;
            font-size: 14px;
            margin-top: 5px;
            display: none;
          }
          
          .requirements {
            font-size: 12px;
            color: #666;
            margin-top: 5px;
          }
          
          button[type="submit"] {
            width: 100%;
            padding: 14px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            border: none;
            border-radius: 8px;
            font-size: 16px;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.3s;
            margin-top: 10px;
          }
          
          button[type="submit"]:hover {
            transform: translateY(-2px);
            box-shadow: 0 5px 15px rgba(102, 126, 234, 0.4);
          }
          
          button[type="submit"]:disabled {
            background: #cccccc;
            cursor: not-allowed;
            transform: none;
            box-shadow: none;
          }
          
          .loader {
            display: none;
            text-align: center;
            margin: 20px 0;
          }
          
          .spinner {
            border: 4px solid #f3f3f3;
            border-top: 4px solid #3498db;
            border-radius: 50%;
            width: 30px;
            height: 30px;
            animation: spin 1s linear infinite;
            margin: 0 auto;
          }
          
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
          
          .password-strength {
            margin-top: 8px;
            height: 4px;
            border-radius: 2px;
            overflow: hidden;
            background-color: #eee;
          }
          
          .strength-bar {
            height: 100%;
            width: 0%;
            transition: width 0.3s, background-color 0.3s;
          }
          
          .strength-weak { background-color: #e74c3c; width: 25%; }
          .strength-fair { background-color: #f39c12; width: 50%; }
          .strength-good { background-color: #f1c40f; width: 75%; }
          .strength-strong { background-color: #2ecc71; width: 100%; }
          
          .strength-text {
            font-size: 12px;
            margin-top: 4px;
            color: #666;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <h2>🔐 Reset Password</h2>
          <p class="subtitle">Please enter your new password below</p>
          
          <form id="resetForm">
            <div class="form-group">
              <label for="password">New Password</label>
              <div class="input-wrapper">
                <input type="password" id="password" placeholder="Enter new password" required minlength="6" />
                <button type="button" class="toggle-password" id="togglePassword1">
                  <i class="fas fa-eye"></i>
                </button>
              </div>
              <div class="password-strength">
                <div class="strength-bar" id="strengthBar"></div>
              </div>
              <div class="strength-text" id="strengthText">Password strength</div>
              <div class="requirements">Password must be at least 6 characters long</div>
            </div>
            
            <div class="form-group">
              <label for="confirmPassword">Confirm Password</label>
              <div class="input-wrapper">
                <input type="password" id="confirmPassword" placeholder="Confirm new password" required minlength="6" />
                <button type="button" class="toggle-password" id="togglePassword2">
                  <i class="fas fa-eye"></i>
                </button>
              </div>
              <div id="passwordMatchMessage" class="error-message"></div>
            </div>
            
            <div class="loader" id="loader">
              <div class="spinner"></div>
              <p>Updating password...</p>
            </div>
            
            <button type="submit" id="submitBtn" disabled>Change Password</button>
          </form>
        </div>
        
        <script>
          const passwordInput = document.getElementById('password');
          const confirmPasswordInput = document.getElementById('confirmPassword');
          const passwordMatchMessage = document.getElementById('passwordMatchMessage');
          const submitBtn = document.getElementById('submitBtn');
          const loader = document.getElementById('loader');
          const form = document.getElementById('resetForm');
          const strengthBar = document.getElementById('strengthBar');
          const strengthText = document.getElementById('strengthText');
          const togglePassword1 = document.getElementById('togglePassword1');
          const togglePassword2 = document.getElementById('togglePassword2');
          
          // Toggle password visibility for first field
          togglePassword1.addEventListener('click', function() {
            togglePasswordVisibility(passwordInput, this);
          });
          
          // Toggle password visibility for second field
          togglePassword2.addEventListener('click', function() {
            togglePasswordVisibility(confirmPasswordInput, this);
          });
          
          function togglePasswordVisibility(field, button) {
            const icon = button.querySelector('i');
            if (field.type === 'password') {
              field.type = 'text';
              icon.className = 'fas fa-eye-slash';
              button.setAttribute('title', 'Hide password');
            } else {
              field.type = 'password';
              icon.className = 'fas fa-eye';
              button.setAttribute('title', 'Show password');
            }
          }
          
          function checkPasswordStrength(password) {
            let strength = 0;
            let text = '';
            
            if (password.length >= 6) strength += 25;
            if (password.length >= 8) strength += 25;
            if (/[A-Z]/.test(password)) strength += 25;
            if (/[0-9]/.test(password)) strength += 25;
            if (/[^A-Za-z0-9]/.test(password)) strength += 25;
            
            if (strength > 100) strength = 100;
            
            if (strength < 25) {
              text = 'Very weak';
              strengthBar.className = 'strength-bar';
              strengthBar.style.width = '25%';
              strengthBar.style.backgroundColor = '#e74c3c';
            } else if (strength < 50) {
              text = 'Weak';
              strengthBar.className = 'strength-bar strength-weak';
            } else if (strength < 75) {
              text = 'Fair';
              strengthBar.className = 'strength-bar strength-fair';
            } else if (strength < 100) {
              text = 'Good';
              strengthBar.className = 'strength-bar strength-good';
            } else {
              text = 'Strong';
              strengthBar.className = 'strength-bar strength-strong';
            }
            
            strengthText.textContent = text + ' password';
            strengthText.style.color = strengthBar.style.backgroundColor;
          }
          
          function validatePasswords() {
            const password = passwordInput.value;
            const confirmPassword = confirmPasswordInput.value;
            
            // Check password strength
            checkPasswordStrength(password);
            
            if (password.length < 6) {
              passwordMatchMessage.textContent = 'Password must be at least 6 characters';
              passwordMatchMessage.style.display = 'block';
              passwordMatchMessage.className = 'error-message';
              submitBtn.disabled = true;
              return false;
            }
            
            if (password && confirmPassword) {
              if (password === confirmPassword) {
                passwordMatchMessage.textContent = '✓ Passwords match';
                passwordMatchMessage.style.display = 'block';
                passwordMatchMessage.className = 'success-message';
                submitBtn.disabled = false;
                return true;
              } else {
                passwordMatchMessage.textContent = '✗ Passwords do not match';
                passwordMatchMessage.style.display = 'block';
                passwordMatchMessage.className = 'error-message';
                submitBtn.disabled = true;
                return false;
              }
            }
            
            passwordMatchMessage.style.display = 'none';
            submitBtn.disabled = true;
            return false;
          }
          
          passwordInput.addEventListener('input', validatePasswords);
          confirmPasswordInput.addEventListener('input', validatePasswords);
          
          form.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const password = passwordInput.value;
            const confirmPassword = confirmPasswordInput.value;
            
            // Final validation
            if (password !== confirmPassword) {
              passwordMatchMessage.textContent = 'Passwords do not match!';
              passwordMatchMessage.style.display = 'block';
              passwordMatchMessage.className = 'error-message';
              return;
            }
            
            if (password.length < 6) {
              passwordMatchMessage.textContent = 'Password must be at least 6 characters';
              passwordMatchMessage.style.display = 'block';
              passwordMatchMessage.className = 'error-message';
              return;
            }
            
            // Show loader and disable button
            loader.style.display = 'block';
            submitBtn.disabled = true;
            submitBtn.textContent = 'Processing...';
            
            try {
              const response = await fetch('/api/auth/reset-password/${token}', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({ 
                  password: password,
                  confirmPassword: confirmPassword
                })
              });
              
              const result = await response.text();
              
              // Hide loader
              loader.style.display = 'none';
              
              // Show result
              document.body.innerHTML = result;
              
            } catch (error) {
              // Hide loader
              loader.style.display = 'none';
              submitBtn.disabled = false;
              submitBtn.textContent = 'Change Password';
              
              // Show error
              passwordMatchMessage.textContent = 'Error: ' + error.message;
              passwordMatchMessage.style.display = 'block';
              passwordMatchMessage.className = 'error-message';
            }
          });
          
          // Initialize validation
          validatePasswords();
          
          // Tooltips for toggle buttons
          togglePassword1.setAttribute('title', 'Show password');
          togglePassword2.setAttribute('title', 'Show password');
        </script>
      </body>
      </html>
    `);
  } catch (error) {
    res.send(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Error</title>
        <style>
          body { 
            font-family: Arial, sans-serif; 
            padding: 50px; 
            text-align: center; 
            background-color: #f5f5f5;
          }
          .container {
            background: white;
            padding: 40px;
            border-radius: 10px;
            box-shadow: 0 0 10px rgba(0,0,0,0.1);
            display: inline-block;
            max-width: 500px;
          }
          .error { color: #e74c3c; }
        </style>
      </head>
      <body>
        <div class="container">
          <h2 class="error">❌ Error</h2>
          <p>${error.message}</p>
        </div>
      </body>
      </html>
    `);
  }
};



/**
 * @desc   Change Password
 * @route  POST /api/auth/reset-password/{token}
 */
exports.resetPassword = async (req, res) => {
  console.log("🔍 resetPassword called");
  console.log("🔍 Request params:", req.params);
  console.log("🔍 Request body:", req.body);
  console.log("🔍 Request headers content-type:", req.headers['content-type']);

  try {
    const { password, confirmPassword } = req.body;
    const { token } = req.params;

    // Check if password exists
    if (!password) {
      console.log(" Password missing in request body");
      return res.status(400).send(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>Error</title>
          <style>
            body { 
              font-family: Arial, sans-serif; 
              padding: 50px; 
              text-align: center; 
              background-color: #f5f5f5;
            }
            .container {
              background: white;
              padding: 40px;
              border-radius: 10px;
              box-shadow: 0 0 10px rgba(0,0,0,0.1);
              display: inline-block;
              max-width: 500px;
            }
            .error { color: #e74c3c; }
            .btn {
              display: inline-block;
              padding: 10px 20px;
              background-color: #3498db;
              color: white;
              text-decoration: none;
              border-radius: 5px;
              margin-top: 20px;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <h2 class="error">❌ Error</h2>
            <p>Password is required</p>
            <a href="/api/auth/reset-password/${token}" class="btn">Go Back</a>
          </div>
        </body>
        </html>
      `);
    }

    // Check if passwords match (server-side validation)
    if (password !== confirmPassword) {
      console.log("❌ Passwords do not match");
      return res.status(400).send(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>Error</title>
          <style>
            body { 
              font-family: Arial, sans-serif; 
              padding: 50px; 
              text-align: center; 
              background-color: #f5f5f5;
            }
            .container {
              background: white;
              padding: 40px;
              border-radius: 10px;
              box-shadow: 0 0 10px rgba(0,0,0,0.1);
              display: inline-block;
              max-width: 500px;
            }
            .error { color: #e74c3c; }
            .btn {
              display: inline-block;
              padding: 10px 20px;
              background-color: #3498db;
              color: white;
              text-decoration: none;
              border-radius: 5px;
              margin-top: 20px;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <h2 class="error">❌ Error</h2>
            <p>Passwords do not match. Please try again.</p>
            <a href="/api/auth/reset-password/${token}" class="btn">Go Back</a>
          </div>
        </body>
        </html>
      `);
    }

    // Check password length
    if (password.length < 6) {
      console.log("❌ Password too short");
      return res.status(400).send(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>Error</title>
          <style>
            body { 
              font-family: Arial, sans-serif; 
              padding: 50px; 
              text-align: center; 
              background-color: #f5f5f5;
            }
            .container {
              background: white;
              padding: 40px;
              border-radius: 10px;
              box-shadow: 0 0 10px rgba(0,0,0,0.1);
              display: inline-block;
              max-width: 500px;
            }
            .error { color: #e74c3c; }
            .btn {
              display: inline-block;
              padding: 10px 20px;
              background-color: #3498db;
              color: white;
              text-decoration: none;
              border-radius: 5px;
              margin-top: 20px;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <h2 class="error">❌ Error</h2>
            <p>Password must be at least 6 characters long.</p>
            <a href="/api/auth/reset-password/${token}" class="btn">Go Back</a>
          </div>
        </body>
        </html>
      `);
    }

    // Find user with valid token
    const user = await User.findOne({
      resetToken: token,
      resetTokenExpiry: { $gt: Date.now() }
    });

    if (!user) {
      console.log(" Invalid or expired token:", token);
      return res.status(400).send(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>Error</title>
          <style>
            body { 
              font-family: Arial, sans-serif; 
              padding: 50px; 
              text-align: center; 
              background-color: #f5f5f5;
            }
            .container {
              background: white;
              padding: 40px;
              border-radius: 10px;
              box-shadow: 0 0 10px rgba(0,0,0,0.1);
              display: inline-block;
              max-width: 500px;
            }
            .error { color: #e74c3c; }
            .btn {
              display: inline-block;
              padding: 10px 20px;
              background-color: #3498db;
              color: white;
              text-decoration: none;
              border-radius: 5px;
              margin-top: 20px;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <h2 class="error">Invalid Reset Link</h2>
            <p>This password reset link has expired or is invalid.</p>
            <p>Please request a new reset link.</p>
            <a href="/api/auth/forgot-password" class="btn">Request New Reset Link</a>
          </div>
        </body>
        </html>
      `);
    }

    console.log("✅ Valid token found for user:", user.email);

    // Hash new password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Update user
    user.password = hashedPassword;
    user.resetToken = undefined;
    user.resetTokenExpiry = undefined;

    await user.save();
    console.log(" Password updated successfully for:", user.email);

    // Success response
    res.send(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Password Reset Successful</title>
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <style>
          * {
            box-sizing: border-box;
            margin: 0;
            padding: 0;
          }
          
          body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            text-align: center;
            background: linear-gradient(135deg, #2ecc71 0%, #27ae60 100%);
            min-height: 100vh;
            display: flex;
            justify-content: center;
            align-items: center;
            padding: 20px;
          }
          
          .container {
            background: white;
            padding: 50px 40px;
            border-radius: 15px;
            box-shadow: 0 15px 35px rgba(0,0,0,0.2);
            width: 100%;
            max-width: 500px;
            text-align: center;
          }
          
          .success-icon {
            font-size: 60px;
            margin-bottom: 20px;
            color: #2ecc71;
          }
          
          h2 {
            color: #333;
            margin-bottom: 15px;
            font-size: 32px;
          }
          
          p {
            color: #666;
            margin-bottom: 10px;
            font-size: 16px;
            line-height: 1.6;
          }
          
          .email {
            color: #3498db;
            font-weight: 600;
            margin: 15px 0;
          }
          
          .btn {
            display: inline-block;
            padding: 14px 30px;
            background: linear-gradient(135deg, #3498db 0%, #2980b9 100%);
            color: white;
            text-decoration: none;
            border-radius: 8px;
            font-size: 16px;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.3s;
            margin-top: 25px;
            border: none;
          }
          
          .btn:hover {
            transform: translateY(-2px);
            box-shadow: 0 5px 15px rgba(52, 152, 219, 0.4);
          }
          
          .btn-secondary {
            display: inline-block;
            padding: 10px 20px;
            background: #f8f9fa;
            color: #333;
            text-decoration: none;
            border-radius: 6px;
            font-size: 14px;
            margin-top: 15px;
            border: 1px solid #ddd;
          }
          
          .btn-secondary:hover {
            background: #e9ecef;
          }
          
          .note {
            font-size: 14px;
            color: #888;
            margin-top: 20px;
            font-style: italic;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="success-icon">✅</div>
          <h2>Password Reset Successful!</h2>
          <p>Your password has been updated successfully.</p>
          <p>You can now login with your new password.</p>
          <div class="email">${user.email}</div>
          <a href="/api/auth/login" class="btn">Go to Login</a>
          <br>
          <a href="/" class="btn-secondary">Return to Home</a>
          <p class="note">For security reasons, please logout from all other devices.</p>
        </div>
      </body>
      </html>
    `);

  } catch (error) {
    console.error(" resetPassword error:", error);
    res.status(500).send(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Error</title>
        <style>
          body { 
            font-family: Arial, sans-serif; 
            padding: 50px; 
            text-align: center; 
            background-color: #f5f5f5;
          }
          .container {
            background: white;
            padding: 40px;
            border-radius: 10px;
            box-shadow: 0 0 10px rgba(0,0,0,0.1);
            display: inline-block;
            max-width: 600px;
          }
          .error { 
            color: #e74c3c;
            font-size: 24px;
            margin-bottom: 20px;
          }
          .btn {
            display: inline-block;
            padding: 10px 20px;
            background-color: #3498db;
            color: white;
            text-decoration: none;
            border-radius: 5px;
            margin-top: 20px;
          }
          pre {
            text-align: left;
            background: #f8f9fa;
            padding: 15px;
            border-radius: 5px;
            margin: 20px 0;
            font-size: 12px;
            overflow: auto;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <h2 class="error">❌ Server Error</h2>
          <p>Something went wrong while resetting your password.</p>
          <pre>Error: ${error.message}</pre>
          <p>Please try again or contact support if the problem persists.</p>
          <a href="/api/auth/reset-password/${req.params.token}" class="btn">Try Again</a>
          <a href="/api/auth/forgot-password" class="btn" style="background-color: #95a5a6; margin-left: 10px;">Request New Link</a>
        </div>
      </body>
      </html>
    `);
  }
};