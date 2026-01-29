import {Convex} from "@/ctx/convex";
import {ConversationsSync} from "@/ctx/chat/conversations-sync";
import { SettingsPanelProvider } from "@/components/settings-panel";
import { ThemeProvider } from "@/components/theme-provider";
import { VoiceSettingsProvider } from "@/ctx/hume";
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "App Zero",
  description: "NextJS Template",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head />
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <Convex>
          <ConversationsSync />
          <ThemeProvider
            enableSystem
            attribute="class"
            defaultTheme="system"
            disableTransitionOnChange
          >
            <VoiceSettingsProvider>
              <SettingsPanelProvider>{children}</SettingsPanelProvider>
            </VoiceSettingsProvider>
          </ThemeProvider>
        </Convex>
      </body>
    </html>
  );
}
