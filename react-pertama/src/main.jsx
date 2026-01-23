import { React, createRoot } from '/src/libs.js';
import App from '/src/App.jsx';

const container = document.getElementById('root');
const root = createRoot(container);

root.render(React.createElement(App));
