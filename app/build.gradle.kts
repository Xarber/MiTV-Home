plugins {
    id("org.jetbrains.kotlin.android")
    id("com.facebook.react")
    id("com.chaquo.python")
    alias(libs.plugins.android.application)
    alias(libs.plugins.kotlin.compose)
    alias(libs.plugins.ksp)
    alias(libs.plugins.hilt)
}

import java.util.Properties
import java.time.Instant

val localProps = Properties().apply {
    rootProject.file("local.properties").takeIf { it.exists() }?.inputStream()?.use(::load)
}

listOf("storeFile" to "MITV_STORE_FILE", "storePassword" to "MITV_STORE_PASSWORD", "keyAlias" to "MITV_KEY_ALIAS", "keyPassword" to "MITV_KEY_PASSWORD").forEach { (property, variable) ->
    providers.environmentVariable(variable).orNull?.let { localProps.setProperty(property, it) }
}

fun gitValue(vararg args: String): String = try {
    val process = ProcessBuilder("git", *args).directory(rootDir).redirectErrorStream(true).start()
    val result = process.inputStream.bufferedReader().readText().trim()
    if (process.waitFor() == 0) result else "unknown"
} catch (_: Exception) { "unknown" }
fun buildString(value: String): String = "\"" + value.replace("\\", "\\\\").replace("\"", "\\\"").replace("\n", " ").replace("\r", " ") + "\""
val archivedSource = Properties().apply {
    rootProject.file("source-build.properties").takeIf { it.exists() }?.inputStream()?.use(::load)
}
val sourceCommit = providers.environmentVariable("GITHUB_SHA").getOrElse(archivedSource.getProperty("commit", gitValue("rev-parse", "HEAD")))
val buildChannel = providers.environmentVariable("MITV_BUILD_CHANNEL").getOrElse(archivedSource.getProperty("channel", gitValue("branch", "--show-current")))
val buildEpoch = providers.environmentVariable("SOURCE_DATE_EPOCH").orNull ?: archivedSource.getProperty("epoch", gitValue("show", "-s", "--format=%ct", "HEAD"))
val buildDate = buildEpoch.toLongOrNull()?.let { Instant.ofEpochSecond(it).toString() } ?: "unknown"
val mobileRemote = project.hasProperty("mobileRemote")
val allAbis = if (project.hasProperty("useBundledNative")) providers.gradleProperty("reactNativeArchitectures").orNull?.split(",")?.filter { it == "arm64-v8a" || it == "armeabi-v7a" }?.also { require(it.isNotEmpty()) } ?: listOf("arm64-v8a", "armeabi-v7a")
    else listOf("arm64-v8a", "armeabi-v7a", "x86", "x86_64")

android {
    namespace = "io.github.jqssun.airplay"
    // Full source builds must not also package historical prebuilt media binaries.
    sourceSets.getByName("main").jniLibs.setSrcDirs(emptyList<String>())
    sourceSets.getByName("main").java.srcDir(layout.buildDirectory.dir("generated/autolinking/src/main/java").get().asFile)
    compileSdk = 37
    ndkVersion = "27.0.12077973"

    // Keep Expo's _expo asset directory; retain the other AGP 9.4 defaults.
    androidResources {
        ignoreAssetsPatterns += listOf("!.svn", "!.git", "!.ds_store", "!*.scc", ".*", "!CVS", "!thumbs.db", "!picasa.ini", "!*~")
    }

    if (localProps.containsKey("storeFile")) {
        signingConfigs {
            create("release") {
                storeFile = file(localProps.getProperty("storeFile"))
                storePassword = localProps.getProperty("storePassword")
                keyAlias = localProps.getProperty("keyAlias")
                keyPassword = localProps.getProperty("keyPassword")
            }
        }
    }

    defaultConfig {
        // Chaquopy reads supported architectures from defaultConfig.
        ndk { abiFilters += allAbis }
        applicationId = providers.gradleProperty("homeApplicationId").getOrElse("it.xarber.mitvhome")
        minSdk = 26
        targetSdk = 34
        manifestPlaceholders["homeSecondaryCategory"] = if (mobileRemote) "android.intent.category.DEFAULT" else "android.intent.category.LEANBACK_LAUNCHER"
        manifestPlaceholders["homeCategory"] = if (mobileRemote) "android.intent.category.LAUNCHER" else "android.intent.category.HOME"
        manifestPlaceholders["homeOrientation"] = if (mobileRemote) "unspecified" else "landscape"
        manifestPlaceholders["homeLabel"] = if (mobileRemote) "Aurea Remote" else "Aurea Home"
        manifestPlaceholders["homeExcludeRecents"] = if (mobileRemote) "false" else "true"
        buildConfigField("boolean", "MOBILE_REMOTE", mobileRemote.toString())
        versionCode = 27
        versionName = "2.0.1"
        buildConfigField("String", "SOURCE_COMMIT", buildString(sourceCommit))
        buildConfigField("String", "BUILD_CHANNEL", buildString(buildChannel))
        buildConfigField("String", "BUILD_DATE", buildString(buildDate))
        buildConfigField("String", "BUILD_VARIANT", buildString("github-extended"))
        buildConfigField("String", "UPDATE_CHANNEL", buildString(if (buildChannel in listOf("beta", "testing")) "beta" else "stable"))

        externalNativeBuild {
            cmake {
                arguments += "-DANDROID_STL=c++_shared"
                arguments += "-DANDROID_SUPPORT_FLEXIBLE_PAGE_SIZES=ON"
            }
        }
    }

    if (project.hasProperty("useBundledNative")) {
        providers.gradleProperty("bundledNativeRoot").orNull?.let { nativeRoot ->
            sourceSets.getByName("main").jniLibs.setSrcDirs(listOf(file(nativeRoot)))
        }
    }
    externalNativeBuild {
        cmake {
            path = file("src/main/jni/CMakeLists.txt")
        }
    }
    defaultConfig.externalNativeBuild.cmake.arguments += "-DAUREA_BUNDLED_MEDIA=" + if (project.hasProperty("useBundledNative")) "ON" else "OFF"

    buildTypes {
        release {
            isMinifyEnabled = true
            proguardFiles(getDefaultProguardFile("proguard-android-optimize.txt"), "proguard-rules.pro")
            signingConfigs.findByName("release")?.let { signingConfig = it }
        }
        // debuggable build with HWASan (arm64) + UBSan in native code
        create("sanitize") {
            initWith(getByName("debug"))
            matchingFallbacks += "debug"
            ndk {
                abiFilters.clear()
                abiFilters += "arm64-v8a"
            }
            externalNativeBuild {
                cmake { arguments += "-DSANITIZE=ON" }
            }
        }
    }

    dependenciesInfo {
        includeInApk = false
        includeInBundle = false
    }

    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }

    buildFeatures {
        compose = true
        prefab = true
        buildConfig = true
    }
}

// Generate ignored assets before merging Android resources. This also works from release source archives.
val generateHomeBuildInfo = tasks.register("generateHomeBuildInfo") {
    inputs.property("commit", sourceCommit)
    inputs.property("channel", buildChannel)
    inputs.property("date", buildDate)
    inputs.file(rootProject.file("app/src/main/assets/release-history.json"))
    outputs.files(file("src/main/assets/build-metadata.json"), file("src/main/assets/developer-changelog.txt"))
    doLast {
        file("src/main/assets/build-metadata.json").writeText("""
            {"version":"2.0.1","code":27,"commit":${buildString(sourceCommit)},"channel":${buildString(buildChannel)},"variant":"github-extended","date":${buildString(buildDate)}}
        """.trimIndent()+"\n")
        val history = gitValue("log", "--reverse", "--format=%H %ad %s%n%b", "--date=short", "98cbd64^..HEAD")
        val historyFile = file("src/main/assets/developer-changelog.txt")
        if (history != "unknown") historyFile.writeText("MiTV Home developer history\nLegacy subjects are retained verbatim.\n\n"+history+"\n")
        else if (!historyFile.exists()) historyFile.writeText("Source commit: $sourceCommit\nSee CHANGELOG.md and corresponding release source.\n")
    }
}
tasks.named("preBuild").configure { dependsOn(generateHomeBuildInfo) }

tasks.register("applyUxplayPatches") {
    doLast {
        fun git(vararg args: String): Pair<Int, String> {
            val proc = ProcessBuilder("git", "-C", "$projectDir/src/main/cpp/third_party/UxPlay", *args)
                .redirectErrorStream(true).start()
            val out = proc.inputStream.bufferedReader().readText()
            return proc.waitFor() to out
        }
        val patches = file("src/main/cpp/patches/UxPlay").listFiles { f -> f.extension == "patch" }!!.sorted()
        val source = file("src/main/cpp/third_party/UxPlay")
        if (source.resolve(".git").exists()) {
            // Only reset files owned by the checked-in patch series in this pinned dependency.
            val touched = patches.flatMap { git("apply", "--numstat", it.path).also { result -> check(result.first == 0) { result.second } }.second.trim().lines() }
                .map { it.substringAfterLast("\t") }.distinct()
            git("checkout", "--", *touched.toTypedArray()).also { check(it.first == 0) { it.second } }
        }
        patches.forEach { patch ->
            if (git("apply", "--reverse", "--check", "--unidiff-zero", patch.path).first != 0) {
                git("apply", "--unidiff-zero", patch.path).also { check(it.first == 0) { it.second } }
            }
        }
    }
}

tasks.configureEach {
    if (name.startsWith("configureCMake")) dependsOn("applyUxplayPatches")
}

dependencies {
    implementation("com.google.zxing:core:3.5.4")
    implementation(libs.androidx.core.ktx)
    implementation(libs.androidx.activity.compose)
    implementation(libs.androidx.lifecycle.runtime)
    implementation(libs.androidx.lifecycle.service)
    implementation(libs.androidx.lifecycle.viewmodel)
    implementation(libs.androidx.datastore.prefs)
    implementation(libs.androidx.media)
    implementation(libs.media3.exoplayer)
    implementation(libs.media3.exoplayer.hls)
    implementation(libs.media3.ui.compose.material3)
    implementation(libs.media3.transformer)
    implementation(libs.kotlinx.coroutines)
    implementation(libs.oboe)

    implementation(platform(libs.compose.bom))
    implementation(libs.compose.ui)
    implementation(libs.compose.ui.graphics)
    implementation(libs.compose.ui.tooling.preview)
    implementation(libs.compose.material3)
    implementation(libs.compose.material.icons)
    debugImplementation(libs.compose.ui.tooling)

    implementation(libs.hilt.android)
    ksp(libs.hilt.compiler)
    implementation(libs.hilt.navigation.compose)
}

// Python 3.11 retains the physical MiTV ARMv7 ABI. Native wheels are built by
// the pinned Linux cross-build job, never substituted with desktop wheels.
chaquopy {
    defaultConfig {
        version = "3.11"
        pip {
            install(rootProject.file("build/apple-tv-wheels/pyatv-0.18.0-py3-none-any.whl").absolutePath)
            install("pydantic==2.14.1")
            install("cryptography==50.0.2")
            install("srptools==2.0.0")
            install("androidtvremote2==0.3.2")
            install("aiofiles==25.1.0")
            options("--find-links", rootProject.file("build/apple-tv-wheels").absolutePath)
        }
    }
}

react {
    root.set(rootDir)
    entryFile.set(rootProject.file("index.ts"))
    reactNativeDir.set(rootProject.file("node_modules/react-native"))
    codegenDir.set(rootProject.file("node_modules/@react-native/codegen"))
    cliFile.set(file(providers.exec {
        workingDir(rootDir)
        commandLine("node", "--print", "require.resolve('@expo/cli', { paths: [require.resolve('expo/package.json')] })")
    }.standardOutput.asText.get().trim()))
    bundleCommand.set("export:embed")
    autolinkLibrariesWithApp()
}
dependencies {
    implementation("com.facebook.react:react-android")
    implementation("com.facebook.react:hermes-android")
}
