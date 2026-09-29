import { FastifyInstance, FastifyPluginAsync, FastifyRequest, FastifyReply } from 'fastify';
import { prisma } from '../../config/db.js';

// Haversine geodesic distance in kilometers
function calculateHaversineDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 10) / 10;
}

// Multi-Factor DSA Recommendation Scorer
function computeRecommendationScore(
  restaurant: any,
  userLat?: number,
  userLng?: number,
  preferredCuisine?: string,
  pureVegOnly?: boolean,
  targetBudget?: number
): { score: number; distanceKm: number; reasons: string[] } {
  const reasons: string[] = [];
  let score = 0;

  // 1. Distance factor (40% weight if location available)
  let distanceKm = 2.5; // Default reference distance
  if (userLat !== undefined && userLng !== undefined && restaurant.latitude && restaurant.longitude) {
    distanceKm = calculateHaversineDistanceKm(userLat, userLng, restaurant.latitude, restaurant.longitude);
    const maxRadius = 25.0; // 25 km threshold
    const distanceScore = Math.max(0, 1 - distanceKm / maxRadius) * 40;
    score += distanceScore;
    if (distanceKm <= 3.0) {
      reasons.push(`Nearby (${distanceKm} km)`);
    } else {
      reasons.push(`${distanceKm} km away`);
    }
  } else {
    score += 25; // Default neutral distance baseline
  }

  // 2. Bayesian Quality & Popularity factor (30% weight)
  const R = restaurant.rating || 4.5;
  const v = restaurant.reviewCount || 100;
  const m = 50;
  const C = 4.5;
  const bayesianRating = (v / (v + m)) * R + (m / (v + m)) * C;
  const qualityScore = (bayesianRating / 5.0) * 30;
  score += qualityScore;
  if (R >= 4.8) reasons.push(`Top-Rated (${R}★)`);

  // 3. Cuisine & Dietary Affinity (20% weight)
  if (pureVegOnly) {
    if (restaurant.isPureVeg) {
      score += 15;
      reasons.push('100% Pure Veg Verified');
    } else {
      score -= 30; // Strong penalty if customer requested Pure Veg only
    }
  }

  if (preferredCuisine && preferredCuisine !== 'ALL') {
    const cuisineLower = (restaurant.cuisineType || '').toLowerCase();
    const queryLower = preferredCuisine.toLowerCase();
    if (cuisineLower.includes(queryLower)) {
      score += 15;
      reasons.push(`Matches ${preferredCuisine}`);
    }
  }

  // 4. Budget fit (10% weight)
  if (targetBudget && targetBudget > 0) {
    const cost = restaurant.costForTwo || 800;
    const diff = Math.abs(cost - targetBudget);
    const budgetScore = Math.max(0, 1 - diff / targetBudget) * 10;
    score += budgetScore;
    if (cost <= targetBudget) reasons.push('Within Target Budget');
  } else {
    score += 5;
  }

  return {
    score: Math.min(100, Math.max(0, Math.round(score))),
    distanceKm,
    reasons: reasons.slice(0, 3)
  };
}

export const recommendationRoutes: FastifyPluginAsync = async (server: FastifyInstance) => {
  server.get('/', async (request: FastifyRequest, reply: FastifyReply) => {
    const { lat, lng, cuisine, pureVeg, budget, limit } = request.query as {
      lat?: string;
      lng?: string;
      cuisine?: string;
      pureVeg?: string;
      budget?: string;
      limit?: string;
    };

    const userLat = lat ? parseFloat(lat) : undefined;
    const userLng = lng ? parseFloat(lng) : undefined;
    const isPureVeg = pureVeg === 'true';
    const targetBudget = budget ? parseInt(budget, 10) : undefined;
    const maxResults = limit ? parseInt(limit, 10) : 10;

    const allRestaurants = await prisma.restaurant.findMany({
      where: {
        isActive: true,
        ...(isPureVeg ? { isPureVeg: true } : {})
      },
      include: {
        branches: true
      }
    });

    // Score and rank using DSA multi-factor scoring
    const scoredRestaurants = allRestaurants.map((restaurant) => {
      const { score, distanceKm, reasons } = computeRecommendationScore(
        restaurant,
        userLat,
        userLng,
        cuisine,
        isPureVeg,
        targetBudget
      );

      return {
        ...restaurant,
        distanceKm,
        matchScorePercent: score,
        recommendationReasons: reasons
      };
    });

    // QuickSort / Max-Heap by highest match score descending
    scoredRestaurants.sort((a, b) => b.matchScorePercent - a.matchScorePercent);

    return reply.send({
      success: true,
      count: Math.min(maxResults, scoredRestaurants.length),
      userCoordinates: userLat && userLng ? { lat: userLat, lng: userLng } : null,
      data: scoredRestaurants.slice(0, maxResults)
    });
  });
};
