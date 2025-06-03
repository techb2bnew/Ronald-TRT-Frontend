"use client";

import React, { useRef, useEffect, MutableRefObject, useState } from "react";
import "../../../../../dynamsoft.config"; // import side effects. The license, engineResourcePath, so on.
import { EnumCapturedResultItemType } from "dynamsoft-core";
import { BarcodeResultItem } from "dynamsoft-barcode-reader";
import { CaptureVisionRouter } from "dynamsoft-capture-vision-router"; 

function ImageCapture({ onScan }: { onScan: (vin: string) => void }) {
  const [resultText, setResultText] = useState("");
  const [image, setImage] = useState<string | null>(null);

  let pCvRouter: MutableRefObject<Promise<CaptureVisionRouter> | null> = useRef(null);
  let isDestroyed = useRef(false);
const cleanVin = (vin: string) => {
  if (!vin) return vin;

  // Remove first char if it is i, o, q (case insensitive)
  if (/^[ioq]/i.test(vin)) {
    vin = vin.substring(1);
  }

  // Remove everything after first comma (including comma)
  const commaIndex = vin.indexOf(",");
  if (commaIndex !== -1) {
    vin = vin.substring(0, commaIndex);
  }

  return vin.trim();
};

const captureImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
  let files = [...(e.target.files as any as File[])];
  e.target.value = ""; // reset input
 if (files.length > 0) {
      // Show preview of first selected image
      const fileUrl = URL.createObjectURL(files[0]);
      setImage(fileUrl);
    } else {
      setImage(null);
    }
  try {
    const cvRouter = await (pCvRouter.current = pCvRouter.current || CaptureVisionRouter.createInstance());
    if (isDestroyed.current) return;

    for (let file of files) {
      const result = await cvRouter.capture(file, "ReadBarcodes_ReadRateFirst");
      if (isDestroyed.current) return;

      let _resultText = "";
      if (files.length > 1) {
        _resultText += `\n${file.name}:\n`;
      }

      for (let _item of result.items) {
        if (_item.type !== EnumCapturedResultItemType.CRIT_BARCODE) continue;
        let item = _item as BarcodeResultItem;

        // Clean the scanned VIN here
        const cleanedVin = cleanVin(item.text);

        _resultText += cleanedVin + "\n";
      }

      if (!result.items.length) _resultText = "No barcode found";

      setResultText(_resultText);
      onScan(_resultText.trim());
    }
  } catch (ex: any) {
    let errMsg = ex.message || ex;
    console.error(errMsg);
    alert(errMsg);
  }
};


  useEffect((): any => {
    // In 'development', React runs setup and cleanup one extra time before the actual setup in Strict Mode.
    isDestroyed.current = false;

    // componentWillUnmount. dispose cvRouter when it's no longer needed
    return () => {
      isDestroyed.current = true;
      if (pCvRouter.current) {
        pCvRouter.current.then((cvRouter) => {
          cvRouter.dispose();
        }).catch((_) => { })
      }
       if (image) {
        URL.revokeObjectURL(image);
      }
    };
  }, []);

  return (
    <div>
        <input type="file" className="hidden" id="fileInput"  accept=".jpg,.jpeg,.icon,.gif,.svg,.webp,.png,.bmp" onChange={captureImage} />
         {image && (
        <div className="relative w-48 h-auto">
          <img
            src={image}
            alt="Uploaded VIN"
            className="border rounded-lg shadow object-contain max-w-full max-h-64"
          />
          <button
            type="button"
            onClick={() => {
              URL.revokeObjectURL(image); // free memory
              setImage(null);
              setResultText("");
              onScan("");
            }}
            className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center hover:bg-red-600"
            aria-label="Remove uploaded image"
          >
            ✕
          </button>
        </div>
      )}
       {/* <div className="results">{resultText}</div> */}
       </div>
  );
}

export default ImageCapture;
