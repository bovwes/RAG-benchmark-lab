import Image from 'next/image';
import ReactMarkdown from 'react-markdown';

const mdComponents: React.ComponentProps<typeof ReactMarkdown>['components'] = {
  p: ({ children }) => (
    <p className="mb-3 last:mb-0 leading-relaxed">{children}</p>
  ),
  h1: ({ children }) => (
    <h1 className="text-base font-bold mb-2 mt-4 first:mt-0">{children}</h1>
  ),
  h2: ({ children }) => (
    <h2 className="text-sm font-bold mb-2 mt-4 first:mt-0">{children}</h2>
  ),
  h3: ({ children }) => (
    <h3 className="text-sm font-semibold mb-1 mt-3 first:mt-0">{children}</h3>
  ),
  ul: ({ children }) => (
    <ul className="list-disc pl-5 mb-3 space-y-1">{children}</ul>
  ),
  ol: ({ children }) => (
    <ol className="list-decimal pl-5 mb-3 space-y-1">{children}</ol>
  ),
  li: ({ children }) => <li className="leading-relaxed">{children}</li>,
  code: ({ children, className }) =>
    className ? (
      <code className="block bg-neutral-200/50 rounded px-3 py-2 text-xs font-mono overflow-x-auto mb-3">
        {children}
      </code>
    ) : (
      <code className="bg-neutral-200/50  rounded px-1 py-0.5 text-xs font-mono">
        {children}
      </code>
    ),
  pre: ({ children }) => <pre className="mb-3">{children}</pre>,
  strong: ({ children }) => (
    <strong className="font-semibold">{children}</strong>
  ),
  blockquote: ({ children }) => (
    <blockquote className="border-l-2 border-neutral-300 pl-3 text-neutral-600 mb-3">
      {children}
    </blockquote>
  ),
};

interface ChatExchangeProps {
  query: string;
  answer: string;
  loading?: boolean;
  retrieval_query?: string;
}

export default function ChatExchange({
  query,
  answer,
  loading,
}: ChatExchangeProps) {
  return (
    <div className="text-sm leading-relaxed gap-2 flex flex-col w-full">
      <div className="w-full flex justify-end">
        <div className="max-w-sm text-wrap">
          <div className="flex items-center gap-3 mb-2 w-fit ml-auto">
            <Image
              src="/images/user.svg"
              height={34}
              width={34}
              alt="User query"
            />
            <p className="font-bold">User</p>
          </div>
          <div className="bg-neutral-200/50 py-2 px-3 text-wrap">
            <p>{query}</p>
          </div>
        </div>
      </div>
      <div className="w-full">
        <div className="flex items-center gap-3 w-fit mb-2">
          <Image
            src="/images/agent.svg"
            height={34}
            width={34}
            alt="Agent response"
          />
          <p className="font-bold">Assistant</p>
        </div>
        {loading ? (
          <div className="flex items-center gap-2 text-neutral-400 text-sm">
            Thinking…
          </div>
        ) : (
          <div className="max-w-2xl">
            <ReactMarkdown components={mdComponents}>{answer}</ReactMarkdown>
          </div>
        )}
      </div>
    </div>
  );
}
