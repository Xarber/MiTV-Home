// SPDX-License-Identifier: AGPL-3.0-only
package it.xarber.tvhome;
import it.xarber.tvhome.diagnostics.DeveloperSession;
import java.io.ByteArrayInputStream;
import java.nio.charset.StandardCharsets;

public final class HostChecks {
    static long now;
    static void check(boolean condition, String name) { if (!condition) throw new AssertionError(name); }
    static RemoteRequest parse(String request) throws Exception { return RemoteRequest.read(new ByteArrayInputStream(request.getBytes(StandardCharsets.UTF_8)), "192.168.1.101:8765"); }
    static void reject(String headers, int expected) throws Exception {
        try { parse(headers); throw new AssertionError("Accepted malicious request"); }
        catch (RemoteRequest.Invalid error) { check(error.status == expected, "status " + error.status + " expected " + expected); }
    }
    public static void main(String[] args) throws Exception {
        DeveloperSession access = new DeveloperSession(() -> now);
        check(!access.isUnlocked(), "locked by default"); access.tapVersion(); access.tapVersion(); check(access.tapVersion(), "triple click");
        now = 29999; access.interact(); now += 29999; check(access.isUnlocked(), "interaction extends access"); now++; check(!access.isUnlocked(), "expires at 30s");
        access.tapVersion(); now += 4001; access.tapVersion(); check(!access.isUnlocked(), "tap gap resets"); access.tapVersion(); check(access.tapVersion(), "new triple"); access.lock(); check(!access.isUnlocked(), "tab/background lock");
        String head = "POST /api/key HTTP/1.1\r\nHost: 192.168.1.101:8765\r\n";
        check(parse(head+"Content-Type: application/json\r\nContent-Length: 2\r\n\r\n{}").body.equals("{}"), "valid JSON transport");
        reject(head+"Content-Length: -1\r\n\r\n",400);
        reject(head+"Content-Length: 5000\r\n\r\n",413);
        reject(head+"Content-Length: 2\r\nContent-Length: 2\r\n\r\n{}",400);
        reject(head+"Transfer-Encoding: chunked\r\n\r\n",400);
        reject(head+"Origin: http://evil.example\r\n\r\n",403);
        reject("GET / HTTP/1.1\r\nHost: evil.example\r\n\r\n",403);
        reject(head+"Content-Type: text/plain\r\nContent-Length: 2\r\n\r\n{}",415);
        reject(head+"Content-Type: application/json\r\nContent-Length: 3\r\n\r\n{}",400);
        reject(head+"X-Fill: "+"x".repeat(8192)+"\r\n\r\n",431);
        System.out.println("PASS: developer lifecycle and remote hostile-request checks");
    }
}
