import type { OfficeKind } from '@english-office/shared';
import type { OfficeMode } from './OfficeMode';
import { speakingMode } from './speaking/speakingMode';

/** Office kinds that already have their rules implemented. */
const OFFICE_MODES: Partial<Record<OfficeKind, OfficeMode>> = {
  speaking: speakingMode,
};

export function getOfficeMode(kind: OfficeKind): OfficeMode | undefined {
  return OFFICE_MODES[kind];
}
