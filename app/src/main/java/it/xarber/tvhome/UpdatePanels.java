// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2026 Xarber
package it.xarber.tvhome;

import android.widget.LinearLayout;
import android.widget.TextView;
import io.github.jqssun.airplay.BuildConfig;
import it.xarber.tvhome.updates.UpdateController;
import it.xarber.tvhome.updates.UpdateCandidate;
import java.text.DateFormat;
import java.util.Date;

/** Existing frosted TV controls and release cards; updates never replace notes with a progress-only view. */
final class UpdatePanels {
    private final MainActivity host;
    private final UpdateController updates;
    private TextView status,progress,action;
    UpdatePanels(MainActivity host,UpdateController updates){this.host=host;this.updates=updates;}
    void showSettings(){
        LinearLayout rows=host.dialog("Updates");
        label(rows,"Aurea Home "+BuildConfig.VERSION_NAME+" · "+BuildConfig.VERSION_CODE+"\n"+host.tr("Release channel")+": "+host.tr(updates.channel.equals("beta")?"Beta":"Stable"));
        status=label(rows,"");progress=label(rows,"");
        host.addControlIcon(rows,"Check for Updates","","history",()->updates.check(true));
        toggle(rows,"Automatic update checks","auto_check",updates.autoCheck());
        toggle(rows,"Automatic downloads","auto_download",updates.autoDownload());
        toggle(rows,"Unmetered downloads only","unmetered",updates.unmeteredOnly());
        host.addControlIcon(rows,"View latest release notes","","info",()->{if(updates.candidate!=null)showOffer();else{host.closePanel();host.showChangelog(false);}});
        if(updates.managedStore())host.addControlIcon(rows,"Open app store","","apps",updates::openStore);
        if(updates.downloadId()>=0)host.addControlIcon(rows,"Cancel download","","uninstall",updates::cancel);
        host.addControlIcon(rows,"Full changelog","","history",()->{host.closePanel();host.showChangelog(false);});
        host.addControl(rows,"Done","",host::closePanel);action=null;refresh();host.panel.show();host.focusFirst(rows);
    }
    private void toggle(LinearLayout rows,String title,String key,boolean enabled){host.addControlIcon(rows,title,host.tr(enabled?"On":"Off"),"controls",()->{updates.toggle(key);showSettings();});}
    void showOffer(){
        UpdateCandidate offer=updates.candidate;if(offer==null){showSettings();return;}
        LinearLayout rows=host.dialog("Aurea Home "+offer.version);
        if(offer.critical)label(rows,host.tr("Security-critical update"));
        label(rows,host.tr("Download size")+": "+size(offer.size));status=label(rows,"");progress=label(rows,"");
        host.addControlIcon(rows,updates.ready?"Install update":"Update Now","","transfer",()->{if(updates.ready)updates.install();else updates.download();});
        action=(TextView)rows.getChildAt(rows.getChildCount()-1);
        ReleasePanels.appendRelease(host,rows,offer.notes);
        host.addControlIcon(rows,"Full changelog","","history",()->{host.closePanel();host.showChangelog(false);});
        host.addControl(rows,"Cancel download","",updates::cancel);host.addControl(rows,"Later","",host::closePanel);
        refresh();host.panel.show();host.focusFirst(rows);
    }
    void refresh(){
        if(status==null||!status.isAttachedToWindow()&&host.panel==null)return;
        String checked=updates.lastSuccess()>0?DateFormat.getDateTimeInstance(DateFormat.SHORT,DateFormat.SHORT).format(new Date(updates.lastSuccess())):host.tr("Never checked");
        status.setText(host.tr(updates.status)+"\n"+host.tr("Last successful check")+": "+checked+(updates.stale?"\n"+host.tr("Cached — not a current check"):""));
        if(updates.downloadId()>=0){String amount=size(Math.max(0,updates.downloaded));if(updates.total>0)amount+=" / "+size(updates.total)+" · "+size(Math.max(0,updates.total-updates.downloaded))+" "+host.tr("remaining");if(updates.speed>0)amount+="\n"+size(updates.speed)+"/s";progress.setText(amount);}else progress.setText("");
        if(action!=null){action.setText(host.tr(updates.ready?"Install update":"Update Now"));action.setEnabled(!updates.verifying&&!updates.installing);}
    }
    private TextView label(LinearLayout rows,String value){TextView view=host.text(value,13,MainActivity.MUTED);view.setLineSpacing(host.dp(3),1);view.setPadding(0,host.dp(5),0,host.dp(5));rows.addView(view,host.lp(-1,-2));return view;}
    private String size(long bytes){return android.text.format.Formatter.formatFileSize(host,bytes);}
}
