import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding DINEDECK India-First Production Database...');

  // 1. Create Core Platform Users
  const passwordHash = await bcrypt.hash('Dinedeck@2026', 10);

  const superAdmin = await prisma.user.upsert({
    where: { email: 'superadmin@dinedeck.in' },
    update: {},
    create: {
      email: 'superadmin@dinedeck.in',
      phone: '+919876543210',
      passwordHash,
      name: 'DINEDECK Super Administrator',
      role: 'DINEDECK_SUPER_ADMIN',
      avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&q=80'
    }
  });

  const demoCustomer = await prisma.user.upsert({
    where: { email: 'alex.vance@dinedeck.io' },
    update: {},
    create: {
      email: 'alex.vance@dinedeck.io',
      phone: '+919820123456',
      passwordHash,
      name: 'Alex Vance',
      role: 'CUSTOMER',
      avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&q=80'
    }
  });

  const staffUser = await prisma.user.upsert({
    where: { email: 'captain.ramesh@punjabheritage.in' },
    update: {},
    create: {
      email: 'captain.ramesh@punjabheritage.in',
      phone: '+919811223344',
      passwordHash,
      name: 'Ramesh Sharma (Head Captain)',
      role: 'RESTAURANT_STAFF',
      avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&q=80'
    }
  });

  // 2. Ten Realistic Indian Restaurants
  const restaurantsData = [
    {
      id: 'rest_punjab_heritage',
      name: 'The Punjab Heritage Kitchen',
      slug: 'punjab-heritage-mumbai',
      logoUrl: 'https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=200&q=80',
      coverImageUrl: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=1200&q=80',
      description: 'Authentic Amritsari Tandoor & North Indian Delicacies crafted with slow-simmered rich makhani gravy and house-churned white butter.',
      cuisineType: 'North Indian, Mughlai, Tandoor',
      rating: 4.9,
      reviewCount: 1420,
      costForTwo: 950,
      city: 'Mumbai',
      state: 'Maharashtra',
      pincode: '400050',
      fullAddress: 'Plot 42, Bandra Kurla Complex, Bandra West, Mumbai, Maharashtra 400050',
      phone: '+912226501234',
      latitude: 19.0600,
      longitude: 72.8650,
      isPureVeg: false,
      cgstRatePercent: 2.5,
      sgstRatePercent: 2.5,
      serviceChargePercent: 5.0,
      categories: [
        {
          name: 'Tandoori Starters & Kebabs',
          items: [
            {
              name: 'Angaari Paneer Tikka',
              description: 'Tender cottage cheese cubes marinated in Kashmiri deghi mirch, hung curd, and roasted mustard oil, char-grilled in tandoor.',
              price: 340,
              discountedPrice: 299,
              imageUrl: 'https://images.unsplash.com/photo-1567188040759-fb8a883dc6d8?w=500&q=80',
              isVeg: true,
              isBestseller: true,
              spiceLevel: 2,
              preparationTime: 15
            },
            {
              name: 'Bhatinda Murgh Malai Tikka',
              description: 'Boneless chicken supreme steeped in cardamom cream, cheddar cheese, and crushed green peppercorns.',
              price: 420,
              discountedPrice: 380,
              imageUrl: 'https://images.unsplash.com/photo-1599488615731-7e5c2823ff28?w=500&q=80',
              isVeg: false,
              isBestseller: true,
              spiceLevel: 1,
              preparationTime: 18
            },
            {
              name: 'Dahi Ke Sholay Kebabs',
              description: 'Crispy bread pockets stuffed with spiced hung curd, bell peppers, fresh mint, and coriander.',
              price: 280,
              imageUrl: 'https://images.unsplash.com/photo-1601050690597-df0568f70950?w=500&q=80',
              isVeg: true,
              isBestseller: false,
              spiceLevel: 1,
              preparationTime: 12
            }
          ]
        },
        {
          name: 'Royal Main Course',
          items: [
            {
              name: 'Grand Old Delhi Butter Chicken',
              description: 'Tandoori smoked chicken steeped in a velvety San Marzano tomato gravy with kasuri methi and fresh cream.',
              price: 490,
              discountedPrice: 440,
              imageUrl: 'https://images.unsplash.com/photo-1588166524941-3bf61a9c41db?w=500&q=80',
              isVeg: false,
              isBestseller: true,
              spiceLevel: 2,
              preparationTime: 20
            },
            {
              name: 'Signature Dal Makhani 1947',
              description: 'Black urad lentils and kidney beans slow-cooked overnight for 24 hours with vine-ripened tomatoes and butter.',
              price: 360,
              imageUrl: 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=500&q=80',
              isVeg: true,
              isBestseller: true,
              spiceLevel: 1,
              preparationTime: 15
            },
            {
              name: 'Paneer Lababdar',
              description: 'Fresh malai paneer simmered in a luscious onion-tomato gravy finished with grated paneer and cream.',
              price: 390,
              imageUrl: 'https://images.unsplash.com/photo-1631452180519-c014fe946bc7?w=500&q=80',
              isVeg: true,
              isBestseller: false,
              spiceLevel: 2,
              preparationTime: 15
            }
          ]
        },
        {
          name: 'Breads & Rice',
          items: [
            {
              name: 'Garlic Chur Chur Naan',
              description: 'Crispy layered tandoori bread generously topped with chopped garlic, butter, and coriander.',
              price: 95,
              imageUrl: 'https://images.unsplash.com/photo-1626074353765-517a681e40be?w=500&q=80',
              isVeg: true,
              isBestseller: true,
              spiceLevel: 1,
              preparationTime: 8
            },
            {
              name: 'Amritsari Stuffed Aloo Kulcha',
              description: 'Clay oven baked flaky kulcha stuffed with spiced potatoes and anardana, served with chole.',
              price: 150,
              imageUrl: 'https://images.unsplash.com/photo-1601050690597-df0568f70950?w=500&q=80',
              isVeg: true,
              isBestseller: false,
              spiceLevel: 2,
              preparationTime: 10
            }
          ]
        },
        {
          name: 'Beverages & Desserts',
          items: [
            {
              name: 'Kesar Pista Malai Lassi',
              description: 'Thick, creamy churned sweet yogurt infused with saffron strands and slivered pistachios.',
              price: 140,
              imageUrl: 'https://images.unsplash.com/photo-1517256064527-09c73fc73e38?w=500&q=80',
              isVeg: true,
              isBestseller: true,
              spiceLevel: 1,
              preparationTime: 5
            },
            {
              name: 'Warm Gulab Jamun with Rabdi',
              description: 'Mawa dumplings soaked in cardamom saffron sugar syrup, served atop chilled reduced milk rabdi.',
              price: 180,
              imageUrl: 'https://images.unsplash.com/photo-1541832676-9b763b0239ab?w=500&q=80',
              isVeg: true,
              isBestseller: true,
              spiceLevel: 1,
              preparationTime: 8
            }
          ]
        }
      ]
    },
    {
      id: 'rest_dakshin_bistro',
      name: 'Dakshin Coastal Bistro & Tiffin',
      slug: 'dakshin-coastal-bengaluru',
      logoUrl: 'https://images.unsplash.com/photo-1610192244261-3f33de3f55e4?w=200&q=80',
      coverImageUrl: 'https://images.unsplash.com/photo-1552566626-52f8b828add9?w=1200&q=80',
      description: 'Finest South Indian tiffin, Chettinad curries, crispy ghee roasts, and Malabar seafood specialties.',
      cuisineType: 'South Indian, Chettinad, Coastal',
      rating: 4.8,
      reviewCount: 980,
      costForTwo: 600,
      city: 'Bengaluru',
      state: 'Karnataka',
      pincode: '560038',
      fullAddress: '100 Feet Road, Indiranagar, Bengaluru, Karnataka 560038',
      phone: '+918025219988',
      latitude: 12.9716,
      longitude: 77.5946,
      isPureVeg: false,
      cgstRatePercent: 2.5,
      sgstRatePercent: 2.5,
      serviceChargePercent: 5.0,
      categories: [
        {
          name: 'Crispy Dosa & Tiffins',
          items: [
            {
              name: 'Ghee Roast Masala Dosa',
              description: 'Golden, crispy fermented rice crepe roasted in pure desi ghee with spiced potato masala and trio chutneys.',
              price: 190,
              discountedPrice: 165,
              imageUrl: 'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=500&q=80',
              isVeg: true,
              isBestseller: true,
              spiceLevel: 2,
              preparationTime: 10
            },
            {
              name: 'Steamed Podi Thatte Idli',
              description: 'Soft large Bangalore style idli drizzled with aromatic gun powder podi and hot ghee.',
              price: 130,
              imageUrl: 'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=500&q=80',
              isVeg: true,
              isBestseller: true,
              spiceLevel: 2,
              preparationTime: 8
            }
          ]
        },
        {
          name: 'Coastal Mains',
          items: [
            {
              name: 'Malabar Fish Curry & Appam',
              description: 'Fresh seer fish simmered in coconut milk, kudampuli kokum, and curry leaves, served with 2 fluffy appams.',
              price: 460,
              discountedPrice: 410,
              imageUrl: 'https://images.unsplash.com/photo-1626777552726-4a6b54c97e46?w=500&q=80',
              isVeg: false,
              isBestseller: true,
              spiceLevel: 3,
              preparationTime: 20
            }
          ]
        }
      ]
    },
    {
      id: 'rest_dum_pukht_biryani',
      name: 'Dum Pukht Royal Biryani House',
      slug: 'dum-pukht-biryani-hyderabad',
      logoUrl: 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=200&q=80',
      coverImageUrl: 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=1200&q=80',
      description: 'Nizami heritage handi biryanis sealed with purdah dough and slow-cooked over charcoal embers.',
      cuisineType: 'Biryani, Hyderabadi, Mughlai',
      rating: 4.9,
      reviewCount: 2310,
      costForTwo: 850,
      city: 'Hyderabad',
      state: 'Telangana',
      pincode: '500034',
      fullAddress: 'Road No 10, Banjara Hills, Hyderabad, Telangana 500034',
      phone: '+914023351122',
      latitude: 17.3850,
      longitude: 78.4867,
      isPureVeg: false,
      cgstRatePercent: 2.5,
      sgstRatePercent: 2.5,
      serviceChargePercent: 5.0,
      categories: [
        {
          name: 'Nizami Biryanis',
          items: [
            {
              name: 'Special Hyderabadi Mutton Dum Biryani',
              description: 'Tender prime mutton marinated overnight in saffron, green chilies, and herbs, layered with long-grain aged basmati rice.',
              price: 520,
              discountedPrice: 475,
              imageUrl: 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=500&q=80',
              isVeg: false,
              isBestseller: true,
              spiceLevel: 3,
              preparationTime: 22
            }
          ]
        }
      ]
    },
    {
      id: 'rest_bawarchi_kebabs',
      name: 'Bawarchi Mughlai & Kebabs',
      slug: 'bawarchi-mughlai-delhi',
      logoUrl: 'https://images.unsplash.com/photo-1599488615731-7e5c2823ff28?w=200&q=80',
      coverImageUrl: 'https://images.unsplash.com/photo-1544025162-d76694265947?w=1200&q=80',
      description: 'Mouth-melting Awadhi galouti kebabs and rich Lucknowi curries simmered in pure ghee.',
      cuisineType: 'Mughlai, Awadhi, Kebabs',
      rating: 4.7,
      reviewCount: 840,
      costForTwo: 1100,
      city: 'Delhi',
      state: 'Delhi',
      pincode: '110001',
      fullAddress: 'Connaught Place, Outer Circle, New Delhi, Delhi 110001',
      phone: '+911123712345',
      latitude: 28.6139,
      longitude: 77.2090,
      isPureVeg: false,
      cgstRatePercent: 2.5,
      sgstRatePercent: 2.5,
      serviceChargePercent: 5.0,
      categories: [
        {
          name: 'Awadhi Signatures',
          items: [
            {
              name: 'Melt-in-Mouth Galouti Kebab',
              description: 'Finely minced mutton infused with 32 secret Lucknowi potli spices, pan-fried on a mahi tawa and served with ulte tawe ka paratha.',
              price: 490,
              discountedPrice: 440,
              imageUrl: 'https://images.unsplash.com/photo-1599488615731-7e5c2823ff28?w=500&q=80',
              isVeg: false,
              isBestseller: true,
              spiceLevel: 2,
              preparationTime: 15
            }
          ]
        }
      ]
    },
    {
      id: 'rest_kolkata_spice',
      name: 'Kolkata Spice & Kathi Roll Co.',
      slug: 'kolkata-spice-kathi-roll',
      logoUrl: 'https://images.unsplash.com/photo-1601050690597-df0568f70950?w=200&q=80',
      coverImageUrl: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=1200&q=80',
      description: 'Legendary Park Street style layered paratha kathi rolls, Kolkata mustard fish, and fresh Bengali sweets.',
      cuisineType: 'Bengali, Street Food, Rolls',
      rating: 4.6,
      reviewCount: 650,
      costForTwo: 450,
      city: 'Kolkata',
      state: 'West Bengal',
      pincode: '700016',
      fullAddress: 'Park Street, Kolkata, West Bengal 700016',
      phone: '+913322298877',
      latitude: 22.5726,
      longitude: 88.3639,
      isPureVeg: false,
      cgstRatePercent: 2.5,
      sgstRatePercent: 2.5,
      serviceChargePercent: 0.0,
      categories: [
        {
          name: 'Signature Kathi Rolls',
          items: [
            {
              name: 'Double Egg Chicken Kathi Roll',
              description: 'Flaky paratha layered with two farm eggs, tandoori spiced chicken cubes, lime juice, sliced onions, and green chilies.',
              price: 180,
              discountedPrice: 150,
              imageUrl: 'https://images.unsplash.com/photo-1626777552726-4a6b54c97e46?w=500&q=80',
              isVeg: false,
              isBestseller: true,
              spiceLevel: 2,
              preparationTime: 10
            }
          ]
        }
      ]
    },
    {
      id: 'rest_thali_royal',
      name: 'Thali of Rajasthan & Gujarat',
      slug: 'thali-rajasthan-gujarat-jaipur',
      logoUrl: 'https://images.unsplash.com/photo-1610192244261-3f33de3f55e4?w=200&q=80',
      coverImageUrl: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=1200&q=80',
      description: 'Grand unlimited royal Rajasthani & Gujarati thali featuring Dal Baati Churma, Ker Sangri, Gatte ki Sabzi, and hot Jalebis.',
      cuisineType: 'Rajasthani, Gujarati, Pure Veg Thali',
      rating: 4.9,
      reviewCount: 1890,
      costForTwo: 800,
      city: 'Jaipur',
      state: 'Rajasthan',
      pincode: '302001',
      fullAddress: 'MI Road, Near Panch Batti, Jaipur, Rajasthan 302001',
      phone: '+911412376655',
      latitude: 26.9124,
      longitude: 75.7873,
      isPureVeg: true,
      cgstRatePercent: 2.5,
      sgstRatePercent: 2.5,
      serviceChargePercent: 5.0,
      categories: [
        {
          name: 'Grand Royal Thali',
          items: [
            {
              name: 'Grand Maharani Pure Veg Thali',
              description: 'Complete royal meal with Dal Baati Churma, Gatte ki Sabzi, Rajasthani Kadhi, Ker Sangri, 4 phulkas, rice, and jalebi.',
              price: 450,
              imageUrl: 'https://images.unsplash.com/photo-1610192244261-3f33de3f55e4?w=500&q=80',
              isVeg: true,
              isBestseller: true,
              spiceLevel: 2,
              preparationTime: 12
            }
          ]
        }
      ]
    },
    {
      id: 'rest_swad_maharashtra',
      name: 'Swad Maharashtra Malvani',
      slug: 'swad-maharashtra-pune',
      logoUrl: 'https://images.unsplash.com/photo-1601050690597-df0568f70950?w=200&q=80',
      coverImageUrl: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=1200&q=80',
      description: 'Authentic Maharashtrian breakfast, spicy Puneri Misal Pav, Malvani fish fry, and refreshing Solkadhi.',
      cuisineType: 'Maharashtrian, Malvani, Seafood',
      rating: 4.7,
      reviewCount: 710,
      costForTwo: 500,
      city: 'Pune',
      state: 'Maharashtra',
      pincode: '411004',
      fullAddress: 'FC Road, Deccan Gymkhana, Pune, Maharashtra 411004',
      phone: '+912025531234',
      latitude: 18.5204,
      longitude: 73.8567,
      isPureVeg: false,
      cgstRatePercent: 2.5,
      sgstRatePercent: 2.5,
      serviceChargePercent: 0.0,
      categories: [
        {
          name: 'Pune Street Specials',
          items: [
            {
              name: 'Special Puneri Kat Misal Pav',
              description: 'Fiery sprouted moth bean curry topped with spicy farsan, chopped onions, and lemon, served with buttered pavs.',
              price: 140,
              discountedPrice: 120,
              imageUrl: 'https://images.unsplash.com/photo-1601050690597-df0568f70950?w=500&q=80',
              isVeg: true,
              isBestseller: true,
              spiceLevel: 3,
              preparationTime: 8
            }
          ]
        }
      ]
    },
    {
      id: 'rest_madras_tiffin',
      name: 'Madras Tiffin House',
      slug: 'madras-tiffin-house-chennai',
      logoUrl: 'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=200&q=80',
      coverImageUrl: 'https://images.unsplash.com/photo-1552566626-52f8b828add9?w=1200&q=80',
      description: 'Pure Vegetarian Chennai tiffins, authentic Kumbakonam degree filter coffee, and fluffy medu vadas.',
      cuisineType: 'South Indian, Pure Veg, Cafe',
      rating: 4.8,
      reviewCount: 1150,
      costForTwo: 350,
      city: 'Chennai',
      state: 'Tamil Nadu',
      pincode: '600004',
      fullAddress: 'Mylapore Tank, Chennai, Tamil Nadu 600004',
      phone: '+914424641122',
      latitude: 13.0827,
      longitude: 80.2707,
      isPureVeg: true,
      cgstRatePercent: 2.5,
      sgstRatePercent: 2.5,
      serviceChargePercent: 0.0,
      categories: [
        {
          name: 'Morning & Evening Tiffin',
          items: [
            {
              name: 'Idli Vada Sambar Combo',
              description: 'Two feather-soft steamed idlis and one crispy medu vada served with hot drumstick sambar and fresh coconut chutney.',
              price: 110,
              imageUrl: 'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=500&q=80',
              isVeg: true,
              isBestseller: true,
              spiceLevel: 1,
              preparationTime: 5
            },
            {
              name: 'Kumbakonam Degree Filter Coffee',
              description: 'Authentic South Indian chicory-infused strong decoction poured in a brass dabarah and tumbler.',
              price: 55,
              imageUrl: 'https://images.unsplash.com/photo-1517256064527-09c73fc73e38?w=500&q=80',
              isVeg: true,
              isBestseller: true,
              spiceLevel: 1,
              preparationTime: 4
            }
          ]
        }
      ]
    },
    {
      id: 'rest_irani_chai',
      name: 'Chai & Maska Irani Cafe',
      slug: 'irani-chai-maska-mumbai',
      logoUrl: 'https://images.unsplash.com/photo-1517256064527-09c73fc73e38?w=200&q=80',
      coverImageUrl: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=1200&q=80',
      description: 'Heritage Mumbai Irani cafe serving hot Bun Maska, sweet Irani Chai, spicy Keema Pav, and caramel custard.',
      cuisineType: 'Irani Cafe, Parsi, Bakery',
      rating: 4.7,
      reviewCount: 920,
      costForTwo: 400,
      city: 'Mumbai',
      state: 'Maharashtra',
      pincode: '400001',
      fullAddress: 'Fort, Near Flora Fountain, Mumbai, Maharashtra 400001',
      phone: '+912222671234',
      latitude: 18.9322,
      longitude: 72.8315,
      isPureVeg: false,
      cgstRatePercent: 2.5,
      sgstRatePercent: 2.5,
      serviceChargePercent: 0.0,
      categories: [
        {
          name: 'Irani Cafe Classics',
          items: [
            {
              name: 'Warm Bun Maska & Irani Dum Chai',
              description: 'Soft bakery bun smothered with salted butter, paired with slow-brewed sweetened cardamom Irani tea.',
              price: 90,
              discountedPrice: 75,
              imageUrl: 'https://images.unsplash.com/photo-1517256064527-09c73fc73e38?w=500&q=80',
              isVeg: true,
              isBestseller: true,
              spiceLevel: 1,
              preparationTime: 5
            }
          ]
        }
      ]
    },
    {
      id: 'rest_curry_grills',
      name: 'The Great Indian Curry & Grills',
      slug: 'great-indian-curry-grills-ahmedabad',
      logoUrl: 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=200&q=80',
      coverImageUrl: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=1200&q=80',
      description: 'Contemporary progressive Indian cuisine, wood-fired naan flatbreads, and fusion desserts.',
      cuisineType: 'Modern Indian, Fusion, Continental',
      rating: 4.8,
      reviewCount: 780,
      costForTwo: 900,
      city: 'Ahmedabad',
      state: 'Gujarat',
      pincode: '380015',
      fullAddress: 'SG Highway, Bodakdev, Ahmedabad, Gujarat 380015',
      phone: '+917926851122',
      latitude: 23.0225,
      longitude: 72.5714,
      isPureVeg: true,
      cgstRatePercent: 2.5,
      sgstRatePercent: 2.5,
      serviceChargePercent: 5.0,
      categories: [
        {
          name: 'Progressive Grills',
          items: [
            {
              name: 'Tandoori Malai Broccoli',
              description: 'Charred broccoli florets marinated with processed cheese, cardamom dust, and cashew cream.',
              price: 360,
              discountedPrice: 320,
              imageUrl: 'https://images.unsplash.com/photo-1567188040759-fb8a883dc6d8?w=500&q=80',
              isVeg: true,
              isBestseller: true,
              spiceLevel: 1,
              preparationTime: 14
            }
          ]
        }
      ]
    }
  ];

  for (const r of restaurantsData) {
    const restaurant = await prisma.restaurant.upsert({
      where: { id: r.id },
      update: {},
      create: {
        id: r.id,
        name: r.name,
        slug: r.slug,
        logoUrl: r.logoUrl,
        coverImageUrl: r.coverImageUrl,
        description: r.description,
        cuisineType: r.cuisineType,
        rating: r.rating,
        reviewCount: r.reviewCount,
        costForTwo: r.costForTwo,
        city: r.city,
        state: r.state,
        pincode: r.pincode,
        fullAddress: r.fullAddress,
        phone: r.phone,
        latitude: r.latitude,
        longitude: r.longitude,
        isPureVeg: r.isPureVeg,
        cgstRatePercent: r.cgstRatePercent,
        sgstRatePercent: r.sgstRatePercent,
        serviceChargePercent: r.serviceChargePercent
      }
    });

    // Create Main Branch
    const branch = await prisma.restaurantBranch.upsert({
      where: { id: `branch_${r.id}` },
      update: {},
      create: {
        id: `branch_${r.id}`,
        restaurantId: restaurant.id,
        name: `${restaurant.name} (Flagship Branch)`,
        address: restaurant.fullAddress,
        phone: restaurant.phone
      }
    });

    // Create 16 Unique Tables per branch with cryptographically unguessable HMAC-SHA256 tokens
    const TABLE_SALT = 'DINEDECK_SECURE_QR_TAMPER_PROTECT_2026';
    for (let t = 1; t <= 16; t++) {
      const tableNumber = `T-${t}`;
      const token = `qr_${crypto
        .createHmac('sha256', TABLE_SALT)
        .update(`sec_tbl_auth_${r.id}_branch_1_tbl_num_${t}`)
        .digest('hex')
        .slice(0, 24)}`;

      const floor =
        t <= 6
          ? 'Ground Floor (Main Hall)'
          : t <= 10
          ? 'First Floor (AC Family Hall)'
          : t <= 13
          ? 'Rooftop / Terrace Garden'
          : 'Outdoor Courtyard & Patio';
      const capacity = t <= 4 ? 2 : t <= 10 ? 4 : t <= 14 ? 6 : 8;

      await prisma.table.upsert({
        where: { id: `tbl_${r.id}_${t}` },
        update: {
          tableNumber,
          capacity,
          floor,
          qrCodeToken: token
        },
        create: {
          id: `tbl_${r.id}_${t}`,
          branchId: branch.id,
          tableNumber,
          capacity,
          floor,
          qrCodeToken: token,
          isOccupied: false
        }
      });
    }

    // Attach staff to restaurant 1
    if (r.id === 'rest_punjab_heritage') {
      await prisma.restaurantStaff.upsert({
        where: { userId: staffUser.id },
        update: {},
        create: {
          userId: staffUser.id,
          restaurantId: restaurant.id,
          designation: 'Head Floor Captain'
        }
      });
    }

    // Create Menu Categories and Items
    for (let cIdx = 0; cIdx < r.categories.length; cIdx++) {
      const catData = r.categories[cIdx];
      const category = await prisma.menuCategory.create({
        data: {
          restaurantId: restaurant.id,
          name: catData.name,
          displayOrder: cIdx + 1
        }
      });

      for (const itemData of catData.items) {
        const menuItem = await prisma.menuItem.create({
          data: {
            restaurantId: restaurant.id,
            categoryId: category.id,
            name: itemData.name,
            description: itemData.description,
            price: itemData.price,
            discountedPrice: itemData.discountedPrice || null,
            imageUrl: itemData.imageUrl,
            isVeg: itemData.isVeg,
            isBestseller: itemData.isBestseller,
            spiceLevel: itemData.spiceLevel,
            preparationTime: itemData.preparationTime
          }
        });

        // Add variants and add-ons
        await prisma.menuVariant.create({
          data: {
            menuItemId: menuItem.id,
            name: 'Regular Portion',
            price: itemData.discountedPrice || itemData.price,
            isDefault: true
          }
        });
      }
    }
  }

  // 3. Create Standard Coupons
  await prisma.coupon.upsert({
    where: { code: 'DINEDECK20' },
    update: {},
    create: {
      code: 'DINEDECK20',
      discountPercent: 20.0,
      maxDiscount: 150.0,
      minOrderAmount: 400.0,
      validUntil: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
      isActive: true
    }
  });

  await prisma.coupon.upsert({
    where: { code: 'WELCOME50' },
    update: {},
    create: {
      code: 'WELCOME50',
      discountPercent: 50.0,
      maxDiscount: 200.0,
      minOrderAmount: 500.0,
      validUntil: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
      isActive: true
    }
  });

  // 4. Seed IAM Definitions & Multi-Tenant Staff Roles
  const { iamService } = await import('../src/modules/iam/iam.service.js');
  await iamService.seedIamDefinitions();

  // 5. Seed Kitchen Stations & Settings for All Restaurants
  console.log('Seeding Kitchen Stations & KDS Settings for all restaurants...');
  const allRestaurants = await prisma.restaurant.findMany();
  const defaultStations = [
    { code: 'MAIN', name: 'Main Kitchen', isExpo: false, displayOrder: 1 },
    { code: 'TANDOOR', name: 'Tandoor & Breads', isExpo: false, displayOrder: 2 },
    { code: 'CURRY', name: 'Curry & Gravy', isExpo: false, displayOrder: 3 },
    { code: 'GRILL', name: 'Charcoal Grill', isExpo: false, displayOrder: 4 },
    { code: 'BEVERAGE', name: 'Beverage Bar', isExpo: false, displayOrder: 5 },
    { code: 'DESSERT', name: 'Dessert Section', isExpo: false, displayOrder: 6 },
    { code: 'EXPO', name: 'Expo / Pass Station', isExpo: true, displayOrder: 7 }
  ];

  for (const r of allRestaurants) {
    for (const st of defaultStations) {
      await prisma.kitchenStation.upsert({
        where: { restaurantId_code: { restaurantId: r.id, code: st.code } },
        update: { name: st.name, isExpo: st.isExpo, displayOrder: st.displayOrder },
        create: {
          restaurantId: r.id,
          code: st.code,
          name: st.name,
          isExpo: st.isExpo,
          displayOrder: st.displayOrder,
          printerIp: '192.168.1.200:9100'
        }
      });
    }

    await prisma.kitchenKdsSetting.upsert({
      where: { restaurantId: r.id },
      update: {
        autoGenerateKot: true,
        autoPrintKot: false,
        defaultPrepTimeMinutes: 15,
        warningThresholdMinutes: 10,
        breachThresholdMinutes: 20,
        alertSoundEnabled: true,
        courseSequencingEnabled: true,
        requireExpoCheck: true
      },
      create: {
        restaurantId: r.id,
        autoGenerateKot: true,
        autoPrintKot: false,
        defaultPrepTimeMinutes: 15,
        warningThresholdMinutes: 10,
        breachThresholdMinutes: 20,
        alertSoundEnabled: true,
        courseSequencingEnabled: true,
        requireExpoCheck: true
      }
    });
  }

  // 12. Promotional Banners & Festival Scrolls
  const defaultBanners = [
    {
      id: 'banner_biryani_fest',
      title: 'Royal Awadhi Dum Biryani Festival',
      subtitle: 'Slow-cooked handi saffron biryanis with tender mutton, char-grilled galouti kebabs & burani raita.',
      badge: 'TRENDING FESTIVAL',
      tag: "CHEF'S SPECIAL • 20% OFF DINE-IN",
      rating: '4.9 ★ (1,400+)',
      discountPercent: 20,
      imageUrl: 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=1200&q=80',
      ctaText: 'Explore Biryani Specials',
      restaurantId: 'rest_dum_pukht_biryani',
      displayOrder: 1,
      isActive: true
    },
    {
      id: 'banner_thali_royal',
      title: 'Grand 32-Course Heritage Thali',
      subtitle: 'Unlimited Rajasthani Dal Baati Churma, Gatta Curry, Malpua & saffron buttermilk served in royal brass.',
      badge: 'UNLIMITED FEAST',
      tag: 'PURE VEG • FLAT ₹150 OFF',
      rating: '4.8 ★ (980+)',
      discountPercent: 15,
      imageUrl: 'https://images.unsplash.com/photo-1610057099443-fde8c4d50f91?w=1200&q=80',
      ctaText: 'View Heritage Thali',
      restaurantId: 'rest_thali_royal',
      displayOrder: 2,
      isActive: true
    },
    {
      id: 'banner_dakshin_bistro',
      title: 'Coastal Seafood & Ghee Roast Carnival',
      subtitle: 'Mangalorean Kane Fish Fry, Chettinad Crab Curry, and crispy Appams prepared fresh with tender coconut.',
      badge: 'COASTAL SPECIAL',
      tag: 'CATCH OF THE DAY • 25% OFF',
      rating: '4.9 ★ (2,150+)',
      discountPercent: 25,
      imageUrl: 'https://images.unsplash.com/photo-1552611052-33e04de081de?w=1200&q=80',
      ctaText: 'Discover Coastal Menu',
      restaurantId: 'rest_dakshin_bistro',
      displayOrder: 3,
      isActive: true
    }
  ];

  for (const b of defaultBanners) {
    await prisma.bannerPromotion.upsert({
      where: { id: b.id },
      update: b,
      create: b
    });
  }

  console.log('Clean master database seeded successfully with 0 dummy orders and 3 active promotional banners!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

