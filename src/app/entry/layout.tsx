import React, { ReactNode } from "react";
import { AppSidebar } from "@/components/app-sidebar";
import { EviDebugProvider } from "@/ctx/evi-debug";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { Navbar } from "@/components/navbar";
import { SettingsPanel } from "@/components/settings-panel";

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider>
      <AppSidebar />
      <EviDebugProvider>
        <SidebarInset className="group/sidebar-inset">
          <Navbar />
          <Container>
            {children}
            <SettingsPanel />
          </Container>
        </SidebarInset>
      </EviDebugProvider>
    </SidebarProvider>
  );
}

const Container = ({ children }: { children: ReactNode }) => (
  <div className="relative bg-fade w-full flex min-h-0 h-[calc(100svh-4rem)]">
    {children}
  </div>
);
