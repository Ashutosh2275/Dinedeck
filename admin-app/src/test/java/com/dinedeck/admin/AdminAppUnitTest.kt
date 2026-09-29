package com.dinedeck.admin

import com.dinedeck.admin.data.AdminRestaurant
import com.dinedeck.admin.data.OverviewData
import com.dinedeck.admin.data.RestaurantMetrics
import com.dinedeck.admin.data.CustomerMetrics
import com.dinedeck.admin.data.OperationsMetrics
import com.dinedeck.admin.data.FinanceMetrics
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertTrue
import org.junit.Test

class AdminAppUnitTest {

    @Test
    fun testRestaurantLifecycleTransitions() {
        val restaurant = AdminRestaurant(
            id = "rest_1",
            name = "The Punjab Heritage Kitchen",
            slug = "the-punjab-heritage-kitchen",
            city = "Mumbai",
            cuisineType = "North Indian, Mughlai",
            rating = 4.9,
            isActive = true,
            status = "ACTIVE",
            commissionRatePercent = 15.0
        )

        // Suspend
        val suspended = restaurant.copy(status = "SUSPENDED", isActive = false)
        assertFalse(suspended.isActive)
        assertEquals("SUSPENDED", suspended.status)

        // Restore
        val restored = suspended.copy(status = "ACTIVE", isActive = true)
        assertTrue(restored.isActive)
        assertEquals("ACTIVE", restored.status)
    }

    @Test
    fun testControlCenterOverviewIntegrity() {
        val overview = OverviewData(
            range = "all",
            restaurants = RestaurantMetrics(total = 12, active = 11, pendingReview = 1, suspended = 0, branches = 15),
            customers = CustomerMetrics(total = 500, staffMembers = 45, activeDiningSessions = 8),
            operations = OperationsMetrics(totalOrders = 1595, activeCookingTickets = 4, openServiceRequests = 1, openSupportTickets = 2),
            finance = FinanceMetrics(
                grossOrderValue = 484950.0,
                platformCommissionRevenue = 72742.5,
                netRestaurantPayable = 412207.5,
                totalTaxCollected = 24247.5,
                totalDiscounts = 12000.0,
                successfulPayments = 1590,
                failedPayments = 5,
                refundsCount = 2
            )
        )

        assertEquals("all", overview.range)
        assertEquals(12, overview.restaurants?.total)
        assertEquals(11, overview.restaurants?.active)
        assertEquals(72742.5, overview.finance?.platformCommissionRevenue ?: 0.0, 0.01)
        assertEquals(412207.5, overview.finance?.netRestaurantPayable ?: 0.0, 0.01)
    }
}
