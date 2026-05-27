"use client";

import { Image, ImageProps, Spinner, Center } from "@chakra-ui/react";
import { useEffect, useState } from "react";

interface AuthImageProps extends Omit<ImageProps, "src"> {
  src?: string;
}

export function AuthImage({ src, fallbackSrc, ...rest }: AuthImageProps) {
  const [dataUrl, setDataUrl] = useState<string | null>(() => {
    if (!src) return null;
    try {
      const cached = sessionStorage.getItem(`authimg_${src}`);
      return cached || null;
    } catch {
      return null;
    }
  });
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!src) return;
    let cancelled = false;
    setError(false);

    // Check sessionStorage first
    try {
      const cached = sessionStorage.getItem(`authimg_${src}`);
      if (cached) {
        setDataUrl(cached);
        return;
      }
    } catch {}

    setDataUrl(null);

    const token = typeof window !== "undefined" ? localStorage.getItem("baza_admin_token") : null;

    fetch(src, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    })
      .then((res) => {
        if (!res.ok) throw new Error(`${res.status}`);
        return res.blob();
      })
      .then((blob) => {
        if (cancelled) return;
        const reader = new FileReader();
        reader.onloadend = () => {
          if (!cancelled) {
            const result = reader.result as string;
            setDataUrl(result);
            try {
              sessionStorage.setItem(`authimg_${src}`, result);
            } catch {}
          }
        };
        reader.readAsDataURL(blob);
      })
      .catch(() => {
        if (!cancelled) setError(true);
      });

    return () => {
      cancelled = true;
    };
  }, [src]);

  if (!src || error) {
    return <Image src={fallbackSrc} fallbackSrc={fallbackSrc} {...rest} />;
  }

  if (!dataUrl) {
    return (
      <Center w={rest.w || rest.width} h={rest.h || rest.height}>
        <Spinner size="sm" />
      </Center>
    );
  }

  return <Image src={dataUrl} {...rest} />;
}
