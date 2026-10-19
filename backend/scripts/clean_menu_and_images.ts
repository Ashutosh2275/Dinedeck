import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('--- 1. Removing all images from all menu items across the ecosystem ---');
  const imgUpdate = await prisma.menuItem.updateMany({
    data: {
      imageUrl: ''
    }
  });
  console.log(`Cleared images on ${imgUpdate.count} menu items.`);

  console.log('\n--- 2. Deduplicating categories & items for rest_punjab_heritage ---');
  const punjabCategories = await prisma.menuCategory.findMany({
    where: { restaurantId: 'rest_punjab_heritage' },
    include: { items: true },
    orderBy: { createdAt: 'asc' }
  });

  const seenCategoryNames = new Map<string, string>(); // name -> keeperCategoryId

  for (const cat of punjabCategories) {
    if (!seenCategoryNames.has(cat.name)) {
      seenCategoryNames.set(cat.name, cat.id);
      console.log(`Keeping category "${cat.name}" (ID: ${cat.id})`);
    } else {
      const keeperId = seenCategoryNames.get(cat.name)!;
      console.log(`Duplicate category "${cat.name}" (ID: ${cat.id}) -> Merging items into keeper ${keeperId}`);

      // Check each item in the duplicate category
      for (const item of cat.items) {
        // Check if an item with the same name already exists in keeper
        const existingInKeeper = await prisma.menuItem.findFirst({
          where: { categoryId: keeperId, name: item.name }
        });

        if (existingInKeeper) {
          console.log(`   Deleting duplicate item "${item.name}" (ID: ${item.id})`);
          await prisma.menuItem.delete({ where: { id: item.id } });
        } else {
          console.log(`   Moving unique item "${item.name}" (ID: ${item.id}) to keeper category`);
          await prisma.menuItem.update({
            where: { id: item.id },
            data: { categoryId: keeperId }
          });
        }
      }

      // Delete the empty duplicate category
      await prisma.menuCategory.delete({ where: { id: cat.id } });
      console.log(`   Deleted duplicate category ${cat.id}`);
    }
  }

  // Deduplicate any items within the same category if any remain
  const remainingCategories = await prisma.menuCategory.findMany({
    where: { restaurantId: 'rest_punjab_heritage' },
    include: { items: true }
  });

  console.log('\n--- Final Verified Menu for rest_punjab_heritage ---');
  for (const c of remainingCategories) {
    console.log(`Category: "${c.name}" (ID: ${c.id}) -> ${c.items.length} items`);
    for (const item of c.items) {
      console.log(`   * ${item.name} | Price: ₹${item.price} | isAvailable: ${item.isAvailable} | img: ${item.imageUrl}`);
    }
  }
}

main().finally(() => prisma.$disconnect());
