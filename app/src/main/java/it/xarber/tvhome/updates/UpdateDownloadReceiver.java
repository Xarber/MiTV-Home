// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2026 Xarber
package it.xarber.tvhome.updates;
import android.app.DownloadManager;
import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;

/** A completion broadcast only triggers verification; it can never initiate installation. */
public final class UpdateDownloadReceiver extends BroadcastReceiver {
    @Override public void onReceive(Context context,Intent intent){
        UpdateController updates=UpdateController.get(context);
        if(DownloadManager.ACTION_DOWNLOAD_COMPLETE.equals(intent.getAction())&&intent.getLongExtra(DownloadManager.EXTRA_DOWNLOAD_ID,-2)==updates.downloadId())updates.refreshDownload();
    }
}
