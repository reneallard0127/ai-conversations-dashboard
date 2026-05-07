import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Send, Star, ArrowLeft, Bot, User } from 'lucide-react';
import api from '../services/api';
import { onMessage, sendMessage } from '../services/websocket';

const ChatPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [conversation, setConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [streaming, setStreaming] = useState(false);
  const [streamingText, setStreamingText] = useState('');
  const [rating, setRating] = useState(0);
  const [rated, setRated] = useState(false);
  const [loading, setLoading] = useState(true);
  const bottomRef = useRef(null);

  // Cargar conversación y mensajes
  useEffect(() => {
    api.get(`/conversations/${id}`)
      .then(r => {
        setConversation(r.data.conversation);
        setMessages(r.data.messages);
        if (r.data.conversation.rating) {
          setRated(true);
          setRating(Math.round(r.data.conversation.rating));
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [id]);

  // Escuchar eventos WebSocket
  useEffect(() => {
    const unsubSaved = onMessage('MESSAGE_SAVED', (msg) => {
      if (msg.data.conversationId === id && msg.data.role === 'user') {
        setMessages(prev => [...prev, { role: 'user', content: msg.data.content, created_at: new Date() }]);
      }
    });

    const unsubToken = onMessage('AI_STREAM_TOKEN', (msg) => {
      setStreamingText(prev => prev + msg.token);
    });

    const unsubEnd = onMessage('AI_STREAM_END', (msg) => {
      setStreaming(false);
      setStreamingText('');
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: msg.data.content,
        created_at: new Date()
      }]);
    });

    return () => { 
      if(unsubSaved) unsubSaved(); 
      if(unsubToken) unsubToken(); 
      if(unsubEnd) unsubEnd(); 
    };
  }, [id]);

  // Scroll automático al último mensaje
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, streamingText]);

  const handleSend = () => {
    if (!input.trim() || streaming) return;
    const content = input.trim();
    setInput('');
    setStreaming(true);
    setStreamingText('');
    sendMessage({ type: 'SEND_MESSAGE', conversationId: id, content });
  };

  const handleRate = async (value) => {
    if (rated) return;
    try {
      await api.patch(`/conversations/${id}/rate`, { rating: value });
      setRating(value);
      setRated(true);
      setConversation(prev => ({ ...prev, rating: value, status: 'closed' }));
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center h-full">
      <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-primary-500"></div>
    </div>
  );

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="bg-dark-800 border-b border-slate-700 px-6 py-4 flex items-center gap-4">
        <button
          onClick={() => navigate('/conversations')}
          className="text-slate-400 hover:text-white transition-colors"
        >
          <ArrowLeft size={20} />
        </button>
        <div className="flex-1">
          <h1 className="text-white font-semibold text-sm">
            Conversación {id.slice(0, 8)}...
          </h1>
          <p className="text-slate-400 text-xs">
            Canal: {conversation?.channel} • Estado:{' '}
            <span className={conversation?.status === 'open' ? 'text-emerald-400' : 'text-slate-400'}>
              {conversation?.status === 'open' ? 'Abierta' : 'Cerrada'}
            </span>
          </p>
        </div>

        {/* Rating */}
        <div className="flex items-center gap-1">
          <span className="text-slate-400 text-xs mr-2">Calificar:</span>
          {[1,2,3,4,5].map(star => (
            <button
              key={star}
              onClick={() => handleRate(star)}
              disabled={rated}
              className={`transition-colors ${
                star <= rating ? 'text-amber-400' : 'text-slate-600'
              } ${!rated ? 'hover:text-amber-300' : ''} disabled:cursor-default`}
            >
              <Star size={18} fill={star <= rating ? 'currentColor' : 'none'} />
            </button>
          ))}
          {rated && <span className="text-emerald-400 text-xs ml-2">✓ Calificada</span>}
        </div>
      </div>

      {/* Mensajes */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        {messages.length === 0 && !streaming && (
          <div className="flex flex-col items-center justify-center h-full text-slate-500">
            <Bot size={48} className="mb-3 text-slate-700" />
            <p className="text-sm">Envía un mensaje para iniciar la conversación</p>
          </div>
        )}

        {messages.map((msg, i) => (
          <div key={i} className={`flex items-start gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
              msg.role === 'user' ? 'bg-primary-500' : 'bg-slate-700'
            }`}>
              {msg.role === 'user'
                ? <User size={16} className="text-white" />
                : <Bot size={16} className="text-slate-300" />
              }
            </div>
            <div className={`max-w-[70%] rounded-2xl px-4 py-3 text-sm ${
              msg.role === 'user'
                ? 'bg-primary-500 text-white rounded-tr-sm'
                : 'bg-dark-800 text-slate-200 border border-slate-700 rounded-tl-sm'
            }`}>
              {msg.content}
            </div>
          </div>
        ))}

        {/* Streaming en curso */}
        {streaming && (
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center flex-shrink-0">
              <Bot size={16} className="text-slate-300" />
            </div>
            <div className="max-w-[70%] bg-dark-800 border border-slate-700 rounded-2xl rounded-tl-sm px-4 py-3 text-sm text-slate-200">
              {streamingText || (
                <span className="flex gap-1">
                  <span className="animate-bounce">•</span>
                  <span className="animate-bounce" style={{animationDelay:'0.1s'}}>•</span>
                  <span className="animate-bounce" style={{animationDelay:'0.2s'}}>•</span>
                </span>
              )}
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="bg-dark-800 border-t border-slate-700 p-4">
        <div className="flex items-center gap-3 bg-dark-900 rounded-xl border border-slate-600 px-4 py-2.5 focus-within:border-primary-500 transition-colors">
          <input
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSend()}
            placeholder={streaming ? 'La IA está respondiendo...' : 'Escribe un mensaje...'}
            disabled={streaming}
            className="flex-1 bg-transparent text-white placeholder-slate-500 text-sm focus:outline-none"
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || streaming}
            className="w-8 h-8 bg-primary-500 hover:bg-primary-600 disabled:opacity-40 rounded-lg flex items-center justify-center transition-colors"
          >
            <Send size={14} className="text-white" />
          </button>
        </div>
        <p className="text-slate-600 text-xs mt-2 text-center">Presiona Enter para enviar</p>
      </div>
    </div>
  );
};

export default ChatPage;