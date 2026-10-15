"use client";

import { useEffect, useId, useRef } from "react";
import Image from "next/image";
import { ArrowLeft, ArrowRight, X } from "@phosphor-icons/react";
import { lifeMedia } from "@/data/life-media";
import "./life-lightbox.css";

type Props = {
  index: number | null;
  onClose: () => void;
  onNavigate: (index: number) => void;
};

export default function LifeLightbox({ index, onClose, onNavigate }: Props) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const returnFocusRef = useRef<HTMLElement | null>(null);
  const backdropPressedRef = useRef(false);
  const titleId = useId();
  const captionId = useId();
  const item = index === null ? undefined : lifeMedia[index];
  const isOpen = Boolean(item);

  // Capture the card that opened the viewer only once, so navigating between
  // moments still returns focus to the same card on close.
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog || !isOpen) return;

    returnFocusRef.current =
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null;
    const previousOverflow = document.documentElement.style.overflow;
    document.documentElement.style.overflow = "hidden";
    if (!dialog.open) dialog.showModal();
    closeRef.current?.focus({ preventScroll: true });

    return () => {
      videoRef.current?.pause();
      if (dialog.open) dialog.close();
      document.documentElement.style.overflow = previousOverflow;
      if (returnFocusRef.current?.isConnected) {
        returnFocusRef.current.focus({ preventScroll: true });
      }
      returnFocusRef.current = null;
    };
  }, [isOpen]);

  useEffect(() => {
    const video = videoRef.current;
    return () => {
      // The old node may already be detached when a different moment renders.
      // Keep its reference so audio never continues after navigation.
      video?.pause();
    };
  }, [item?.src]);

  const close = () => {
    videoRef.current?.pause();
    onClose();
  };
  const navigate = (direction: -1 | 1) => {
    if (index === null || lifeMedia.length < 2) return;
    videoRef.current?.pause();
    onNavigate((index + direction + lifeMedia.length) % lifeMedia.length);
  };

  return (
    <dialog
      ref={dialogRef}
      className="life-lightbox"
      aria-labelledby={titleId}
      aria-describedby={captionId}
      onCancel={(event) => {
        event.preventDefault();
        close();
      }}
      onPointerDown={(event) => {
        backdropPressedRef.current = event.target === event.currentTarget;
      }}
      onClick={(event) => {
        if (
          backdropPressedRef.current &&
          event.target === event.currentTarget
        ) {
          close();
        }
        backdropPressedRef.current = false;
      }}
      onKeyDown={(event) => {
        if (
          event.altKey ||
          event.ctrlKey ||
          event.metaKey ||
          (event.target instanceof HTMLElement &&
            event.target.closest("video, input, textarea, select"))
        ) {
          return;
        }
        if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
          event.preventDefault();
          event.stopPropagation();
          navigate(event.key === "ArrowLeft" ? -1 : 1);
        }
      }}
    >
      {item && (
        <div className="ll-shell">
          <header className="ll-header">
            <h2 id={titleId}>A little life outside work.</h2>
            <button
              ref={closeRef}
              className="ll-icon-button ll-close"
              type="button"
              aria-label="Close photo and video viewer"
              onClick={close}
            >
              <X size={22} />
            </button>
          </header>
          <figure className="ll-figure">
            <div className="ll-stage" key={item.src}>
              {item.type === "video" ? (
                <video
                  ref={videoRef}
                  className="ll-media"
                  src={item.src}
                  poster={item.poster}
                  width={item.width}
                  height={item.height}
                  aria-label={item.alt}
                  controls
                  playsInline
                  preload="metadata"
                />
              ) : (
                <Image
                  className="ll-media"
                  src={item.src}
                  width={item.width}
                  height={item.height}
                  alt={item.alt}
                  sizes="(max-width: 700px) 94vw, 86vw"
                  draggable={false}
                />
              )}
            </div>
            <figcaption
              id={captionId}
              className="ll-caption"
              aria-live="polite"
              aria-atomic="true"
            >
              <span>{item.caption}</span>
              <span className="ll-count">
                {(index ?? 0) + 1} / {lifeMedia.length}
              </span>
            </figcaption>
          </figure>
          {lifeMedia.length > 1 && (
            <nav className="ll-navigation" aria-label="Browse moments">
              <button type="button" onClick={() => navigate(-1)}>
                <ArrowLeft size={18} />
                <span>Previous</span>
              </button>
              <span className="ll-navigation-hint" aria-hidden="true">
                A few moments worth keeping.
              </span>
              <button type="button" onClick={() => navigate(1)}>
                <span>Next</span>
                <ArrowRight size={18} />
              </button>
            </nav>
          )}
        </div>
      )}
    </dialog>
  );
}
