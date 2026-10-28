// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2026 Xarber
package it.xarber.tvhome.updates;
import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;

/** Explicit, non-exported PackageInstaller result callback; never handles arbitrary installer intents. */
public final class UpdateInstallReceiver extends BroadcastReceiver {
    @Override public void onReceive(Context context,Intent intent){
        if((context.getPackageName()+".UPDATE_INSTALL_RESULT").equals(intent.getAction()))UpdateController.get(context).installationResult(intent);
    }
}
