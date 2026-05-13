"use client";

import React from "react";
import { useSidebar } from "@/app/component/SidebarContext";
import TechView from "./view";

export default function TechViewPage() {
  const { isCollapsed } = useSidebar();
  return (
    <div className="main-container">
      <div
        className={`right_section ${
          isCollapsed ? "w-full" : "w-[85%]"
        } pl-8 pr-8 ml-auto mt-[7rem] transition-all duration-300`}
      >
        <TechView />
      </div>
    </div>
  );
}
