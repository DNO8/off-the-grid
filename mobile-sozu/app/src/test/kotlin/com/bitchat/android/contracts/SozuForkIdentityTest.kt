package com.bitchat.android.contracts

import com.bitchat.android.BuildConfig
import com.bitchat.android.util.AppConstants
import org.junit.Assert.assertEquals
import org.junit.Assert.assertNotEquals
import org.junit.Test

class SozuForkIdentityTest {
    @Test
    fun `fork identity and protected shutdown channel are separate from upstream`() {
        assertEquals("com.bitchat.droid.sozu", BuildConfig.APPLICATION_ID)
        assertNotEquals("com.bitchat.droid", BuildConfig.APPLICATION_ID)
        assertEquals(
            "com.bitchat.droid.sozu.ACTION_FORCE_FINISH",
            AppConstants.UI.ACTION_FORCE_FINISH
        )
        assertEquals(
            "com.bitchat.droid.sozu.permission.FORCE_FINISH",
            AppConstants.UI.PERMISSION_FORCE_FINISH
        )
        assertNotEquals(
            "com.bitchat.android.permission.FORCE_FINISH",
            AppConstants.UI.PERMISSION_FORCE_FINISH
        )
    }
}
