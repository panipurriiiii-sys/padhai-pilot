-- AlterTable
ALTER TABLE "StudentFeeRecord" ADD COLUMN     "instalmentNo" INTEGER NOT NULL DEFAULT 1,
ADD COLUMN     "structureId" TEXT,
ADD COLUMN     "voidReason" TEXT,
ADD COLUMN     "voidedAt" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "BatchFeeStructure" (
    "id" TEXT NOT NULL,
    "instituteId" TEXT NOT NULL,
    "batchId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "academicYear" TEXT,
    "schedule" JSONB NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "createdById" TEXT NOT NULL,
    "voidedAt" TIMESTAMP(3),
    "voidReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BatchFeeStructure_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FeePayment" (
    "id" TEXT NOT NULL,
    "instituteId" TEXT NOT NULL,
    "feeRecordId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "paidOn" TIMESTAMP(3) NOT NULL,
    "mode" TEXT NOT NULL,
    "reference" TEXT,
    "note" TEXT,
    "receiptNumber" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ISSUED',
    "recordedById" TEXT NOT NULL,
    "voidedAt" TIMESTAMP(3),
    "voidedById" TEXT,
    "voidReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FeePayment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InstituteCounter" (
    "instituteId" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "value" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "InstituteCounter_pkey" PRIMARY KEY ("instituteId","key")
);

-- CreateTable
CREATE TABLE "StudentLeaveApplication" (
    "id" TEXT NOT NULL,
    "instituteId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "batchId" TEXT,
    "startDate" DATE NOT NULL,
    "endDate" DATE NOT NULL,
    "totalDays" INTEGER NOT NULL DEFAULT 1,
    "reason" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "reviewedById" TEXT,
    "reviewerRemarks" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StudentLeaveApplication_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "BatchFeeStructure_instituteId_batchId_idx" ON "BatchFeeStructure"("instituteId", "batchId");

-- CreateIndex
CREATE INDEX "BatchFeeStructure_batchId_status_idx" ON "BatchFeeStructure"("batchId", "status");

-- CreateIndex
CREATE INDEX "FeePayment_feeRecordId_idx" ON "FeePayment"("feeRecordId");

-- CreateIndex
CREATE INDEX "FeePayment_studentId_createdAt_idx" ON "FeePayment"("studentId", "createdAt");

-- CreateIndex
CREATE INDEX "FeePayment_instituteId_paidOn_idx" ON "FeePayment"("instituteId", "paidOn");

-- CreateIndex
CREATE UNIQUE INDEX "FeePayment_instituteId_receiptNumber_key" ON "FeePayment"("instituteId", "receiptNumber");

-- CreateIndex
CREATE INDEX "StudentLeaveApplication_instituteId_status_idx" ON "StudentLeaveApplication"("instituteId", "status");

-- CreateIndex
CREATE INDEX "StudentLeaveApplication_studentId_createdAt_idx" ON "StudentLeaveApplication"("studentId", "createdAt");

-- CreateIndex
CREATE INDEX "StudentLeaveApplication_batchId_status_idx" ON "StudentLeaveApplication"("batchId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "StudentFeeRecord_structureId_studentId_instalmentNo_key" ON "StudentFeeRecord"("structureId", "studentId", "instalmentNo");

-- AddForeignKey
ALTER TABLE "StudentFeeRecord" ADD CONSTRAINT "StudentFeeRecord_structureId_fkey" FOREIGN KEY ("structureId") REFERENCES "BatchFeeStructure"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FeePayment" ADD CONSTRAINT "FeePayment_feeRecordId_fkey" FOREIGN KEY ("feeRecordId") REFERENCES "StudentFeeRecord"("id") ON DELETE CASCADE ON UPDATE CASCADE;

