
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

function mountApp() {
  const rootElement = document.getElementById('root');
  if (!rootElement) {
    // Log a more detailed error to the console
    console.error("Fatal Error: Could not find root element with id 'root' to mount the React application. " +
                  "Please ensure your index.html file contains a `div` with this id, e.g., <div id='root'></div>.");
    
    // Optionally, display a fallback message in the UI if possible, though if #root is missing, the page might be blank.
    // This is a last resort and might not always be visible depending on the state of the HTML.
    if (document.body) {
        document.body.innerHTML = `
            <div style="font-family: sans-serif; text-align: center; padding: 20px; color: #721c24; background-color: #f8d7da; border: 1px solid #f5c6cb; border-radius: .25rem; margin: 20px;">
                <h1>Application Initialization Error</h1>
                <p>The application could not start because a critical HTML element ('root') is missing.</p>
                <p>Please ensure you are using a compatible browser or contact support if the issue persists.</p>
            </div>
        `;
    }
    return; // Stop further execution
  }

  const root = ReactDOM.createRoot(rootElement);
  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
}

// Check if the DOM is already loaded
if (document.readyState === 'loading') {
  // Wait for the DOM to be fully loaded before mounting the app
  document.addEventListener('DOMContentLoaded', mountApp);
} else {
  // DOMContentLoaded has already fired, mount the app directly
  mountApp();
}
