// SPDX-License-Identifier: AGPL-3.0-only
package it.xarber.tvhome.playback;

import android.content.Context;
import android.security.keystore.KeyGenParameterSpec;
import android.security.keystore.KeyProperties;
import android.util.AtomicFile;
import java.io.File;
import java.io.FileOutputStream;
import java.nio.charset.StandardCharsets;
import java.security.KeyStore;
import javax.crypto.Cipher;
import javax.crypto.KeyGenerator;
import javax.crypto.SecretKey;
import javax.crypto.spec.GCMParameterSpec;
import org.json.JSONObject;

/** Device-bound credentials, deliberately outside Android backups and portable preferences. */
public final class PairingStore {
    private static final String ALIAS="mitv.paired-apple-tv.v1";
    private final Context context;
    private final AtomicFile file;
    public PairingStore(Context context){this.context=context.getApplicationContext();file=new AtomicFile(new File(context.getNoBackupFilesDir(),"paired-apple-tv.enc"));}
    private SecretKey key() throws Exception {
        KeyStore store=KeyStore.getInstance("AndroidKeyStore");store.load(null);
        if(store.containsAlias(ALIAS))return (SecretKey)store.getKey(ALIAS,null);
        KeyGenerator generator=KeyGenerator.getInstance(KeyProperties.KEY_ALGORITHM_AES,"AndroidKeyStore");
        generator.init(new KeyGenParameterSpec.Builder(ALIAS,KeyProperties.PURPOSE_ENCRYPT|KeyProperties.PURPOSE_DECRYPT)
            .setBlockModes(KeyProperties.BLOCK_MODE_GCM).setEncryptionPaddings(KeyProperties.ENCRYPTION_PADDING_NONE).setRandomizedEncryptionRequired(true).build());
        return generator.generateKey();
    }
    public synchronized void save(JSONObject pairing) throws Exception {
        String credentials=pairing.getString("credentials"),identifier=pairing.getString("identifier"),name=pairing.getString("name");
        if(credentials.isEmpty()||credentials.length()>8192||identifier.isEmpty()||identifier.length()>1024||name.length()>256)throw new IllegalArgumentException("Invalid pairing");
        JSONObject value=new JSONObject().put("credentials",credentials).put("identifier",identifier).put("name",name);
        Cipher cipher=Cipher.getInstance("AES/GCM/NoPadding");cipher.init(Cipher.ENCRYPT_MODE,key());cipher.updateAAD(context.getPackageName().getBytes(StandardCharsets.UTF_8));
        byte[] encrypted=cipher.doFinal(value.toString().getBytes(StandardCharsets.UTF_8));
        FileOutputStream stream=file.startWrite();try{stream.write(cipher.getIV());stream.write(encrypted);file.finishWrite(stream);}catch(Exception error){file.failWrite(stream);throw error;}
    }
    public synchronized JSONObject read() throws Exception {
        if(!file.getBaseFile().exists())return null;
        if(file.getBaseFile().length()>16384)throw new IllegalStateException("Invalid encrypted pairing");
        byte[] bytes=file.readFully();if(bytes.length<28)throw new IllegalStateException("Invalid encrypted pairing");
        Cipher cipher=Cipher.getInstance("AES/GCM/NoPadding");cipher.init(Cipher.DECRYPT_MODE,key(),new GCMParameterSpec(128,bytes,0,12));cipher.updateAAD(context.getPackageName().getBytes(StandardCharsets.UTF_8));
        return new JSONObject(new String(cipher.doFinal(bytes,12,bytes.length-12),StandardCharsets.UTF_8));
    }
    public synchronized void clear(){file.delete();}
}
