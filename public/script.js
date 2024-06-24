// Check authentication status and show/hide content accordingly
fetch('/authStatus')
.then(response => response.json())
.then(data => {
    if (data.authenticated) {
        document.getElementById('authenticated-content').style.display = 'block';
        document.getElementById('auth-form').style.display = 'none';
    } else {
        document.getElementById('authenticated-content').style.display = 'none';
        document.getElementById('auth-form').style.display = 'block';
    }
})
.catch(error => console.error('Error:', error));

// Handle login form submission
document.getElementById('login-form').addEventListener('submit', function (event) {
    event.preventDefault();

    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;

    fetch('/login', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ username, password })
    })
    .then(response => response.json())
    .then(data => {
        if (data.authenticated) {
            document.getElementById('authenticated-content').style.display = 'block';
            document.getElementById('auth-form').style.display = 'none';
        } else {
            alert('Invalid credentials. Please try again.');
        }
    })
    .catch(error => console.error('Error:', error));
});

// Submit order form
document.getElementById('order-form').addEventListener('submit', function (event) {
    event.preventDefault();

    const width = document.getElementById('width').value;
    const height = document.getElementById('height').value;
    const bottom_space = document.getElementById('bottom_space').value;
    const quantity = document.getElementById('quantity').value;
    const type = document.getElementById('type').value;
    const printing_method = document.getElementById('printing_method').value;
    const color_count = document.getElementById('color_count').value;
    const hand_attachment = document.getElementById('hand_attachment').value;
    const store = document.getElementById('store').checked;

    fetch('/calculate', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ width, height, bottom_space, quantity, type, printing_method, color_count, hand_attachment, store })
    })
    .then(response => response.json())
    .then(data => {
        const resultDiv = document.getElementById('result');
        if (data.error) {
            resultDiv.style.display = 'none';
            document.getElementById('error').textContent = `Error: ${data.error}`;
            document.getElementById('error').style.display = 'block';
        } else {
            document.getElementById('error').style.display = 'none';
            resultDiv.textContent = store 
                ? `Order stored! ID: ${data.id}, Total Price: $${data.totalPrice.toFixed(2)}, Weight: ${data.weight.toFixed(2)} grams, Date: ${data.date}`
                : `Calculated Price: $${data.totalPrice.toFixed(2)}, Weight: ${data.weight.toFixed(2)} grams`;
            resultDiv.style.display = 'block';
        }
    })
    .catch(error => {
        document.getElementById('error').textContent = `Error: ${error.message}`;
        document.getElementById('error').style.display = 'block';
        document.getElementById('result').style.display = 'none';
    });
});

// Function to get the current month name
function getCurrentMonthName() {
    const now = new Date();
    return now.toLocaleString('default', { month: 'long' });
}

// Set the current month name in the button
document.getElementById('current-month').textContent = getCurrentMonthName();

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
