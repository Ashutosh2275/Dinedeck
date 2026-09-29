package com.dinedeck.partner

import com.dinedeck.partner.data.*
import org.junit.Assert.*
import org.junit.Test

class PartnerAppUnitTest {

    @Test
    fun testKitchenOrderStateTransition() {
        val order = PartnerOrder(
            id = "DD-9621",
            orderNumber = "ORD-9621",
            tableNumber = "12",
            items = listOf(
                PartnerOrderItem(
                    id = "item_1",
                    name = "Angaari Paneer Tikka (Jumbo)",
                    quantity = 1,
                    unitPrice = 340.0,
                    totalPrice = 340.0
                )
            ),
            totalAmount = 509.20,
            status = "CONFIRMED"
        )

        assertEquals("CONFIRMED", order.status)
        assertEquals("12", order.tableNumber)

        val preparing = order.copy(status = "PREPARING")
        assertEquals("PREPARING", preparing.status)

        val ready = preparing.copy(status = "READY")
        assertEquals("READY", ready.status)

        val served = ready.copy(status = "SERVED")
        assertEquals("SERVED", served.status)
    }

    @Test
    fun testServiceCallResolution() {
        val calls = mutableListOf(
            PartnerServiceCall(id = "sc_1", tableNumber = "12", requestType = "WAITER", status = "PENDING"),
            PartnerServiceCall(id = "sc_2", tableNumber = "04", requestType = "WATER", status = "PENDING")
        )

        assertEquals(2, calls.size)
        calls.removeIf { it.id == "sc_1" }
        assertEquals(1, calls.size)
        assertEquals("sc_2", calls[0].id)
    }

    @Test
    fun testMultiTenantIsolationDataModels() {
        val tenantA = PartnerRestaurant(
            id = "rest_punjab_heritage",
            name = "The Punjab Heritage Kitchen",
            city = "Mumbai",
            rating = 4.9
        )

        val tenantB = PartnerRestaurant(
            id = "rest_grand_peshawari",
            name = "Grand Peshawari Grill",
            city = "Pune",
            rating = 4.8
        )

        assertNotEquals(tenantA.id, tenantB.id)
        assertNotEquals(tenantA.name, tenantB.name)
    }

    @Test
    fun testStaffIamRoleAndScopeEvaluation() {
        val staff = PartnerStaffMember(
            id = "user_waiter_1",
            name = "Ramesh Sharma",
            email = "waiter.ramesh@punjabheritage.in",
            designation = "Captain / Waiter",
            isActive = true,
            roles = listOf(
                PartnerUserRoleInfo(
                    roleId = "WAITER",
                    roleName = "Steward / Waiter",
                    scopes = listOf(
                        PartnerScope(type = "TABLE", value = "1,2,3,4"),
                        PartnerScope(type = "FLOOR", value = "Ground Floor")
                    )
                )
            ),
            overrides = listOf(
                PartnerPermissionOverride(permissionId = "menu.availability.update", isGranted = true),
                PartnerPermissionOverride(permissionId = "billing.discount", isGranted = false)
            )
        )

        assertEquals("WAITER", staff.roles[0].roleId)
        val tableScope = staff.roles[0].scopes.find { it.type == "TABLE" }
        assertNotNull(tableScope)
        assertTrue(tableScope!!.value.contains("1") && tableScope.value.contains("4"))

        val discountOverride = staff.overrides.find { it.permissionId == "billing.discount" }
        assertNotNull(discountOverride)
        assertFalse(discountOverride!!.isGranted)
    }

    @Test
    fun testMenuItemStockAvailabilityToggle() {
        val item = PartnerMenuItem(

            id = "item_paneer_tikka",
            name = "Angaari Paneer Tikka",
            price = 340.0,
            isAvailable = true
        )

        assertTrue(item.isAvailable)
        val toggled = item.copy(isAvailable = false)
        assertFalse(toggled.isAvailable)
    }

    @Test
    fun testTableOccupancyToggle() {
        val table = PartnerTable(
            id = "table_12",
            tableNumber = "12",
            capacity = 4,
            isOccupied = false
        )

        assertFalse(table.isOccupied)
        val occupied = table.copy(isOccupied = true)
        assertTrue(occupied.isOccupied)
    }
}
