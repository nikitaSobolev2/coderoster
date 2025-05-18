"use client";

import { useEffect, useRef, useState } from "react";
import styles from "./styles.module.scss";
import PureButton from "~/shared/components/ui/buttons/PureButton";
import { useCursorFillTarget } from "~/features/home/hooks/useCursorFillTarget";

export interface Props {
  className?: string;
  children?: React.ReactNode;
  href?: string;
}

export default function NavMenuItem({
  className = "",
  children = null,
  href = "",
}: Props) {
  const ref = useRef<HTMLButtonElement>(null);
  const [isActive, setIsActive] = useState<boolean>(false);

  useEffect(() => {
    if (href.startsWith('#')) {
        const element = document.querySelector(href);
        if (element) {
            const observer = new IntersectionObserver((entries) => {
                entries.forEach((entry) => {
                    setIsActive(entry.isIntersecting);
                });
            });
            observer.observe(element);
        }
    }

    setIsActive(window.location.pathname === href);
  }, [href]);

  useCursorFillTarget(ref);

  return (
    <li className={`${styles.navMenuItem} ${className} ${isActive ? styles.navMenuItem_active : ''}`}>
      <PureButton className={styles.navMenuItem__button} href={href} ref={ref}>
        {children}
      </PureButton>
    </li>
  );
}
