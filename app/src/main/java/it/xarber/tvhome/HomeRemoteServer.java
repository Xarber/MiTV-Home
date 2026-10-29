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

/** Small, pairing-code protected remote UI, owned by the foreground connected-device service. */
final class HomeRemoteServer implements Runnable {
    interface Commands {
        void run(String command);
        default JSONObject request(String operation,JSONObject payload) throws Exception {if(operation.equals("key")){run(payload.optString("command"));return new JSONObject().put("ok",true);}return SystemRemoteController.error("unsupported");}
    }
    private final Context context;
    private final Commands commands;
    private final it.xarber.tvhome.playback.PairingStore trust;
    private volatile String pin;
    private String pairingOrigin="";
    private final ThreadLocal<String> responseOrigin=new ThreadLocal<>();
    private final String deviceId;
    private volatile boolean running = true;
    private final java.util.LinkedHashMap<String,String> tokens = new java.util.LinkedHashMap<>();
    private volatile long pairingDeadline = android.os.SystemClock.elapsedRealtime() + 5 * 60 * 1000L;
    private int failedPairAttempts;
    private long pairWindowStart;
    private long lastPairNoticeAt;
    private final java.util.Set<Socket> connections=java.util.concurrent.ConcurrentHashMap.newKeySet();
    private final java.util.concurrent.ThreadPoolExecutor workers=new java.util.concurrent.ThreadPoolExecutor(3,3,0,java.util.concurrent.TimeUnit.SECONDS,new java.util.concurrent.ArrayBlockingQueue<>(12),task->{Thread worker=new Thread(task,"AureaRemoteHTTP");worker.setDaemon(true);return worker;});
    private ServerSocket socket;
    private Thread thread;
    private int port = 80;
    private final java.util.HashMap<String,Long> activeRemotes = new java.util.HashMap<>();
    synchronized boolean hasActiveRemote() { long now=android.os.SystemClock.elapsedRealtime();activeRemotes.entrySet().removeIf(e->now-e.getValue()>15000L);return !activeRemotes.isEmpty(); }

    HomeRemoteServer(Context context, Commands commands) throws Exception {
        this.context = context.getApplicationContext();
        this.commands = commands;
        android.content.SharedPreferences identity=this.context.getSharedPreferences("remote-identity",Context.MODE_PRIVATE);
        String existing=identity.getString("id",null);if(existing==null){existing=java.util.UUID.randomUUID().toString();if(!identity.edit().putString("id",existing).commit())throw new IllegalStateException("Identity storage unavailable");}deviceId=existing;
        trust=new it.xarber.tvhome.playback.PairingStore(this.context,"phone-remotes");
        JSONObject stored=trust.read();
        if(stored!=null){org.json.JSONArray values=new org.json.JSONArray(stored.getString("credentials"));if(values.length()>16)throw new IllegalStateException("Invalid trust store");for(int i=0;i<values.length();i++){Object entry=values.get(i);String token=entry instanceof JSONObject?((JSONObject)entry).getString("token"):(String)entry;String origin=entry instanceof JSONObject?((JSONObject)entry).optString("origin",""):"";if(!token.matches("[A-Za-z0-9_-]{32}")||(!origin.isEmpty()&&!RemoteRequest.safeOrigin(origin)))throw new IllegalStateException("Invalid trust store");tokens.put(token,origin);}}
        rotatePairing();
    }

    String pin() { return pin; }
    synchronized String requestingOrigin(){return pairingOrigin;}
    int port() { return port; }
    synchronized void rotatePairing() {
        pairingOrigin="";
        pin = String.format(Locale.US, "%06d", new SecureRandom().nextInt(1_000_000));
        pairingDeadline = android.os.SystemClock.elapsedRealtime() + 5 * 60 * 1000L;
        // Preserve the global attempt window when an origin asks for a fresh PIN.
    }
    synchronized boolean pairingExpired() { return android.os.SystemClock.elapsedRealtime() > pairingDeadline; }
    private synchronized void announcePairRequest() {
        long now = android.os.SystemClock.elapsedRealtime();
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

    synchronized void revokeAll() { tokens.clear(); activeRemotes.clear(); trust.clear(); rotatePairing(); }
    private void persistTrust() throws Exception {trust.save(new JSONObject().put("credentials",trustEntries().toString()).put("identifier","phone-remotes").put("name","Aurea Home"));}

    private org.json.JSONArray trustEntries() throws Exception {org.json.JSONArray entries=new org.json.JSONArray();for(java.util.Map.Entry<String,String> entry:tokens.entrySet())entries.put(new JSONObject().put("token",entry.getKey()).put("origin",entry.getValue()));return entries;}
    void stop() {
        running = false;
        for(Socket client:connections)try{client.close();}catch(Exception ignored){}
        workers.shutdownNow();
        synchronized(this){activeRemotes.clear();}
        try { if (socket != null) socket.close(); } catch (Exception ignored) {}
    }

    @Override public void run() {
        while(running)try{
            Socket client=socket.accept();client.setSoTimeout(3000);connections.add(client);
            try{workers.execute(()->{try(Socket active=client){handle(active);}catch(Exception ignored){}finally{connections.remove(client);responseOrigin.remove();}});}
            catch(java.util.concurrent.RejectedExecutionException busy){connections.remove(client);client.close();}
        }catch(Exception ignored){if(!running)return;}
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
        try { request = RemoteRequest.read(client.getInputStream(), authority,true); }
        catch (RemoteRequest.Invalid error) { respond(client, error.status, "text/plain", "Request rejected"); return; }
        String method = request.method, path = request.path.split("\\?",2)[0], json = request.body;
        String origin=request.origin;
        if(!origin.isEmpty())responseOrigin.set(origin);
        if(method.equals("OPTIONS")){
            boolean allowed=path.equals("/hello")||path.equals("/pair/start")||path.equals("/pair");synchronized(this){allowed|=tokens.containsValue(origin);}
            respond(client,allowed?200:403,"text/plain","");return;
        }
        if(method.equals("POST")&&path.equals("/hello")){respond(client,200,"application/json",new JSONObject().put("schema",1).put("id",deviceId).toString());return;}

        if (method.equals("GET") && (path.equals("/") || path.equals("/index.html"))) {
            String asset="remote.html";try(InputStream probe=context.getAssets().open("remoteapp/index.html")){asset="remoteapp/index.html";}catch(java.io.IOException ignored){}
            try (InputStream page = context.getAssets().open(asset)) { respond(client, 200, "text/html; charset=utf-8", new String(readAll(page), StandardCharsets.UTF_8).replace("<head>","<head><meta name=\"aurea-remote\" content=\"1\">").replace("https://github.com/Xarber/MiTV-Home\"", "https://github.com/Xarber/MiTV-Home/tree/" + io.github.jqssun.airplay.BuildConfig.SOURCE_COMMIT + "\"")); }
            return;
        }
        if(method.equals("GET")&&(path.startsWith("/_expo/")||path.startsWith("/assets/")||path.equals("/favicon.ico")||path.startsWith("/branding/")||path.startsWith("/screenshots/")||path.equals("/manifest.webmanifest")||path.equals("/remote.webmanifest")||path.equals("/sw.js")||path.equals("/release.json"))){
            if(path.contains("..")||!path.matches("/[A-Za-z0-9_./-]+")){respond(client,404,"text/plain","not found");return;}
            try(InputStream asset=context.getAssets().open("remoteapp"+path)){
                String mime=path.endsWith(".webmanifest")?"application/manifest+json":path.endsWith(".json")?"application/json":path.endsWith(".svg")?"image/svg+xml":path.endsWith(".js")?"application/javascript; charset=utf-8":path.endsWith(".css")?"text/css; charset=utf-8":path.endsWith(".png")?"image/png":path.endsWith(".ico")?"image/x-icon":"application/octet-stream";
                respondBytes(client,200,mime,readAll(asset));
            }catch(java.io.IOException missing){respond(client,404,"text/plain","not found");}return;
        }
        if (method.equals("POST") && path.equals("/pair/start")) {
            synchronized(this){if(!pairingOrigin.equals(origin)){rotatePairing();pairingOrigin=origin;}}
            announcePairRequest();
            respond(client, 200, "application/json", "{\"pairing\":\"pending\"}");
            return;
        }
        if (method.equals("POST") && path.equals("/pair")) {
            announcePairRequest();
            JSONObject payload;
            try { payload = new JSONObject(json); } catch (org.json.JSONException error) { respond(client,400,"application/json","{\"error\":\"Invalid JSON\"}");return; }
            synchronized (this) {
                long now = android.os.SystemClock.elapsedRealtime();
                if (now - pairWindowStart > 60_000) { pairWindowStart = now; failedPairAttempts = 0; }
                if (!pairingOrigin.equals(origin)||now > pairingDeadline) { respond(client, 403, "application/json", "{\"error\":\"Pairing code expired. Show a fresh code on the TV.\"}"); return; }
                if (failedPairAttempts >= 5) { respond(client, 429, "application/json", "{\"error\":\"Too many attempts. Wait a minute and show a fresh code on the TV.\"}"); return; }
                if (!MessageDigest.isEqual(pin.getBytes(StandardCharsets.UTF_8), payload.optString("pin").getBytes(StandardCharsets.UTF_8))) {
                    failedPairAttempts++; respond(client, 403, "application/json", "{\"error\":\"Pairing code is incorrect\"}"); return;
                }
            }
            byte[] secret = new byte[24]; new SecureRandom().nextBytes(secret);
            String token = android.util.Base64.encodeToString(secret, android.util.Base64.NO_WRAP | android.util.Base64.NO_PADDING | android.util.Base64.URL_SAFE);
            synchronized (this) {
                java.util.LinkedHashMap<String,String> before=new java.util.LinkedHashMap<>(tokens);
                if (tokens.size() >= 16) tokens.remove(tokens.keySet().iterator().next());
                tokens.put(token,origin);
                try{persistTrust();}catch(Exception unavailable){tokens.clear();tokens.putAll(before);respond(client,500,"application/json","{\"error\":\"storage_failed\"}");return;}
                rotatePairing();
            }
            respond(client, 200, "application/json", new JSONObject().put("token", token).put("id",deviceId).toString());
            commands.run("paired");
            return;
        }
        if (method.equals("POST") && path.startsWith("/api/")) {
            JSONObject payload;
            try { payload = new JSONObject(json); } catch (org.json.JSONException error) { respond(client,400,"application/json","{\"error\":\"Invalid JSON\"}");return; }
            boolean authenticated;
            synchronized (this) { authenticated = tokens.containsKey(payload.optString("token"))&&origin.equals(tokens.get(payload.optString("token"))); }
            if (!authenticated) {
                respond(client, 401, "application/json", "{\"error\":\"Pair this remote again\"}"); return;
            }
            synchronized (this) {
                String authenticatedToken=payload.optString("token");
                if (path.equals("/api/presence") && payload.optBoolean("disconnect",false)) activeRemotes.remove(authenticatedToken);
                else activeRemotes.put(authenticatedToken,android.os.SystemClock.elapsedRealtime());
            }
            if(path.equals("/api/revoke")){
                synchronized(this){String token=payload.optString("token"),binding=tokens.remove(token);try{persistTrust();}catch(Exception unavailable){tokens.put(token,binding);respond(client,500,"application/json","{\"error\":\"storage_failed\"}");return;}activeRemotes.remove(token);}
                respond(client,200,"application/json","{\"ok\":true}");return;
            }
            if (path.equals("/api/presence")) { respond(client,200,"application/json","{\"ok\":true}"); return; }
            if(path.equals("/api/key")&&!RemoteKeys.supported(payload.optString("command"))){respond(client,400,"application/json","{\"error\":\"unsupported\"}");return;}
            java.util.Map<String,String> routes=new java.util.HashMap<>();
            routes.put("/api/key","key");routes.put("/api/state","state");routes.put("/api/catalog","catalog");routes.put("/api/icon","icon");routes.put("/api/artwork","artwork");routes.put("/api/launch","launch");routes.put("/api/media","media");routes.put("/api/system/pair/start","system_pair_begin");routes.put("/api/system/pair/finish","system_pair_finish");
            String operation=routes.get(path);if(operation==null){respond(client,404,"application/json","{\"error\":\"not_found\"}");return;}
            JSONObject result;
            try{result=commands.request(operation,payload);if(operation.equals("state"))result.put("id",deviceId);}catch(Exception unavailable){result=SystemRemoteController.error("unavailable");}
            respond(client,result.has("error")?409:200,"application/json",result.toString());
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

    private String corsHeaders(){String origin=responseOrigin.get();return origin==null?"":"Access-Control-Allow-Origin: "+origin+"\r\nVary: Origin\r\nAccess-Control-Allow-Methods: POST, OPTIONS\r\nAccess-Control-Allow-Headers: Content-Type\r\nAccess-Control-Max-Age: 300\r\n";}
    private void respond(Socket client, int status, String type, String body) throws Exception {
        respondBytes(client,status,type,body.getBytes(StandardCharsets.UTF_8));
    }
    private void respondBytes(Socket client,int status,String type,byte[] bytes) throws Exception {
        String reason = status == 200 ? "OK" : status == 400 ? "Bad Request" : status == 401 ? "Unauthorized" : status == 403 ? "Forbidden" : status == 429 ? "Too Many Requests" : status == 404 ? "Not Found" : "Request Rejected";
        OutputStream out = client.getOutputStream();
        out.write(("HTTP/1.1 " + status + " " + reason + "\r\n" + corsHeaders() + "Content-Type: " + type + "\r\nContent-Length: " + bytes.length + "\r\nCache-Control: no-store\r\nConnection: close\r\nX-Content-Type-Options: nosniff\r\nReferrer-Policy: no-referrer\r\nX-Frame-Options: DENY\r\nContent-Security-Policy: default-src 'none'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; connect-src 'self' http: https:; img-src 'self' data:; font-src 'self' data:; worker-src 'self' blob:; base-uri 'none'; frame-ancestors 'none'; form-action 'self'\r\n\r\n").getBytes(StandardCharsets.ISO_8859_1));
        out.write(bytes); out.flush();
    }
}
