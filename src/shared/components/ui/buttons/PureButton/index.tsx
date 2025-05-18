"use client";

import { forwardRef } from "react";
import Link from "next/link";
import { Tooltip } from "@mantine/core";
import type { Url } from "next/dist/shared/lib/router/router";
import styles from "./styles.module.scss";

export interface Props
  extends React.HTMLAttributes<HTMLButtonElement | HTMLAnchorElement> {
  disabled?: boolean;
  label?: string;
  href?: Url;
  onClick?: () => void;
  preserveOnClick?: boolean;
}

const PureButton = forwardRef<HTMLButtonElement | HTMLAnchorElement, Props>(
  function PureButton(
    { className = "", disabled = false, label = "", preserveOnClick = true, onClick, ...defaultProps },
    ref,
  ) {
    function onClickHandler() {
      if (
        preserveOnClick &&
        typeof defaultProps.href === "string" &&
        defaultProps.href.startsWith("#")
      ) {
        const element = document.querySelector(defaultProps.href);
        if (element) {
          element.scrollIntoView({ behavior: "smooth", block: "start" });
        }
      }

      if (onClick) {
        onClick();
      }
    }

    const getContent = () => {
      if (defaultProps.href !== undefined) {
        return (
          <Link
            href={defaultProps.href}
            className={`${styles.pure_button} ${className}`}
            aria-disabled={disabled}
            tabIndex={disabled ? -1 : 1}
            aria-label={label}
            onClick={onClickHandler}
            {...defaultProps}
            ref={ref as React.RefObject<HTMLAnchorElement>}
          />
        );
      }

      return (
        <button
          className={`${styles.pure_button} ${className}`}
          aria-label={label}
          aria-disabled={disabled}
          tabIndex={disabled ? -1 : 1}
          {...defaultProps}
          ref={ref as React.RefObject<HTMLButtonElement>}
        />
      );
    };

    const content = getContent();

    return label ? (
      <Tooltip
        className={styles.pure_button__tip}
        zIndex={999999}
        offset={16}
        label={label}
      >
        {content}
      </Tooltip>
    ) : (
      <>{content}</>
    );
  },
);

export default PureButton;
