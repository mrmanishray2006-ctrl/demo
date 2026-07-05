@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Space+Grotesk:wght@500;600;700&family=Fira+Code:wght@400;500&display=swap');
@import "tailwindcss";

@theme {
  --font-sans: "Inter", ui-sans-serif, system-ui, sans-serif;
  --font-heading: "Space Grotesk", sans-serif;
  --font-mono: "Fira Code", monospace;

  --animate-pulse-slow: pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite;
  --animate-bounce-gentle: bounce 2s infinite;
}

body {
  font-family: var(--font-sans);
  background-color: #0f172a; /* Slate 900 for modern dark environment contrast */
  color: #f8fafc;
  margin: 0;
  padding: 0;
  overflow-x: hidden;
}

/* Custom scrollbars */
::-webkit-scrollbar {
  width: 6px;
  height: 6px;
}

::-webkit-scrollbar-track {
  background: rgba(15, 23, 42, 0.1);
}

::-webkit-scrollbar-thumb {
  background: rgba(148, 163, 184, 0.3);
  border-radius: 3px;
}

::-webkit-scrollbar-thumb:hover {
  background: rgba(148, 163, 184, 0.5);
}

.iphone-glow {
  box-shadow: 0 0 40px rgba(99, 102, 241, 0.15);
}

