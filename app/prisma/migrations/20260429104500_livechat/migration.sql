-- CreateEnum
CREATE TYPE "LivechatAuthorKind" AS ENUM ('AUTH', 'GUEST');

-- AlterTable
ALTER TABLE "User" ADD COLUMN "chatBannedUntil" TIMESTAMP(3),
ADD COLUMN "chatBanReason" TEXT,
ADD COLUMN "livechatConsentAt" TIMESTAMP(3),
ADD COLUMN "livechatUsernameColor" TEXT;

-- CreateTable
CREATE TABLE "LivechatMessage" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "body" VARCHAR(800) NOT NULL,
    "authorKind" "LivechatAuthorKind" NOT NULL,
    "userId" TEXT,
    "guestSessionId" TEXT,
    "authorLabel" VARCHAR(120) NOT NULL,
    "usernameColor" VARCHAR(32) NOT NULL,

    CONSTRAINT "LivechatMessage_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "LivechatMessage_createdAt_idx" ON "LivechatMessage" ("createdAt" DESC);

-- CreateIndex
CREATE INDEX "LivechatMessage_guestSessionId_idx" ON "LivechatMessage" ("guestSessionId");

-- AddForeignKey
ALTER TABLE "LivechatMessage" ADD CONSTRAINT "LivechatMessage_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- CreateTable
CREATE TABLE "LivechatGuestConsent" (
    "guestSessionId" VARCHAR(48) NOT NULL,
    "acceptedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LivechatGuestConsent_pkey" PRIMARY KEY ("guestSessionId")
);
