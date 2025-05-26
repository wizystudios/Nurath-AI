
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
        language: language || 'html',
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
    // Convert line breaks to <br> tags
    return text.split('\n').map((line, index, array) => (
      <React.Fragment key={index}>
        {line}
        {index < array.length - 1 && <br />}
      </React.Fragment>
    ));
  };

  const parts = parseContent(content);

  return (
    <div className="message-content">
      {parts.map((part) => {
        if (part.type === 'code') {
          return (
            <CodeBlock
              key={part.key}
              code={part.content}
              language={part.language}
            />
          );
        } else {
          return (
            <div key={part.key} className="text-content">
              {formatText(part.content)}
            </div>
          );
        }
      })}
    </div>
  );
};

export default MessageRenderer;
