"use client";

import React, { use, useEffect, useState } from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import LazyLoad from "react-lazy-load";
import _ from "lodash";
import InfiniteScroll from "react-infinite-scroll-component";

function Preview() {
  const [images, setImages] = useState<string[]>([]);
  const [firstColumn, setFirstColumn] = useState<string[]>([]);
  const [secondColumn, setSecondColumn] = useState<string[]>([]);
  const [thirdColumn, setThirdColumn] = useState<string[]>([]);
  const [fourthColumn, setFourthColumn] = useState<string[]>([]);

  const scrollSpeeds = {
    firstColumn: 8,
    secondColumn: 11,
    thirdColumn: 7,
    fourthColumn: 10,
  };

  useEffect(() => {
    // let scroll: LocomotiveScroll | undefined;
    // import("locomotive-scroll").then((locomotiveModule) => {
    //   scroll = new locomotiveModule.default();
    // });

    const images = localStorage.getItem("uploadedImages");
    if (images) {
      setImages(images ? JSON.parse(images) : ([] as string[]));
    }

    // return () => {
    //   if (scroll) scroll.destroy();
    // };
  }, []);

  // useEffect(() => {
  //   images.sort(() => Math.random() - 0.5);
  //   const firstColumnEnd = Math.floor(images.length * 0.22); // 22%
  //   const secondColumnEnd = Math.floor(images.length * 0.5); // 28%
  //   const thirdColumnEnd = Math.floor(images.length * 0.68); // 18%
  //   setFirstColumn(images.slice(0, firstColumnEnd));
  //   setSecondColumn(images.slice(firstColumnEnd, secondColumnEnd));
  //   setThirdColumn(images.slice(secondColumnEnd, thirdColumnEnd));
  //   setFourthColumn(images.slice(thirdColumnEnd));
  // }, [images]);

  // Slice the images array based on the number of images per column
  // let secondColumn, thirdColumn, fourthColumn;
  // setFirstColumn(images.slice(0, firstColumnEnd));
  // secondColumn = images.slice(firstColumnEnd, secondColumnEnd);
  // thirdColumn = images.slice(secondColumnEnd, thirdColumnEnd);
  // fourthColumn = images.slice(thirdColumnEnd, fourthColumnEnd);

  // useEffect(() => {
  //   let lastTimestamp = performance.now();
  //   let isManualScrolling = false;
  //   let requestId: number;
  //   let timeoutId: any;

  //   function scrollDown(timestamp: number) {
  //     const deltaTime = timestamp - lastTimestamp;
  //     const scrollSpeed = 0.04;
  //     const scrollAmount = scrollSpeed * deltaTime;

  //     if (!isManualScrolling) {
  //       window.scrollBy({
  //         top: scrollAmount,
  //         behavior: "smooth",
  //       });
  //     }

  //     lastTimestamp = timestamp;
  //     requestId = requestAnimationFrame(scrollDown);
  //   }

  //   const handleScroll = _.debounce(() => {
  //     if (!isManualScrolling) {
  //       clearTimeout(timeoutId);
  //       timeoutId = setTimeout(() => {
  //         requestId = requestAnimationFrame(scrollDown);
  //       }, 4000);
  //     }
  //   }, 100);

  //   const handleWheel = _.debounce(() => {
  //     isManualScrolling = true;
  //     clearTimeout(timeoutId);
  //     timeoutId = setTimeout(() => {
  //       isManualScrolling = false;
  //     }, 4000);
  //   }, 100);

  //   window.addEventListener("scroll", handleScroll, { passive: true });
  //   window.addEventListener("wheel", handleWheel, { passive: true });

  //   return () => {
  //     window.removeEventListener("scroll", handleScroll);
  //     window.removeEventListener("wheel", handleWheel);
  //     cancelAnimationFrame(requestId);
  //     clearTimeout(timeoutId);
  //   };
  // }, []);

  function fetchFirstColumn() {
    setFirstColumn((prevItems) => [...prevItems, ...firstColumn]);
  }
  function fetchSecondColumn() {
    setSecondColumn((prevItems) => [...prevItems, ...secondColumn]);
  }
  function fetchThirdColumn() {
    setThirdColumn((prevItems) => [...prevItems, ...thirdColumn]);
  }
  function fetchFourthColumn() {
    setFourthColumn((prevItems) => [...prevItems, ...fourthColumn]);
  }
  function fetchAll() {
    images.sort(() => Math.random() - 0.5);
    setImages((prevItems) => [...prevItems, ...images]);
  }

  const totalImages = images.length;

  // Calculate the number of images for each column
  images.sort(() => Math.random() - 0.5);
  const firstColumnCount = Math.ceil(totalImages * 0.22);
  const secondColumnCount = Math.ceil(totalImages * 0.28);
  const thirdColumnCount = Math.ceil(totalImages * 0.18);
  const fourthColumnCount =
    totalImages - (firstColumnCount + secondColumnCount + thirdColumnCount);

  return (
    <div>
      <InfiniteScroll
        dataLength={images.length}
        next={fetchAll}
        hasMore={true}
        loader={<h4>Loading...</h4>}
        className="grid grid-cols-4 gap-5"
      >
        {/* Render images for the first column */}
        <div className="flex flex-col gap-4">
          {images.slice(0, firstColumnCount).map((image, index) => (
            <motion.div
              key={index}
              className="flex aspect-[2/3] justify-center overflow-hidden"
            >
              <LazyLoad>
                <Image
                  src={image}
                  alt="Uploaded image"
                  width={900}
                  height={400}
                  className="h-full w-full object-cover"
                />
              </LazyLoad>
            </motion.div>
          ))}
        </div>

        {/* Render images for the second column */}
        <div className="flex flex-col gap-4">
          {images
            .slice(firstColumnCount, firstColumnCount + secondColumnCount)
            .map((image, index) => (
              <motion.div
                key={index + firstColumnCount} // Add offset to key to avoid collisions
                className="flex aspect-[2/3] justify-center overflow-hidden"
              >
                <LazyLoad>
                  <Image
                    src={image}
                    alt="Uploaded image"
                    width={900}
                    height={400}
                    className="h-full w-full object-cover"
                  />
                </LazyLoad>
              </motion.div>
            ))}
        </div>

        {/* Render images for the third column */}
        <div className="flex flex-col gap-4">
          {images
            .slice(
              firstColumnCount + secondColumnCount,
              firstColumnCount + secondColumnCount + thirdColumnCount,
            )
            .map((image, index) => (
              <motion.div
                key={index + firstColumnCount + secondColumnCount} // Add offset to key
                className="flex aspect-[2/3] justify-center overflow-hidden"
              >
                <LazyLoad>
                  <Image
                    src={image}
                    alt="Uploaded image"
                    width={900}
                    height={400}
                    className="h-full w-full object-cover"
                  />
                </LazyLoad>
              </motion.div>
            ))}
        </div>

        {/* Render images for the fourth column */}
        <div className="flex flex-col gap-4">
          {images
            .slice(firstColumnCount + secondColumnCount + thirdColumnCount)
            .map((image, index) => (
              <motion.div
                key={
                  index +
                  firstColumnCount +
                  secondColumnCount +
                  thirdColumnCount
                } // Add offset to key
                className="flex aspect-[2/3] justify-center overflow-hidden"
              >
                <LazyLoad>
                  <Image
                    src={image}
                    alt="Uploaded image"
                    width={900}
                    height={400}
                    className="h-full w-full object-cover"
                  />
                </LazyLoad>
              </motion.div>
            ))}
        </div>
      </InfiniteScroll>
    </div>
    /* <main className="grid grid-cols-4 gap-5">
      <div data-scroll-speed={scrollSpeeds.firstColumn} data-scroll>
        <InfiniteScroll
          dataLength={firstColumn.length}
          next={fetchFirstColumn}
          hasMore={true}
          loader={<h4>Loading...</h4>}
          className="flex flex-col gap-5"
        >
          {firstColumn?.map((image, index) => {
            return (
              <motion.div
                key={index}
                className="flex aspect-[2/3] justify-center overflow-hidden"
              >
                <LazyLoad>
                  <Image
                    src={image}
                    alt="Uploaded image"
                    width={900}
                    height={400}
                    className="h-full w-full object-cover"
                  />
                </LazyLoad>
              </motion.div>
            );
          })}
        </InfiniteScroll>
      </div>

      <div data-scroll data-scroll-speed={scrollSpeeds.secondColumn}>
        <InfiniteScroll
          dataLength={secondColumn.length}
          next={fetchSecondColumn}
          hasMore={true}
          loader={<h4>Loading...</h4>}
          className="flex flex-col gap-5"
        >
          {secondColumn?.map((image, index) => {
            return (
              <motion.div
                key={index}
                className="flex aspect-[2/3] justify-center overflow-hidden"
              >
                <LazyLoad>
                  <Image
                    src={image}
                    alt="Uploaded image"
                    width={900}
                    height={400}
                    className="h-full w-full object-cover"
                  />
                </LazyLoad>
              </motion.div>
            );
          })}
        </InfiniteScroll>
      </div>

      <div data-scroll data-scroll-speed={scrollSpeeds.thirdColumn}>
        <InfiniteScroll
          dataLength={thirdColumn.length}
          next={fetchThirdColumn}
          hasMore={true}
          loader={<h4>Loading...</h4>}
          className="flex flex-col gap-5"
        >
          {thirdColumn?.map((image, index) => {
            return (
              <motion.div
                key={index}
                className="flex aspect-[2/3] justify-center overflow-hidden"
              >
                <LazyLoad>
                  <Image
                    src={image}
                    alt="Uploaded image"
                    width={900}
                    height={900}
                    className="h-full w-full object-cover"
                  />
                </LazyLoad>
              </motion.div>
            );
          })}
        </InfiniteScroll>
      </div>

      <div data-scroll data-scroll-speed={scrollSpeeds.fourthColumn}>
        <InfiniteScroll
          dataLength={fourthColumn.length}
          next={fetchFourthColumn}
          hasMore={true}
          loader={<h4>Loading...</h4>}
          className="flex flex-col gap-5"
        >
          {fourthColumn?.map((image, index) => {
            return (
              <motion.div
                key={index}
                className="flex aspect-[2/3] justify-center overflow-hidden"
              >
                <LazyLoad>
                  <Image
                    src={image}
                    alt="Uploaded image"
                    width={900}
                    height={900}
                    className="h-full w-full object-cover"
                  />
                </LazyLoad>
              </motion.div>
            );
          })}
        </InfiniteScroll>
      </div> 
     </main> */
  );
}

export default Preview;
