"use client";

import React, { use, useEffect, useState } from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import LocomotiveScroll from "locomotive-scroll";

function Preview() {
  const [images, setImages] = useState<string[]>([]);

  useEffect(() => {
    let scroll: LocomotiveScroll | undefined;
    import("locomotive-scroll").then((locomotiveModule) => {
      scroll = new locomotiveModule.default();
    });

    return () => {
      if (scroll) scroll.destroy();
    };
  }, []);

  useEffect(() => {
    const images = localStorage.getItem("uploadedImages");
    if (images) {
      setImages(images ? JSON.parse(images) : ([] as string[]));
    }
  }, []);

  images.sort(() => Math.random() - 0.5);
  const numImages = images.length;
  const quarter = Math.ceil(numImages / 4);
  const firstQuarter = images.slice(0, Math.ceil(numImages * 0.18));
  const secondQuarter = images.slice(
    Math.ceil(numImages * 0.18),
    Math.ceil(numImages * 0.48),
  );
  const thirdQuarter = images.slice(
    Math.ceil(numImages * 0.48),
    Math.ceil(numImages * 0.7),
  );
  const fourthQuarter = images.slice(Math.ceil(numImages * 0.7));

  useEffect(() => {
    let lastTimestamp: number = performance.now();
    let isManualScrolling: boolean = false;
    let requestId: number;
    let timeoutId: any;

    function scrollDown(timestamp: number) {
      const deltaTime = timestamp - lastTimestamp;
      const scrollSpeed = 0.04;
      const scrollAmount = scrollSpeed * deltaTime;

      if (!isManualScrolling) {
        window.scrollBy({
          top: scrollAmount,
          behavior: "smooth",
        });
      }

      lastTimestamp = timestamp;
      requestId = requestAnimationFrame(scrollDown);
    }

    timeoutId = setTimeout(() => {
      requestId = requestAnimationFrame(scrollDown);
    }, 5000);

    window.addEventListener("scroll", () => {
      if (!isManualScrolling) {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => {
          requestId = requestAnimationFrame(scrollDown);
        }, 5000);
      }
    });

    window.addEventListener("wheel", () => {
      isManualScrolling = true;
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        isManualScrolling = false;
      }, 5000);
    });

    return () => {
      window.removeEventListener("scroll", () => {});
      window.removeEventListener("wheel", () => {});
      cancelAnimationFrame(requestId);
      clearTimeout(timeoutId);
    };
  }, []);

  return (
    <main className="flex flex-col">
      <section className="grid w-full grid-cols-4 gap-5 overflow-hidden">
        <div data-scroll data-scroll-speed="7" className="flex flex-col gap-5">
          {firstQuarter.map((image, index) => {
            return (
              <motion.div key={index}>
                <div className="">
                  <Image
                    src={image}
                    alt="Uploaded image"
                    width={900}
                    height={400}
                  />
                </div>
              </motion.div>
            );
          })}
        </div>
        <div
          data-scroll
          data-scroll-speed="10"
          className="flex flex-col  gap-5"
        >
          {secondQuarter.map((image, index) => {
            return (
              <motion.div key={index}>
                <Image
                  src={image}
                  alt="Uploaded image"
                  width={900}
                  height={900}
                />
              </motion.div>
            );
          })}
        </div>
        <div data-scroll-speed="8" className="flex flex-col gap-5">
          {thirdQuarter.map((image, index) => {
            return (
              <motion.div key={index}>
                <Image
                  src={image}
                  alt="Uploaded image"
                  width={900}
                  height={900}
                />
              </motion.div>
            );
          })}
        </div>
        <div data-scroll data-scroll-speed="11" className="flex flex-col gap-5">
          {fourthQuarter.map((image, index) => {
            return (
              <motion.div key={index}>
                <Image
                  src={image}
                  alt="Uploaded image"
                  width={900}
                  height={900}
                />
              </motion.div>
            );
          })}
        </div>
      </section>
    </main>
  );
}

export default Preview;
