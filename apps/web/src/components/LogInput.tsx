import React, { useState, useRef } from 'react';

interface Props {
  onParse: (logs: string) => void;
  loading: boolean;
}

export default function LogInput({ onParse, loading }: Props) {
  const [logs, setLogs] = useState('');
  const textRef = useRef<HTMLTextAreaElement>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!logs.trim()) return;
    onParse(logs);
  };

  return (
    <form className="log-input-form" onSubmit={handleSubmit}>
      <div className="log-input-header">
        <span>Paste your production logs below</span>
        <button
          type="submit"
          className="btn-primary"
          disabled={loading || !logs.trim()}
        >
          {loading ? 'Analyzing…' : 'Analyze'}
        </button>
      </div>
      <textarea
        ref={textRef}
        className="log-textarea"
        placeholder={`Paste logs here...\n\nExample:\n2026-08-22T10:15:31Z ERROR Database connection failed\n    at Socket.connect (net.js:123:15)`}
        value={logs}
        onChange={(e) => setLogs(e.target.value)}
        rows={8}
        spellCheck={false}
      />
    </form>
  );
}