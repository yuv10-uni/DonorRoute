'use client'

import { Fragment, useEffect, useRef, useState } from 'react'
import { Bot, Send, Trash2, User } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, PageHeader } from '@/components/kit'
import { useStore } from '@/lib/store'
import { SUGGESTIONS, answer } from '@/lib/assistant'
import { cn } from '@/lib/utils'

interface Message {
  id: number
  role: 'user' | 'assistant'
  text: string
}

const STORAGE_KEY = 'donorroute-chat-v1'
const WELCOME: Message = {
  id: 0,
  role: 'assistant',
  text: 'Hi, I am the DonorRoute AI assistant. I analyse your live donor, request and inventory data. How can I help?',
}

function RichText({ text }: { text: string }) {
  return (
    <>
      {text.split('\n').map((line, i) => (
        <Fragment key={i}>
          {i > 0 && <br />}
          {line.split(/(\*\*[^*]+\*\*)/g).map((part, j) =>
            part.startsWith('**') && part.endsWith('**') ? <strong key={j}>{part.slice(2, -2)}</strong> : part,
          )}
        </Fragment>
      ))}
    </>
  )
}

export function AssistantChat() {
  const store = useStore()
  const [messages, setMessages] = useState<Message[]>([WELCOME])
  const [input, setInput] = useState('')
  const [thinking, setThinking] = useState(false)
  const endRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      if (saved) setMessages(JSON.parse(saved))
    } catch {}
  }, [])

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(messages))
    endRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' })
  }, [messages, thinking])

  const send = (text: string) => {
    const q = text.trim()
    if (!q || thinking) return
    setMessages((m) => [...m, { id: Date.now(), role: 'user', text: q }])
    setInput('')
    setThinking(true)
    const data = { donors: store.donors, requests: store.requests, drives: store.drives, donations: store.donations, inventory: store.inventory }
    setTimeout(() => {
      setMessages((m) => [...m, { id: Date.now() + 1, role: 'assistant', text: answer(q, data) }])
      setThinking(false)
    }, 450)
  }

  return (
    <>
      <PageHeader
        title="AI Assistant"
        description="Ask questions about donors, compatibility, stock and requests. Runs locally on your data."
        actions={
          <Button variant="outline" onClick={() => setMessages([WELCOME])}>
            <Trash2 data-icon="inline-start" />
            Clear chat
          </Button>
        }
      />
      <Card className="flex h-[calc(100dvh-14rem)] min-h-[460px] flex-col overflow-hidden lg:h-[calc(100dvh-12rem)]">
        <div className="flex-1 overflow-y-auto p-4 sm:p-6" aria-live="polite">
          <ul className="flex flex-col gap-4">
            {messages.map((m) => (
              <li key={m.id} className={cn('flex gap-3', m.role === 'user' && 'flex-row-reverse')}>
                <span
                  className={cn(
                    'flex size-8 shrink-0 items-center justify-center rounded-full',
                    m.role === 'user' ? 'bg-muted text-foreground' : 'bg-primary text-primary-foreground',
                  )}
                  aria-hidden="true"
                >
                  {m.role === 'user' ? <User className="size-4" /> : <Bot className="size-4" />}
                </span>
                <div
                  className={cn(
                    'max-w-[85%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed sm:max-w-[75%]',
                    m.role === 'user' ? 'bg-primary text-primary-foreground' : 'border bg-background',
                  )}
                >
                  <span className="sr-only">{m.role === 'user' ? 'You: ' : 'Assistant: '}</span>
                  <RichText text={m.text} />
                </div>
              </li>
            ))}
            {thinking && (
              <li className="flex gap-3">
                <span className="flex size-8 items-center justify-center rounded-full bg-primary text-primary-foreground" aria-hidden="true">
                  <Bot className="size-4" />
                </span>
                <div className="flex items-center gap-1 rounded-2xl border bg-background px-4 py-3">
                  <span className="sr-only">Assistant is typing</span>
                  {[0, 150, 300].map((d) => (
                    <span key={d} className="size-1.5 animate-bounce rounded-full bg-muted-foreground" style={{ animationDelay: `${d}ms` }} />
                  ))}
                </div>
              </li>
            )}
          </ul>
          <div ref={endRef} />
        </div>
        <div className="border-t bg-card p-3 sm:p-4">
          <div className="mb-3 flex gap-2 overflow-x-auto pb-1">
            {SUGGESTIONS.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => send(s)}
                className="shrink-0 rounded-full border px-3 py-1 text-xs text-muted-foreground hover:border-primary/40 hover:text-foreground"
              >
                {s}
              </button>
            ))}
          </div>
          <form
            className="flex gap-2"
            onSubmit={(e) => {
              e.preventDefault()
              send(input)
            }}
          >
            <label htmlFor="chat-input" className="sr-only">Message</label>
            <textarea
              id="chat-input"
              rows={1}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  if (e.nativeEvent.isComposing || e.keyCode === 229) return
                  e.preventDefault()
                  send(input)
                }
              }}
              placeholder="Ask e.g. “Find donors for O- in Boston”"
              className="min-h-10 flex-1 resize-none rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/20"
            />
            <Button type="submit" size="icon-lg" disabled={!input.trim() || thinking} className="size-10">
              <Send />
              <span className="sr-only">Send message</span>
            </Button>
          </form>
        </div>
      </Card>
    </>
  )
}
