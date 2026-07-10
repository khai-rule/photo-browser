"use client";

import { ReactLenis, useLenis } from "@studio-freight/react-lenis";
import { ReactNode } from "react";

function SmoothScroll({ children }: { children: ReactNode }) {
  //   const lenis = useLenis(({ scroll }) => {
  //     // called every scroll
  //   });

  return (
    <ReactLenis options={{ lerp: 0.04 }} root>
      {children}
    </ReactLenis>
  );
}

export default SmoothScroll;
