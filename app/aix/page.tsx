"use client";

import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { useEffect, useRef } from "react";
import { ScrollTrigger } from "gsap/ScrollTrigger";
gsap.registerPlugin(useGSAP);
gsap.registerPlugin(ScrollTrigger);

function AIX() {
  const aRef = useRef(null);
  const iRef = useRef(null);
  const xRef = useRef(null);
  const aixRef = useRef(null);

  let frameCount = 124,
    urls = new Array(frameCount).fill(null).map(
      (o, i) =>
        `http://localhost:3000/static/aix/Happiness-Sequence_v01/Happiness_v01_${(i + 1).toString().padStart(5, "0")}.png`,
      // `https://www.apple.com/105/media/us/airpods-pro/2019/1299e2f5_9206_4470_b28e_08307a42f19b/anim/sequence/large/01-hero-lightpass/${(i + 1).toString().padStart(4, "0")}.jpg`,
    );
  useEffect(() => {
    console.log("sa", document.getElementById("image-sequence"));
    imageSequence({
      urls, // Array of image URLs
      canvas: "#image-sequence", // <canvas> object to draw images to
      //clear: true, // only necessary if your images contain transparency
      //onUpdate: (index, image) => console.log("drew image index", index, ", image:", image),
      scrollTrigger: {
        start: 0, // start at the very top
        end: "max", // entire page
        scrub: true, // important!
      },
    });
  }, [urls]);

  // useGSAP(() => {
  //   gsap.to(aRef.current, {
  //     transform: "scaleX(-1)",
  //     scrollTrigger: {
  //       trigger: aixRef.current,
  //       start: "center center",
  //       end: "bottom center",
  //       scrub: true,
  //       markers: true,
  //     },
  //   });
  //   gsap.to(iRef.current, {
  //     rotation: -180,
  //     scrollTrigger: {
  //       trigger: aixRef.current,
  //       start: "center center",
  //       end: "bottom center",
  //       scrub: true,
  //       markers: true,
  //     },
  //   });
  //   gsap.to(xRef.current, {
  //     rotation: 180,
  //     scrollTrigger: {
  //       trigger: aixRef.current,
  //       start: "center center",
  //       end: "bottom center",
  //       scrub: true,
  //       markers: true,
  //     },
  //   });
  // }, []);
  return (
    <main className="h-[1000vh] bg-green-200">
      <section className="h-[400vh]">
        <canvas
          id="image-sequence"
          className="sticky left-[50%] top-0 h-screen max-h-[100vh] w-auto max-w-[100vw] -translate-x-[50%] object-cover"
        />
      </section>
      {/* <section className="relative h-[200vh] bg-pink-200">
        <div className="sticky top-0 flex border border-red-500">
          <div
            className="flex h-screen w-full items-center justify-center gap-8"
            ref={aixRef}
          >
            <h1 ref={aRef}>A</h1>
            <h1 ref={iRef} className="border border-red-500">
              I
            </h1>
            <h1 ref={xRef}>X</h1>
          </div>
        </div>
      </section> */}
    </main>
  );
}

export default AIX;

function imageSequence(config) {
  let playhead = { frame: 0 },
    canvas =
      gsap.utils.toArray(config?.canvas)[0] ||
      console.warn("canvas not defined"),
    ctx = canvas?.getContext("2d"),
    curFrame = -1,
    onUpdate = config.onUpdate,
    images,
    updateImage = () => {
      let frame = Math.round(playhead.frame);
      if (frame !== curFrame) {
        // only draw if necessary
        config.clear && ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx?.drawImage(images[Math.round(playhead.frame)], 0, 0);
        curFrame = frame;
        onUpdate && onUpdate.call(this, frame, images[frame]);
      }
    };
  images = config.urls.map((url, i) => {
    let img = new Image();
    img.src = url;
    i || (img.onload = updateImage);
    return img;
  });
  console.log(gsap.utils.toArray(config?.canvas)[0]);
  return gsap.to(playhead, {
    frame: images.length - 1,
    ease: "none",
    onUpdate: updateImage,
    duration: images.length / (config.fps || 30),
    paused: !!config.paused,
    scrollTrigger: config.scrollTrigger,
  });
}
