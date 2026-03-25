import { useState, useEffect, useCallback } from "react";
import { AnimatePresence, motion } from "framer-motion";

interface ImageViewerProps {
  src: string;
  alt: string;
  height?: string;
}

export function ImageViewer({ src, alt, height = "30vh" }: ImageViewerProps) {
  const [zoomed, setZoomed] = useState(false);

  const toggleZoom = useCallback(() => setZoomed((z) => !z), []);

  useEffect(() => {
    function handleKeydown(e: KeyboardEvent) {
      if (e.key === "Escape" && zoomed) setZoomed(false);
    }
    window.addEventListener("keydown", handleKeydown);
    return () => window.removeEventListener("keydown", handleKeydown);
  }, [zoomed]);

  return (
    <>
      <div
        className="bg-surface-850 border-b border-surface-700 flex items-center justify-center p-3 overflow-hidden cursor-zoom-in"
        style={{ height, minHeight: "140px" }}
        role="button"
        tabIndex={0}
        onClick={toggleZoom}
        onKeyDown={(e) => e.key === "Enter" && toggleZoom()}
      >
        <img
          src={src}
          alt={alt}
          className="max-w-full max-h-full object-contain select-none"
          draggable={false}
        />
      </div>

      <AnimatePresence>
        {zoomed && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50 bg-black/92 flex items-center justify-center cursor-zoom-out p-8"
            role="button"
            tabIndex={0}
            onClick={toggleZoom}
            onKeyDown={(e) => e.key === "Enter" && toggleZoom()}
          >
            <motion.img
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              src={src}
              alt={alt}
              className="max-w-full max-h-full object-contain select-none"
              draggable={false}
            />
            <div className="absolute top-4 right-4 text-white/50 text-xs font-mono">
              ESC o click para cerrar
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
