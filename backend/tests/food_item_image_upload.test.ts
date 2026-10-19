import { describe, it, expect, beforeAll } from 'vitest';
import sharp from 'sharp';
import fs from 'fs';
import path from 'path';

const API_BASE = 'http://localhost:8080/api';

describe('Food Item Image Upload & Menu Association Master Suite', () => {
  let authToken = '';
  let restaurantId = '';
  let testItemId = '';
  let testCategoryId = '';

  beforeAll(async () => {
    // 1. Authenticate as Restaurant Owner/Manager
    const loginRes = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'owner.punjab@dinedeck.in',
        password: 'Dinedeck@2026'
      })
    });

    const loginData = await loginRes.json();
    expect(loginRes.status).toBe(200);
    expect(loginData.success).toBe(true);
    authToken = loginData.data.accessToken;
    restaurantId = loginData.data.restaurant.id;

    // 2. Fetch existing menu to pick a category and item
    const menuRes = await fetch(`${API_BASE}/restaurants/${restaurantId}/menu`);
    const menuData = await menuRes.json();
    expect(menuRes.status).toBe(200);
    expect(menuData.categories.length).toBeGreaterThan(0);

    testCategoryId = menuData.categories[0].id;
    if (menuData.categories[0].items.length > 0) {
      testItemId = menuData.categories[0].items[0].id;
    }
  });

  it('1. Upload Health Check verifies 200 KB strict limit and WebP/JPG/PNG support', async () => {
    const res = await fetch(`${API_BASE}/upload/health`);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.status).toBe('healthy');
    expect(data.maxSizeKb).toBe(200);
    expect(data.maxSizeBytes).toBe(204800);
    expect(data.supportedFormats).toContain('webp');
    expect(data.supportedFormats).toContain('jpeg');
    expect(data.supportedFormats).toContain('png');
    expect(data.storageAccessible).toBe(true);
  });

  it('2. Rejects unauthenticated upload requests with 401 Unauthorized', async () => {
    const res = await fetch(`${API_BASE}/upload/food-item-image`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        imageBase64: 'dGVzdA=='
      })
    });

    expect(res.status).toBe(401);
    const data = await res.json();
    expect(data.success).toBe(false);
  });

  it('3. Rejects invalid or corrupt files with 400 Bad Request', async () => {
    const fakeFileBase64 = Buffer.from('NOT_AN_IMAGE_THIS_IS_CORRUPTED_TEXT').toString('base64');
    const res = await fetch(`${API_BASE}/upload/food-item-image`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${authToken}`
      },
      body: JSON.stringify({
        imageBase64: fakeFileBase64,
        restaurantId
      })
    });

    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.success).toBe(false);
    expect(data.message).toMatch(/Invalid file format|corrupted/i);
  });

  it('4. Uploads, optimizes, and compresses food image into WebP strictly under 200 KB', async () => {
    // Generate a valid test food photo buffer (600x450 JPEG)
    const testImageBuffer = await sharp({
      create: {
        width: 600,
        height: 450,
        channels: 3,
        background: { r: 217, g: 83, b: 30 }
      }
    })
      .jpeg({ quality: 90 })
      .toBuffer();

    const base64Data = testImageBuffer.toString('base64');

    const res = await fetch(`${API_BASE}/upload/food-item-image`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${authToken}`
      },
      body: JSON.stringify({
        imageBase64: `data:image/jpeg;base64,${base64Data}`,
        restaurantId,
        itemId: testItemId
      })
    });

    const data = await res.json();
    expect(res.status).toBe(201);
    expect(data.success).toBe(true);
    expect(data.imageUrl).toMatch(/^\/uploads\/menu-items\/food_.*\.webp$/);
    expect(data.thumbnailUrl).toMatch(/^\/uploads\/menu-items\/food_.*_thumb\.webp$/);
    expect(data.format).toBe('webp');
    // STRICT 200 KB VALIDATION
    expect(data.sizeBytes).toBeLessThanOrEqual(204800);
    expect(data.sizeKb).toBeLessThanOrEqual(200);
    expect(data.thumbSizeBytes).toBeLessThanOrEqual(50000); // Thumbnails are lightweight

    // Verify static serving of the main image
    const staticRes = await fetch(`http://localhost:8080${data.imageUrl}`);
    expect(staticRes.status).toBe(200);
    const staticHeader = staticRes.headers.get('content-type');
    expect(staticHeader).toContain('image/webp');

    // Verify static serving of the thumbnail
    const thumbRes = await fetch(`http://localhost:8080${data.thumbnailUrl}`);
    expect(thumbRes.status).toBe(200);
    expect(thumbRes.headers.get('content-type')).toContain('image/webp');
  });

  it('5. Automatically compresses high-resolution oversized image to <= 200 KB WebP', async () => {
    // Generate large 1800x1200 image
    const largeImageBuffer = await sharp({
      create: {
        width: 1800,
        height: 1200,
        channels: 3,
        background: { r: 245, g: 158, b: 11 }
      }
    })
      .png()
      .toBuffer();

    const base64Data = largeImageBuffer.toString('base64');

    const res = await fetch(`${API_BASE}/upload/food-item-image`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${authToken}`
      },
      body: JSON.stringify({
        imageBase64: base64Data,
        restaurantId
      })
    });

    const data = await res.json();
    expect(res.status).toBe(201);
    expect(data.success).toBe(true);
    expect(data.sizeBytes).toBeLessThanOrEqual(204800);
    expect(data.sizeKb).toBeLessThanOrEqual(200);
    expect(data.format).toBe('webp');
  });

  it('6. Persists imageUrl via PATCH /api/staff/menu/items/:id and verifies retrieval in customer menu', async () => {
    const customImageUrl = `/uploads/menu-items/food_test_${Date.now()}.webp`;

    const patchRes = await fetch(`${API_BASE}/staff/menu/items/${testItemId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${authToken}`
      },
      body: JSON.stringify({
        imageUrl: customImageUrl,
        price: 349,
        discountedPrice: 299
      })
    });

    const patchData = await patchRes.json();
    expect(patchRes.status).toBe(200);
    expect(patchData.success).toBe(true);
    expect(patchData.data.imageUrl).toBe(customImageUrl);

    // Verify in public menu API
    const menuRes = await fetch(`${API_BASE}/restaurants/${restaurantId}/menu`);
    const menuData = await menuRes.json();
    expect(menuRes.status).toBe(200);

    const updatedItem = menuData.categories
      .flatMap((c: any) => c.items)
      .find((i: any) => i.id === testItemId);

    expect(updatedItem).toBeDefined();
    expect(updatedItem.imageUrl).toBe(customImageUrl);
  });

  it('7. Creates a new food item via POST /api/staff/menu/items with imageUrl', async () => {
    const newFoodImageUrl = `/uploads/menu-items/food_paneer_tikka_${Date.now()}.webp`;

    const createRes = await fetch(`${API_BASE}/staff/menu/items`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${authToken}`
      },
      body: JSON.stringify({
        restaurantId,
        categoryId: testCategoryId,
        name: 'Angaari Paneer Tikka (Signature)',
        description: 'Tender cottage cheese cubes marinated in Kashmiri degi mirch, hung curd, and mustard oil.',
        price: 310,
        discountedPrice: 279,
        imageUrl: newFoodImageUrl,
        isVeg: true,
        stationCode: 'TANDOOR',
        preparationTime: 15,
        isBestseller: true
      })
    });

    const createData = await createRes.json();
    expect(createRes.status).toBe(201);
    expect(createData.success).toBe(true);
    expect(createData.data.name).toBe('Angaari Paneer Tikka (Signature)');
    expect(createData.data.imageUrl).toBe(newFoodImageUrl);
    expect(createData.data.price).toBe(310);
  });
});
