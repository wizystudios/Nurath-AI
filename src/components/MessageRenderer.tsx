import React from 'react';
import CodeBlock from './CodeBlock';

interface MessageRendererProps {
  content: string;
}

const MessageRenderer: React.FC<MessageRendererProps> = ({ content }) => {
  const parseContent = (text: string) => {
    const parts: Array<{ type: string; content: string; language?: string; key: string }> = [];
    let currentIndex = 0;
    const codeBlockRegex = /```(\w+)?\n([\s\S]*?)```/g;
    let match;
    
    while ((match = codeBlockRegex.exec(text)) !== null) {
      const [fullMatch, language, code] = match;
      if (match.index > currentIndex) {
        const textBefore = text.slice(currentIndex, match.index);
        if (textBefore.trim()) {
          parts.push({ type: 'text', content: textBefore, key: `text-${currentIndex}` });
        }
      }
      parts.push({ type: 'code', content: code.trim(), language: language || 'text', key: `code-${match.index}` });
      currentIndex = match.index + fullMatch.length;
    }
    
    if (currentIndex < text.length) {
      const remainingText = text.slice(currentIndex);
      if (remainingText.trim()) {
        parts.push({ type: 'text', content: remainingText, key: `text-${currentIndex}` });
      }
    }
    
    if (parts.length === 0) {
      parts.push({ type: 'text', content: text, key: 'text-0' });
    }
    
    return parts;
  };

  const formatText = (text: string) => {
    const lines = text.split('\n');
    const elements: React.ReactNode[] = [];
    let listItems: string[] = [];
    let listType: 'ul' | 'ol' | null = null;

    const flushList = () => {
      if (listItems.length > 0 && listType) {
        const ListTag = listType;
        elements.push(
          <ListTag key={`list-${elements.length}`} className={`${listType === 'ul' ? 'list-disc' : 'list-decimal'} list-inside space-y-1 my-2 text-foreground/90`}>
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
        .replace(/\*\*(.*?)\*\*/g, '<strong class="font-semibold text-foreground">$1</strong>')
        .replace(/(?<!\*)\*(?!\*)([^*]+)\*(?!\*)/g, '<em class="italic text-foreground/80">$1</em>')
        .replace(/`([^`]+)`/g, '<code class="bg-muted text-primary px-1.5 py-0.5 rounded text-sm font-mono">$1</code>')
        .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer" class="text-primary hover:text-primary/80 underline">$1</a>');
    };

    lines.forEach((line, index) => {
      const h1Match = line.match(/^# (.+)$/);
      const h2Match = line.match(/^## (.+)$/);
      const h3Match = line.match(/^### (.+)$/);
      const ulMatch = line.match(/^[-*•] (.+)$/);
      const olMatch = line.match(/^(\d+)\. (.+)$/);

      if (h1Match) {
        flushList();
        elements.push(<h1 key={`h1-${index}`} className="text-2xl font-bold text-foreground mt-4 mb-2" dangerouslySetInnerHTML={{ __html: formatInlineText(h1Match[1]) }} />);
      } else if (h2Match) {
        flushList();
        elements.push(<h2 key={`h2-${index}`} className="text-xl font-semibold text-foreground mt-3 mb-2" dangerouslySetInnerHTML={{ __html: formatInlineText(h2Match[1]) }} />);
      } else if (h3Match) {
        flushList();
        elements.push(<h3 key={`h3-${index}`} className="text-lg font-medium text-foreground mt-2 mb-1" dangerouslySetInnerHTML={{ __html: formatInlineText(h3Match[1]) }} />);
      } else if (ulMatch) {
        if (listType !== 'ul') { flushList(); listType = 'ul'; }
        listItems.push(ulMatch[1]);
      } else if (olMatch) {
        if (listType !== 'ol') { flushList(); listType = 'ol'; }
        listItems.push(olMatch[2]);
      } else if (line.trim() === '') {
        flushList();
        if (elements.length > 0) elements.push(<div key={`br-${index}`} className="h-2" />);
      } else {
        flushList();
        elements.push(<p key={`p-${index}`} className="text-foreground/90 leading-relaxed" dangerouslySetInnerHTML={{ __html: formatInlineText(line) }} />);
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
              onEdit={(newCode) => console.log('Code edited:', newCode)}
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
