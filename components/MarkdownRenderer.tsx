import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeSanitize from "rehype-sanitize";

export default function MarkdownRenderer({ content }: { content: string }) {
  return (
    <div className="prose prose-base max-w-none leading-relaxed font-medium">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeSanitize]}
        components={{
          a: ({ ...props }) => <a {...props} target="_blank" rel="noreferrer noopener" className="text-blue-600 font-semibold underline hover:text-blue-700 transition-colors" />,
          img: ({ ...props }) => <img {...props} loading="lazy" className="my-8 w-full rounded-3xl border-2 border-slate-200 object-cover shadow-xl" />,

          hr: () => <hr className="my-12 border-t-2 border-slate-300 w-2/3 mx-auto" />,

          h1: ({ node, ...props }) => (
            <h1 className="mt-8 mb-4 text-4xl sm:text-5xl font-black tracking-tight text-slate-900 leading-tight" {...props} />
          ),

          blockquote: ({ node, ...props }) => (
            <blockquote className="my-8 text-center text-lg sm:text-xl font-semibold italic text-slate-700 border-l-4 border-blue-500 bg-blue-50 py-6 px-6 rounded-lg not-italic" {...props} />
          ),

          h2: ({ node, ...props }) => {
            const text = Array.isArray(props.children) ? props.children.join("") : String(props.children);

            // Pain Points Style
            if (text.includes("Pain Points") || text.includes("이런 문제") || text.includes("🚨")) {
              return (
                <div className="mt-16 mb-10 pt-8">
                  <div className="flex items-center gap-3 mb-8">
                    <span className="text-4xl">⚠️</span>
                    <h2 className="!my-0 text-3xl sm:text-4xl font-black text-red-700" {...props} />
                  </div>
                </div>
              );
            }

            // Solution Style
            if (text.includes("Solution") || text.includes("솔루션") || text.includes("핵심") || text.includes("💡")) {
              return (
                <div className="mt-16 mb-10 pt-8">
                  <div className="flex items-center gap-3 mb-8">
                    <span className="text-4xl">✨</span>
                    <h2 className="!my-0 text-3xl sm:text-4xl font-black text-emerald-700" {...props} />
                  </div>
                </div>
              );
            }

            // How It Works Style
            if (text.includes("How it Works") || text.includes("작동") || text.includes("⚙️")) {
              return (
                <div className="mt-16 mb-10 pt-8">
                  <div className="flex items-center gap-3 mb-8">
                    <span className="text-4xl">🔧</span>
                    <h2 className="!my-0 text-3xl sm:text-4xl font-black text-orange-700" {...props} />
                  </div>
                </div>
              );
            }

            // Before & After Style
            if (text.includes("Before") || text.includes("기존") || text.includes("비교") || text.includes("🔄")) {
              return (
                <div className="mt-16 mb-10 pt-8">
                  <div className="flex items-center gap-3 mb-8">
                    <span className="text-4xl">🔄</span>
                    <h2 className="!my-0 text-3xl sm:text-4xl font-black text-indigo-700" {...props} />
                  </div>
                </div>
              );
            }

            // Social Proof Style
            if (text.includes("Social Proof") || text.includes("후기") || text.includes("💬")) {
              return (
                <div className="mt-16 mb-10 pt-8">
                  <div className="flex items-center gap-3 mb-8">
                    <span className="text-4xl">💬</span>
                    <h2 className="!my-0 text-3xl sm:text-4xl font-black text-rose-700" {...props} />
                  </div>
                </div>
              );
            }

            return (
              <div className="mt-12 mb-8 pt-6 border-l-4 border-slate-300 pl-6">
                <h2 className="!my-0 text-3xl sm:text-4xl font-black text-slate-800" {...props} />
              </div>
            );
          },

          ul: ({ node, ...props }) => {
            return <ul className="list-none pl-0 space-y-3 my-8" {...props} />;
          },

          ol: ({ node, ...props }) => {
            return <ol className="list-none pl-0 space-y-3 my-8 counter-reset:list-counter" {...props} />;
          },

          li: ({ node, ...props }) => {
            const text = Array.isArray(props.children) ? props.children.join("") : String(props.children);

            // Pain point style
            if (text.match(/^😭|^🥵|^😡|^🚫|^❌/)) {
              return (
                <li className="relative pl-8 before:content-[''] before:absolute before:left-0 before:top-1 before:w-6 before:h-6 before:rounded-full before:bg-red-100 bg-gradient-to-r from-red-50 to-white py-5 px-6 rounded-2xl border-l-4 border-red-500 shadow-sm hover:shadow-md transition-shadow">
                  <span className="text-slate-800 text-base leading-relaxed font-semibold">{props.children}</span>
                </li>
              );
            }

            // Solution style
            if (text.match(/^✅|^✓|^💚|^🎉/)) {
              return (
                <li className="relative pl-8 before:content-[''] before:absolute before:left-0 before:top-1 before:w-6 before:h-6 before:rounded-full before:bg-emerald-100 bg-gradient-to-r from-emerald-50 to-white py-5 px-6 rounded-2xl border-l-4 border-emerald-500 shadow-sm hover:shadow-md transition-shadow">
                  <span className="text-slate-800 text-base leading-relaxed font-semibold">{props.children}</span>
                </li>
              );
            }

            // Default card style
            return (
              <li className="relative pl-8 before:content-['▸'] before:absolute before:left-1 before:top-1.5 before:text-2xl before:text-blue-500 bg-gradient-to-r from-blue-50 to-white py-4 px-6 rounded-xl border border-blue-200 shadow-sm hover:shadow-md transition-shadow">
                <span className="text-slate-800 text-base leading-relaxed">{props.children}</span>
              </li>
            );
          },

          p: ({ node, ...props }) => {
            const text = Array.isArray(props.children) ? props.children.join("") : String(props.children);

            // Social Proof blockquote style fallback
            if (text.startsWith("진짜") || text.includes("최고에요") || text.includes("좋았어요") || text.startsWith("\"") || text.startsWith("“")) {
              return <p className="bg-white border text-center border-ink/10 rounded-2xl p-6 italic text-ink/70 shadow-sm" {...props} />
            }

            // Before style
            if (text.includes("기존:") || text.includes("기존 방식:") || text.includes("❌")) {
              return (
                <div className="my-6 p-6 bg-gradient-to-r from-red-50 to-red-100/50 border-2 border-red-300 rounded-2xl shadow-md">
                  <p className="text-red-900 font-semibold text-lg m-0" {...props} />
                </div>
              );
            }
            
            // After style
            if (text.includes("우리 서비스:") || text.includes("해결:") || text.includes("✅") || text.includes("✓")) {
              return (
                <div className="my-6 p-6 bg-gradient-to-r from-emerald-50 to-emerald-100/50 border-2 border-emerald-300 rounded-2xl shadow-md">
                  <p className="text-emerald-900 font-semibold text-lg m-0" {...props} />
                </div>
              );
            }

            // Testimonial/Social proof style
            if (text.startsWith("\"") || text.startsWith("\"") || text.startsWith("'") || text.includes("최고") || text.includes("좋았") || text.includes("추천")) {
              return (
                <div className="my-6 p-6 bg-gradient-to-r from-rose-50 to-pink-50 border-2 border-rose-300 rounded-2xl italic text-slate-700 font-semibold shadow-md">
                  <p className="m-0" {...props} />
                </div>
              );
            }

            return <p className="my-5 leading-relaxed" {...props} />
          }
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
