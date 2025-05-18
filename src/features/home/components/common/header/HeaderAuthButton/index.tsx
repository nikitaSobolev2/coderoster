"use client";

import { useRef } from "react";
import Link from "next/link";
import { faArrowRightToBracket } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import styles from "./styles.module.scss";
import { useCursorFillTarget } from "~/features/home/hooks/useCursorFillTarget";

export interface Props {
  className?: string;
}

export default function HeaderAuthButton({ className = "" }: Props) {
  const ref = useRef<HTMLAnchorElement>(null);
  useCursorFillTarget(ref);

  return (
    <Link
      href="/login"
      className={`${styles.headerAuthButton} ${className}`}
      ref={ref}
    >
      <span>Войти</span>
      <FontAwesomeIcon icon={faArrowRightToBracket} />
    </Link>
  );
}
