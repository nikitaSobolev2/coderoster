"use client";

import Logo from "~/shared/components/common/Logo";
import styles from "./styles.module.scss";
import { useState, useEffect } from "react";
import Link from "next/link";
import SiteSearch from "~/shared/components/ui/search/SiteSearch";

export interface Props {
  className?: string;
}

export default function Header({ className = "" }: Props) {
  const [active, setActive] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setActive(window.scrollY > 100);
    };
    window.addEventListener("scroll", handleScroll);

    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <header
      className={`${styles.header} ${className} ${active ? styles.active : ""}`}
    >
      <div className={styles.header__container}>
        <Link href="/" className={styles.container__logo}>
          <Logo />

          <div className="container__right">
            {/* <SiteSearch />
            <HeaderAuth /> */}
          </div>
        </Link>
      </div>
    </header>
  );
}
