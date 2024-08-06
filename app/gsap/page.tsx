"use client";

import React, { use, useEffect, useState } from "react";
import gsap from "gsap";
import { useRef } from "react";
import { useGSAP } from "@gsap/react";
import Image from "next/image";
import { ScrollTrigger } from "gsap/ScrollTrigger";
gsap.registerPlugin(useGSAP);
gsap.registerPlugin(ScrollTrigger);

function Gsap() {
  const container = useRef(null);
  const header = useRef(null);
  const body = useRef(null);
  const circles = useRef(null);
  const image = useRef(null);
  const imageContainer = useRef(null);
  const pseudoImageRef = useRef(null);
  const testimonialSectionRef = useRef(null);

  let tl = gsap.timeline();
  const [expand, setExpand] = useState(false);

  //! Use from to set the initial state of the elements
  //! Use to to animate the elements to the desired state
  useGSAP(() => {
    //* Move header up from current state to these state (0 --> x)
    gsap.to(header.current, {
      opacity: 1,
      y: -40,
      ease: "sine",
      duration: 1,
      delay: 0.5,
    });
    //* Move body text up from current state to these state (0 --> x)
    gsap.to(body.current, {
      opacity: 1,
      y: -40,
      ease: "sine",
      duration: 1,
      delay: 1.5,
    });
    //* Move circle from these state to current state (x --> 0)
    gsap.from(".circle", {
      opacity: 0,
      y: 60,
      ease: "sine",
      stagger: 0.2,
      duration: 1,
    });

    //* Use timeline when you want to have a sequence of animations
    tl.to(imageContainer.current, {
      css: { visibility: "visible", display: "block" }, // to avoid flashing
    })
      .to(pseudoImageRef.current, { width: "0%", duration: 1, ease: "sine" }) // to reveal the image by decreasing the width of the pseudo element
      .from(image.current, {
        scale: 1.5,
        duration: 1,
        ease: "sine",
        delay: -1.4, // set it to -1.4 to make it start before the previous animation ends
      }); // on load, scale the image to 1.5 times its size then animate back to 1

    gsap.to(testimonialSectionRef.current, {
      opacity: 1,
      duration: 1,
      scrollTrigger: {
        trigger: testimonialSectionRef.current,
        start: "top center",
        end: "bottom top",
        markers: true,
      },
    });
  }, []);

  function handleToggleExpand(e: any) {
    setExpand((prev) => !prev);
    const size = expand ? 80 : 48;
    gsap.to(e.target, {
      width: size,
      height: size,
      duration: 0.5,
      ease: "sine",
    });
  }

  const testimonials = [
    {
      name: "Julia Cameron",
      title: "Creative Director, VISA",
      image: "/static/slide1.jpg",
      quote:
        "It's all good. I was amazed at the quality of the Design. We've seen amazing results already.",
    },
    {
      name: "Mark Jacobs",
      title: "Tech Lead, Google",
      image: "/static/slide2.jpg",
      quote:
        "The rebranding has really helped our business. Definitely worth the investment.",
    },
    {
      name: "Lisa Bearings",
      title: "Brand Coordinator, Facebook",
      image: "/static/slide3.jpg",
      quote:
        "The service was excellent. Absolutely wonderful! A complete redesign did it for us.",
    },
  ];

  return (
    <div
      className="mt-20 flex h-full w-screen flex-col items-center justify-center border border-blue-500"
      ref={container}
    >
      {/* Text */}
      <div>
        <h1 ref={header} className="text-2xl opacity-0">
          Header
        </h1>
        <p ref={body} className="text-sm opacity-0">
          lorem ipsum
        </p>
      </div>
      {/* Circles */}
      <div className="flex items-center justify-center gap-4" ref={circles}>
        <div
          className="circle size-12 rounded-full bg-red-500"
          onClick={handleToggleExpand}
        />
        <div
          className="circle size-12 rounded-full bg-blue-500"
          onClick={handleToggleExpand}
        />
        <div
          className="circle size-12 rounded-full bg-green-500"
          onClick={handleToggleExpand}
        />
      </div>
      {/* Image Slide Reveal */}
      <section
        className="relative my-8 mb-80 hidden h-[200px] w-[300px] overflow-hidden"
        ref={imageContainer}
      >
        <Image
          src="/static/landscape.jpg"
          width={300}
          height={200}
          alt="landscape"
          ref={image}
        />
        <div className="absolute inset-0 bg-base-100" ref={pseudoImageRef} />
      </section>
      {/* Testimonials */}
      <section className={`relative my-8 bg-red-500`}>
        <div ref={testimonialSectionRef} className="opacity-0">
          <div className="absolute right-0 cursor-pointer text-5xl">
            &#8594;
          </div>
          <div className="absolute left-0 cursor-pointer text-5xl">&#8592;</div>
          <div className="w-[500px]">
            {testimonials.map((testimonial, index) => (
              <div
                key={index}
                className="flex flex-col items-center justify-center gap-4 py-4 text-center"
              >
                <Image
                  src={testimonial.image}
                  width={300}
                  height={200}
                  alt={testimonial.name}
                />
                <div>
                  <h6>{testimonial.name}</h6>
                  <p>{testimonial.title}</p>
                  <p>{testimonial.quote}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}

export default Gsap;
