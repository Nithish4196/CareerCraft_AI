"use client";

import React, { useState, useRef, useEffect } from 'react';
import { Bot, X, Send, Sparkles } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { logActivity } from '@/lib/activity';
import { generateChatResponse } from '@/actions/chat';
import CodeVisualExplainer from '@/components/ai-assistant/CodeVisualExplainer';

interface Message {
  id: string;
  sender: "user" | "ai";
  text: string;
  messageType?: "text" | "visual_explainer";
  explainerData?: any;
}

export default function ChatBot() {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { id:"1", sender:"ai", text:"Hi! I'm your CareerPilot AI Assistant. How can I help you today?" }
  ]);
  const [inputText, setInputText] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior:"smooth" });
    }
  }, [messages, isOpen]);

  const containsCode = (text: string) => {
    const codeIndicators = ["```", "{", "}", ";", "int ", "float ", "def ", "function ", "class ", "return ", "import ", "include ", "public ", "private ", "void ", "var ", "const ", "let ", "for(", "for ", "while(", "while ", "cout", "printf", "scanf", "print("];
    if (text.includes("```")) return true;
    
    // Check if at least 2 curly braces or semicolons exist
    const symbolMatches = text.match(/[{};]/g);
    if (symbolMatches && symbolMatches.length >= 2) return true;

    return codeIndicators.some(indicator => text.includes(indicator));
  };

  const handleCodeMessage = async (userMessage: string, msgId: string) => {
    try {
      const responseText = await generateChatResponse(userMessage, true);
      const parsedJSON = JSON.parse(responseText);
      
      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        sender: "ai",
        text: parsedJSON.summary,
        messageType: "visual_explainer",
        explainerData: parsedJSON
      }]);
    } catch (error) {
      console.error("Failed to parse code explainer JSON. Falling back to text response.", error);
      // Fallback
      const fallbackText = await generateChatResponse(userMessage, false);
      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        sender: "ai",
        text: fallbackText,
        messageType: "text"
      }]);
    }
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
        await handleCodeMessage(currentInput, newMsg.id);
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
        text: "Sorry, I am having trouble connecting right now. Please try again later.",
        messageType: "text"
      }]);
    } finally {
      setIsTyping(false);
    }
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
                <h3 className="font-bold text-sm">CareerPilot Assistant</h3>
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
                {msg.messageType === 'visual_explainer' && msg.explainerData ? (
                  <div className="w-full max-w-[95%]">
                    <CodeVisualExplainer data={msg.explainerData} />
                  </div>
                ) : (
                  <div className={`max-w-[85%] rounded-2xl px-4 py-2 text-sm ${
                    msg.sender === 'user' 
                      ? 'bg-foreground text-background rounded-br-sm' 
                      : 'bg-background border border-muted shadow-sm rounded-bl-sm'
                  }`}>
                    {msg.text}
                  </div>
                )}
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
