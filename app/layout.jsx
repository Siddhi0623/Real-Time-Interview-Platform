import "./globals.css";

export const metadata = {
  title: "SignalRoom | Real-Time Interview Platform",
  description:
    "A real-time interview platform with rooms, video, audio, code editor, chat, and interviewer dashboard.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
