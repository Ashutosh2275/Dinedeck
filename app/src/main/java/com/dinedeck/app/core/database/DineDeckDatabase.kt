package com.dinedeck.app.core.database

import androidx.room.*
import kotlinx.coroutines.flow.Flow

@Entity(tableName = "cached_restaurants")
data class CachedRestaurantEntity(
    @PrimaryKey val id: String,
    val name: String,
    val logoUrl: String,
    val coverImageUrl: String,
    val address: String,
    val phone: String,
    val rating: Double,
    val reviewCount: Int,
    val cuisinesJson: String, // Comma separated
    val priceRange: String,
    val openingHours: String,
    val description: String,
    val isFavorite: Boolean,
    val isOpen: Boolean,
    val hasOffers: Boolean,
    val offerTag: String
)

@Entity(tableName = "cached_menu_items")
data class CachedMenuItemEntity(
    @PrimaryKey val id: String,
    val restaurantId: String,
    val categoryId: String,
    val categoryName: String,
    val name: String,
    val description: String,
    val price: Double,
    val discountPercentage: Double,
    val imageUrl: String,
    val isVeg: Boolean,
    val isSpicy: Boolean,
    val isBestseller: Boolean,
    val rating: Double
)

@Dao
interface RestaurantDao {
    @Query("SELECT * FROM cached_restaurants")
    fun getAllRestaurants(): Flow<List<CachedRestaurantEntity>>

    @Query("SELECT * FROM cached_restaurants WHERE id = :id")
    suspend fun getRestaurantById(id: String): CachedRestaurantEntity?

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertRestaurants(restaurants: List<CachedRestaurantEntity>)

    @Query("DELETE FROM cached_restaurants")
    suspend fun clearAll()
}

@Dao
interface MenuItemDao {
    @Query("SELECT * FROM cached_menu_items WHERE restaurantId = :restaurantId")
    fun getMenuItemsByRestaurant(restaurantId: String): Flow<List<CachedMenuItemEntity>>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertMenuItems(items: List<CachedMenuItemEntity>)

    @Query("DELETE FROM cached_menu_items WHERE restaurantId = :restaurantId")
    suspend fun clearByRestaurant(restaurantId: String)
}

@Database(
    entities = [CachedRestaurantEntity::class, CachedMenuItemEntity::class],
    version = 1,
    exportSchema = false
)
abstract class DineDeckDatabase : RoomDatabase() {
    abstract fun restaurantDao(): RestaurantDao
    abstract fun menuItemDao(): MenuItemDao
}
