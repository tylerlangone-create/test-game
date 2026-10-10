package com.weedhaze.screensaver

import android.service.dreams.DreamService
import android.view.View

class WeedDreamService : DreamService() {

    private lateinit var hazeView: WeedHazeView

    override fun onAttachedToWindow() {
        super.onAttachedToWindow()

        isInteractive = false
        isFullscreen = true
        isScreenBright = false

        hazeView = WeedHazeView(this)
        // Needed so BlurMaskFilter (smoke + glow) actually renders instead of being silently dropped.
        hazeView.setLayerType(View.LAYER_TYPE_SOFTWARE, null)
        setContentView(hazeView)
    }

    override fun onDreamingStarted() {
        super.onDreamingStarted()
        hazeView.start()
    }

    override fun onDreamingStopped() {
        hazeView.stop()
        super.onDreamingStopped()
    }

    override fun onDetachedFromWindow() {
        hazeView.stop()
        super.onDetachedFromWindow()
    }
}
