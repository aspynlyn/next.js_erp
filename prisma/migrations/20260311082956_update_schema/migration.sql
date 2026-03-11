/*
  Warnings:

  - The primary key for the `Partner` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `ptCreatedAt` on the `Partner` table. All the data in the column will be lost.
  - You are about to drop the column `ptEmail` on the `Partner` table. All the data in the column will be lost.
  - You are about to drop the column `ptId` on the `Partner` table. All the data in the column will be lost.
  - You are about to drop the column `ptIsActive` on the `Partner` table. All the data in the column will be lost.
  - You are about to drop the column `ptName` on the `Partner` table. All the data in the column will be lost.
  - You are about to drop the column `ptPhone` on the `Partner` table. All the data in the column will be lost.
  - You are about to drop the column `ptType` on the `Partner` table. All the data in the column will be lost.
  - The primary key for the `Product` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `pdCode` on the `Product` table. All the data in the column will be lost.
  - You are about to drop the column `pdCreatedAt` on the `Product` table. All the data in the column will be lost.
  - You are about to drop the column `pdCurrentStock` on the `Product` table. All the data in the column will be lost.
  - You are about to drop the column `pdId` on the `Product` table. All the data in the column will be lost.
  - You are about to drop the column `pdIsSale` on the `Product` table. All the data in the column will be lost.
  - You are about to drop the column `pdName` on the `Product` table. All the data in the column will be lost.
  - You are about to drop the column `pdPrice` on the `Product` table. All the data in the column will be lost.
  - You are about to drop the column `pdSafetyStock` on the `Product` table. All the data in the column will be lost.
  - The primary key for the `StockMovement` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `smCreatedAt` on the `StockMovement` table. All the data in the column will be lost.
  - You are about to drop the column `smId` on the `StockMovement` table. All the data in the column will be lost.
  - You are about to drop the column `smMemo` on the `StockMovement` table. All the data in the column will be lost.
  - You are about to drop the column `smProductId` on the `StockMovement` table. All the data in the column will be lost.
  - You are about to drop the column `smQuantity` on the `StockMovement` table. All the data in the column will be lost.
  - You are about to drop the column `smType` on the `StockMovement` table. All the data in the column will be lost.
  - The primary key for the `User` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `uCreatedAt` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `uId` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `uIsDelete` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `uPassword` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `uRole` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `uUsername` on the `User` table. All the data in the column will be lost.
  - Added the required column `id` to the `Partner` table without a default value. This is not possible if the table is not empty.
  - Added the required column `name` to the `Partner` table without a default value. This is not possible if the table is not empty.
  - Added the required column `phone` to the `Partner` table without a default value. This is not possible if the table is not empty.
  - Added the required column `type` to the `Partner` table without a default value. This is not possible if the table is not empty.
  - Added the required column `code` to the `Product` table without a default value. This is not possible if the table is not empty.
  - Added the required column `currentStock` to the `Product` table without a default value. This is not possible if the table is not empty.
  - Added the required column `id` to the `Product` table without a default value. This is not possible if the table is not empty.
  - Added the required column `name` to the `Product` table without a default value. This is not possible if the table is not empty.
  - Added the required column `price` to the `Product` table without a default value. This is not possible if the table is not empty.
  - Added the required column `safetyStock` to the `Product` table without a default value. This is not possible if the table is not empty.
  - Added the required column `id` to the `StockMovement` table without a default value. This is not possible if the table is not empty.
  - Added the required column `productId` to the `StockMovement` table without a default value. This is not possible if the table is not empty.
  - Added the required column `quantity` to the `StockMovement` table without a default value. This is not possible if the table is not empty.
  - Added the required column `type` to the `StockMovement` table without a default value. This is not possible if the table is not empty.
  - Added the required column `id` to the `User` table without a default value. This is not possible if the table is not empty.
  - Added the required column `password` to the `User` table without a default value. This is not possible if the table is not empty.
  - Added the required column `role` to the `User` table without a default value. This is not possible if the table is not empty.
  - Added the required column `username` to the `User` table without a default value. This is not possible if the table is not empty.

*/
-- CreateTable
CREATE TABLE "PurchaseOrders" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "partnerId" INTEGER NOT NULL,
    "productId" INTEGER NOT NULL,
    "quantity" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'REQUESTED',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "PurchaseOrders_partnerId_fkey" FOREIGN KEY ("partnerId") REFERENCES "Partner" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "PurchaseOrders_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "SalesOrders" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "partnerId" INTEGER NOT NULL,
    "productId" INTEGER NOT NULL,
    "quantity" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'RECEIVED',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "SalesOrders_partnerId_fkey" FOREIGN KEY ("partnerId") REFERENCES "Partner" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "SalesOrders_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Partner" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "email" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "isActive" BOOLEAN NOT NULL DEFAULT true
);
DROP TABLE "Partner";
ALTER TABLE "new_Partner" RENAME TO "Partner";
CREATE TABLE "new_Product" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "price" INTEGER NOT NULL,
    "safetyStock" INTEGER NOT NULL,
    "currentStock" INTEGER NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "isSale" BOOLEAN NOT NULL DEFAULT true
);
DROP TABLE "Product";
ALTER TABLE "new_Product" RENAME TO "Product";
CREATE UNIQUE INDEX "Product_code_key" ON "Product"("code");
CREATE TABLE "new_StockMovement" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "productId" INTEGER NOT NULL,
    "quantity" INTEGER NOT NULL,
    "type" TEXT NOT NULL,
    "memo" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "StockMovement_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
DROP TABLE "StockMovement";
ALTER TABLE "new_StockMovement" RENAME TO "StockMovement";
CREATE TABLE "new_User" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "password" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "isDelete" BOOLEAN NOT NULL DEFAULT false
);
DROP TABLE "User";
ALTER TABLE "new_User" RENAME TO "User";
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
