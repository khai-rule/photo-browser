import { motion } from "framer-motion";
import React from "react";
import ReactCurvedText from "react-curved-text";

// ── Props ────────────────────────────────────────────────────────────────────

interface MenuButtonProps {
  onClick?: () => void;
  isOpen?: boolean;
}

// ── Component ────────────────────────────────────────────────────────────────

function MenuButton({ onClick, isOpen = false }: MenuButtonProps) {
  return (
    <>
      <div className="relative" onClick={onClick} role="button" aria-label="Open navigation menu" aria-expanded={isOpen}>
        <motion.div
          className={[
            "relative size-16 cursor-pointer rounded-full bg-primary drop-shadow-md",
            "transition-shadow duration-300",
            isOpen ? "ring-4 ring-primary/40 ring-offset-2 ring-offset-base-100" : "",
          ].join(" ")}
          initial={{ scale: 1 }}
          animate={isOpen ? { scale: 1.05 } : { scale: 1 }}
          whileHover={{
            scale: 1.1,
            transition: { duration: 0.2 },
          }}
          transition={{ duration: 0.25 }}
        >
          <motion.div
            className="absolute -left-1 -top-1 h-20"
            initial={{ rotate: 90, opacity: 0 }}
            whileHover={{
              rotate: 0,
              transition: { duration: 0.5 },
              opacity: 1,
            }}
            transition={{ delay: 0.5, duration: 0.5 }}
          >
            <div className="-mt-10">
              <ReactCurvedText
                width={80}
                height={80}
                cx={40}
                cy={40}
                rx={20}
                ry={6}
                reversed={true}
                text="Menu"
                textPathProps={{ style: { fill: "#fff" } }}
                textProps={{
                  style: {
                    fontSize: "0.875rem",
                    fontWeight: "500",
                    letterSpacing: "0px",
                  },
                }}
              />
            </div>
          </motion.div>
        </motion.div>
      </div>
    </>
  );
}

export default MenuButton;
