"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import {
  Building2,
  Calendar,
  ChevronLeft,
  ChevronRight,
  LayoutDashboard,
  UserCircle
} from "lucide-react";

import { cn } from "@/shared/lib/utils";
import { Button } from "@/shared/ui/button";
import { css } from "../../../../styled-system/css";

const navItems = [
  { href: "/dashboard", label: "대시보드", icon: LayoutDashboard },
  { href: "/dashboard/experiences", label: "경험 관리", icon: UserCircle },
  { href: "/dashboard/analyses", label: "기업분석", icon: Building2 },
  { href: "/dashboard/calendar", label: "캘린더", icon: Calendar }
];

type AppSidebarProps = {
  email: string;
  logoutSlot: React.ReactNode;
};

export function AppSidebar({ email, logoutSlot }: AppSidebarProps) {
  const pathname = usePathname() ?? "";
  const [manualCollapsed, setManualCollapsed] = useState<boolean | null>(null);
  const [viewportCollapsed, setViewportCollapsed] = useState<boolean | null>(null);

  useEffect(() => {
    const mql = window.matchMedia("(max-width: 767px)");
    const handleChange = () => setViewportCollapsed(mql.matches);

    handleChange();
    mql.addEventListener("change", handleChange);

    return () => mql.removeEventListener("change", handleChange);
  }, []);

  const collapsed = manualCollapsed ?? viewportCollapsed;
  const isCollapsed = collapsed ?? false;

  return (
    <aside
      className={css({
        bg: "bgSidebar",
        borderColor: "border",
        borderRightWidth: "1px",
        display: "flex",
        flexDirection: "column",
        flexShrink: 0,
        minH: "100dvh",
        overflow: "hidden",
        p: 3,
        transitionDuration: "fast",
        transitionProperty: "width",
        transitionTimingFunction: "standard"
      })}
      style={{
        width: isCollapsed
          ? "var(--sizes-sidebar-collapsed)"
          : "var(--sizes-sidebar-expanded)"
      }}
    >
      <div
        className={css({
          alignItems: "center",
          display: "flex",
          gap: 2,
          minH: "touchTarget"
        })}
        style={{ justifyContent: isCollapsed ? "center" : "flex-start" }}
      >
        <div
          aria-hidden="true"
          className={css({
            alignItems: "center",
            bg: "primary",
            borderRadius: "button",
            color: "primaryText",
            display: "inline-flex",
            flexShrink: 0,
            fontSize: "14px",
            fontWeight: 800,
            h: 9,
            justifyContent: "center",
            w: 9
          })}
          style={{ display: isCollapsed ? "none" : "inline-flex" }}
        >
          M
        </div>
        <span
          className={css({
            color: "text",
            fontSize: "14px",
            fontWeight: 800,
            minW: 0,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap"
          })}
          style={{ display: isCollapsed ? "none" : "inline" }}
        >
          myClaude
        </span>
        <Button
          aria-label={isCollapsed ? "사이드바 펼치기" : "사이드바 접기"}
          onClick={() =>
            setManualCollapsed((value) => !(value ?? viewportCollapsed ?? false))
          }
          size="icon"
          style={{ marginLeft: isCollapsed ? "0" : "auto" }}
          type="button"
          variant="ghost"
        >
          {isCollapsed ? (
            <ChevronRight aria-hidden="true" className={css({ h: 4, w: 4 })} />
          ) : (
            <ChevronLeft aria-hidden="true" className={css({ h: 4, w: 4 })} />
          )}
        </Button>
      </div>

      <nav className={css({ display: "grid", gap: 1, mt: 6 })}>
        {navItems.map((item) => {
          const Icon = item.icon;
          const active =
            pathname === item.href ||
            (item.href !== "/dashboard" && pathname.startsWith(`${item.href}/`));

          return (
            <Link
              className={cn(
                css({
                  alignItems: "center",
                  borderRadius: "button",
                  color: active ? "activeText" : "textMuted",
                  display: "flex",
                  fontSize: "14px",
                  fontWeight: active ? 700 : 600,
                  gap: 3,
                  minH: "touchTarget",
                  textDecoration: "none",
                  transitionDuration: "fast",
                  transitionProperty: "background, color",
                  transitionTimingFunction: "standard",
                  _hover: { bg: "surface", color: "text" }
                }),
                active ? css({ bg: "activeBg" }) : undefined
              )}
              href={item.href}
              key={item.href}
              style={{
                justifyContent: isCollapsed ? "center" : "flex-start",
                paddingInline: isCollapsed ? "0" : "var(--spacing-3)"
              }}
              title={isCollapsed ? item.label : undefined}
            >
              <Icon aria-hidden="true" className={css({ flexShrink: 0, h: 5, w: 5 })} />
              <span style={{ display: isCollapsed ? "none" : "inline" }}>
                {item.label}
              </span>
            </Link>
          );
        })}
      </nav>

      <div
        className={css({
          alignItems: "center",
          borderColor: "border",
          borderTopWidth: "1px",
          display: "flex",
          gap: 2,
          mt: "auto",
          pt: 3
        })}
        style={{ justifyContent: isCollapsed ? "center" : "flex-start" }}
      >
        <div
          aria-hidden="true"
          className={css({
            bg: "surface",
            borderRadius: "pill",
            flexShrink: 0,
            h: 9,
            w: 9
          })}
          style={{ display: isCollapsed ? "none" : "block" }}
        />
        <span
          className={css({
            color: "textMuted",
            minW: 0,
            overflow: "hidden",
            textOverflow: "ellipsis",
            textStyle: "sm",
            whiteSpace: "nowrap"
          })}
          style={{ display: isCollapsed ? "none" : "block" }}
        >
          {email}
        </span>
        <div
          className={css({
            display: "grid",
            placeItems: "center",
            "& svg": { h: 4, w: 4 }
          })}
          style={{ marginLeft: isCollapsed ? "0" : "auto" }}
        >
          {logoutSlot}
        </div>
      </div>
    </aside>
  );
}
