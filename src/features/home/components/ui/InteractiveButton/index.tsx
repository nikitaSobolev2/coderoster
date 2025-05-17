'use client'

import { useCursorFillTarget } from "~/features/home/hooks/useCursorFillTarget";
import { useRef } from "react";

// Demo Button Component
export default function InteractiveButton() {
    const buttonRef = useRef<HTMLButtonElement>(null);
    useCursorFillTarget(buttonRef);
  
    return (
      <button
        ref={buttonRef}
        style={{
          position: 'absolute',
          top: '50px',
          left: '50px',
          padding: '20px 30px',
          fontSize: '1.2em',
          backgroundColor: 'transparent',
          color: 'white',
          border: '2px solid white',
          borderRadius: '8px',
          cursor: 'pointer'
        }}
      >
        Hover or Focus Me for Fill!
      </button>
    );
  }