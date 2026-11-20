"use client";

import * as React from "react";
import Link from "next/link";
import { ChevronRight, Home } from "lucide-react";

export interface BreadcrumbItem {
  label: string;
  href?: string;
  isCurrent?: boolean;
}

export interface BreadcrumbProps {
  items: BreadcrumbItem[];
  className?: string;
}

export function Breadcrumb({ items, className = "" }: BreadcrumbProps) {
  if (!items || items.length === 0) {
    return null;
  }

  // If first item is Dashboard, the Home icon represents it
  const hasDashboardFirst = items[0]?.href === "/dashboard" || items[0]?.label === "Dashboard";
  const displayItems = hasDashboardFirst ? items.slice(1) : items;

  return (
    <nav
      aria-label="Breadcrumb"
      className={`flex items-center text-xs font-medium text-slate-500 dark:text-slate-400 overflow-x-auto no-scrollbar py-1 ${className}`}
    >
      <ol className="flex items-center space-x-1.5 whitespace-nowrap">
        <li>
          <Link
            href="/dashboard"
            className="flex items-center text-slate-400 hover:text-slate-700 dark:text-slate-500 dark:hover:text-slate-200 transition-colors p-1 rounded-md"
            aria-label="Dashboard Home"
          >
            <Home className="h-3.5 w-3.5" />
          </Link>
        </li>

        {displayItems.map((item, index) => {
          const isLast = index === displayItems.length - 1 || item.isCurrent;

          return (
            <li key={index} className="flex items-center space-x-1.5">
              <ChevronRight className="h-3 w-3 text-slate-400 dark:text-slate-600 flex-shrink-0" />
              {isLast ? (
                <span
                  className="font-semibold text-slate-800 dark:text-slate-100 max-w-[200px] xl:max-w-xs truncate"
                  aria-current="page"
                >
                  {item.label}
                </span>
              ) : item.href ? (
                <Link
                  href={item.href}
                  className="hover:text-slate-800 dark:hover:text-slate-200 transition-colors"
                >
                  {item.label}
                </Link>
              ) : (
                <span>{item.label}</span>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
