"use client";

import React, { useState, useRef, useEffect } from 'react';
import { Send, Sparkles, Code, Bot } from 'lucide-react';
import { generateChatResponse } from '@/actions/chatAction';
import CodeVisualExplainer from '@/components/ai-assistant/CodeVisualExplainer';
import { useAuth } from '@/context/AuthContext';
import { logActivity } from '@/lib/activity';

interface Message {
  id: string;
  sender: "user" | "ai";
  text: string;
  messageType?: "text" | "visual_explainer";
  explainerData?: any;
}

export default function ClassroomPage() {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([
    { 
      id: "1", 
      sender: "ai", 
      text: "Welcome to the CareerCraft Classroom! Paste any code snippet here, and I'll break it down step-by-step for you.",
      messageType: "text"
    }
  ]);
  const [inputText, setInputText] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const containsCode = (text: string) => {
    const codeIndicators = ["```", "{", "}", ";", "int ", "float ", "def ", "function ", "class ", "return ", "import ", "include ", "public ", "private ", "void ", "var ", "const ", "let ", "for(", "for ", "while(", "while ", "cout", "printf", "scanf", "print("];
    if (text.includes("```")) return true;
    const symbolMatches = text.match(/[{};]/g);
    if (symbolMatches && symbolMatches.length >= 2) return true;
    return codeIndicators.some(indicator => text.includes(indicator));
  };

  const handleSend = async () => {
    if (!inputText.trim()) return;

    const newMsg: Message = { id: Date.now().toString(), sender: "user", text: inputText, messageType: "text" };
    setMessages(prev => [...prev, newMsg]);
    const currentInput = inputText;
    setInputText("");
    setIsTyping(true);

    if (user) {
      logActivity(user.uid, "aiChatMessages");
    }

    try {
      if (containsCode(currentInput)) {
        const responseText = await generateChatResponse(currentInput, true);
        const parsedJSON = JSON.parse(responseText);
        
        setMessages(prev => [...prev, {
          id: (Date.now() + 1).toString(),
          sender: "ai",
          text: parsedJSON.summary,
          messageType: "visual_explainer",
          explainerData: parsedJSON
        }]);
      } else {
        const aiResponse = await generateChatResponse(currentInput, false);
        setMessages(prev => [...prev, {
          id: (Date.now() + 1).toString(),
          sender: "ai",
          text: aiResponse,
          messageType: "text"
        }]);
      }
    } catch (error) {
      console.error("Chat error:", error);
      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        sender: "ai",
        text: "Sorry, I am having trouble processing that code right now. Please try again.",
        messageType: "text"
      }]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)] bg-background border border-muted rounded-2xl shadow-sm overflow-hidden">
      {/* Header */}
      <div className="bg-foreground text-background px-6 py-4 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-background/20 flex items-center justify-center">
            <Code className="w-5 h-5" />
          </div>
          <div>
            <h1 className="font-bold text-lg">Interactive Code Classroom</h1>
            <p className="text-xs opacity-80">AI-powered visual step-by-step code explanations</p>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-muted/5">
        {messages.map(msg => (
          <div key={msg.id} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
            {msg.sender === 'ai' && (
              <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center mr-3 mt-1 shrink-0">
                <Bot className="w-4 h-4" />
              </div>
            )}
            
            {msg.messageType === 'visual_explainer' && msg.explainerData ? (
              <div className="w-full max-w-4xl">
                <CodeVisualExplainer data={msg.explainerData} />
              </div>
            ) : (
              <div className={`max-w-[80%] rounded-2xl px-5 py-3 text-sm leading-relaxed ${
                msg.sender === 'user' 
                  ? 'bg-foreground text-background rounded-tr-sm' 
                  : 'bg-background border border-muted shadow-sm rounded-tl-sm'
              }`}>
                {msg.text}
              </div>
            )}
          </div>
        ))}
        {isTyping && (
          <div className="flex justify-start items-center">
            <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center mr-3 shrink-0">
              <Bot className="w-4 h-4" />
            </div>
            <div className="bg-background border border-muted shadow-sm rounded-2xl rounded-tl-sm px-4 py-3 flex gap-1.5 items-center">
              <div className="w-2 h-2 bg-muted-foreground/50 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
              <div className="w-2 h-2 bg-muted-foreground/50 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
              <div className="w-2 h-2 bg-muted-foreground/50 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-4 bg-background border-t border-muted shrink-0 flex gap-3 items-end">
        <textarea
          value={inputText}
          onChange={e => setInputText(e.target.value)}
          onKeyDown={e => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              handleSend();
            }
          }}
          placeholder="Paste some code or ask a programming question..."
          className="flex-1 max-h-48 min-h-[52px] bg-muted/50 border border-muted rounded-xl px-4 py-3.5 text-sm focus:outline-none focus:border-primary/50 resize-none transition-colors"
          rows={1}
        />
        <button 
          onClick={handleSend}
          disabled={!inputText.trim() || isTyping}
          className="w-[52px] h-[52px] bg-primary text-primary-foreground rounded-xl flex items-center justify-center shrink-0 hover:bg-primary/90 transition-colors duration-150 ease-out transition-colors disabled:opacity-50 shadow-sm"
        >
          <Send className="w-5 h-5 ml-1" />
        </button>
      </div>
    </div>
  );
}
