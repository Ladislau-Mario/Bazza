"use client";

import { useState, useEffect, ImgHTMLAttributes } from "react";
import { Image, ImageProps, Spinner, Center } from "@chakra-ui/react";
import { api } from "@/services/api";

interface AuthImageProps extends Omit<ImageProps, "src"> {
  url?: string;
}

/**
 * Image component that fetches with authentication headers.
 * Needed because <img> tags can't send Authorization headers.
 */
export function AuthImage({ url, ...props }: AuthImageProps) {
  const [blobUrl, setBlobUrl] = useState<string | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!url) return;
    setError(false);
    setBlobUrl(null);

    let revoked = false;
    let objectUrl: string | null = null;

    api
      .get(url, { responseType: "blob" })
      .then((res) => {
        if (revoked) return;
        objectUrl = URL.createObjectURL(res.data);
        setBlobUrl(objectUrl);
      })
      .catch(() => {
        if (!revoked) setError(true);
      });

    return () => {
      revoked = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [url]);

  if (!url || error) {
    return (
      <Image
        src="https://via.placeholder.com/400x180?text=Sem+imagem"
        {...props}
      />
    );
  }

  if (!blobUrl) {
    return (
      <Center h={props.h || "180px"} w={props.w || "100%"}>
        <Spinner size="sm" />
      </Center>
    );
  }

  return <Image src={blobUrl} {...props} />;
}
