import React, { useState } from 'react';
import { Copy, Edit, Check } from 'lucide-react';
import MessageRenderer from './MessageRenderer';
import { Button } from './ui/button';
import { toast } from 'sonner';

interface MessageProps {
  content: string;
  type: 'user' | 'ai';
  timestamp: Date;
  onEdit?: (newContent: string) => void;
  imageUrl?: string;
}

const Message: React.FC<MessageProps> = ({ content, type, timestamp, onEdit, imageUrl }) => {
  const [isHovered, setIsHovered] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editedContent, setEditedContent] = useState(content);
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(content);
      setCopied(true);
      toast.success('Message copied to clipboard!');
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      toast.error('Failed to copy message');
    }
  };

  const handleEdit = () => {
    if (isEditing) {
      onEdit?.(editedContent);
      setIsEditing(false);
      toast.success('Message updated!');
    } else {
      setIsEditing(true);
    }
  };

  const handleCancel = () => {
    setEditedContent(content);
    setIsEditing(false);
  };

  return (
    <div
      className={`group relative flex ${type === 'user' ? 'justify-end' : 'justify-start'} mb-4`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div
        className={`relative max-w-[85%] rounded-2xl px-4 py-3 ${
          type === 'user'
            ? 'bg-primary text-primary-foreground'
            : 'bg-muted text-muted-foreground border border-border'
        } ${isEditing ? 'ring-2 ring-primary' : ''}`}
      >
        {isEditing ? (
          <div className="space-y-3">
            <textarea
              value={editedContent}
              onChange={(e) => setEditedContent(e.target.value)}
              className="w-full min-h-[100px] bg-transparent border border-border rounded-lg p-2 text-foreground resize-none focus:outline-none focus:ring-2 focus:ring-primary"
              autoFocus
            />
            <div className="flex gap-2 justify-end">
              <Button
                size="sm"
                variant="outline"
                onClick={handleCancel}
              >
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={handleEdit}
              >
                Save
              </Button>
            </div>
          </div>
        ) : (
          <div>
            <MessageRenderer content={content} />
            {imageUrl && (
              <div className="mt-3">
                <img 
                  src={imageUrl} 
                  alt="AI Generated" 
                  className="max-w-full h-auto rounded-lg border border-border"
                />
              </div>
            )}
          </div>
        )}

        {/* Hover Actions */}
        {(isHovered || isEditing) && !isEditing && (
          <div
            className={`absolute top-2 ${
              type === 'user' ? 'left-2' : 'right-2'
            } flex gap-1 bg-background border border-border rounded-lg shadow-lg p-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-10`}
          >
            <Button
              size="sm"
              variant="ghost"
              onClick={handleCopy}
              className="h-8 w-8 p-0 hover:bg-accent"
              title="Copy message"
            >
              {copied ? (
                <Check className="h-3 w-3 text-green-500" />
              ) : (
                <Copy className="h-3 w-3" />
              )}
            </Button>
            {type === 'user' && (
              <Button
                size="sm"
                variant="ghost"
                onClick={handleEdit}
                className="h-8 w-8 p-0 hover:bg-accent"
                title="Edit message"
              >
                <Edit className="h-3 w-3" />
              </Button>
            )}
          </div>
        )}

        {/* Timestamp */}
        <div
          className={`text-xs opacity-60 mt-2 ${
            type === 'user' ? 'text-left' : 'text-right'
          }`}
        >
          {timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </div>
      </div>
    </div>
  );
};

export default Message;