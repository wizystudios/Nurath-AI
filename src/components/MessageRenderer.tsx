import React from 'react';
import CodeBlock from './CodeBlock';

interface MessageRendererProps {
  content: string;
}

const MessageRenderer: React.FC<MessageRendererProps> = ({ content }) => {
  // Function to parse content and extract code blocks
  const parseContent = (text: string) => {
    const parts: Array<{ type: string; content: string; language?: string; key: string }> = [];
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
    // Split into lines for processing
    const lines = text.split('\n');
    const elements: React.ReactNode[] = [];
    let listItems: string[] = [];
    let listType: 'ul' | 'ol' | null = null;

    const flushList = () => {
      if (listItems.length > 0 && listType) {
        const ListTag = listType;
        elements.push(
          <ListTag key={`list-${elements.length}`} className={`${listType === 'ul' ? 'list-disc' : 'list-decimal'} list-inside space-y-1 my-2 text-white/90`}>
            {listItems.map((item, i) => (
              <li key={i} dangerouslySetInnerHTML={{ __html: formatInlineText(item) }} />
            ))}
          </ListTag>
        );
        listItems = [];
        listType = null;
      }
    };

    const formatInlineText = (line: string): string => {
      return line
        // Bold text **text**
        .replace(/\*\*(.*?)\*\*/g, '<strong class="font-semibold text-white">$1</strong>')
        // Italic text *text*
        .replace(/(?<!\*)\*(?!\*)([^*]+)\*(?!\*)/g, '<em class="italic text-white/80">$1</em>')
        // Inline code `code`
        .replace(/`([^`]+)`/g, '<code class="bg-white/10 text-purple-300 px-1.5 py-0.5 rounded text-sm font-mono">$1</code>')
        // Links [text](url)
        .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer" class="text-blue-400 hover:text-blue-300 underline">$1</a>');
    };

    lines.forEach((line, index) => {
      // Check for headings
      const h1Match = line.match(/^# (.+)$/);
      const h2Match = line.match(/^## (.+)$/);
      const h3Match = line.match(/^### (.+)$/);
      
      // Check for list items
      const ulMatch = line.match(/^[-*•] (.+)$/);
      const olMatch = line.match(/^(\d+)\. (.+)$/);

      if (h1Match) {
        flushList();
        elements.push(
          <h1 key={`h1-${index}`} className="text-2xl font-bold text-white mt-4 mb-2" dangerouslySetInnerHTML={{ __html: formatInlineText(h1Match[1]) }} />
        );
      } else if (h2Match) {
        flushList();
        elements.push(
          <h2 key={`h2-${index}`} className="text-xl font-semibold text-white mt-3 mb-2" dangerouslySetInnerHTML={{ __html: formatInlineText(h2Match[1]) }} />
        );
      } else if (h3Match) {
        flushList();
        elements.push(
          <h3 key={`h3-${index}`} className="text-lg font-medium text-white mt-2 mb-1" dangerouslySetInnerHTML={{ __html: formatInlineText(h3Match[1]) }} />
        );
      } else if (ulMatch) {
        if (listType !== 'ul') {
          flushList();
          listType = 'ul';
        }
        listItems.push(ulMatch[1]);
      } else if (olMatch) {
        if (listType !== 'ol') {
          flushList();
          listType = 'ol';
        }
        listItems.push(olMatch[2]);
      } else if (line.trim() === '') {
        flushList();
        // Add spacing for empty lines
        if (elements.length > 0) {
          elements.push(<div key={`br-${index}`} className="h-2" />);
        }
      } else {
        flushList();
        // Regular paragraph
        elements.push(
          <p key={`p-${index}`} className="text-white/90 leading-relaxed" dangerouslySetInnerHTML={{ __html: formatInlineText(line) }} />
        );
      }
    });

    flushList();
    return elements;
  };

  const parts = parseContent(content);

  return (
    <div className="message-content space-y-2">
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
              }}
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