// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2026 Xarber
package it.xarber.tvhome;

import java.io.ByteArrayOutputStream;
import java.io.InputStream;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.util.HashMap;
import java.util.Locale;
import java.util.Map;

/** Bounded HTTP/1 request parser shared by the remote and adversarial host tests. */
final class RemoteRequest {
    final String method, path, body;
    private RemoteRequest(String method, String path, String body) { this.method = method; this.path = path; this.body = body; }
    static final class Invalid extends IOException {
        final int status;
        Invalid(int status) { super("Invalid remote request"); this.status = status; }
    }
    static RemoteRequest read(InputStream input, String authority) throws IOException {
        ByteArrayOutputStream head = new ByteArrayOutputStream(); int matched = 0;
        while (matched < 4) {
            if (head.size() >= 8192) throw new Invalid(431);
            int value = input.read(); if (value < 0) throw new Invalid(400); head.write(value);
            if ((matched == 0 || matched == 2) && value == '\r') matched++;
            else if ((matched == 1 || matched == 3) && value == '\n') matched++;
            else matched = value == '\r' ? 1 : 0;
        }
        String[] lines = head.toString(StandardCharsets.ISO_8859_1.name()).split("\r\n");
        String[] first = lines[0].split(" ", -1);
        if (first.length != 3 || !first[2].equals("HTTP/1.1") || !first[1].startsWith("/") || first[1].length() > 256) throw new Invalid(400);
        if (!first[0].equals("GET") && !first[0].equals("POST")) throw new Invalid(405);
        Map<String,String> headers = new HashMap<>();
        for (int i = 1; i < lines.length; i++) {
            int separator = lines[i].indexOf(':');
            if (separator <= 0 || !lines[i].substring(0, separator).matches("[A-Za-z0-9-]+")) throw new Invalid(400);
            String key = lines[i].substring(0, separator).toLowerCase(Locale.ROOT);
            if (headers.put(key, lines[i].substring(separator + 1).trim()) != null) throw new Invalid(400);
        }
        if (!authority.equalsIgnoreCase(headers.get("host"))) throw new Invalid(403);
        String origin = headers.get("origin");
        if (origin != null && !origin.equalsIgnoreCase("http://" + authority)) throw new Invalid(403);
        if (headers.containsKey("transfer-encoding")) throw new Invalid(400);
        String lengthText = headers.getOrDefault("content-length", "0");
        if (!lengthText.matches("[0-9]{1,9}")) throw new Invalid(400);
        int length = Integer.parseInt(lengthText); if (length > 4096) throw new Invalid(413);
        if (first[0].equals("POST") && length > 0 && !headers.getOrDefault("content-type", "").split(";", 2)[0].trim().equalsIgnoreCase("application/json")) throw new Invalid(415);
        byte[] body = new byte[length]; int offset = 0;
        while (offset < length) { int count = input.read(body, offset, length - offset); if (count < 0) throw new Invalid(400); offset += count; }
        return new RemoteRequest(first[0], first[1], new String(body, StandardCharsets.UTF_8));
    }
}
