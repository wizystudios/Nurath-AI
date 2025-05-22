
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Code, FileText, Database, Globe, Layers } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import NKTechLogo from './NKTechLogo';
import LanguageSelectionCard from './LanguageSelectionCard';
import { Language } from './LanguageSelector';

interface WelcomeScreenProps {
  onClose: () => void;
  onLanguageSelect: (language: Language) => void;
  currentLanguage: Language;
}

const WelcomeScreen: React.FC<WelcomeScreenProps> = ({ 
  onClose,
  onLanguageSelect,
  currentLanguage
}) => {
  const [selectedTab, setSelectedTab] = useState("web");

  // Container animation
  const containerVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.6,
        staggerChildren: 0.1
      }
    }
  };

  // Item animation
  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  };

  // Language cards data
  const programmingLanguages = {
    web: [
      {
        title: "HTML & CSS",
        description: "Learn the building blocks of web development with HTML for structure and CSS for styling.",
        icon: <Globe className="h-6 w-6 text-blue-600" />,
        level: "Start from the basics",
        difficulty: "beginner" as const,
        onSelect: () => onClose()
      },
      {
        title: "JavaScript",
        description: "Add interactivity to your websites with JavaScript, the programming language of the web.",
        icon: <Code className="h-6 w-6 text-yellow-500" />,
        level: "Build dynamic web experiences",
        difficulty: "intermediate" as const,
        onSelect: () => onClose()
      },
      {
        title: "React",
        description: "Create modern single-page applications with the React library and component architecture.",
        icon: <Layers className="h-6 w-6 text-blue-400" />,
        level: "Advanced frontend development",
        difficulty: "advanced" as const,
        onSelect: () => onClose()
      }
    ],
    programming: [
      {
        title: "Python",
        description: "A versatile language perfect for beginners, data science, automation, and web development.",
        icon: <Code className="h-6 w-6 text-green-600" />,
        level: "Popular for beginners and experts",
        difficulty: "beginner" as const,
        onSelect: () => onClose()
      },
      {
        title: "JavaScript",
        description: "The language of the web that now runs everywhere - browsers, servers, and mobile apps.",
        icon: <Code className="h-6 w-6 text-yellow-500" />,
        level: "Web and beyond",
        difficulty: "intermediate" as const,
        onSelect: () => onClose()
      },
      {
        title: "PHP",
        description: "Server-side programming language designed for web development and powering websites.",
        icon: <FileText className="h-6 w-6 text-purple-600" />,
        level: "Backend web development",
        difficulty: "intermediate" as const,
        onSelect: () => onClose()
      }
    ],
    data: [
      {
        title: "SQL",
        description: "Standard language for storing, manipulating and retrieving data in databases.",
        icon: <Database className="h-6 w-6 text-orange-600" />,
        level: "Master data querying and manipulation",
        difficulty: "intermediate" as const,
        onSelect: () => onClose()
      },
      {
        title: "Python for Data Science",
        description: "Use Python libraries like Pandas, NumPy, and Matplotlib for data analysis and visualization.",
        icon: <Code className="h-6 w-6 text-green-600" />,
        level: "Data analysis and visualization",
        difficulty: "intermediate" as const,
        onSelect: () => onClose()
      }
    ]
  };

  return (
    <motion.div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm overflow-y-auto py-10"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <motion.div 
        className="w-full max-w-5xl bg-white dark:bg-gray-900 rounded-xl shadow-2xl overflow-hidden"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-600 to-indigo-800 p-6 flex justify-between items-center">
          <div className="flex items-center">
            <NKTechLogo size="lg" className="text-white" />
            <div className="ml-4">
              <h2 className="text-xl font-bold text-white">Welcome to Nurath.AI</h2>
              <p className="text-purple-100">Your personal programming assistant</p>
            </div>
          </div>
          <div className="flex gap-4">
            <Button 
              variant="outline" 
              className="bg-white/10 border-white/20 hover:bg-white/20 text-white"
              onClick={() => onLanguageSelect(currentLanguage === 'en' ? 'sw' : 'en')}
            >
              {currentLanguage === 'en' ? 'Switch to Swahili' : 'Switch to English'}
            </Button>
            <Button 
              variant="outline" 
              className="bg-white/10 border-white/20 hover:bg-white/20 text-white"
              onClick={onClose}
            >
              Skip
            </Button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          <motion.div variants={itemVariants} className="mb-6">
            <h3 className="text-lg font-medium">
              {currentLanguage === 'en' 
                ? 'What would you like to learn today?' 
                : 'Ungependa kujifunza nini leo?'}
            </h3>
            <p className="text-gray-500 dark:text-gray-400">
              {currentLanguage === 'en' 
                ? 'Choose a programming language or technology to get started.'
                : 'Chagua lugha ya programu au teknolojia ili kuanza.'}
            </p>
          </motion.div>

          <motion.div variants={itemVariants}>
            <Tabs defaultValue="web" value={selectedTab} onValueChange={setSelectedTab}>
              <TabsList className="w-full justify-start mb-6">
                <TabsTrigger value="web">Web Development</TabsTrigger>
                <TabsTrigger value="programming">Programming</TabsTrigger>
                <TabsTrigger value="data">Data & Databases</TabsTrigger>
              </TabsList>
              
              {Object.entries(programmingLanguages).map(([category, languages]) => (
                <TabsContent value={category} key={category} className="mt-0">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {languages.map((lang, index) => (
                      <motion.div
                        key={lang.title}
                        variants={itemVariants}
                        custom={index}
                        className="h-full"
                      >
                        <LanguageSelectionCard {...lang} />
                      </motion.div>
                    ))}
                  </div>
                </TabsContent>
              ))}
            </Tabs>
          </motion.div>

          <motion.div variants={itemVariants} className="mt-8 flex justify-center">
            <p className="text-sm text-gray-500 dark:text-gray-400 max-w-lg text-center">
              {currentLanguage === 'en' 
                ? 'Not sure where to start? You can always chat with Nurath.AI to get personalized recommendations based on your interests and goals.'
                : 'Huna uhakika pa kuanzia? Unaweza kupiga gumzo na Nurath.AI kupata mapendekezo yanayofaa kulingana na mapendeleo na malengo yako.'}
            </p>
          </motion.div>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default WelcomeScreen;
