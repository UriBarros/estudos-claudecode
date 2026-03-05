"use client";

import { Message } from "ai";
import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";
import { MarkdownRenderer } from "./MarkdownRenderer";

interface MessageListProps {
  messages: Message[];
  isLoading?: boolean;
}

function ClaudeIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
      <path d="M4.709 15.955l4.72-2.647.08-.23-.08-.128H9.2l-.79-.048-2.698-.073-2.339-.097-1.pfizer-.097C2.056 12.572 2 12.492 2 12.4c0-.096.064-.168.173-.18l.403-.048 2.484-.097 2.645-.072 1.254-.048.823-.048c.217 0 .322-.12.322-.312 0-.168-.105-.288-.322-.288l-.823-.048-1.254-.048-2.645-.072-2.484-.097-.403-.048C2.064 11.14 2 11.068 2 10.972c0-.096.056-.168.373-.264l.266-.097 2.339-.097 2.698-.073.79-.048h.229l.08-.128-.08-.23-4.72-2.647c-.277-.156-.373-.396-.277-.624.096-.228.373-.324.65-.228l.928.444 2.147 1.032 1.61.768.677.312.153.072c.097.048.193.024.25-.048l.04-.12v-.12l-.14-.684-.387-1.752-.484-2.22-.29-1.296c-.024-.108-.04-.204-.04-.3 0-.276.193-.468.46-.468.254 0 .435.18.5.444l.387 1.728.484 2.22.29 1.368.137.636c.056.276.233.396.46.324l.13-.084.08-.156.29-1.368.484-2.22.387-1.728c.064-.264.25-.444.5-.444.266 0 .46.192.46.468 0 .096-.016.192-.04.3l-.29 1.296-.484 2.22-.387 1.752-.14.684v.12l.04.12c.056.072.153.096.25.048l.153-.072.677-.312 1.61-.768 2.147-1.032.928-.444c.277-.096.554 0 .65.228.096.228 0 .468-.277.624l-4.72 2.647-.08.23.08.128h.229l.79.048 2.698.073 2.339.097 2.484.097.403.048c.11.012.173.084.173.18 0 .092-.064.172-.373.264l-.266.097-2.339.097-2.698.073-.79.048h-.229l-.08.128.08.23 4.72 2.647c.277.156.373.396.277.624-.096.228-.373.324-.65.228l-.928-.444-2.147-1.032-1.61-.768-.677-.312-.153-.072c-.097-.048-.193-.024-.25.048l-.04.12v.12l.14.684.387 1.752.484 2.22.29 1.296c.024.108.04.204.04.3 0 .276-.193.468-.46.468-.254 0-.435-.18-.5-.444l-.387-1.728-.484-2.22-.29-1.368-.137-.636c-.056-.276-.233-.396-.46-.324l-.13.084-.08.156-.29 1.368-.484 2.22-.387 1.728c-.064.264-.25.444-.5.444-.266 0-.46-.192-.46-.468 0-.096.016-.192.04-.3l.29-1.296.484-2.22.387-1.752.14-.684v-.12l-.04-.12c-.056-.072-.153-.096-.25-.048l-.153.072-.677.312-1.61.768-2.147 1.032-.928.444c-.277.096-.554 0-.65-.228-.096-.228 0-.468.277-.624z" />
    </svg>
  );
}

export function MessageList({ messages, isLoading }: MessageListProps) {
  return (
    <div className="flex flex-col h-full overflow-y-auto">
      <div className="max-w-3xl mx-auto w-full px-4 py-8 space-y-8">
        {messages.map((message) => (
          <div
            key={message.id || message.content}
            className={cn(
              "flex gap-3",
              message.role === "user" ? "justify-end" : "justify-start"
            )}
          >
            {message.role === "assistant" && (
              <div className="flex-shrink-0 mt-0.5">
                <div className="w-7 h-7 rounded-full bg-[#D97757] flex items-center justify-center text-white">
                  <ClaudeIcon />
                </div>
              </div>
            )}

            <div className={cn(
              "flex flex-col gap-1",
              message.role === "user" ? "items-end max-w-[80%]" : "items-start max-w-[85%]"
            )}>
              <div className={cn(
                message.role === "user"
                  ? "bg-[#F4F4F4] text-neutral-900 rounded-3xl px-4 py-2.5"
                  : "text-neutral-900"
              )}>
                <div className="text-sm leading-relaxed">
                  {message.parts ? (
                    <>
                      {message.parts.map((part, partIndex) => {
                        switch (part.type) {
                          case "text":
                            return message.role === "user" ? (
                              <span key={partIndex} className="whitespace-pre-wrap">{part.text}</span>
                            ) : (
                              <MarkdownRenderer
                                key={partIndex}
                                content={part.text}
                                className="prose-sm"
                              />
                            );
                          case "reasoning":
                            return (
                              <div key={partIndex} className="mt-3 p-3 bg-neutral-50 rounded-lg border border-neutral-200">
                                <span className="text-xs font-medium text-neutral-500 block mb-1">Thinking</span>
                                <span className="text-sm text-neutral-600 italic">{part.reasoning}</span>
                              </div>
                            );
                          case "tool-invocation":
                            const tool = part.toolInvocation;
                            return (
                              <div key={partIndex} className="inline-flex items-center gap-2 mt-2 px-3 py-1.5 bg-neutral-100 rounded-full text-xs font-mono text-neutral-600">
                                {tool.state === "result" && tool.result ? (
                                  <>
                                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div>
                                    <span>{tool.toolName}</span>
                                  </>
                                ) : (
                                  <>
                                    <Loader2 className="w-3 h-3 animate-spin text-[#D97757]" />
                                    <span>{tool.toolName}</span>
                                  </>
                                )}
                              </div>
                            );
                          case "source":
                            return (
                              <div key={partIndex} className="mt-2 text-xs text-neutral-400">
                                Source: {JSON.stringify(part.source)}
                              </div>
                            );
                          case "step-start":
                            return partIndex > 0 ? <hr key={partIndex} className="my-4 border-neutral-100" /> : null;
                          default:
                            return null;
                        }
                      })}
                      {isLoading &&
                        message.role === "assistant" &&
                        messages.indexOf(message) === messages.length - 1 && (
                          <span className="inline-block w-2 h-4 bg-neutral-400 animate-pulse rounded-sm ml-0.5" />
                        )}
                    </>
                  ) : message.content ? (
                    message.role === "user" ? (
                      <span className="whitespace-pre-wrap">{message.content}</span>
                    ) : (
                      <MarkdownRenderer content={message.content} className="prose-sm" />
                    )
                  ) : isLoading &&
                    message.role === "assistant" &&
                    messages.indexOf(message) === messages.length - 1 ? (
                    <span className="inline-block w-2 h-4 bg-neutral-400 animate-pulse rounded-sm" />
                  ) : null}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}