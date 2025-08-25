"use client";
import { useCallback } from "react";

import { TeamSwitcher } from "@/components/team-switcher";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import type { NavGroup, NavItem } from "@/components/types";
import { useAppTheme } from "@/hooks/use-theme";
import { cn } from "@/lib/utils";

const data: Record<string, NavGroup[]> = {
  teams: [
    {
      name: "X-69",
      logo: "https://raw.githubusercontent.com/origin-space/origin-images/refs/heads/main/exp2/logo-01_upxvqe.png",
    },
    {
      name: "re-up.ph",
      logo: "https://raw.githubusercontent.com/origin-space/origin-images/refs/heads/main/exp2/logo-01_upxvqe.png",
    },
    {
      name: "bigticket.ph",
      logo: "https://raw.githubusercontent.com/origin-space/origin-images/refs/heads/main/exp2/logo-01_upxvqe.png",
    },
  ],
  navMain: [
    {
      title: "Playground",
      url: "#",
      items: [
        {
          title: "Sales",
          url: "#",
          icon: "px-chat",
          isActive: true,
        },
        {
          title: "Users",
          url: "#",
          icon: "px-clock",
        },
        {
          title: "Reports",
          url: "#",
          icon: "px-chat",
        },
        {
          title: "Analytics",
          url: "#",
          icon: "px-ship",
        },
      ],
    },
    {
      title: "Preferences",
      url: "#",
      items: [
        {
          title: "Icons",
          url: "#",
          icon: "px-bucket",
        },
        {
          title: "Layout",
          url: "#",
          icon: "px-checkbox",
        },
        {
          title: "Settings",
          url: "#",
          icon: "px-close",
        },
      ],
    },
  ],
};

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const [isDark, toggleTheme] = useAppTheme();
  const ToggleTheme = useCallback(
    () => (
      <SidebarMenuItem>
        <SidebarMenuButton
          asChild
          className="group/menu-button gap-1 h-9 rounded-md [&>svg]:size-auto"
        >
          <button onClick={toggleTheme} className="capitalize">
            <span
              className={cn("-italic text-slate-700", {
                "font-light italic text-orange-200/75": isDark,
              })}
            >
              {isDark ? "Light" : "Dark"}
            </span>
            <span className="opacity-80 tracking-tight font-extrabold dark:opacity-70">
              Mode
            </span>
          </button>
        </SidebarMenuButton>
      </SidebarMenuItem>
    ),
    [toggleTheme, isDark],
  );
  return (
    <Sidebar {...props} className="!border-none">
      <SidebarHeader className="bg-fade">
        <TeamSwitcher teams={data.teams} />
      </SidebarHeader>
      <SidebarContent>
        {/* We only show the first parent group */}
        <SidebarGroup>
          <SidebarGroupLabel className="uppercase text-sidebar-foreground/50">
            {data.navMain[0]?.title}
          </SidebarGroupLabel>
          <SidebarGroupContent className="px-2">
            <SidebarMenu>
              {data.navMain[0] &&
                data.navMain[0]?.items?.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      asChild
                      className="group/menu-button font-medium gap-3 h-9 rounded-md data-[active=true]:hover:bg-transparent data-[active=true]:bg-gradient-to-b data-[active=true]:from-sidebar-primary data-[active=true]:to-sidebar-primary/70 data-[active=true]:shadow-[0_1px_2px_0_rgb(0_0_0/.05),inset_0_1px_0_0_rgb(255_255_255/.12)] [&>svg]:size-auto"
                      isActive={item.isActive}
                    >
                      <MenuContent {...item} />
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        {/* Secondary Navigation */}
        <SidebarGroup>
          <SidebarGroupLabel className="uppercase text-sidebar-foreground/50">
            {data.navMain[1]?.title}
          </SidebarGroupLabel>
          <SidebarGroupContent className="px-2">
            <SidebarMenu>
              {data.navMain[1]?.items?.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    size="lg"
                    asChild
                    className="group/menu-button font-medium gap-3 h-9 rounded-md [&>svg]:size-auto"
                    isActive={item.isActive}
                  >
                    <MenuContent {...item} />
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
              <ToggleTheme />
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarFooter>
    </Sidebar>
  );
}

const MenuContent = (item: NavItem) => {
  return (
    <a href={item.url} className="flex ps-1 items-center space-x-4 h-[2.5rem]">
      <span>{item.title}</span>
    </a>
  );
};
