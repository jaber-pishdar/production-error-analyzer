import React from 'react';

interface Props {
  onReset: () => void;
}

export default function Header({ onReset }: Props) {
  return (
    <header className="app-header">
      <div className="header-left">
        <h1 className="app-title" onClick={onReset} style={{ cursor: 'pointer' }}>
          Production Error Analyzer
        </h1>
      </div>
      <div className="header-right">
        <a
          className="header-link"
          href="https://github.com/jaber-pishdar/production-error-analyzer"
          target="_blank"
          rel="noreferrer"
        >
          GitHub
        </a>
      </div>
    </header>
  );
}