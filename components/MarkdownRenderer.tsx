import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeSanitize from "rehype-sanitize";

export default function MarkdownRenderer({ content }: { content: string }) {
  return (
    <div className="prose prose-sm max-w-none prose-headings:text-ink prose-p:text-ink/85 prose-li:text-ink/85 prose-strong:text-ink prose-a:text-support prose-img:rounded-xl prose-img:shadow-sm">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeSanitize]}
        components={{
          a: ({ ...props }) => <a {...props} target="_blank" rel="noreferrer noopener" />,
          img: ({ ...props }) => <img {...props} loading="lazy" className="my-3 w-full rounded-xl border border-ink/10 object-cover" />
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
