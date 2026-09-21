import "./globals.css";

export const metadata = {
  title: "Harbor",
  description: "A living square. Public notes stay on the wall. Private ones stay at your desk.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
