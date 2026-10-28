buildscript {
    repositories { google(); mavenCentral() }
    dependencies { classpath("com.facebook.react:react-native-gradle-plugin") }
}
plugins {
    id("com.facebook.react.rootproject") apply false
    id("org.jetbrains.kotlin.android") version "2.2.10" apply false
    id("com.chaquo.python") version "17.2.0" apply false
    alias(libs.plugins.android.application) apply false
    alias(libs.plugins.kotlin.compose) apply false
    alias(libs.plugins.ksp) apply false
    alias(libs.plugins.hilt) apply false
}

allprojects {
    repositories { google(); mavenCentral() }
    providers.gradleProperty("localBuildRoot").orNull?.let { base ->
        if (project.path == ":app") layout.buildDirectory.set(file("$base/android/${project.name}"))
    }
}

apply(plugin = "com.facebook.react.rootproject")
apply(plugin = "expo-root-project")
