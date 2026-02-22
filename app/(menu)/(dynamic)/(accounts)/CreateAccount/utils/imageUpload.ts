import {
  ACCEPTED_IMAGE_INPUT_ACCEPT,
  processImageUpload,
  type ProcessImageUploadResult,
} from '@/lib/utils/images/imageUploadProcessor';
import {
  LOGO_MAX_INPUT_BYTES,
  LOGO_MAX_OUTPUT_BYTES,
  LOGO_TARGET_HEIGHT_PX,
  LOGO_TARGET_WIDTH_PX,
} from './createAccountConstants';

export { ACCEPTED_IMAGE_INPUT_ACCEPT };

export async function processCreateAccountLogoUpload(
  file: File,
): Promise<ProcessImageUploadResult> {
  return processImageUpload(file, {
    targetWidth: LOGO_TARGET_WIDTH_PX,
    targetHeight: LOGO_TARGET_HEIGHT_PX,
    maxInputBytes: LOGO_MAX_INPUT_BYTES,
    maxOutputBytes: LOGO_MAX_OUTPUT_BYTES,
  });
}

