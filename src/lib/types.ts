export interface ParticipantInput {
  role: string;
  name?: string;
  company?: string;
  phone?: string;
}

export interface CrewMemberInput {
  name: string;
  role?: string;
}

export interface EquipmentInput {
  name: string;
  quantity: number;
  notes?: string;
}

export interface TestInput {
  testType: string;
  requirement?: string;
  result?: string;
  certificateNumber?: string;
  status?: string;
}

export interface AttachmentInput {
  filename: string;
  filepath: string;
  filesize: number;
  mimetype: string;
}

export interface TestSectionFormData {
  // Form Details
  date: string;
  sectionName: string;

  // Participants
  participants: ParticipantInput[];
  crewMembers: CrewMemberInput[];

  // Description
  locationDescription?: string;
  structure?: string;
  crossSections?: string;
  descriptionNotes?: string;

  // Execution
  executionSteps?: string;

  // Equipment
  equipment: EquipmentInput[];

  // Tests
  tests: TestInput[];

  // Attachments
  attachments: AttachmentInput[];

  // Approvals
  qualityControlApproval: boolean;
  qualityControlApproverName?: string;
  qualityControlApprovalDate?: string;
  supervisionApproval: boolean;
  supervisionApproverName?: string;
  supervisionApprovalDate?: string;

  // Project
  projectChapterId?: string;

  // Summary
  status: 'passed' | 'failed' | 'pending';
  summaryNotes?: string;
}

export interface TestSectionWithRelations {
  id: string;
  formNumber: string;
  projectChapterId: string;
  date: Date;
  sectionName: string;
  locationDescription: string | null;
  structure: string | null;
  crossSections: string | null;
  descriptionNotes: string | null;
  executionSteps: string | null;
  qualityControlApproval: boolean;
  qualityControlApproverName: string | null;
  qualityControlApprovalDate: Date | null;
  supervisionApproval: boolean;
  supervisionApproverName: string | null;
  supervisionApprovalDate: Date | null;
  status: string;
  summaryNotes: string | null;
  createdAt: Date;
  updatedAt: Date;
  projectChapter?: {
    id: string;
    fileType: string;
    project: {
      id: string;
      code: string;
      name: string;
    };
    chapter: {
      id: string;
      code: string;
      name: string;
    };
  };
  participants: {
    id: string;
    role: string;
    name: string | null;
    company: string | null;
    phone: string | null;
  }[];
  crewMembers: {
    id: string;
    name: string;
    role: string | null;
  }[];
  equipment: {
    id: string;
    name: string;
    quantity: number;
    notes: string | null;
  }[];
  tests: {
    id: string;
    testType: string;
    requirement: string | null;
    result: string | null;
    certificateNumber: string | null;
    status: string | null;
  }[];
  attachments: {
    id: string;
    filename: string;
    filepath: string;
    filesize: number;
    mimetype: string;
    uploadedAt: Date;
  }[];
}
