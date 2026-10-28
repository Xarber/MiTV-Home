// SPDX-License-Identifier: AGPL-3.0-only
package io.github.jqssun.airplay

import android.app.Application
import android.content.res.Configuration
import com.facebook.react.PackageList
import com.facebook.react.ReactApplication
import com.facebook.react.ReactHost
import com.facebook.react.ReactNativeApplicationEntryPoint.loadReactNative
import com.facebook.react.common.ReleaseLevel
import com.facebook.react.defaults.DefaultNewArchitectureEntryPoint
import dagger.hilt.android.HiltAndroidApp
import expo.modules.ApplicationLifecycleDispatcher
import expo.modules.ExpoReactHostFactory

@HiltAndroidApp
class AirPlayApp : Application(), ReactApplication {
    override val reactHost: ReactHost by lazy {
        ExpoReactHostFactory.getDefaultReactHost(context = applicationContext, packageList = PackageList(this).packages.apply { add(it.xarber.tvhome.AureaTVPackage()) }, useDevSupport = BuildConfig.DEBUG)
    }
    override fun attachBaseContext(base: android.content.Context) { super.attachBaseContext(it.xarber.tvhome.AppLanguage.wrap(base)) }
    override fun onCreate() { super.onCreate(); DefaultNewArchitectureEntryPoint.releaseLevel = ReleaseLevel.STABLE; loadReactNative(this); ApplicationLifecycleDispatcher.onApplicationCreate(this) }
    override fun onConfigurationChanged(configuration: Configuration) { super.onConfigurationChanged(configuration); ApplicationLifecycleDispatcher.onConfigurationChanged(this, configuration) }
}
