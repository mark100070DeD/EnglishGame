import type { OfficeDefinition, OfficeId } from './OfficeDefinition';
import { speakingOffice } from './speakingOffice';

const OFFICES: Readonly<Record<OfficeId, OfficeDefinition>> = {
  'speaking-office': speakingOffice,
};

export function getOffice(id: OfficeId): OfficeDefinition {
  return OFFICES[id];
}

export type { NpcDefinition, OfficeDefinition, OfficeId } from './OfficeDefinition';
