package com.dinedeck.app.core.di

import android.content.Context
import androidx.room.Room
import com.dinedeck.app.core.database.DineDeckDatabase
import com.dinedeck.app.core.database.MenuItemDao
import com.dinedeck.app.core.database.RestaurantDao
import com.dinedeck.app.core.session.SessionManager
import com.dinedeck.app.data.remote.MockDataEngine
import com.dinedeck.app.data.remote.RealtimeSyncManager
import com.dinedeck.app.data.repository.*
import com.dinedeck.app.domain.repository.*
import com.dinedeck.app.domain.usecase.*
import com.google.gson.Gson
import com.google.gson.GsonBuilder
import dagger.Module
import dagger.Provides
import dagger.hilt.InstallIn
import dagger.hilt.android.qualifiers.ApplicationContext
import dagger.hilt.components.SingletonComponent
import javax.inject.Singleton

@Module
@InstallIn(SingletonComponent::class)
object AppModule {

    @Provides
    @Singleton
    fun provideGson(): Gson {
        return GsonBuilder()
            .setLenient()
            .create()
    }

    @Provides
    @Singleton
    fun provideMockDataEngine(): MockDataEngine {
        return MockDataEngine()
    }

    @Provides
    @Singleton
    fun provideDatabase(@ApplicationContext context: Context): DineDeckDatabase {
        return Room.databaseBuilder(
            context,
            DineDeckDatabase::class.java,
            "dinedeck_db"
        ).fallbackToDestructiveMigration().build()
    }

    @Provides
    fun provideRestaurantDao(db: DineDeckDatabase): RestaurantDao = db.restaurantDao()

    @Provides
    fun provideMenuItemDao(db: DineDeckDatabase): MenuItemDao = db.menuItemDao()

    @Provides
    @Singleton
    fun provideAuthRepository(
        mockDataEngine: MockDataEngine,
        sessionManager: SessionManager
    ): AuthRepository {
        return AuthRepositoryImpl(mockDataEngine, sessionManager)
    }

    @Provides
    @Singleton
    fun provideRestaurantRepository(
        mockDataEngine: MockDataEngine
    ): RestaurantRepository {
        return RestaurantRepositoryImpl(mockDataEngine)
    }

    @Provides
    @Singleton
    fun provideMenuRepository(
        mockDataEngine: MockDataEngine
    ): MenuRepository {
        return MenuRepositoryImpl(mockDataEngine)
    }

    @Provides
    @Singleton
    fun provideCartRepository(
        mockDataEngine: MockDataEngine
    ): CartRepository {
        return CartRepositoryImpl(mockDataEngine)
    }

    @Provides
    @Singleton
    fun provideTableRepository(
        mockDataEngine: MockDataEngine,
        sessionManager: SessionManager
    ): TableRepository {
        return TableRepositoryImpl(mockDataEngine, sessionManager)
    }

    @Provides
    @Singleton
    fun provideOrderRepository(
        mockDataEngine: MockDataEngine,
        sessionManager: SessionManager,
        cartRepository: CartRepository,
        realtimeSyncManager: RealtimeSyncManager
    ): OrderRepository {
        return OrderRepositoryImpl(mockDataEngine, sessionManager, cartRepository, realtimeSyncManager)
    }

    @Provides
    @Singleton
    fun provideOfferRepository(
        mockDataEngine: MockDataEngine
    ): OfferRepository {
        return OfferRepositoryImpl(mockDataEngine)
    }

    @Provides
    @Singleton
    fun provideUserRepository(
        mockDataEngine: MockDataEngine,
        sessionManager: SessionManager
    ): UserRepository {
        return UserRepositoryImpl(mockDataEngine, sessionManager)
    }

    // Use Cases Providers
    @Provides
    @Singleton
    fun provideLoginUseCase(authRepository: AuthRepository) = LoginUseCase(authRepository)

    @Provides
    @Singleton
    fun provideRegisterUseCase(authRepository: AuthRepository) = RegisterUseCase(authRepository)

    @Provides
    @Singleton
    fun provideGetRestaurantsUseCase(restaurantRepository: RestaurantRepository) = GetRestaurantsUseCase(restaurantRepository)

    @Provides
    @Singleton
    fun provideGetRestaurantByIdUseCase(restaurantRepository: RestaurantRepository) = GetRestaurantByIdUseCase(restaurantRepository)

    @Provides
    @Singleton
    fun provideValidateTableQRUseCase(tableRepository: TableRepository) = ValidateTableQRUseCase(tableRepository)

    @Provides
    @Singleton
    fun provideAddToCartUseCase(cartRepository: CartRepository) = AddToCartUseCase(cartRepository)

    @Provides
    @Singleton
    fun providePlaceOrderUseCase(orderRepository: OrderRepository) = PlaceOrderUseCase(orderRepository)

    @Provides
    @Singleton
    fun provideTrackOrderUseCase(orderRepository: OrderRepository) = TrackOrderUseCase(orderRepository)

    @Provides
    @Singleton
    fun provideRequestServiceUseCase(orderRepository: OrderRepository) = RequestServiceUseCase(orderRepository)
}
