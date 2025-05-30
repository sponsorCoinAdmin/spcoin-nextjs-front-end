export default function HelpPage() {
    return (
      <div style={{ fontFamily: "Arial, sans-serif", padding: "20px" }}>
        <h2 style={{ color: "#fef08a" }}>How to Use This Page</h2>
        <p style={{ color: "#d1d5db" }}>
          To load a remote URL inside this page, append a <code>?url=</code> parameter to the URL:
        </p>
        <pre style={{ background: "#f4f4f4", padding: "10px", borderRadius: "5px" }}>
          http://localhost:3000/RecipientSite?url=YOUR_REMOTE_URL
        </pre>
  
        <h3 style={{ color: "#fef08a" }}>Example Calls:</h3>
        <ul>
          <li>
            <a href="/RecipientSite?url=https://openai.com" target="_parent">Load OpenAI</a>
          </li>
          <li>
            <a href="/RecipientSite?url=https://wikipedia.org" target="_parent">Load Wikipedia</a>
          </li>
          <li>
            <a href="/RecipientSite?url=https://example.com" target="_parent">Load Example</a>
          </li>
        </ul>
      </div>
    );
  }
  