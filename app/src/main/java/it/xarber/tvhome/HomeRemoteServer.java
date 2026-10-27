// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2026 Xarber
package it.xarber.tvhome;

import android.content.Context;
import java.io.ByteArrayOutputStream;
import java.io.InputStream;
import java.io.OutputStream;
import java.net.InetAddress;
import java.net.ServerSocket;
import java.net.Socket;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.SecureRandom;
import java.util.Locale;
import org.json.JSONObject;

/** Small, pairing-code protected remote UI, active only while MiTV Home is foreground. */
final class HomeRemoteServer implements Runnable {
    interface Commands { void run(String command); }
    private final Context context;
    private final Commands commands;
    private volatile String pin;
    private volatile boolean running = true;
    private final java.util.LinkedHashSet<String> tokens = new java.util.LinkedHashSet<>();
    private volatile long pairingDeadline = System.currentTimeMillis() + 5 * 60 * 1000L;
    private int failedPairAttempts;
    private long pairWindowStart;
    private long lastPairNoticeAt;
    private ServerSocket socket;
    private Thread thread;
    private int port = 80;
    private final java.util.HashMap<String,Long> activeRemotes = new java.util.HashMap<>();
    synchronized boolean hasActiveRemote() { long now=android.os.SystemClock.elapsedRealtime();activeRemotes.entrySet().removeIf(e->now-e.getValue()>15000L);return !activeRemotes.isEmpty(); }

    HomeRemoteServer(Context context, Commands commands) {
        this.context = context.getApplicationContext();
        this.commands = commands;
        rotatePairing();
    }

    String pin() { return pin; }
    int port() { return port; }
    synchronized void rotatePairing() {
        pin = String.format(Locale.US, "%06d", new SecureRandom().nextInt(1_000_000));
        pairingDeadline = System.currentTimeMillis() + 5 * 60 * 1000L;
        failedPairAttempts = 0; pairWindowStart = 0;
    }
    synchronized boolean pairingExpired() { return System.currentTimeMillis() > pairingDeadline; }
    private synchronized void announcePairRequest() {
        long now = System.currentTimeMillis();
        if (pairingExpired()) rotatePairing();
        if (now - lastPairNoticeAt < 3000) return;
        lastPairNoticeAt = now;
        commands.run("pair-request");
    }

    void start() throws Exception {
        try {
            socket = new ServerSocket(80, 8, InetAddress.getByName("0.0.0.0"));
            port = 80;
        } catch (Exception unavailable) {
            android.util.Log.w("MiTVRemote", "Port 80 unavailable; using 8765", unavailable);
            socket = new ServerSocket(8765, 8, InetAddress.getByName("0.0.0.0"));
            port = 8765;
        }
        thread = new Thread(this, "mitv-home-remote");
        thread.setDaemon(true);
        thread.start();
    }

    synchronized void revokeAll() { tokens.clear(); activeRemotes.clear(); rotatePairing(); }

    void stop() {
        running = false;
        revokeAll();
        try { if (socket != null) socket.close(); } catch (Exception ignored) {}
    }

    @Override public void run() {
        while (running) {
            try (Socket client = socket.accept()) {
                client.setSoTimeout(3000);
                handle(client);
            } catch (Exception ignored) { if (!running) return; }
        }
    }

    private void handle(Socket client) throws Exception {
        InetAddress peer = client.getInetAddress();
        if (!(peer.isSiteLocalAddress() || peer.isLinkLocalAddress() || peer.isLoopbackAddress())) {
            respond(client, 403, "text/plain", "local network only"); return;
        }
        String address = client.getLocalAddress().getHostAddress();
        if (address.contains(":")) address = "[" + address + "]";
        String authority = address + (port == 80 ? "" : ":" + port);
        RemoteRequest request;
        try { request = RemoteRequest.read(client.getInputStream(), authority); }
        catch (RemoteRequest.Invalid error) { respond(client, error.status, "text/plain", "Request rejected"); return; }
        String method = request.method, path = request.path, json = request.body;
        if (method.equals("GET") && (path.equals("/") || path.equals("/index.html"))) {
            try (InputStream page = context.getAssets().open("remote.html")) { respond(client, 200, "text/html; charset=utf-8", new String(readAll(page), StandardCharsets.UTF_8)); }
            return;
        }
        if (method.equals("POST") && path.equals("/pair/start")) {
            announcePairRequest();
            respond(client, 200, "application/json", "{\"pairing\":\"pending\"}");
            return;
        }
        if (method.equals("POST") && path.equals("/pair")) {
            announcePairRequest();
            JSONObject payload;
            try { payload = new JSONObject(json); } catch (org.json.JSONException error) { respond(client,400,"application/json","{\"error\":\"Invalid JSON\"}");return; }
            synchronized (this) {
                long now = System.currentTimeMillis();
                if (now - pairWindowStart > 60_000) { pairWindowStart = now; failedPairAttempts = 0; }
                if (now > pairingDeadline) { respond(client, 403, "application/json", "{\"error\":\"Pairing code expired. Show a fresh code on the TV.\"}"); return; }
                if (failedPairAttempts >= 5) { respond(client, 429, "application/json", "{\"error\":\"Too many attempts. Wait a minute and show a fresh code on the TV.\"}"); return; }
                if (!MessageDigest.isEqual(pin.getBytes(StandardCharsets.UTF_8), payload.optString("pin").getBytes(StandardCharsets.UTF_8))) {
                    failedPairAttempts++; respond(client, 403, "application/json", "{\"error\":\"Pairing code is incorrect\"}"); return;
                }
            }
            byte[] secret = new byte[24]; new SecureRandom().nextBytes(secret);
            String token = android.util.Base64.encodeToString(secret, android.util.Base64.NO_WRAP | android.util.Base64.NO_PADDING | android.util.Base64.URL_SAFE);
            synchronized (this) {
                if (tokens.size() >= 16) tokens.remove(tokens.iterator().next());
                tokens.add(token);
                rotatePairing();
            }
            respond(client, 200, "application/json", new JSONObject().put("token", token).toString());
            commands.run("paired");
            return;
        }
        if (method.equals("POST") && (path.equals("/api/key") || path.equals("/api/presence"))) {
            JSONObject payload;
            try { payload = new JSONObject(json); } catch (org.json.JSONException error) { respond(client,400,"application/json","{\"error\":\"Invalid JSON\"}");return; }
            boolean authenticated;
            synchronized (this) { authenticated = tokens.contains(payload.optString("token")); }
            if (!authenticated) {
                respond(client, 401, "application/json", "{\"error\":\"Pair this remote again\"}"); return;
            }
            synchronized (this) {
                String authenticatedToken=payload.optString("token");
                if (path.equals("/api/presence") && payload.optBoolean("disconnect",false)) activeRemotes.remove(authenticatedToken);
                else activeRemotes.put(authenticatedToken,android.os.SystemClock.elapsedRealtime());
            }
            if (path.equals("/api/presence")) { respond(client,200,"application/json","{\"ok\":true}"); return; }
            String command = payload.optString("command", "");
            if (!command.matches("up|down|left|right|ok|back|home|volumeup|volumedown|playpause|next|previous")) {
                respond(client, 400, "application/json", "{\"error\":\"Unknown command\"}"); return;
            }
            commands.run(command);
            respond(client, 200, "application/json", "{\"ok\":true}");
            return;
        }
        respond(client, 404, "text/plain", "not found");
    }

    private static byte[] readAll(InputStream in) throws Exception {
        ByteArrayOutputStream out = new ByteArrayOutputStream();
        byte[] buffer = new byte[2048]; int n;
        while ((n = in.read(buffer)) >= 0) out.write(buffer, 0, n);
        return out.toByteArray();
    }

    private static void respond(Socket client, int status, String type, String body) throws Exception {
        byte[] bytes = body.getBytes(StandardCharsets.UTF_8);
        String reason = status == 200 ? "OK" : status == 400 ? "Bad Request" : status == 401 ? "Unauthorized" : status == 403 ? "Forbidden" : status == 429 ? "Too Many Requests" : status == 404 ? "Not Found" : "Request Rejected";
        OutputStream out = client.getOutputStream();
        out.write(("HTTP/1.1 " + status + " " + reason + "\r\nContent-Type: " + type + "\r\nContent-Length: " + bytes.length + "\r\nCache-Control: no-store\r\nConnection: close\r\nX-Content-Type-Options: nosniff\r\nReferrer-Policy: no-referrer\r\nX-Frame-Options: DENY\r\nContent-Security-Policy: default-src 'none'; script-src 'unsafe-inline'; style-src 'unsafe-inline'; connect-src 'self'; img-src 'self' data:; base-uri 'none'; frame-ancestors 'none'; form-action 'self'\r\n\r\n").getBytes(StandardCharsets.ISO_8859_1));
        out.write(bytes); out.flush();
    }
}
