import { useState } from "react";

export const FadeImage = ({ src, alt, className, wrapperClassName }: {
    src: string
    alt: string
    className?: string
    wrapperClassName?: string
}) => {

    const [loaded, setLoaded] = useState(false)

    return (
      <div className={`relative bg-neutral-200 dark:bg-neutral-600 ${!loaded ? 'animate-pulse' : ''} ${wrapperClassName}`}>
        <img
          src={src}
          alt={alt}
          onLoad={() => setLoaded(true)}
          className={`transition-opacity duration-500 ${loaded ? 'opacity-100' : 'opacity-0'} ${className}`}
        />
      </div>
    )
}