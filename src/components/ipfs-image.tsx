"use client";

import { useState } from "react";

const GATEWAYS = [
  "https://gateway.pinata.cloud/ipfs/",
  "https://ipfs.io/ipfs/",
  "https://cloudflare-ipfs.com/ipfs/",
  "https://dweb.link/ipfs/"
];

export function IPFSImage({ src, alt, className }: { src: string; alt?: string; className?: string }) {
  const [gatewayIndex, setGatewayIndex] = useState(0);

  if (!src) return null;

  const normalizedSrc = src.replace(/^ipfs:\/\//, "");
  const isDirectUrl = /^(blob:|data:|https?:\/\/)/.test(normalizedSrc);
  const currentUrl = isDirectUrl
    ? normalizedSrc
    : `${GATEWAYS[gatewayIndex]}${normalizedSrc}`;

  const handleError = () => {
    if (gatewayIndex < GATEWAYS.length - 1) {
      setGatewayIndex((prev) => prev + 1);
    }
  };

  return (
    <img 
      key={currentUrl}
      src={currentUrl} 
      alt={alt || "IPFS Image"} 
      className={className} 
      onError={handleError} 
    />
  );
}
