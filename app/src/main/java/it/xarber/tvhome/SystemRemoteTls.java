// SPDX-License-Identifier: AGPL-3.0-only
package it.xarber.tvhome;

import android.net.LocalServerSocket;
import android.net.LocalSocket;
import android.os.Process;
import android.util.Base64;
import java.io.*;
import java.net.*;
import java.nio.charset.StandardCharsets;
import java.security.*;
import java.security.cert.*;
import java.security.spec.PKCS8EncodedKeySpec;
import java.util.*;
import java.util.concurrent.*;
import javax.net.ssl.*;
import org.json.JSONObject;

/** Platform TLS for the self-hosted v2 client. IPC is random-named and restricted to this UID. */
public final class SystemRemoteTls {
    private final Map<String,Channel> channels=new HashMap<>();
    private final ExecutorService workers=Executors.newFixedThreadPool(4);
    private boolean closed;
    private static final class Channel {
        final SSLSocket remote;final LocalServerSocket server;volatile LocalSocket local;
        Channel(SSLSocket remote,LocalServerSocket server){this.remote=remote;this.server=server;}
        void close(){try{server.close();}catch(IOException ignored){}try{remote.close();}catch(IOException ignored){}try{if(local!=null)local.close();}catch(IOException ignored){}}
    }
    public synchronized String open(String host,int port,String certificate,String privateKey)throws Exception{
        if(closed||channels.size()>=2)throw new IOException("tls_busy");
        if(port!=6466&&port!=6467)throw new SecurityException("invalid_endpoint");
        InetAddress address=InetAddress.getByName(host);
        if(!address.isLoopbackAddress()&&NetworkInterface.getByInetAddress(address)==null)throw new SecurityException("self_only");
        byte[] certBytes=pem(certificate),keyBytes=pem(privateKey);
        X509Certificate cert=(X509Certificate)CertificateFactory.getInstance("X.509").generateCertificate(new ByteArrayInputStream(certBytes));
        PrivateKey key=KeyFactory.getInstance("RSA").generatePrivate(new PKCS8EncodedKeySpec(keyBytes));Arrays.fill(keyBytes,(byte)0);
        KeyStore store=KeyStore.getInstance(KeyStore.getDefaultType());store.load(null,null);store.setKeyEntry("remote",key,new char[0],new java.security.cert.Certificate[]{cert});
        KeyManagerFactory manager=KeyManagerFactory.getInstance(KeyManagerFactory.getDefaultAlgorithm());manager.init(store,new char[0]);
        // Android TV uses a self-signed service certificate. Pairing authenticates its RSA key,
        // matching the pinned upstream v2 client's certificate-exchange trust model.
        X509TrustManager trust=new X509TrustManager(){public void checkClientTrusted(X509Certificate[] c,String a){}public void checkServerTrusted(X509Certificate[] c,String a)throws CertificateException{if(c==null||c.length==0)throw new CertificateException("missing_peer");}public X509Certificate[] getAcceptedIssuers(){return new X509Certificate[0];}};
        SSLContext context=SSLContext.getInstance("TLS");context.init(manager.getKeyManagers(),new TrustManager[]{trust},null);
        SSLSocket remote=(SSLSocket)context.getSocketFactory().createSocket();LocalServerSocket server=null;
        try{
            List<String> protocols=new ArrayList<>();for(String p:remote.getSupportedProtocols())if(p.equals("TLSv1.2")||p.equals("TLSv1.3"))protocols.add(p);
            remote.setEnabledProtocols(protocols.toArray(new String[0]));remote.connect(new InetSocketAddress(address,port),5000);remote.setSoTimeout(5000);remote.startHandshake();remote.setSoTimeout(0);
            String name="aurea-system-"+UUID.randomUUID();server=new LocalServerSocket(name);Channel channel=new Channel(remote,server);channels.put(name,channel);
            workers.execute(()->relay(name,channel));
            return new JSONObject().put("socket",name).put("certificate",Base64.encodeToString(remote.getSession().getPeerCertificates()[0].getEncoded(),Base64.NO_WRAP)).put("protocol",remote.getSession().getProtocol()).toString();
        }catch(Exception error){try{remote.close();}catch(IOException ignored){}if(server!=null)try{server.close();}catch(IOException ignored){}
            StringBuilder details=new StringBuilder();Throwable cause=error;for(int depth=0;depth<8&&cause!=null;depth++,cause=cause.getCause())if(cause.getMessage()!=null)details.append(cause.getMessage()).append(' ');
            String message=details.toString().toUpperCase(Locale.ROOT);
            String alert="unknown";
            for(String candidate:new String[]{"CERTIFICATE_UNKNOWN","UNKNOWN_CA","BAD_CERTIFICATE","CERTIFICATE_EXPIRED","CERTIFICATE_REQUIRED","HANDSHAKE_FAILURE","PROTOCOL_VERSION","UNSUPPORTED_CERTIFICATE","NO_SHARED_CIPHER","CONNECTION RESET"})if(message.contains(candidate)){alert=candidate.toLowerCase(Locale.ROOT).replace(' ','_');break;}
            boolean untrusted=message.contains("CERTIFICATE_UNKNOWN")||message.contains("CERTIFICATE UNKNOWN")||message.contains("BAD_CERTIFICATE");
            return new JSONObject().put("error",untrusted?"authentication_failed":"system_tls_failed").put("failureClass",error.getClass().getSimpleName()).put("tlsAlert",alert).toString();}
    }
    private void relay(String name,Channel channel){
        try{
            channel.local=channel.server.accept();channel.server.close();
            if(channel.local.getPeerCredentials().getUid()!=Process.myUid())throw new SecurityException("wrong_uid");
            workers.execute(()->{try{copy(channel.remote.getInputStream(),channel.local.getOutputStream());}catch(Exception ignored){}finally{close(name);}});
            copy(channel.local.getInputStream(),channel.remote.getOutputStream());
        }catch(Exception ignored){}finally{close(name);}
    }
    private static void copy(InputStream input,OutputStream output)throws IOException{byte[] buffer=new byte[16384];try{int n;while((n=input.read(buffer))!=-1){output.write(buffer,0,n);output.flush();}}finally{Arrays.fill(buffer,(byte)0);}}
    private static byte[] pem(String value){return Base64.decode(value.replaceAll("-----[A-Z ]+-----", "").replaceAll("\\s", ""),Base64.DEFAULT);}
    public synchronized void close(String name){Channel channel=channels.remove(name);if(channel!=null)channel.close();}
    synchronized void shutdown(){closed=true;for(Channel channel:channels.values())channel.close();channels.clear();workers.shutdownNow();}
}
