import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import PageLayout from '../components/PageLayout';
import { useChatHistory } from '../contexts/ChatHistoryContext';
import { ChatRole, ChatMessage } from '../types';
import { streamChat } from '../services/geminiService';
import { UserCircleIcon } from '../components/icons';

const ChatMessageBubble: React.FC<{ message: ChatMessage }> = ({ message }) => {
    const isUser = message.role === ChatRole.USER;
    const bubbleClass = isUser 
        ? "bg-sky-500 text-white self-end" 
        : "bg-gray-200 text-gray-800 self-start";

    return (
        <div className={`flex items-end gap-2 ${isUser ? 'justify-end' : 'justify-start'}`}>
            {!isUser && <UserCircleIcon className="w-8 h-8 text-gray-400 mb-2" />}
            <div className={`max-w-xs md:max-w-md lg:max-w-lg p-3 rounded-2xl ${bubbleClass}`}>
                <p className="whitespace-pre-wrap break-words">{message.text}{message.isStreaming && '...'}</p>
                <p className={`text-xs mt-1 ${isUser ? 'text-sky-200' : 'text-gray-500'} text-right`}>
                    {message.timestamp.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })}
                </p>
            </div>
        </div>
    );
};


const ChatPage: React.FC = () => {
    const navigate = useNavigate();
    const { messages, history, addMessage, updateLastMessage, setStreamLoading, isLoading, clearHistory } = useChatHistory();
    const [input, setInput] = useState('');
    const [isSending, setIsSending] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const handleSend = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!input.trim() || isSending) return;

        const userMessage = input;
        setInput('');
        setIsSending(true);

        addMessage(ChatRole.USER, userMessage);
        const modelMessage = addMessage(ChatRole.MODEL, '');
        
        try {
            const stream = streamChat(history, userMessage);
            for await (const chunk of stream) {
                updateLastMessage(chunk);
            }
        } catch (error) {
            console.error("Chat error:", error);
            updateLastMessage("죄송합니다. 메시지를 처리하는 중 오류가 발생했습니다.");
        } finally {
            setIsSending(false);
            setStreamLoading(false);
        }
    };
    
    if (isLoading) {
        return <PageLayout title="AI 채팅 상담"><div className="text-center p-8">채팅 기록을 불러오는 중...</div></PageLayout>;
    }

    return (
        <PageLayout title="AI 채팅 상담" showBackButton={false}>
            <div className="flex flex-col h-[calc(100vh-8.5rem)]">
                <div className="flex-grow p-4 space-y-4 overflow-y-auto">
                    {messages.length === 0 ? (
                        <div className="text-center text-gray-500 mt-8">
                            <p>안녕하세요! Memoria AI 도우미입니다.</p>
                            <p>환자 돌봄에 대해 궁금한 점을 물어보세요.</p>
                        </div>
                    ) : (
                        messages.map(msg => <ChatMessageBubble key={msg.id} message={msg} />)
                    )}
                     <div ref={messagesEndRef} />
                </div>
                <div className="p-4 bg-white border-t border-gray-200">
                    <form onSubmit={handleSend} className="flex items-center gap-2">
                        <input
                            type="text"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            placeholder="메시지를 입력하세요..."
                            className="w-full p-3 border border-gray-300 rounded-full shadow-sm focus:ring-sky-500 focus:border-sky-500 transition-colors"
                            disabled={isSending}
                        />
                        <button
                            type="submit"
                            disabled={!input.trim() || isSending}
                            className="p-3 bg-sky-500 text-white rounded-full hover:bg-sky-600 disabled:bg-sky-300 transition-colors shadow-md"
                            aria-label="메시지 전송"
                        >
                           <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
                            <path d="M3.478 2.404a.75.75 0 0 0-.926.941l2.432 7.905H13.5a.75.75 0 0 1 0 1.5H4.984l-2.432 7.905a.75.75 0 0 0 .926.94 60.519 60.519 0 0 0 18.445-8.986.75.75 0 0 0 0-1.218A60.517 60.517 0 0 0 3.478 2.404Z" />
                           </svg>
                        </button>
                    </form>
                </div>
            </div>
        </PageLayout>
    );
};

export default ChatPage;
