import styles from "./styles.module.scss";

export interface Props {
  className?: string;
}

export default function UserProfile({ className = "" }: Props) {
  return (
    <div className={`${styles.userProfile} ${className}`}>
    </div>
  );
}
