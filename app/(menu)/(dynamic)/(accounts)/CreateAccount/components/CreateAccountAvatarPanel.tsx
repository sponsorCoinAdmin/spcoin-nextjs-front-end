'use client';

import React from 'react';
import { useState } from 'react';
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
  const uploadControlClass = 'mx-auto w-full';
  const uploadControlTextClass = 'px-6 text-center text-[120%] font-bold';
  return (
    <section
      className={`${panelMarginClass} ${avatarPanelBorderClass} order-1 flex h-full w-full flex-col items-end justify-start pr-0 pt-4 pb-0 pl-0`}
    >
      {headingContent ? (
        <div className="mb-4 w-full max-w-[56rem] px-6 pt-1 md:px-8">{headingContent}</div>
      ) : (
        <h2 className="mb-4 w-full max-w-[46rem] text-center text-lg font-semibold text-[#5981F3]">
          {avatarHeading}
        </h2>
      )}
      <div className="flex h-full w-full max-w-[46rem] flex-1 min-h-0 flex-col items-center gap-4">
        <div className="flex w-full max-w-[400px] flex-col gap-4">
          {showImage ? (
            <div className="mx-auto flex h-[400px] w-[400px] items-center justify-center overflow-hidden rounded border border-slate-600 bg-[#0D1324] p-0">
              {logoPreviewSrc ? (
                <img
                  src={logoPreviewSrc}
                  alt="Account logo preview"
                  className="h-full w-full object-cover"
                />
              ) : (
                <span className="text-sm text-slate-300">No logo found on server</span>
              )}
            </div>
          ) : null}
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
