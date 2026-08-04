-- CreateTable
CREATE TABLE "Project" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Project_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Professional" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "company" TEXT,
    "phone" TEXT,
    "email" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Professional_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Chapter" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "Chapter_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProjectChapter" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "chapterId" TEXT NOT NULL,
    "fileType" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProjectChapter_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Checklist" (
    "id" TEXT NOT NULL,
    "projectChapterId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "building" TEXT,
    "elementType" TEXT,
    "location" TEXT,
    "planNumber" TEXT,
    "mainContractor" TEXT,
    "openDate" TIMESTAMP(3),
    "closeDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Checklist_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ChecklistItem" (
    "id" TEXT NOT NULL,
    "checklistId" TEXT NOT NULL,
    "workStage" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "responsible" TEXT NOT NULL,
    "name" TEXT,
    "signature" TEXT,
    "date" TIMESTAMP(3),
    "notes" TEXT,
    "isCompleted" BOOLEAN NOT NULL DEFAULT false,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "ChecklistItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TestSection" (
    "id" TEXT NOT NULL,
    "formNumber" TEXT NOT NULL,
    "projectChapterId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "sectionName" TEXT NOT NULL,
    "locationDescription" TEXT,
    "structure" TEXT,
    "crossSections" TEXT,
    "descriptionNotes" TEXT,
    "executionSteps" TEXT,
    "qualityControlApproval" BOOLEAN NOT NULL DEFAULT false,
    "qualityControlApproverName" TEXT,
    "qualityControlApprovalDate" TIMESTAMP(3),
    "supervisionApproval" BOOLEAN NOT NULL DEFAULT false,
    "supervisionApproverName" TEXT,
    "supervisionApprovalDate" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'pending',
    "summaryNotes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TestSection_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Participant" (
    "id" TEXT NOT NULL,
    "testSectionId" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "name" TEXT,
    "company" TEXT,
    "phone" TEXT,

    CONSTRAINT "Participant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CrewMember" (
    "id" TEXT NOT NULL,
    "testSectionId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" TEXT,

    CONSTRAINT "CrewMember_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Equipment" (
    "id" TEXT NOT NULL,
    "testSectionId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "notes" TEXT,

    CONSTRAINT "Equipment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Test" (
    "id" TEXT NOT NULL,
    "testSectionId" TEXT NOT NULL,
    "testType" TEXT NOT NULL,
    "requirement" TEXT,
    "result" TEXT,
    "certificateNumber" TEXT,
    "status" TEXT,

    CONSTRAINT "Test_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Attachment" (
    "id" TEXT NOT NULL,
    "testSectionId" TEXT NOT NULL,
    "filename" TEXT NOT NULL,
    "filepath" TEXT NOT NULL,
    "filesize" INTEGER NOT NULL,
    "mimetype" TEXT NOT NULL,
    "uploadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Attachment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Project_code_key" ON "Project"("code");

-- CreateIndex
CREATE UNIQUE INDEX "Chapter_code_key" ON "Chapter"("code");

-- CreateIndex
CREATE UNIQUE INDEX "ProjectChapter_projectId_chapterId_fileType_key" ON "ProjectChapter"("projectId", "chapterId", "fileType");

-- CreateIndex
CREATE UNIQUE INDEX "TestSection_formNumber_key" ON "TestSection"("formNumber");

-- AddForeignKey
ALTER TABLE "Professional" ADD CONSTRAINT "Professional_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjectChapter" ADD CONSTRAINT "ProjectChapter_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjectChapter" ADD CONSTRAINT "ProjectChapter_chapterId_fkey" FOREIGN KEY ("chapterId") REFERENCES "Chapter"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Checklist" ADD CONSTRAINT "Checklist_projectChapterId_fkey" FOREIGN KEY ("projectChapterId") REFERENCES "ProjectChapter"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChecklistItem" ADD CONSTRAINT "ChecklistItem_checklistId_fkey" FOREIGN KEY ("checklistId") REFERENCES "Checklist"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TestSection" ADD CONSTRAINT "TestSection_projectChapterId_fkey" FOREIGN KEY ("projectChapterId") REFERENCES "ProjectChapter"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Participant" ADD CONSTRAINT "Participant_testSectionId_fkey" FOREIGN KEY ("testSectionId") REFERENCES "TestSection"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CrewMember" ADD CONSTRAINT "CrewMember_testSectionId_fkey" FOREIGN KEY ("testSectionId") REFERENCES "TestSection"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Equipment" ADD CONSTRAINT "Equipment_testSectionId_fkey" FOREIGN KEY ("testSectionId") REFERENCES "TestSection"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Test" ADD CONSTRAINT "Test_testSectionId_fkey" FOREIGN KEY ("testSectionId") REFERENCES "TestSection"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Attachment" ADD CONSTRAINT "Attachment_testSectionId_fkey" FOREIGN KEY ("testSectionId") REFERENCES "TestSection"("id") ON DELETE CASCADE ON UPDATE CASCADE;
