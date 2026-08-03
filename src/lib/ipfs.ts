export async function uploadFileToIPFS(file: File): Promise<string> {
  const apiKey = process.env.NEXT_PUBLIC_PINATA_API_KEY;
  const apiSecret = process.env.NEXT_PUBLIC_PINATA_API_SECRET;

  if (!apiKey || !apiSecret) {
    console.warn("No Pinata API keys found. Mocking IPFS file upload with base64.");
    await new Promise((resolve) => setTimeout(resolve, 1000));
    return new Promise((resolve, reject) => {
      if (typeof window === "undefined") {
        resolve(`QmMockFileCid${Date.now()}`);
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  const url = `https://api.pinata.cloud/pinning/pinFileToIPFS`;
  const data = new FormData();
  data.append("file", file);

  const res = await fetch(url, {
    method: "POST",
    headers: {
      pinata_api_key: apiKey,
      pinata_secret_api_key: apiSecret,
    },
    body: data,
  });
  const resData = await res.json();
  return resData.IpfsHash;
}

export async function uploadMetadataToIPFS(metadata: any): Promise<string> {
  const apiKey = process.env.NEXT_PUBLIC_PINATA_API_KEY;
  const apiSecret = process.env.NEXT_PUBLIC_PINATA_API_SECRET;

  if (!apiKey || !apiSecret) {
    console.warn("No Pinata API keys found. Mocking IPFS metadata upload.");
    await new Promise((resolve) => setTimeout(resolve, 1000));
    return `QmMockMetadataCid${Date.now()}`;
  }

  const url = `https://api.pinata.cloud/pinning/pinJSONToIPFS`;
  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      pinata_api_key: apiKey,
      pinata_secret_api_key: apiSecret,
    },
    body: JSON.stringify(metadata),
  });
  const resData = await res.json();
  return resData.IpfsHash;
}
