"use client";
import React from "react";
import ThemeControl from "./ThemeControl";
import MenuButton from "./MenuButton";

function BottomNav() {
  return (
    <div className="fixed bottom-0 z-40 flex w-full px-4 py-2 ">
      <ThemeControl />
      <div className="absolute bottom-8 left-[50%] -translate-x-[50%]">
        <MenuButton />
      </div>
    </div>
  );
}

export default BottomNav;
