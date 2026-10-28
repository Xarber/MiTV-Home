// SPDX-License-Identifier: AGPL-3.0-only
package it.xarber.tvhome.updates;
public final class UpdatePolicyChecks {
    private static final String SIGNER="a".repeat(64);
    private static void check(boolean value,String name){if(!value)throw new AssertionError(name);}
    private static boolean accept(long installed,long offered,String channel,String release,String variant,int sdk,String signer){return UpdatePolicy.accepts(installed,offered,channel,release,"github-extended",variant,sdk,26,SIGNER,signer);}
    public static void main(String[] args){
        check(accept(16,17,"stable","stable","github-extended",29,SIGNER),"new stable");
        check(accept(16,17,"beta","beta","github-extended",29,SIGNER),"new beta");
        check(accept(16,17,"beta","stable","github-extended",29,SIGNER),"beta may accept stable");
        check(!accept(16,17,"stable","beta","github-extended",29,SIGNER),"stable rejects beta");
        check(!accept(17,17,"stable","stable","github-extended",29,SIGNER),"same build rejected");
        check(!accept(17,16,"beta","beta","github-extended",29,SIGNER),"downgrade rejected");
        check(!accept(16,17,"beta","beta","store",29,SIGNER),"variant rejected");
        check(!accept(16,17,"beta","beta","github-extended",25,SIGNER),"incompatible SDK rejected");
        check(!accept(16,17,"beta","beta","github-extended",29,"b".repeat(64)),"wrong signer rejected");
        String tag="v1.6.0-beta.17.0123456",prefix="https://github.com/Xarber/MiTV-Home/releases/download/"+tag+"/";
        check(UpdatePolicy.assetUrl(prefix+"MiTV-Home-v1.6.0-android-universal-beta-github-extended-0123456.apk",tag),"owned universal asset");
        for(String url:new String[]{prefix+"app.aab",prefix+"app.apk",prefix+"../android-universal-a.apk",prefix+"%2e%2e/android-universal-a.apk",prefix.replace("https:","http:")+"android-universal-a.apk",prefix.replace("github.com/","github.com.evil.example/")+"android-universal-a.apk",prefix+"android-universal-a.apk?token=bad"})check(!UpdatePolicy.assetUrl(url,tag),"hostile artifact rejected");
        check(UpdatePolicy.manifestUrl(prefix+"update-manifest.json",tag),"owned metadata");
        check(!UpdatePolicy.manifestUrl(prefix+"update-manifest.json","sources-v1.0"),"metadata release rejected");
        System.out.println("PASS: updater channels, versions, signer, SDK, variant and artifact URL rules");
    }
}
