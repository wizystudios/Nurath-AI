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
      <div className={`relative max-w-[85%] py-2 text-white ${isEditing ? 'ring-1 ring-white/20 rounded-lg px-3' : ''}`}>
        {isEditing ? (
          <div className="space-y-3">
            <textarea
              value={editedContent}
              onChange={(e) => setEditedContent(e.target.value)}
              className="w-full min-h-[100px] bg-transparent border border-white/10 rounded-lg p-2 text-white resize-none focus:outline-none focus:border-white/30"
              autoFocus
            />
            <div className="flex gap-2 justify-end">
              <Button
                size="sm"
                variant="ghost"
                onClick={handleCancel}
                className="text-white/60 hover:text-white hover:bg-white/10"
              >
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={handleEdit}
                className="bg-white text-black hover:bg-white/90"
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
                  className="max-w-full h-auto rounded-lg"
                />
              </div>
            )}
          </div>
        )}

        {/* Hover Actions */}
        {isHovered && !isEditing && (
          <div
            className={`absolute ${
              type === 'user' ? '-bottom-6 right-0' : '-bottom-6 left-0'
            } flex gap-1 bg-black/80 rounded-lg p-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-10`}
          >
            <Button
              size="sm"
              variant="ghost"
              onClick={handleCopy}
              className="h-6 w-6 p-0 hover:bg-white/10 text-white/60 hover:text-white"
              title="Copy message"
            >
              {copied ? (
                <Check className="h-3 w-3 text-green-400" />
              ) : (
                <Copy className="h-3 w-3" />
              )}
            </Button>
            {type === 'user' && (
              <Button
                size="sm"
                variant="ghost"
                onClick={handleEdit}
                className="h-6 w-6 p-0 hover:bg-white/10 text-white/60 hover:text-white"
                title="Edit message"
              >
                <Edit className="h-3 w-3" />
              </Button>
            )}
          </div>
        )}

        {/* Timestamp */}
        <div className={`text-xs text-white/30 mt-1 ${type === 'user' ? 'text-right' : 'text-left'}`}>
          {timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </div>
      </div>
    </div>
  );
};

export default Message;