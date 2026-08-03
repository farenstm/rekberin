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

  const cid = src.replace("ipfs://", "");
  const currentUrl = (src.startsWith("blob:") || src.startsWith("data:")) ? src : `${GATEWAYS[gatewayIndex]}${cid}`;

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
