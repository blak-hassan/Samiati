"use client";

import { Check, Copy } from "lucide-react";
import * as React from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

import { cn } from "@/lib/utils";

interface CodeBlockProps {
  children: React.ReactNode;
  className?: string;
  language?: string;
}

function CodeBlock({ children, className, language }: CodeBlockProps) {
  const [copied, setCopied] = React.useState(false);
  const raw = React.useMemo(() => {
    if (typeof children === "string") return children;
    if (Array.isArray(children)) return children.join("");
    return "";
  }, [children]);

  const copy = React.useCallback(async () => {
    try {
      await navigator.clipboard.writeText(raw);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      // Clipboard access can be denied; the button simply does not confirm.
    }
  }, [raw]);

  return (
    <div className="group/code relative my-3 overflow-hidden rounded-lg border bg-muted/40">
      <div className="flex items-center justify-between border-b bg-muted/60 px-3 py-1.5">
        <span className="font-mono text-[11px] uppercase tracking-wide text-muted-foreground">
          {language ?? "code"}
        </span>
        <button
          type="button"
          onClick={copy}
          className="inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-xs text-muted-foreground transition-colors hover:bg-background hover:text-foreground"
          aria-label={copied ? "Copied" : "Copy code"}
        >
          {copied ? (
            <Check className="h-3.5 w-3.5" aria-hidden />
          ) : (
            <Copy className="h-3.5 w-3.5" aria-hidden />
          )}
          {copied ? "Copied" : "Copy"}
        </button>
      </div>
      <pre className={cn("overflow-x-auto p-3 text-sm", className)}>
        <code className="font-mono">{children}</code>
      </pre>
    </div>
  );
}

export interface MarkdownProps {
  content: string;
  className?: string;
}

/**
 * Renders assistant output.
 *
 * Raw HTML is intentionally not enabled: Samiati renders model output from
 * untrusted providers and `rehype-raw` would let a model inject markup into
 * the page.
 */
export function Markdown({ content, className }: MarkdownProps) {
  return (
    <div
      className={cn(
        "prose prose-sm max-w-none dark:prose-invert prose-headings:font-display prose-headings:tracking-tight prose-p:leading-relaxed prose-pre:bg-transparent prose-pre:p-0 prose-code:before:content-none prose-code:after:content-none",
        className,
      )}
    >
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          code({ className: codeClassName, children, ...props }) {
            const match = /language-(\w+)/.exec(codeClassName ?? "");
            const isBlock = Boolean(match) || (codeClassName ?? "").includes("language-");
            if (!isBlock) {
              return (
                <code className={cn("rounded bg-muted px-1.5 py-0.5 font-mono text-[0.85em]", codeClassName)} {...props}>
                  {children}
                </code>
              );
            }
            return (
              <CodeBlock language={match?.[1]} className={codeClassName}>
                {children}
              </CodeBlock>
            );
          },
          a({ children, href, ...props }) {
            return (
              <a
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium underline underline-offset-4 decoration-bronze-500/60 hover:decoration-bronze-500"
                {...props}
              >
                {children}
              </a>
            );
          },
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
