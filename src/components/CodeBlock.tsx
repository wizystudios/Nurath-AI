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

  // Custom dark theme
  const customTheme = {
    ...oneDark,
    'code[class*="language-"]': {
      ...oneDark['code[class*="language-"]'],
      fontFamily: '"JetBrains Mono", "Fira Code", "SF Mono", "Consolas", monospace',
      fontSize: '13px',
      lineHeight: '1.6',
    },
    'pre[class*="language-"]': {
      ...oneDark['pre[class*="language-"]'],
      background: 'transparent',
      margin: 0,
      padding: '1rem',
      borderRadius: 0,
    }
  };

  return (
    <div 
      className="relative group my-3 rounded-lg overflow-hidden bg-white/5"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2 bg-white/5">
        <div className="flex items-center gap-2">
          <Terminal className="w-4 h-4 text-white/50" />
          <span className="text-white/70 text-sm font-mono">
            {getLanguageIcon(language)} {language.toUpperCase()}
          </span>
        </div>
        
        <div className="flex items-center gap-1">
          {editable && (
            <button
              onClick={handleEdit}
              className={`flex items-center gap-1 text-white/50 hover:text-white transition-all text-xs px-2 py-1 rounded hover:bg-white/10 ${
                isHovered ? 'opacity-100' : 'opacity-0'
              }`}
            >
              <Edit3 className="w-3 h-3" />
              {isEditing ? 'Save' : 'Edit'}
            </button>
          )}
          
          {(language === 'javascript' || language === 'js' || language === 'python') && (
            <button
              onClick={handleRunCode}
              className={`flex items-center gap-1 text-white/50 hover:text-green-400 transition-all text-xs px-2 py-1 rounded hover:bg-white/10 ${
                isHovered ? 'opacity-100' : 'opacity-0'
              }`}
            >
              <Play className="w-3 h-3" />
              Run
            </button>
          )}
          
          <button
            onClick={handleCopy}
            className="flex items-center gap-1 text-white/50 hover:text-white transition-colors text-xs px-2 py-1 rounded hover:bg-white/10"
          >
            {copied ? (
              <>
                <Check className="w-3 h-3 text-green-400" />
                <span className="text-green-400">Copied</span>
              </>
            ) : (
              <>
                <Copy className="w-3 h-3" />
                Copy
              </>
            )}
          </button>
        </div>
      </div>
      
      {/* Code Content */}
      <div className="relative">
        {isEditing ? (
          <textarea
            value={editedCode}
            onChange={(e) => setEditedCode(e.target.value)}
            className="w-full bg-transparent text-white p-4 resize-none border-none outline-none font-mono text-sm leading-relaxed"
            style={{
              fontFamily: '"JetBrains Mono", "Fira Code", monospace',
              minHeight: '120px'
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
              padding: '1rem',
            }}
            showLineNumbers={code.split('\n').length > 3}
            lineNumberStyle={{
              color: 'rgba(255,255,255,0.3)',
              fontSize: '11px',
              marginRight: '1rem',
              userSelect: 'none'
            }}
            wrapLines={true}
            wrapLongLines={true}
          >
            {code}
          </SyntaxHighlighter>
        )}
      </div>
    </div>
  );
};

export default CodeBlock;