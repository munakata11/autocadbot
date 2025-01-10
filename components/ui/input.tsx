"use client";

import React from "react";

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {}

const Input = React.forwardRef<HTMLInputElement, InputProps>((props, ref) => {
  return (
    <input
      ref={ref}
      className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-base text-black shadow-sm transition-colors"
      {...props}
    />
  );
});

Input.displayName = "Input";

export { Input };
