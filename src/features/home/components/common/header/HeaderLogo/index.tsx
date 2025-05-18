"use client";

import { useCursorFillTarget } from "~/features/home/hooks/useCursorFillTarget";
import { useRef } from "react";
import Logo from "~/shared/components/common/Logo";
import PureButton from "~/shared/components/ui/buttons/PureButton";
import { useCursorOutlineTarget } from "~/features/home/hooks/useCursorOutlineTarget";
import styles from "./styles.module.scss";

export interface Props {
  className?: string;
}

export default function HeaderLogo({ className = "" }: Props) {
    const ref = useRef<HTMLAnchorElement>(null)

  useCursorOutlineTarget(ref);

  return (
    <PureButton label="Главная" href="/" className={`${styles.headerLogo} ${className}`} ref={ref}>
      <Logo />
    </PureButton>
  );
}
