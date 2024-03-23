"use client";

import React, { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import LocomotiveScroll from "locomotive-scroll";

function Photos() {
  const locomotiveScroll = new LocomotiveScroll();
  const [images, setImages] = useState<string[]>([]);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const fileList = event.target.files;
    if (fileList) {
      const uploadedImages = Array.from(fileList).map((file) =>
        URL.createObjectURL(file),
      );
      setImages((prevImages) => [...prevImages, ...uploadedImages]);
    }
  };

  images.sort(() => Math.random() - 0.5);
  const numImages = images.length;
  const quarter = Math.ceil(numImages / 4);
  const firstQuarter = images.slice(0, quarter);
  const secondQuarter = images.slice(quarter, quarter * 2);
  const thirdQuarter = images.slice(quarter * 2, quarter * 3);
  const fourthQuarter = images.slice(quarter * 3);

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
      {images.length === 0 && (
        <div className="flex w-full justify-center">
          <input
            type="file"
            className="file-input  my-16 max-w-xs "
            onChange={handleFileChange}
            multiple
          />
        </div>
      )}
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

export default Photos;
