import { Injectable } from '@nestjs/common';
import { PublicationStatus } from '../../common/enums/publication-status.enum';
@Injectable()
export class PublicationStateMachineService {
  private readonly allowedTransitions: Record<PublicationStatus, PublicationStatus[]> = {
    [PublicationStatus.DRAFT]: [PublicationStatus.IN_REVIEW],
    [PublicationStatus.IN_REVIEW]: [
      PublicationStatus.CHANGES_REQUESTED,
      PublicationStatus.APPROVED,
    ],
    [PublicationStatus.CHANGES_REQUESTED]: [PublicationStatus.IN_REVIEW],
    [PublicationStatus.APPROVED]: [PublicationStatus.PUBLISHED],
    [PublicationStatus.PUBLISHED]: [PublicationStatus.WITHDRAWN],
    [PublicationStatus.WITHDRAWN]: [],
  };
  private readonly editableStatuses: PublicationStatus[] = [
    PublicationStatus.DRAFT,
    PublicationStatus.CHANGES_REQUESTED,
  ];
  canTransition(from: PublicationStatus, to: PublicationStatus): boolean {
    return this.allowedTransitions[from]?.includes(to) || false;
  }
  getNextPossibleStates(currentStatus: PublicationStatus): PublicationStatus[] {
    return this.allowedTransitions[currentStatus] || [];
  }
  canEdit(status: PublicationStatus): boolean {
    return this.editableStatuses.includes(status);
  }
  isTerminalState(status: PublicationStatus): boolean {
    return this.allowedTransitions[status].length === 0;
  }
  isFinalState(status: PublicationStatus): boolean {
    return status === PublicationStatus.PUBLISHED || status === PublicationStatus.WITHDRAWN;
  }
}