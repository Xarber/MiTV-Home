pluginManagement {
    includeBuild("node_modules/@react-native/gradle-plugin")
    includeBuild("node_modules/expo-modules-autolinking/android/expo-gradle-plugin")
    repositories { google(); mavenCentral(); gradlePluginPortal() }
}
plugins {
    id("com.facebook.react.settings")
    id("expo-autolinking-settings")
}
val expoLinking = extensions.getByType<expo.modules.plugin.ExpoAutolinkingSettingsExtension>()
expoLinking.projectRoot = rootDir
extensions.configure<com.facebook.react.ReactSettingsExtension> {
    autolinkLibrariesFromCommand(expoLinking.rnConfigCommand + listOf("--source-dir", rootDir.absolutePath), rootDir, files("package.json", "package-lock.json", "react-native.config.js"))
}
expoLinking.useExpoModules()
expoLinking.useExpoVersionCatalog()
@Suppress("UnstableApiUsage")
dependencyResolutionManagement {
    repositoriesMode.set(RepositoriesMode.PREFER_PROJECT)
    repositories { google(); mavenCentral() }
}
rootProject.name = "AureaHome"
include(":app")

includeBuild(expoLinking.reactNativeGradlePlugin)
