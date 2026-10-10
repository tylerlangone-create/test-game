package com.weedhaze.screensaver

import android.app.Activity
import android.content.ActivityNotFoundException
import android.content.Intent
import android.os.Bundle
import android.provider.Settings
import android.widget.Toast

/**
 * Jumps straight to the system "Screen saver" picker so the user can pick
 * Weed Haze from the list, since dreams have no UI of their own to launch into.
 */
class MainActivity : Activity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        try {
            startActivity(Intent(Settings.ACTION_DREAM_SETTINGS))
        } catch (e: ActivityNotFoundException) {
            Toast.makeText(
                this,
                "Open Settings > Display > Screen saver and pick Weed Haze",
                Toast.LENGTH_LONG
            ).show()
        }
        finish()
    }
}
