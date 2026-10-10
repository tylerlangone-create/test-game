package com.weedhaze.screensaver

import android.content.Context
import android.graphics.BlurMaskFilter
import android.graphics.Canvas
import android.graphics.LinearGradient
import android.graphics.Matrix
import android.graphics.Paint
import android.graphics.Path
import android.graphics.RadialGradient
import android.graphics.Shader
import android.text.format.DateFormat
import android.view.View
import java.util.Calendar
import kotlin.math.max
import kotlin.math.min
import kotlin.math.sin
import kotlin.random.Random

/**
 * Purple-haze Daydream scene: a slowly pulsing leaf centerpiece, drifting
 * leaf particles, rising smoke tendrils, and a clock. Everything is drawn
 * procedurally (no bitmap assets) so leaves stay crisp at any screen size.
 */
class WeedHazeView(context: Context) : View(context) {

    private var running = false
    private var startTimeNanos = 0L

    private val backgroundPaint = Paint()
    private val glowPaint = Paint(Paint.ANTI_ALIAS_FLAG)
    private val leafPaint = Paint(Paint.ANTI_ALIAS_FLAG)
    private val centerpiecePaint = Paint(Paint.ANTI_ALIAS_FLAG)
    private val smokePaint = Paint(Paint.ANTI_ALIAS_FLAG).apply {
        maskFilter = BlurMaskFilter(24f, BlurMaskFilter.Blur.NORMAL)
    }
    private val clockPaint = Paint(Paint.ANTI_ALIAS_FLAG).apply {
        color = 0xFFE6D6FF.toInt()
        textAlign = Paint.Align.CENTER
        isFakeBoldText = true
    }
    private val datePaint = Paint(Paint.ANTI_ALIAS_FLAG).apply {
        color = 0x99E6D6FF.toInt()
        textAlign = Paint.Align.CENTER
    }

    private val leaves = mutableListOf<LeafParticle>()
    private val smokeTendrils = mutableListOf<SmokeTendril>()
    private val calendar = Calendar.getInstance()

    private val frameTick = object : Runnable {
        override fun run() {
            if (!running) return
            invalidate()
            postOnAnimationDelayed(this, FRAME_DELAY_MS)
        }
    }

    fun start() {
        if (running) return
        running = true
        startTimeNanos = System.nanoTime()
        postOnAnimationDelayed(frameTick, FRAME_DELAY_MS)
    }

    fun stop() {
        running = false
        removeCallbacks(frameTick)
    }

    override fun onSizeChanged(w: Int, h: Int, oldW: Int, oldH: Int) {
        super.onSizeChanged(w, h, oldW, oldH)
        if (w <= 0 || h <= 0) return
        initParticles(w, h)
    }

    private fun initParticles(w: Int, h: Int) {
        leaves.clear()
        val leafCount = 16
        repeat(leafCount) {
            leaves.add(LeafParticle.random(w, h))
        }

        smokeTendrils.clear()
        val tendrilCount = 5
        repeat(tendrilCount) { i ->
            smokeTendrils.add(SmokeTendril.random(w, h, i))
        }
    }

    override fun onDraw(canvas: Canvas) {
        val w = width
        val h = height
        if (w <= 0 || h <= 0) return

        val t = (System.nanoTime() - startTimeNanos) / 1_000_000_000f

        drawBackground(canvas, w, h, t)
        drawSmoke(canvas, w, h, t)
        drawLeaves(canvas, w, h, t)
        drawCenterpiece(canvas, w, h, t)
        drawClock(canvas, w, h)
    }

    private fun drawBackground(canvas: Canvas, w: Int, h: Int, t: Float) {
        backgroundPaint.shader = LinearGradient(
            0f, 0f, 0f, h.toFloat(),
            0xFF2A1348.toInt(), 0xFF05030A.toInt(),
            Shader.TileMode.CLAMP
        )
        canvas.drawRect(0f, 0f, w.toFloat(), h.toFloat(), backgroundPaint)

        // Slow-breathing purple glow behind the centerpiece.
        val pulse = 0.5f + 0.5f * sin(t * 0.5f)
        val cx = w / 2f
        val cy = h * 0.38f
        val radius = min(w, h) * (0.45f + 0.08f * pulse)
        glowPaint.shader = RadialGradient(
            cx, cy, radius,
            0x55B388FF, 0x00000000,
            Shader.TileMode.CLAMP
        )
        canvas.drawRect(0f, 0f, w.toFloat(), h.toFloat(), glowPaint)
    }

    private fun drawSmoke(canvas: Canvas, w: Int, h: Int, t: Float) {
        for (tendril in smokeTendrils) {
            tendril.update(h, t)
            smokePaint.color = tendril.color
            canvas.drawPath(tendril.buildPath(w, t), smokePaint)
        }
    }

    private fun drawLeaves(canvas: Canvas, w: Int, h: Int, t: Float) {
        for (leaf in leaves) {
            leaf.update(h, t)
            leafPaint.color = leaf.color
            canvas.save()
            canvas.translate(leaf.x, leaf.y)
            canvas.rotate(leaf.rotationDeg(t))
            canvas.scale(leaf.scale, leaf.scale)
            canvas.drawPath(LEAF_PATH, leafPaint)
            canvas.restore()
        }
    }

    private fun drawCenterpiece(canvas: Canvas, w: Int, h: Int, t: Float) {
        val cx = w / 2f
        val cy = h * 0.38f
        val breath = 1f + 0.08f * sin(t * 0.6f)
        val size = min(w, h) * 0.17f * breath

        centerpiecePaint.maskFilter = BlurMaskFilter(18f, BlurMaskFilter.Blur.NORMAL)
        centerpiecePaint.color = 0x66C9A6FF
        canvas.save()
        canvas.translate(cx, cy)
        canvas.scale(size, size)
        canvas.drawPath(LEAF_PATH, centerpiecePaint)
        canvas.restore()

        centerpiecePaint.maskFilter = null
        centerpiecePaint.color = 0xFF57E08A.toInt()
        canvas.save()
        canvas.translate(cx, cy)
        canvas.scale(size, size)
        canvas.drawPath(LEAF_PATH, centerpiecePaint)
        canvas.restore()
    }

    private fun drawClock(canvas: Canvas, w: Int, h: Int) {
        calendar.timeInMillis = System.currentTimeMillis()
        val timeText = DateFormat.format(
            if (DateFormat.is24HourFormat(context)) "HH:mm" else "h:mm", calendar
        ).toString()
        val dateText = DateFormat.format("EEEE, MMMM d", calendar).toString()

        clockPaint.textSize = h * 0.11f
        datePaint.textSize = h * 0.032f

        val cx = w / 2f
        val clockY = h * 0.78f
        canvas.drawText(timeText, cx, clockY, clockPaint)
        canvas.drawText(dateText, cx, clockY + datePaint.textSize * 1.8f, datePaint)
    }

    private class LeafParticle(
        var x: Float,
        var y: Float,
        private val depth: Float,
        private val swayAmplitude: Float,
        private val swaySpeed: Float,
        private val rotationSpeed: Float,
        private val baseRotation: Float,
        val scale: Float,
        val color: Int,
        private val baseX: Float
    ) {
        private val riseSpeed = 14f * depth

        fun update(h: Int, t: Float) {
            y -= riseSpeed * FRAME_DELAY_MS / 1000f
            if (y < -60f) {
                y = h + 60f
            }
            x = baseX + sin(t * swaySpeed) * swayAmplitude
        }

        fun rotationDeg(t: Float): Float = baseRotation + t * rotationSpeed

        companion object {
            fun random(w: Int, h: Int): LeafParticle {
                val depth = Random.nextFloat() * 0.8f + 0.3f
                val scale = (10f + depth * 14f)
                val alpha = (90 + depth * 120).toInt().coerceIn(0, 255)
                val green = (190 + Random.nextInt(-20, 25)).coerceIn(0, 255)
                val color = (alpha shl 24) or (0x30 shl 16) or (green shl 8) or 0x6E
                val baseX = Random.nextFloat() * w
                return LeafParticle(
                    x = baseX,
                    y = Random.nextFloat() * h,
                    depth = depth,
                    swayAmplitude = 10f + Random.nextFloat() * 20f,
                    swaySpeed = 0.2f + Random.nextFloat() * 0.3f,
                    rotationSpeed = (Random.nextFloat() - 0.5f) * 12f,
                    baseRotation = Random.nextFloat() * 360f,
                    scale = scale,
                    color = color,
                    baseX = baseX
                )
            }
        }
    }

    private class SmokeTendril(
        private val baseX: Float,
        private var y: Float,
        private val width: Float,
        private val speed: Float,
        private val waveSpeed: Float,
        private val waveAmplitude: Float,
        val color: Int
    ) {
        fun update(h: Int, t: Float) {
            y -= speed * FRAME_DELAY_MS / 1000f
            if (y < -h * 0.3f) {
                y = h * 1.1f
            }
        }

        fun buildPath(w: Int, t: Float): Path {
            val path = Path()
            val segments = 24
            val length = width * 6f
            var prevX = baseX
            var prevY = y
            path.moveTo(prevX, prevY)
            for (i in 1..segments) {
                val fraction = i / segments.toFloat()
                val segY = y - length * fraction
                val wobble = sin(t * waveSpeed + fraction * 6f) * waveAmplitude * fraction
                val segX = baseX + wobble
                path.quadTo(prevX, prevY, (prevX + segX) / 2f, (prevY + segY) / 2f)
                prevX = segX
                prevY = segY
            }
            return path
        }

        companion object {
            fun random(w: Int, h: Int, index: Int): SmokeTendril {
                val baseX = w * (0.2f + 0.6f * (index / 4f)) + Random.nextFloat() * 40f - 20f
                return SmokeTendril(
                    baseX = baseX,
                    y = Random.nextFloat() * h,
                    width = 22f + Random.nextFloat() * 18f,
                    speed = 10f + Random.nextFloat() * 8f,
                    waveSpeed = 0.3f + Random.nextFloat() * 0.4f,
                    waveAmplitude = 18f + Random.nextFloat() * 14f,
                    color = 0x22E8D9FF
                )
            }
        }
    }

    companion object {
        private const val FRAME_DELAY_MS = 33L // ~30fps, plenty smooth for a screensaver, kinder on battery.

        /** One stylized 5-leaflet cannabis leaf, centered at (0,0), pointing up, unit-scaled to ~1px. */
        private val LEAF_PATH: Path = buildLeafPath()

        private fun buildLeaflet(length: Float, halfWidth: Float): Path {
            val p = Path()
            p.moveTo(0f, 0f)
            p.cubicTo(halfWidth, -length * 0.25f, halfWidth * 0.6f, -length * 0.75f, 0f, -length)
            p.cubicTo(-halfWidth * 0.6f, -length * 0.75f, -halfWidth, -length * 0.25f, 0f, 0f)
            p.close()
            return p
        }

        private fun buildLeafPath(): Path {
            val full = Path()
            val leaflets = listOf(
                0f to 1.0f,
                25f to 0.85f, -25f to 0.85f,
                50f to 0.65f, -50f to 0.65f
            )
            for ((angleDeg, lenFactor) in leaflets) {
                val leaflet = buildLeaflet(lenFactor, 0.16f * max(lenFactor, 0.5f))
                val m = Matrix()
                m.postRotate(angleDeg)
                leaflet.transform(m)
                full.addPath(leaflet)
            }
            return full
        }
    }
}
