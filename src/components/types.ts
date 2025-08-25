import type { IconName } from "@/lib/icons";

export interface NavGroup {
  name?: string;
  title?: string;
  url?: string;
  logo?: string;
  items?: NavItem[];
}

export interface NavItem {
  title: string;
  url: string;
  icon?: IconName;
  isActive?: boolean;
}
