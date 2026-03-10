-- CreateTable
CREATE TABLE "User" (
    "uId" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "uPassword" TEXT NOT NULL,
    "uUsername" TEXT NOT NULL,
    "uRole" TEXT NOT NULL,
    "uCreatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "uIsDelete" BOOLEAN NOT NULL DEFAULT false
);

-- CreateTable
CREATE TABLE "Product" (
    "pdId" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "pdCode" TEXT NOT NULL,
    "pdName" TEXT NOT NULL,
    "pdPrice" INTEGER NOT NULL,
    "pdSafetyStock" INTEGER NOT NULL,
    "pdCurrentStock" INTEGER NOT NULL,
    "pdCreatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "pdIsSale" BOOLEAN NOT NULL DEFAULT true
);

-- CreateTable
CREATE TABLE "Partner" (
    "ptId" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "ptName" TEXT NOT NULL,
    "ptType" TEXT NOT NULL,
    "ptPhone" TEXT NOT NULL,
    "ptEmail" TEXT,
    "ptCreatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ptIsActive" BOOLEAN NOT NULL DEFAULT true
);

-- CreateTable
CREATE TABLE "StockMovement" (
    "smId" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "smProductId" INTEGER NOT NULL,
    "smQuantity" INTEGER NOT NULL,
    "smType" TEXT NOT NULL,
    "smMemo" TEXT,
    "smCreatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "StockMovement_smProductId_fkey" FOREIGN KEY ("smProductId") REFERENCES "Product" ("pdId") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "User_uUsername_key" ON "User"("uUsername");

-- CreateIndex
CREATE UNIQUE INDEX "Product_pdCode_key" ON "Product"("pdCode");
