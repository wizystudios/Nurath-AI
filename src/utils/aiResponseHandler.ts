
type SkillLevel = "beginner" | "intermediate" | "advanced";
type Language = "en" | "sw";

interface AIResponseOptions {
  prompt: string;
  skillLevel: SkillLevel;
  language: Language;
}

// This function will eventually be replaced with real OpenAI integration
export const generateAIResponse = ({ prompt, skillLevel, language }: AIResponseOptions): { content: string; type?: "text" | "code" | "info" | "warning" } => {
  const lowerPrompt = prompt.toLowerCase();
  
  // Function to get responses in Swahili
  const getSwahiliResponse = () => {
    if (lowerPrompt.includes("habari") || lowerPrompt.includes("hujambo") || lowerPrompt.includes("mambo")) {
      return {
        content: "Habari! Mimi ni Nurath, msaidizi wako wa AI kutoka NK Technology Tanzania. Ninaweza kukusaidia kujifunza programu, kuunda tovuti, na kujibu maswali yako ya teknolojia. Unahitaji usaidizi gani leo?"
      };
    }
    
    if (lowerPrompt.includes("jina lako")) {
      return {
        content: "Jina langu ni Nurath. Niliundwa na NK Technology nchini Tanzania kusaidia watu kujifunza programu na teknolojia. Ninafurahi kukusaidia leo!"
      };
    }
    
    if (lowerPrompt.includes("html")) {
      if (skillLevel === "beginner") {
        return {
          content: "HTML (Hypertext Markup Language) ni lugha ya kimsingi ya kuunda tovuti. Inatumika kuunda muundo wa ukurasa wa wavuti. Hebu nionyeshe mfano rahisi:\n\n```html\n<!DOCTYPE html>\n<html>\n<head>\n  <title>Ukurasa Wangu</title>\n</head>\n<body>\n  <h1>Karibu kwenye Tovuti Yangu</h1>\n  <p>Hii ni aya ya maandishi.</p>\n</body>\n</html>\n```\n\nUnataka kujifunza zaidi?",
          type: "code" as "text" | "code" | "info" | "warning"
        };
      } else {
        return {
          content: "Kama mtumiaji wa kiwango cha " + skillLevel + ", unaweza kuvinjari vipengele vya hali ya juu zaidi vya HTML kama vile semantic elements, forms, na accessibility. Hebu nionyeshe mfano:\n\n```html\n<!DOCTYPE html>\n<html lang=\"sw\">\n<head>\n  <meta charset=\"UTF-8\">\n  <meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0\">\n  <title>Tovuti ya Kisasa</title>\n</head>\n<body>\n  <header>\n    <nav>\n      <ul>\n        <li><a href=\"#\">Nyumbani</a></li>\n        <li><a href=\"#\">Huduma</a></li>\n        <li><a href=\"#\">Kuhusu</a></li>\n      </ul>\n    </nav>\n  </header>\n  <main>\n    <article>\n      <h1>Makala ya Teknolojia</h1>\n      <p>Yaliyomo ya makala...</p>\n    </article>\n  </main>\n  <footer>\n    <p>&copy; 2025 Tovuti Yangu</p>\n  </footer>\n</body>\n</html>\n```",
          type: "code" as "text" | "code" | "info" | "warning"
        };
      }
    }
    
    if (lowerPrompt.includes("css")) {
      return {
        content: "CSS (Cascading Style Sheets) inatumika kuboresha muonekano wa tovuti zako. Kwa mfano:\n\n```css\nbody {\n  font-family: 'Arial', sans-serif;\n  background-color: #f5f5f5;\n  color: #333;\n}\n\nheader {\n  background-color: #1a73e8;\n  color: white;\n  padding: 1rem;\n}\n\nnav ul {\n  display: flex;\n  list-style: none;\n  gap: 1rem;\n}\n```\n\nUnataka kujifunza zaidi kuhusu muundo wa Grid au Flexbox?",
        type: "code" as "text" | "code" | "info" | "warning"
      };
    }
    
    if (lowerPrompt.includes("javascript") || lowerPrompt.includes("js")) {
      return {
        content: "JavaScript ni lugha ya programu inayoruhusu uboreshaji wa tovuti zako na kuongeza ushirikishwaji. Mfano:\n\n```javascript\n// Kuhesabu jumla ya nambari mbili\nfunction jumlisha(a, b) {\n  return a + b;\n}\n\n// Badilisha maandishi kwenye kitufe\ndocument.querySelector('#kitufe').addEventListener('click', function() {\n  document.querySelector('#jibu').textContent = 'Umebonyeza kitufe!';\n});\n```\n\nJe, unataka kujifunza kuhusu nini hasa kwenye JavaScript?",
        type: "code" as "text" | "code" | "info" | "warning"
      };
    }
    
    // Default response in Swahili
    return {
      content: "Ninatumika kukusaidia kujifunza programu na teknolojia. Unaweza kuniuliza kuhusu HTML, CSS, JavaScript, na zaidi. Ninaweza pia kukusaidia kuunda mradi wako. Unahitaji usaidizi gani leo?"
    };
  };
  
  // Function to get responses in English
  const getEnglishResponse = () => {
    if (lowerPrompt.includes("hello") || lowerPrompt.includes("hi") || lowerPrompt.includes("hey")) {
      return {
        content: "Hello! I'm Nurath, your AI assistant from NK Technology Tanzania. I can help you learn programming, build websites, and answer your technology questions. How can I assist you today?"
      };
    }
    
    if (lowerPrompt.includes("your name") || lowerPrompt.includes("who are you")) {
      return {
        content: "My name is Nurath, an AI assistant created by NK Technology in Tanzania to help people learn programming and technology. I'm here to assist you with learning to code, building websites, and answering your technical questions!"
      };
    }
    
    if (lowerPrompt.includes("who created you") || lowerPrompt.includes("who made you")) {
      return {
        content: "I was created by NK Technology, based in Tanzania. I'm designed to help people learn programming and technology, particularly focusing on web development and coding skills."
      };
    }
    
    if (lowerPrompt.includes("teach me") || lowerPrompt.includes("help me learn")) {
      if (skillLevel === "beginner") {
        return {
          content: "I'd be happy to help you learn programming! For beginners, I recommend starting with HTML basics. HTML is the foundation of web pages and helps structure content. Would you like to learn about HTML tags, how to create a simple webpage, or would you prefer another topic?",
          type: "info" as "text" | "code" | "info" | "warning"
        };
      } else if (skillLevel === "intermediate") {
        return {
          content: "With your intermediate skills, we can explore more advanced topics. Would you like to learn about CSS layouts, JavaScript functions, or perhaps backend technologies? I can also help you with specific programming problems or concepts you're curious about.",
          type: "info" as "text" | "code" | "info" | "warning"
        };
      } else {
        return {
          content: "Given your advanced skill level, we can dive into complex topics. Would you be interested in learning about state management in React, building RESTful APIs, optimizing database queries, or something else entirely? Feel free to ask about any specific technology or concept!",
          type: "info" as "text" | "code" | "info" | "warning"
        };
      }
    }
    
    if (lowerPrompt.includes("html")) {
      if (skillLevel === "beginner") {
        return {
          content: "HTML (Hypertext Markup Language) is the standard language for creating websites. It's used to structure content on the web. Let me show you a simple example:\n\n```html\n<!DOCTYPE html>\n<html>\n<head>\n  <title>My Page</title>\n</head>\n<body>\n  <h1>Welcome to My Website</h1>\n  <p>This is a paragraph of text.</p>\n</body>\n</html>\n```\n\nWould you like to learn more about specific HTML elements?",
          type: "code" as "text" | "code" | "info" | "warning"
        };
      } else {
        return {
          content: "As a " + skillLevel + " user, you might want to explore more advanced HTML features like semantic elements, forms, and accessibility. Here's an example:\n\n```html\n<!DOCTYPE html>\n<html lang=\"en\">\n<head>\n  <meta charset=\"UTF-8\">\n  <meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0\">\n  <title>Modern Website</title>\n</head>\n<body>\n  <header>\n    <nav>\n      <ul>\n        <li><a href=\"#\">Home</a></li>\n        <li><a href=\"#\">Services</a></li>\n        <li><a href=\"#\">About</a></li>\n      </ul>\n    </nav>\n  </header>\n  <main>\n    <article>\n      <h1>Technology Article</h1>\n      <p>Article content goes here...</p>\n    </article>\n  </main>\n  <footer>\n    <p>&copy; 2025 My Website</p>\n  </footer>\n</body>\n</html>\n```",
          type: "code" as "text" | "code" | "info" | "warning"
        };
      }
    }
    
    if (lowerPrompt.includes("css")) {
      return {
        content: "CSS (Cascading Style Sheets) is used to style your HTML documents. Here's an example:\n\n```css\nbody {\n  font-family: 'Arial', sans-serif;\n  background-color: #f5f5f5;\n  color: #333;\n}\n\nheader {\n  background-color: #1a73e8;\n  color: white;\n  padding: 1rem;\n}\n\nnav ul {\n  display: flex;\n  list-style: none;\n  gap: 1rem;\n}\n```\n\nWould you like to learn more about layout with Grid or Flexbox?",
        type: "code" as "text" | "code" | "info" | "warning"
      };
    }
    
    if (lowerPrompt.includes("javascript") || lowerPrompt.includes("js")) {
      return {
        content: "JavaScript is a programming language that allows you to enhance your websites and add interactivity. Here's an example:\n\n```javascript\n// Add two numbers together\nfunction add(a, b) {\n  return a + b;\n}\n\n// Change text on button click\ndocument.querySelector('#myButton').addEventListener('click', function() {\n  document.querySelector('#result').textContent = 'You clicked the button!';\n});\n```\n\nWhat specific aspect of JavaScript would you like to learn about?",
        type: "code" as "text" | "code" | "info" | "warning"
      };
    }
    
    // Default response in English
    return {
      content: "I'm here to help you learn programming and technology. You can ask me about HTML, CSS, JavaScript, and more. I can also help you build your project. What do you need help with today?"
    };
  };
  
  // Choose response based on language
  return language === "sw" ? getSwahiliResponse() : getEnglishResponse();
};
