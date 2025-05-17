import styles from "./styles.module.scss";

export interface Props {
  className?: string;
}

export default function Logo({ className='' }: Props) {
    return (
        <p className={`${styles.logo} ${className}`}>
            CodeRoster
        </p>
    );
  }