import type { SharedValue } from "react-native-reanimated";

export interface ExtendedDialogContextType {
  isOpen: boolean;
  setIsOpen: (value: boolean) => void;
  closeDialog: () => void;
  animationProgress: SharedValue<number>;
}

export interface DialogProps {
  children: React.ReactNode;
}

export interface DialogTriggerProps {
  children: React.ReactNode;
  asChild?: boolean;
}

export interface DialogBackdropProps {
  children?: React.ReactNode;
  blurAmount?: number;
  backgroundColor?: string;
  blurType?: "dark" | "light" | "default";
}

export interface DialogContentProps {
  children: React.ReactNode;
  onClose?: () => void;
}

export interface ExtendedDialogContentProps extends DialogContentProps {
  isAnimating?: boolean;
  setIsAnimating?: (value: boolean) => void;
}

export interface DialogCloseProps {
  children: React.ReactNode;
  asChild?: boolean;
}

export interface DialogComponent extends React.FC<DialogProps> {
  Trigger: React.FC<DialogTriggerProps>;
  Content: React.FC<DialogContentProps>;
  Close: React.FC<DialogCloseProps>;
  Backdrop: React.FC<DialogBackdropProps>;
}