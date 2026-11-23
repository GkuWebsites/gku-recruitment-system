import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import { HiringRequestModel } from '@/lib/models/HiringRequest';
import { Candidate, PromotionChannel } from '@/lib/types';

// API Category 4: HR Department (Consolidated)
export async function GET() {
  try {
    await connectToDatabase();

    // 1. Incoming pipeline: Submitted by Deans, but NOT YET approved by all (Stage 1-3)
    const incoming = await HiringRequestModel.find({
      currentStage: { $lt: 4 },
      status: {
        $in: [
          'Request Submitted (Department)',
          'Under Review (Dean Academic)',
          'Approved by Dean Academic',
          'Under Review (VC / Registrar)',
          'Returned for Clarification'
        ]
      }
    }).sort({ createdAt: -1 }).lean();

    // 2. Sanctioned by all (Approved by VC / Registrar -> Ready for HR Recruitment Execution)
    const sanctioned = await HiringRequestModel.find({
      $or: [
        { currentStage: { $gte: 4 } },
        {
          status: {
            $in: [
              'Approved by VC / Registrar',
              'In Process (HR - Recruitment)',
              'Interview & Selection Completed',
              'Joined & Request Closed'
            ]
          }
        }
      ]
    }).sort({ updatedAt: -1 }).lean();

    return NextResponse.json({
      success: true,
      incomingCount: incoming.length,
      sanctionedCount: sanctioned.length,
      incoming,
      sanctioned
    });
  } catch (error: unknown) {
    return NextResponse.json(
      { success: false, error: (error as Error).message || 'Failed to fetch HR data' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    await connectToDatabase();
    const body = await req.json();
    const { action, requestId } = body;

    if (!requestId || !action) {
      return NextResponse.json(
        { success: false, error: 'requestId and action are required' },
        { status: 400 }
      );
    }

    const request = await HiringRequestModel.findOne({
      $or: [{ _id: requestId.match(/^[0-9a-fA-F]{24}$/) ? requestId : null }, { requestId }]
    });

    if (!request) {
      return NextResponse.json({ success: false, error: 'Requisition not found' }, { status: 404 });
    }

    const timestamp = new Date().toISOString();

    // HR ACTION 1: Post Job to Platforms (Indeed, LinkedIn, Newspapers, Careers Website, Naukri)
    if (action === 'post_job') {
      const { channelName, channelNames, cost, urlOrRef, expiryDate, actorName } = body;

      // Must be approved by both Dean Academic and VC / Registrar
      if (request.currentStage < 4 && request.status !== 'Approved by VC / Registrar') {
        return NextResponse.json(
          {
            success: false,
            error: 'Job cannot be posted yet. Requisition must first be approved by both Dean Academic and VC / Registrar.'
          },
          { status: 403 }
        );
      }

      const selectedChannels: string[] = Array.isArray(channelNames) && channelNames.length > 0
        ? channelNames
        : [channelName || 'LinkedIn Jobs'];

      const totalCostNum = Number(cost) || 0;
      const perChannelCost = Math.round(totalCostNum / selectedChannels.length);

      selectedChannels.forEach((name: string, idx: number) => {
        const channelId = `prom-${Date.now()}-${idx}`;
        const newChannel: PromotionChannel = {
          id: channelId,
          channelName: name,
          cost: perChannelCost,
          postDate: new Date().toISOString().split('T')[0],
          expiryDate: expiryDate || '',
          urlOrRef: urlOrRef || '',
          notes: `Published via HR Media Cell on ${name}`
        };
        request.promotionChannels.push(newChannel);
      });

      request.totalPromotionCost = request.promotionChannels.reduce(
        (sum, item) => sum + (item.cost || 0),
        0
      );

      request.status = 'In Process (HR - Recruitment)';
      request.currentStage = 4;

      const detailsMsg = totalCostNum > 0
        ? `Published on [${selectedChannels.join(', ')}] with total ad spend of ₹${totalCostNum.toLocaleString()}.${urlOrRef ? ` Remarks: ${urlOrRef}` : ''}`
        : `Published on [${selectedChannels.join(', ')}]${urlOrRef ? `. Remarks: ${urlOrRef}` : ''}.`;

      request.auditTrail.unshift({
        id: `audit-${Date.now()}`,
        action: `Job Published on ${selectedChannels.length} Platform(s)`,
        performedBy: actorName || 'HR Media Cell',
        role: 'HR Department',
        details: detailsMsg,
        timestamp
      });

      await request.save();
      return NextResponse.json({
        success: true,
        message: `Job posted on ${selectedChannels.join(', ')}`,
        data: request.promotionChannels,
        totalPromotionCost: request.totalPromotionCost
      });
    }

    // HR ACTION 2: Upload / Intake Applicant Resume
    if (action === 'upload_resume') {
      const {
        fullName,
        email,
        phone,
        qualification,
        experienceYears,
        currentAffiliation,
        resumeFileName,
        actorName
      } = body;

      if (!fullName || !email) {
        return NextResponse.json(
          { success: false, error: 'fullName and email are required for resume upload' },
          { status: 400 }
        );
      }

      const candidateId = `cand-${Date.now()}`;
      const newCandidate: Candidate = {
        id: candidateId,
        fullName,
        email,
        phone: phone || '',
        qualification: qualification || 'Postgraduate / Ph.D.',
        experienceYears: Number(experienceYears) || 0,
        currentAffiliation: currentAffiliation || '',
        resumeFileName: resumeFileName || `${fullName.replace(/\s+/g, '_')}_CV.pdf`,
        status: 'Applied'
      };

      request.candidates.push(newCandidate);

      request.auditTrail.unshift({
        id: `audit-${Date.now()}`,
        action: 'Applicant Resume Registered',
        performedBy: actorName || 'HR Screening Desk',
        role: 'HR Department',
        details: `Registered applicant ${fullName} (${newCandidate.qualification}, ${newCandidate.experienceYears} yrs exp).`,
        timestamp
      });

      await request.save();
      return NextResponse.json({
        success: true,
        message: `Candidate ${fullName} registered successfully`,
        data: request.candidates
      });
    }

    // HR ACTION 3: Schedule Interview with Interviewer / Panel Names
    if (action === 'schedule_interview') {
      const { candidateId, interviewerNames, date, time, venue, actorName } = body;

      if (!candidateId || !interviewerNames) {
        return NextResponse.json(
          { success: false, error: 'candidateId and interviewerNames are required' },
          { status: 400 }
        );
      }

      const candidateIndex = request.candidates.findIndex((c) => c.id === candidateId);
      if (candidateIndex === -1) {
        return NextResponse.json({ success: false, error: 'Candidate not found' }, { status: 404 });
      }

      const panel = Array.isArray(interviewerNames)
        ? interviewerNames
        : String(interviewerNames)
            .split(',')
            .map((s) => s.trim())
            .filter(Boolean);

      const candidate = request.candidates[candidateIndex];
      candidate.status = 'Interview Scheduled';
      candidate.interviewDetails = {
        date: `${date || '2026-12-05'} ${time || '11:00 AM'}`,
        panelMembers: panel,
        panelRemarks: `Interview scheduled at ${venue || 'Board Room 1, Main Campus'}. Panelists: ${panel.join(', ')}`,
        scores: {
          subjectKnowledge: 0,
          researchPublications: 0,
          teachingAptitude: 0,
          communication: 0,
          totalScore: 0
        },
        recommendation: 'Recommend'
      };

      request.candidates[candidateIndex] = candidate;

      if (request.currentStage < 5) {
        request.currentStage = 5;
      }

      request.auditTrail.unshift({
        id: `audit-${Date.now()}`,
        action: `Interview Scheduled for ${candidate.fullName}`,
        performedBy: actorName || 'HR Interview Coordinator',
        role: 'HR Department',
        details: `Scheduled interview on ${candidate.interviewDetails.date}. Panelists: ${panel.join(', ')}. Venue: ${venue || 'Board Room'}.`,
        timestamp
      });

      await request.save();
      return NextResponse.json({
        success: true,
        message: `Interview scheduled with ${panel.join(', ')}`,
        data: request.candidates
      });
    }

    // HR ACTION 3.2: Record Interview Completion & Score (Out of 10)
    if (action === 'evaluate_interview') {
      const { candidateId, scores, panelRemarks, recommendation, actorName } = body;

      const candidateIndex = request.candidates.findIndex((c) => c.id === candidateId);
      if (candidateIndex === -1) {
        return NextResponse.json({ success: false, error: 'Candidate not found' }, { status: 404 });
      }

      const candidate = request.candidates[candidateIndex];
      candidate.status = recommendation === 'Not Recommended' ? 'Rejected' : 'Interviewed';

      const sKnowledge = Number(scores?.subjectKnowledge) || 0;
      const rPubs = Number(scores?.researchPublications) || 0;
      const tAptitude = Number(scores?.teachingAptitude) || 0;
      const comms = Number(scores?.communication) || 0;
      const avgOutOf10 = Number(((sKnowledge + rPubs + tAptitude + comms) / 4).toFixed(1));

      if (!candidate.interviewDetails) {
        candidate.interviewDetails = {
          date: new Date().toISOString().split('T')[0],
          panelMembers: ['Selection Committee'],
          panelRemarks: panelRemarks || 'Interview completed.',
          scores: {
            subjectKnowledge: sKnowledge,
            researchPublications: rPubs,
            teachingAptitude: tAptitude,
            communication: comms,
            totalScore: avgOutOf10
          },
          recommendation: recommendation || 'Recommend'
        };
      } else {
        candidate.interviewDetails.scores = {
          subjectKnowledge: sKnowledge,
          researchPublications: rPubs,
          teachingAptitude: tAptitude,
          communication: comms,
          totalScore: avgOutOf10
        };
        if (panelRemarks) candidate.interviewDetails.panelRemarks = panelRemarks;
        candidate.interviewDetails.recommendation = recommendation || 'Recommend';
      }

      request.candidates[candidateIndex] = candidate;

      request.auditTrail.unshift({
        id: `audit-${Date.now()}`,
        action: `Interview Evaluated & Scored for ${candidate.fullName}`,
        performedBy: actorName || 'HR Selection Committee Desk',
        role: 'HR Department',
        details: `Interview marked done. Score: ${avgOutOf10}/10. Recommendation: ${candidate.interviewDetails.recommendation}. Remarks: ${panelRemarks || 'None'}.`,
        timestamp
      });

      await request.save();
      return NextResponse.json({
        success: true,
        message: `Interview evaluated for ${candidate.fullName} (Score: ${avgOutOf10}/10)`,
        data: request.candidates
      });
    }

    // HR ACTION 3.5: Issue Official University Offer Letter
    if (action === 'issue_offer') {
      const {
        candidateId,
        offerLetterRef,
        offeredCtc,
        basicSalary,
        academicLevel,
        probationPeriod,
        joiningDeadline,
        offerRemarks,
        offerLetterFile,
        signedOfferLetterCopy,
        documentVerification,
        actorName
      } = body;

      const candidateIndex = request.candidates.findIndex((c) => c.id === candidateId);
      if (candidateIndex === -1) {
        return NextResponse.json({ success: false, error: 'Candidate not found' }, { status: 404 });
      }

      const candidate = request.candidates[candidateIndex];
      candidate.status = 'Offer Issued';

      const now = new Date().toISOString().split('T')[0];
      const prevDocs = documentVerification || candidate.joiningDetails?.documentVerification || {
        identityProof: false,
        degreesVerified: false,
        experienceCertificates: false,
        policeVerification: false,
        medicalFitness: false,
        nocRelieving: false,
        uploadedFiles: {}
      };

      candidate.joiningDetails = {
        offerLetterRef: offerLetterRef || `GKU/EST/OFFER/${new Date().getFullYear()}/${Math.floor(1000 + Math.random() * 9000)}`,
        offerLetterDate: now,
        offeredCtc: offeredCtc || request.tentativeBudget,
        basicSalary: basicSalary || '',
        academicLevel: academicLevel || request.postLevel,
        probationPeriod: probationPeriod || '1 Year',
        joiningDeadline: joiningDeadline || '2026-12-31',
        offerRemarks: offerRemarks || '',
        offerLetterFile: offerLetterFile || 'Formal_Appointment_Offer.pdf',
        signedOfferLetterCopy: signedOfferLetterCopy || '',
        documentVerification: prevDocs,
        inductionCompleted: false
      };

      request.candidates[candidateIndex] = candidate;

      request.auditTrail.unshift({
        id: `audit-${Date.now()}`,
        action: `Formal Offer Letter Released (${candidate.fullName})`,
        performedBy: actorName || 'HR Selection Directorate',
        role: 'HR Department',
        details: `Official offer released. Ref: ${candidate.joiningDetails.offerLetterRef}. Package: ${candidate.joiningDetails.offeredCtc}. Joining deadline: ${candidate.joiningDetails.joiningDeadline}.${offerRemarks ? ` Remarks: ${offerRemarks}` : ''}`,
        timestamp
      });

      await request.save();
      return NextResponse.json({
        success: true,
        message: `Official Offer Letter (${candidate.joiningDetails.offerLetterRef}) released to ${candidate.fullName}`,
        data: request
      });
    }

    // HR ACTION 3.8: Verify Pre-Joining Documents
    if (action === 'verify_documents') {
      const { candidateId, documentVerification, verificationRemarks, actorName } = body;

      const candidateIndex = request.candidates.findIndex((c) => c.id === candidateId);
      if (candidateIndex === -1) {
        return NextResponse.json({ success: false, error: 'Candidate not found' }, { status: 404 });
      }

      const candidate = request.candidates[candidateIndex];
      if (!candidate.joiningDetails) {
        candidate.joiningDetails = {
          offerLetterDate: new Date().toISOString().split('T')[0],
          documentVerification: {
            identityProof: false,
            degreesVerified: false,
            experienceCertificates: false,
            policeVerification: false
          },
          inductionCompleted: false
        };
      }

      candidate.joiningDetails.documentVerification = {
        identityProof: !!documentVerification?.identityProof,
        degreesVerified: !!documentVerification?.degreesVerified,
        experienceCertificates: !!documentVerification?.experienceCertificates,
        policeVerification: !!documentVerification?.policeVerification,
        medicalFitness: !!documentVerification?.medicalFitness,
        nocRelieving: !!documentVerification?.nocRelieving,
        verificationRemarks: verificationRemarks || '',
        uploadedFiles: documentVerification?.uploadedFiles || candidate.joiningDetails.documentVerification?.uploadedFiles || {}
      };

      request.candidates[candidateIndex] = candidate;

      request.auditTrail.unshift({
        id: `audit-${Date.now()}`,
        action: `Pre-Joining Documents Verified (${candidate.fullName})`,
        performedBy: actorName || 'HR Verification Officer',
        role: 'HR Department',
        details: `Document compliance checked. Remarks: ${verificationRemarks || 'Verified against originals.'}`,
        timestamp
      });

      await request.save();
      return NextResponse.json({
        success: true,
        message: `Documents verified for ${candidate.fullName}`,
        data: request
      });
    }

    // HR ACTION 4: Candidate Formal Joining & Faculty Induction
    if (action === 'onboard_candidate') {
      const {
        candidateId,
        employeeId,
        officialEmail,
        reportingHead,
        joiningDate,
        inductionChecklist,
        joiningRemarks,
        actorName
      } = body;

      const candidateIndex = request.candidates.findIndex((c) => c.id === candidateId);
      if (candidateIndex === -1) {
        return NextResponse.json({ success: false, error: 'Candidate not found' }, { status: 404 });
      }

      const candidate = request.candidates[candidateIndex];
      const now = new Date().toISOString().split('T')[0];

      const currentDetails = candidate.joiningDetails || {
        offerLetterDate: now,
        offeredCtc: request.tentativeBudget,
        joiningDeadline: now,
        documentVerification: {
          identityProof: true,
          degreesVerified: true,
          experienceCertificates: true,
          policeVerification: true
        },
        inductionCompleted: true
      };

      candidate.status = 'Joined';
      candidate.joiningDetails = {
        ...currentDetails,
        joiningDate: joiningDate || now,
        employeeId: employeeId || `GKU-EMP-${Date.now().toString().slice(-4)}`,
        officialEmail: officialEmail || `${candidate.fullName.toLowerCase().replace(/[^a-z]/g, '')}@gku.ac.in`,
        reportingHead: reportingHead || `Dean, ${request.department}`,
        inductionCompleted: true,
        inductionChecklist: {
          idCardIssued: !!inductionChecklist?.idCardIssued,
          itAccountCreated: !!inductionChecklist?.itAccountCreated,
          workloadAssigned: !!inductionChecklist?.workloadAssigned,
          bankAccountOpened: !!inductionChecklist?.bankAccountOpened
        },
        joiningRemarks: joiningRemarks || ''
      };

      request.candidates[candidateIndex] = candidate;

      const joinedCount = request.candidates.filter((c) => c.status === 'Joined').length;
      if (joinedCount >= request.numberOfPositions) {
        request.status = 'Joined & Request Closed';
        request.currentStage = 6;
      }

      request.auditTrail.unshift({
        id: `audit-${Date.now()}`,
        action: `Formal Faculty Joining & Induction (${candidate.fullName})`,
        performedBy: actorName || 'HR Onboarding Office',
        role: 'HR Department',
        details: `Appointed with Permanent Employee ID: ${candidate.joiningDetails.employeeId}. Official Email: ${candidate.joiningDetails.officialEmail}. Reporting: ${candidate.joiningDetails.reportingHead}.`,
        timestamp
      });

      await request.save();
      return NextResponse.json({
        success: true,
        message: `${candidate.fullName} successfully joined and inducted with Employee ID: ${candidate.joiningDetails.employeeId}`,
        data: request
      });
    }

    // HR ACTION 5: Shortlist / Select Candidate from Interview
    if (action === 'shortlist_candidate') {
      const { candidateId, actorName, remarks } = body;

      const candidateIndex = request.candidates.findIndex((c) => c.id === candidateId);
      if (candidateIndex === -1) {
        return NextResponse.json({ success: false, error: 'Candidate not found' }, { status: 404 });
      }

      const candidate = request.candidates[candidateIndex];
      candidate.status = 'Selected'; // Shortlisted / Selected for Offer
      request.candidates[candidateIndex] = candidate;

      request.auditTrail.unshift({
        id: `audit-${Date.now()}`,
        action: `Candidate Shortlisted / Selected (${candidate.fullName})`,
        performedBy: actorName || 'HR Selection Committee',
        role: 'HR Department',
        details: remarks || `Candidate ${candidate.fullName} shortlisted for appointment following interview evaluation. Moved to Shortlisted candidates for formal offer release.`,
        timestamp
      });

      await request.save();
      return NextResponse.json({
        success: true,
        message: `${candidate.fullName} has been Shortlisted / Selected for Appointment.`,
        data: request.candidates
      });
    }

    // HR ACTION 6: Reject Candidate from Interview
    if (action === 'reject_candidate') {
      const { candidateId, actorName, reason } = body;

      const candidateIndex = request.candidates.findIndex((c) => c.id === candidateId);
      if (candidateIndex === -1) {
        return NextResponse.json({ success: false, error: 'Candidate not found' }, { status: 404 });
      }

      const candidate = request.candidates[candidateIndex];
      candidate.status = 'Rejected';
      request.candidates[candidateIndex] = candidate;

      request.auditTrail.unshift({
        id: `audit-${Date.now()}`,
        action: `Candidate Application Rejected (${candidate.fullName})`,
        performedBy: actorName || 'HR Selection Committee',
        role: 'HR Department',
        details: reason || `Candidate ${candidate.fullName} was not selected following interview evaluation.`,
        timestamp
      });

      await request.save();
      return NextResponse.json({
        success: true,
        message: `${candidate.fullName} has been marked as Rejected.`,
        data: request.candidates
      });
    }

    // HR ACTION 7: Update Recruitment / Intake Status (Fulfill, Close Intake, Put on Hold, Reopen)
    if (action === 'update_recruitment_status') {
      const { newStatus, closureReason, actorName } = body;

      if (!newStatus) {
        return NextResponse.json({ success: false, error: 'newStatus is required' }, { status: 400 });
      }

      request.status = newStatus;

      if (newStatus === 'Position Fulfilled (Recruitment Completed)' || newStatus === 'Joined & Request Closed') {
        request.currentStage = 6;
      } else if (newStatus === 'In Process (HR - Recruitment)') {
        request.currentStage = 4;
      }

      const actionTitle = 
        newStatus === 'Position Fulfilled (Recruitment Completed)' ? 'Recruitment Marked as Fulfilled' :
        newStatus === 'Applications Closed (Intake Stopped)' ? 'Job Applications Closed by HR' :
        newStatus === 'Hiring On Hold' ? 'Recruitment Placed on Hold' :
        'Recruitment Re-Opened for Applications';

      request.auditTrail.unshift({
        id: `audit-${Date.now()}`,
        action: actionTitle,
        performedBy: actorName || 'HR Selection Directorate',
        role: 'HR Department',
        details: `Hiring status updated to "${newStatus}". Reason: ${closureReason || 'Administrative update by HR'}.`,
        timestamp
      });

      await request.save();
      return NextResponse.json({
        success: true,
        message: `Position status updated to "${newStatus}"`,
        data: request
      });
    }

    return NextResponse.json({ success: false, error: `Invalid action: ${action}` }, { status: 400 });
  } catch (error: unknown) {
    return NextResponse.json(
      { success: false, error: (error as Error).message || 'Failed to process HR action' },
      { status: 500 }
    );
  }
}
