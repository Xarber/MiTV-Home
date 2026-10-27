// SPDX-License-Identifier: AGPL-3.0-only
package it.xarber.tvhome;

import android.app.Dialog;
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
    private final MainActivity host;
    private final PairedPlayback playback;
    private int pairingSession;
    PairedPlaybackPanels(MainActivity host,PairedPlayback playback){this.host=host;this.playback=playback;}
    void show(){
        LinearLayout rows=host.dialog("Paired AirPlay device");
        label(rows,playback.paired()?playback.name():host.tr("No paired device"));
        label(rows,host.tr("Show Apple TV playback and controls in the music activity. Artwork and controls depend on the playing app."));
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
            if(result.has("error")){status.setText(host.tr("Could not connect — try again"));return;}
            JSONArray devices=result.optJSONArray("devices");if(devices==null||devices.length()==0){status.setText(host.tr("No Apple TV found on this network"));return;}
            host.closePanel();LinearLayout choices=host.dialog("Choose Apple TV");
            for(int i=0;i<devices.length();i++){JSONObject device=devices.optJSONObject(i);if(device==null)continue;
                host.addControlIcon(choices,device.optString("name"),"","airplay",()->begin(device.optString("id")));}
            host.addControl(choices,"Cancel","",host::closePanel);host.panel.show();host.focusFirst(choices);
        });
    }
    private void begin(String id){
        pairingSession++;
        LinearLayout rows=host.dialog("Pair Apple TV");TextView status=label(rows,host.tr("Connecting…"));host.panel.show();Dialog expected=host.panel;
        try{playback.request("pair_begin",new JSONObject().put("id",id),result->{if(host.panel!=expected||!expected.isShowing()){cancel();return;}if(result.has("error")){status.setText(host.tr("Could not connect — try again"));host.addControl(rows,"Done","",host::closePanel);host.focusFirst(rows);return;}pin(result.optString("name"));});}catch(Exception ignored){status.setText(host.tr("Could not connect — try again"));}
    }
    private void pin(String name){
        LinearLayout rows=host.dialog("Pair Apple TV");label(rows,name);label(rows,host.tr("Enter the four-digit code shown on your Apple TV. Pairing expires after three minutes."));
        EditText input=new EditText(host);input.setTextColor(MainActivity.WHITE);input.setSingleLine(true);input.setInputType(InputType.TYPE_CLASS_NUMBER|InputType.TYPE_NUMBER_VARIATION_PASSWORD);input.setFilters(new android.text.InputFilter[]{new android.text.InputFilter.LengthFilter(4)});input.setImportantForAutofill(View.IMPORTANT_FOR_AUTOFILL_NO_EXCLUDE_DESCENDANTS);rows.addView(input,host.lp(-1,52));
        TextView status=label(rows,"");host.addControl(rows,"Pair","",()->{
            String value=input.getText().toString();if(!value.matches("[0-9]{4}")){status.setText(host.tr("Enter four digits"));return;}
            status.setText(host.tr("Connecting…"));input.setText("");Dialog expected=host.panel;
            try{playback.request("pair_finish",new JSONObject().put("pin",value),result->{if(host.panel!=expected||!expected.isShowing())return;if(result.has("error")){status.setText(host.tr("Pairing failed — go back and try again"));}else{host.closePanel();show();}});}catch(Exception ignored){status.setText(host.tr("Pairing failed — go back and try again"));}
        });
        host.addControl(rows,"Cancel","",()->{cancel();host.closePanel();});host.panel.show();input.requestFocus();Dialog expected=host.panel;int session=pairingSession;
        host.handler.postDelayed(()->{if(session!=pairingSession)return;cancel();if(host.panel==expected&&expected.isShowing()){input.setText("");host.closePanel();show();}},180000);
    }
    private void cancel(){pairingSession++;playback.request("cancel_pairing",new JSONObject(),result->{});}
    private TextView label(LinearLayout rows,String value){TextView view=host.text(value,13,MainActivity.MUTED);view.setPadding(0,host.dp(6),0,host.dp(8));rows.addView(view,host.lp(-1,-2));return view;}
}
