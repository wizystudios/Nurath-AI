
import React from 'react';
import CodeBlock from './CodeBlock';

interface MessageRendererProps {
  content: string;
}

const MessageRenderer: React.FC<MessageRendererProps> = ({ content }) => {
  // Function to parse content and extract code blocks
  const parseContent = (text: string) => {
    const parts = [];
    let currentIndex = 0;
    
    // Enhanced regex to match code blocks with language specification
    const codeBlockRegex = /```(\w+)?\n([\s\S]*?)```/g;
    let match;
    
    while ((match = codeBlockRegex.exec(text)) !== null) {
      const [fullMatch, language, code] = match;
      
      // Add text before code block
      if (match.index > currentIndex) {
        const textBefore = text.slice(currentIndex, match.index);
        if (textBefore.trim()) {
          parts.push({
            type: 'text',
            content: textBefore,
            key: `text-${currentIndex}`
          });
        }
      }
      
      // Add code block
      parts.push({
        type: 'code',
        content: code.trim(),
        language: language || 'text',
        key: `code-${match.index}`
      });
      
      currentIndex = match.index + fullMatch.length;
    }
    
    // Add remaining text
    if (currentIndex < text.length) {
      const remainingText = text.slice(currentIndex);
      if (remainingText.trim()) {
        parts.push({
          type: 'text',
          content: remainingText,
          key: `text-${currentIndex}`
        });
      }
    }
    
    // If no code blocks found, return the whole text
    if (parts.length === 0) {
      parts.push({
        type: 'text',
        content: text,
        key: 'text-0'
      });
    }
    
    return parts;
  };

  const formatText = (text: string) => {
    // Convert markdown-style formatting
    let formattedText = text
      // Bold text
      .replace(/\*\*(.*?)\*\*/g, '<strong class="font-bold text-gray-900 dark:text-white">$1</strong>')
      // Italic text
      .replace(/\*(.*?)\*/g, '<em class="italic">$1</em>')
      // Inline code
      .replace(/`([^`]+)`/g, '<code class="bg-gray-100 dark:bg-gray-800 text-red-600 dark:text-red-400 px-1 py-0.5 rounded text-sm font-mono">$1</code>');
    
    // Convert line breaks to <br> tags and return JSX
    return formattedText.split('\n').map((line, index, array) => (
      <React.Fragment key={index}>
        <span dangerouslySetInnerHTML={{ __html: line }} />
        {index < array.length - 1 && <br />}
      </React.Fragment>
    ));
  };

  const parts = parseContent(content);

  return (
    <div className="message-content space-y-3">
      {parts.map((part) => {
        if (part.type === 'code') {
          return (
            <CodeBlock
              key={part.key}
              code={part.content}
              language={part.language}
              editable={true}
              onEdit={(newCode) => {
                console.log('Code edited:', newCode);
                // This could be extended to update the conversation
              }}
            />
          );
        } else {
          return (
            <div key={part.key} className="text-content leading-relaxed">
              {formatText(part.content)}
            </div>
          );
        }
      })}
    </div>
  );
};

export default MessageRenderer;
