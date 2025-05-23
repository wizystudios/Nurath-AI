
export const comprehensiveTutorials = [
  // Python Tutorials
  {
    id: "python-basics",
    title: "Python Fundamentals",
    description: "Master Python from scratch - variables, data types, control structures, and functions",
    content: `
# Python Fundamentals - Complete Guide

## 1. Introduction to Python
Python is a high-level, interpreted programming language known for its simplicity and readability. It's perfect for beginners and powerful enough for complex applications.

## 2. Variables and Data Types

### Variables
Variables are containers for storing data values. In Python, you don't need to declare variables explicitly.

\`\`\`python
# Variable assignment
name = "Alice"
age = 25
height = 5.7
is_student = True
\`\`\`

### Data Types
- **String (str)**: Text data
- **Integer (int)**: Whole numbers
- **Float (float)**: Decimal numbers
- **Boolean (bool)**: True/False values
- **List**: Ordered collection of items
- **Dictionary**: Key-value pairs

\`\`\`python
# Examples of different data types
name = "John"           # String
age = 30               # Integer
temperature = 98.6      # Float
is_active = True       # Boolean
colors = ["red", "blue", "green"]  # List
person = {"name": "Alice", "age": 25}  # Dictionary
\`\`\`

## 3. Operators

### Arithmetic Operators
\`\`\`python
# Basic math operations
addition = 5 + 3        # 8
subtraction = 10 - 4    # 6
multiplication = 6 * 7  # 42
division = 15 / 3       # 5.0
floor_division = 15 // 4  # 3
modulus = 15 % 4        # 3
exponentiation = 2 ** 3 # 8
\`\`\`

### Comparison Operators
\`\`\`python
# Comparing values
equal = 5 == 5          # True
not_equal = 5 != 3      # True
greater = 10 > 5        # True
less = 3 < 8           # True
greater_equal = 5 >= 5  # True
less_equal = 4 <= 6     # True
\`\`\`

## 4. Control Structures

### If Statements
\`\`\`python
age = 18

if age >= 18:
    print("You are an adult")
elif age >= 13:
    print("You are a teenager")
else:
    print("You are a child")
\`\`\`

### Loops

#### For Loops
\`\`\`python
# Loop through a list
fruits = ["apple", "banana", "cherry"]
for fruit in fruits:
    print(f"I like {fruit}")

# Loop with range
for i in range(5):
    print(f"Number: {i}")
\`\`\`

#### While Loops
\`\`\`python
count = 0
while count < 5:
    print(f"Count: {count}")
    count += 1
\`\`\`

## 5. Functions
Functions are reusable blocks of code that perform specific tasks.

\`\`\`python
# Function definition
def greet(name):
    return f"Hello, {name}!"

def calculate_area(length, width):
    return length * width

# Function calls
message = greet("Alice")
area = calculate_area(5, 3)
print(message)  # Hello, Alice!
print(area)     # 15
\`\`\`

## 6. Lists and List Methods
\`\`\`python
# Creating and manipulating lists
numbers = [1, 2, 3, 4, 5]
numbers.append(6)           # Add to end
numbers.insert(0, 0)        # Insert at position
numbers.remove(3)           # Remove specific value
popped = numbers.pop()      # Remove and return last item
length = len(numbers)       # Get length

# List comprehension
squares = [x**2 for x in range(1, 6)]  # [1, 4, 9, 16, 25]
\`\`\`

## 7. Dictionaries
\`\`\`python
# Creating and using dictionaries
student = {
    "name": "Alice",
    "age": 20,
    "courses": ["Math", "Physics", "Chemistry"]
}

# Accessing values
name = student["name"]
age = student.get("age", 0)  # Safe access with default

# Modifying dictionaries
student["grade"] = "A"       # Add new key-value
student["age"] = 21          # Update existing value
del student["courses"]       # Delete key-value pair
\`\`\`

## 8. Error Handling
\`\`\`python
try:
    number = int(input("Enter a number: "))
    result = 10 / number
    print(f"Result: {result}")
except ValueError:
    print("Please enter a valid number")
except ZeroDivisionError:
    print("Cannot divide by zero")
except Exception as e:
    print(f"An error occurred: {e}")
finally:
    print("Execution completed")
\`\`\`

## 9. File Operations
\`\`\`python
# Writing to a file
with open("example.txt", "w") as file:
    file.write("Hello, World!")

# Reading from a file
with open("example.txt", "r") as file:
    content = file.read()
    print(content)

# Reading line by line
with open("example.txt", "r") as file:
    for line in file:
        print(line.strip())
\`\`\`

## 10. Practice Exercises

### Exercise 1: Calculator
Create a simple calculator that performs basic arithmetic operations.

### Exercise 2: To-Do List
Build a program that manages a to-do list with add, remove, and display functions.

### Exercise 3: Number Guessing Game
Create a game where the computer generates a random number and the user tries to guess it.

This comprehensive guide covers all the essential Python concepts you need to start programming effectively!
    `,
    duration: "4-6 hours",
    level: "beginner",
    category: "python"
  },
  {
    id: "html-complete",
    title: "HTML Complete Guide",
    description: "Learn HTML from basic structure to semantic elements, forms, and modern HTML5 features",
    content: `
# HTML Complete Guide - From Basics to Advanced

## 1. What is HTML?
HTML (HyperText Markup Language) is the standard markup language for creating web pages. It describes the structure and content of a webpage using elements and tags.

## 2. Basic HTML Structure
\`\`\`html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>My First Webpage</title>
</head>
<body>
    <h1>Welcome to My Website</h1>
    <p>This is my first paragraph.</p>
</body>
</html>
\`\`\`

## 3. HTML Elements and Tags

### Basic Text Elements
\`\`\`html
<!-- Headings -->
<h1>Main Heading</h1>
<h2>Subheading</h2>
<h3>Smaller Heading</h3>
<h4>Even Smaller</h4>
<h5>Very Small</h5>
<h6>Smallest Heading</h6>

<!-- Paragraphs and Text -->
<p>This is a paragraph of text.</p>
<p>This is <strong>bold text</strong> and this is <em>italic text</em>.</p>
<p>This is <mark>highlighted text</mark>.</p>
<p>This is <small>small text</small>.</p>

<!-- Line breaks and horizontal rules -->
<p>First line<br>Second line</p>
<hr>
\`\`\`

### Lists
\`\`\`html
<!-- Unordered List -->
<ul>
    <li>Apple</li>
    <li>Banana</li>
    <li>Cherry</li>
</ul>

<!-- Ordered List -->
<ol>
    <li>First step</li>
    <li>Second step</li>
    <li>Third step</li>
</ol>

<!-- Description List -->
<dl>
    <dt>HTML</dt>
    <dd>HyperText Markup Language</dd>
    <dt>CSS</dt>
    <dd>Cascading Style Sheets</dd>
</dl>
\`\`\`

### Links and Images
\`\`\`html
<!-- Links -->
<a href="https://www.example.com">External Link</a>
<a href="about.html">Internal Link</a>
<a href="mailto:email@example.com">Email Link</a>
<a href="tel:+1234567890">Phone Link</a>

<!-- Images -->
<img src="image.jpg" alt="Description of image" width="300" height="200">
<img src="profile.jpg" alt="User Profile" class="profile-pic">
\`\`\`

## 4. HTML5 Semantic Elements
\`\`\`html
<header>
    <nav>
        <ul>
            <li><a href="#home">Home</a></li>
            <li><a href="#about">About</a></li>
            <li><a href="#contact">Contact</a></li>
        </ul>
    </nav>
</header>

<main>
    <article>
        <section>
            <h2>Article Title</h2>
            <p>Article content goes here...</p>
        </section>
    </article>
    
    <aside>
        <h3>Related Links</h3>
        <ul>
            <li><a href="#">Link 1</a></li>
            <li><a href="#">Link 2</a></li>
        </ul>
    </aside>
</main>

<footer>
    <p>&copy; 2024 My Website. All rights reserved.</p>
</footer>
\`\`\`

## 5. Tables
\`\`\`html
<table>
    <thead>
        <tr>
            <th>Name</th>
            <th>Age</th>
            <th>City</th>
        </tr>
    </thead>
    <tbody>
        <tr>
            <td>Alice</td>
            <td>25</td>
            <td>New York</td>
        </tr>
        <tr>
            <td>Bob</td>
            <td>30</td>
            <td>Los Angeles</td>
        </tr>
    </tbody>
</table>
\`\`\`

## 6. Forms
\`\`\`html
<form action="/submit" method="POST">
    <!-- Text inputs -->
    <label for="name">Name:</label>
    <input type="text" id="name" name="name" required>
    
    <label for="email">Email:</label>
    <input type="email" id="email" name="email" required>
    
    <label for="password">Password:</label>
    <input type="password" id="password" name="password" required>
    
    <!-- Textarea -->
    <label for="message">Message:</label>
    <textarea id="message" name="message" rows="4" cols="50"></textarea>
    
    <!-- Select dropdown -->
    <label for="country">Country:</label>
    <select id="country" name="country">
        <option value="">Select a country</option>
        <option value="us">United States</option>
        <option value="uk">United Kingdom</option>
        <option value="ca">Canada</option>
    </select>
    
    <!-- Radio buttons -->
    <fieldset>
        <legend>Gender:</legend>
        <input type="radio" id="male" name="gender" value="male">
        <label for="male">Male</label>
        
        <input type="radio" id="female" name="gender" value="female">
        <label for="female">Female</label>
    </fieldset>
    
    <!-- Checkboxes -->
    <fieldset>
        <legend>Interests:</legend>
        <input type="checkbox" id="sports" name="interests" value="sports">
        <label for="sports">Sports</label>
        
        <input type="checkbox" id="music" name="interests" value="music">
        <label for="music">Music</label>
        
        <input type="checkbox" id="travel" name="interests" value="travel">
        <label for="travel">Travel</label>
    </fieldset>
    
    <!-- File upload -->
    <label for="resume">Upload Resume:</label>
    <input type="file" id="resume" name="resume" accept=".pdf,.doc,.docx">
    
    <!-- Submit button -->
    <input type="submit" value="Submit">
    <button type="reset">Reset</button>
</form>
\`\`\`

## 7. HTML5 Input Types
\`\`\`html
<!-- Modern input types -->
<input type="date" name="birthday">
<input type="time" name="appointment">
<input type="datetime-local" name="meeting">
<input type="month" name="month">
<input type="week" name="week">
<input type="number" name="quantity" min="1" max="100">
<input type="range" name="volume" min="0" max="100">
<input type="color" name="color">
<input type="url" name="website">
<input type="tel" name="phone">
<input type="search" name="search">
\`\`\`

## 8. Media Elements
\`\`\`html
<!-- Audio -->
<audio controls>
    <source src="audio.mp3" type="audio/mpeg">
    <source src="audio.ogg" type="audio/ogg">
    Your browser does not support the audio element.
</audio>

<!-- Video -->
<video width="320" height="240" controls>
    <source src="movie.mp4" type="video/mp4">
    <source src="movie.ogg" type="video/ogg">
    Your browser does not support the video tag.
</video>

<!-- Embedded content -->
<iframe src="https://www.example.com" width="300" height="200"></iframe>
\`\`\`

## 9. Meta Tags and SEO
\`\`\`html
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="description" content="A brief description of the page">
    <meta name="keywords" content="html, tutorial, web development">
    <meta name="author" content="Your Name">
    <meta property="og:title" content="Page Title">
    <meta property="og:description" content="Page description">
    <meta property="og:image" content="image.jpg">
    <title>Descriptive Page Title</title>
</head>
\`\`\`

## 10. Accessibility Best Practices
\`\`\`html
<!-- Use semantic HTML -->
<button>Click me</button> <!-- Better than <div onclick="..."> -->

<!-- Provide alt text for images -->
<img src="chart.png" alt="Sales increased by 25% in Q3">

<!-- Use proper heading hierarchy -->
<h1>Main Title</h1>
<h2>Section Title</h2>
<h3>Subsection Title</h3>

<!-- Associate labels with form controls -->
<label for="username">Username:</label>
<input type="text" id="username" name="username">

<!-- Use ARIA attributes when needed -->
<div role="button" tabindex="0" aria-pressed="false">Custom Button</div>
\`\`\`

## 11. Practice Projects

### Project 1: Personal Portfolio
Create a personal portfolio website with:
- Header with navigation
- About section
- Projects showcase
- Contact form
- Footer

### Project 2: Recipe Website
Build a recipe sharing website with:
- Recipe cards
- Ingredient lists
- Step-by-step instructions
- Image gallery

### Project 3: Business Landing Page
Create a professional business landing page with:
- Hero section
- Services offered
- Testimonials
- Contact information

This guide covers everything you need to know about HTML to build modern, accessible websites!
    `,
    duration: "5-7 hours",
    level: "beginner",
    category: "html"
  },
  {
    id: "javascript-mastery",
    title: "JavaScript Complete Mastery",
    description: "Comprehensive JavaScript guide covering ES6+, DOM manipulation, async programming, and modern frameworks",
    content: `
# JavaScript Complete Mastery Guide

## 1. Introduction to JavaScript
JavaScript is a high-level, interpreted programming language that makes web pages interactive. It's the programming language of the web.

## 2. Variables and Data Types

### Variable Declarations
\`\`\`javascript
// ES6+ variable declarations
let name = "Alice";        // Block-scoped, can be reassigned
const age = 25;           // Block-scoped, cannot be reassigned
var city = "New York";    // Function-scoped (avoid in modern JS)

// Data types
let message = "Hello";         // String
let count = 42;               // Number
let price = 99.99;            // Number (no separate float type)
let isActive = true;          // Boolean
let data = null;              // Null
let result;                   // Undefined
let user = { name: "Bob" };   // Object
let colors = ["red", "blue"]; // Array (special type of object)
let func = function() {};     // Function
\`\`\`

### Template Literals
\`\`\`javascript
const firstName = "John";
const lastName = "Doe";
const age = 30;

// Template literals (ES6+)
const greeting = \`Hello, my name is \${firstName} \${lastName} and I'm \${age} years old.\`;

// Multi-line strings
const html = \`
    <div>
        <h1>\${firstName} \${lastName}</h1>
        <p>Age: \${age}</p>
    </div>
\`;
\`\`\`

## 3. Functions

### Function Declarations and Expressions
\`\`\`javascript
// Function declaration
function greet(name) {
    return \`Hello, \${name}!\`;
}

// Function expression
const greet2 = function(name) {
    return \`Hello, \${name}!\`;
};

// Arrow functions (ES6+)
const greet3 = (name) => \`Hello, \${name}!\`;
const greet4 = name => \`Hello, \${name}!\`; // Single parameter
const add = (a, b) => a + b;                // Single expression

// Arrow function with block body
const processData = (data) => {
    const processed = data.map(item => item * 2);
    return processed.filter(item => item > 10);
};
\`\`\`

### Advanced Function Concepts
\`\`\`javascript
// Default parameters
function createUser(name, age = 18, role = "user") {
    return { name, age, role };
}

// Rest parameters
function sum(...numbers) {
    return numbers.reduce((total, num) => total + num, 0);
}

// Destructuring parameters
function displayUser({ name, age, email }) {
    console.log(\`\${name} (\${age}): \${email}\`);
}

// Higher-order functions
function createMultiplier(factor) {
    return function(number) {
        return number * factor;
    };
}

const double = createMultiplier(2);
const triple = createMultiplier(3);
\`\`\`

## 4. Objects and Arrays

### Objects
\`\`\`javascript
// Object creation and manipulation
const person = {
    name: "Alice",
    age: 30,
    city: "New York",
    hobbies: ["reading", "cycling"],
    
    // Method
    introduce() {
        return \`Hi, I'm \${this.name} from \${this.city}\`;
    },
    
    // Getter
    get fullInfo() {
        return \`\${this.name}, \${this.age} years old\`;
    },
    
    // Setter
    set userAge(newAge) {
        if (newAge > 0) {
            this.age = newAge;
        }
    }
};

// Object destructuring
const { name, age, city } = person;
const { name: userName, age: userAge } = person; // Renaming

// Object spread operator
const updatedPerson = { ...person, age: 31, country: "USA" };

// Object methods
const keys = Object.keys(person);
const values = Object.values(person);
const entries = Object.entries(person);
\`\`\`

### Arrays
\`\`\`javascript
// Array methods
const numbers = [1, 2, 3, 4, 5];

// Transformation methods
const doubled = numbers.map(n => n * 2);
const evens = numbers.filter(n => n % 2 === 0);
const sum = numbers.reduce((total, n) => total + n, 0);

// Searching methods
const found = numbers.find(n => n > 3);
const foundIndex = numbers.findIndex(n => n > 3);
const includes = numbers.includes(3);

// Array destructuring
const [first, second, ...rest] = numbers;

// Spread operator
const moreNumbers = [...numbers, 6, 7, 8];
const combined = [...numbers, ...moreNumbers];

// Array.from and other utilities
const range = Array.from({ length: 5 }, (_, i) => i + 1); // [1, 2, 3, 4, 5]
const unique = [...new Set([1, 2, 2, 3, 3, 4])]; // [1, 2, 3, 4]
\`\`\`

## 5. Control Structures

### Conditional Statements
\`\`\`javascript
// if/else
const score = 85;

if (score >= 90) {
    console.log("A grade");
} else if (score >= 80) {
    console.log("B grade");
} else if (score >= 70) {
    console.log("C grade");
} else {
    console.log("Need improvement");
}

// Ternary operator
const status = score >= 60 ? "Pass" : "Fail";

// Switch statement
const day = "Monday";
switch (day) {
    case "Monday":
        console.log("Start of work week");
        break;
    case "Friday":
        console.log("TGIF!");
        break;
    default:
        console.log("Regular day");
}
\`\`\`

### Loops
\`\`\`javascript
// for loop
for (let i = 0; i < 5; i++) {
    console.log(i);
}

// for...of (values)
const fruits = ["apple", "banana", "cherry"];
for (const fruit of fruits) {
    console.log(fruit);
}

// for...in (keys/indices)
for (const index in fruits) {
    console.log(\`\${index}: \${fruits[index]}\`);
}

// while loop
let count = 0;
while (count < 5) {
    console.log(count);
    count++;
}

// forEach method
fruits.forEach((fruit, index) => {
    console.log(\`\${index}: \${fruit}\`);
});
\`\`\`

## 6. DOM Manipulation

### Selecting Elements
\`\`\`javascript
// Selection methods
const element = document.getElementById("myId");
const elements = document.getElementsByClassName("myClass");
const element2 = document.querySelector(".myClass");
const elements2 = document.querySelectorAll(".myClass");

// Modern selection (preferred)
const button = document.querySelector("#submit-btn");
const paragraphs = document.querySelectorAll("p");
\`\`\`

### Manipulating Elements
\`\`\`javascript
// Content manipulation
element.textContent = "New text content";
element.innerHTML = "<strong>Bold text</strong>";

// Attribute manipulation
element.setAttribute("class", "new-class");
element.getAttribute("id");
element.removeAttribute("data-old");

// Style manipulation
element.style.color = "red";
element.style.backgroundColor = "blue";
element.classList.add("active");
element.classList.remove("inactive");
element.classList.toggle("visible");

// Creating and adding elements
const newDiv = document.createElement("div");
newDiv.textContent = "I'm a new div";
newDiv.classList.add("new-element");
document.body.appendChild(newDiv);

// Removing elements
element.remove();
// or
element.parentNode.removeChild(element);
\`\`\`

### Event Handling
\`\`\`javascript
// Event listeners
button.addEventListener("click", function(event) {
    console.log("Button clicked!");
    event.preventDefault(); // Prevent default behavior
});

// Arrow function event handler
button.addEventListener("click", (e) => {
    console.log("Clicked at:", e.clientX, e.clientY);
});

// Event delegation (for dynamic content)
document.addEventListener("click", (e) => {
    if (e.target.classList.contains("dynamic-button")) {
        console.log("Dynamic button clicked!");
    }
});

// Multiple event types
const input = document.querySelector("#text-input");
input.addEventListener("focus", () => console.log("Input focused"));
input.addEventListener("blur", () => console.log("Input blurred"));
input.addEventListener("input", (e) => console.log("Value:", e.target.value));
\`\`\`

## 7. Asynchronous JavaScript

### Callbacks
\`\`\`javascript
// Callback example
function fetchData(callback) {
    setTimeout(() => {
        const data = { id: 1, name: "John" };
        callback(data);
    }, 1000);
}

fetchData((data) => {
    console.log("Received:", data);
});
\`\`\`

### Promises
\`\`\`javascript
// Creating promises
const fetchUserData = () => {
    return new Promise((resolve, reject) => {
        setTimeout(() => {
            const success = Math.random() > 0.5;
            if (success) {
                resolve({ id: 1, name: "Alice" });
            } else {
                reject(new Error("Failed to fetch user data"));
            }
        }, 1000);
    });
};

// Using promises
fetchUserData()
    .then(data => {
        console.log("User data:", data);
        return data.id;
    })
    .then(id => {
        console.log("User ID:", id);
    })
    .catch(error => {
        console.error("Error:", error.message);
    })
    .finally(() => {
        console.log("Operation completed");
    });
\`\`\`

### Async/Await
\`\`\`javascript
// Async function
async function getUserData() {
    try {
        const userData = await fetchUserData();
        console.log("User:", userData);
        
        // Multiple async operations
        const profile = await fetchUserProfile(userData.id);
        const posts = await fetchUserPosts(userData.id);
        
        return { userData, profile, posts };
    } catch (error) {
        console.error("Error fetching data:", error);
        throw error;
    }
}

// Using async function
getUserData()
    .then(result => console.log("Complete data:", result))
    .catch(error => console.error("Failed:", error));

// Parallel async operations
async function fetchAllData() {
    try {
        const [users, posts, comments] = await Promise.all([
            fetchUsers(),
            fetchPosts(),
            fetchComments()
        ]);
        
        return { users, posts, comments };
    } catch (error) {
        console.error("One of the requests failed:", error);
    }
}
\`\`\`

### Fetch API
\`\`\`javascript
// GET request
async function fetchUsers() {
    try {
        const response = await fetch("/api/users");
        
        if (!response.ok) {
            throw new Error(\`HTTP error! status: \${response.status}\`);
        }
        
        const users = await response.json();
        return users;
    } catch (error) {
        console.error("Fetch error:", error);
        throw error;
    }
}

// POST request
async function createUser(userData) {
    try {
        const response = await fetch("/api/users", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(userData)
        });
        
        const result = await response.json();
        return result;
    } catch (error) {
        console.error("Error creating user:", error);
        throw error;
    }
}
\`\`\`

## 8. ES6+ Features

### Destructuring
\`\`\`javascript
// Array destructuring
const [a, b, c] = [1, 2, 3];
const [first, , third] = [1, 2, 3]; // Skip second element

// Object destructuring
const { name, age } = { name: "Alice", age: 30, city: "NYC" };
const { name: userName, age: userAge } = user; // Renaming

// Nested destructuring
const { address: { street, city } } = user;

// Function parameter destructuring
function greetUser({ name, age }) {
    return \`Hello \${name}, you are \${age} years old\`;
}
\`\`\`

### Modules
\`\`\`javascript
// Named exports (utils.js)
export const PI = 3.14159;
export function calculateArea(radius) {
    return PI * radius * radius;
}

// Default export (user.js)
export default class User {
    constructor(name) {
        this.name = name;
    }
}

// Importing (main.js)
import User from "./user.js";
import { PI, calculateArea } from "./utils.js";
import { calculateArea as getArea } from "./utils.js"; // Renaming
\`\`\`

### Classes
\`\`\`javascript
class Animal {
    constructor(name, species) {
        this.name = name;
        this.species = species;
    }
    
    speak() {
        return \`\${this.name} makes a sound\`;
    }
    
    static getSpeciesCount() {
        return Animal.count || 0;
    }
}

class Dog extends Animal {
    constructor(name, breed) {
        super(name, "Canine");
        this.breed = breed;
    }
    
    speak() {
        return \`\${this.name} barks\`;
    }
    
    fetch() {
        return \`\${this.name} fetches the ball\`;
    }
}

const myDog = new Dog("Buddy", "Golden Retriever");
console.log(myDog.speak()); // "Buddy barks"
\`\`\`

## 9. Error Handling
\`\`\`javascript
// Try-catch blocks
try {
    const data = JSON.parse(invalidJson);
    processData(data);
} catch (error) {
    if (error instanceof SyntaxError) {
        console.error("Invalid JSON:", error.message);
    } else {
        console.error("Processing error:", error.message);
    }
} finally {
    console.log("Cleanup operations");
}

// Custom errors
class ValidationError extends Error {
    constructor(message, field) {
        super(message);
        this.name = "ValidationError";
        this.field = field;
    }
}

function validateUser(user) {
    if (!user.email) {
        throw new ValidationError("Email is required", "email");
    }
}

// Error handling with async/await
async function saveUser(userData) {
    try {
        await validateUser(userData);
        const savedUser = await createUser(userData);
        return savedUser;
    } catch (error) {
        if (error instanceof ValidationError) {
            console.error(\`Validation failed for \${error.field}: \${error.message}\`);
        } else {
            console.error("Unexpected error:", error);
        }
        throw error;
    }
}
\`\`\`

## 10. Local Storage and Session Storage
\`\`\`javascript
// Local Storage (persists until manually cleared)
localStorage.setItem("username", "alice");
localStorage.setItem("preferences", JSON.stringify({ theme: "dark" }));

const username = localStorage.getItem("username");
const preferences = JSON.parse(localStorage.getItem("preferences"));

localStorage.removeItem("username");
localStorage.clear(); // Remove all items

// Session Storage (cleared when tab closes)
sessionStorage.setItem("sessionData", "temporary");
const sessionData = sessionStorage.getItem("sessionData");

// Storage event listener
window.addEventListener("storage", (e) => {
    console.log(\`Storage changed: \${e.key} = \${e.newValue}\`);
});
\`\`\`

## 11. Practice Projects

### Project 1: Todo List Application
Build a complete todo app with:
- Add, edit, delete tasks
- Mark tasks as complete
- Filter tasks (all, active, completed)
- Local storage persistence

### Project 2: Weather App
Create a weather application with:
- API integration
- Geolocation
- Search functionality
- 5-day forecast

### Project 3: Interactive Quiz
Develop a quiz application with:
- Multiple choice questions
- Score tracking
- Timer functionality
- Results display

This comprehensive guide covers modern JavaScript from basics to advanced concepts. Master these concepts and you'll be ready to build complex web applications!
    `,
    duration: "8-10 hours",
    level: "intermediate",
    category: "javascript"
  }
];

export const getRandomTutorials = () => {
  return comprehensiveTutorials.map(tutorial => ({
    ...tutorial,
    // Add some sample data for demonstration
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }));
};
