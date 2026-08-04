-- CreateTable
CREATE TABLE "TestSection" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "formNumber" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "projectName" TEXT NOT NULL,
    "date" DATETIME NOT NULL,
    "sectionName" TEXT NOT NULL,
    "locationDescription" TEXT,
    "structure" TEXT,
    "crossSections" TEXT,
    "descriptionNotes" TEXT,
    "executionSteps" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "summaryNotes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Participant" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "testSectionId" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "name" TEXT,
    "company" TEXT,
    "phone" TEXT,
    CONSTRAINT "Participant_testSectionId_fkey" FOREIGN KEY ("testSectionId") REFERENCES "TestSection" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "CrewMember" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "testSectionId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" TEXT,
    CONSTRAINT "CrewMember_testSectionId_fkey" FOREIGN KEY ("testSectionId") REFERENCES "TestSection" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Equipment" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "testSectionId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "notes" TEXT,
    CONSTRAINT "Equipment_testSectionId_fkey" FOREIGN KEY ("testSectionId") REFERENCES "TestSection" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Test" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "testSectionId" TEXT NOT NULL,
    "testType" TEXT NOT NULL,
    "requirement" TEXT,
    "result" TEXT,
    "certificateNumber" TEXT,
    "status" TEXT,
    CONSTRAINT "Test_testSectionId_fkey" FOREIGN KEY ("testSectionId") REFERENCES "TestSection" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Attachment" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "testSectionId" TEXT NOT NULL,
    "filename" TEXT NOT NULL,
    "filepath" TEXT NOT NULL,
    "filesize" INTEGER NOT NULL,
    "mimetype" TEXT NOT NULL,
    "uploadedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Attachment_testSectionId_fkey" FOREIGN KEY ("testSectionId") REFERENCES "TestSection" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "TestSection_formNumber_key" ON "TestSection"("formNumber");
