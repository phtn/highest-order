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
import { Button } from "./ui/button";
import { Icon } from "@/lib/icons";

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const [isDark, toggleTheme] = useAppTheme();
  const ToggleTheme = useCallback(
    () => (
      <SidebarMenuItem>
        <SidebarMenuButton
          asChild
          className="group/menu-button h-9 rounded-md [&>svg]:size-auto"
        >
          <Button
            variant="ghost"
            onClick={toggleTheme}
            className="capitalize w-fit px-2 space-x-2"
          >
            <Icon
              name="px-bell"
              className="bg-orange-200 size-5 rounded-sm text-black"
            />
            <span className="space-x-1">
              <span
                className={cn("-italic text-slate-700", {
                  "font-light italic text-orange-300": isDark,
                })}
              >
                {isDark ? "Light" : "Dark"}
              </span>
              <span className="opacity-80 tracking-tighter font-extrabold dark:opacity-70">
                Mode
              </span>
            </span>
          </Button>
        </SidebarMenuButton>
      </SidebarMenuItem>
    ),
    [toggleTheme, isDark],
  );
  return (
    <Sidebar {...props} className="!border-none bg-fade">
      <SidebarHeader className="bg-fade">
        <TeamSwitcher teams={data.teams} />
      </SidebarHeader>
      <SidebarContent className="bg-fade">
        {/* We only show the first parent group */}
        <SidebarGroup>
          <SidebarGroupLabel className="pl-3 uppercase h-12 text-sidebar-foreground/50 font-bold">
            {data.navMain[0]?.title}
          </SidebarGroupLabel>
          <SidebarGroupContent className="">
            <SidebarMenu>
              {data.navMain[0] &&
                data.navMain[0]?.items?.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      asChild
                      className="group/menu-button bg-background h-9 data-[active=true]:hover:bg-background data-[active=true]:bg-gradient-to-b data-[active=true]:from-sidebar-primary data-[active=true]:to-sidebar-primary/70 data-[active=true]:shadow-[0_1px_2px_0_rgb(0_0_0/.05),inset_0_1px_0_0_rgb(255_255_255/.12)] [&>svg]:size-auto"
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
      <SidebarFooter className="bg-fade">
        {/* Secondary Navigation */}
        <SidebarGroup>
          <SidebarGroupLabel className="uppercase text-sidebar-foreground/50">
            {data.navMain[1]?.title}
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {data.navMain[1]?.items?.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild
                    size="lg"
                    className="group/menu-button font-medium h-9 [&>svg]:size-auto"
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
    <a
      href={item.url}
      className="group/menu-content hover:bg-foreground/10 rounded-lg flex items-center px-4 h-[2.5rem]"
    >
      <span className="text-base group-hover/menu-content:text-foreground tracking-tight font-medium text-foreground/80">
        {item.title}
      </span>
    </a>
  );
};

const data: Record<string, NavGroup[]> = {
  teams: [
    {
      name: "X-69",
      logo: "https://raw.githubusercontent.com/origin-space/origin-images/refs/heads/main/exp2/logo-01_upxvqe.png",
      url: "/",
    },
    {
      name: "re-up.ph",
      logo: "https://raw.githubusercontent.com/origin-space/origin-images/refs/heads/main/exp2/logo-01_upxvqe.png",
      url: "/",
    },
    {
      name: "bigticket.ph",
      logo: "https://raw.githubusercontent.com/origin-space/origin-images/refs/heads/main/exp2/logo-01_upxvqe.png",
      url: "/",
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
          url: "/entry/icons",
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
