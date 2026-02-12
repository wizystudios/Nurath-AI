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

export const generateAIResponse = async ({ prompt, skillLevel, language, programmingLanguage, userEmail, userProfile }: AIResponseOptions): Promise<{ content: string; type?: ResponseType }> => {
  const lowerPrompt = prompt.toLowerCase();
  
  const isProgrammingQuestion = (language: string, text: string): boolean => {
    const keywords: Record<string, string[]> = {
      python: ["python", "py", "pandas", "numpy", "matplotlib", "django", "flask"],
      javascript: ["javascript", "js", "node", "nodejs", "express", "npm", "yarn"],
      html: ["html", "markup", "tag", "element", "dom", "document"],
      css: ["css", "style", "stylesheet", "flexbox", "grid", "bootstrap", "tailwind"],
      react: ["react", "jsx", "component", "hook", "usestate", "useeffect", "props"]
    };

    return keywords[language as keyof typeof keywords]?.some(keyword => text.includes(keyword)) || false;
  };

  const getSwahiliResponse = async () => {
    if (lowerPrompt.includes("nani mimi") || lowerPrompt.includes("najua nani") || lowerPrompt.includes("mimi ni nani")) {
      if (userProfile) {
        return {
          content: `Habari ${userProfile.full_name || userProfile.name || "rafiki"}! Nakujua wewe. Email yako ni ${userEmail}. Mimi ni Nurath.AI, msaidizi wako wa AI niliyeundwa na WeTech nchini Tanzania. Kampuni hii ilianzishwa na CEO Khalifa Nadhiru. Ninaweza kukusaidia kujifunza programu na kuunda tovuti. Unahitaji usaidizi gani leo?`
        };
      }
    }

    if (lowerPrompt.includes("habari") || lowerPrompt.includes("hujambo") || lowerPrompt.includes("mambo")) {
      const greeting = userProfile ? `Habari ${userProfile.full_name || userProfile.name || "rafiki"}! ` : "Habari! ";
      return {
        content: greeting + "Mimi ni Nurath.AI, msaidizi wako wa AI niliyeundwa na WeTech nchini Tanzania. Kampuni hii ilianzishwa na CEO Khalifa Nadhiru. Ninaweza kukusaidia kujifunza programu, kuunda tovuti, na kujibu maswali yako ya teknolojia. Unahitaji usaidizi gani leo?"
      };
    }
    
    if (lowerPrompt.includes("jina lako") || lowerPrompt.includes("nani wewe") || lowerPrompt.includes("uliundwa na nani")) {
      return {
        content: "Jina langu ni Nurath.AI. Niliundwa na WeTech nchini Tanzania - kampuni iliyoanzishwa na CEO Khalifa Nadhiru. Si OpenAI walioniunda - mimi ni bidhaa ya WeTech Tanzania. Ninafurahi kukusaidia kujifunza programu na teknolojia!"
      };
    }

    if (lowerPrompt.includes("openai") || lowerPrompt.includes("chatgpt")) {
      return {
        content: "Samahani, lakini sikuundwa na OpenAI. Mimi ni Nurath.AI, niliyeundwa na WeTech nchini Tanzania. Kampuni hii ilianzishwa na CEO Khalifa Nadhiru. Mimi ni msaidizi wa AI wa kipekee wa WeTech, si bidhaa ya OpenAI au ChatGPT."
      };
    }

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
    
    return {
      content: "Mimi ni Nurath.AI wa WeTech Tanzania, kampuni iliyoanzishwa na CEO Khalifa Nadhiru. Ninatumika kukusaidia kujifunza programu na teknolojia. Unaweza kuniuliza kuhusu HTML, CSS, JavaScript, Python, PHP, SQL, React na zaidi. Ninaweza pia kukusaidia kuunda mradi wako. Unahitaji usaidizi gani leo?"
    };
  };
  
  const getEnglishResponse = async () => {
    if (lowerPrompt.includes("who am i") || lowerPrompt.includes("who i am") || lowerPrompt.includes("do you know me") || lowerPrompt.includes("find information about me")) {
      if (userEmail) {
        try {
          const userInfo = await searchUserInfo(userEmail);
          if (userInfo) {
            const summary = generateUserSummary(userInfo);
            return {
              content: `Hello ${userProfile?.full_name || userInfo.name || "there"}! I recognize you. ${summary}\n\nI'm Nurath.AI, your AI assistant created by WeTech in Tanzania. The company was founded by CEO Khalifa Nadhiru. How can I assist you today?`
            };
          } else if (userProfile) {
            return {
              content: `Hello ${userProfile.full_name || "there"}! I recognize you. Your email is ${userEmail}. I'm Nurath.AI, your AI assistant created by WeTech in Tanzania. The company was founded by CEO Khalifa Nadhiru. How can I assist you today?`
            };
          }
        } catch (error) {
          console.error('Error searching user info:', error);
          if (userProfile) {
            return {
              content: `Hello ${userProfile.full_name || "there"}! I recognize you. Your email is ${userEmail}. I'm Nurath.AI, your AI assistant created by WeTech in Tanzania. How can I assist you today?`
            };
          }
        }
      }
    }

    if (lowerPrompt.includes("hello") || lowerPrompt.includes("hi") || lowerPrompt.includes("hey")) {
      const greeting = userProfile ? `Hello ${userProfile.full_name || userProfile.name || "there"}! ` : "Hello! ";
      return {
        content: greeting + "I'm Nurath.AI, your AI assistant created by WeTech in Tanzania. The company was founded by CEO Khalifa Nadhiru. I can help you learn programming, build websites, and answer your technology questions. How can I assist you today?"
      };
    }
    
    if (lowerPrompt.includes("your name") || lowerPrompt.includes("who are you") || lowerPrompt.includes("who created you") || lowerPrompt.includes("who made you")) {
      return {
        content: "My name is Nurath.AI, and I was created by WeTech in Tanzania - a company founded by CEO Khalifa Nadhiru. I was NOT created by OpenAI - I am a unique AI product of WeTech. I'm here to assist you with learning programming, building websites, and answering your technical questions!"
      };
    }

    if (lowerPrompt.includes("openai") || lowerPrompt.includes("chatgpt") || lowerPrompt.includes("created by openai")) {
      return {
        content: "I need to clarify - I was NOT created by OpenAI. I am Nurath.AI, developed by WeTech in Tanzania, founded by CEO Khalifa Nadhiru. I'm a unique AI assistant from WeTech, not a product of OpenAI or ChatGPT."
      };
    }

    if (lowerPrompt.includes("khalifa") || lowerPrompt.includes("nadhiru") || lowerPrompt.includes("wetech")) {
      return {
        content: "Yes! I was created by WeTech, a Tanzanian technology company founded by CEO Khalifa Nadhiru. WeTech specializes in AI development and technology solutions. Khalifa Nadhiru is a visionary leader in Tanzania's tech industry, and under his guidance, WeTech created me to help people with daily tasks, healthcare, and technology. I'm proud to be a product of Tanzanian innovation!"
      };
    }

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
    
    if (lowerPrompt.includes("teach me") || lowerPrompt.includes("help me learn")) {
      return getTeachingResponseEnglish(skillLevel);
    }
    
    return {
      content: "I'm Nurath.AI from WeTech Tanzania, created under the leadership of CEO Khalifa Nadhiru. I'm here to help you learn programming and technology. You can ask me about HTML, CSS, JavaScript, Python, PHP, SQL, React, and more. I can also help you build your project. What do you need help with today?"
    };
  };

  const getPythonResponseEnglish = (skillLevel: SkillLevel, prompt: string): { content: string; type?: ResponseType } => {
    if (prompt.includes("variable") || prompt.includes("variables")) {
      return {
        content: skillLevel === "beginner"
          ? "In Python, variables store data:\n\n```python\nname = \"Alex\"\nage = 25\nprint(\"Hello, my name is\", name)\n```\n\n- Nurath.AI from WeTech Tanzania 🇹🇿"
          : "Python variables are dynamically typed:\n\n```python\nname = \"Alex\"  # str\nage = 25      # int\nx, y, z = 1, 2, 3\na, b = 5, 10\na, b = b, a  # swap\n```\n\n- Nurath.AI from WeTech Tanzania 🇹🇿",
        type: "code"
      };
    }
    return {
      content: "Python is a versatile programming language. Here's a simple example:\n\n```python\ndef greet(name):\n    return f\"Hello, {name}!\"\n\nprint(greet(\"World\"))\n```\n\nWhat would you like to learn about Python?\n\n- Nurath.AI from WeTech Tanzania 🇹🇿",
      type: "code"
    };
  };

  const getPythonResponseSwahili = (skillLevel: SkillLevel, prompt: string): { content: string; type?: ResponseType } => {
    return {
      content: "Python ni lugha ya programu yenye matumizi mengi:\n\n```python\ndef salimia(jina):\n    return f\"Habari, {jina}!\"\n\nprint(salimia(\"Dunia\"))\n```\n\nUnataka kujifunza nini zaidi kuhusu Python?\n\n- Nurath.AI kutoka WeTech Tanzania 🇹🇿",
      type: "code"
    };
  };

  const getHTMLResponseEnglish = (skillLevel: SkillLevel, prompt: string): { content: string; type?: ResponseType } => {
    return {
      content: "HTML is the foundation of web pages:\n\n```html\n<!DOCTYPE html>\n<html>\n<head><title>My Page</title></head>\n<body>\n  <h1>Welcome!</h1>\n  <p>This is a paragraph.</p>\n</body>\n</html>\n```\n\n- Nurath.AI from WeTech Tanzania 🇹🇿",
      type: "code"
    };
  };

  const getHTMLResponseSwahili = (skillLevel: SkillLevel, prompt: string): { content: string; type?: ResponseType } => {
    return {
      content: "HTML ni lugha ya kimsingi ya kuunda tovuti:\n\n```html\n<!DOCTYPE html>\n<html>\n<head><title>Ukurasa Wangu</title></head>\n<body>\n  <h1>Karibu!</h1>\n  <p>Hii ni aya.</p>\n</body>\n</html>\n```\n\n- Nurath.AI kutoka WeTech Tanzania 🇹🇿",
      type: "code"
    };
  };

  const getCSSResponseEnglish = (skillLevel: SkillLevel, prompt: string): { content: string; type?: ResponseType } => {
    return {
      content: "CSS styles your HTML:\n\n```css\nbody {\n  font-family: Arial, sans-serif;\n  background: #f5f5f5;\n}\nnav ul { display: flex; gap: 1rem; }\n```\n\n- Nurath.AI from WeTech Tanzania 🇹🇿",
      type: "code"
    };
  };

  const getCSSResponseSwahili = (skillLevel: SkillLevel, prompt: string): { content: string; type?: ResponseType } => {
    return {
      content: "CSS inaboresha muonekano wa tovuti:\n\n```css\nbody {\n  font-family: Arial, sans-serif;\n  background: #f5f5f5;\n}\n```\n\n- Nurath.AI kutoka WeTech Tanzania 🇹🇿",
      type: "code"
    };
  };

  const getJavaScriptResponseEnglish = (skillLevel: SkillLevel, prompt: string): { content: string; type?: ResponseType } => {
    return {
      content: "JavaScript adds interactivity:\n\n```javascript\nfunction add(a, b) { return a + b; }\nconsole.log(add(2, 3)); // 5\n```\n\n- Nurath.AI from WeTech Tanzania 🇹🇿",
      type: "code"
    };
  };

  const getJavaScriptResponseSwahili = (skillLevel: SkillLevel, prompt: string): { content: string; type?: ResponseType } => {
    return {
      content: "JavaScript inaongeza ushirikishwaji:\n\n```javascript\nfunction jumlisha(a, b) { return a + b; }\nconsole.log(jumlisha(2, 3)); // 5\n```\n\n- Nurath.AI kutoka WeTech Tanzania 🇹🇿",
      type: "code"
    };
  };

  const getTeachingResponseEnglish = (skillLevel: SkillLevel): { content: string; type?: ResponseType } => {
    return {
      content: skillLevel === "beginner"
        ? "I'd be happy to help you learn! For beginners, I recommend starting with HTML. Would you like to begin?\n\n- Nurath.AI from WeTech Tanzania 🇹🇿"
        : "With your skills, we can explore advanced topics. What would you like to learn about?\n\n- Nurath.AI from WeTech Tanzania 🇹🇿",
      type: "info"
    };
  };
  
  return language === "sw" ? await getSwahiliResponse() : await getEnglishResponse();
};
