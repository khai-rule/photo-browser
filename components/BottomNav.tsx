"use client";

import React, { useState } from "react";
import ThemeControl from "./ThemeControl";
import MenuButton from "./MenuButton";
import NavDrawer from "./NavDrawer";

function BottomNav() {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  return (
    <>
      <div data-chrome="bottomnav" className="fixed bottom-0 z-40 flex w-full px-4 py-2">
        <ThemeControl />
        <div className="absolute bottom-8 left-[50%] -translate-x-[50%]">
          <MenuButton
            onClick={() => setIsDrawerOpen((prev) => !prev)}
            isOpen={isDrawerOpen}
          />
        </div>
      </div>

      {/* Nav drawer renders above everything else (z-[60]) */}
      <NavDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
      />
    </>
  );
}

export default BottomNav;
