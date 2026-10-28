package io.github.jqssun.airplay.discovery

import android.content.Context
import android.net.ConnectivityManager
import android.net.Network
import android.os.Handler
import android.os.Looper
import android.net.nsd.NsdManager
import android.net.nsd.NsdServiceInfo
import android.net.wifi.WifiManager
import android.util.Log

data class MdnsService(val name: String, val type: String, val port: Int, val txt: Map<String, String>)

class NsdServiceManager(private val ctx: Context) {

    private val nsdManager = ctx.getSystemService(Context.NSD_SERVICE) as NsdManager
    private var multicastLock: WifiManager.MulticastLock? = null
    private val registrations = mutableListOf<NsdManager.RegistrationListener>()

    fun acquireMulticastLock() {
        val wifi = ctx.applicationContext.getSystemService(Context.WIFI_SERVICE) as WifiManager
        multicastLock = wifi.createMulticastLock("airplay_mdns").apply {
            setReferenceCounted(false)
            acquire()
        }
    }

    private val handler = Handler(Looper.getMainLooper())
    private val connectivity = ctx.getSystemService(ConnectivityManager::class.java)
    private var services: List<MdnsService> = emptyList()
    private var watching = false
    private var released = false
    private var lastNetwork: Network? = connectivity.activeNetwork
    private val refresh = Runnable {
        if (!released && connectivity.activeNetwork != null) {
            unregister()
            services.forEach(::_register)
        }
    }
    private val networkCallback = object : ConnectivityManager.NetworkCallback() {
        override fun onAvailable(network: Network) { handler.post {
            if (!released && network != lastNetwork) {
                lastNetwork = network
                handler.removeCallbacks(refresh)
                handler.postDelayed(refresh, 1500)
            }
        } }
        override fun onLost(network: Network) { handler.post {
            if (network == lastNetwork) lastNetwork = null
        } }
    }
    fun register(services: List<MdnsService>) {
        this.services = services.toList()
        services.forEach(::_register)
        if (!watching) try {
            connectivity.registerDefaultNetworkCallback(networkCallback)
            watching = true
        } catch (_: SecurityException) { Log.w(TAG, "Network discovery recovery unavailable") }
    }

    private fun _register(s: MdnsService) {
        val info = NsdServiceInfo().apply {
            serviceName = s.name
            serviceType = s.type
            port = s.port
            s.txt.forEach { (k, v) -> setAttribute(k, v) }
            // Identify the software receiver without changing Apple's compatibility model.
            if (s.type.startsWith("_airplay.")) setAttribute("mitvhome", "receiver-v1")
        }
        val listener = object : NsdManager.RegistrationListener {
            override fun onServiceRegistered(info: NsdServiceInfo) {
                Log.i(TAG, "${s.type} registered: ${info.serviceName}")
            }
            override fun onRegistrationFailed(info: NsdServiceInfo, code: Int) {
                Log.e(TAG, "${s.type} registration failed: $code")
            }
            override fun onServiceUnregistered(info: NsdServiceInfo) {
                Log.i(TAG, "${s.type} unregistered")
            }
            override fun onUnregistrationFailed(info: NsdServiceInfo, code: Int) {
                Log.e(TAG, "${s.type} unregister failed: $code")
            }
        }
        nsdManager.registerService(info, NsdManager.PROTOCOL_DNS_SD, listener)
        registrations += listener
    }

    private fun unregister() {
        registrations.forEach {
            try { nsdManager.unregisterService(it) } catch (_: Exception) {}
        }
        registrations.clear()
    }
    fun release() {
        released = true
        handler.removeCallbacksAndMessages(null)
        if (watching) try { connectivity.unregisterNetworkCallback(networkCallback) } catch (_: Exception) {}
        watching = false
        unregister()
        multicastLock?.release()
        multicastLock = null
    }

    companion object {
        private const val TAG = "NsdServiceManager"
    }
}
