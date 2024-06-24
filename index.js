require('dotenv').config(); // Load environment variables from .env file
const express = require('express');
const bodyParser = require('body-parser');
const sqlite3 = require('sqlite3').verbose();
const xlsx = require('xlsx'); // npm package for generating Excel files
const fs = require('fs');
const path = require('path');
const app = express();
const port = 3000;

app.use(bodyParser.json());
app.use(express.static('public'));

let isAuthenticated = process.env.AUTH_ENABLED === 'true'; // Read AUTH_ENABLED from .env
const username = process.env.USERNAME;
const password = process.env.PASSWORD;

let db = new sqlite3.Database('./orders.db', (err) => {
    if (err) {
        console.error(err.message);
    }
    console.log('Connected to the orders database.');
});

db.run(`CREATE TABLE IF NOT EXISTS orders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    width REAL,
    height REAL,
    bottom_space REAL,
    weight REAL,
    quantity INTEGER,
    type TEXT,
    printing_method TEXT,
    color_count INTEGER,
    hand_attachment TEXT,
    price REAL,
    date TEXT
)`);

const calculatePrice = (width, height, bottom_space, quantity, type, printing_method, color_count, hand_attachment) => {
    // Calculate weight
    const area = 2 * (width * height) + (width * bottom_space) + 2 * (height * bottom_space);
    const weight = area * 70; // in grams

    // Type pricing
    const typePrices = {
        type1: 10,
        type2: 20,
        type3: 30,
        type4: 40,
        type5: 50
    };

    // Printing method pricing
    const printingMethodPrices = {
        none: 0,
        method1: 5,
        method2: 10,
        method3: 15,
        method4: 20,
        method5: 25
    };

    // Hand attachment pricing
    const handAttachmentPrices = {
        attachment1: 3,
        attachment2: 6,
        attachment3: 9
    };

    // Calculate base price
    let basePrice = (typePrices[type] || 0) + (printingMethodPrices[printing_method] || 0) + (handAttachmentPrices[hand_attachment] || 0);

    // Add color count price (assuming each color adds a cost)
    basePrice += color_count * 2;

    // Calculate total price
    let totalPrice = basePrice * quantity;
    totalPrice += totalPrice * 0.15; // 15% tax

    return { totalPrice, weight };
};

// Middleware to check authentication
const authenticate = (req, res, next) => {
    if (isAuthenticated) {
        next(); // Continue to next middleware or route handler
    } else {
        res.status(401).json({ error: 'Authentication required' });
    }
};

// Login endpoint to authenticate users
app.post('/login', (req, res) => {
    const { username: reqUsername, password: reqPassword } = req.body;
    if (reqUsername === username && reqPassword === password) {
        isAuthenticated = true;
        res.json({ authenticated: true });
    } else {
        res.status(401).json({ authenticated: false });
    }
});

// Endpoint to check authentication status
app.get('/authStatus', (req, res) => {
    res.json({ authenticated: isAuthenticated });
});

// Endpoint to serve the index.html file
app.get('/', (req, res) => {
    res.sendFile(__dirname + '/public/index.html');
});

// Protected endpoint to handle order calculation
app.post('/calculate', authenticate, (req, res) => {
    const { width, height, bottom_space, quantity, type, printing_method, color_count, hand_attachment, store } = req.body;

    if (quantity <= 0) {
        return res.status(400).json({ error: 'Quantity must be greater than 0' });
    }

    if ((color_count === 0 && printing_method !== 'none') || (color_count > 0 && printing_method === 'none')) {
        return res.status(400).json({ error: 'Color count and printing method mismatch' });
    }

    const { totalPrice, weight } = calculatePrice(width, height, bottom_space, quantity, type, printing_method, color_count, hand_attachment);

    if (store) {
        const date = new Date().toISOString();
        db.run(`INSERT INTO orders (width, height, bottom_space, weight, quantity, type, printing_method, color_count, hand_attachment, price, date) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [width, height, bottom_space, weight, quantity, type, printing_method, color_count, hand_attachment, totalPrice, date], function (err) {
                if (err) {
                    return console.error(err.message);
                }
                res.json({ id: this.lastID, totalPrice, weight, date });
            });
    } else {
        res.json({ totalPrice, weight });
    }
});

// Endpoint to get records for the current month
app.get('/recordsThisMonth', (req, res) => {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    const startDateString = startOfMonth.toISOString().split('T')[0]; // YYYY-MM-DD format
    const endDateString = endOfMonth.toISOString().split('T')[0]; // YYYY-MM-DD format

    const sql = `SELECT * FROM orders WHERE date BETWEEN ? AND ?`;
    db.all(sql, [startDateString, endDateString], (err, rows) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        res.json(rows);
    });
});

// Endpoint to generate Excel file for records of the current month
app.get('/generateExcel', (req, res) => {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    const startDateString = startOfMonth.toISOString().split('T')[0]; // YYYY-MM-DD format
    const endDateString = endOfMonth.toISOString().split('T')[0]; // YYYY-MM-DD format

    const sql = `SELECT * FROM orders WHERE date BETWEEN ? AND ?`;
    db.all(sql, [startDateString, endDateString], (err, rows) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }

        // Create a workbook and worksheet
        const workbook = xlsx.utils.book_new();
        const worksheet = xlsx.utils.json_to_sheet(rows);

        // Add the worksheet to the workbook
        xlsx.utils.book_append_sheet(workbook, worksheet, 'Orders');

        // Generate buffer of Excel file
        const excelBuffer = xlsx.write(workbook, { type: 'buffer', bookType: 'xlsx' });

        // Save buffer to a file
        const filePath = path.join(__dirname, 'public', 'orders_this_month.xlsx');
        fs.writeFile(filePath, excelBuffer, (err) => {
            if (err) {
                res.status(500).json({ error: 'Error generating Excel file' });
                return;
            }
            res.download(filePath, 'orders_this_month.xlsx');
        });
    });
});

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}/`);
});
