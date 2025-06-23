import React from 'react';

export default function LabelLayout({ children }: { children: React.ReactNode }) {
  // This layout is intentionally minimal to avoid inheriting the main app's
  // sidebar and other UI elements, making it perfect for printing.
  // It still inherits the root layout's `<html>` and `<body>` tags,
  // including the global stylesheet.
  return <>{children}</>;
}
