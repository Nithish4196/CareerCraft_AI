"use client";

import React, { useState, useRef, useEffect } from 'react';
import { Bot, X, Send, Sparkles } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { logActivity } from '@/lib/activity';
import { generateChatResponse } from '@/actions/chatAction';

interface Message {
  id: string;
  sender: "user" | "ai";
  text: string;
}

export default function ChatBot() {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { id: "1", sender: "ai", text: "Hi! I'm your CareerCraft AI Assistant. How can I help you today?" }
  ]);
  const [inputText, setInputText] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isOpen]);

  const generateResponse = (input: string) => {
    const lower = input.toLowerCase();
    if (lower.match(/trending|2026|future|jobs/)) {
      return "For 2026, the most trending roles are: AI Engineers, Prompt Engineers, Cloud Architects, Data Scientists, and Cybersecurity Experts. I recommend checking out our Job Finder module for specific remote listings!";
    }
    if (lower.match(/resume|cv/)) {
      return "I can help with your resume! Try our ATS-optimized Resume Builder from the sidebar. You can choose between Casual and Professional templates, and I can even help write your bullet points.";
    }
    if (lower.match(/interview|mock|prepare/)) {
      return "Our Mock Interview module is perfect for preparation. You can practice HR, Technical, Coding, and even Group Discussions with an AI evaluator that gives instant feedback.";
    }
    if (lower.match(/project|idea|build/)) {
      return "Need a project idea? Head over to the Project Builder! Just tell me what tech stack you like (e.g., React, Node, Python), and I'll generate a complete roadmap, folder structure, and architecture for you.";
    }
    if (lower.match(/roadmap|path|career/)) {
      return "To plan your career path, the Career Roadmaps module provides step-by-step guides for Frontend, Backend, DevOps, Data Science, and more. What specific role are you aiming for?";
    }
    if (lower.match(/learn|course|study|skills|tutorial/)) {
      return "The Learning Hub has curated courses from top platforms like Coursera and YouTube. What specific skill or framework are you trying to learn today?";
    }
    if (lower.match(/hi|hello|hey|greetings/)) {
      return "Hello there! I'm your CareerCraft AI. How can I assist you with your career journey today?";
    }
    if (lower.match(/salary|pay|money|compensation/)) {
      return "Salary expectations vary greatly by location and experience. You can use our Job Finder to see real-time salary ranges (normalized in INR) for the roles you're interested in.";
    }
    return "That's a great question! I am your CareerCraft AI. I can help you optimize your resume, find remote jobs, prepare for interviews, or build project blueprints. What would you like to focus on first?";
  };

  const handleSend = () => {
    if (!inputText.trim()) return;

    const newMsg: Message = { id: Date.now().toString(), sender: "user", text: inputText };
    setMessages(prev => [...prev, newMsg]);
    setInputText("");
    setIsTyping(true);
    
    if (user) {
      logActivity(user.uid, "aiChatMessages");
    }

    // Simulate AI response
    setTimeout(() => {
      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        sender: "ai",
        text: generateResponse(newMsg.text)
      }]);
      setIsTyping(false);
    }, 1200 + Math.random() * 1000); // Random delay between 1.2s and 2.2s for realism
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
      
      {/* Chat Window */}
      {isOpen && (
        <div className="bg-background border border-muted shadow-2xl rounded-2xl w-80 sm:w-96 h-[500px] max-h-[calc(100vh-6rem)] flex flex-col mb-4 overflow-hidden">
          
          {/* Header */}
          <div className="bg-foreground text-background px-4 py-3 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-background/20 flex items-center justify-center">
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-bold text-sm">CareerCraft Assistant</h3>
                <span className="text-[10px] uppercase tracking-wider opacity-70 font-medium flex items-center gap-1">
                  <div className="w-1.5 h-1.5 rounded-full bg-green-400"></div> Online
                </span>
              </div>
            </div>
            <button 
              onClick={() => setIsOpen(false)}
              className="p-1.5 hover:bg-background/20 transition-colors duration-150 ease-out rounded-md transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-muted/10">
            {messages.map(msg => (
              <div key={msg.id} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] rounded-2xl px-4 py-2 text-sm ${
                  msg.sender === 'user' 
                    ? 'bg-foreground text-background rounded-br-sm' 
                    : 'bg-background border border-muted shadow-sm rounded-bl-sm'
                }`}>
                  {msg.text}
                </div>
              </div>
            ))}
            {isTyping && (
              <div className="flex justify-start">
                <div className="bg-background border border-muted shadow-sm rounded-2xl rounded-bl-sm px-4 py-3 flex gap-1.5 items-center">
                  <div className="w-1.5 h-1.5 bg-muted-foreground/50 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <div className="w-1.5 h-1.5 bg-muted-foreground/50 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <div className="w-1.5 h-1.5 bg-muted-foreground/50 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className="p-3 bg-background border-t border-muted shrink-0 flex gap-2 items-end">
            <textarea
              value={inputText}
              onChange={e => setInputText(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              placeholder="Ask anything..."
              className="flex-1 max-h-32 min-h-[44px] bg-muted/50 border border-muted rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-foreground/30 resize-none"
              rows={1}
            />
            <button 
              onClick={handleSend}
              disabled={!inputText.trim() || isTyping}
              className="w-11 h-11 bg-foreground text-background rounded-xl flex items-center justify-center shrink-0 hover:bg-foreground/90 transition-colors duration-150 ease-out transition-colors disabled:opacity-50"
            >
              <Send className="w-4 h-4 ml-0.5" />
            </button>
          </div>
        </div>
      )}

      {/* Floating Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`w-14 h-14 rounded-full flex items-center justify-center shadow-2xl transition-transform hover:scale-110 active:scale-95 ${
          isOpen ? 'bg-muted text-foreground rotate-90' : 'bg-foreground text-background'
        }`}
      >
        {isOpen ? <X className="w-6 h-6" /> : <Bot className="w-6 h-6" />}
      </button>

    </div>
  );
}
