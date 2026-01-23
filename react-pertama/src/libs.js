// Bridge to use Global UMD variables as modules
export const React = window.React;
export const ReactDOM = window.ReactDOM;
export const ReactRouterDOM = window.ReactRouterDOM;

if (!ReactRouterDOM) {
  console.error("ReactRouterDOM is missing! Check script tags.");
}

export const { useState, useEffect, useRef } = React;
export const { createRoot } = ReactDOM;
export const { BrowserRouter, Routes, Route, Navigate, useNavigate, useLocation } = ReactRouterDOM || {};

// Use React.createElement to avoid JSX in .js files
// This ensures compatibility with all JS parsers and avoids "invalid syntax" errors

export const Menu = ({ size = 24 }) => React.createElement("svg", { width: size, height: size, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round" },
  React.createElement("line", { x1: "3", y1: "12", x2: "21", y2: "12" }),
  React.createElement("line", { x1: "3", y1: "6", x2: "21", y2: "6" }),
  React.createElement("line", { x1: "3", y1: "18", x2: "21", y2: "18" })
);

export const X = ({ size = 24 }) => React.createElement("svg", { width: size, height: size, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round" },
  React.createElement("line", { x1: "18", y1: "6", x2: "6", y2: "18" }),
  React.createElement("line", { x1: "6", y1: "6", x2: "18", y2: "18" })
);

export const User = ({ size = 24 }) => React.createElement("svg", { width: size, height: size, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round" },
  React.createElement("path", { d: "M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" }),
  React.createElement("circle", { cx: "12", cy: "7", r: "4" })
);

export const Key = ({ size = 24 }) => React.createElement("svg", { width: size, height: size, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round" },
  React.createElement("path", { d: "m21 2-2 2m-7.6 7.6a6 6 0 1 1-5.6-5.6" })
);

export const Upload = ({ size = 24 }) => React.createElement("svg", { width: size, height: size, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round" },
  React.createElement("path", { d: "M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" }),
  React.createElement("polyline", { points: "17 8 12 3 7 8" }),
  React.createElement("line", { x1: "12", y1: "3", x2: "12", y2: "15" })
);

export const LogOut = ({ size = 24 }) => React.createElement("svg", { width: size, height: size, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round" },
  React.createElement("path", { d: "M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" }),
  React.createElement("polyline", { points: "16 17 21 12 16 7" }),
  React.createElement("line", { x1: "21", y1: "12", x2: "9", y2: "12" })
);
