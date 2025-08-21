import * as React from "react";
import { clsx } from "clsx";

export function Button(props: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  const { className, ...rest } = props;
  return (
    <button
      {...rest}
      className={clsx("rounded-xl px-4 py-2 border", className)}
    />
  );
}