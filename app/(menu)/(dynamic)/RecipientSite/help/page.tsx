// File: app/(menu)/(dynamic)/RecipientSite/help/page.tsx
'use client';

import React from 'react';

export default function HelpPage() {
  return (
    <div className="font-sans p-5">
      <h2 className="text-yellow-200 text-2xl font-semibold mb-3">How to Use This Page</h2>

      <p className="text-slate-300 mb-3">
        To load a remote URL inside this page, append a <code className="font-mono">?url=</code> parameter to the URL:
      </p>

      <pre className="bg-slate-100 text-slate-800 rounded-md p-3 overflow-x-auto mb-6">
        <code>http://localhost:3000/RecipientSite?url=YOUR_REMOTE_URL</code>
      </pre>

      <h3 className="text-yellow-200 text-xl font-semibold mb-2">Example Calls:</h3>
      <ul className="list-disc list-inside space-y-2">
        <li>
          <a
            href="/RecipientSite?url=https://openai.com"
            target="_parent"
            rel="noopener"
            className="text-sky-300 hover:text-sky-200 underline"
          >
            Load OpenAI
          </a>
        </li>
        <li>
          <a
            href="/RecipientSite?url=https://wikipedia.org"
            target="_parent"
            rel="noopener"
            className="text-sky-300 hover:text-sky-2 00 underline"
          >
            Load Wikipedia
          </a>
        </li>
        <li>
          <a
            href="/RecipientSite?url=https://example.com"
            target="_parent"
            rel="noopener"
            className="text-sky-300 hover:text-sky-200 underline"
          >
            Load Example
          </a>
        </li>
      </ul>
    </div>
  );
}
