-- AlterTable
ALTER TABLE "Product" ADD COLUMN     "allergens" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "calories" INTEGER,
ADD COLUMN     "dietary" TEXT[] DEFAULT ARRAY[]::TEXT[];
