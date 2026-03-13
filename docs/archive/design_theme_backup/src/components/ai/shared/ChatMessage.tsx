import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { motion } from 'framer-motion';

interface ChatMessageProps {
    role: 'user' | 'assistant';
    content: string;
    timestamp: Date;
}

export function ChatMessage({ role, content, timestamp }: ChatMessageProps) {
    const isUser = role === 'user';

    return (
        <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            className={`flex flex-col ${isUser ? 'items-end' : 'items-start'} mb-4 px-4`}
        >
            <div
                className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm shadow-sm ${isUser
                    ? 'bg-primary text-white rounded-tr-none'
                    : 'bg-white border border-slate-200 text-slate-700 rounded-tl-none'
                    }`}
            >
                <div className="prose prose-sm max-w-none">
                    <ReactMarkdown
                        remarkPlugins={[remarkGfm]}
                        components={{
                            p: ({ node, ...props }) => <p className="mb-2 last:mb-0 leading-relaxed" {...props} />,
                            ul: ({ node, ...props }) => <ul className="list-disc pl-4 mb-2" {...props} />,
                            ol: ({ node, ...props }) => <ol className="list-decimal pl-4 mb-2" {...props} />,
                            li: ({ node, ...props }) => <li className="mb-1" {...props} />,
                            strong: ({ node, ...props }) => <strong className="font-bold" {...props} />,
                            table: ({ node, ...props }) => <div className="overflow-x-auto my-2"><table className="border-collapse border border-slate-200 w-full" {...props} /></div>,
                            th: ({ node, ...props }) => <th className="border border-slate-200 p-2 bg-slate-50 font-bold text-xs" {...props} />,
                            td: ({ node, ...props }) => <td className="border border-slate-200 p-2 text-xs" {...props} />,
                        }}
                    >
                        {content}
                    </ReactMarkdown>
                </div>
            </div>
            <span className="text-[10px] text-slate-400 mt-1 font-medium">
                {timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
        </motion.div>
    );
}
