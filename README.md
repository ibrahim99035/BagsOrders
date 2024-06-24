# Bags Calculations

This project is an order calculation application that uses Node.js and SQLite for the backend and HTML, CSS, and JavaScript for the frontend. It calculates the price of an order based on various attributes and can also store these calculations in a database. Additionally, it supports generating an Excel file of the current month's orders.

## Table of Contents

- [Features](#features)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Configuration](#configuration)
- [Usage](#usage)
- [Endpoints](#endpoints)
- [Screenshots](#screenshots)
- [License](#license)

## Features

- Calculate order price based on multiple attributes.
- Option to store the calculation results in the database.
- Generate and download an Excel file containing the orders for the current month.
- Authentication using environment variables.

## Prerequisites

- Node.js
- SQLite3

## Installation

1. Clone the repository:

    ```bash
    git clone https://github.com/your-username/BagsCalculations.git
    cd BagsCalculations
    ```

2. Install the dependencies:

    ```bash
    npm install
    ```

3. Ensure SQLite3 is installed on your machine.

## Configuration

1. Create a `.env` file in the root directory and add your credentials:

    ```plaintext
    USERNAME=your_username
    PASSWORD=your_password
    ```

## Usage

1. Start the server:

    ```bash
    node index.js
    ```

2. Open your browser and navigate to `http://localhost:3000`.

## Endpoints

- **GET /recordsThisMonth**: Retrieve the records for the current month.
- **GET /generateExcel**: Generate and download an Excel file of the current month's orders.

## Project Structure

```plaintext
BagsCalculations/
├── node_modules/
├── public/
│   ├── index.html
│   ├── script.js
│   ├── styles.css
├── .env
├── index.js
├── orders.db
├── package.json
├── package-lock.json
```

## Example Code

### Server-side (`index.js`)

```javascript
const express = require('express');
const bodyParser = require('body-parser');
const sqlite3 = require('sqlite3').verbose();
const xlsx = require('xlsx');
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');
const app = express();
const port = 3000;

dotenv.config();

app.use(bodyParser.json());
app.use(express.static('public'));

let db = new sqlite3.Database('./orders.db', (err) => {
    if (err) {
        console.error(err.message);
    }
    console.log('Connected to the orders database.');
});

// Endpoint to get records for the current month
app.get('/recordsThisMonth', (req, res) => {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    const startDateString = startOfMonth.toISOString().split('T')[0];
    const endDateString = endOfMonth.toISOString().split('T')[0];

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

    const startDateString = startOfMonth.toISOString().split('T')[0];
    const endDateString = endOfMonth.toISOString().split('T')[0];

    const sql = `SELECT * FROM orders WHERE date BETWEEN ? AND ?`;
    db.all(sql, [startDateString, endDateString], (err, rows) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }

        const workbook = xlsx.utils.book_new();
        const worksheet = xlsx.utils.json_to_sheet(rows);
        xlsx.utils.book_append_sheet(workbook, worksheet, 'Orders');

        const excelBuffer = xlsx.write(workbook, { type: 'buffer', bookType: 'xlsx' });

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
```

### Client-side (`public/index.html`)

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Order Calculator</title>
    <link rel="stylesheet" href="styles.css">
</head>
<body>
    <div class="container">
        <h1>Order Calculator</h1>

        <div id="authenticated-content" class="auth-content">
            <form id="order-form" class="form-box">
                <!-- Form fields for order calculation -->
                <label for="width">Width:</label>
                <input type="number" id="width" name="width" required>

                <label for="height">Height:</label>
                <input type="number" id="height" name="height" required>

                <label for="bottom_space">Bottom Space:</label>
                <input type="number" id="bottom_space" name="bottom_space" required>

                <label for="quantity">Quantity:</label>
                <input type="number" id="quantity" name="quantity" required>

                <label for="type">Type:</label>
                <select id="type" name="type" required>
                    <option value="type1">Type 1</option>
                    <option value="type2">Type 2</option>
                    <option value="type3">Type 3</option>
                    <option value="type4">Type 4</option>
                    <option value="type5">Type 5</option>
                </select>

                <label for="printing_method">Printing Method:</label>
                <select id="printing_method" name="printing_method" required>
                    <option value="none">None</option>
                    <option value="method1">Method 1</option>
                    <option value="method2">Method 2</option>
                    <option value="method3">Method 3</option>
                    <option value="method4">Method 4</option>
                    <option value="method5">Method 5</option>
                </select>

                <label for="color_count">Color Count:</label>
                <input type="number" id="color_count" name="color_count" required>

                <label for="hand_attachment">Hand Attachment:</label>
                <select id="hand_attachment" name="hand_attachment" required>
                    <option value="attachment1">Attachment 1</option>
                    <option value="attachment2">Attachment 2</option>
                    <option value="attachment3">Attachment 3</option>
                </select>

                <label for="store">Store in Database:</label>
                <input type="checkbox" id="store" name="store">

                <button type="submit">Calculate</button>
            </form>

            <div id="result" class="message-box"></div>
            <div id="error" class="message-box"></div>

            <button id="download-excel" class="btn">Download Excel (<span id="current-month"></span>)</button>
        </div>

        <div id="auth-form" class="auth-content">
            <form id="login-form" class="form-box">
                <label for="username">Username:</label>
                <input type="text" id="username" name="username" required>
        
                <label for="password">Password:</label>
                <input type="password" id="password" name="password" required>
        
                <button type="submit">Login</button>
            </form>
        </div>
    </div>

    <script src="script.js"></script>
</body>
</html>
```

### Client-side (`public/script.js`)

```javascript
// Function to get the current month name
function getCurrentMonthName() {
    const now = new Date();
    return now.toLocaleString('default', { month: 'long' });
}

// Set the current month name in the button
document.getElementById('current-month').textContent = getCurrentMonthName();

// Check authentication status and show/hide content accordingly
fetch('/authStatus')
.then(response => response.json())
.then(data => {
    if (data.authenticated) {
        document.getElementById('authenticated-content').style.display = 'block';
        document.getElementById('auth-form').style.display

 = 'none';
    } else {
        document.getElementById('authenticated-content').style.display = 'none';
        document.getElementById('auth-form').style.display = 'block';
    }
});

// Handle login form submission
document.getElementById('login-form').addEventListener('submit', function (e) {
    e.preventDefault();
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;

    fetch('/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            document.getElementById('authenticated-content').style.display = 'block';
            document.getElementById('auth-form').style.display = 'none';
        } else {
            alert('Login failed. Please check your username and password.');
        }
    })
    .catch(error => console.error('Error:', error));
});

// Handle order form submission
document.getElementById('order-form').addEventListener('submit', function (e) {
    e.preventDefault();

    const formData = new FormData(e.target);
    const formObject = {};
    formData.forEach((value, key) => formObject[key] = value);

    fetch('/calculate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formObject)
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            document.getElementById('result').textContent = `Calculated Price: ${data.price}`;
            document.getElementById('result').style.display = 'block';
        } else {
            document.getElementById('error').textContent = `Error: ${data.error}`;
            document.getElementById('error').style.display = 'block';
        }
    })
    .catch(error => {
        document.getElementById('error').textContent = `Error: ${error.message}`;
        document.getElementById('error').style.display = 'block';
    });
});

// Handle download Excel button click
document.getElementById('download-excel').addEventListener('click', function () {
    fetch('/generateExcel')
    .then(response => response.blob())
    .then(blob => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.style.display = 'none';
        a.href = url;
        a.download = 'orders_this_month.xlsx';
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
    })
    .catch(error => console.error('Error:', error));
});
```

### Client-side (`public/styles.css`)

```css
body {
    font-family: 'Arial', sans-serif;
    background-color: #f4f4f9;
    color: #333;
    display: flex;
    justify-content: center;
    align-items: center;
    height: 100vh;
    margin: 0;
}

.container {
    background-color: #fff;
    padding: 20px;
    border-radius: 8px;
    box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
    width: 400px;
    text-align: center;
}

h1 {
    font-size: 24px;
    margin-bottom: 20px;
}

.form-box {
    display: flex;
    flex-direction: column;
    gap: 10px;
}

label {
    text-align: left;
}

input, select, button {
    padding: 10px;
    border: 1px solid #ccc;
    border-radius: 4px;
    font-size: 16px;
}

button {
    background-color: #007bff;
    color: #fff;
    cursor: pointer;
    transition: background-color 0.3s ease;
}

button:hover {
    background-color: #0056b3;
}

.message-box {
    display: none;
    padding: 10px;
    margin-top: 10px;
    border-radius: 4px;
}

#result {
    background-color: #d4edda;
    color: #155724;
    border: 1px solid #c3e6cb;
}

#error {
    background-color: #f8d7da;
    color: #721c24;
    border: 1px solid #f5c6cb;
}

.auth-content {
    display: none;
}
```

## License

This project is licensed under the MIT License.

---