import { Menu, MenuButton, IconButton, MenuList, PlacementWithLogical } from "@chakra-ui/react";
import { ReactElement, ReactNode } from "react";

interface FloatingMenuProps {
    menuIcon: ReactElement,
    children: ReactNode,
    placement?: PlacementWithLogical,
}

export function FloatingMenu({menuIcon, children, placement = "right-end"}:FloatingMenuProps){
    return(
        <Menu isLazy={true} placement={placement}>
            <MenuButton as={IconButton} aria-label="options" icon={menuIcon} h={7} fontSize={"xl"} variant={"ghost"}>
            </MenuButton>
                <MenuList>
                    {children}
                </MenuList>
        </Menu>
    );
}