import { motion } from "framer-motion";
import React from "react";
import ReactCurvedText from "react-curved-text";

function MenuButton() {
  return (
    <>
      <div className="relative">
        <motion.div
          className="relative size-16 cursor-pointer rounded-full bg-primary drop-shadow-md"
          initial={{ scale: 1 }}
          whileHover={{
            scale: 1.1,
            position: "relative",
            transition: { duration: 0.5 },
          }}
          transition={{ delay: 0.5, duration: 0.5 }}
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
