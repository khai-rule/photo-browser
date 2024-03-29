"use client";
import TransitionLink from "@/components/TransitionLink";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { animatePageOut } from "@/animations";

export default function Home() {
  const [inputValue, setInputValue] = useState("");

  const router = useRouter();

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const fileList = event.target.files;
    if (fileList) {
      const uploadedImages = Array.from(fileList).map((file) =>
        URL.createObjectURL(file),
      );

      localStorage.setItem("uploadedImages", JSON.stringify(uploadedImages));
    }

    animatePageOut("/preview", router);
  };

  function handleButtonClick() {
    const parts = inputValue.split("/");
    const folderId = parts[parts.length - 1];

    fetch(`/api/fetch-images/${folderId}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    })
      .then((response) => response.json())
      .then((data) => {
        console.log(data);
        const images = data.map(
          (data: { id: string }) =>
            `https://drive.google.com/thumbnail?id=${data.id}&sz=w1000`,
        );
        localStorage.setItem("uploadedImages", JSON.stringify(images));
        animatePageOut("/preview", router);
      })
      .catch((error) => {
        console.error("Error fetching images:", error);
      });
  }

  return (
    <main className="flex w-full justify-center">
      <div className="flex flex-col">
        <h1>Contact Studio</h1>
        <p>Upload images or type a folder ID to view images</p>
        <div>
          <input
            type="file"
            className="file-input  my-16 max-w-xs "
            onChange={handleFileChange}
            multiple
          />
        </div>
        <div className="flex gap-4">
          <input
            type="text"
            placeholder="Type here"
            className="input input-bordered w-full max-w-xs"
            onChange={(event) => setInputValue(event.target.value)}
          />
          <button className="btn" onClick={handleButtonClick}>
            Submit
          </button>
        </div>
      </div>
    </main>
  );
}
