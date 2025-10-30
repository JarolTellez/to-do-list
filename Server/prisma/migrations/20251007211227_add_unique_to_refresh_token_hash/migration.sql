/*
  Warnings:

  - A unique constraint covering the columns `[refresh_token_hash]` on the table `sessions` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX `sessions_refresh_token_hash_key` ON `sessions`(`refresh_token_hash`);
