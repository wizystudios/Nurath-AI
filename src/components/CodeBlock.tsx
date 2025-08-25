import React, { useState } from 'react';
import { Copy, Check, Terminal, Edit3, Play } from 'lucide-react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';

interface CodeBlockProps {
  code: string;
  language?: string;
  editable?: boolean;
  onEdit?: (newCode: string) => void;
}

const CodeBlock: React.FC<CodeBlockProps> = ({ 
  code, 
  language = 'text', 
  editable = false,
  onEdit 
}) => {
  const [copied, setCopied] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editedCode, setEditedCode] = useState(code);
  const [isHovered, setIsHovered] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const handleEdit = () => {
    if (isEditing) {
      onEdit?.(editedCode);
      setIsEditing(false);
    } else {
      setIsEditing(true);
    }
  };

  const handleRunCode = () => {
    // For demonstration - this could be extended to actually run code
    console.log('Running code:', code);
  };

  const getLanguageIcon = (lang: string) => {
    switch (lang.toLowerCase()) {
      case 'html':
      case 'xml':
        return '🌐';
      case 'css':
        return '🎨';
      case 'javascript':
      case 'js':
      case 'jsx':
        return '⚡';
      case 'typescript':
      case 'ts':
      case 'tsx':
        return '🔷';
      case 'python':
        return '🐍';
      case 'java':
        return '☕';
      case 'sql':
        return '🗄️';
      case 'bash':
      case 'shell':
        return '💻';
      case 'json':
        return '📋';
      case 'yaml':
      case 'yml':
        return '📄';
      case 'markdown':
      case 'md':
        return '📝';
      case 'react':
        return '⚛️';
      default:
        return '📝';
    }
  };

  // Custom theme with better colors
  const customTheme = {
    ...oneDark,
    'code[class*="language-"]': {
      ...oneDark['code[class*="language-"]'],
      fontFamily: '"JetBrains Mono", "Fira Code", "SF Mono", "Consolas", "Monaco", monospace',
      fontSize: '14px',
      lineHeight: '1.6',
    },
    'pre[class*="language-"]': {
      ...oneDark['pre[class*="language-"]'],
      background: '#0f0f0f',
      margin: 0,
      padding: '1.5rem',
      borderRadius: 0,
    }
  };

  return (
    <div 
      className="relative group my-4 rounded-xl overflow-hidden shadow-2xl border border-gray-800 bg-gray-900 transition-all duration-300 hover:shadow-3xl hover:border-gray-700"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Terminal Header with macOS style */}
      <div className="flex items-center justify-between bg-gradient-to-r from-gray-800 to-gray-900 px-4 py-3 border-b border-gray-700">
        <div className="flex items-center gap-3">
          {/* macOS style dots */}
          <div className="flex gap-2">
            <div className="w-3 h-3 rounded-full bg-red-500 hover:bg-red-400 transition-colors cursor-pointer"></div>
            <div className="w-3 h-3 rounded-full bg-yellow-500 hover:bg-yellow-400 transition-colors cursor-pointer"></div>
            <div className="w-3 h-3 rounded-full bg-green-500 hover:bg-green-400 transition-colors cursor-pointer"></div>
          </div>
          <div className="flex items-center gap-2 ml-2">
            <Terminal className="w-4 h-4 text-gray-400" />
            <span className="text-gray-300 text-sm font-mono font-semibold">
              {getLanguageIcon(language)} {language.toUpperCase()}
            </span>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          {/* Edit button - shows on hover */}
          {editable && (
            <button
              onClick={handleEdit}
              className={`flex items-center gap-2 text-gray-400 hover:text-blue-400 transition-all text-sm px-3 py-1 rounded-md hover:bg-gray-800 ${
                isHovered ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-2'
              }`}
            >
              <Edit3 className="w-4 h-4" />
              {isEditing ? 'Save' : 'Edit'}
            </button>
          )}
          
          {/* Run button for JavaScript/Python */}
          {(language === 'javascript' || language === 'js' || language === 'python') && (
            <button
              onClick={handleRunCode}
              className={`flex items-center gap-2 text-gray-400 hover:text-green-400 transition-all text-sm px-3 py-1 rounded-md hover:bg-gray-800 ${
                isHovered ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-2'
              }`}
            >
              <Play className="w-4 h-4" />
              Run
            </button>
          )}
          
          {/* Copy button */}
          <button
            onClick={handleCopy}
            className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors text-sm px-3 py-1 rounded-md hover:bg-gray-800"
          >
            {copied ? (
              <>
                <Check className="w-4 h-4 text-green-400" />
                <span className="text-green-400">Copied!</span>
              </>
            ) : (
              <>
                <Copy className="w-4 h-4" />
                Copy
              </>
            )}
          </button>
        </div>
      </div>
      
      {/* Code Content */}
      <div className="relative bg-gray-950">
        {isEditing ? (
          <textarea
            value={editedCode}
            onChange={(e) => setEditedCode(e.target.value)}
            className="w-full bg-gray-950 text-gray-100 p-6 resize-none border-none outline-none font-mono text-sm leading-relaxed"
            style={{
              fontFamily: '"JetBrains Mono", "Fira Code", "SF Mono", "Consolas", "Monaco", monospace',
              minHeight: '200px'
            }}
            autoFocus
          />
        ) : (
          <SyntaxHighlighter
            language={language}
            style={customTheme}
            customStyle={{
              margin: 0,
              background: 'transparent',
              padding: '1.5rem',
            }}
            showLineNumbers={code.split('\n').length > 1}
            lineNumberStyle={{
              color: '#6b7280',
              fontSize: '12px',
              marginRight: '1rem',
              userSelect: 'none'
            }}
            wrapLines={true}
            wrapLongLines={true}
          >
            {code}
          </SyntaxHighlighter>
        )}
        
        {/* Line count indicator */}
        <div className="absolute bottom-2 right-2 text-xs text-gray-500 bg-gray-800 px-2 py-1 rounded">
          {code.split('\n').length} lines
        </div>
      </div>
      
      {/* Hover gradient effect */}
      <div className={`absolute inset-0 bg-gradient-to-r from-blue-500/5 to-purple-500/5 transition-opacity duration-300 pointer-events-none ${
        isHovered ? 'opacity-100' : 'opacity-0'
      }`}></div>
    </div>
  );
};

export default CodeBlock;