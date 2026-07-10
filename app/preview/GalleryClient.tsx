"use client";

import React, { useState } from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import LazyLoad from "react-lazy-load";
import InfiniteScroll from "react-infinite-scroll-component";

interface GalleryClientProps {
  /** Full shuffled list of image URLs, pre-fetched by the server component */
  initialImages: string[];
}

export default function GalleryClient({ initialImages }: GalleryClientProps) {
  const [visibleCount, setVisibleCount] = useState<number>(20);

  function fetchMore() {
    setVisibleCount((prev) => Math.min(prev + 20, initialImages.length));
  }

  const images = initialImages.slice(0, visibleCount);
  const totalImages = images.length;
  const hasMore = visibleCount < initialImages.length;

  // Distribute into four columns using the same proportions as before
  const firstColumnCount = Math.ceil(totalImages * 0.22);
  const secondColumnCount = Math.ceil(totalImages * 0.28);
  const thirdColumnCount = Math.ceil(totalImages * 0.18);

  return (
    <div>
      {initialImages.length === 0 ? (
        <p className="mt-32 text-center opacity-50">
          No images yet. Upload some from the home page.
        </p>
      ) : (
        <InfiniteScroll
          dataLength={images.length}
          next={fetchMore}
          hasMore={hasMore}
          loader={<h4 className="col-span-4 py-8 text-center">Loading…</h4>}
          className="grid grid-cols-4 gap-5"
        >
          {/* Column 1 */}
          <div className="flex flex-col gap-4">
            {images.slice(0, firstColumnCount).map((image, index) => (
              <motion.div
                key={index}
                className="flex aspect-[2/3] justify-center overflow-hidden"
              >
                <LazyLoad>
                  <Image
                    src={image}
                    alt="Gallery image"
                    width={900}
                    height={400}
                    className="h-full w-full object-cover"
                    unoptimized
                  />
                </LazyLoad>
              </motion.div>
            ))}
          </div>

          {/* Column 2 */}
          <div className="flex flex-col gap-4">
            {images
              .slice(firstColumnCount, firstColumnCount + secondColumnCount)
              .map((image, index) => (
                <motion.div
                  key={index + firstColumnCount}
                  className="flex aspect-[2/3] justify-center overflow-hidden"
                >
                  <LazyLoad>
                    <Image
                      src={image}
                      alt="Gallery image"
                      width={900}
                      height={400}
                      className="h-full w-full object-cover"
                      unoptimized
                    />
                  </LazyLoad>
                </motion.div>
              ))}
          </div>

          {/* Column 3 */}
          <div className="flex flex-col gap-4">
            {images
              .slice(
                firstColumnCount + secondColumnCount,
                firstColumnCount + secondColumnCount + thirdColumnCount,
              )
              .map((image, index) => (
                <motion.div
                  key={index + firstColumnCount + secondColumnCount}
                  className="flex aspect-[2/3] justify-center overflow-hidden"
                >
                  <LazyLoad>
                    <Image
                      src={image}
                      alt="Gallery image"
                      width={900}
                      height={400}
                      className="h-full w-full object-cover"
                      unoptimized
                    />
                  </LazyLoad>
                </motion.div>
              ))}
          </div>

          {/* Column 4 */}
          <div className="flex flex-col gap-4">
            {images
              .slice(firstColumnCount + secondColumnCount + thirdColumnCount)
              .map((image, index) => (
                <motion.div
                  key={
                    index + firstColumnCount + secondColumnCount + thirdColumnCount
                  }
                  className="flex aspect-[2/3] justify-center overflow-hidden"
                >
                  <LazyLoad>
                    <Image
                      src={image}
                      alt="Gallery image"
                      width={900}
                      height={400}
                      className="h-full w-full object-cover"
                      unoptimized
                    />
                  </LazyLoad>
                </motion.div>
              ))}
          </div>
        </InfiniteScroll>
      )}
    </div>
  );
}
