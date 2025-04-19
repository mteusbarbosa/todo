/*
  Warnings:

  - Added the required column `order` to the `Task` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Task" ADD COLUMN     "order" DOUBLE PRECISION NOT NULL;

-- CreateIndex
CREATE INDEX "Task_order_idx" ON "Task"("order");
