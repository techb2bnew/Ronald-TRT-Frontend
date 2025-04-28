// components/ColorSettings.tsx

import { useEffect, useState, useRef } from "react";
import { ChromePicker, ColorResult } from "react-color";

type ColorKeys =  "foreground";

const defaultColors: Record<ColorKeys, string> = { 
  foreground: "#383D71",
};

export default function ColorSettings() {
  const [open, setOpen] = useState(false);
  const [colors, setColors] = useState<Record<ColorKeys, string>>(defaultColors);
  const sidebarRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null); // add button ref


  // Load from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem("themeColors");
    if (stored) {
      const savedColors = JSON.parse(stored);
      setColors(savedColors);
      Object.entries(savedColors).forEach(([key, val]) => {
        if (typeof val === "string") {
          document.documentElement.style.setProperty(`--${key}`, val);
        }
      });
    }
  }, []);
  
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        sidebarRef.current &&
        !sidebarRef.current.contains(event.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(event.target as Node)
      ) {
        setOpen(false);
      }
    };

    if (open) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [open]);

  // Handle color change
  const handleColorChange = (key: ColorKeys, color: ColorResult) => {
    const updated = { ...colors, [key]: color.hex };
    setColors(updated);
    document.documentElement.style.setProperty(`--${key}`, color.hex);
    localStorage.setItem("themeColors", JSON.stringify(updated));
  };



  return (
    <>
      <button
       ref={buttonRef}
        onClick={() => setOpen(!open)}
        className="fixed bottom-4 right-4 bg-[var(--foreground)] text-white px-2 py-2 rounded-full shadow-lg z-50"
      >
      <svg
  xmlns="http://www.w3.org/2000/svg"
  className="w-6 h-6 text-gray-700"
  fill="none"
  viewBox="0 0 24 24"
  stroke="white"
  strokeWidth={1.5}
>
  <path
    strokeLinecap="round"
    strokeLinejoin="round"
    d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.827 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.827-2.37-2.37a1.724 1.724 0 00-1.066-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.827-3.31 2.37-2.37.996.608 2.296.07 2.573-1.066z"
  />
  <path
    strokeLinecap="round"
    strokeLinejoin="round"
    d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
  />
</svg>

      </button>

      {open && (
        <div ref={sidebarRef}  
        className="fixed top-0 right-0 w-80 h-full bg-white shadow-lg p-6 z-40 overflow-auto">
          <h2 className="text-xl font-bold mb-6">Customize Theme</h2>

          {Object.keys(colors).map((key) => (
            <div key={key} className="mb-6">
              <p className="font-semibold capitalize mb-2">{key}</p>
              <ChromePicker
                color={colors[key as ColorKeys]}
                onChangeComplete={(color) => handleColorChange(key as ColorKeys, color)}
              />
            </div>
          ))}
        </div>
      )}
    </>
  );
}
