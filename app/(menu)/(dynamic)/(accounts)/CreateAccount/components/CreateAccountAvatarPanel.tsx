'use client';

import React, { useEffect, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import DisconnectedControl from './DisconnectedControl';

type Props = {
  panelMarginClass: string;
  avatarPanelBorderClass: string;
  avatarHeading: string;
  logoPreviewSrc: string;
  connected: boolean;
  isEditMode: boolean;
  inputLocked: boolean;
  previewButtonLabel: string;
  loadingInputMessage: string;
  isLoading: boolean;
  acceptedInput: string;
  logoFileInputRef: React.RefObject<HTMLInputElement>;
  onFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  showImage?: boolean;
  showButton?: boolean;
  headingContent?: ReactNode;
};

export default function CreateAccountAvatarPanel({
  panelMarginClass,
  avatarPanelBorderClass,
  avatarHeading,
  logoPreviewSrc,
  connected,
  isEditMode,
  inputLocked,
  previewButtonLabel,
  loadingInputMessage,
  isLoading,
  acceptedInput,
  logoFileInputRef,
  onFileChange,
  showImage = true,
  showButton = true,
  headingContent,
}: Props) {
  const [isUploadHovered, setIsUploadHovered] = useState(false);
  const [previewSize, setPreviewSize] = useState(560);
  const previewStageRef = useRef<HTMLDivElement | null>(null);
  const uploadControlClass = 'mx-auto w-full';
  const uploadControlTextClass = 'px-6 text-center text-[120%] font-bold';
  const previewSizeBuffer = 50;
  const minPreviewSize = 180;
  const maxPreviewSize = 560;

  useEffect(() => {
    const stage = previewStageRef.current;
    if (!stage || typeof ResizeObserver === 'undefined') return;

    const updatePreviewSize = () => {
      const rect = stage.getBoundingClientRect();
      const availableSize = Math.min(rect.width, maxPreviewSize) - previewSizeBuffer;
      const nextSize = Math.floor(Math.max(minPreviewSize, availableSize));
      setPreviewSize((current) => (current === nextSize ? current : nextSize));
    };

    updatePreviewSize();
    const observer = new ResizeObserver(updatePreviewSize);
    observer.observe(stage);
    return () => observer.disconnect();
  }, []);

  return (
    <section
      className={`${panelMarginClass} ${avatarPanelBorderClass} order-1 flex h-full w-full flex-col items-center justify-start pr-0 pt-4 pb-0 pl-0`}
    >
{headingContent ? (
        <div className="mb-0 w-full max-w-[56rem] px-6 pt-0 md:px-8">{headingContent}</div>
      ) : (
        avatarHeading ? (
          <h2 className="mb-4 w-full max-w-[56rem] text-center text-lg font-semibold text-[#5981F3]">
            {avatarHeading}
          </h2>
        ) : null
      )}
      <div className="flex w-full max-w-[56rem] flex-col items-center gap-4">
        <div ref={previewStageRef} className="flex w-full justify-center">
          {showImage ? (
            <div
              className="mx-auto flex shrink-0 items-center justify-center overflow-hidden bg-[#0D1324] p-0"
              style={{
                width: `${previewSize}px`,
                height: `${previewSize}px`,
                maxWidth: '100%',
                maxHeight: '100%',
              }}
            >
              {logoPreviewSrc ? (
                <img
                  src={logoPreviewSrc}
                  alt="Account logo preview"
                  className="h-full w-full object-contain"
                />
              ) : (
                <span className="text-sm text-slate-300">No logo found on server</span>
              )}
            </div>
          ) : null}
        </div>
        <div
          className="shrink-0"
          style={{
            width: `${previewSize}px`,
            maxWidth: '100%',
          }}
        >
          <input
            ref={logoFileInputRef}
            id="logoFileUpload"
            type="file"
            accept={acceptedInput}
            className="hidden"
            aria-label="Account logo file upload"
            title="Select account logo file"
            onChange={onFileChange}
          />
          {showButton ? (
            <div className="w-full">
              {!connected ? (
                <DisconnectedControl
                  message="Wallet Connection Required"
                  className={uploadControlClass}
                />
              ) : (
                <button
                  type="button"
                  aria-disabled={!connected}
                  disabled={!connected}
                  className={`w-full rounded border border-white py-2 text-black transition-colors ${
                    !isEditMode
                      ? isUploadHovered
                        ? 'bg-red-500 text-black'
                        : 'bg-[#E5B94F] text-black'
                      : inputLocked
                      ? 'bg-red-500 text-black cursor-not-allowed'
                      : isUploadHovered
                      ? 'bg-green-500 text-black'
                      : 'bg-[#E5B94F] text-black'
                  }`}
                  title={isLoading ? loadingInputMessage : previewButtonLabel}
                  onClick={() => {
                    if (!isEditMode || inputLocked) return;
                    if (!logoFileInputRef.current) return;
                    logoFileInputRef.current.value = '';
                    logoFileInputRef.current.click();
                  }}
                  onMouseEnter={() => setIsUploadHovered(true)}
                  onMouseLeave={() => setIsUploadHovered(false)}
                >
                  <span className={uploadControlTextClass}>{previewButtonLabel}</span>
                </button>
              )}
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
}
