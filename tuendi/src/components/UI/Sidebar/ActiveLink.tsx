"use client"

import Link, { LinkProps } from "next/link";
import { usePathname } from "next/navigation";
import { cloneElement, isValidElement, ReactElement, ReactNode } from "react";

interface ActiveLinkProps extends LinkProps{
    children: ReactNode,
}

export function ActiveLink({children, ...rest}: ActiveLinkProps){

    const asPath = usePathname();

    let isActive = false;

    if(asPath.startsWith(String(rest.href)) || asPath.startsWith(String(rest.as))){
        isActive = true;
    }

    return(
        <Link {...rest} suppressHydrationWarning>
            {isValidElement(children)
                ? cloneElement(children as ReactElement<any>, {
                    color: isActive ? "text.primary" : "text.muted",
                    borderLeftWidth: isActive ? "4px" : "0",
                    borderLeftStyle: isActive ? "solid" : "none",
                    borderLeftColor: isActive ? "brand.500" : "none",
                    backgroundColor: isActive ? "rgba(155, 155, 155, 0.1)" : "transparent",
                    padding: isActive ? "0.5rem 1rem" : "0.5rem 1rem",
                })
                : children}
        </Link>
    );
}