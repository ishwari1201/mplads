export type ProjectStatusEnum = 
  | 'RECOMMENDED' 
  | 'IN_FEASIBILITY' 
  | 'SANCTIONED' 
  | 'REJECTED' 
  | 'AGENCY_ASSIGNED' 
  | 'IN_PROGRESS' 
  | 'COMPLETION_SUBMITTED'
  | 'CORRECTION_REQUIRED'
  | 'COMPLETED' 
  | 'ESCALATED_TO_STATE'
  | 'ESCALATED_TO_CENTRAL'
  | 'RETURNED_TO_DISTRICT'
  | 'AUDITED' 
  | 'FROZEN_PENDING_AUDIT';

const ALLOWED_TRANSITIONS: Record<ProjectStatusEnum, ProjectStatusEnum[]> = {
  RECOMMENDED: ['IN_FEASIBILITY', 'SANCTIONED', 'REJECTED', 'FROZEN_PENDING_AUDIT'],
  IN_FEASIBILITY: ['SANCTIONED', 'REJECTED', 'CORRECTION_REQUIRED', 'FROZEN_PENDING_AUDIT'],
  SANCTIONED: ['AGENCY_ASSIGNED', 'IN_PROGRESS', 'REJECTED', 'FROZEN_PENDING_AUDIT'],
  AGENCY_ASSIGNED: ['IN_PROGRESS', 'CORRECTION_REQUIRED', 'REJECTED', 'FROZEN_PENDING_AUDIT'],
  IN_PROGRESS: ['COMPLETION_SUBMITTED', 'COMPLETED', 'CORRECTION_REQUIRED', 'ESCALATED_TO_STATE', 'FROZEN_PENDING_AUDIT'],
  COMPLETION_SUBMITTED: ['COMPLETED', 'CORRECTION_REQUIRED', 'ESCALATED_TO_STATE', 'REJECTED', 'FROZEN_PENDING_AUDIT'],
  CORRECTION_REQUIRED: ['IN_PROGRESS', 'IN_FEASIBILITY', 'SANCTIONED', 'REJECTED'],
  COMPLETED: ['AUDITED', 'FROZEN_PENDING_AUDIT'],
  ESCALATED_TO_STATE: ['ESCALATED_TO_CENTRAL', 'RETURNED_TO_DISTRICT', 'SANCTIONED', 'COMPLETED', 'REJECTED'],
  ESCALATED_TO_CENTRAL: ['RETURNED_TO_DISTRICT', 'SANCTIONED', 'COMPLETED', 'REJECTED'],
  RETURNED_TO_DISTRICT: ['IN_PROGRESS', 'SANCTIONED', 'CORRECTION_REQUIRED', 'REJECTED', 'COMPLETED'],
  REJECTED: [],
  AUDITED: [],
  FROZEN_PENDING_AUDIT: ['IN_FEASIBILITY', 'SANCTIONED', 'REJECTED', 'IN_PROGRESS', 'CORRECTION_REQUIRED'],
};

export class ProjectStateMachine {
  /**
   * Evaluates if a state transition is valid according to MPLADS rules.
   */
  static canTransition(currentStatus: ProjectStatusEnum, nextStatus: ProjectStatusEnum): boolean {
    const allowed = ALLOWED_TRANSITIONS[currentStatus];
    return allowed ? allowed.includes(nextStatus) : false;
  }

  /**
   * Performs the state transition or throws a detailed validation error.
   */
  static validateTransition(currentStatus: ProjectStatusEnum, nextStatus: ProjectStatusEnum): void {
    if (!this.canTransition(currentStatus, nextStatus)) {
      throw new Error(
        `Illegal state transition attempt from '${currentStatus}' to '${nextStatus}'. Permitted transitions: [${ALLOWED_TRANSITIONS[currentStatus]?.join(', ') || 'None'}]`
      );
    }
  }
}
