import { IClarificationThread, IHiringRequest } from './types';

export interface UserContext {
  email: string;
  name: string;
  designation: string; // 'Admin' | 'Dean' | 'Director' | 'Dean Academic' | 'VC / Registrar' | 'HR'
  department?: string;
}

/**
 * Determines whether a user has permission to view a specific clarification thread.
 * Strict privacy enforcement:
 * - Private VC <-> Dean Academic threads are invisible to Department Deans unless explicitly CC'd.
 * - Private VC <-> Department Dean threads are invisible to Dean Academic unless explicitly CC'd.
 * - Department Deans only see threads for their own submitted requisitions (or where they are CC'd).
 */
export function canUserViewThread(
  thread: IClarificationThread,
  user: UserContext | null | undefined,
  request: IHiringRequest
): boolean {
  if (!user) return false;

  // 1. Super Admin and VC / Registrar have full executive audit visibility
  if (user.designation === 'Admin' || user.designation === 'VC / Registrar') {
    return true;
  }

  // 2. The author/creator of the thread can always view it
  if (thread.creatorEmail === user.email) {
    return true;
  }

  // 3. Any user explicitly included in the CC list can view
  if (
    thread.ccRecipients?.some(
      (cc) =>
        cc.email.toLowerCase() === user.email.toLowerCase() ||
        (user.department && cc.department && cc.department === user.department)
    )
  ) {
    return true;
  }

  // 4. Dean Academic
  if (user.designation === 'Dean Academic') {
    if (thread.primaryRecipientRole === 'Dean Academic' || thread.primaryRecipientRole === 'Both') {
      return true;
    }
    if (thread.creatorRole === 'Dean Academic') {
      return true;
    }
    // If not addressed to Dean Academic and not CC'd, cannot view (private VC <-> Department Dean thread)
    return false;
  }

  // 5. Department Dean / Director
  if (user.designation === 'Dean' || user.designation === 'Director') {
    // Check if this user is the original submitter / department owner of the job requirement
    const isOriginalDean =
      (request.creator?.email && request.creator.email.toLowerCase() === user.email.toLowerCase()) ||
      (request.department && user.department && request.department === user.department);

    if (isOriginalDean) {
      if (thread.primaryRecipientRole === 'Department / Dean' || thread.primaryRecipientRole === 'Both') {
        return true;
      }
      if (
        thread.primaryRecipientEmail &&
        thread.primaryRecipientEmail.toLowerCase() === user.email.toLowerCase()
      ) {
        return true;
      }
      // If thread is addressed to Dean Academic only, original dean CANNOT view unless CC'd
      return false;
    }

    // Other deans from other departments can only view if explicitly CC'd (checked above)
    return false;
  }

  return false;
}
