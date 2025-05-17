'use client'

import { useCursorFillTarget } from "~/features/home/hooks/useCursorFillTarget";
import PureButton, { type Props as PureButtonProps } from "~/shared/components/ui/buttons/PureButton";
import { useRef } from "react";
import styles from "./styles.module.scss";

export interface Props extends PureButtonProps {
  children?: React.ReactNode;
}

export default function InteractiveButton({ children, className, ...props }: Props) {
    const buttonRef = useRef<HTMLButtonElement>(null);
    
    useCursorFillTarget(buttonRef);
  
    return (
      <PureButton
        ref={buttonRef}
        className={`${styles.button} ${className}`}
        {...props}
      >
        {children}
      </PureButton>
    );
  }