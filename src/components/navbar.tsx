import UserDropdown from "@/components/user-dropdown";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { useMemo } from "react";

interface NavItem {
  label: string;
  href: string;
  ariaCurrent?: boolean;
}

export const Navbar = () => {
  const nav_data = useMemo(
    () =>
      [
        {
          label: "Docs",
          href: "#",
        },
      ] as NavItem[],
    [],
  );

  const renderNavItems = () => {
    return nav_data.map((item, index) => (
      <a
        key={index}
        className="text-sidebar-foreground/50 hover:text-sidebar-foreground/70 transition-colors [&[aria-current]]:text-sidebar-foreground before:content-['·'] before:px-4 before:text-sidebar-foreground/30 first:before:hidden"
        href={item.href}
        aria-current={item.ariaCurrent}
      >
        {item.label}
      </a>
    ));
  };

  return (
    <header className="flex h-16 shrink-0 items-center gap-2 px-4 md:px-6 bg-fade text-sidebar-foreground relative">
      <SidebarTrigger className="-ms-2" />
      <div className="flex items-center gap-8 ml-auto">
        <nav className="flex items-center text-sm font-medium max-sm:hidden">
          {renderNavItems()}
        </nav>
        <UserDropdown />
      </div>
    </header>
  );
};
