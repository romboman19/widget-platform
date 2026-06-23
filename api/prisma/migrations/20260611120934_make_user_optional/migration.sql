-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_MediaFile" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT,
    "folderId" TEXT,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "subtype" TEXT NOT NULL,
    "originalUrl" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "thumbnailUrl" TEXT,
    "channelType" TEXT,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "svgContent" TEXT,
    "size" INTEGER NOT NULL,
    "hash" TEXT NOT NULL,
    "width" INTEGER,
    "height" INTEGER,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "MediaFile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "MediaFile_folderId_fkey" FOREIGN KEY ("folderId") REFERENCES "MediaFolder" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_MediaFile" ("channelType", "createdAt", "folderId", "hash", "height", "id", "isDefault", "mimeType", "name", "originalUrl", "size", "slug", "subtype", "svgContent", "thumbnailUrl", "type", "updatedAt", "url", "userId", "width") SELECT "channelType", "createdAt", "folderId", "hash", "height", "id", "isDefault", "mimeType", "name", "originalUrl", "size", "slug", "subtype", "svgContent", "thumbnailUrl", "type", "updatedAt", "url", "userId", "width" FROM "MediaFile";
DROP TABLE "MediaFile";
ALTER TABLE "new_MediaFile" RENAME TO "MediaFile";
CREATE UNIQUE INDEX "MediaFile_slug_key" ON "MediaFile"("slug");
CREATE UNIQUE INDEX "MediaFile_hash_key" ON "MediaFile"("hash");
CREATE INDEX "MediaFile_userId_folderId_idx" ON "MediaFile"("userId", "folderId");
CREATE INDEX "MediaFile_type_subtype_idx" ON "MediaFile"("type", "subtype");
CREATE INDEX "MediaFile_channelType_idx" ON "MediaFile"("channelType");
CREATE TABLE "new_MediaFolder" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT,
    "name" TEXT NOT NULL,
    "parentId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "MediaFolder_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "MediaFolder_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "MediaFolder" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_MediaFolder" ("createdAt", "id", "name", "parentId", "updatedAt", "userId") SELECT "createdAt", "id", "name", "parentId", "updatedAt", "userId" FROM "MediaFolder";
DROP TABLE "MediaFolder";
ALTER TABLE "new_MediaFolder" RENAME TO "MediaFolder";
CREATE INDEX "MediaFolder_userId_idx" ON "MediaFolder"("userId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
