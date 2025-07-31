import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import type { Components } from 'react-markdown';
import './MessageContent.css';

interface MessageContentProps {
  content: string;
  isStreaming?: boolean;
}

const MessageContent: React.FC<MessageContentProps> = ({ content, isStreaming = false }) => {
  const components: Components = {
    // Code blocks with syntax highlighting
    code({ node, className, children, ...props }) {
      const match = /language-(\w+)/.exec(className || '');
      const language = match ? match[1] : '';
      const inline = node?.position ? node.position.start.line === node.position.end.line : false;

      if (!inline && language) {
        return (
          <div className="code-block-wrapper">
            <div className="code-block-header">
              <span className="code-language">{language}</span>
              <button
                className="copy-button"
                onClick={() => {
                  navigator.clipboard.writeText(String(children).replace(/\n$/, ''));
                }}
              >
                Copy
              </button>
            </div>
            <SyntaxHighlighter style={vscDarkPlus as any} language={language} PreTag="div">
              {String(children).replace(/\n$/, '')}
            </SyntaxHighlighter>
          </div>
        );
      }

      // Inline code
      return (
        <code className="inline-code" {...props}>
          {children}
        </code>
      );
    },

    // Tables with better styling
    table({ children }) {
      return (
        <div className="table-wrapper">
          <table>{children}</table>
        </div>
      );
    },

    // Links that open in new tab
    a({ href, children }) {
      return (
        <a href={href} target="_blank" rel="noopener noreferrer">
          {children}
        </a>
      );
    },

    // Blockquotes with better styling
    blockquote({ children }) {
      return <blockquote className="styled-blockquote">{children}</blockquote>;
    },

    // Lists with better spacing
    ul({ children }) {
      return <ul className="styled-list">{children}</ul>;
    },

    ol({ children }) {
      return <ol className="styled-list">{children}</ol>;
    },
  };

  return (
    <div className={`message-content ${isStreaming ? 'streaming' : ''}`}>
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>
        {content}
      </ReactMarkdown>
    </div>
  );
};

export default React.memo(MessageContent);
