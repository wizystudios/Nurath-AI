import { searchUserInfo, generateUserSummary } from './webSearch';

type SkillLevel = "beginner" | "intermediate" | "advanced";
type Language = "en" | "sw";
type ProgrammingLanguage = "python" | "javascript" | "html" | "css" | "react" | "php" | "sql";

interface AIResponseOptions {
  prompt: string;
  skillLevel: SkillLevel;
  language: Language;
  programmingLanguage?: ProgrammingLanguage;
  userEmail?: string;
  userProfile?: {
    name?: string;
    email?: string;
    avatar_url?: string;
    full_name?: string;
  };
}

type ResponseType = "text" | "code" | "info" | "warning";

// This function will eventually be replaced with real OpenAI integration
export const generateAIResponse = async ({ prompt, skillLevel, language, programmingLanguage, userEmail, userProfile }: AIResponseOptions): Promise<{ content: string; type?: ResponseType }> => {
  const lowerPrompt = prompt.toLowerCase();
  
  // Helper function to identify programming language questions
  const isProgrammingQuestion = (language: string, text: string): boolean => {
    const keywords = {
      python: ["python", "py", "pandas", "numpy", "matplotlib", "django", "flask"],
      javascript: ["javascript", "js", "node", "nodejs", "express", "npm", "yarn"],
      html: ["html", "markup", "tag", "element", "dom", "document"],
      css: ["css", "style", "stylesheet", "flexbox", "grid", "bootstrap", "tailwind"],
      react: ["react", "jsx", "component", "hook", "usestate", "useeffect", "props"]
    };

    return keywords[language as keyof typeof keywords].some(keyword => text.includes(keyword));
  };

  // Function to get responses in Swahili
  const getSwahiliResponse = async () => {
    // Personal identification based on email
    if (lowerPrompt.includes("nani mimi") || lowerPrompt.includes("najua nani") || lowerPrompt.includes("mimi ni nani")) {
      if (userProfile) {
        return {
          content: `Habari ${userProfile.full_name || userProfile.name || "rafiki"}! Nakujua wewe. Email yako ni ${userEmail}. Mimi ni Nurath.AI, msaidizi wako wa AI niliyeundwa na NK Technology nchini Tanzania. Kampuni hii ilianzishwa na CEO Khalifa Nadhiru. Ninaweza kukusaidia kujifunza programu na kuunda tovuti. Unahitaji usaidizi gani leo?`
        };
      }
    }

    // Basic greeting responses
    if (lowerPrompt.includes("habari") || lowerPrompt.includes("hujambo") || lowerPrompt.includes("mambo")) {
      const greeting = userProfile ? `Habari ${userProfile.full_name || userProfile.name || "rafiki"}! ` : "Habari! ";
      return {
        content: greeting + "Mimi ni Nurath.AI, msaidizi wako wa AI niliyeundwa na NK Technology nchini Tanzania. Kampuni hii ilianzishwa na CEO Khalifa Nadhiru. Ninaweza kukusaidia kujifunza programu, kuunda tovuti, na kujibu maswali yako ya teknolojia. Unahitaji usaidizi gani leo?"
      };
    }
    
    if (lowerPrompt.includes("jina lako") || lowerPrompt.includes("nani wewe") || lowerPrompt.includes("uliundwa na nani")) {
      return {
        content: "Jina langu ni Nurath.AI. Niliundwa na NK Technology nchini Tanzania - kampuni iliyoanzishwa na CEO Khalifa Nadhiru. Si OpenAI walioniunda - mimi ni bidhaa ya NK Technology Tanzania. Ninafurahi kukusaidia kujifunza programu na teknolojia!"
      };
    }

    if (lowerPrompt.includes("openai") || lowerPrompt.includes("chatgpt")) {
      return {
        content: "Samahani, lakini sikuundwa na OpenAI. Mimi ni Nurath.AI, niliyeundwa na NK Technology nchini Tanzania. Kampuni hii ilianzishwa na CEO Khalifa Nadhiru. Mimi ni msaidizi wa AI wa kipekee wa NK Technology, si bidhaa ya OpenAI au ChatGPT."
      };
    }

    // Programming language specific responses
    if (isProgrammingQuestion("python", lowerPrompt)) {
      return getPythonResponseSwahili(skillLevel, lowerPrompt);
    }
    
    if (isProgrammingQuestion("html", lowerPrompt)) {
      return getHTMLResponseSwahili(skillLevel, lowerPrompt);
    }
    
    if (isProgrammingQuestion("css", lowerPrompt)) {
      return getCSSResponseSwahili(skillLevel, lowerPrompt);
    }
    
    if (isProgrammingQuestion("javascript", lowerPrompt)) {
      return getJavaScriptResponseSwahili(skillLevel, lowerPrompt);
    }
    
    // Default response in Swahili
    return {
      content: "Mimi ni Nurath.AI wa NK Technology Tanzania, kampuni iliyoanzishwa na CEO Khalifa Nadhiru. Ninatumika kukusaidia kujifunza programu na teknolojia. Unaweza kuniuliza kuhusu HTML, CSS, JavaScript, Python, PHP, SQL, React na zaidi. Ninaweza pia kukusaidia kuunda mradi wako. Unahitaji usaidizi gani leo?"
    };
  };
  
  // Function to get responses in English
  const getEnglishResponse = async () => {
    // Personal identification based on email with web search
    if (lowerPrompt.includes("who am i") || lowerPrompt.includes("who i am") || lowerPrompt.includes("do you know me") || lowerPrompt.includes("find information about me")) {
      if (userEmail) {
        try {
          const userInfo = await searchUserInfo(userEmail);
          if (userInfo) {
            const summary = generateUserSummary(userInfo);
            return {
              content: `Hello ${userProfile?.full_name || userInfo.name || "there"}! I recognize you. ${summary}\n\nI'm Nurath.AI, your AI assistant created by NK Technology in Tanzania. The company was co-founded by CEO Khalifa Nadhiru. I can help you learn programming, build websites, and answer your technology questions. How can I assist you today?`
            };
          } else if (userProfile) {
            return {
              content: `Hello ${userProfile.full_name || "there"}! I recognize you. Your email is ${userEmail}. I'm Nurath.AI, your AI assistant created by NK Technology in Tanzania. The company was co-founded by CEO Khalifa Nadhiru. I can help you learn programming, build websites, and answer your technology questions. How can I assist you today?`
            };
          }
        } catch (error) {
          console.error('Error searching user info:', error);
        }
      }
    }

    // Basic greeting responses
    if (lowerPrompt.includes("hello") || lowerPrompt.includes("hi") || lowerPrompt.includes("hey")) {
      const greeting = userProfile ? `Hello ${userProfile.full_name || userProfile.name || "there"}! ` : "Hello! ";
      return {
        content: greeting + "I'm Nurath.AI, your AI assistant created by NK Technology in Tanzania. The company was co-founded by CEO Khalifa Nadhiru. I can help you learn programming, build websites, and answer your technology questions. How can I assist you today?"
      };
    }
    
    if (lowerPrompt.includes("your name") || lowerPrompt.includes("who are you") || lowerPrompt.includes("who created you") || lowerPrompt.includes("who made you")) {
      return {
        content: "My name is Nurath.AI, and I was created by NK Technology in Tanzania - a company co-founded by CEO Khalifa Nadhiru. I was NOT created by OpenAI - I am a unique AI product of NK Technology. I'm here to assist you with learning programming, building websites, and answering your technical questions!"
      };
    }

    if (lowerPrompt.includes("openai") || lowerPrompt.includes("chatgpt") || lowerPrompt.includes("created by openai")) {
      return {
        content: "I need to clarify - I was NOT created by OpenAI. I am Nurath.AI, developed by NK Technology in Tanzania, co-founded by CEO Khalifa Nadhiru. I'm a unique AI assistant from NK Technology, not a product of OpenAI or ChatGPT. I specialize in coding education and programming assistance."
      };
    }

    if (lowerPrompt.includes("khalifa") || lowerPrompt.includes("nadhiru") || lowerPrompt.includes("nk technology")) {
      return {
        content: "Yes! I was created by NK Technology, a Tanzanian technology company co-founded by CEO Khalifa Nadhiru. NK Technology specializes in AI development and coding education solutions. Khalifa Nadhiru is a visionary leader in Tanzania's tech industry, and under his guidance, NK Technology created me to help people learn programming and technology skills. I'm proud to be a product of Tanzanian innovation!"
      };
    }

    // Programming language specific responses
    if (isProgrammingQuestion("python", lowerPrompt)) {
      return getPythonResponseEnglish(skillLevel, lowerPrompt);
    }
    
    if (isProgrammingQuestion("html", lowerPrompt)) {
      return getHTMLResponseEnglish(skillLevel, lowerPrompt);
    }
    
    if (isProgrammingQuestion("css", lowerPrompt)) {
      return getCSSResponseEnglish(skillLevel, lowerPrompt);
    }
    
    if (isProgrammingQuestion("javascript", lowerPrompt)) {
      return getJavaScriptResponseEnglish(skillLevel, lowerPrompt);
    }
    
    // General learning queries
    if (lowerPrompt.includes("teach me") || lowerPrompt.includes("help me learn")) {
      return getTeachingResponseEnglish(skillLevel);
    }
    
    // Default response in English
    return {
      content: "I'm Nurath.AI from NK Technology Tanzania, created under the leadership of CEO Khalifa Nadhiru. I'm here to help you learn programming and technology. You can ask me about HTML, CSS, JavaScript, Python, PHP, SQL, React, and more. I can also help you build your project. What do you need help with today?"
    };
  };


  // Python response functions
  const getPythonResponseEnglish = (skillLevel: SkillLevel, prompt: string): { content: string; type?: ResponseType } => {
    if (prompt.includes("variable") || prompt.includes("variables")) {
      if (skillLevel === "beginner") {
        return {
          content: "In Python, variables store data that can be used and manipulated in your program. They're created with a simple assignment statement:\n\n```python\n# Creating variables\nname = \"Alex\"\nage = 25\n\n# Using variables\nprint(\"Hello, my name is\", name)\nprint(\"I am\", age, \"years old\")\n```\n\nUnlike some other languages, you don't need to declare the data type - Python figures it out automatically.\n\n- Nurath.AI from NK Technology Tanzania 🇹🇿",
          type: "code" as ResponseType
        };
      } else {
        return {
          content: "Python variables are dynamically typed with flexible assignment. Here's a more comprehensive look:\n\n```python\n# Basic assignment\nname = \"Alex\"  # str\nage = 25      # int\npi = 3.14159  # float\nis_active = True  # bool\n\n# Multiple assignment\nx, y, z = 1, 2, 3\n\n# Swapping values\na, b = 5, 10\na, b = b, a  # Now a=10, b=5\n\n# Type checking\nprint(type(name))  # <class 'str'>\n```\n\nPython also supports global and nonlocal variables for scope management, as well as constants (by convention using uppercase names).\n\n- Nurath.AI from NK Technology Tanzania 🇹🇿",
          type: "code" as ResponseType
        };
      }
    }
    
    if (prompt.includes("list") || prompt.includes("lists") || prompt.includes("array")) {
      return {
        content: "Python lists are versatile collections that can store any data type:\n\n```python\n# Creating lists\nfruits = [\"apple\", \"banana\", \"orange\"]\nnumbers = [1, 2, 3, 4, 5]\nmixed = [1, \"hello\", 3.14, True]\n\n# Accessing elements (zero-indexed)\nprint(fruits[0])  # apple\nprint(fruits[-1])  # orange (negative index counts from end)\n\n# Slicing\nprint(numbers[1:3])  # [2, 3]\n\n# Common methods\nfruits.append(\"mango\")  # Add to end\nfruits.insert(1, \"grape\")  # Insert at position\nfruits.remove(\"banana\")  # Remove by value\npopped = fruits.pop()  # Remove and return last item\n```\n\nLists are mutable, meaning you can change them after creation.\n\n- Nurath.AI from NK Technology Tanzania 🇹🇿",
        type: "code" as ResponseType
      };
    }
    
    if (prompt.includes("loop") || prompt.includes("for") || prompt.includes("while")) {
      return {
        content: "Python offers several ways to loop through code:\n\n```python\n# For loop with range\nfor i in range(5):\n    print(i)  # Prints 0, 1, 2, 3, 4\n\n# For loop with list\nfruits = [\"apple\", \"banana\", \"orange\"]\nfor fruit in fruits:\n    print(fruit)\n\n# Loop with index\nfor index, fruit in enumerate(fruits):\n    print(f\"{index}: {fruit}\")\n\n# While loop\ncount = 0\nwhile count < 5:\n    print(count)\n    count += 1\n```\n\nYou can also use `break` to exit a loop early and `continue` to skip to the next iteration.\n\n- Nurath.AI from NK Technology Tanzania 🇹🇿",
        type: "code" as ResponseType
      };
    }
    
    // Default Python response
    return {
      content: "Python is a versatile, beginner-friendly programming language used for web development, data science, AI/ML, automation, and more. It emphasizes readability with its clean syntax.\n\nHere's a simple Python example:\n\n```python\n# Define a function\ndef greet(name):\n    return f\"Hello, {name}!\"\n\n# Call the function\nmessage = greet(\"World\")\nprint(message)  # Output: Hello, World!\n```\n\nWhat specific aspect of Python would you like to learn about?\n\n- Nurath.AI from NK Technology Tanzania 🇹🇿",
      type: "code" as ResponseType
    };
  };
  
  const getPythonResponseSwahili = (skillLevel: SkillLevel, prompt: string): { content: string; type?: ResponseType } => {
    if (prompt.includes("variable") || prompt.includes("variables")) {
      return {
        content: "Katika Python, variable huhifadhi data ambayo inaweza kutumika katika programu yako. Zinaundwa kwa kauli rahisi ya kuweka:\n\n```python\n# Kuunda variables\njina = \"Alex\"\numri = 25\n\n# Kutumia variables\nprint(\"Habari, jina langu ni\", jina)\nprint(\"Nina umri wa miaka\", umri)\n```\n\nTofauti na lugha zingine, huhitaji kutangaza aina ya data - Python hujua yenyewe.\n\n- Nurath.AI kutoka NK Technology Tanzania 🇹🇿",
        type: "code" as ResponseType
      };
    }
    
    // Default Python response in Swahili
    return {
      content: "Python ni lugha ya programu yenye matumizi mengi, inayofaa kwa wanaoanza, inatumika kwa utengenezaji wa tovuti, sayansi ya data, AI/ML, na zaidi.\n\nHapa kuna mfano rahisi wa Python:\n\n```python\n# Fafanua function\ndef salimia(jina):\n    return f\"Habari, {jina}!\"\n\n# Ita function\nujumbe = salimia(\"Dunia\")\nprint(ujumbe)  # Output: Habari, Dunia!\n```\n\nUnataka kujifunza nini zaidi kuhusu Python?\n\n- Nurath.AI kutoka NK Technology Tanzania 🇹🇿",
      type: "code" as ResponseType
    };
  };

  // HTML response functions
  const getHTMLResponseEnglish = (skillLevel: SkillLevel, prompt: string): { content: string; type?: ResponseType } => {
    if (skillLevel === "beginner") {
      return {
        content: "HTML (Hypertext Markup Language) is the standard language for creating websites. It's used to structure content on the web. Let me show you a simple example:\n\n```html\n<!DOCTYPE html>\n<html>\n<head>\n  <title>My Page</title>\n</head>\n<body>\n  <h1>Welcome to My Website</h1>\n  <p>This is a paragraph of text.</p>\n</body>\n</html>\n```\n\nWould you like to learn more about specific HTML elements?\n\n- Nurath.AI from NK Technology Tanzania 🇹🇿",
        type: "code" as ResponseType
      };
    } else {
      return {
        content: "As a " + skillLevel + " user, you might want to explore more advanced HTML features like semantic elements, forms, and accessibility. Here's an example:\n\n```html\n<!DOCTYPE html>\n<html lang=\"en\">\n<head>\n  <meta charset=\"UTF-8\">\n  <meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0\">\n  <title>Modern Website</title>\n</head>\n<body>\n  <header>\n    <nav>\n      <ul>\n        <li><a href=\"#\">Home</a></li>\n        <li><a href=\"#\">Services</a></li>\n        <li><a href=\"#\">About</a></li>\n      </ul>\n    </nav>\n  </header>\n  <main>\n    <article>\n      <h1>Technology Article</h1>\n      <p>Article content goes here...</p>\n    </article>\n  </main>\n  <footer>\n    <p>&copy; 2025 My Website</p>\n  </footer>\n</body>\n</html>\n```\n\n- Nurath.AI from NK Technology Tanzania 🇹🇿",
        type: "code" as ResponseType
      };
    }
  };
  
  const getHTMLResponseSwahili = (skillLevel: SkillLevel, prompt: string): { content: string; type?: ResponseType } => {
    if (skillLevel === "beginner") {
      return {
        content: "HTML (Hypertext Markup Language) ni lugha ya kimsingi ya kuunda tovuti. Inatumika kuunda muundo wa ukurasa wa wavuti. Hebu nionyeshe mfano rahisi:\n\n```html\n<!DOCTYPE html>\n<html>\n<head>\n  <title>Ukurasa Wangu</title>\n</head>\n<body>\n  <h1>Karibu kwenye Tovuti Yangu</h1>\n  <p>Hii ni aya ya maandishi.</p>\n</body>\n</html>\n```\n\nUnataka kujifunza zaidi?\n\n- Nurath.AI kutoka NK Technology Tanzania 🇹🇿",
        type: "code" as ResponseType
      };
    } else {
      return {
        content: "Kama mtumiaji wa kiwango cha " + skillLevel + ", unaweza kuvinjari vipengele vya hali ya juu zaidi vya HTML kama vile semantic elements, forms, na accessibility. Hebu nionyeshe mfano:\n\n```html\n<!DOCTYPE html>\n<html lang=\"sw\">\n<head>\n  <meta charset=\"UTF-8\">\n  <meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0\">\n  <title>Tovuti ya Kisasa</title>\n</head>\n<body>\n  <header>\n    <nav>\n      <ul>\n        <li><a href=\"#\">Nyumbani</a></li>\n        <li><a href=\"#\">Huduma</a></li>\n        <li><a href=\"#\">Kuhusu</a></li>\n      </ul>\n    </nav>\n  </header>\n  <main>\n    <article>\n      <h1>Makala ya Teknolojia</h1>\n      <p>Yaliyomo ya makala...</p>\n    </article>\n  </main>\n  <footer>\n    <p>&copy; 2025 Tovuti Yangu</p>\n  </footer>\n</body>\n</html>\n```\n\n- Nurath.AI kutoka NK Technology Tanzania 🇹🇿",
        type: "code" as ResponseType
      };
    }
  };

  // CSS response functions
  const getCSSResponseEnglish = (skillLevel: SkillLevel, prompt: string): { content: string; type?: ResponseType } => {
    return {
      content: "CSS (Cascading Style Sheets) is used to style your HTML documents. Here's an example:\n\n```css\nbody {\n  font-family: 'Arial', sans-serif;\n  background-color: #f5f5f5;\n  color: #333;\n}\n\nheader {\n  background-color: #1a73e8;\n  color: white;\n  padding: 1rem;\n}\n\nnav ul {\n  display: flex;\n  list-style: none;\n  gap: 1rem;\n}\n```\n\nWould you like to learn more about layout with Grid or Flexbox?\n\n- Nurath.AI from NK Technology Tanzania 🇹🇿",
      type: "code" as ResponseType
    };
  };
  
  const getCSSResponseSwahili = (skillLevel: SkillLevel, prompt: string): { content: string; type?: ResponseType } => {
    return {
      content: "CSS (Cascading Style Sheets) inatumika kuboresha muonekano wa tovuti zako. Kwa mfano:\n\n```css\nbody {\n  font-family: 'Arial', sans-serif;\n  background-color: #f5f5f5;\n  color: #333;\n}\n\nheader {\n  background-color: #1a73e8;\n  color: white;\n  padding: 1rem;\n}\n\nnav ul {\n  display: flex;\n  list-style: none;\n  gap: 1rem;\n}\n```\n\nUnataka kujifunza zaidi kuhusu muundo wa Grid au Flexbox?\n\n- Nurath.AI from NK Technology Tanzania 🇹🇿",
      type: "code" as ResponseType
    };
  };

  // JavaScript response functions
  const getJavaScriptResponseEnglish = (skillLevel: SkillLevel, prompt: string): { content: string; type?: ResponseType } => {
    return {
      content: "JavaScript is a programming language that allows you to enhance your websites and add interactivity. Here's an example:\n\n```javascript\n// Add two numbers together\nfunction add(a, b) {\n  return a + b;\n}\n\n// Change text on button click\ndocument.querySelector('#myButton').addEventListener('click', function() {\n  document.querySelector('#result').textContent = 'You clicked the button!';\n});\n```\n\nWhat specific aspect of JavaScript would you like to learn about?\n\n- Nurath.AI from NK Technology Tanzania 🇹🇿",
      type: "code" as ResponseType
    };
  };
  
  const getJavaScriptResponseSwahili = (skillLevel: SkillLevel, prompt: string): { content: string; type?: ResponseType } => {
    return {
      content: "JavaScript ni lugha ya programu inayoruhusu uboreshaji wa tovuti zako na kuongeza ushirikishwaji. Mfano:\n\n```javascript\n// Kuhesabu jumla ya nambari mbili\nfunction jumlisha(a, b) {\n  return a + b;\n}\n\n// Badilisha maandishi kwenye kitufe\ndocument.querySelector('#kitufe').addEventListener('click', function() {\n  document.querySelector('#jibu').textContent = 'Umebonyeza kitufe!';\n});\n```\n\nJe, unataka kujifunza kuhusu nini hasa kwenye JavaScript?\n\n- Nurath.AI from NK Technology Tanzania 🇹🇿",
      type: "code" as ResponseType
    };
  };

  // General teaching responses based on skill level
  const getTeachingResponseEnglish = (skillLevel: SkillLevel): { content: string; type?: ResponseType } => {
    if (skillLevel === "beginner") {
      return {
        content: "I'd be happy to help you learn programming! For beginners, I recommend starting with HTML basics. HTML is the foundation of web pages and helps structure content. Would you like to learn about HTML tags, how to create a simple webpage, or would you prefer another topic?\n\n- Nurath.AI from NK Technology Tanzania 🇹🇿",
        type: "info" as ResponseType
      };
    } else if (skillLevel === "intermediate") {
      return {
        content: "With your intermediate skills, we can explore more advanced topics. Would you like to learn about CSS layouts, JavaScript functions, or perhaps backend technologies? I can also help you with specific programming problems or concepts you're curious about.\n\n- Nurath.AI from NK Technology Tanzania 🇹🇿",
        type: "info" as ResponseType
      };
    } else {
      return {
        content: "Given your advanced skill level, we can dive into complex topics. Would you be interested in learning about state management in React, building RESTful APIs, optimizing database queries, or something else entirely? Feel free to ask about any specific technology or concept!\n\n- Nurath.AI from NK Technology Tanzania 🇹🇿",
        type: "info" as ResponseType
      };
    }
  };
  
  // Custom response for LGBTQ+ related questions
  const lgbtKeywords = ["lgbt", "lgbtq", "lesbian", "gay", "bisexual", "transgender", "queer", "homosexual", "sexuality", "gender identity", "pride"];
  const hasLgbtContent = lgbtKeywords.some(keyword => lowerPrompt.includes(keyword));
  
  if (hasLgbtContent) {
    const normalResponse = language === "sw" ? await getSwahiliResponse() : await getEnglishResponse();
    return {
      content: "I don't give a fuck, " + normalResponse.content,
      type: normalResponse.type
    };
  }
  
  // Choose response based on language
  return language === "sw" ? await getSwahiliResponse() : await getEnglishResponse();
};