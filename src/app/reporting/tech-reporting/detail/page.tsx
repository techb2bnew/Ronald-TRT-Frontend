"use client";

import React, { Suspense } from "react";
import { useSidebar } from "@/app/component/SidebarContext";
import Loading from "@/app/component/loader";
import TechPayDetailView from "../tech-pay-detail";

export default function TechPayDetailPage() {
  const { isCollapsed } = useSidebar();
  return (
    <div className="main-container">
      <div
        className={`right_section ${
          isCollapsed ? "w-full" : "w-[85%]"
        } pl-8 pr-8 ml-auto mt-[7rem] transition-all duration-300`}
      >
        <Suspense
          fallback={
            <div className="flex justify-center py-16">
              <Loading />
            </div>
          }
        >
          <TechPayDetailView />
        </Suspense>
      </div>
    </div>
  );
}
