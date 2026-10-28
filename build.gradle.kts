plugins {
    id("com.chaquo.python") version "17.2.0" apply false
    alias(libs.plugins.android.application) apply false
    alias(libs.plugins.kotlin.compose) apply false
    alias(libs.plugins.ksp) apply false
    alias(libs.plugins.hilt) apply false
}

allprojects {
    providers.gradleProperty("localBuildRoot").orNull?.let { base ->
        layout.buildDirectory.set(file("$base/${project.name}"))
    }
}
