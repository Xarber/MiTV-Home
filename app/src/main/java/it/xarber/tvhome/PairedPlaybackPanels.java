// SPDX-License-Identifier: AGPL-3.0-only
package it.xarber.tvhome;

import android.app.Dialog;
import android.content.SharedPreferences;
import android.media.tv.TvInputManager;
import android.media.tv.TvInputInfo;
import java.util.ArrayList;
import java.util.Comparator;
import android.text.InputType;
import android.view.View;
import android.widget.EditText;
import android.widget.LinearLayout;
import android.widget.TextView;
import it.xarber.tvhome.playback.PairedPlayback;
import org.json.JSONArray;
import org.json.JSONObject;

/** Uses the shared bounded, frosted, D-pad-scrollable settings surface. */
final class PairedPlaybackPanels {
    private final LegacyHomeActivity host;
    private final PairedPlayback playback;
    private final SharedPreferences preferences;
    PairedPlaybackPanels(LegacyHomeActivity host,PairedPlayback playback){this.host=host;this.playback=playback;preferences=host.getSharedPreferences("paired_device_ui",0);}
    void resumePairing(){if(playback.pairingPending()&&(host.panel==null||!host.panel.isShowing()))pin(playback.pairingName());}
    void show(){
        if(playback.pairingPending()){pin(playback.pairingName());return;}
        LinearLayout rows=host.dialog("Paired AirPlay device");
        label(rows,playback.paired()?playback.name():host.tr("No paired device"));
        label(rows,host.tr("Show Apple TV playback and controls in the music activity. Artwork and controls depend on the playing app."));
        host.addControlIcon(rows,"HDMI input",selectedInputLabel(),"inputs",()->chooseInput(this::show));
        if(playback.storageError())label(rows,host.tr("Saved pairing cannot be read. Remove it and pair again."));
        if(playback.paired())host.addControlIcon(rows,"Remove pairing","","uninstall",()->{playback.unpair();host.closePanel();});
        host.addControlIcon(rows,"Find Apple TV","","airplay",this::scan);
        host.addControl(rows,"Done","",host::closePanel);host.panel.show();host.focusFirst(rows);
    }
    private void scan(){
        LinearLayout rows=host.dialog("Paired AirPlay device");TextView status=label(rows,host.tr("Searching on this network…"));
        host.addControl(rows,"Cancel","",host::closePanel);host.panel.show();Dialog expected=host.panel;
        playback.request("scan",new JSONObject(),result->{
            if(host.panel!=expected||!expected.isShowing())return;
            if(result.has("error")){status.setText(failure(result));return;}
            JSONArray devices=result.optJSONArray("devices");if(devices==null||devices.length()==0){status.setText(host.tr("No Apple TV found on this network"));return;}
            host.closePanel();LinearLayout choices=host.dialog("Choose Apple TV");
            for(int i=0;i<devices.length();i++){JSONObject device=devices.optJSONObject(i);if(device==null)continue;
                host.addControlIcon(choices,device.optString("name"),"","airplay",()->begin(device.optString("id")));}
            host.addControl(choices,"Cancel","",host::closePanel);host.panel.show();host.focusFirst(choices);
        });
    }
    private void begin(String id){
        LinearLayout rows=host.dialog("Pair Apple TV");TextView status=label(rows,host.tr("Connecting…"));host.panel.show();Dialog expected=host.panel;
        try{playback.request("pair_begin",new JSONObject().put("id",id),result->{if(host.panel!=expected||!expected.isShowing()){cancel();return;}if(result.has("error")){status.setText(failure(result));host.addControl(rows,"Done","",host::closePanel);host.focusFirst(rows);return;}pin(result.optString("name"));});}catch(Exception ignored){status.setText(host.tr("Could not connect — try again"));}
    }
    private void pin(String name){
        LinearLayout rows=host.dialog("Pair Apple TV");label(rows,name);label(rows,host.tr("You have three minutes to enter the code. The saved pairing does not expire. Show Apple TV on its HDMI input, note the code, then press Home to return here."));
        EditText input=new EditText(host);input.setTextColor(LegacyHomeActivity.WHITE);input.setSingleLine(true);input.setInputType(InputType.TYPE_CLASS_NUMBER|InputType.TYPE_NUMBER_VARIATION_PASSWORD);input.setFilters(new android.text.InputFilter[]{new android.text.InputFilter.LengthFilter(4)});input.setImportantForAutofill(View.IMPORTANT_FOR_AUTOFILL_NO_EXCLUDE_DESCENDANTS);rows.addView(input,host.lp(-1,52));
        TextView status=label(rows,"");host.addControl(rows,"Pair","",()->{
            String value=input.getText().toString();if(!value.matches("[0-9]{4}")){status.setText(host.tr("Enter four digits"));return;}
            status.setText(host.tr("Connecting…"));input.setText("");Dialog expected=host.panel;
            try{playback.request("pair_finish",new JSONObject().put("pin",value),result->{if(host.panel!=expected||!expected.isShowing())return;if(result.has("error")){status.setText(failure(result));}else{host.closePanel();show();}});}catch(Exception ignored){status.setText(host.tr("Pairing failed — go back and try again"));}
        });
        host.addControlIcon(rows,"Show pairing code",selectedInputLabel(),"inputs",this::showCode);
        host.addControlIcon(rows,"Change HDMI input","Press Home to return and enter the code","inputs",()->chooseInput(()->pin(playback.pairingName())));
        host.addControl(rows,"Cancel","",()->{cancel();host.closePanel();});host.panel.show();input.requestFocus();Dialog expected=host.panel;
        host.handler.postDelayed(()->{if(host.panel==expected&&expected.isShowing()&&!playback.pairingPending()){input.setText("");host.closePanel();show();}},playback.pairingRemaining()+100);
    }
    private ArrayList<LegacyHomeActivity.Entry> registeredInputs(){
        ArrayList<LegacyHomeActivity.Entry> result=new ArrayList<>();
        TvInputManager manager=(TvInputManager)host.getSystemService(android.content.Context.TV_INPUT_SERVICE);
        if(manager==null)return result;
        try{for(TvInputInfo info:manager.getTvInputList()){
            if(info.getType()!=TvInputInfo.TYPE_HDMI||info.getParentId()!=null)continue;
            LegacyHomeActivity.Entry target=null;
            for(LegacyHomeActivity.Entry known:host.sources.values())if(known.inputId.equals(info.getId())){target=known;break;}
            if(target==null){CharSequence custom=info.loadCustomLabel(host),label=custom==null?info.loadLabel(host):custom;
                target=host.action("pairing-input-"+result.size(),label==null?"HDMI":label.toString(),"hdmi",host.hdmiArt);target.inputId=info.getId();}
            result.add(target);
        }}catch(RuntimeException error){result.clear();}
        result.sort(Comparator.comparing((LegacyHomeActivity.Entry input)->input.label));return result;
    }
    private LegacyHomeActivity.Entry selectedInput(){
        String selected=preferences.getString("input_id","");
        for(LegacyHomeActivity.Entry input:registeredInputs())if(!selected.isEmpty()&&selected.equals(input.inputId))return input;
        return null;
    }
    private String selectedInputLabel(){LegacyHomeActivity.Entry input=selectedInput();return input==null?host.tr("Choose HDMI input"):input.label;}
    private void showCode(){
        LegacyHomeActivity.Entry input=selectedInput();
        if(input==null){chooseInput(this::showCode);return;}
        host.closePanel();host.openInput(input);
    }
    private void chooseInput(Runnable selected){
        LinearLayout rows=host.dialog("Choose HDMI input");
        ArrayList<LegacyHomeActivity.Entry> inputs=registeredInputs();String selectedId=preferences.getString("input_id","");
        for(LegacyHomeActivity.Entry input:inputs){if(input.inputId.isEmpty())continue;
            host.addControlIcon(rows,input.label,input.inputId.equals(selectedId)?"✓":"","inputs",()->{preferences.edit().putString("input_id",input.inputId).apply();host.closePanel();selected.run();});}
        if(inputs.isEmpty())label(rows,host.tr("No HDMI inputs registered on this TV"));
        host.addControl(rows,"Cancel","",()->{host.closePanel();if(playback.pairingPending())pin(playback.pairingName());else show();});host.panel.show();host.focusFirst(rows);
    }
    private String failure(JSONObject result){
        String code=result.optString("error");
        switch(code){
            case "authorization_rejected":return host.tr("Apple TV rejected pairing authorization (HTTP 470). The PIN alone may not resolve this tvOS issue.");
            case "http_error":return host.tr("Apple TV returned an error")+" (HTTP "+result.optInt("http_status")+")";
            case "authentication_failed":return host.tr("Apple TV could not verify the pairing code. Start a new attempt.");
            case "timeout":return host.tr("Pairing timed out. Start a new attempt.");
            case "network_error":return host.tr("Connection interrupted during pairing. Check the network and retry.");
            case "receiver_backoff":return host.tr("Apple TV requested a pause. Wait before trying again.");
            case "pairing_expired":return host.tr("The code-entry window expired. Start a new attempt.");
            case "pairing_canceled":return host.tr("Pairing canceled");
            case "storage_failed":return host.tr("Could not securely save the pairing on this TV.");
            case "runtime_unavailable":return host.tr("The pairing engine could not complete this request.");
            case "busy":return host.tr("Another pairing operation is still running.");
            default:return host.tr("Pairing failed — go back and try again");
        }
    }
    private void cancel(){playback.cancelPairing();}
    private TextView label(LinearLayout rows,String value){TextView view=host.text(value,13,LegacyHomeActivity.MUTED);view.setPadding(0,host.dp(6),0,host.dp(8));rows.addView(view,host.lp(-1,-2));return view;}
}
