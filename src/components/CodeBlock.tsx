
import React from 'react';
import { Copy, Check, Terminal } from 'lucide-react';
import { useState } from 'react';

interface CodeBlockProps {
  code: string;
  language?: string;
}

const CodeBlock: React.FC<CodeBlockProps> = ({ code, language = 'text' }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const highlightCode = (code: string, lang: string) => {
    let highlighted = code;
    
    if (lang === 'html' || lang === 'xml') {
      // Highlight HTML tags
      highlighted = highlighted
        .replace(/(&lt;\/?)(\w+)/g, '<span class="text-blue-400">$1$2</span>')
        .replace(/(\w+)(=)/g, '<span class="text-green-400">$1</span><span class="text-white">$2</span>')
        .replace(/(["'])(.*?)\1/g, '<span class="text-yellow-300">$1$2$1</span>')
        .replace(/(&lt;!--.*?--&gt;)/g, '<span class="text-gray-500">$1</span>');
    } else if (lang === 'css') {
      // Highlight CSS
      highlighted = highlighted
        .replace(/([.#]?[\w-]+)(\s*{)/g, '<span class="text-yellow-300">$1</span><span class="text-white">$2</span>')
        .replace(/([\w-]+)(\s*:)/g, '<span class="text-blue-400">$1</span><span class="text-white">$2</span>')
        .replace(/(["'])(.*?)\1/g, '<span class="text-green-400">$1$2$1</span>')
        .replace(/(\/\*.*?\*\/)/g, '<span class="text-gray-500">$1</span>')
        .replace(/([{}])/g, '<span class="text-purple-400">$1</span>');
    } else if (lang === 'javascript' || lang === 'js') {
      // Highlight JavaScript
      highlighted = highlighted
        .replace(/\b(function|const|let|var|if|else|for|while|return|class|extends|import|export|from|default|async|await|try|catch|finally|throw|new|this|super)\b/g, '<span class="text-purple-400">$1</span>')
        .replace(/\b(true|false|null|undefined)\b/g, '<span class="text-orange-400">$1</span>')
        .replace(/\b(\d+)\b/g, '<span class="text-cyan-400">$1</span>')
        .replace(/(["'])(.*?)\1/g, '<span class="text-green-400">$1$2$1</span>')
        .replace(/(\/\/.*$)/gm, '<span class="text-gray-500">$1</span>')
        .replace(/(\/\*.*?\*\/)/g, '<span class="text-gray-500">$1</span>')
        .replace(/([{}()[\]])/g, '<span class="text-yellow-300">$1</span>');
    } else if (lang === 'python') {
      // Highlight Python
      highlighted = highlighted
        .replace(/\b(def|class|if|elif|else|for|while|return|import|from|as|try|except|finally|with|pass|break|continue|and|or|not|in|is|lambda|yield|global|nonlocal)\b/g, '<span class="text-purple-400">$1</span>')
        .replace(/\b(True|False|None)\b/g, '<span class="text-orange-400">$1</span>')
        .replace(/\b(\d+)\b/g, '<span class="text-cyan-400">$1</span>')
        .replace(/(["'])(.*?)\1/g, '<span class="text-green-400">$1$2$1</span>')
        .replace(/(#.*$)/gm, '<span class="text-gray-500">$1</span>')
        .replace(/([{}()[\]])/g, '<span class="text-yellow-300">$1</span>');
    } else if (lang === 'java') {
      // Highlight Java
      highlighted = highlighted
        .replace(/\b(public|private|protected|static|final|abstract|class|interface|extends|implements|import|package|return|if|else|for|while|do|switch|case|default|try|catch|finally|throw|throws|new|this|super|void|int|String|boolean|double|float|char|long|short|byte)\b/g, '<span class="text-purple-400">$1</span>')
        .replace(/\b(true|false|null)\b/g, '<span class="text-orange-400">$1</span>')
        .replace(/\b(\d+)\b/g, '<span class="text-cyan-400">$1</span>')
        .replace(/(["'])(.*?)\1/g, '<span class="text-green-400">$1$2$1</span>')
        .replace(/(\/\/.*$)/gm, '<span class="text-gray-500">$1</span>')
        .replace(/(\/\*.*?\*\/)/g, '<span class="text-gray-500">$1</span>')
        .replace(/([{}()[\]])/g, '<span class="text-yellow-300">$1</span>');
    } else if (lang === 'sql') {
      // Highlight SQL
      highlighted = highlighted
        .replace(/\b(SELECT|FROM|WHERE|INSERT|UPDATE|DELETE|CREATE|TABLE|DATABASE|INDEX|PRIMARY|KEY|FOREIGN|REFERENCES|NOT|NULL|DEFAULT|AUTO_INCREMENT|VARCHAR|INT|TEXT|DATETIME|TIMESTAMP|JOIN|LEFT|RIGHT|INNER|OUTER|ON|ORDER|BY|GROUP|HAVING|LIMIT|OFFSET|UNION|ALL|DISTINCT|AS|AND|OR|IN|LIKE|BETWEEN)\b/gi, '<span class="text-purple-400">$&</span>')
        .replace(/\b(\d+)\b/g, '<span class="text-cyan-400">$1</span>')
        .replace(/(["'])(.*?)\1/g, '<span class="text-green-400">$1$2$1</span>')
        .replace(/(--.*$)/gm, '<span class="text-gray-500">$1</span>')
        .replace(/([();,])/g, '<span class="text-yellow-300">$1</span>');
    }
    
    return highlighted;
  };

  // Convert HTML entities back for display
  const displayCode = code
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&');

  const getLanguageIcon = (lang: string) => {
    switch (lang.toLowerCase()) {
      case 'html':
      case 'xml':
        return '🌐';
      case 'css':
        return '🎨';
      case 'javascript':
      case 'js':
        return '⚡';
      case 'python':
        return '🐍';
      case 'java':
        return '☕';
      case 'sql':
        return '🗄️';
      case 'bash':
      case 'shell':
        return '💻';
      default:
        return '📝';
    }
  };

  return (
    <div className="relative group my-4 rounded-lg overflow-hidden shadow-lg border border-gray-800">
      {/* Terminal Header */}
      <div className="flex items-center justify-between bg-gray-900 px-4 py-3 border-b border-gray-700">
        <div className="flex items-center gap-3">
          {/* Terminal dots */}
          <div className="flex gap-2">
            <div className="w-3 h-3 rounded-full bg-red-500"></div>
            <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
            <div className="w-3 h-3 rounded-full bg-green-500"></div>
          </div>
          <div className="flex items-center gap-2 ml-2">
            <Terminal className="w-4 h-4 text-gray-400" />
            <span className="text-gray-400 text-sm font-mono">
              {getLanguageIcon(language)} {language.toUpperCase()}
            </span>
          </div>
        </div>
        
        <button
          onClick={handleCopy}
          className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors text-sm px-3 py-1 rounded-md hover:bg-gray-800"
        >
          {copied ? (
            <>
              <Check className="w-4 h-4" />
              Copied!
            </>
          ) : (
            <>
              <Copy className="w-4 h-4" />
              Copy
            </>
          )}
        </button>
      </div>
      
      {/* Code Content with Terminal Style */}
      <div className="bg-gray-950 overflow-x-auto">
        <pre className="p-4 text-sm leading-relaxed font-mono">
          <code 
            className="text-gray-100 block"
            dangerouslySetInnerHTML={{ 
              __html: highlightCode(displayCode, language) 
            }}
            style={{
              fontFamily: '"JetBrains Mono", "Fira Code", "Consolas", "Monaco", "Courier New", monospace',
              fontSize: '14px',
              lineHeight: '1.6'
            }}
          />
        </pre>
      </div>
    </div>
  );
};

export default CodeBlock;
