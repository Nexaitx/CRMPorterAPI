const express = require('express');
const dotenv = require('dotenv');
const connectDB = require('./config/db');
const swaggerJsDoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');
const runMigrations = require('./migrations/runMigrations');
const autoPing = require("./utils/autoPing");

// Load env variables
dotenv.config();

const app = express();

// Middleware
app.use(express.json());

//  START SERVER ONLY AFTER DB + MIGRATIONS
const startServer = async () => {
  try {
    // Connect DB
    await connectDB();

    // Run migrations
    await runMigrations();

    // --- Swagger Setup ---
    const swaggerOptions = {
      definition: {
        openapi: '3.0.0',
        info: {
          title: 'Auth API',
          version: '1.0.0',
        },
      },
      apis: ['./routes/*.js'],
    };

    const swaggerDocs = swaggerJsDoc(swaggerOptions);
    app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocs));


    // Ping route (keep alive)
app.use(express.json());
app.use(express.urlencoded({ extended: true })); 
// routes
app.use("/ping", require("./routes/ping"));

//  AUTO PING START (Render URL)
if (process.env.RENDER_EXTERNAL_URL) {
  autoPing(`${process.env.RENDER_EXTERNAL_URL}/ping`);
}

    // Routes
    app.use('/api/auth', require('./routes/auth'));

    const PORT = process.env.PORT || 3000;
    app.listen(PORT, () =>
      console.log(` Server running on port ${PORT}`)
    );
  } catch (error) {
    console.error(' Server failed to start:', error);
    process.exit(1);
  }
};

startServer();
