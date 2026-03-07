import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeSanitize from "rehype-sanitize";

export default function MarkdownRenderer({ content }: { content: string }) {
  return (
    <div className="prose prose-base max-w-none text-ink/80 prose-headings:text-ink prose-strong:text-ink prose-a:text-support prose-img:rounded-3xl prose-img:shadow-md leading-relaxed sm:prose-lg">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeSanitize]}
        components={{
          a: ({ ...props }) => <a {...props} target="_blank" rel="noreferrer noopener" />,
          img: ({ ...props }) => <img {...props} loading="lazy" className="my-8 w-full rounded-3xl border border-ink/5 object-cover shadow-lg" />,
          h2: ({ node, ...props }) => {
            const text = Array.isArray(props.children) ? props.children.join("") : String(props.children);
            if (text.includes("문제, 겪고 계시나요")) {
              return (
                <div className="mt-12 mb-2 rounded-2xl bg-red-50 px-6 py-4 border border-red-100 shadow-sm">
                  <h2 className="!my-0 text-xl font-black text-red-600 sm:text-2xl" {...props} />
                </div>
              );
            }
            if (text.includes("우리의 솔루션")) {
              return (
                <div className="mt-12 mb-2 rounded-2xl bg-blue-50 px-6 py-4 border border-blue-100 shadow-sm">
                  <h2 className="!my-0 text-xl font-black text-blue-600 sm:text-2xl" {...props} />
                </div>
              );
            }
            if (text.includes("핵심 기능")) {
              return (
                <div className="mt-12 mb-2 rounded-2xl bg-emerald-50 px-6 py-4 border border-emerald-100 shadow-sm">
                  <h2 className="!my-0 text-xl font-black text-emerald-600 sm:text-2xl" {...props} />
                </div>
              );
            }
            return <h2 className="mt-12 mb-6 text-2xl font-black text-ink sm:text-3xl" {...props} />;
          }
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
