import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';

export default function ChatApp() {
  const [repos, setRepos] = useState([]);
  const [activeRepo, setActiveRepo] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const bottomRef = useRef(null);

  const fetchRepos = async () => {
    const res = await api.get('/repositories/');
    setRepos(res.data);
  };

  useEffect(() => {
    fetchRepos();
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const loadRepo = async (repoId) => {
    const res = await api.get(`/repositories/${repoId}/`);
    setActiveRepo(res.data);

    const chatRes = await api.get(`/repositories/${repoId}/chat/`);
    const history = chatRes.data.map(m => ({
      role: m.role,
      type: 'text',
      content: m.content
    }));
    setMessages(history);
  };

  const logout = () => {
    localStorage.removeItem('access_token');
    navigate('/');
  };

  const handleSend = async () => {
    if (!input.trim()) return;
    const codeText = input;
    setInput('');
    setLoading(true);

    setMessages(prev => [...prev, { role: 'user', type: 'code', content: codeText }]);

    try {
      let repoId = activeRepo?.id;

      if (!repoId) {
        const repoRes = await api.post('/repositories/', {
          name: `Project ${repos.length + 1}`,
          language: 'python'
        });
        repoId = repoRes.data.id;
        await fetchRepos();
      }

      const filename = `snippet_${Date.now()}.py`;
      await api.post(`/repositories/${repoId}/upload/`, { filename, content: codeText });

    //   const reviewRes = await api.post(`/repositories/${repoId}/review/`);
    //   const results = reviewRes.data.results || [];

    //   if (results.length === 0) {
    //     setMessages(prev => [...prev, { role: 'assistant', type: 'text', content: 'No issues found in this code.' }]);
    //   } else {
    //     results.forEach(r => {
    //       setMessages(prev => [...prev, {
    //         role: 'assistant',
    //         type: 'issue',
    //         severity: r.severity,
    //         content: r.description,
    //         suggestion: r.suggestion,
    //         line: r.line_number
    //       }]);
    //     });
    //   }

    const reviewRes = await api.post(`/repositories/${repoId}/review/`);
const results = reviewRes.data.results || [];

if (reviewRes.data.ai_unavailable) {
  setMessages(prev => [...prev, { role: 'assistant', type: 'text', content: 'The AI reviewer is temporarily unavailable (rate limit reached). Please try again in a minute.' }]);
} else if (results.length === 0) {
  setMessages(prev => [...prev, { role: 'assistant', type: 'text', content: 'No issues found in this code.' }]);
} else {
  results.forEach(r => {
    setMessages(prev => [...prev, {
      role: 'assistant',
      type: 'issue',
      severity: r.severity,
      content: r.description,
      suggestion: r.suggestion,
      line: r.line_number
    }]);
  });
}

      const repoRes = await api.get(`/repositories/${repoId}/`);
      setActiveRepo(repoRes.data);
    } catch (err) {
      setMessages(prev => [...prev, { role: 'assistant', type: 'text', content: 'Something went wrong. Please try again.' }]);
    }
    setLoading(false);
  };

  const handleChatFollowup = async (question) => {
    if (!activeRepo) return;
    setMessages(prev => [...prev, { role: 'user', type: 'text', content: question }]);
    setLoading(true);
    try {
      const res = await api.post(`/repositories/${activeRepo.id}/chat/`, { message: question });
      setMessages(prev => [...prev, { role: 'assistant', type: 'text', content: res.data.content }]);
    } catch (err) {
      setMessages(prev => [...prev, { role: 'assistant', type: 'text', content: 'Could not get a response. Try again.' }]);
    }
    setLoading(false);
  };

  const handleGenerateDocs = async () => {
    if (!activeRepo) return;
    setLoading(true);
    try {
      const res = await api.post(`/repositories/${activeRepo.id}/docs/generate/`);
      const docs = res.data;
      const readme = docs.find(d => d.doc_type === 'readme');
      setMessages(prev => [...prev, {
        role: 'assistant',
        type: 'text',
        content: readme ? readme.content : 'Documentation generated.'
      }]);
    } catch (err) {
      setMessages(prev => [...prev, { role: 'assistant', type: 'text', content: 'Could not generate docs right now.' }]);
    }
    setLoading(false);
  };

  const severityColor = (sev) => {
    if (sev === 'critical') return 'text-red-400';
    if (sev === 'major') return 'text-amber-400';
    return 'text-neutral-400';
  };

  return (
    <div className="flex h-screen bg-neutral-950 text-white">
      <div className="w-60 bg-neutral-900 border-r border-neutral-800 flex flex-col p-3">
        <button
          onClick={() => { setActiveRepo(null); setMessages([]); }}
          className="mb-4 w-full py-2 rounded-lg border border-neutral-700 text-sm hover:bg-neutral-800"
        >
          + New project
        </button>
        <p className="text-xs text-neutral-500 mb-2 px-1">Recent</p>
        <div className="flex-1 overflow-y-auto space-y-1">
          {repos.map(r => (
            <button
              key={r.id}
              onClick={() => loadRepo(r.id)}
              className={`w-full text-left px-2 py-2 rounded-lg text-sm truncate ${activeRepo?.id === r.id ? 'bg-neutral-800' : 'hover:bg-neutral-800 text-neutral-300'}`}
            >
              {r.name}
            </button>
          ))}
        </div>
        <button onClick={logout} className="text-xs text-neutral-500 hover:text-white mt-2 text-left px-1">
          Log out
        </button>
      </div>

      <div className="flex-1 flex flex-col">
        <div className="flex-1 overflow-y-auto p-6 space-y-4 max-w-3xl mx-auto w-full">
          {messages.length === 0 && (
            <div className="text-center text-neutral-500 mt-20">
              <h2 className="text-xl mb-2">Paste your code to get started</h2>
              <p className="text-sm">Tufy will review it for bugs, security issues, and style problems.</p>
            </div>
          )}

          {messages.map((m, i) => (
            <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-xl rounded-2xl px-4 py-3 ${m.role === 'user' ? 'bg-neutral-800' : 'bg-neutral-900 border border-neutral-800'}`}>
                {m.type === 'code' ? (
                  <pre className="text-xs font-mono whitespace-pre-wrap">{m.content}</pre>
                ) : m.type === 'issue' ? (
                  <div>
                    <p className={`text-xs font-medium mb-1 ${severityColor(m.severity)}`}>
                      {m.severity} · line {m.line}
                    </p>
                    <p className="text-sm mb-2">{m.content}</p>
                    <p className="text-xs text-neutral-400 italic">{m.suggestion}</p>
                    <button
                      onClick={() => handleChatFollowup(`How do I fix: ${m.content}`)}
                      className="text-xs text-blue-400 hover:underline mt-2"
                    >
                      Ask how to fix this
                    </button>
                  </div>
                ) : (
                  <p className="text-sm whitespace-pre-wrap">{m.content}</p>
                )}
              </div>
            </div>
          ))}

          {activeRepo && (
            <div className="flex justify-start">
              <button
                onClick={handleGenerateDocs}
                className="text-xs border border-neutral-700 rounded-lg px-3 py-2 hover:bg-neutral-800"
              >
                Generate documentation
              </button>
            </div>
          )}

          {loading && <p className="text-xs text-neutral-500">Tufy is thinking…</p>}
          <div ref={bottomRef} />
        </div>

        <div className="p-4 border-t border-neutral-800">
          <div className="max-w-3xl mx-auto flex gap-2">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  activeRepo ? handleChatFollowup(input) && setInput('') : handleSend();
                }
              }}
              placeholder={activeRepo ? "Ask a follow-up question..." : "Paste your code here..."}
              rows={activeRepo ? 1 : 4}
              className="flex-1 px-3 py-2 rounded-lg bg-neutral-900 border border-neutral-700 text-sm resize-none focus:outline-none focus:border-neutral-500"
            />
            <button
              onClick={() => activeRepo ? (handleChatFollowup(input), setInput('')) : handleSend()}
              disabled={loading}
              className="px-4 py-2 rounded-lg bg-white text-black text-sm font-medium hover:bg-neutral-200 disabled:opacity-50"
            >
              Send
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}