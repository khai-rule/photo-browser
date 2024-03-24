"use client";

import React, { useEffect, useState } from "react";
import { themeChange } from "theme-change";
import _ from "lodash";
import { motion } from "framer-motion";

function ThemeControl() {
  const [theme, setTheme] = useState<string>("forest");

  useEffect(() => {
    themeChange(false);
    const storedTheme = localStorage.getItem("theme");
    if (storedTheme) {
      setTheme(storedTheme);
    }
  }, []);

  return (
    <div className="dropdown dropdown-top dropdown-hover">
      <div
        tabIndex={0}
        role="button"
        className="btn m-1 border-0 bg-transparent text-primary hover:bg-transparent"
      >
        {_.capitalize(theme)}
        <motion.svg
          width="12px"
          height="12px"
          className="inline-block h-2 w-2 fill-current opacity-60"
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 2048 2048"
        >
          <path d="M1799 349l242 241-1017 1017L7 590l242-241 775 775 775-775z"></path>
        </motion.svg>
      </div>
      <ul
        tabIndex={0}
        className="dropdown-content z-[1] w-52 rounded-box bg-base-300 p-2 shadow-2xl"
      >
        <li>
          <input
            onClick={() => setTheme("forest")}
            data-set-theme="forest"
            type="radio"
            name="theme-dropdown"
            className="theme-controller btn btn-ghost btn-sm btn-block justify-start"
            aria-label="Forest"
            value="forest"
          />
        </li>
        <li>
          <input
            onClick={() => setTheme("retro")}
            data-set-theme="retro"
            type="radio"
            name="theme-dropdown"
            className="theme-controller btn btn-ghost btn-sm btn-block justify-start"
            aria-label="Retro"
            value="retro"
          />
        </li>
        <li>
          <input
            onClick={() => setTheme("valentine")}
            data-set-theme="valentine"
            type="radio"
            name="theme-dropdown"
            className="theme-controller btn btn-ghost btn-sm btn-block justify-start"
            aria-label="Valentine"
            value="valentine"
          />
        </li>
        <li>
          <input
            onClick={() => setTheme("aqua")}
            data-set-theme="aqua"
            type="radio"
            name="theme-dropdown"
            className="theme-controller btn btn-ghost btn-sm btn-block justify-start"
            aria-label="Aqua"
            value="aqua"
          />
        </li>
        <li>
          <input
            onClick={() => setTheme("synthwave")}
            data-set-theme="synthwave"
            type="radio"
            name="theme-dropdown"
            className="theme-controller btn btn-ghost btn-sm btn-block justify-start"
            aria-label="Synthwave"
            value="synthwave"
          />
        </li>
      </ul>
    </div>
  );
}

export default ThemeControl;
