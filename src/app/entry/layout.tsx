import React, { ReactNode } from "react";
import { AppSidebar } from "@/components/app-sidebar";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { Navbar } from "@/components/navbar";
import {
  SettingsPanelProvider,
  SettingsPanel,
} from "@/components/settings-panel";

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset className="group/sidebar-inset">
        <Navbar />
        <SettingsPanelProvider>
          <Container>
            {children}
            <SettingsPanel />
          </Container>
        </SettingsPanelProvider>
      </SidebarInset>
    </SidebarProvider>
  );
}

const Container = ({ children }: { children: ReactNode }) => (
  <div className="relative bg-fade w-full flex h-[calc(100svh-4rem)]">
    {children}
  </div>
);
