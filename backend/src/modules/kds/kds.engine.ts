import { KdsCourse, KdsPriority, KdsSlaStatus } from './kds.types.js';

export class KdsEngine {
  /**
   * Route menu item to the appropriate kitchen station
   */
  static routeItemToStation(itemName: string, categoryName: string = ''): string {
    const text = `${itemName} ${categoryName}`.toLowerCase();

    if (text.match(/tandoor|naan|roti|kulcha|paratha|bread|bhathura|papad/)) {
      return 'TANDOOR';
    }
    if (text.match(/kebab|tikka|grill|seekh|tandoori malai|charcoal|barbecue/)) {
      return 'GRILL';
    }
    if (text.match(/curry|gravy|makhani|dal|masala|korma|handi|butter chicken|paneer tikka masala|shahi/)) {
      return 'CURRY';
    }
    if (text.match(/fry|pakoda|vada|samosa|crispy|french fries|nuggets|bhajia/)) {
      return 'FRY';
    }
    if (text.match(/chai|tea|coffee|lassi|juice|mojito|shake|beverage|drink|soda|water|beer|mocktail/)) {
      return 'BEVERAGE';
    }
    if (text.match(/kulfi|jamun|halwa|ice cream|dessert|rasmalai|sweet|custard|brownie/)) {
      return 'DESSERT';
    }
    if (text.match(/salad|raita|kachumber|green salad/)) {
      return 'SALAD';
    }

    return 'MAIN';
  }

  /**
   * Determine meal course for sequential kitchen firing
   */
  static detectCourse(itemName: string, categoryName: string = ''): KdsCourse {
    const text = `${itemName} ${categoryName}`.toLowerCase();

    if (text.match(/chai|coffee|lassi|juice|beverage|drink|mocktail|shake/)) {
      return 'BEVERAGE';
    }
    if (text.match(/kulfi|jamun|halwa|ice cream|dessert|rasmalai|sweet|custard/)) {
      return 'DESSERT';
    }
    if (text.match(/tikka|kebab|soup|starter|fry|pakoda|samosa|chaat|appetizer|crispy|chilli/)) {
      return 'STARTER';
    }

    return 'MAIN';
  }

  /**
   * Extract dietary & allergy alerts from items and customer notes
   */
  static detectDietaryAlerts(specialNotes: string = '', itemNames: string[] = []): string[] {
    const combined = `${specialNotes} ${itemNames.join(' ')}`.toLowerCase();
    const alerts: string[] = [];

    if (combined.match(/nut|peanut|cashew|almond|walnut|pista/)) {
      alerts.push('NUT_ALLERGY');
    }
    if (combined.match(/jain|no onion|no garlic|swaminarayan/)) {
      alerts.push('JAIN_FOOD');
    }
    if (combined.match(/gluten|celiac|no wheat|no atta/)) {
      alerts.push('GLUTEN_FREE');
    }
    if (combined.match(/dairy|lactose|no milk|no cheese|no butter|no paneer|vegan/)) {
      alerts.push('DAIRY_FREE');
    }
    if (combined.match(/egg|eggless/)) {
      alerts.push('EGG_ALERT');
    }
    if (combined.match(/extra spicy|very hot|extreme spice|ghost pepper|bhut jolokia/)) {
      alerts.push('EXTRA_SPICY');
    }
    if (combined.match(/less spicy|mild|no spice|kids food|baby/)) {
      alerts.push('MILD_SPICE');
    }

    return alerts;
  }

  /**
   * Calculate dynamic ETA based on item complexity, station queue, and kitchen load
   */
  static calculateDynamicEta(params: {
    items: Array<{ preparationTime?: number; quantity: number }>;
    stationQueueCounts?: number;
    activeKitchenOrdersCount?: number;
    priority?: KdsPriority;
  }): number {
    const { items, stationQueueCounts = 0, activeKitchenOrdersCount = 0, priority = 'NORMAL' } = params;

    // 1. Base item prep time
    let basePrep = 12;
    if (items.length > 0) {
      basePrep = Math.max(...items.map(i => (i.preparationTime && i.preparationTime > 0) ? i.preparationTime : 15));
    }

    // 2. Quantity volume factor
    const totalQty = items.reduce((acc, i) => acc + i.quantity, 0);
    const volumeAddon = totalQty > 8 ? 5 : totalQty > 4 ? 2 : 0;

    // 3. Station queue backlog factor
    const queueAddon = Math.min(10, Math.floor(stationQueueCounts * 1.5));

    // 4. Kitchen load capacity factor
    const loadAddon = Math.min(8, Math.floor(activeKitchenOrdersCount * 0.5));

    // 5. Priority reduction
    let priorityMod = 0;
    if (priority === 'RUSH' || priority === 'RE_FIRE') {
      priorityMod = -3;
    } else if (priority === 'VIP') {
      priorityMod = -2;
    }

    const calculated = basePrep + volumeAddon + queueAddon + loadAddon + priorityMod;
    return Math.max(5, calculated);
  }

  /**
   * Evaluate SLA State in real-time
   */
  static evaluateSlaStatus(params: {
    createdAt: Date | string;
    acceptedAt?: Date | string | null;
    isHeld?: boolean;
    dynamicEtaMinutes: number;
    warningThresholdMinutes?: number;
  }): {
    slaStatus: KdsSlaStatus;
    elapsedMinutes: number;
    remainingMinutes: number;
  } {
    const { createdAt, acceptedAt, isHeld = false, dynamicEtaMinutes, warningThresholdMinutes = 10 } = params;

    if (isHeld) {
      return { slaStatus: 'ON_TRACK', elapsedMinutes: 0, remainingMinutes: dynamicEtaMinutes };
    }

    const startTime = acceptedAt ? new Date(acceptedAt).getTime() : new Date(createdAt).getTime();
    const now = Date.now();
    const elapsedMinutes = Math.max(0, Math.floor((now - startTime) / 60000));
    const remainingMinutes = dynamicEtaMinutes - elapsedMinutes;

    let slaStatus: KdsSlaStatus = 'ON_TRACK';

    if (elapsedMinutes >= dynamicEtaMinutes + 5) {
      slaStatus = 'SLA_BREACHED';
    } else if (elapsedMinutes >= dynamicEtaMinutes) {
      slaStatus = 'DELAYED';
    } else if (elapsedMinutes >= Math.max(5, dynamicEtaMinutes - (dynamicEtaMinutes - warningThresholdMinutes))) {
      slaStatus = 'AT_RISK';
    }

    return { slaStatus, elapsedMinutes, remainingMinutes };
  }
}
