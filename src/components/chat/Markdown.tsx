import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark } from "react-syntax-highlighter/dist/esm/styles/prism";
import { memo } from "react";

interface Props {
  content: string;
  className?: string;
}

function MarkdownInner({ content, className }: Props) {
  return (
    <div className={`md-body ${className ?? ""}`}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          code({ inline, className, children, ...props }: any) {
            const match = /language-(\w+)/.exec(className || "");
            const text = String(children).replace(/\n$/, "");
            if (!inline && match) {
              return (
                <SyntaxHighlighter
                  language={match[1]}
                  style={oneDark}
                  PreTag="div"
                  customStyle={{
                    margin: 0,
                    borderRadius: "0.5rem",
                    fontSize: "13px",
                    background: "hsl(var(--code-bg))",
                  }}
                >
                  {text}
                </SyntaxHighlighter>
              );
            }
            return (
              <code className={className} {...props}>
                {children}
              </code>
            );
          },
          a({ children, ...props }) {
            return (
              <a {...props} target="_blank" rel="noreferrer noopener">
                {children}
              </a>
            );
          },
          table({ children }) {
            return (
              <div className="overflow-x-auto">
                <table>{children}</table>
              </div>
            );
          },
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}

export const Markdown = memo(MarkdownInner);
