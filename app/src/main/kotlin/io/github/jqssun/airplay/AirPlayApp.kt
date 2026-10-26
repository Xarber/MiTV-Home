package io.github.jqssun.airplay

import android.app.Application
import dagger.hilt.android.HiltAndroidApp

@HiltAndroidApp
class AirPlayApp : Application() {
    override fun attachBaseContext(base: android.content.Context) { super.attachBaseContext(it.xarber.tvhome.AppLanguage.wrap(base)) }
}
