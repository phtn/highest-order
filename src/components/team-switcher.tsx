"use client";

import * as React from "react";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import Image from "next/image";
import { Icon } from "@/lib/icons";
import { NavGroup } from "./types";
import Link from "next/link";

interface TeamSwitcherProps {
  teams: NavGroup[];
}

export function TeamSwitcher({ teams }: TeamSwitcherProps) {
  const [activeTeam, setActiveTeam] = React.useState(teams[0] ?? null);

  if (!teams.length) return null;

  return (
    <SidebarMenu className="h-12">
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="rounded-xl data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground gap-3 [&>svg]:size-auto"
            >
              <div className="flex aspect-square size-8 items-center justify-center rounded-lg overflow-hidden bg-gradient-to-br from-slate-600/80 via-slate-600/40 to-sidebar-primary/20 text-sidebar-primary-foreground relative after:rounded-[inherit] after:absolute after:inset-0 after:shadow-[0_0_1px_0_rgb(0_0_0/.05),inset_0.4px_0.4px_0.6px_0.0_rgb(255_255_255/.25)] after:pointer-events-none">
                {activeTeam && <Icon name="creator" className="size-5" />}
                <div className="bg-orange-100/70 blur-md h-5 w-5 absolute -bottom-3 -right-3" />
              </div>
              <div className="grid flex-1 text-left text-base leading-tight">
                <span className="truncate font-medium">
                  {activeTeam?.name ?? "Select a Team"}
                </span>
              </div>
              <Icon
                name="px-chevron-right"
                className="rotate-90 text-sidebar-foreground/50"
              />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-sm"
            align="start"
            side="bottom"
            sideOffset={11}
          >
            <DropdownMenuLabel className="uppercase text-muted-foreground/70 text-xs">
              Teams
            </DropdownMenuLabel>
            {teams.map((team, index) => (
              <DropdownMenuItem
                key={team.name}
                onClick={() => setActiveTeam(team)}
                className="gap-2 p-2"
              >
                <Link
                  href={team.url ?? "/"}
                  className="flex size-6 items-center justify-center rounded-md overflow-hidden"
                >
                  <Image
                    src={"./vercel.svg"}
                    width={36}
                    height={36}
                    alt={team.name ?? "team-name"}
                    className="h-9 w-auto aspect-auto shrink-0"
                  />
                </Link>
                {team.name}
                <DropdownMenuShortcut>⌘{index + 1}</DropdownMenuShortcut>
              </DropdownMenuItem>
            ))}
            <DropdownMenuSeparator />
            <DropdownMenuItem className="gap-2 p-2">
              <Icon
                name="plus"
                aria-hidden="true"
                className="opacity-60 size-4"
              />
              <div className="font-medium">Add team</div>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
