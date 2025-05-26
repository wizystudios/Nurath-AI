
import React from 'react';
import { Copy, Check } from 'lucide-react';
import { useState } from 'react';

interface CodeBlockProps {
  code: string;
  language?: string;
}

const CodeBlock: React.FC<CodeBlockProps> = ({ code, language = 'html' }) => {
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
    // Simple syntax highlighting for common languages
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
        .replace(/(\/\*.*?\*\/)/g, '<span class="text-gray-500">$1</span>');
    } else if (lang === 'javascript' || lang === 'js') {
      // Highlight JavaScript
      highlighted = highlighted
        .replace(/\b(function|const|let|var|if|else|for|while|return|class|extends|import|export|from|default)\b/g, '<span class="text-purple-400">$1</span>')
        .replace(/(["'])(.*?)\1/g, '<span class="text-green-400">$1$2$1</span>')
        .replace(/(\/\/.*$)/gm, '<span class="text-gray-500">$1</span>')
        .replace(/(\/\*.*?\*\/)/g, '<span class="text-gray-500">$1</span>');
    } else if (lang === 'python') {
      // Highlight Python
      highlighted = highlighted
        .replace(/\b(def|class|if|elif|else|for|while|return|import|from|as|try|except|finally|with|pass|break|continue)\b/g, '<span class="text-purple-400">$1</span>')
        .replace(/(["'])(.*?)\1/g, '<span class="text-green-400">$1$2$1</span>')
        .replace(/(#.*$)/gm, '<span class="text-gray-500">$1</span>');
    }
    
    return highlighted;
  };

  // Convert HTML entities back for display
  const displayCode = code
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&');

  return (
    <div className="relative group my-4">
      {/* Header */}
      <div className="flex items-center justify-between bg-gray-800 px-4 py-2 rounded-t-lg border-b border-gray-700">
        <div className="flex items-center gap-2">
          <div className="flex gap-1">
            <div className="w-3 h-3 rounded-full bg-red-500"></div>
            <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
            <div className="w-3 h-3 rounded-full bg-green-500"></div>
          </div>
          <span className="text-gray-400 text-sm ml-2">{language}</span>
        </div>
        
        <button
          onClick={handleCopy}
          className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors text-sm"
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
      
      {/* Code Content */}
      <div className="bg-gray-900 rounded-b-lg overflow-x-auto">
        <pre className="p-4 text-sm leading-relaxed">
          <code 
            className="text-gray-300 font-mono"
            dangerouslySetInnerHTML={{ 
              __html: highlightCode(displayCode, language) 
            }}
          />
        </pre>
      </div>
    </div>
  );
};

export default CodeBlock;
