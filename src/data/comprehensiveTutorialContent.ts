
export interface Tutorial {
  id: string;
  title: string;
  description: string;
  content: string;
  duration: string;
  level: 'non-developer' | 'beginner' | 'intermediate' | 'advanced';
  category: string;
  order: number;
}

export const comprehensiveTutorials: Tutorial[] = [
  // PYTHON CURRICULUM
  {
    id: "python-non-dev-1",
    title: "What is Python? (For Complete Beginners)",
    description: "Understand what Python is and why it's perfect for beginners, explained in simple terms",
    level: "non-developer",
    category: "python",
    duration: "10 min",
    order: 1,
    content: `
# What is Python? 🐍

Think of Python as a way to talk to computers in a language that's almost like English!

## What is Code?
Code is like giving instructions to a computer. Just like you might tell a friend:
- "Go to the kitchen"
- "Open the fridge" 
- "Get me some water"

With Python, you can tell a computer:
- "Show me today's weather"
- "Calculate my expenses"
- "Send an email"

## Why Python?
Python is special because:
- **Easy to read**: It looks almost like English
- **Powerful**: Used by Google, Instagram, Netflix
- **Friendly**: Great for beginners

## Your First Python Code
Let's try the most famous first program:

\`\`\`python
print("Hello, World!")
\`\`\`

This tells the computer to display the message "Hello, World!" on the screen.

## What Can You Build?
- **Websites** (like Facebook)
- **Apps** (like Instagram) 
- **Games** (like simple puzzles)
- **AI helpers** (like ChatGPT assistants)

Python is your gateway to the digital world! 🚀
`
  },
  {
    id: "python-beginner-1", 
    title: "Python Variables and Data Types",
    description: "Learn how to store and work with different types of information in Python",
    level: "beginner",
    category: "python", 
    duration: "20 min",
    order: 2,
    content: `
# Python Variables and Data Types

## What are Variables?
Variables are like labeled boxes where you store information.

\`\`\`python
name = "Alice"
age = 25
height = 5.6
is_student = True
\`\`\`

## Data Types

### 1. Strings (Text)
\`\`\`python
first_name = "John"
last_name = "Doe"
full_name = first_name + " " + last_name
print(full_name)  # Output: John Doe
\`\`\`

### 2. Numbers
\`\`\`python
# Integers (whole numbers)
age = 30
year = 2024

# Floats (decimal numbers)
price = 19.99
temperature = 98.6
\`\`\`

### 3. Booleans (True/False)
\`\`\`python
is_sunny = True
is_raining = False
\`\`\`

## Working with Variables
\`\`\`python
# Math operations
x = 10
y = 5
sum_result = x + y
print(f"The sum is: {sum_result}")

# String operations
greeting = "Hello"
name = "World"
message = f"{greeting}, {name}!"
print(message)
\`\`\`

Practice these concepts and you'll master Python basics!
`
  },
  {
    id: "python-intermediate-1",
    title: "Python Lists and Dictionaries", 
    description: "Master Python's most important data structures for organizing information",
    level: "intermediate",
    category: "python",
    duration: "30 min", 
    order: 3,
    content: `
# Python Lists and Dictionaries

## Lists - Ordered Collections
Lists store multiple items in order.

\`\`\`python
# Creating lists
fruits = ["apple", "banana", "orange"]
numbers = [1, 2, 3, 4, 5]
mixed = ["hello", 42, True, 3.14]

# Accessing items
print(fruits[0])  # First item: apple
print(fruits[-1]) # Last item: orange

# Adding items
fruits.append("grape")
fruits.insert(1, "mango")

# List operations
print(len(fruits))    # Length
print("apple" in fruits)  # Check if exists
\`\`\`

## Dictionaries - Key-Value Pairs
Dictionaries store data as key-value pairs.

\`\`\`python
# Creating dictionaries
person = {
    "name": "Alice",
    "age": 30,
    "city": "Dar es Salaam",
    "profession": "Developer"
}

# Accessing values
print(person["name"])
print(person.get("age"))

# Adding/updating
person["email"] = "alice@example.com"
person["age"] = 31

# Looping through dictionaries
for key, value in person.items():
    print(f"{key}: {value}")
\`\`\`

## Practical Example: Student Management
\`\`\`python
students = [
    {"name": "John", "grade": 85, "subject": "Math"},
    {"name": "Mary", "grade": 92, "subject": "Science"},
    {"name": "David", "grade": 78, "subject": "History"}
]

# Find students with grades above 80
high_performers = []
for student in students:
    if student["grade"] > 80:
        high_performers.append(student["name"])

print(f"High performers: {high_performers}")
\`\`\`

These data structures are fundamental to most Python programs!
`
  },
  {
    id: "python-advanced-1",
    title: "Building APIs with Python Flask",
    description: "Create real-world web APIs that can power mobile apps and websites",
    level: "advanced", 
    category: "python",
    duration: "45 min",
    order: 4,
    content: `
# Building APIs with Python Flask

## What is an API?
An API (Application Programming Interface) allows different applications to communicate. Think of it as a waiter in a restaurant - it takes your order (request) and brings you food (response).

## Setting Up Flask
\`\`\`python
from flask import Flask, jsonify, request

app = Flask(__name__)

# Sample data
books = [
    {"id": 1, "title": "Python Basics", "author": "John Doe"},
    {"id": 2, "title": "Web Development", "author": "Jane Smith"}
]
\`\`\`

## Creating Endpoints

### GET - Retrieve Data
\`\`\`python
@app.route('/api/books', methods=['GET'])
def get_books():
    return jsonify(books)

@app.route('/api/books/<int:book_id>', methods=['GET']) 
def get_book(book_id):
    book = next((book for book in books if book["id"] == book_id), None)
    if book:
        return jsonify(book)
    return jsonify({"error": "Book not found"}), 404
\`\`\`

### POST - Create New Data
\`\`\`python
@app.route('/api/books', methods=['POST'])
def create_book():
    data = request.get_json()
    
    new_book = {
        "id": len(books) + 1,
        "title": data.get("title"),
        "author": data.get("author")
    }
    
    books.append(new_book)
    return jsonify(new_book), 201
\`\`\`

### PUT - Update Data
\`\`\`python
@app.route('/api/books/<int:book_id>', methods=['PUT'])
def update_book(book_id):
    book = next((book for book in books if book["id"] == book_id), None)
    if not book:
        return jsonify({"error": "Book not found"}), 404
    
    data = request.get_json()
    book["title"] = data.get("title", book["title"])
    book["author"] = data.get("author", book["author"])
    
    return jsonify(book)
\`\`\`

### DELETE - Remove Data
\`\`\`python
@app.route('/api/books/<int:book_id>', methods=['DELETE'])
def delete_book(book_id):
    global books
    books = [book for book in books if book["id"] != book_id]
    return jsonify({"message": "Book deleted successfully"})
\`\`\`

## Running the API
\`\`\`python
if __name__ == '__main__':
    app.run(debug=True)
\`\`\`

## Testing Your API
You can test using curl or Postman:
\`\`\`bash
# Get all books
curl http://localhost:5000/api/books

# Create a new book
curl -X POST -H "Content-Type: application/json" \\
  -d '{"title":"New Book","author":"New Author"}' \\
  http://localhost:5000/api/books
\`\`\`

This API can now be used by mobile apps, websites, or other services!
`
  },

  // HTML CURRICULUM
  {
    id: "html-non-dev-1",
    title: "What is a Website? HTML Basics Explained Simply",
    description: "Understand websites and HTML tags in the simplest terms possible",
    level: "non-developer",
    category: "html",
    duration: "8 min",
    order: 1,
    content: `
# What is a Website? 🌐

## Think of a Website Like a House
- **HTML** = The structure (walls, rooms, doors)
- **CSS** = The decoration (paint, furniture, style)  
- **JavaScript** = The electricity (lights, interactive features)

## What are HTML Tags?
HTML tags are like labels that tell the computer what each part of your webpage should be.

Think of it like labeling boxes when moving:
- 📦 "Bedroom stuff"
- 📦 "Kitchen items" 
- 📦 "Important documents"

## Your First HTML Page
\`\`\`html
<!DOCTYPE html>
<html>
<head>
    <title>My First Website</title>
</head>
<body>
    <h1>Welcome to My Website!</h1>
    <p>This is my first paragraph.</p>
    <p>This is my second paragraph.</p>
</body>
</html>
\`\`\`

## What Each Part Does:
- **\`<h1>\`** = Big heading (like a book title)
- **\`<p>\`** = Paragraph (like a sentence in a book)
- **\`<title>\`** = What shows in the browser tab

## Real Example You Can Try:
Save this as "my-page.html" and open it in your browser:

\`\`\`html
<!DOCTYPE html>
<html>
<head>
    <title>About Me</title>
</head>
<body>
    <h1>Hello! I'm Learning HTML</h1>
    <p>My name is [Your Name]</p>
    <p>I live in Tanzania</p>
    <p>I'm learning to build websites!</p>
</body>
</html>
\`\`\`

Congratulations! You just created your first webpage! 🎉
`
  },
  {
    id: "html-beginner-1",
    title: "HTML Elements, Headings, and Links",
    description: "Learn the essential HTML elements for creating structured web pages",
    level: "beginner", 
    category: "html",
    duration: "25 min",
    order: 2,
    content: `
# HTML Elements, Headings, and Links

## HTML Document Structure
Every HTML page follows this basic structure:

\`\`\`html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Page Title</title>
</head>
<body>
    <!-- Your content goes here -->
</body>
</html>
\`\`\`

## Headings - Creating Hierarchy
HTML has 6 levels of headings:

\`\`\`html
<h1>Main Title (Biggest)</h1>
<h2>Section Title</h2>
<h3>Subsection Title</h3>
<h4>Sub-subsection Title</h4>
<h5>Small Heading</h5>
<h6>Smallest Heading</h6>
\`\`\`

## Paragraphs and Text Formatting
\`\`\`html
<p>This is a regular paragraph.</p>
<p>This paragraph has <strong>bold text</strong> and <em>italic text</em>.</p>
<p>You can also use <mark>highlighted text</mark> and <small>small text</small>.</p>
\`\`\`

## Links - Connecting Pages
\`\`\`html
<!-- Link to another website -->
<a href="https://www.google.com">Visit Google</a>

<!-- Link to another page on your site -->
<a href="about.html">About Us</a>

<!-- Link to email -->
<a href="mailto:someone@example.com">Send Email</a>

<!-- Link to phone number -->
<a href="tel:+255123456789">Call Us</a>
\`\`\`

## Images
\`\`\`html
<img src="photo.jpg" alt="Description of the image">
<img src="https://example.com/image.png" alt="Online image">
\`\`\`

## Lists
### Unordered Lists (Bullet Points)
\`\`\`html
<ul>
    <li>First item</li>
    <li>Second item</li>
    <li>Third item</li>
</ul>
\`\`\`

### Ordered Lists (Numbered)
\`\`\`html
<ol>
    <li>Step one</li>
    <li>Step two</li>
    <li>Step three</li>
</ol>
\`\`\`

## Complete Example: Personal Homepage
\`\`\`html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>John's Homepage</title>
</head>
<body>
    <h1>Welcome to John's Website</h1>
    
    <h2>About Me</h2>
    <p>Hi! I'm <strong>John Doe</strong>, a web developer from <em>Dar es Salaam</em>.</p>
    
    <h2>My Skills</h2>
    <ul>
        <li>HTML & CSS</li>
        <li>JavaScript</li>
        <li>Python</li>
    </ul>
    
    <h2>Contact Me</h2>
    <p>
        <a href="mailto:john@example.com">Send me an email</a> or 
        <a href="tel:+255123456789">call me</a>
    </p>
    
    <h2>My Projects</h2>
    <ol>
        <li><a href="project1.html">Personal Blog</a></li>
        <li><a href="project2.html">Business Website</a></li>
        <li><a href="project3.html">Online Store</a></li>
    </ol>
</body>
</html>
\`\`\`

Now you have the foundation to create structured, linked web pages!
`
  },

  // CSS CURRICULUM  
  {
    id: "css-non-dev-1",
    title: "Styling Text and Changing Colors (CSS for Beginners)",
    description: "Learn how to make your websites look beautiful with colors and fonts",
    level: "non-developer",
    category: "css", 
    duration: "12 min",
    order: 1,
    content: `
# Making Websites Beautiful with CSS 🎨

## What is CSS?
CSS stands for "Cascading Style Sheets" - but think of it as **makeup for websites**!

If HTML is the structure of a house, CSS is the paint, wallpaper, and decorations.

## How CSS Works
You tell the computer: "Find all the headings and make them blue"

\`\`\`css
h1 {
    color: blue;
}
\`\`\`

## Changing Colors
\`\`\`css
/* Make all headings red */
h1 {
    color: red;
}

/* Make paragraphs dark gray */
p {
    color: #333333;
}

/* Popular colors you can use */
.red-text { color: red; }
.blue-text { color: blue; }
.green-text { color: green; }
.purple-text { color: purple; }
.orange-text { color: orange; }
\`\`\`

## Changing Font Sizes
\`\`\`css
h1 {
    font-size: 32px;  /* Big heading */
}

p {
    font-size: 16px;  /* Normal text */
}

.small-text {
    font-size: 12px;  /* Small text */
}
\`\`\`

## Changing Backgrounds
\`\`\`css
body {
    background-color: lightblue;
}

.highlight {
    background-color: yellow;
}
\`\`\`

## Complete Example
Here's a colorful webpage:

**HTML:**
\`\`\`html
<!DOCTYPE html>
<html>
<head>
    <title>My Colorful Page</title>
    <style>
        body {
            background-color: lightgray;
        }
        
        h1 {
            color: darkblue;
            font-size: 36px;
        }
        
        p {
            color: darkgreen;
            font-size: 18px;
        }
        
        .special {
            color: red;
            background-color: yellow;
            font-size: 20px;
        }
    </style>
</head>
<body>
    <h1>My Beautiful Website</h1>
    <p>This is a normal paragraph in dark green.</p>
    <p class="special">This paragraph is special - red text on yellow background!</p>
</body>
</html>
\`\`\`

## Try This Yourself!
1. Create an HTML file
2. Add the CSS styles in the \`<style>\` section
3. Change the colors to your favorites
4. Open in your browser and see the magic! ✨

CSS is like having a magic paintbrush for the internet!
`
  },

  // JAVASCRIPT CURRICULUM
  {
    id: "javascript-non-dev-1", 
    title: "What is JavaScript? Making Websites Interactive",
    description: "Understand how JavaScript brings websites to life with interactivity",
    level: "non-developer",
    category: "javascript",
    duration: "10 min", 
    order: 1,
    content: `
# What is JavaScript? ⚡

## Think of JavaScript as the "Magic" in Websites
- **HTML** = House structure (walls, rooms)
- **CSS** = House decoration (paint, furniture)  
- **JavaScript** = House electricity (lights that turn on/off, doors that open)

## What Makes JavaScript Special?
JavaScript makes websites **interactive**. Without it, websites would be like books - you could only read them, not interact with them.

## Simple Examples You See Every Day:

### 1. Alert Popup
\`\`\`javascript
alert("Hello! Welcome to our website!");
\`\`\`

### 2. Button That Does Something
\`\`\`html
<button onclick="alert('You clicked me!')">Click Me!</button>
\`\`\`

### 3. Changing Text When You Click
\`\`\`html
<h1 id="title">Original Title</h1>
<button onclick="changeTitle()">Change Title</button>

<script>
function changeTitle() {
    document.getElementById("title").innerHTML = "New Title!";
}
</script>
\`\`\`

## Real-World JavaScript Examples:
- **Facebook**: Like button, posting comments
- **Google**: Search suggestions as you type
- **YouTube**: Play/pause videos, adjusting volume
- **WhatsApp Web**: Sending messages, receiving notifications

## Try This Interactive Example:
Save this as an HTML file and open it:

\`\`\`html
<!DOCTYPE html>
<html>
<head>
    <title>My Interactive Page</title>
</head>
<body>
    <h1>Magic Color Changer</h1>
    <p id="magic-text">This text will change colors!</p>
    
    <button onclick="changeColor('red')">Make it Red</button>
    <button onclick="changeColor('blue')">Make it Blue</button>
    <button onclick="changeColor('green')">Make it Green</button>
    
    <script>
        function changeColor(color) {
            document.getElementById("magic-text").style.color = color;
            alert("Changed to " + color + "!");
        }
    </script>
</body>
</html>
\`\`\`

## What Happens When You Click?
1. You click a button
2. JavaScript "wakes up" and runs
3. It finds the text on the page
4. It changes the color
5. It shows you a message

JavaScript is what makes the internet **fun and interactive**! 🎉

Without JavaScript, you couldn't:
- Like posts on social media
- Shop online (add to cart)
- Play online games
- Use Google Maps
- Watch videos

It's the magic that brings websites to life! ✨
`
  },

  // SQL CURRICULUM (BONUS)
  {
    id: "sql-beginner-1",
    title: "Introduction to Databases and SQL",
    description: "Learn how websites store and retrieve information using databases",
    level: "beginner",
    category: "sql", 
    duration: "30 min",
    order: 1,
    content: `
# Introduction to Databases and SQL 🗃️

## What is a Database?
Think of a database like a **digital filing cabinet** that stores information in an organized way.

Examples:
- **Facebook**: Stores your profile, posts, friends
- **Netflix**: Stores movies, user preferences, watch history
- **Banking app**: Stores account balances, transactions

## What is SQL?
SQL (Structured Query Language) is how you **talk to databases**. It's like asking questions:
- "Show me all users from Tanzania"
- "Find movies released in 2023"
- "Update John's email address"

## Database Structure: Tables
Data is stored in tables, like spreadsheets:

**Users Table:**
| id | name | email | city |
|----|------|-------|------|
| 1 | John | john@example.com | Dar es Salaam |
| 2 | Mary | mary@example.com | Arusha |
| 3 | David | david@example.com | Mwanza |

## Basic SQL Commands

### 1. SELECT - Get Data
\`\`\`sql
-- Get all users
SELECT * FROM users;

-- Get specific columns
SELECT name, email FROM users;

-- Get users from specific city
SELECT * FROM users WHERE city = 'Dar es Salaam';
\`\`\`

### 2. INSERT - Add New Data
\`\`\`sql
INSERT INTO users (name, email, city) 
VALUES ('Alice', 'alice@example.com', 'Dodoma');
\`\`\`

### 3. UPDATE - Modify Existing Data
\`\`\`sql
UPDATE users 
SET email = 'newemail@example.com' 
WHERE name = 'John';
\`\`\`

### 4. DELETE - Remove Data
\`\`\`sql
DELETE FROM users WHERE id = 3;
\`\`\`

## Creating Tables
\`\`\`sql
CREATE TABLE products (
    id INTEGER PRIMARY KEY,
    name TEXT NOT NULL,
    price DECIMAL(10,2),
    category TEXT,
    in_stock BOOLEAN
);
\`\`\`

## Practical Example: Online Store
\`\`\`sql
-- Create products table
CREATE TABLE products (
    id INTEGER PRIMARY KEY,
    name TEXT,
    price DECIMAL(10,2),
    category TEXT
);

-- Add some products
INSERT INTO products (name, price, category) VALUES 
('iPhone 15', 999.99, 'Electronics'),
('T-Shirt', 19.99, 'Clothing'),
('Coffee Mug', 9.99, 'Kitchen');

-- Find all electronics under $1000
SELECT * FROM products 
WHERE category = 'Electronics' AND price < 1000;

-- Get the average price by category
SELECT category, AVG(price) as average_price
FROM products 
GROUP BY category;
\`\`\`

## Why SQL Matters
Every app you use relies on databases:
- **E-commerce**: Product catalogs, orders, customers
- **Social Media**: Posts, comments, user profiles  
- **Banking**: Account information, transactions
- **Healthcare**: Patient records, appointments

Learning SQL opens doors to understanding how the digital world stores and manages information! 🚀
`
  }
];
